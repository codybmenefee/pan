"""
Main entry point for Phase 3 Processing Pipeline.

This script orchestrates the complete satellite data processing flow:
1. Load farm configuration and tier
2. Get appropriate providers based on tier
3. Query satellite catalogs
4. Apply cloud masking
5. Generate composite images
6. Compute zonal statistics per paddock
7. Write observations to Convex
"""
import json
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import TypedDict, Optional, Callable, Any

from config import (
    PipelineConfig,
    FarmConfig,
    load_env_config,
    get_farm_bbox,
    get_paddocks_geojson,
)
from providers import ProviderFactory
from composite import (
    create_median_composite,
    resample_to_resolution,
    merge_providers,
    compute_ndvi,
    compute_evi,
    compute_ndwi,
)
from zonal_stats import compute_zonal_stats


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class ObservationRecord(TypedDict):
    """Observation record for Convex storage."""
    farmExternalId: str
    paddockExternalId: str
    date: str
    ndviMean: float
    ndviMin: float
    ndviMax: float
    ndviStd: float
    eviMean: float
    ndwiMean: float
    cloudFreePct: float
    pixelCount: int
    isValid: bool
    sourceProvider: str
    resolutionMeters: int
    createdAt: str


class PipelineResult(TypedDict):
    """Result of running the pipeline for a farm."""
    farm_id: str
    observation_date: str
    observations: list[ObservationRecord]
    provider_used: str
    resolution: int
    total_paddocks: int
    valid_observations: int


