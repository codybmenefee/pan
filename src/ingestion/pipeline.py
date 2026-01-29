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
from typing import TypedDict, Optional, Callable, Any, Union, TYPE_CHECKING

if TYPE_CHECKING:
    import numpy as np
    import xarray as xr

# Load environment variables from .env.local if available
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    pass  # dotenv not installed, use system env vars

from config import (
    PipelineConfig,
    FarmConfig,
    load_env_config,
    get_farm_bbox,
    get_paddocks_geojson,
)
from providers import ProviderFactory, ActivationTimeoutError, QuotaExceededError
from composite import (
    create_median_composite,
    resample_to_resolution,
    merge_providers,
    compute_ndvi,
    compute_evi,
    compute_ndwi,
)
from zonal_stats import compute_zonal_stats
from writer import write_observations_to_convex, notify_completion
from observation_types import ObservationRecord


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Tile generation helpers

def create_rgb_composite(bands: 'xr.DataArray') -> 'np.ndarray':
    """
    Create an RGB composite from band data.

    Args:
        bands: xarray DataArray with 'red', 'green', 'blue' bands

    Returns:
        numpy array with shape (3, H, W) containing uint8 RGB values
    """
    import numpy as np

    # Extract RGB bands
    red = bands.sel(band='red').values
    green = bands.sel(band='green').values
    blue = bands.sel(band='blue').values

    # Stack into RGB array
    rgb = np.stack([red, green, blue], axis=0)

    # Scale reflectance (0-1) to 0-255 with contrast enhancement
    # Apply percentile stretch for better visualization
    p2, p98 = np.nanpercentile(rgb, [2, 98])
    rgb_scaled = np.clip((rgb - p2) / (p98 - p2) * 255, 0, 255)

    return rgb_scaled.astype(np.uint8)


def save_geotiff(
    data: 'np.ndarray',
    bounds: tuple[float, float, float, float],
    crs: str,
    output_path: str,
    nodata: float | None = None,
) -> str:
    """
    Save array data as a GeoTIFF file.

    Args:
        data: numpy array with shape (bands, H, W) or (H, W)
        bounds: Bounding box (west, south, east, north)
        crs: Coordinate reference system string
        output_path: Path to write the GeoTIFF
        nodata: Optional nodata value

    Returns:
        Path to the saved file
    """
    import rasterio
    from rasterio.transform import from_bounds

    # Ensure 3D array
    if data.ndim == 2:
        data = data[np.newaxis, ...]

    bands, height, width = data.shape
    west, south, east, north = bounds

    # Create transform from bounds
    transform = from_bounds(west, south, east, north, width, height)

    # Determine dtype
    dtype = data.dtype

    # Write GeoTIFF
    with rasterio.open(
        output_path,
        'w',
        driver='GTiff',
        height=height,
        width=width,
        count=bands,
        dtype=dtype,
        crs=crs,
        transform=transform,
        compress='deflate',
        nodata=nodata,
    ) as dst:
        for i in range(bands):
            dst.write(data[i], i + 1)

    return output_path


def save_png(
    data: 'np.ndarray',
    output_path: str,
) -> str:
    """
    Save RGB array data as a PNG file.

    Args:
        data: numpy array with shape (3, H, W) containing uint8 RGB values
        output_path: Path to write the PNG

    Returns:
        Path to the saved file
    """
    from PIL import Image
    import numpy as np

    # Transpose from (3, H, W) to (H, W, 3) for PIL
    if data.shape[0] == 3:
        data = np.transpose(data, (1, 2, 0))

    img = Image.fromarray(data, mode='RGB')
    img.save(output_path, 'PNG')

    return output_path


def save_rgba_png(
    data: 'np.ndarray',
    output_path: str,
) -> str:
    """
    Save RGBA array data as a PNG file with transparency support.

    Args:
        data: numpy array with shape (4, H, W) or (H, W, 4) containing uint8 RGBA values
        output_path: Path to write the PNG

    Returns:
        Path to the saved file
    """
    from PIL import Image
    import numpy as np

    # Transpose from (4, H, W) to (H, W, 4) for PIL if needed
    if data.shape[0] == 4:
        data = np.transpose(data, (1, 2, 0))

    img = Image.fromarray(data, mode='RGBA')
    img.save(output_path, 'PNG')

    return output_path


