"""
Convex HTTP client for writing observations to Convex.

This module provides a client to write observation records to Convex
via HTTP API calls. It handles authentication, batching, and error handling.
"""
import json
import logging
import os
import time
from typing import Callable, Optional
from urllib.parse import urljoin

import requests

from observation_types import ObservationRecord

logger = logging.getLogger(__name__)


class ConvexWriter:
    """HTTP client for writing observations to Convex."""

    def __init__(
        self,
        deployment_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        """
        Initialize Convex writer.

        Args:
            deployment_url: Convex deployment URL (e.g., https://xxx.convex.cloud)
            api_key: Convex API key for authentication
        """
        self.deployment_url = deployment_url or os.environ.get("CONVEX_DEPLOYMENT_URL")
        self.api_key = api_key or os.environ.get("CONVEX_API_KEY")

        if not self.deployment_url:
            raise ValueError("CONVEX_DEPLOYMENT_URL environment variable is required")
        if not self.api_key:
            raise ValueError("CONVEX_API_KEY environment variable is required")

        # Ensure URL doesn't end with slash
        self.deployment_url = self.deployment_url.rstrip("/")
        # Convex HTTP API mutation endpoint
        self.base_url = f"{self.deployment_url}/api/mutation"

    def _make_request(
        self,
        function_name: str,
        args: dict,
        max_retries: int = 3,
        retry_delay: float = 1.0,
    ) -> dict:
        """
        Make HTTP request to Convex mutation.

        Args:
            function_name: Name of Convex mutation function (e.g., "observations:refreshObservations")
            args: Arguments to pass to the function
            max_retries: Maximum number of retry attempts
            retry_delay: Initial delay between retries (exponential backoff)

        Returns:
            Response JSON as dictionary with 'value' field containing the mutation result

        Raises:
            requests.RequestException: If request fails after retries
        """
        # Convex HTTP API format: POST to /api/mutation with path in body
        # For deploy keys, use "Convex" prefix instead of "Bearer"
        url = self.base_url
        headers = {
            "Authorization": f"Convex {self.api_key}",
            "Content-Type": "application/json",
            "accept": "application/json",
        }
        # Convex expects: {"path": "module:function", "args": {...}, "format": "json"}
        payload = {
            "path": function_name,
            "args": args,
            "format": "json"
        }

        for attempt in range(max_retries):
            try:
                logger.info(f"Making request to {url}")
                logger.info(f"  Function path: {function_name}")
                logger.info(f"  Payload args keys: {list(payload.get('args', {}).keys())}")
                logger.info(f"  Headers: Authorization={'Convex ' + self.api_key[:20] + '...' if self.api_key else 'MISSING'}")
                
                # Debug: Log exact payload structure
                if 'observations' in payload.get('args', {}):
                    obs_array = payload['args']['observations']
                    logger.info(f"  DEBUG: Payload contains {len(obs_array)} observations in args.observations")
                    if len(obs_array) > 0:
                        logger.info(f"  DEBUG: First obs in payload: farmExternalId={obs_array[0].get('farmExternalId')}, paddockExternalId={obs_array[0].get('paddockExternalId')}")
                        logger.info(f"  DEBUG: Last obs in payload: farmExternalId={obs_array[-1].get('farmExternalId')}, paddockExternalId={obs_array[-1].get('paddockExternalId')}")
                
                # Log the request being sent
                logger.info(f"Calling Convex function: {function_name}")
                if 'observations' in payload.get('args', {}):
                    obs_list = payload['args']['observations']
                    logger.info(f"Observations in payload: {len(obs_list)} items")
                
                response = requests.post(url, json=payload, headers=headers, timeout=30)
                
                # Log response status
                logger.debug(f"Convex HTTP response status: {response.status_code}")
                
                # Check for HTTP errors
                response.raise_for_status()
                
                # Parse JSON response
                try:
                    result = response.json()
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    logger.error(f"Response text was: {response.text}")
                    raise
                
                # Convex returns: {"status": "success", "value": {...}, "logLines": [...]}
                if result.get("status") == "error":
                    error_msg = result.get("errorMessage", "Unknown error")
                    logger.error(f"Convex mutation error: {error_msg}")
                    raise requests.RequestException(f"Convex mutation failed: {error_msg}")
                
                # Return the value field which contains the actual mutation result
                # Convex HTTP API wraps the mutation result in {"status": "success", "value": {...}}
                value = result.get("value", result)
                
                # If value is still the full result, log a warning
                if value == result and "status" in result:
                    logger.warning("Value field not found in response, using full result")
                
                return value
            except requests.RequestException as e:
                # Log full error details
                error_details = {
                    "url": url,
                    "status_code": getattr(e.response, 'status_code', None) if hasattr(e, 'response') else None,
                    "response_text": getattr(e.response, 'text', None) if hasattr(e, 'response') else None,
                    "error": str(e)
                }
                logger.error(f"Request error details: {error_details}")
                
                if attempt < max_retries - 1:
                    delay = retry_delay * (2 ** attempt)
                    logger.warning(
                        f"Request failed (attempt {attempt + 1}/{max_retries}): {e}. "
                        f"Retrying in {delay}s..."
                    )
                    time.sleep(delay)
                else:
                    logger.error(f"Request failed after {max_retries} attempts: {e}")
                    raise

    def write_observation(self, observation: ObservationRecord) -> str:
        """
        Write a single observation to Convex.

        Args:
            observation: Observation record to write

        Returns:
            Convex document ID
        """
        result = self._make_request("observations:create", observation)
        return result.get("_id", "")

    def write_observations_batch(
        self, observations: list[ObservationRecord], batch_size: int = 50
    ) -> int:
        """
        Write multiple observations to Convex in batches.

        Args:
            observations: List of observation records
            batch_size: Number of observations per batch

        Returns:
            Number of successfully written observations
        """
        total_written = 0
        logger.info(f"Writing {len(observations)} observations to Convex in batches")

        for i in range(0, len(observations), batch_size):
            batch = observations[i : i + batch_size]
            batch_num = i // batch_size + 1
            logger.info(f"Writing batch {batch_num} ({len(batch)} observations)")

            try:
                # Write batch using Convex mutation
                payload_args = {"observations": batch}
                result = self._make_request(
                    "observations:refreshObservations",
                    payload_args,
                )
                
                # Result from refreshObservations is: {"inserted": N, "updated": M, "skipped": K}
                inserted = result.get("inserted", 0) if isinstance(result, dict) else 0
                updated = result.get("updated", 0) if isinstance(result, dict) else 0
                skipped = result.get("skipped", 0) if isinstance(result, dict) else 0
                written_count = inserted + updated
                total_written += written_count
                
                logger.info(
                    f"Batch {batch_num} result: {inserted} inserted, {updated} updated, {skipped} skipped"
                )
                
                # Warn if counts don't match
                if written_count != len(batch):
                    logger.warning(
                        f"Written count ({written_count}) doesn't match batch size ({len(batch)})"
                    )
            except Exception as e:
                logger.error(f"  Error writing batch: {e}", exc_info=True)
                # Continue with next batch
                continue

        logger.info(f"Completed writing observations: {total_written}/{len(observations)} written")
        return total_written


def create_convex_writer() -> Optional[ConvexWriter]:
    """
    Create a Convex writer instance if configuration is available.

    Returns:
        ConvexWriter instance or None if configuration is missing
    """
    try:
        return ConvexWriter()
    except ValueError as e:
        logger.warning(f"Convex writer not available: {e}")
        return None


def write_observations_to_convex(
    observations: list[ObservationRecord],
) -> int:
    """
    Write observations to Convex (convenience function).

    Args:
        observations: List of observation records

    Returns:
        Number of successfully written observations
    """
    logger.info(f"Writing {len(observations)} observations to Convex")
    writer = create_convex_writer()
    if not writer:
        logger.warning("Convex writer not configured, skipping write")
        return 0

    if not observations:
        logger.info("No observations to write")
        return 0

    try:
        result = writer.write_observations_batch(observations)
        logger.info(f"Successfully wrote {result} observations to Convex")
        return result
    except Exception as e:
        logger.error(f"Error writing observations to Convex: {e}", exc_info=True)
        raise
