"""
Smart Satellite Pipeline Scheduler.

Job queue processor with three modes:
- --hourly: Process boundary_update and manual jobs only
- --daily: Check imagery availability + process all pending jobs
- --single farm-id: Ad-hoc trigger for testing
- --smart: Auto-select mode based on farm staleness (daily if farms need check, hourly otherwise)
- --loop: Run continuously, executing --smart mode on configurable interval (default 4h)

Usage:
    python scheduler.py --hourly     # Process user-triggered jobs (one-time)
    python scheduler.py --daily      # Full daily run with imagery check (one-time)
    python scheduler.py --single farm-1  # Process single farm
    python scheduler.py --smart      # Auto-select based on staleness (one-time)
    python scheduler.py --loop       # Run continuously (for Docker, default 4h interval)
"""
import argparse
import logging
import os
import sys
import time
from datetime import datetime
from typing import Optional

# Load environment variables from .env.local if available
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    pass

from config import FarmConfig, create_farm_config_from_convex, load_env_config
from pipeline import run_pipeline_for_farm
from imagery_checker import check_new_imagery_available

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Max processing time limits (in seconds)
MAX_HOURLY_PROCESSING_TIME = 30 * 60  # 30 minutes
MAX_DAILY_PROCESSING_TIME = 60 * 60   # 60 minutes
JOB_TIMEOUT = 10 * 60  # 10 minutes per job