# NDVI color ramp matching frontend NDVIHeatmapLayer.tsx
# Brown (low/bare) -> Yellow (sparse) -> Light Green (moderate) -> Dark Green (healthy)
NDVI_COLOR_RAMP = [
    (-0.2, (139, 69, 19)),    # Brown #8B4513 (bare soil/water)
    (0.0, (210, 105, 30)),    # Sienna #D2691E
    (0.2, (218, 165, 32)),    # Goldenrod #DAA520
    (0.3, (255, 215, 0)),     # Yellow #FFD700
    (0.4, (154, 205, 50)),    # Yellow-green #9ACD32
    (0.5, (124, 252, 0)),     # Light green #7CFC00
    (0.6, (50, 205, 50)),     # Lime green #32CD32
    (0.7, (34, 139, 34)),     # Forest green #228B22
    (0.8, (0, 100, 0)),       # Dark green #006400
]


def colorize_ndvi_to_png(
    ndvi: 'np.ndarray',
    output_path: str,
) -> str:
    """
    Apply NDVI color ramp and save as RGBA PNG.

    Color ramp (matching frontend NDVIHeatmapLayer.tsx):
    -0.2: #8B4513 (brown)     0.4: #9ACD32 (yellow-green)
     0.0: #D2691E (sienna)    0.5: #7CFC00 (light green)
     0.2: #DAA520 (gold)      0.6: #32CD32 (lime)
     0.3: #FFD700 (yellow)    0.7: #228B22 (forest green)
                              0.8: #006400 (dark green)

    Args:
        ndvi: 2D numpy array with NDVI values (-1 to 1)
        output_path: Path to write the PNG

    Returns:
        Path to the saved file
    """
    import numpy as np

    # Ensure 2D array
    if ndvi.ndim == 3:
        ndvi = ndvi[0]  # Take first band if 3D

    height, width = ndvi.shape

    # Create RGBA output array
    rgba = np.zeros((height, width, 4), dtype=np.uint8)

    # Create mask for valid (non-NaN) pixels
    valid_mask = ~np.isnan(ndvi)

    # Apply color ramp using linear interpolation
    for i in range(len(NDVI_COLOR_RAMP) - 1):
        val_low, color_low = NDVI_COLOR_RAMP[i]
        val_high, color_high = NDVI_COLOR_RAMP[i + 1]

        # Find pixels in this range
        in_range = valid_mask & (ndvi >= val_low) & (ndvi < val_high)

        if np.any(in_range):
            # Calculate interpolation factor (0-1)
            t = (ndvi[in_range] - val_low) / (val_high - val_low)
            t = np.clip(t, 0, 1)

            # Interpolate RGB values
            for c in range(3):
                rgba[in_range, c] = np.round(
                    color_low[c] + t * (color_high[c] - color_low[c])
                ).astype(np.uint8)

            # Set alpha to fully opaque for valid pixels
            rgba[in_range, 3] = 255

    # Handle values at or above the max threshold
    at_max = valid_mask & (ndvi >= NDVI_COLOR_RAMP[-1][0])
    if np.any(at_max):
        for c in range(3):
            rgba[at_max, c] = NDVI_COLOR_RAMP[-1][1][c]
        rgba[at_max, 3] = 255

    # Handle values below the min threshold
    at_min = valid_mask & (ndvi < NDVI_COLOR_RAMP[0][0])
    if np.any(at_min):
        for c in range(3):
            rgba[at_min, c] = NDVI_COLOR_RAMP[0][1][c]
        rgba[at_min, 3] = 255

    # Invalid (NaN) pixels remain transparent (alpha = 0)

    return save_rgba_png(rgba, output_path)


