"""
Cloud masking utilities for satellite imagery.

Provides functions for applying cloud masks from different sources
(Sentinel-2 SCL, PlanetScope QA, etc.) and computing cloud-free statistics.
"""
from typing import TYPE_CHECKING, Literal

import numpy as np

if TYPE_CHECKING:
    import xarray as xr


SENTINEL2_SCL_CLASSES = {
    0: "no_data",
    1: "saturated_defective",
    2: "dark_area",
    3: "cloud_shadow",
    4: "vegetation",
    5: "bare_soil",
    6: "water",
    7: "unclassified",
    8: "cloud_medium_prob",
    9: "cloud_high_prob",
    10: "thin_cirrus",
    11: "snow_ice",
}

SENTINEL2_VALID_CLASSES = [4, 5, 7]  # vegetation, bare_soil, unclassified


def mask_sentinel2_scl(
    scl_data: 'xr.DataArray',
    valid_classes: list[int] = SENTINEL2_VALID_CLASSES
) -> 'xr.DataArray':
    """
    Create a mask from Sentinel-2 SCL (Scene Classification) band.

    Args:
        scl_data: xarray DataArray with SCL classification values
        valid_classes: List of SCL class values to include as valid

    Returns:
        Boolean mask where True = valid (not cloud/masked)
    """
    return scl_data.isin(valid_classes)


def compute_cloud_free_percentage(
    mask: 'xr.DataArray',
    nodata_value: float = np.nan
) -> float:
    """
    Calculate the percentage of valid (non-masked) pixels.

    Args:
        mask: Boolean mask where True = valid
        nodata_value: Value to treat as no data

    Returns:
        Percentage of valid pixels as 0.0-1.0
    """
    valid_mask = mask & (~np.isnan(mask))

    if valid_mask.size == 0:
        return 0.0

    valid_count = valid_mask.sum()
    total_count = valid_mask.size

    return float(valid_count) / float(total_count)


def apply_mask_to_data(
    data: 'xr.DataArray',
    mask: 'xr.DataArray',
    nodata_value: float = np.nan
) -> 'xr.DataArray':
    """
    Apply a mask to data, setting masked pixels to nodata_value.

    Args:
        data: Data to mask
        mask: Boolean mask where False = masked out
        nodata_value: Value to use for masked pixels

    Returns:
        Masked data array
    """
    masked = data.where(mask, other=nodata_value)
    return masked


def create_combined_mask(
    masks: list['xr.DataArray'],
    combine_mode: Literal["union", "intersection"] = "union"
) -> 'xr.DataArray':
    """
    Combine multiple masks into a single mask.

    Args:
        masks: List of boolean masks
        combine_mode: "union" = any mask says valid = valid (OR)
                      "intersection" = all masks must say valid (AND)

    Returns:
        Combined boolean mask
    """
    if not masks:
        raise ValueError("No masks provided")

    combined = masks[0]

    for mask in masks[1:]:
        if combine_mode == "union":
            combined = combined | mask
        else:  # intersection
            combined = combined & mask

    return combined


def dilate_mask(
    mask: 'xr.DataArray',
    iterations: int = 1
) -> 'xr.DataArray':
    """
    Dilate a mask to include boundary pixels around valid areas.

    This helps exclude pixels near cloud edges that may be affected
    by atmospheric scattering.

    Args:
        mask: Boolean mask to dilate
        iterations: Number of dilation iterations

    Returns:
        Dilated mask
    """
    from scipy.ndimage import binary_dilation

    mask_values = mask.values.astype(bool)
    dilated = binary_dilation(mask_values, iterations=iterations)
    return mask.copy(data=dilated)


def erode_mask(
    mask: 'xr.DataArray',
    iterations: int = 1
) -> 'xr.DataArray':
    """
    Erode a mask to exclude boundary pixels around valid areas.

    Args:
        mask: Boolean mask to erode
        iterations: Number of erosion iterations

    Returns:
        Eroded mask
    """
    from scipy.ndimage import binary_erosion

    mask_values = mask.values.astype(bool)
    eroded = binary_erosion(mask_values, iterations=iterations)
    return mask.copy(data=eroded)


def fill_holes_in_mask(
    mask: 'xr.DataArray',
    max_hole_size: int = 100
) -> 'xr.DataArray':
    """
    Fill small holes in the mask.

    Args:
        mask: Boolean mask
        max_hole_size: Maximum hole size to fill (in pixels)

    Returns:
        Mask with small holes filled
    """
    from scipy.ndimage import binary_fill_holes

    mask_values = mask.values.astype(bool)
    filled = binary_fill_holes(mask_values)
    return mask.copy(data=filled)


class CloudMaskingResult:
    """Result of applying cloud masking."""

    def __init__(
        self,
        masked_data: 'xr.DataArray',
        cloud_free_pct: float,
        original_mask: 'xr.DataArray',
        mask_metadata: dict | None = None
    ):
        self.masked_data = masked_data
        self.cloud_free_pct = cloud_free_pct
        self.original_mask = original_mask
        self.mask_metadata = mask_metadata or {}

    def __repr__(self) -> str:
        return (
            f"CloudMaskingResult(cloud_free_pct={self.cloud_free_pct:.1%}, "
            f"shape={self.masked_data.shape})"
        )


def mask_data_with_quality_assessment(
    data: 'xr.DataArray',
    quality_data: 'xr.DataArray',
    valid_quality_values: list[int] | None = None,
    quality_band_name: str = "qa"
) -> CloudMaskingResult:
    """
    Apply quality assessment masking.

    Args:
        data: Data to mask
        quality_data: Quality assessment band
        valid_quality_values: List of valid QA values (None = all valid)
        quality_band_name: Name for metadata

    Returns:
        CloudMaskingResult with masked data and statistics
    """
    if valid_quality_values is None:
        valid_quality_values = [0]  # Default: only clear pixels

    mask = quality_data.isin(valid_quality_values)
    cloud_free_pct = compute_cloud_free_percentage(mask)

    masked_data = apply_mask_to_data(data, mask)

    return CloudMaskingResult(
        masked_data=masked_data,
        cloud_free_pct=cloud_free_pct,
        original_mask=mask,
        mask_metadata={
            "quality_band_name": quality_band_name,
            "valid_values": valid_quality_values,
        }
    )
