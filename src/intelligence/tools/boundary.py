from typing import Optional
from ..tools import registry, ToolResult


@registry.register(
    name="get_boundary",
    description="Get the boundary coordinates of a paddock. Returns the exterior ring as a list of [lon, lat] coordinates.",
    parameters={
        "type": "object",
        "properties": {
            "paddock_id": {
                "type": "string",
                "description": "The external ID of the paddock",
            }
        },
        "required": ["paddock_id"],
    },
)
def get_boundary(paddock_id: str) -> ToolResult:
    """
    Get the boundary coordinates of a paddock.

    In production, this would fetch from Convex and return the
    GeoJSON exterior ring coordinates.

    Returns:
        ToolResult with coordinates list [[lon, lat], ...]
    """
    try:
        coordinates = _fetch_paddock_boundary(paddock_id)
        return ToolResult(success=True, data=coordinates)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


def _fetch_paddock_boundary(paddock_id: str) -> list:
    """
    Fetch paddock boundary from data source.

    This is a placeholder that would connect to Convex or
    a cached data store in production.
    """
    import os
    import json

    cache_path = os.getenv("PADDOCK_CACHE_DIR", "/tmp/paddock_cache")
    cache_file = os.path.join(cache_path, f"{paddock_id}.json")

    if os.path.exists(cache_file):
        with open(cache_file) as f:
            data = json.load(f)
            return data.get("coordinates", [])

    return [[174.5, -36.8], [174.52, -36.8], [174.52, -36.82], [174.5, -36.82]]


@registry.register(
    name="get_paddock_centroid",
    description="Get the center point (centroid) of a paddock in [lon, lat] format.",
    parameters={
        "type": "object",
        "properties": {
            "paddock_id": {
                "type": "string",
                "description": "The external ID of the paddock",
            }
        },
        "required": ["paddock_id"],
    },
)
def get_paddock_centroid(paddock_id: str) -> ToolResult:
    """
    Get the centroid of a paddock.
    """
    try:
        boundary = _fetch_paddock_boundary(paddock_id)
        if not boundary or len(boundary) < 3:
            return ToolResult(success=False, error="Invalid boundary")

        lons = [coord[0] for coord in boundary]
        lats = [coord[1] for coord in boundary]

        centroid = [sum(lons) / len(lons), sum(lats) / len(lats)]
        return ToolResult(success=True, data=centroid)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


@registry.register(
    name="get_paddock_area",
    description="Get the area of a paddock in hectares.",
    parameters={
        "type": "object",
        "properties": {
            "paddock_id": {
                "type": "string",
                "description": "The external ID of the paddock",
            }
        },
        "required": ["paddock_id"],
    },
)
def get_paddock_area(paddock_id: str) -> ToolResult:
    """
    Get the area of a paddock in hectares.
    """
    try:
        area = _fetch_paddock_area(paddock_id)
        return ToolResult(success=True, data=area)
    except Exception as e:
        return ToolResult(success=False, error=str(e))


def _fetch_paddock_area(paddock_id: str) -> float:
    """
    Fetch paddock area from data source.
    """
    import os
    import json

    cache_path = os.getenv("PADDOCK_CACHE_DIR", "/tmp/paddock_cache")
    cache_file = os.path.join(cache_path, f"{paddock_id}.json")

    if os.path.exists(cache_file):
        with open(cache_file) as f:
            data = json.load(f)
            return data.get("area", 0.0)

    return 42.5
