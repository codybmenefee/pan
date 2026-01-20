import json
from pathlib import Path
from typing import Optional
from dataclasses import dataclass


@dataclass
class ToolResult:
    success: bool
    data: any = None
    error: str = None


class ToolRegistry:
    def __init__(self):
        self._tools = {}

    def register(self, name: str, description: str, parameters: dict):
        def decorator(func):
            self._tools[name] = (func, {"description": description, "parameters": parameters})
            return func
        return decorator

    def get_tool(self, name: str):
        if name not in self._tools:
            raise ValueError(f"Unknown tool: {name}")
        return self._tools[name]

    def list_tools(self):
        return {name: info for name, info in self._tools.items()}

    def get_descriptions(self):
        return {
            name: info[1]
            for name, info in self._tools.items()
        }


registry = ToolRegistry()


@registry.register(
    name="sample_ndvi",
    description="Sample the NDVI value at a specific geographic coordinate.",
    parameters={
        "type": "object",
        "properties": {
            "lat": {"type": "number", "description": "Latitude"},
            "lon": {"type": "number", "description": "Longitude"},
            "paddock_id": {"type": "string", "description": "Optional paddock ID"},
        },
        "required": ["lat", "lon"],
    },
)
def sample_ndvi(lat: float, lon: float, paddock_id: Optional[str] = None) -> ToolResult:
    import random
    return ToolResult(success=True, data={
        "ndvi": round(random.uniform(0.35, 0.65), 2),
        "lat": lat,
        "lon": lon,
        "source": "sentinel2",
    })


@registry.register(
    name="get_boundary",
    description="Get the boundary coordinates of a paddock.",
    parameters={
        "type": "object",
        "properties": {
            "paddock_id": {"type": "string", "description": "The external ID of the paddock"},
        },
        "required": ["paddock_id"],
    },
)
def get_boundary(paddock_id: str) -> ToolResult:
    return ToolResult(success=True, data=[
        [174.5, -36.8], [174.52, -36.8], [174.52, -36.82], [174.5, -36.82]
    ])


@registry.register(
    name="find_contour",
    description="Find coordinates along an NDVI contour at a specific threshold.",
    parameters={
        "type": "object",
        "properties": {
            "lat": {"type": "number"},
            "lon": {"type": "number"},
            "threshold": {"type": "number"},
            "max_points": {"type": "integer"},
        },
        "required": ["lat", "lon", "threshold"],
    },
)
def find_contour(lat: float, lon: float, threshold: float, max_points: int = 50) -> ToolResult:
    import random
    import math
    points = []
    for i in range(max_points):
        points.append([round(lon + random.uniform(-0.01, 0.01), 6),
                       round(lat + random.uniform(-0.01, 0.01), 6)])
    return ToolResult(success=True, data=points)


@registry.register(
    name="get_highest_ndvi_region",
    description="Find the region with the highest NDVI values.",
    parameters={
        "type": "object",
        "properties": {
            "paddock_id": {"type": "string"},
            "num_points": {"type": "integer"},
        },
        "required": ["paddock_id"],
    },
)
def get_highest_ndvi_region(paddock_id: str, num_points: int = 5) -> ToolResult:
    import random
    points = []
    for _ in range(num_points):
        points.append({
            "lat": round(-36.8 + random.uniform(-0.01, 0.01), 6),
            "lon": round(174.5 + random.uniform(-0.01, 0.01), 6),
            "ndvi": round(random.uniform(0.60, 0.70), 2),
        })
    return ToolResult(success=True, data=points)


def interpolate_sparse_vertices(vertices, points_per_segment: int = 10):
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


def create_geojson_polygon(coordinates):
    return {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Polygon",
            "coordinates": [coordinates],
        },
    }


def calculate_polygon_area(coordinates):
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
    meters_per_deg_lon = 111320.0
    area_sq_meters = area * meters_per_deg_lat * meters_per_deg_lon
    return area_sq_meters / 10000.0


def generate_section(vertices):
    dense_coords = interpolate_sparse_vertices(vertices, points_per_segment=10)
    area = calculate_polygon_area(dense_coords)
    avg_ndvi = 0.52
    geojson = create_geojson_polygon(dense_coords)
    return {
        "polygon": geojson,
        "area_hectares": area,
        "avg_ndvi": avg_ndvi,
    }


def load_context_from_dict(data):
    from dataclasses import dataclass

    @dataclass
    class PaddockContext:
        external_id: str
        name: str
        area: float
        ndvi_mean: float
        ndvi_std: float
        ndvi_trend: str
        rest_days: int
        days_grazed: int
        total_planned: int
        deterministic_score: float

    @dataclass
    class FarmContext:
        external_id: str
        name: str
        active_paddock: PaddockContext
        alternatives: list
        min_ndvi_threshold: float
        min_rest_period: int
        default_section_pct: float
        date: str

    return FarmContext(
        external_id=data.get("externalId", ""),
        name=data.get("name", "Test Farm"),
        active_paddock=PaddockContext(
            external_id=data.get("activePaddockId", "p1"),
            name=data.get("activePaddockName", "Test Paddock"),
            area=data.get("activeArea", 42.5),
            ndvi_mean=data.get("activeNdvi", 0.52),
            ndvi_std=data.get("activeNdviStd", 0.08),
            ndvi_trend=data.get("activeNdviTrend", "stable"),
            rest_days=data.get("activeRestDays", 28),
            days_grazed=data.get("activeDaysGrazed", 2),
            total_planned=data.get("activeTotalPlanned", 4),
            deterministic_score=data.get("activeScore", 0.78),
        ),
        alternatives=[],
        min_ndvi_threshold=data.get("minNdviThreshold", 0.40),
        min_rest_period=data.get("minRestPeriod", 21),
        default_section_pct=data.get("defaultSectionPct", 0.20),
        date=data.get("date", "2026-01-20"),
    )


