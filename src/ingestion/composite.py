"""
Time-series compositing for satellite imagery.

Creates cloud-free composite images from multiple observations over a time window.
Uses median compositing for robustness to outliers.
"""
from typing import TYPE_CHECKING, Literal, TypedDict

import numpy as np
import xarray as xr

if TYPE_CHECKING:
    pass


class CompositeResult(TypedDict):
    """Result of composite generation."""
    composite: xr.DataArray
    valid_pixel_count: int
    total_pixel_count: int
    source_dates: list[str]
    source_count: int


def create_median_composite(
    data_stack: xr.DataArray,
    valid_mask: xr.DataArray | None = None,
    min_valid_observations: int = 1
) -> CompositeResult:
    """
    Create a median composite from a stack of images.

    For each pixel, the median value across all valid observations is used.
    This is robust to outliers (clouds, shadows, anomalies).

    Args:
        data_stack: xarray DataArray with time dimension
                    Shape should be (time, band, y, x) or (time, y, x)
        valid_mask: Boolean mask where True = valid pixel for that observation
                    If None, assumes all pixels are valid
        min_valid_observations: Minimum number of valid observations required
                                for a pixel to be included

    Returns:
        CompositeResult with composite data and metadata
    """
    if data_stack.size == 0:
        raise ValueError("Empty data stack provided")

    # Determine if we have band dimension
    has_bands = len(data_stack.dims) == 4 and "band" in data_stack.dims
    time_dim = "time"

    if has_bands:
        other_dims = ["band", "y", "x"]
    else:
        other_dims = ["y", "x"]

    # Count valid observations per pixel
    if valid_mask is not None:
        # valid_mask should have same shape as single time slice
        valid_count = valid_mask.sum(dim=time_dim, skipna=True)
    else:
        # All observations are valid
        valid_count = xr.full_like(
            data_stack.isel({time_dim: 0}).drop_vars(time_dim, errors="ignore"),
            fill_value=data_stack.sizes[time_dim]
        )

    # Apply minimum valid observations threshold
    valid_pixels = valid_count >= min_valid_observations

    # Compute median along time dimension
    # NaN values are automatically ignored in nanmedian
    if has_bands:
        median_composite = data_stack.median(dim=time_dim, skipna=True)
    else:
        median_composite = data_stack.median(dim=time_dim, skipna=True)

    # Apply valid pixel mask - set invalid pixels to NaN
    if has_bands:
        composite = median_composite.where(valid_pixels)
    else:
        # Add band dimension for masking
        valid_pixels_expanded = valid_pixels.broadcast_like(median_composite)
        composite = median_composite.where(valid_pixels_expanded)

    # Count statistics
    total_pixels = valid_pixels.size
    valid_pixel_count = int(valid_pixels.sum())

    # Extract source dates if available
    source_dates = []
    if "time" in data_stack.coords:
        time_coords = data_stack.coords["time"].values
        source_dates = [str(t) for t in time_coords]

    return CompositeResult(
        composite=composite,
        valid_pixel_count=valid_pixel_count,
        total_pixel_count=total_pixels,
        source_dates=source_dates,
        source_count=data_stack.sizes[time_dim],
    )


