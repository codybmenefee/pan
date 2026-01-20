"""
Zonal statistics computation for paddock-level analysis.

Aggregates raster data (NDVI, EVI, NDWI) within polygon boundaries
(paddocks) to produce per-paddock statistics.
"""
from typing import TYPE_CHECKING, TypedDict

import numpy as np
import xarray as xr
import geopandas as gpd
from shapely.geometry import Polygon

if TYPE_CHECKING:
    from typing import Optional


class ZonalStatsResult(TypedDict):
    """Result of zonal statistics computation."""
    paddock_id: str
    ndvi_mean: float
    ndvi_min: float
    ndvi_max: float
    ndvi_std: float
    evi_mean: float
    ndwi_mean: float
    pixel_count: int
    is_valid: bool


def get_bbox_from_data(data: xr.DataArray) -> tuple[float, float, float, float]:
    """
    Get bounding box from xarray DataArray coordinates.

    Args:
        data: DataArray with y and x coordinates

    Returns:
        Tuple (west, south, east, north)
    """
    y_coords = data.coords["y"].values
    x_coords = data.coords["x"].values

    west = float(x_coords.min())
    east = float(x_coords.max())
    south = float(y_coords.min())
    north = float(y_coords.max())

    return (west, south, east, north)


def pixel_centers_to_gdf(data: xr.DataArray) -> gpd.GeoDataFrame:
    """
    Create a GeoDataFrame of pixel centroids from raster data.

    Args:
        data: DataArray with y and x dimensions

    Returns:
        GeoDataFrame with point geometries for each pixel
    """
    y_coords = data.coords["y"].values
    x_coords = data.coords["x"].values

    points = []
    values = []

    for y_idx, y in enumerate(y_coords):
        for x_idx, x in enumerate(x_coords):
            points.append((x, y))
            values.append((y_idx, x_idx))

    from shapely.geometry import Point

    geometries = [Point(p) for p in points]

    gdf = gpd.GeoDataFrame(
        {"pixel_idx": values},
        geometry=geometries,
        crs="EPSG:4326"
    )

    return gdf


def compute_zonal_stats(
    data: xr.DataArray,
    paddocks: list[dict],
    resolution_meters: int = 10
) -> list[ZonalStatsResult]:
    """
    Compute zonal statistics for multiple paddocks.

    For each paddock polygon, calculates:
    - NDVI: mean, min, max, std
    - EVI: mean
    - NDWI: mean
    - Pixel count

    Args:
        data: Composite DataArray with band dimension (nir, red, swir, blue)
        paddocks: List of paddock dictionaries with:
            - id: Paddock identifier
            - geometry: GeoJSON polygon or Shapely polygon
        resolution_meters: Resolution of the data in meters

    Returns:
        List of ZonalStatsResult dictionaries
    """
    import rioxarray  # Enables .rio accessor

    # Ensure data has proper CRS
    if not hasattr(data.rio, "crs"):
        data = data.rio.write_crs("6")

    # Create GeoDataFrame from paddocks
    geometries = []
    paddock_ids = []

    for paddock in paddocks:
        geom = paddock.get("geometry")
        if isinstance(geom, dict):
            from shapely.geometry import shape
            geometry = shape(geom)
        elif hasattr(geom, "geom_type"):
            geometry = geom
        else:
            raise ValueError(f"Invalid geometry for paddock {paddock.get('id')}")

        geometries.append(geometry)
        paddock_ids.append(paddock.get("id"))

    gdf = gpd.GeoDataFrame(
        {"paddock_id": paddock_ids},
        geometry=geometries,
        crs="EPSG:4326"
    )

    # Clip data to each paddock and compute statistics
    results = []

    for idx, row in gdf.iterrows():
        paddock_id = row["paddock_id"]
        polygon = row["geometry"]

        try:
            # Clip raster to polygon
            clipped = data.rio.clip([polygon], from_disk=True)

            # Get pixel values as numpy array
            # Handle both banded and single-band data
            if "band" in clipped.dims:
                # Multi-band data - extract each band
                band_names = list(clipped.coords.get("band", range(clipped.sizes["band"])))

                # For NDVI, we need nir and red bands
                ndvi_data = compute_ndvi_from_bands(clipped, band_names)
                evi_data = compute_evi_from_bands(clipped, band_names)
                ndwi_data = compute_ndwi_from_bands(clipped, band_names)
            else:
                # Single-band (already computed NDVI)
                ndvi_data = clipped.values.flatten()
                evi_data = None
                ndwi_data = None

            # Filter out NaN values
            valid_ndvi = ndvi_data[~np.isnan(ndvi_data)]

            if len(valid_ndvi) == 0:
                # No valid pixels in this paddock
                results.append(create_invalid_result(paddock_id))
                continue

            # Compute statistics
            ndvi_mean = float(np.nanmean(valid_ndvi))
            ndvi_min = float(np.nanmin(valid_ndvi))
            ndvi_max = float(np.nanmax(valid_ndvi))
            ndvi_std = float(np.nanstd(valid_ndvi)) if len(valid_ndvi) > 1 else 0.0

            # EVI and NDWI
            if evi_data is not None:
                valid_evi = evi_data[~np.isnan(evi_data)]
                evi_mean = float(np.nanmean(valid_evi)) if len(valid_evi) > 0 else np.nan
            else:
                evi_mean = np.nan

            if ndwi_data is not None:
                valid_ndwi = ndwi_data[~np.isnan(ndwi_data)]
                ndwi_mean = float(np.nanmean(valid_ndwi)) if len(valid_ndwi) > 0 else np.nan
            else:
                ndwi_mean = np.nan

            # Pixel count
            pixel_count = len(valid_ndvi)

            # Determine validity based on pixel count and data quality
            # A paddock is valid if it has at least 10% of expected pixels
            paddock_area = row.geometry.area * 111000 * 111000  # Approximate area in m²
            expected_pixels = paddock_area / (resolution_meters ** 2)
            min_pixels = max(10, expected_pixels * 0.1)

            is_valid = pixel_count >= min_pixels

            results.append(ZonalStatsResult(
                paddock_id=paddock_id,
                ndvi_mean=ndvi_mean,
                ndvi_min=ndvi_min,
                ndvi_max=ndvi_max,
                ndvi_std=ndvi_std,
                evi_mean=evi_mean,
                ndwi_mean=ndwi_mean,
                pixel_count=pixel_count,
                is_valid=is_valid,
            ))

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Error computing stats for paddock {paddock_id}: {e}")
            results.append(create_invalid_result(paddock_id))

    return results