def generate_tiles(
    bands: 'xr.DataArray',
    ndvi: 'xr.DataArray',
    bounds: tuple[float, float, float, float],
    crs: str,
    output_dir: str,
    capture_date: str,
) -> dict[str, str]:
    """
    Generate image tiles for RGB and index layers.

    RGB tiles are saved as PNG for direct MapLibre rendering.
    NDVI tiles are saved as GeoTIFF for data preservation.

    Args:
        bands: xarray DataArray with band data
        ndvi: xarray DataArray with NDVI values
        bounds: Bounding box (west, south, east, north)
        crs: Coordinate reference system string
        output_dir: Directory to write tiles
        capture_date: Capture date YYYY-MM-DD

    Returns:
        Dictionary mapping tile type to file path
    """
    import os
    import numpy as np

    os.makedirs(output_dir, exist_ok=True)
    tiles = {}

    # Generate RGB composite as PNG if all bands available
    band_names = list(bands.coords.get('band', []))
    if 'red' in band_names and 'green' in band_names and 'blue' in band_names:
        logger.info("Generating RGB composite tile (PNG)...")
        rgb_data = create_rgb_composite(bands)
        rgb_path = os.path.join(output_dir, f"rgb_{capture_date}.png")
        save_png(rgb_data, rgb_path)
        tiles['rgb'] = rgb_path
        logger.info(f"  Saved RGB tile: {rgb_path}")

    # Generate NDVI tile as GeoTIFF (for data preservation)
    logger.info("Generating NDVI tile (GeoTIFF)...")
    # Handle both xarray DataArray and numpy array
    ndvi_data = ndvi.values if hasattr(ndvi, 'values') else ndvi
    if ndvi_data.ndim == 2:
        ndvi_data = ndvi_data[np.newaxis, ...]
    ndvi_path = os.path.join(output_dir, f"ndvi_{capture_date}.tif")
    # Scale NDVI from -1..1 to 0..255 for storage
    ndvi_scaled = np.clip((ndvi_data + 1) / 2 * 255, 0, 255).astype(np.uint8)
    save_geotiff(ndvi_scaled, bounds, crs, ndvi_path, nodata=0)
    tiles['ndvi'] = ndvi_path
    logger.info(f"  Saved NDVI tile: {ndvi_path}")

    # Generate colorized NDVI heatmap as PNG for direct MapLibre display
    logger.info("Generating NDVI heatmap tile (PNG)...")
    # Use the raw NDVI data (not scaled) for colorization
    ndvi_raw = ndvi.values if hasattr(ndvi, 'values') else ndvi
    ndvi_heatmap_path = os.path.join(output_dir, f"ndvi_heatmap_{capture_date}.png")
    colorize_ndvi_to_png(ndvi_raw, ndvi_heatmap_path)
    tiles['ndvi_heatmap'] = ndvi_heatmap_path
    logger.info(f"  Saved NDVI heatmap tile: {ndvi_heatmap_path}")

    return tiles


class PipelineResult(TypedDict):
    """Result of running the pipeline for a farm."""
    farm_id: str
    observation_date: str
    observations: list[ObservationRecord]
    provider_used: str
    resolution: int
    total_paddocks: int
    valid_observations: int
    tiles_generated: dict[str, str]  # tile_type -> file_path


def get_date_range(window_days: int, end_date: Optional[datetime] = None) -> tuple[str, str]:
    """
    Get start and end dates for the composite window.

    Args:
        window_days: Number of days to look back
        end_date: Optional end date (defaults to now)

    Returns:
        Tuple of (start_date, end_date) in YYYY-MM-DD format
    """
    if end_date is None:
        end_date = datetime.now()
    start_date = end_date - timedelta(days=window_days)

    return (
        start_date.strftime("%Y-%m-%d"),
        end_date.strftime("%Y-%m-%d"),
    )


def get_historical_windows(
    years: int,
    window_days: int = 21,
    step_days: int = 14,
) -> list[tuple[str, str]]:
    """
    Generate date windows for historical backfill.

    Creates overlapping windows going back N years, useful for
    building a historical archive of satellite observations.

    Args:
        years: Number of years to go back
        window_days: Size of each composite window (default 21 days)
        step_days: Step size between windows (default 14 days)

    Returns:
        List of (start_date, end_date) tuples in YYYY-MM-DD format
    """
    windows = []
    end_date = datetime.now()
    earliest_date = end_date - timedelta(days=years * 365)

    current_end = end_date
    while current_end > earliest_date:
        current_start = current_end - timedelta(days=window_days)
        windows.append((
            current_start.strftime("%Y-%m-%d"),
            current_end.strftime("%Y-%m-%d"),
        ))
        current_end = current_end - timedelta(days=step_days)

    return windows