class Scheduler:
    """
    Smart satellite pipeline scheduler.

    Processes jobs from the queue based on mode:
    - hourly: Only process boundary_update and manual jobs
    - daily: Check for new imagery, then process all pending jobs
    """

    def __init__(self):
        self.convex = ConvexClient()
        self.pipeline_config = load_env_config()
        self.pipeline_config.write_to_convex = True

    def run_hourly(self) -> int:
        """
        Hourly mode: Process boundary_update and manual jobs only.

        Returns:
            Number of jobs processed
        """
        start_time = time.time()
        logger.info("=== Running Hourly Mode ===")
        logger.info(f"Max processing time: {MAX_HOURLY_PROCESSING_TIME // 60} minutes")
        logger.info("Processing boundary_update and manual jobs only")

        processed = 0

        # Process boundary_update jobs (highest priority)
        boundary_jobs = self.convex.get_pending_jobs(limit=10, triggered_by='boundary_update')
        logger.info(f"Found {len(boundary_jobs)} boundary_update jobs")
        processed += self._process_jobs(boundary_jobs, start_time, MAX_HOURLY_PROCESSING_TIME)

        # Check if we still have time for manual jobs
        elapsed = time.time() - start_time
        if elapsed >= MAX_HOURLY_PROCESSING_TIME:
            logger.warning(f"Reached max processing time ({elapsed:.0f}s), stopping")
            logger.info(f"=== Hourly Mode Complete: {processed} jobs processed ===")
            return processed

        # Process manual jobs
        manual_jobs = self.convex.get_pending_jobs(limit=10, triggered_by='manual')
        logger.info(f"Found {len(manual_jobs)} manual jobs")
        processed += self._process_jobs(manual_jobs, start_time, MAX_HOURLY_PROCESSING_TIME)

        elapsed = time.time() - start_time
        logger.info(f"=== Hourly Mode Complete: {processed} jobs processed in {elapsed:.0f}s ===")
        return processed

    def run_daily(self) -> int:
        """
        Daily mode: Check imagery availability, create jobs for new data,
        then process all pending jobs.

        Returns:
            Number of jobs processed
        """
        start_time = time.time()
        logger.info("=== Running Daily Mode ===")
        logger.info(f"Max processing time: {MAX_DAILY_PROCESSING_TIME // 60} minutes")

        # Step 1: Check imagery availability for farms not checked in 24h
        logger.info("Step 1: Checking imagery availability...")
        self._check_imagery_for_all_farms()

        # Check if we have time remaining
        elapsed = time.time() - start_time
        if elapsed >= MAX_DAILY_PROCESSING_TIME:
            logger.warning(f"Reached max processing time after imagery check ({elapsed:.0f}s), stopping")
            logger.info("=== Daily Mode Complete: 0 jobs processed ===")
            return 0

        # Step 2: Process all pending jobs (boundary + manual + scheduled)
        logger.info("Step 2: Processing all pending jobs...")
        all_jobs = self.convex.get_pending_jobs(limit=50)
        logger.info(f"Found {len(all_jobs)} total pending jobs")
        processed = self._process_jobs(all_jobs, start_time, MAX_DAILY_PROCESSING_TIME)

        elapsed = time.time() - start_time
        logger.info(f"=== Daily Mode Complete: {processed} jobs processed in {elapsed:.0f}s ===")
        return processed

    def run_single(self, farm_external_id: str) -> bool:
        """
        Process a single farm immediately (for testing).

        Args:
            farm_external_id: Farm to process

        Returns:
            True if successful
        """
        logger.info(f"=== Running Single Farm Mode: {farm_external_id} ===")

        # Create a manual job for this farm
        job_id = self.convex.create_manual_job(farm_external_id)
        logger.info(f"Created manual job: {job_id}")

        # Claim and process it
        job = self.convex.claim_job(job_id)
        if not job:
            logger.error("Failed to claim job")
            return False

        success = self._process_single_job(job)
        logger.info(f"=== Single Farm Mode Complete: {'success' if success else 'failed'} ===")
        return success

    def run_smart(self) -> dict:
        """
        Smart mode: Auto-select based on farm staleness.
        If any farms need imagery checks (not checked in 24h), run daily mode.
        Otherwise run hourly mode to process boundary/manual jobs.

        Returns:
            Dict with mode, farms_checked, and jobs_processed
        """
        farms_needing_check = self.convex.get_farms_needing_imagery_check()

        if farms_needing_check:
            logger.info(f"Smart mode: {len(farms_needing_check)} farms need imagery check, running daily mode")
            processed = self.run_daily()
            return {"mode": "daily", "farms_checked": len(farms_needing_check), "jobs_processed": processed}
        else:
            logger.info("Smart mode: all farms recently checked, running hourly mode")
            processed = self.run_hourly()
            return {"mode": "hourly", "farms_checked": 0, "jobs_processed": processed}

    def _ensure_farm_settings_exist(self, farm_external_id: str):
        """
        Ensure a farmSettings row exists for the given farm.
        If missing, calls updateImageryCheckTime with an ancient timestamp
        so the farm appears in getFarmsNeedingImageryCheck results.
        """
        settings = self.convex.get_settings(farm_external_id)
        if settings is not None:
            logger.info(f"Pre-flight: farmSettings already exists for {farm_external_id}")
            return

        logger.info(f"Pre-flight: creating farmSettings for {farm_external_id}")
        self.convex.update_imagery_check_time(
            farm_external_id=farm_external_id,
            check_timestamp="2000-01-01T00:00:00.000Z",
        )
        logger.info(f"Pre-flight: farmSettings created for {farm_external_id}")

    def run_loop(self):
        """
        Loop mode: Run continuously, executing smart mode on a configurable interval.
        Designed for Docker deployments.

        Interval controlled by SCHEDULER_LOOP_INTERVAL_HOURS env var (default: 4).
        """
        interval_hours = float(os.environ.get("SCHEDULER_LOOP_INTERVAL_HOURS", "4"))
        interval_seconds = interval_hours * 3600

        logger.info("=== Starting Loop Mode ===")
        logger.info(f"Loop interval: {interval_hours} hours ({interval_seconds:.0f}s)")

        # Pre-flight: ensure demo farm has settings so it's visible to the scheduler
        try:
            self._ensure_farm_settings_exist("farm-1")
        except Exception as e:
            logger.error(f"Pre-flight farm settings check failed: {e}", exc_info=True)

        while True:
            try:
                logger.info("--- Starting scheduled run ---")
                result = self.run_smart()
                logger.info("--- Scheduled run complete ---")
                logger.info(
                    f"PIPELINE_STATUS: mode={result['mode']}, "
                    f"farms_checked={result['farms_checked']}, "
                    f"jobs_processed={result['jobs_processed']}"
                )
            except Exception as e:
                logger.error(f"Error in scheduled run: {e}", exc_info=True)
                logger.info("PIPELINE_STATUS: mode=error, farms_checked=0, jobs_processed=0")

            logger.info(f"Sleeping for {interval_hours} hours until next run...")
            time.sleep(interval_seconds)

    def _check_imagery_for_all_farms(self):
        """Check imagery availability for all farms that need it."""
        farms_to_check = self.convex.get_farms_needing_imagery_check()
        logger.info(f"Found {len(farms_to_check)} farms needing imagery check")

        for farm_info in farms_to_check:
            farm_id = farm_info['farmExternalId']
            last_date = farm_info.get('lastNewImageryDate')

            try:
                logger.info(f"Checking imagery for farm {farm_id}...")

                # Get farm geometry for the check
                farm_data = self.convex.get_farm(farm_id)
                if not farm_data:
                    logger.warning(f"  Farm {farm_id} not found, skipping")
                    continue

                # Check for new imagery
                has_new, latest_date = check_new_imagery_available(
                    farm_geometry=farm_data.get('geometry', {}),
                    last_known_date=last_date,
                )

                # Update check timestamp
                check_time = datetime.utcnow().isoformat()
                self.convex.update_imagery_check_time(
                    farm_external_id=farm_id,
                    check_timestamp=check_time,
                    latest_imagery_date=latest_date if has_new else None,
                )

                if has_new:
                    logger.info(f"  New imagery found for {farm_id}: {latest_date}")
                    # Create scheduled job
                    self.convex.create_scheduled_job(farm_id)
                else:
                    logger.info(f"  No new imagery for {farm_id}")

            except Exception as e:
                logger.error(f"  Error checking imagery for {farm_id}: {e}")
                continue

    def _process_jobs(self, jobs: list[dict], start_time: float, max_time: float) -> int:
        """
        Process a list of jobs with timeout protection.

        Args:
            jobs: List of job documents
            start_time: When processing started (from time.time())
            max_time: Maximum processing time in seconds

        Returns:
            Number of jobs successfully processed
        """
        processed = 0

        for job in jobs:
            # Check if we've exceeded max processing time
            elapsed = time.time() - start_time
            if elapsed >= max_time:
                logger.warning(f"Reached max processing time ({elapsed:.0f}s), stopping job processing")
                logger.info(f"Remaining jobs: {len(jobs) - processed}")
                break

            job_id = job['_id']

            # Claim the job
            claimed = self.convex.claim_job(job_id)
            if not claimed:
                logger.warning(f"Job {job_id} already claimed, skipping")
                continue

            if self._process_single_job(claimed):
                processed += 1

        return processed

    def _process_single_job(self, job: dict) -> bool:
        """
        Process a single claimed job.

        Args:
            job: Claimed job document

        Returns:
            True if successful
        """
        job_start = time.time()
        job_id = job['_id']
        farm_id = job['farmExternalId']
        provider = job.get('provider', 'sentinel2')
        triggered_by = job.get('triggeredBy', 'unknown')

        logger.info(f"Processing job {job_id} for farm {farm_id}")
        logger.info(f"  Provider: {provider}, Triggered by: {triggered_by}")

        try:
            # Fetch farm data from Convex
            farm_data = self.convex.get_farm(farm_id)
            if not farm_data:
                raise ValueError(f"Farm {farm_id} not found")

            # Fetch paddocks
            paddocks_data = self.convex.get_paddocks(farm_id)

            # Fetch settings
            settings_data = self.convex.get_settings(farm_id)

            # Create farm config
            farm_config = create_farm_config_from_convex(
                farm_data=farm_data,
                settings_data=settings_data,
                paddocks_data=paddocks_data,
            )

            logger.info(f"  Farm: {farm_config.name}")
            logger.info(f"  Paddocks: {len(farm_config.paddocks)}")
            logger.info(f"  Tier: {farm_config.subscription_tier}")

            # Run the pipeline
            result = run_pipeline_for_farm(
                farm_config=farm_config,
                pipeline_config=self.pipeline_config,
            )

            # Complete the job - success only if we got valid observations
            valid_count = result.get('valid_observations', 0)
            self.convex.complete_job(
                job_id=job_id,
                success=valid_count > 0,
                capture_date=result.get('observation_date'),
                error_message=None if valid_count > 0 else "No valid observations",
            )

            job_elapsed = time.time() - job_start
            logger.info(f"  Job completed: {valid_count} observations in {job_elapsed:.1f}s")
            return True

        except Exception as e:
            job_elapsed = time.time() - job_start
            logger.error(f"  Job failed after {job_elapsed:.1f}s: {e}", exc_info=True)

            # Complete the job as failed
            self.convex.complete_job(
                job_id=job_id,
                success=False,
                error_message=str(e),
            )

            return False