def resample_to_resolution(
    data: xr.DataArray,
    target_resolution: int,
    method: Literal["bilinear", "bicubic", "nearest"] = "bilinear"
) -> xr.DataArray:
    """
    Resample data to a target resolution.

    Args:
        data: Input DataArray with spatial dimensions (y, x)
        target_resolution: Target resolution in meters
        method: Resampling method

    Returns:
        Resampled DataArray at target resolution
    """
    from rasterio.warp import calculate_default_transform, reproject, Resampling
    import rasterio

    if "y" not in data.dims or "x" not in data.dims:
        raise ValueError("Data must have 'y' and 'x' dimensions")

    # Get current resolution (assume square pixels, estimate from coordinates)
    y_coords = data.coords["y"].values
    x_coords = data.coords["x"].values

    # Estimate current resolution from coordinate differences
    y_res = abs(y_coords[1] - y_coords[0]) if len(y_coords) > 1 else 0.0001
    x_res = abs(x_coords[1] - x_coords[0]) if len(x_coords) > 1 else 0.0001

    # Convert degrees to approximate meters
    current_res = max(y_res, x_res) * 111000  # ~111km per degree

    if abs(current_res - target_resolution) < 0.1:
        # Already at target resolution
        return data

    # Calculate output dimensions
    width = int(data.sizes["x"] * current_res / target_resolution)
    height = int(data.sizes["y"] * current_res / target_resolution)

    # Ensure reasonable output size
    width = max(min(width, 5000), 10)
    height = max(min(height, 5000), 10)

    # Get bounding box
    left = float(x_coords.min())
    right = float(x_coords.max())
    top = float(y_coords.max())
    bottom = float(y_coords.min())

    # Reproject for each band
    result_bands = []
    band_names = data.coords.get("band", list(range(data.sizes.get("band", 1))))

    for band_idx in range(data.sizes.get("band", 1)):
        if "band" in data.dims:
            band_data = data.isel(band=band_idx)
        else:
            band_data = data

        # Create destination array
        dst_shape = (height, width)
        dst_data = np.zeros(dst_shape, dtype=np.float32)

        # Calculate transform
        dst_transform, dst_width, dst_height = calculate_default_transform(
            "EPSG:4326", "EPSG:4326",
            data.sizes["x"], data.sizes["y"],
            left=left, bottom=bottom, right=right, top=top,
            width=width, height=height
        )

        # Reproject
        reproject(
            band_data.values,
            dst_data,
            src_transform=rasterio.transform.from_bounds(
                left, bottom, right, top,
                data.sizes["x"], data.sizes["y"]
            ),
            src_crs="EPSG:4326",
            dst_transform=dst_transform,
            dst_crs="EPSG:4326",
            resampling=Resampling[method]
        )

        result_bands.append(dst_data)

    # Stack bands back together
    if len(result_bands) == 1:
        result = xr.DataArray(
            result_bands[0],
            dims=["y", "x"],
            coords={
                "y": np.linspace(top, bottom, height),
                "x": np.linspace(left, right, width),
            }
        )
    else:
        result = xr.DataArray(
            np.stack(result_bands),
            dims=["band", "y", "x"],
            coords={
                "band": band_names,
                "y": np.linspace(top, bottom, height),
                "x": np.linspace(left, right, width),
            }
        )

    return result


def merge_providers(
    provider_data: list[xr.DataArray],
    provider_masks: list[xr.DataArray],
    target_resolution: int,
    merge_method: Literal["highest_resolution", "median", "weighted"] = "highest_resolution"
) -> xr.DataArray:
    """
    Merge data from multiple providers.

    For premium farms, we combine Sentinel-2 (10m) and PlanetScope (3m).
    The goal is to produce the highest quality composite at the target resolution.

    Args:
        provider_data: List of DataArrays from each provider
        provider_masks: List of valid masks for each provider
        target_resolution: Target resolution in meters
        merge_method: Strategy for merging

    Returns:
        Merged DataArray at target resolution
    """
    if len(provider_data) == 1:
        return provider_data[0]

    if len(provider_data) == 0:
        raise ValueError("No provider data provided")

    resolutions = [p.resolution_meters if hasattr(p, 'resolution_meters')
                   else 10 for p in provider_data]

    if merge_method == "highest_resolution":
        # Use highest resolution data where available, fall back to others
        highest_res_idx = np.argmin(resolutions)  # Lower number = higher resolution
        highest_res_data = provider_data[highest_res_idx]
        highest_res_mask = provider_masks[highest_res_idx]

        # Resample all others to match
        merged = highest_res_data.copy()
        merged_values = merged.values if "band" in merged.dims else merged.values[np.newaxis, ...]

        for idx, (data, mask) in enumerate(zip(provider_data, provider_masks)):
            if idx == highest_res_idx:
                continue

            # Resample to target
            resampled = resample_to_resolution(data, target_resolution)
            resampled_mask = resample_to_resolution(mask, target_resolution)

            # Where higher resolution has NaN, fill from lower resolution
            for band_idx in range(merged_values.shape[0]):
                band_merged = merged_values[band_idx]
                band_resampled = resampled.values[band_idx] if "band" in resampled.dims else resampled.values

                mask_merged = np.isnan(band_merged)
                band_merged = np.where(mask_merged, band_resampled, band_merged)
                merged_values[band_idx] = band_merged

        return merged

    elif merge_method == "median":
        # Resample all to target resolution, take median
        resampled_data = []
        for data, mask in zip(provider_data, provider_masks):
            resampled = resample_to_resolution(data, target_resolution)
            resampled_mask = resample_to_resolution(mask, target_resolution)
            resampled_data.append(resampled.where(resampled_mask))

        # Stack and take median
        stacked = xr.concat(resampled_data, dim="provider")
        return stacked.median(dim="provider", skipna=True)

    else:
        raise ValueError(f"Unknown merge method: {merge_method}")