def get_date_range(window_days: int) -> tuple[str, str]:
    """
    Get start and end dates for the composite window.

    Args:
        window_days: Number of days to look back

    Returns:
        Tuple of (start_date, end_date) in YYYY-MM-DD format
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=window_days)

    return (
        start_date.strftime("%Y-%m-%d"),
        end_date.strftime("%Y-%m-%d"),
    )


def run_pipeline_for_farm(
    farm_config: FarmConfig,
    pipeline_config: PipelineConfig | None = None,
    convex_writer: callable | None = None
) -> PipelineResult:
    """
    Run the complete processing pipeline for a single farm.

    Args:
        farm_config: Farm configuration
        pipeline_config: Pipeline configuration (uses defaults if None)
        convex_writer: Optional function to write observations to Convex

    Returns:
        PipelineResult with observation records
    """
    if pipeline_config is None:
        pipeline_config = load_env_config()

    logger.info(f"Processing farm: {farm_config.name} ({farm_config.external_id})")
    logger.info(f"  Tier: {farm_config.subscription_tier}")
    logger.info(f"  Premium features: {farm_config.is_premium}")

    # Step 1: Get providers based on tier
    providers = ProviderFactory.get_providers_for_tier(
        tier=farm_config.subscription_tier,
        planet_api_key=farm_config.planet_api_key,
    )

    if not providers:
        raise ValueError("No providers available for this farm")

    # Determine target resolution based on providers
    target_resolution = ProviderFactory.get_default_resolution(providers)
    provider_names = [p.__class__.__name__.replace("Provider", "").lower() for p in providers]
    source_provider = "merged" if len(providers) > 1 else provider_names[0]

    logger.info(f"  Providers: {', '.join(provider_names)}")
    logger.info(f"  Target resolution: {target_resolution}m")

    # Step 2: Get bounding box and date range
    bbox = get_farm_bbox(farm_config)
    start_date, end_date = get_date_range(pipeline_config.composite_window_days)

    logger.info(f"  Bounding box: {bbox}")
    logger.info(f"  Date range: {start_date} to {end_date}")

    # Step 3: Query each provider
    all_provider_data = []
    all_provider_masks = []
    all_provider_cloud_pcts = []

    for provider in providers:
        logger.info(f"Querying {provider.__class__.__name__}...")

        try:
            # Query for imagery
            items = provider.query(
                bbox=bbox,
                start_date=start_date,
                end_date=end_date,
                max_cloud_cover=pipeline_config.max_cloud_cover,
            )

            if not items:
                logger.warning(f"No imagery found from {provider.__class__.__name__}")
                continue

            logger.info(f"  Found {len(items)} items")

            # Get band names needed for indices
            band_names = list(provider.band_names.keys())
            if "swir" in band_names and not provider.band_names.get("swir"):
                band_names.remove("swir")

            # Load bands
            logger.info(f"  Loading bands: {band_names}")
            data = provider.load(items, band_names, bbox)

            # Apply cloud masking
            logger.info("  Applying cloud mask...")
            masked_data, cloud_free_pct = provider.cloud_mask(data, items)
            logger.info(f"  Cloud-free pixels: {cloud_free_pct:.1%}")

            all_provider_data.append(masked_data)
            all_provider_masks.append(~masked_data.isnull().any(dim="band", keepdims=True).squeeze())
            all_provider_cloud_pcts.append(cloud_free_pct)

        except Exception as e:
            logger.error(f"  Error processing {provider.__class__.__name__}: {e}")
            continue

    if not all_provider_data:
        raise ValueError("No valid data from any provider")

    # Step 4: Create composite
    logger.info("Creating composite...")

    if len(all_provider_data) == 1:
        # Single provider - just use the data directly
        composite_data = all_provider_data[0]
        combined_mask = all_provider_masks[0]
        avg_cloud_free_pct = all_provider_cloud_pcts[0]
    else:
        # Multiple providers - merge at target resolution
        logger.info(f"  Merging {len(all_provider_data)} providers at {target_resolution}m")
        composite_data = merge_providers(
            all_provider_data,
            all_provider_masks,
            target_resolution=target_resolution,
            merge_method="highest_resolution",
        )
        avg_cloud_free_pct = sum(all_provider_cloud_pcts) / len(all_provider_cloud_pcts)

    # Step 5: Compute vegetation indices
    logger.info("Computing vegetation indices...")

    # Compute NDVI
    ndvi = compute_ndvi(composite_data)
    logger.info(f"  NDVI: min={float(ndvi.min()):.2f}, max={float(ndvi.max()):.2f}, mean={float(ndvi.mean()):.2f}")

    # Compute EVI and NDWI if bands available
    evi = None
    ndwi = None

    band_names = list(composite_data.coords.get("band", []))
    if "blue" in band_names and "swir" in band_names:
        evi = compute_evi(composite_data)
        ndwi = compute_ndwi(composite_data)
    elif "blue" in band_names:
        evi = compute_evi(composite_data)
    elif "swir" in band_names:
        ndwi = compute_ndwi(composite_data)

    # Step 6: Compute zonal statistics per paddock
    logger.info("Computing zonal statistics per paddock...")

    paddocks_geojson = get_paddocks_geojson(farm_config.paddocks)

    # Add NDVI as a band for zonal stats
    if "band" in composite_data.dims:
        # Create a combined DataArray with all indices
        index_data = composite_data.copy()
        # Add NDVI, EVI, NDWI as new bands
        # This is simplified - ideally we'd stack them properly
    else:
        # Stack indices into a band dimension
        pass

    stats = compute_zonal_stats(
        data=composite_data,
        paddocks=farm_config.paddocks,
        resolution_meters=target_resolution,
    )

    logger.info(f"  Processed {len(stats)} paddocks")

    # Step 7: Create observation records
    logger.info("Creating observation records...")

    observation_date = end_date  # Use most recent date in window
    observations: list[ObservationRecord] = []

    for stat in stats:
        # Calculate cloud-free percentage for this specific paddock
        # This is a simplified calculation - in production, we'd compute per-paddock
        paddock_cloud_pct = avg_cloud_free_pct

        observation = ObservationRecord(
            farmExternalId=farm_config.external_id,
            paddockExternalId=stat["paddock_id"],
            date=observation_date,
            ndviMean=stat["ndvi_mean"],
            ndviMin=stat["ndvi_min"],
            ndviMax=stat["ndvi_max"],
            ndviStd=stat["ndvi_std"],
            eviMean=stat["evi_mean"] if stat["evi_mean"] is not None else 0.0,
            ndwiMean=stat["ndwi_mean"] if stat["ndwi_mean"] is not None else 0.0,
            cloudFreePct=paddock_cloud_pct,
            pixelCount=stat["pixel_count"],
            isValid=stat["is_valid"],
            sourceProvider=source_provider,
            resolutionMeters=target_resolution,
            createdAt=datetime.now().isoformat(),
        )
        observations.append(observation)

    valid_count = sum(1 for o in observations if o["isValid"])
    logger.info(f"  Valid observations: {valid_count}/{len(observations)}")

    # Step 8: Write to Convex if configured
    if convex_writer and pipeline_config.write_to_convex:
        logger.info("Writing observations to Convex...")
        try:
            result = convex_writer(observations)
            logger.info(f"  Wrote {len(observations)} observations")
        except Exception as e:
            logger.error(f"  Error writing to Convex: {e}")

    return PipelineResult(
        farm_id=farm_config.external_id,
        observation_date=observation_date,
        observations=observations,
        provider_used=source_provider,
        resolution=target_resolution,
        total_paddocks=len(observations),
        valid_observations=valid_count,
    )


def run_pipeline_for_dev_farm(
    sample_farm_geometry: dict,
    sample_paddocks: list[dict],
    convex_writer: callable | None = None
) -> PipelineResult:
    """
    Run the pipeline using hardcoded sample data for development.

    Args:
        sample_farm_geometry: GeoJSON Feature for farm boundary
        sample_paddocks: List of paddock dictionaries
        convex_writer: Optional function to write to Convex

    Returns:
        PipelineResult
    """
    # Create a dev farm config
    farm_config = FarmConfig(
        farm_id="dev-farm-1",
        external_id="farm-1",
        name="Hillcrest Station (Dev)",
        geometry=sample_farm_geometry,
        paddocks=sample_paddocks,
        subscription_tier="free",  # Start with free tier
        planet_api_key=None,
    )

    return run_pipeline_for_farm(
        farm_config=farm_config,
        pipeline_config=None,
        convex_writer=convex_writer,
    )


def main():
    """
    Main entry point for running the pipeline from command line.

    Usage:
        python pipeline.py --farm-id <farm-id>
        python pipeline.py --dev  # Use sample data
    """
    import argparse

    parser = argparse.ArgumentParser(description="Run the satellite processing pipeline")
    parser.add_argument(
        "--farm-id",
        help="Farm external ID to process (fetches from Convex)"
    )
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Use sample data for development"
    )
    parser.add_argument(
        "--output",
        default="output",
        help="Output directory for results"
    )
    parser.add_argument(
        "--write-convex",
        action="store_true",
        help="Write results to Convex"
    )

    args = parser.parse_args()

    # Ensure output directory exists
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)

    # Configure pipeline
    pipeline_config = load_env_config()
    pipeline_config.output_dir = str(output_dir)
    pipeline_config.write_to_convex = args.write_convex

    result: Optional[PipelineResult] = None

    if args.dev:
        # Use sample data
        logger.info("Running pipeline in DEV mode with sample data")

        # Create mock convex writer if needed
        convex_writer: Optional[Callable[[list[ObservationRecord]], int]] = None
        if args.write_convex:
            def write_to_convex(observations):
                # In dev mode, just save to JSON
                output_file = output_dir / "observations.json"
                with open(output_file, "w") as f:
                    json.dump(observations, f, indent=2)
                return len(observations)
            convex_writer = write_to_convex

        # Use default sample farm
        sys.path.insert(0, str(Path(__file__).parent.parent / "app"))
        from app.convex.seedData import sampleFarm, samplePaddocks

        result = run_pipeline_for_dev_farm(
            sample_farm_geometry=sampleFarm["geometry"],
            sample_paddocks=samplePaddocks,
            convex_writer=convex_writer,
        )

    elif args.farm_id:
        # Fetch from Convex
        logger.info(f"Fetching farm {args.farm_id} from Convex...")

        # TODO: Implement Convex client to fetch farm data
        # For now, use sample data
        logger.warning("Convex fetch not yet implemented, using sample data")

        sys.path.insert(0, str(Path(__file__).parent.parent / "app"))
        from app.convex.seedData import sampleFarm, samplePaddocks
        farm_config = FarmConfig(
            farm_id=args.farm_id,
            external_id=args.farm_id,
            name="Sample Farm",
            geometry=sampleFarm["geometry"],
            paddocks=samplePaddocks,
        )

        result = run_pipeline_for_farm(
            farm_config=farm_config,
            pipeline_config=pipeline_config,
        )

    else:
        parser.print_help()
        sys.exit(1)
        result = None  # type: ignore

    # Save results
    if result:
        result_file = output_dir / "pipeline_result.json"
        with open(result_file, "w") as f:
            json.dump({
                "farm_id": result["farm_id"],
                "observation_date": result["observation_date"],
                "provider_used": result["provider_used"],
                "resolution": result["resolution"],
                "total_paddocks": result["total_paddocks"],
                "valid_observations": result["valid_observations"],
                "observation_count": len(result["observations"]),
            }, f, indent=2)

        logger.info(f"Pipeline complete. Results saved to {result_file}")
        logger.info(f"  Farm: {result['farm_id']}")
        logger.info(f"  Date: {result['observation_date']}")
        logger.info(f"  Provider: {result['provider_used']} ({result['resolution']}m)")
        logger.info(f"  Paddocks: {result['valid_observations']}/{result['total_paddocks']} valid")

    return result


if __name__ == "__main__":
    main()