def run_pipeline_for_farm(
    farm_config: FarmConfig,
    pipeline_config: Optional[PipelineConfig] = None,
    convex_writer: Optional[Callable[[list[ObservationRecord]], int]] = None
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

    # Map internal provider names to standardized API names
    PROVIDER_NAME_MAP = {
        "copernicus": "sentinel2",  # Copernicus provides Sentinel-2 data
        "sentinel2": "sentinel2",
        "planetscope": "planet",
        "planet": "planet",
    }
    source_provider = PROVIDER_NAME_MAP.get(source_provider, source_provider)

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
    all_provider_cloud_masks = []  # Boolean cloud masks for zonal stats

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
            masked_data, cloud_free_pct, cloud_mask = provider.cloud_mask(data, items, bbox)
            logger.info(f"  Cloud-free pixels: {cloud_free_pct:.1%}")

            all_provider_data.append(masked_data)
            # Create mask where True = valid pixel
            valid_mask = ~masked_data.isnull()
            all_provider_masks.append(valid_mask)
            all_provider_cloud_pcts.append(cloud_free_pct)
            all_provider_cloud_masks.append(cloud_mask)

        except ActivationTimeoutError as e:
            # Planet asset activation timed out - skip this provider and try others
            logger.warning(
                f"  Activation timeout for {provider.__class__.__name__}: {e}. "
                f"Skipping and trying other providers."
            )
            continue
        except QuotaExceededError as e:
            # Quota exceeded - skip this provider but don't fail the pipeline
            logger.warning(
                f"  Quota exceeded for {provider.__class__.__name__}: {e}. "
                f"Skipping and trying other providers."
            )
            continue
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
        combined_cloud_mask = all_provider_cloud_masks[0]
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
        # For multiple providers, use OR of cloud masks (pixel is cloudy if any provider says so)
        # This is conservative - we only trust pixels clear in all providers
        import numpy as np
        import xarray as xr
        combined_cloud_mask = all_provider_cloud_masks[0]
        for mask in all_provider_cloud_masks[1:]:
            combined_cloud_mask = combined_cloud_mask | mask

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

    # Step 5.5: Generate GeoTIFF tiles for visualization
    tiles_generated = {}
    if pipeline_config.output_dir:
        logger.info("Generating GeoTIFF tiles...")
        try:
            # Extract bounds from composite data
            x_coords = composite_data.coords.get('x')
            y_coords = composite_data.coords.get('y')
            if x_coords is not None and y_coords is not None:
                tile_bounds = (
                    float(x_coords.min()),
                    float(y_coords.min()),
                    float(x_coords.max()),
                    float(y_coords.max()),
                )
                tile_crs = composite_data.attrs.get('crs', 'EPSG:32616')

                tiles_generated = generate_tiles(
                    bands=composite_data,
                    ndvi=ndvi,
                    bounds=tile_bounds,
                    crs=tile_crs,
                    output_dir=pipeline_config.output_dir,
                    capture_date=end_date,
                )
                logger.info(f"  Generated {len(tiles_generated)} tiles")

                # Step 5.6: Upload tiles to R2 and write metadata to Convex
                if tiles_generated and pipeline_config.write_to_convex:
                    logger.info("Uploading tiles to R2...")
                    try:
                        from storage.r2 import R2Storage, get_retention_days
                        from writer import SatelliteTileRecord, write_satellite_tile_to_convex
                        from rasterio.warp import transform_bounds

                        r2 = R2Storage()
                        retention_days = get_retention_days(
                            farm_config.subscription_tier,
                            'raw_imagery'
                        )

                        # Convert bounds from projected CRS to WGS84 for storage
                        wgs84_bounds = transform_bounds(
                            tile_crs,  # Source CRS (e.g., EPSG:32616)
                            'EPSG:4326',  # Target CRS (WGS84)
                            *tile_bounds
                        )
                        bounds_dict = {
                            'west': wgs84_bounds[0],
                            'south': wgs84_bounds[1],
                            'east': wgs84_bounds[2],
                            'north': wgs84_bounds[3],
                        }
                        logger.info(f"  Tile bounds (WGS84): {bounds_dict}")

                        for tile_type, tile_path in tiles_generated.items():
                            logger.info(f"  Uploading {tile_type} tile to R2...")
                            result = r2.upload_tile(
                                file_path=tile_path,
                                farm_external_id=farm_config.external_id,
                                capture_date=end_date,
                                tile_type=tile_type,
                                resolution_meters=target_resolution,
                                retention_days=retention_days,
                            )

                            # Write tile metadata to Convex
                            tile_record = SatelliteTileRecord(
                                farm_external_id=farm_config.external_id,
                                capture_date=end_date,
                                provider=source_provider,
                                tile_type=tile_type,
                                r2_key=result['r2_key'],
                                r2_url=result['r2_url'],
                                bounds=bounds_dict,
                                cloud_cover_pct=(1.0 - avg_cloud_free_pct) * 100,
                                resolution_meters=target_resolution,
                                file_size_bytes=result['file_size_bytes'],
                                expires_at=result['expires_at'],
                            )
                            write_satellite_tile_to_convex(tile_record)
                            logger.info(f"    Uploaded {tile_type}: {result['r2_key']}")

                    except ImportError as e:
                        logger.warning(f"  R2 storage not available: {e}")
                    except Exception as e:
                        logger.error(f"  Error uploading tiles to R2: {e}")

            else:
                logger.warning("  Could not extract bounds from composite data, skipping tile generation")
        except Exception as e:
            logger.error(f"  Error generating tiles: {e}")

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
        cloud_mask=combined_cloud_mask,
    )

    logger.info(f"  Processed {len(stats)} paddocks")

    # Step 7: Create observation records
    logger.info("Creating observation records...")

    observation_date = end_date  # Use most recent date in window
    observations: list[ObservationRecord] = []

    for stat in stats:
        # Use per-paddock cloud-free percentage from zonal stats
        paddock_cloud_pct = stat.get("cloud_free_pct", avg_cloud_free_pct)

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

    # Debug: Log each observation being created
    logger.info(f"  DEBUG: Created {len(observations)} observation records:")
    for idx, obs in enumerate(observations):
        logger.info(f"    [{idx}] farm={obs['farmExternalId']}, paddock={obs['paddockExternalId']}, date={obs['date']}, ndvi={obs['ndviMean']:.3f}")

    # Detect failure reason - if all paddocks failed, likely boundary overlap issue
    failure_reason = None
    if valid_count == 0 and len(observations) > 0:
        # All paddocks failed - likely boundary overlap issue
        failure_reason = "boundary_overlap"
        logger.warning(f"  All {len(observations)} paddocks failed - detected boundary_overlap failure")

    # Step 8: Write to Convex if configured
    write_success = False
    if pipeline_config.write_to_convex:
        logger.info("Writing observations to Convex...")
        logger.info(f"  DEBUG: About to write {len(observations)} observations to Convex")
        try:
            if convex_writer:
                # Use provided writer function
                result = convex_writer(observations)
                logger.info(f"  Wrote {result} observations")
            else:
                # Use default writer
                result = write_observations_to_convex(observations)
                logger.info(f"  Wrote {result} observations")
            write_success = True
        except Exception as e:
            logger.error(f"  Error writing to Convex: {e}", exc_info=True)

    # Note: Notification is handled by the scheduler via complete_job()
    # to avoid duplicate notifications. The scheduler calls completeJob
    # after this function returns, which creates the notification.

    return PipelineResult(
        farm_id=farm_config.external_id,
        observation_date=observation_date,
        observations=observations,
        provider_used=source_provider,
        resolution=target_resolution,
        total_paddocks=len(observations),
        valid_observations=valid_count,
        tiles_generated=tiles_generated,
    )


