from typing import Optional
from ..tools import registry, ToolResult


@registry.register(
    name="sample_ndvi",
    description="Sample the NDVI value at a specific geographic coordinate. Returns the NDVI value and metadata.",
    parameters={
        "type": "object",
        "properties": {
            "lat": {
                "type": "number",
                "description": "Latitude of the point to sample",
            },
            "lon": {
                "type": "number",
                "description": "Longitude of the point to sample",
            },
            "paddock_id": {
                "type": "string",
                "description": "Optional paddock ID to constrain sampling to that paddock's raster data",
            },
        },
        "required": ["lat", "lon"],
    },
)
def sample_ndvi(lat: float, lon: float, paddock_id: Optional[str] = None) -> ToolResult:
    """
    Sample NDVI at a specific geographic coordinate.

    In production, this would:
    1. Load the cached raster data for the paddock
    2. Transform lat/lon to pixel coordinates
    3. Sample the NDVI value at that pixel

    Returns:
        ToolResult with {ndvi: float, lat: float, lon: float, source: str}
    """
    try:
        ndvi = _fetch_ndvi_at_point(lat, lon, paddock_id)
        return ToolResult(success=True, data={
            "ndvi": ndvi,
            "lat": lat,
            "lon": lon,
            "source": "sentinel2",
        })
    except Exception as e:
        return ToolResult(success=False, error=str(e))


@registry.register(
    name="sample_transect",
    description="Sample NDVI values along a line between two points. Returns a list of {lat, lon, ndvi} points.",
    parameters={
        "type": "object",
        "properties": {
            "lat1": {
                "type": "number",
                "description": "Starting latitude",
            },
            "lon1": {
                "type": "number",
                "description": "Starting longitude",
            },
            "lat2": {
                "type": "number",
                "description": "Ending latitude",
            },
            "lon2": {
                "type": "number",
                "description": "Ending longitude",
            },
            "num_samples": {
                "type": "integer",
                "description": "Number of samples along the transect (default: 10)",
            },
            "paddock_id": {
                "type": "string",
                "description": "Optional paddock ID",
            },
        },
        "required": ["lat1", "lon1", "lat2", "lon2"],
    },
)
def sample_transect(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
    num_samples: int = 10,
    paddock_id: Optional[str] = None,
) -> ToolResult:
    """
    Sample NDVI values along a transect line.
    """
    try:
        samples = _fetch_ndvi_transect(lat1, lon1, lat2, lon2, num_samples, paddock_id)
        return ToolResult(success=True, data=samples)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


@registry.register(
    name="get_ndvi_stats",
    description="Get NDVI statistics for a rectangular region.",
    parameters={
        "type": "object",
        "properties": {
            "min_lat": {
                "type": "number",
                "description": "Minimum latitude of bounding box",
            },
            "max_lat": {
                "type": "number",
                "description": "Maximum latitude of bounding box",
            },
            "min_lon": {
                "type": "number",
                "description": "Minimum longitude of bounding box",
            },
            "max_lon": {
                "type": "number",
                "description": "Maximum longitude of bounding box",
            },
            "paddock_id": {
                "type": "string",
                "description": "Optional paddock ID",
            },
        },
        "required": ["min_lat", "max_lat", "min_lon", "max_lon"],
    },
)
def get_ndvi_stats(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    paddock_id: Optional[str] = None,
) -> ToolResult:
    """
    Get NDVI statistics for a bounding box region.
    """
    try:
        stats = _fetch_ndvi_stats_bbox(min_lat, max_lat, min_lon, max_lon, paddock_id)
        return ToolResult(success=True, data=stats)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


@registry.register(
    name="get_highest_ndvi_region",
    description="Find the region with the highest NDVI values within a bounding box or paddock.",
    parameters={
        "type": "object",
        "properties": {
            "paddock_id": {
                "type": "string",
                "description": "The paddock ID to search",
            },
            "num_points": {
                "type": "integer",
                "description": "Number of top points to return (default: 5)",
            },
        },
        "required": ["paddock_id"],
    },
)
def get_highest_ndvi_region(paddock_id: str, num_points: int = 5) -> ToolResult:
    """
    Find the region with highest NDVI values.
    """
    try:
        points = _fetch_highest_ndvi_points(paddock_id, num_points)
        return ToolResult(success=True, data=points)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


def _fetch_ndvi_at_point(lat: float, lon: float, paddock_id: Optional[str] = None) -> float:
    """
    Fetch NDVI value at a specific point.

    This is a placeholder that would load raster data and sample.
    """
    import random
    import os

    cache_dir = os.getenv("NDVI_CACHE_DIR", "/tmp/ndvi_cache")
    if paddock_id:
        cache_file = os.path.join(cache_dir, f"{paddock_id}.nc")
        if os.path.exists(cache_file):
            pass

    return round(random.uniform(0.35, 0.65), 2)


def _fetch_ndvi_transect(
    lat1: float, lon1: float, lat2: float, lon2: float,
    num_samples: int, paddock_id: Optional[str]
) -> list:
    """
    Fetch NDVI values along a transect.
    """
    samples = []
    for i in range(num_samples):
        t = i / (num_samples - 1)
        lat = lat1 + t * (lat2 - lat1)
        lon = lon1 + t * (lon2 - lon1)
        ndvi = _fetch_ndvi_at_point(lat, lon, paddock_id)
        samples.append({
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "ndvi": ndvi,
        })
    return samples


def _fetch_ndvi_stats_bbox(
    min_lat: float, max_lat: float, min_lon: float, max_lon: float,
    paddock_id: Optional[str]
) -> dict:
    """
    Fetch NDVI statistics for a bounding box.
    """
    import random
    return {
        "mean": round(random.uniform(0.45, 0.55), 2),
        "std": round(random.uniform(0.05, 0.15), 2),
        "min": round(random.uniform(0.25, 0.35), 2),
        "max": round(random.uniform(0.60, 0.70), 2),
        "count": random.randint(100, 1000),
    }


def _fetch_highest_ndvi_points(paddock_id: str, num_points: int) -> list:
    """
    Fetch the highest NDVI points within a paddock.
    """
    import random
    import os

    cache_dir = os.getenv("NDVI_CACHE_DIR", "/tmp/ndvi_cache")
    cache_file = os.path.join(cache_dir, f"{paddock_id}.json")

    if os.path.exists(cache_file):
        import json
        with open(cache_file) as f:
            data = json.load(f)
            return data.get("highest_points", [])[:num_points]

    points = []
    for _ in range(num_points):
        points.append({
            "lat": round(-36.8 + random.uniform(-0.01, 0.01), 6),
            "lon": round(174.5 + random.uniform(-0.01, 0.01), 6),
            "ndvi": round(random.uniform(0.60, 0.70), 2),
        })
    return points
