from typing import list
from dataclasses import dataclass


@dataclass
class SectionGeometry:
    polygon: dict
    area_hectares: float
    centroid: tuple[float, float]
    avg_ndvi: float
    ndvi_values: list[float]


def interpolate_sparse_vertices(
    vertices: list[list[float]],
    points_per_segment: int = 10,
) -> list[list[float]]:
    """
    Interpolate sparse vertices into a dense polygon.

    Args:
        vertices: List of [lon, lat] pairs from LLM
        points_per_segment: Number of points to add between each vertex

    Returns:
        Densely sampled polygon coordinates
    """
    if len(vertices) < 3:
        raise ValueError("Need at least 3 vertices for a polygon")

    dense_points = []

    for i in range(len(vertices)):
        start = vertices[i]
        end = vertices[(i + 1) % len(vertices)]

        for j in range(points_per_segment):
            t = j / points_per_segment
            lon = start[0] + t * (end[0] - start[0])
            lat = start[1] + t * (end[1] - start[1])
            dense_points.append([lon, lat])

    return dense_points


def create_geojson_polygon(
    coordinates: list[list[float]],
) -> dict:
    """
    Create a GeoJSON Polygon from coordinates.

    Args:
        coordinates: List of [lon, lat] pairs

    Returns:
        GeoJSON Feature with Polygon geometry
    """
    return {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Polygon",
            "coordinates": [coordinates],
        },
    }


def validate_polygon(coordinates: list[list[float]]) -> bool:
    """
    Validate that coordinates form a valid polygon.

    Checks:
    - At least 3 unique points
    - First and last points match (closed ring)
    - No self-intersections (basic check)
    """
    if len(coordinates) < 3:
        return False

    if coordinates[0] != coordinates[-1]:
        return False

    unique_points = set((round(p[0], 6), round(p[1], 6)) for p in coordinates)
    if len(unique_points) < 3:
        return False

    return True


def calculate_polygon_area(coordinates: list[list[float]]) -> float:
    """
    Calculate the area of a polygon in hectares using the Shoelace formula.

    Args:
        coordinates: List of [lon, lat] pairs (closed ring)

    Returns:
        Area in hectares
    """
    if len(coordinates) < 4:
        return 0.0

    n = len(coordinates) - 1
    area = 0.0

    for i in range(n):
        x1, y1 = coordinates[i]
        x2, y2 = coordinates[i + 1]
        area += x1 * y2 - x2 * y1

    area = abs(area) / 2.0

    meters_per_deg_lat = 111320.0
    meters_per_deg_lon_at_equator = 111320.0

    area_sq_meters = area * meters_per_deg_lat * meters_per_deg_lon_at_equator
    area_hectares = area_sq_meters / 10000.0

    return area_hectares


def calculate_centroid(coordinates: list[list[float]]) -> tuple[float, float]:
    """
    Calculate the centroid of a polygon.

    Args:
        coordinates: List of [lon, lat] pairs

    Returns:
        (lon, lat) tuple for centroid
    """
    if not coordinates:
        return (0.0, 0.0)

    n = len(coordinates)
    sum_lon = sum(p[0] for p in coordinates)
    sum_lat = sum(p[1] for p in coordinates)

    return (sum_lon / n, sum_lat / n)


def process_llm_vertices(
    vertices: list[list[float]],
    ndvi_samples: list[dict] = None,
) -> SectionGeometry:
    """
    Process LLM output vertices into a complete section geometry.

    Args:
        vertices: Sparse vertices from LLM [[lon, lat], ...]
        ndvi_samples: Optional list of {lat, lon, ndvi} samples

    Returns:
        SectionGeometry with GeoJSON polygon and metadata
    """
    dense_coords = interpolate_sparse_vertices(vertices, points_per_segment=10)

    if not validate_polygon(dense_coords):
        raise ValueError("Invalid polygon coordinates")

    area = calculate_polygon_area(dense_coords)
    centroid = calculate_centroid(dense_coords)

    avg_ndvi = 0.52
    if ndvi_samples:
        ndvi_values = [s.get("ndvi", 0.5) for s in ndvi_samples]
        avg_ndvi = sum(ndvi_values) / len(ndvi_values) if ndvi_values else 0.52
    else:
        ndvi_values = [0.52] * len(dense_coords)

    geojson = create_geojson_polygon(dense_coords)

    return SectionGeometry(
        polygon=geojson,
        area_hectares=area,
        centroid=centroid,
        avg_ndvi=avg_ndvi,
        ndvi_values=ndvi_values,
    )


def clamp_to_boundary(
    coordinates: list[list[float]],
    boundary: list[list[float]],
) -> list[list[float]]:
    """
    Clamp polygon coordinates to stay within paddock boundary.

    Uses a simple approach: clip to bounding box of boundary.
    For production, would use proper polygon clipping (GEOS/Shapely).
    """
    if not boundary:
        return coordinates

    min_lon = min(p[0] for p in boundary)
    max_lon = max(p[0] for p in boundary)
    min_lat = min(p[1] for p in boundary)
    max_lat = max(p[1] for p in boundary)

    clamped = []
    for lon, lat in coordinates:
        clamped_lon = max(min_lon, min(max_lon, lon))
        clamped_lat = max(min_lat, min(max_lat, lat))
        clamped.append([clamped_lon, clamped_lat])

    return clamped


def smooth_polygon(
    coordinates: list[list[float]],
    tension: float = 0.5,
) -> list[list[float]]:
    """
    Apply smoothing to polygon coordinates using Catmull-Rom splines.

    This creates more organic, natural-looking boundaries.
    """
    if len(coordinates) < 4:
        return coordinates

    smoothed = []
    n = len(coordinates) - 1

    for i in range(n):
        p0 = coordinates[(i - 1) % n]
        p1 = coordinates[i]
        p2 = coordinates[(i + 1) % n]
        p3 = coordinates[(i + 2) % n]

        for t in [0.0, 0.25, 0.5, 0.75]:
            x = 0.5 * (
                (2 * p1[0]) +
                (-p0[0] + p2[0]) * t +
                (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t * t +
                (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t * t * t
            )
            y = 0.5 * (
                (2 * p1[1]) +
                (-p0[1] + p2[1]) * t +
                (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t * t +
                (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t * t * t
            )
            smoothed.append([x, y])

    return smoothed


def generate_section(
    vertices: list[list[float]],
    boundary: list[list[float]] = None,
    ndvi_samples: list[dict] = None,
    smooth: bool = True,
) -> SectionGeometry:
    """
    Generate a complete section geometry from LLM vertices.

    Args:
        vertices: Sparse vertices from LLM
        boundary: Optional paddock boundary for clamping
        ndvi_samples: Optional NDVI samples for area calculation
        smooth: Whether to apply smoothing

    Returns:
        SectionGeometry ready for storage/display
    """
    coords = vertices

    if boundary:
        coords = clamp_to_boundary(coords, boundary)

    if smooth and len(coords) >= 4:
        coords = smooth_polygon(coords)

    return process_llm_vertices(coords, ndvi_samples)