def compute_ndvi(data: xr.DataArray) -> xr.DataArray:
    """
    Compute NDVI from NIR and Red bands.

    Args:
        data: DataArray with band dimension including "nir" and "red"

    Returns:
        NDVI DataArray
    """
    if "band" not in data.dims:
        raise ValueError("Data must have 'band' dimension")

    # Get NIR and Red bands
    band_names = data.coords.get("band", list(range(data.sizes["band"])))

    try:
        nir_idx = list(band_names).index("nir")
        red_idx = list(band_names).index("red")
    except ValueError as e:
        # Try alternative naming
        try:
            nir_idx = list(band_names).index("B08") if "B08" in band_names else None
            red_idx = list(band_names).index("B04") if "B04" in band_names else None
            if nir_idx is None or red_idx is None:
                raise e
        except (ValueError, TypeError):
            raise ValueError(
                "Data must contain 'nir' and 'red' bands. "
                f"Available bands: {band_names}"
            )

    nir = data.isel(band=nir_idx)
    red = data.isel(band=red_idx)

    with np.errstate(divide="ignore", invalid="ignore"):
        ndvi = (nir - red) / (nir + red)
        ndvi = np.where(np.isfinite(ndvi), ndvi, np.nan)

    return ndvi


def compute_evi(
    data: xr.DataArray,
    g: float = 2.5,
    c1: float = 6.0,
    c2: float = 7.5,
    l: float = 1.0
) -> xr.DataArray:
    """
    Compute Enhanced Vegetation Index (EVI).

    EVI = G * (NIR - Red) / (NIR + C1*Red - C2*Blue + L)

    Args:
        data: DataArray with band dimension including "nir", "red", "blue"
        g: Gain factor (default 2.5)
        c1: Coefficient 1 for aerosol resistance (default 6.0)
        c2: Coefficient 2 for aerosol resistance (default 7.5)
        l: Canopy background adjustment (default 1.0)

    Returns:
        EVI DataArray
    """
    if "band" not in data.dims:
        raise ValueError("Data must have 'band' dimension")

    band_names = list(data.coords.get("band", []))

    try:
        nir_idx = band_names.index("nir")
        red_idx = band_names.index("red")
        blue_idx = band_names.index("blue")
    except ValueError as e:
        raise ValueError(
            f"Data must contain 'nir', 'red', and 'blue' bands. "
            f"Available bands: {band_names}"
        )

    nir = data.isel(band=nir_idx).astype(float)
    red = data.isel(band=red_idx).astype(float)
    blue = data.isel(band=blue_idx).astype(float)

    with np.errstate(divide="ignore", invalid="ignore"):
        evi = g * (nir - red) / (nir + c1 * red - c2 * blue + l)
        evi = np.where(np.isfinite(evi), evi, np.nan)

    return evi


def compute_ndwi(data: xr.DataArray) -> xr.DataArray:
    """
    Compute Normalized Difference Water Index (NDWI).

    NDWI = (NIR - SWIR) / (NIR + SWIR)

    Used for plant water stress detection.

    Args:
        data: DataArray with band dimension including "nir" and "swir"

    Returns:
        NDWI DataArray
    """
    if "band" not in data.dims:
        raise ValueError("Data must have 'band' dimension")

    band_names = list(data.coords.get("band", []))

    try:
        nir_idx = band_names.index("nir")
        swir_idx = band_names.index("swir")
    except ValueError as e:
        # SWIR might not be available - try with reasonable defaults
        raise ValueError(
            f"Data must contain 'nir' and 'swir' bands. "
            f"Available bands: {band_names}"
        )

    nir = data.isel(band=nir_idx).astype(float)
    swir = data.isel(band=swir_idx).astype(float)

    with np.errstate(divide="ignore", invalid="ignore"):
        ndwi = (nir - swir) / (nir + swir)
        ndwi = np.where(np.isfinite(ndwi), ndwi, np.nan)

    return ndwi
