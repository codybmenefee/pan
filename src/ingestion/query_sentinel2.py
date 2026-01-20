"""
Query Microsoft Planetary Computer for Sentinel-2 imagery over farm AOI.
"""
from pystac_client import Client
import planetary_computer

def query_sentinel2(aoi_bbox, start_date, end_date, max_cloud_cover=50):
    """
    Query Sentinel-2 STAC catalog for cloud-free imagery.

    Args:
        aoi_bbox: [west, south, east, north] bounding box
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        max_cloud_cover: Maximum cloud cover percentage

    Returns:
        List of STAC items matching criteria
    """
    catalog = Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=planetary_computer.sign_inplace,
    )

    search = catalog.search(
        collections=["sentinel-2-l2a"],
        bbox=aoi_bbox,
        datetime=f"{start_date}/{end_date}",
        query={
            "eo:cloud_cover": {"lte": max_cloud_cover},
        },
    )

    items = list(search.items())
    print(f"Found {len(items)} cloud-free scenes")
    return items
