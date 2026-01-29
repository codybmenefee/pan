"""
Sample data for development and testing.

This is a Python version of the seed data from app/convex/seedData.ts
"""
from typing import TypedDict, Any
import math

# Updated to match actual Convex farm boundary (cody's 3rd farm)
BASE_LNG = -87.03840752103511
BASE_LAT = 35.64216271005741
HECTARES_PER_SQUARE_METER = 1 / 10000


def calculate_area_hectares(geometry: dict, decimals: int = 1) -> float:
    """Calculate area of a GeoJSON polygon in hectares."""
    if not geometry:
        return 0

    coords = geometry.get("coordinates", [])
    if not coords:
        return 0

    # Use shoelace formula for polygon area
    ring = coords[0]
    if len(ring) < 4:
        return 0

    # Calculate area in square degrees (approximation)
    area_sq_deg = 0
    n = len(ring)
    for i in range(n):
        j = (i + 1) % n
        area_sq_deg += ring[i][0] * ring[j][1]
        area_sq_deg -= ring[j][0] * ring[i][1]

    area_sq_deg = abs(area_sq_deg) / 2

    # Convert to hectares (rough approximation at this latitude)
    # At 35.6N, 1 degree lat ≈ 111km, 1 degree lon ≈ 91km
    sq_km = area_sq_deg * 111 * 91 * 0.5
    hectares = sq_km * 100

    factor = 10 ** decimals
    return round(hectares * factor) / factor


def create_polygon(offset_lng: float, offset_lat: float, size: float) -> dict:
    """Create a square polygon geometry."""
    lng = BASE_LNG + offset_lng
    lat = BASE_LAT + offset_lat
    s = size * 0.005

    return {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [lng, lat],
                [lng + s, lat],
                [lng + s, lat - s],
                [lng, lat - s],
                [lng, lat],
            ]],
        },
    }


def create_farm_boundary(paddock_geometries: list[dict]) -> dict:
    """Create a farm boundary polygon that encompasses all paddocks."""
    all_coords = []
    for geom in paddock_geometries:
        coords = geom.get("geometry", {}).get("coordinates", [])
        if coords:
            all_coords.extend(coords[0])

    if not all_coords:
        return create_polygon(0, 0, 8)

    lons = [c[0] for c in all_coords]
    lats = [c[1] for c in all_coords]

    min_lng = min(lons)
    max_lng = max(lons)
    min_lat = min(lats)
    max_lat = max(lats)

    padding = 0.006

    return {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [min_lng - padding, max_lat + padding],
                [max_lng + padding, max_lat + padding],
                [max_lng + padding, min_lat - padding],
                [min_lng - padding, min_lat - padding],
                [min_lng - padding, max_lat + padding],
            ]],
        },
    }


class PaddockData(TypedDict):
    """Type for paddock data."""
    externalId: str
    name: str
    status: str
    ndvi: float
    restDays: int
    waterAccess: str
    lastGrazed: str
    geometry: dict
    area: float


base_paddocks_raw = [
    {
        "externalId": "p1",
        "name": "South Valley",
        "status": "recovering",
        "ndvi": 0.31,
        "restDays": 14,
        "waterAccess": "Trough (north)",
        "lastGrazed": "Jan 2",
        "geometry": create_polygon(0, 0, 1.2),
    },
    {
        "externalId": "p2",
        "name": "North Flat",
        "status": "almost_ready",
        "ndvi": 0.48,
        "restDays": 19,
        "waterAccess": "Stream (west)",
        "lastGrazed": "Dec 28",
        "geometry": create_polygon(-0.008, 0.006, 1.1),
    },
    {
        "externalId": "p3",
        "name": "Top Block",
        "status": "recovering",
        "ndvi": 0.39,
        "restDays": 16,
        "waterAccess": "Trough (center)",
        "lastGrazed": "Dec 31",
        "geometry": create_polygon(0.006, 0.008, 0.9),
    },
    {
        "externalId": "p4",
        "name": "East Ridge",
        "status": "ready",
        "ndvi": 0.52,
        "restDays": 24,
        "waterAccess": "Creek (east)",
        "lastGrazed": "Dec 23",
        "geometry": create_polygon(0.012, 0.004, 1.0),
    },
    {
        "externalId": "p5",
        "name": "Creek Bend",
        "status": "grazed",
        "ndvi": 0.22,
        "restDays": 3,
        "waterAccess": "Creek (south)",
        "lastGrazed": "Jan 13",
        "geometry": create_polygon(-0.006, -0.008, 1.0),
    },
    {
        "externalId": "p6",
        "name": "West Slope",
        "status": "recovering",
        "ndvi": 0.35,
        "restDays": 12,
        "waterAccess": "Trough (west)",
        "lastGrazed": "Jan 4",
        "geometry": create_polygon(0.004, -0.008, 1.1),
    },
    {
        "externalId": "p7",
        "name": "Creek Side",
        "status": "almost_ready",
        "ndvi": 0.44,
        "restDays": 28,
        "waterAccess": "Creek (east)",
        "lastGrazed": "Dec 19",
        "geometry": create_polygon(0.018, -0.004, 1.3),
    },
    {
        "externalId": "p8",
        "name": "Lower Paddock",
        "status": "grazed",
        "ndvi": 0.19,
        "restDays": 5,
        "waterAccess": "Trough (south)",
        "lastGrazed": "Jan 11",
        "geometry": create_polygon(0.020, -0.012, 1.4),
    },
]

# Calculate areas for each paddock
samplePaddocks: list[dict] = []
for p in base_paddocks_raw:
    area = calculate_area_hectares(p["geometry"])
    samplePaddocks.append({
        **p,
        "area": area,
    })

# Create farm geometry - using actual boundary from Convex
# This matches the live "cody's 3rd farm" boundary
sampleFarm = {
    "externalId": "farm-1",
    "name": "cody's 3rd farm",
    "location": "120 River Heights Dr, Columbia, TN, 38401",
    "totalArea": 96.6,
    "paddockCount": 11,
    "coordinates": [BASE_LNG, BASE_LAT],
    "geometry": {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-87.04434123673687, 35.6462115094798],
                [-87.03247380533335, 35.6462115094798],
                [-87.03247380533335, 35.63811391063503],
                [-87.04434123673687, 35.63811391063503],
                [-87.04434123673687, 35.6462115094798],
            ]],
        },
    },
}

DEFAULT_FARM_EXTERNAL_ID = "farm-1"
DEFAULT_USER_EXTERNAL_ID = "dev-user-1"