def run_pipeline_for_dev_farm(
    sample_farm_geometry: dict,
    sample_paddocks: list[dict],
    convex_writer: Optional[Callable[[list[ObservationRecord]], int]] = None
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


def run_historical_backfill(
    farm_config: FarmConfig,
    years: int,
    pipeline_config: Optional[PipelineConfig] = None,
    convex_writer: Optional[Callable[[list[ObservationRecord]], int]] = None
) -> list[PipelineResult]:
    """
    Run historical backfill for a farm, processing multiple date windows.

    Args:
        farm_config: Farm configuration
        years: Number of years to backfill
        pipeline_config: Pipeline configuration (uses defaults if None)
        convex_writer: Optional function to write observations to Convex

    Returns:
        List of PipelineResult objects for each successful window
    """
    if pipeline_config is None:
        pipeline_config = load_env_config()

    logger.info(f"Starting historical backfill for {farm_config.name}")
    logger.info(f"  Backfill period: {years} years")

    # Generate historical windows
    windows = get_historical_windows(
        years=years,
        window_days=pipeline_config.composite_window_days,
        step_days=14,  # 2-week steps for good coverage
    )

    logger.info(f"  Generated {len(windows)} date windows to process")

    results = []
    for i, (start_date, end_date) in enumerate(windows):
        logger.info(f"\n{'='*40}")
        logger.info(f"Window {i+1}/{len(windows)}: {start_date} to {end_date}")
        logger.info(f"{'='*40}")

        try:
            # Create a modified config for this specific window
            window_config = PipelineConfig(
                composite_window_days=pipeline_config.composite_window_days,
                max_cloud_cover=pipeline_config.max_cloud_cover,
                min_cloud_free_pct=pipeline_config.min_cloud_free_pct,
                write_to_convex=pipeline_config.write_to_convex,
                output_dir=pipeline_config.output_dir,
            )

            # Run pipeline for this window
            result = run_pipeline_for_farm(
                farm_config=farm_config,
                pipeline_config=window_config,
                convex_writer=convex_writer,
            )

            results.append(result)
            logger.info(f"  Window complete: {result['valid_observations']}/{result['total_paddocks']} valid")

        except Exception as e:
            logger.error(f"  Window failed: {e}")
            continue

    logger.info(f"\n{'='*40}")
    logger.info(f"Historical backfill complete")
    logger.info(f"  Processed {len(results)}/{len(windows)} windows successfully")
    total_observations = sum(r['valid_observations'] for r in results)
    logger.info(f"  Total valid observations: {total_observations}")
    logger.info(f"{'='*40}")

    return results


def main():
    """
    Main entry point for running the pipeline from command line.

    Usage:
        python pipeline.py --farm-id <farm-id>
        python pipeline.py --dev  # Use sample data
        python pipeline.py --dev --historical-years 2  # Backfill 2 years
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
    parser.add_argument(
        "--historical-years",
        type=int,
        help="Run historical backfill for N years"
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

        # Use real Convex writer if requested
        convex_writer: Optional[Callable[[list[ObservationRecord]], int]] = None
        if args.write_convex:
            # Use the real Convex writer, not a mock
            convex_writer = write_observations_to_convex

        # Use default sample farm
        from sample_data import sampleFarm, samplePaddocks

        # Check if historical backfill requested
        if args.historical_years:
            logger.info(f"Running historical backfill for {args.historical_years} years")

            farm_config = FarmConfig(
                farm_id="dev-farm-1",
                external_id="farm-1",
                name="Hillcrest Station (Dev)",
                geometry=sampleFarm["geometry"],
                paddocks=samplePaddocks,
                subscription_tier="free",
                planet_api_key=None,
            )

            results = run_historical_backfill(
                farm_config=farm_config,
                years=args.historical_years,
                pipeline_config=pipeline_config,
                convex_writer=convex_writer,
            )

            # Use the most recent result for output
            result = results[-1] if results else None

        else:
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

        from sample_data import sampleFarm, samplePaddocks
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
