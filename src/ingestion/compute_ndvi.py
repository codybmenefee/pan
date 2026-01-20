"""
Compute NDVI from Sentinel-2 imagery.
"""
import numpy as np
from odc.stac import load

def compute_ndvi(items, aoi_bbox):
    """
    Load NIR and Red bands, compute NDVI.

    NDVI = (NIR - Red) / (NIR + Red)
    NIR = Sentinel-2 Band 8 (near-infrared, 0.78-0.90 µm)
    Red = Sentinel-2 Band 4 (red, 0.65-0.68 µm)

    Args:
        items: STAC items from query
        aoi_bbox: Bounding box for crop

    Returns:
        xarray DataArray with NDVI values
    """
    data = load(
        items,
        bands=["B04", "B08"],
        bbox=aoi_bbox,
        resolution=10,
    )

    red = data.B04.astype("float32") / 10000
    nir = data.B08.astype("float32") / 10000

    with np.errstate(divide="ignore", invalid="ignore"):
        ndvi = (nir - red) / (nir + red)
        ndvi = np.where(np.isfinite(ndvi), ndvi, np.nan)

    return ndvi