def render_user_prompt(context):
    alternatives_table = ""
    deterministic_scores = ""
    previous_sections = "No previous sections recorded."

    values = {
        "farm_name": context.name,
        "date": context.date,
        "active_paddock_id": context.active_paddock.external_id,
        "active_paddock_name": context.active_paddock.name,
        "active_paddock_area": f"{context.active_paddock.area:.1f}",
        "active_ndvi_mean": f"{context.active_paddock.ndvi_mean:.2f}",
        "active_ndvi_std": f"{context.active_paddock.ndvi_std:.3f}",
        "active_ndvi_trend": context.active_paddock.ndvi_trend,
        "active_rest_days": str(context.active_paddock.rest_days),
        "active_days_grazed": str(context.active_paddock.days_grazed),
        "active_total_planned": str(context.active_paddock.total_planned),
        "active_progress_pct": f"{(context.active_paddock.days_grazed / context.active_paddock.total_planned * 100):.0f}" if context.active_paddock.total_planned > 0 else "0",
        "alternatives_table": alternatives_table,
        "deterministic_scores_table": deterministic_scores,
        "previous_sections": previous_sections,
        "min_ndvi_threshold": f"{context.min_ndvi_threshold:.2f}",
        "min_rest_period": str(context.min_rest_period),
        "default_section_pct": f"{context.default_section_pct * 100:.0f}",
    }

    prompt = f"""
## FARM CONTEXT

**Farm**: {values["farm_name"]}
**Date**: {values["date"]}

## ACTIVE PADDLOCK STATUS

| Field | Value |
|-------|-------|
| ID | {values["active_paddock_id"]} |
| Name | {values["active_paddock_name"]} |
| Area | {values["active_paddock_area"]} ha |
| NDVI Mean | {values["active_ndvi_mean"]} |
| NDVI Std | {values["active_ndvi_std"]} |
| NDVI Trend | {values["active_ndvi_trend"]} |
| Rest Days | {values["active_rest_days"]} |
| Days in Rotation | {values["active_days_grazed"]} / {values["active_total_planned"]} |
| Rotation Progress | {values["active_progress_pct"]}% |

## YOUR TASK

Based on the paddock data, recommend today's grazing section.

## OUTPUT

Provide your recommendation as a JSON object:

```json
{{{{
  "action": "stay" | "transition",
  "targetPaddockId": "p4",
  "targetPaddockName": "East Ridge",
  "confidence": 0.85,
  "vertices": [
    [174.505, -36.801],
    [174.510, -36.805],
    ...
  ],
  "reasoning": [
    "High NDVI zone in northeast corner (0.62-0.67)",
    "Avoids previously grazed sections to south"
  ]
}}}}
```

Begin by exploring the NDVI distribution using available tools.
"""
    return prompt


def generate_daily_plan(context_data):
    context = load_context_from_dict(context_data)
    user_prompt = render_user_prompt(context)

    print(f"Farm: {context.name}")
    print(f"Active Paddock: {context.active_paddock.name}")
    print(f"NDVI: {context.active_paddock.ndvi_mean}")
    print(f"Days Grazed: {context.active_paddock.days_grazed}/{context.active_paddock.total_planned}")
    print()

    tools = registry.get_descriptions()
    print("Available tools:", list(tools.keys()))
    print()

    if context.active_paddock.days_grazed < context.active_paddock.total_planned * 0.6:
        action = "stay"
        target_paddock = context.active_paddock.external_id
        target_name = context.active_paddock.name
        confidence = context.active_paddock.deterministic_score
        reasoning = [
            f"Day {context.active_paddock.days_grazed} of {context.active_paddock.total_planned} rotation",
            f"NDVI {context.active_paddock.ndvi_mean} indicates healthy forage",
            "Stay in current paddock with 40%+ capacity remaining"
        ]
    else:
        action = "transition"
        target_paddock = "p2"
        target_name = "Alternative Paddock"
        confidence = 0.65
        reasoning = [
            f"Rotation nearly complete ({context.active_paddock.days_grazed}/{context.active_paddock.total_planned})",
            "Consider transitioning to fresh paddock",
            "Alternative paddock shows good recovery"
        ]

    vertices = [
        [174.505 + (i * 0.002), -36.801 + (i * 0.003)] for i in range(6)
    ]
    vertices.append(vertices[0])

    section = generate_section(vertices)

    return {
        "action": action,
        "targetPaddockId": target_paddock,
        "targetPaddockName": target_name,
        "confidence": confidence,
        "vertices": vertices,
        "reasoning": reasoning,
        "sectionGeometry": section["polygon"],
        "sectionAreaHectares": round(section["area_hectares"], 2),
        "sectionCentroid": [174.51, -36.81],
        "sectionAvgNdvi": section["avg_ndvi"],
    }


if __name__ == "__main__":
    sample_context = {
        "externalId": "farm-001",
        "name": "Morning Creek",
        "activePaddockId": "p4",
        "activePaddockName": "East Ridge",
        "activeArea": 42.5,
        "activeNdvi": 0.52,
        "activeNdviStd": 0.08,
        "activeNdviTrend": "stable",
        "activeRestDays": 28,
        "activeDaysGrazed": 2,
        "activeTotalPlanned": 4,
        "activeScore": 0.78,
    }

    result = generate_daily_plan(sample_context)
    print(json.dumps(result, indent=2))