def compute_ndvi_from_bands(data: xr.DataArray, band_names: list) -> np.ndarray:
    """Compute NDVI array from band data."""
    try:
        nir_idx = band_names.index("nir")
        red_idx = band_names.index("red")
    except ValueError:
        # Try alternative naming
        try:
            nir_idx = band_names.index("B08")
            red_idx = band_names.index("B04")
        except ValueError:
            return np.full(data.values.shape[1:], np.nan)

    nir = data.isel(band=nir_idx).values
    red = data.isel(band=red_idx).values

    with np.errstate(divide="ignore", invalid="ignore"):
        ndvi = (nir - red) / (nir + red)
        return np.where(np.isfinite(ndvi), ndvi, np.nan)


def compute_evi_from_bands(data: xr.DataArray, band_names: list) -> np.ndarray:
    """Compute EVI array from band data."""
    try:
        nir_idx = band_names.index("nir")
        red_idx = band_names.index("red")
        blue_idx = band_names.index("blue")
    except ValueError:
        return np.full(data.values.shape[1:], np.nan)

    nir = data.isel(band=nir_idx).values.astype(float)
    red = data.isel(band=red_idx).values.astype(float)
    blue = data.isel(band=blue_idx).values.astype(float)

    g, c1, c2, l = 2.5, 6.0, 7.5, 1.0

    with np.errstate(divide="ignore", invalid="ignore"):
        evi = g * (nir - red) / (nir + c1 * red - c2 * blue + l)
        return np.where(np.isfinite(evi), evi, np.nan)


def compute_ndwi_from_bands(data: xr.DataArray, band_names: list) -> np.ndarray:
    """Compute NDWI array from band data."""
    try:
        nir_idx = band_names.index("nir")
        swir_idx = band_names.index("swir")
    except ValueError:
        # Try alternative naming
        try:
            nir_idx = band_names.index("B08")
            swir_idx = band_names.index("B11")
        except ValueError:
            return np.full(data.values.shape[1:], np.nan)

    nir = data.isel(band=nir_idx).values.astype(float)
    swir = data.isel(band=swir_idx).values.astype(float)

    with np.errstate(divide="ignore", invalid="ignore"):
        ndwi = (nir - swir) / (nir + swir)
        return np.where(np.isfinite(ndwi), ndwi, np.nan)


def create_invalid_result(paddock_id: str) -> ZonalStatsResult:
    """Create an invalid result for failed computations."""
    return ZonalStatsResult(
        paddock_id=paddock_id,
        ndvi_mean=np.nan,
        ndvi_min=np.nan,
        ndvi_max=np.nan,
        ndvi_std=np.nan,
        evi_mean=np.nan,
        ndwi_mean=np.nan,
        pixel_count=0,
        is_valid=False,
    )


def compute_cloud_free_percentage_for_paddock(
    cloud_free_mask: xr.DataArray,
    polygon: Polygon,
    resolution_meters: int = 10
) -> float:
    """
    Compute cloud-free percentage specifically for a paddock.

    Args:
        cloud_free_mask: Boolean mask where True = cloud-free
        polygon: Paddock polygon
        resolution_meters: Resolution in meters

    Returns:
        Percentage of cloud-free pixels as 0.0-1.0
    """
    import rioxarray

    try:
        # Clip mask to polygon
        clipped = cloud_free_mask.rio.clip([polygon], from_disk=True)

        # Get valid and total pixels
        valid_count = np.sum(~np.isnan(clipped.values))
        total_count = clipped.values.size

        return float(valid_count) / float(total_count) if total_count > 0 else 0.0

    except Exception:
        return 0.0