class ConvexClient:
    """HTTP client for Convex queries and mutations."""

    def __init__(self):
        self.deployment_url = os.environ.get("CONVEX_DEPLOYMENT_URL")
        self.api_key = os.environ.get("CONVEX_API_KEY")

        if not self.deployment_url:
            raise ValueError("CONVEX_DEPLOYMENT_URL environment variable is required")
        if not self.api_key:
            raise ValueError("CONVEX_API_KEY environment variable is required")

        self.deployment_url = self.deployment_url.rstrip("/")

    def _query(self, function_name: str, args: dict = None) -> any:
        """Execute a Convex query."""
        import requests

        url = f"{self.deployment_url}/api/query"
        headers = {
            "Authorization": f"Convex {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "path": function_name,
            "args": args or {},
            "format": "json",
        }

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()

        result = response.json()
        if result.get("status") == "error":
            raise Exception(f"Convex query error: {result.get('errorMessage')}")

        return result.get("value")

    def _mutation(self, function_name: str, args: dict = None) -> any:
        """Execute a Convex mutation."""
        import requests

        url = f"{self.deployment_url}/api/mutation"
        headers = {
            "Authorization": f"Convex {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "path": function_name,
            "args": args or {},
            "format": "json",
        }

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()

        result = response.json()
        if result.get("status") == "error":
            raise Exception(f"Convex mutation error: {result.get('errorMessage')}")

        return result.get("value")

    def get_pending_jobs(
        self,
        limit: int = 10,
        triggered_by: Optional[str] = None,
    ) -> list[dict]:
        """Get pending jobs from the queue."""
        args = {"limit": limit}
        if triggered_by:
            args["triggeredBy"] = triggered_by

        return self._query("satelliteFetchJobs:getPendingJobs", args) or []

    def claim_job(self, job_id: str) -> Optional[dict]:
        """Atomically claim a job for processing."""
        return self._mutation("satelliteFetchJobs:claimJob", {"jobId": job_id})

    def complete_job(
        self,
        job_id: str,
        success: bool,
        capture_date: Optional[str] = None,
        error_message: Optional[str] = None,
    ):
        """Mark a job as completed."""
        args = {
            "jobId": job_id,
            "success": success,
        }
        if capture_date:
            args["captureDate"] = capture_date
        if error_message:
            args["errorMessage"] = error_message

        return self._mutation("satelliteFetchJobs:completeJob", args)

    def create_manual_job(self, farm_external_id: str) -> str:
        """Create a manual refresh job."""
        return self._mutation(
            "satelliteFetchJobs:createForManualRefresh",
            {"farmExternalId": farm_external_id}
        )

    def create_scheduled_job(self, farm_external_id: str) -> str:
        """Create a scheduled check job."""
        return self._mutation(
            "satelliteFetchJobs:createForScheduledCheck",
            {"farmExternalId": farm_external_id}
        )

    def get_farms_needing_imagery_check(self) -> list[dict]:
        """Get farms that haven't been checked for imagery in 24h."""
        return self._query("settings:getFarmsNeedingImageryCheck") or []

    def update_imagery_check_time(
        self,
        farm_external_id: str,
        check_timestamp: str,
        latest_imagery_date: Optional[str] = None,
    ):
        """Update imagery check tracking for a farm."""
        args = {
            "farmExternalId": farm_external_id,
            "checkTimestamp": check_timestamp,
        }
        if latest_imagery_date:
            args["latestImageryDate"] = latest_imagery_date

        return self._mutation("settings:updateImageryCheckTime", args)

    def get_farm(self, external_id: str) -> Optional[dict]:
        """Get farm by external ID."""
        return self._query("farms:getByExternalId", {"externalId": external_id})

    def get_paddocks(self, farm_external_id: str) -> list[dict]:
        """Get paddocks (pastures) for a farm by external ID."""
        return self._query("paddocks:listPasturesByFarm", {"farmId": farm_external_id}) or []

    def get_settings(self, farm_external_id: str) -> Optional[dict]:
        """Get settings for a farm."""
        return self._query("settings:getSettings", {"farmId": farm_external_id})


