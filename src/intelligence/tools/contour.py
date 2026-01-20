from typing import Optional
from ..tools import registry, ToolResult


@registry.register(
    name="find_contour",
    description="Find coordinates along an NDVI contour at a specific threshold. Starts at given point and walks along the contour.",
    parameters={
        "type": "object",
        "properties": {
            "lat": {
                "type": "number",
                "description": "Starting latitude",
            },
            "lon": {
                "type": "number",
                "description": "Starting longitude",
            },
            "threshold": {
                "type": "number",
                "description": "NDVI contour threshold to trace",
            },
            "max_points": {
                "type": "integer",
                "description": "Maximum number of points to return (default: 50)",
            },
            "paddock_id": {
                "type": "string",
                "description": "Optional paddock ID",
            },
        },
        "required": ["lat", "lon", "threshold"],
    },
)
def find_contour(
    lat: float,
    lon: float,
    threshold: float,
    max_points: int = 50,
    paddock_id: Optional[str] = None,
) -> ToolResult:
    """
    Trace an NDVI contour at the specified threshold.

    In production, this would use marching squares or similar
    algorithms to extract contour lines from the raster.
    """
    try:
        contour_points = _trace_contour(lat, lon, threshold, max_points, paddock_id)
        return ToolResult(success=True, data=contour_points)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


@registry.register(
    name="buffer_point",
    description="Generate a circular buffer around a point. Useful for exploration or creating reference circles.",
    parameters={
        "type": "object",
        "properties": {
            "lat": {
                "type": "number",
                "description": "Center latitude",
            },
            "lon": {
                "type": "number",
                "description": "Center longitude",
            },
            "radius_meters": {
                "type": "number",
                "description": "Radius in meters (default: 100)",
            },
            "num_points": {
                "type": "integer",
                "description": "Number of points in the circle (default: 32)",
            },
        },
        "required": ["lat", "lon"],
    },
)
def buffer_point(
    lat: float,
    lon: float,
    radius_meters: float = 100,
    num_points: int = 32,
) -> ToolResult:
    """
    Generate a circular buffer around a point.

    Returns a list of [lon, lat] coordinates forming a circle.
    """
    try:
        circle_points = _generate_circle(lat, lon, radius_meters, num_points)
        return ToolResult(success=True, data=circle_points)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


@registry.register(
    name="get_contour_bbox",
    description="Get the bounding box of a specific NDVI contour level within a paddock.",
    parameters={
        "type": "object",
        "properties": {
            "threshold": {
                "type": "number",
                "description": "NDVI threshold level",
            },
            "paddock_id": {
                "type": "string",
                "description": "The paddock ID",
            },
        },
        "required": ["threshold", "paddock_id"],
    },
)
def get_contour_bbox(threshold: float, paddock_id: str) -> ToolResult:
    """
    Get the bounding box of a specific NDVI contour.
    """
    try:
        bbox = _fetch_contour_bbox(threshold, paddock_id)
        return ToolResult(success=True, data=bbox)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


@registry.register(
    name="sample_gradient",
    description="Sample NDVI along a gradient from low to high, useful for understanding vegetation patterns.",
    parameters={
        "type": "object",
        "properties": {
            "start_lat": {
                "type": "number",
                "description": "Starting latitude",
            },
            "start_lon": {
                "type": "number",
                "description": "Starting longitude",
            },
            "end_lat": {
                "type": "number",
                "description": "Ending latitude",
            },
            "end_lon": {
                "type": "number",
                "description": "Ending longitude",
            },
            "num_samples": {
                "type": "integer",
                "description": "Number of samples along gradient (default: 20)",
            },
            "paddock_id": {
                "type": "string",
                "description": "Optional paddock ID",
            },
        },
        "required": ["start_lat", "start_lon", "end_lat", "end_lon"],
    },
)
def sample_gradient(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    num_samples: int = 20,
    paddock_id: Optional[str] = None,
) -> ToolResult:
    """
    Sample NDVI along a gradient from start to end point.
    """
    try:
        samples = _fetch_gradient(
            start_lat, start_lon, end_lat, end_lon, num_samples, paddock_id
        )
        return ToolResult(success=True, data=samples)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


def _trace_contour(
    lat: float, lon: float, threshold: float,
    max_points: int, paddock_id: Optional[str]
) -> list:
    """
    Trace an NDVI contour.

    This is a placeholder. In production, this would use:
    - skimage.measure.find_contours (marching squares)
    - Or GDAL contour extraction
    """
    import random
    import math

    points = []
    current_lat, current_lon = lat, lon

    for i in range(max_points):
        points.append([round(current_lon, 6), round(current_lat, 6)])

        angle = random.uniform(-0.5, 0.5)
        step_size = 0.001

        current_lat += step_size * math.cos(angle)
        current_lon += step_size * math.sin(angle)

        if i > 10 and random.random() < 0.1:
            break

    return points


def _generate_circle(
    lat: float, lon: float, radius_meters: float, num_points: int
) -> list:
    """
    Generate a circle around a point.
    """
    import math

    points = []
    lat_rad = math.radians(lat)
    meters_per_deg_lat = 111320
    meters_per_deg_lon = 111320 * math.cos(lat_rad)

    for i in range(num_points):
        angle = 2 * math.pi * i / num_points
        delta_lat = (radius_meters * math.cos(angle)) / meters_per_deg_lat
        delta_lon = (radius_meters * math.sin(angle)) / meters_per_deg_lon

        points.append([
            round(lon + delta_lon, 6),
            round(lat + delta_lat, 6),
        ])

    return points


def _fetch_contour_bbox(threshold: float, paddock_id: str) -> dict:
    """
    Get bounding box of a contour level.
    """
    import random
    return {
        "min_lon": round(174.5 + random.uniform(-0.01, 0), 6),
        "max_lon": round(174.52 + random.uniform(0, 0.01), 6),
        "min_lat": round(-36.82 + random.uniform(-0.01, 0), 6),
        "max_lat": round(-36.8 + random.uniform(0, 0.01), 6),
    }


def _fetch_gradient(
    start_lat: float, start_lon: float,
    end_lat: float, end_lon: float,
    num_samples: int, paddock_id: Optional[str]
) -> list:
    """
    Fetch NDVI along a gradient.
    """
    from .sampling import _fetch_ndvi_at_point

    samples = []
    for i in range(num_samples):
        t = i / (num_samples - 1)
        lat = start_lat + t * (end_lat - start_lat)
        lon = start_lon + t * (end_lon - start_lon)
        ndvi = _fetch_ndvi_at_point(lat, lon, paddock_id)

        samples.append({
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "ndvi": ndvi,
            "distance_pct": round(t * 100, 1),
        })

    return samples