def main():
    parser = argparse.ArgumentParser(
        description="Smart Satellite Pipeline Scheduler",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scheduler.py --hourly        # Process boundary/manual jobs (one-time)
  python scheduler.py --daily         # Full run with imagery check (one-time)
  python scheduler.py --single farm-1 # Process single farm
  python scheduler.py --smart         # Auto-select based on time (one-time)
  python scheduler.py --loop          # Run continuously every hour (for Docker)
        """
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--hourly",
        action="store_true",
        help="Process boundary_update and manual jobs only (one-time)"
    )
    group.add_argument(
        "--daily",
        action="store_true",
        help="Check imagery availability and process all pending jobs (one-time)"
    )
    group.add_argument(
        "--single",
        metavar="FARM_ID",
        help="Process a single farm immediately (for testing)"
    )
    group.add_argument(
        "--smart",
        action="store_true",
        help="Auto-select mode based on farm staleness (one-time)"
    )
    group.add_argument(
        "--loop",
        action="store_true",
        help="Run continuously on configurable interval (default 4h, for Docker)"
    )

    args = parser.parse_args()

    try:
        scheduler = Scheduler()

        if args.hourly:
            processed = scheduler.run_hourly()
            sys.exit(0 if processed >= 0 else 1)

        elif args.daily:
            processed = scheduler.run_daily()
            sys.exit(0 if processed >= 0 else 1)

        elif args.single:
            success = scheduler.run_single(args.single)
            sys.exit(0 if success else 1)

        elif args.smart:
            result = scheduler.run_smart()
            sys.exit(0 if result['jobs_processed'] >= 0 else 1)

        elif args.loop:
            # Loop mode never exits (runs continuously)
            scheduler.run_loop()

    except KeyboardInterrupt:
        logger.info("Scheduler interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Scheduler failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
