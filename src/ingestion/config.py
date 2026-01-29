"""
Configuration loading for the processing pipeline.

Loads configuration from environment variables and supports
fetching farm settings from Convex for tier-based provider selection.
"""
import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class FarmConfig:
    """Configuration for a single farm."""
    farm_id: str
    external_id: str
    name: str
    geometry: dict  # GeoJSON Feature
    paddocks: list[dict]  # List of paddock dictionaries
    subscription_tier: str = "free"
    planet_api_key: Optional[str] = None

    # Processing settings
    ndvi_threshold: float = 0.4
    min_rest_period: int = 21
    cloud_cover_tolerance: int = 50
    composite_window_days: int = 21

    @property
    def is_premium(self) -> bool:
        """Check if farm has premium tier."""
        return self.subscription_tier == "premium"


@dataclass
class PipelineConfig:
    """Global pipeline configuration."""
    # Satellite data settings
    composite_window_days: int = 21
    max_cloud_cover: int = 50
    min_cloud_free_pct: float = 0.3

    # Provider settings
    default_provider: str = "sentinel2"
    enable_planet_scope: bool = False

    # Output settings
    output_dir: str = "output"
    write_to_convex: bool = True

    # Logging
    log_level: str = "INFO"


def load_env_config() -> PipelineConfig:
    """
    Load configuration from environment variables.

    Environment variables:
    - COMPOSITE_WINDOW_DAYS: Days for time-series composite (default: 21)
    - MAX_CLOUD_COVER: Max cloud cover percentage (default: 50)
    - MIN_CLOUD_FREE_PCT: Min cloud-free % for valid observation (default: 0.3)
    - DEFAULT_PROVIDER: Default satellite provider (default: sentinel2)
    - ENABLE_PLANET_SCOPE: Enable PlanetScope integration (default: false)
    - OUTPUT_DIR: Output directory (default: output)
    - WRITE_TO_CONVEX: Write results to Convex (default: true)
    - CONVEX_DEPLOYMENT_URL: Convex deployment URL (required for writing)
    - CONVEX_API_KEY: Convex API key (required for writing)
    - LOG_LEVEL: Logging level (default: INFO)
    """
    def get_int(key: str, default: int) -> int:
        val = os.environ.get(key)
        if val is None:
            return default
        try:
            return int(val)
        except ValueError:
            return default

    def get_float(key: str, default: float) -> float:
        val = os.environ.get(key)
        if val is None:
            return default
        try:
            return float(val)
        except ValueError:
            return default

    def get_bool(key: str, default: bool) -> bool:
        val = os.environ.get(key)
        if val is None:
            return default
        return val.lower() in ("true", "1", "yes")

    return PipelineConfig(
        composite_window_days=get_int("COMPOSITE_WINDOW_DAYS", 21),
        max_cloud_cover=get_int("MAX_CLOUD_COVER", 50),
        min_cloud_free_pct=get_float("MIN_CLOUD_FREE_PCT", 0.3),
        default_provider=os.environ.get("DEFAULT_PROVIDER", "sentinel2"),
        enable_planet_scope=get_bool("ENABLE_PLANET_SCOPE", False),
        output_dir=os.environ.get("OUTPUT_DIR", "output"),
        write_to_convex=get_bool("WRITE_TO_CONVEX", True),
        log_level=os.environ.get("LOG_LEVEL", "INFO"),
    )


def create_farm_config_from_convex(
    farm_data: dict,
    settings_data: dict | None = None,
    paddocks_data: list[dict] | None = None
) -> FarmConfig:
    """
    Create FarmConfig from Convex data.

    Args:
        farm_data: Farm document from Convex
        settings_data: Farm settings document (optional)
        paddocks_data: List of paddock documents (optional)

    Returns:
        FarmConfig instance
    """
    # Extract farm geometry
    geometry = farm_data.get("geometry", {})

    # Extract paddocks
    paddocks = []
    if paddocks_data:
        for p in paddocks_data:
            paddocks.append({
                "id": p.get("externalId", p.get("id")),
                "name": p.get("name"),
                "geometry": p.get("geometry", {}),
                "area": p.get("area"),
                "last_grazed": p.get("lastGrazed"),
            })

    # Extract settings
    if settings_data:
        subscription_tier = settings_data.get("subscriptionTier", "free")
        planet_api_key = settings_data.get("planetScopeApiKey")

        return FarmConfig(
            farm_id=str(farm_data.get("_id")),
            external_id=farm_data.get("externalId", ""),
            name=farm_data.get("name", "Unknown Farm"),
            geometry=geometry,
            paddocks=paddocks,
            subscription_tier=subscription_tier,
            planet_api_key=planet_api_key,
            ndvi_threshold=settings_data.get("minNDVIThreshold", 0.4),
            min_rest_period=settings_data.get("minRestPeriod", 21),
            cloud_cover_tolerance=settings_data.get("cloudCoverTolerance", 50),
            composite_window_days=21,
        )

    # Default settings if no Convex data
    return FarmConfig(
        farm_id=str(farm_data.get("_id")),
        external_id=farm_data.get("externalId", ""),
        name=farm_data.get("name", "Unknown Farm"),
        geometry=geometry,
        paddocks=paddocks,
        subscription_tier="free",
        planet_api_key=None,
        ndvi_threshold=0.4,
        min_rest_period=21,
        cloud_cover_tolerance=50,
        composite_window_days=21,
    )


def get_farm_bbox(farm_config: FarmConfig) -> list[float]:
    """
    Get bounding box from farm geometry.

    Args:
        farm_config: Farm configuration with geometry

    Returns:
        Bounding box [west, south, east, north]
    """
    geometry = farm_config.geometry

    if not geometry:
        raise ValueError("Farm geometry is required")

    # Handle GeoJSON Feature or FeatureCollection
    if geometry.get("type") == "FeatureCollection":
        features = geometry.get("features", [])
        if not features:
            raise ValueError("Empty FeatureCollection")
        geometry = features[0]

    if geometry.get("type") == "Feature":
        geometry = geometry.get("geometry", {})

    coords = geometry.get("coordinates", [])

    if not coords:
        raise ValueError("No coordinates in geometry")

    # Handle Polygon - first ring contains the exterior boundary
    if geometry.get("type") == "Polygon":
        ring = coords[0] if coords else []
        lons = [c[0] for c in ring]
        lats = [c[1] for c in ring]

        return [
            min(lons),  # west
            min(lats),  # south
            max(lons),  # east
            max(lats),  # north
        ]

    raise ValueError(f"Unsupported geometry type: {geometry.get('type')}")


def get_paddocks_geojson(paddocks: list[dict]) -> list[dict]:
    """
    Extract paddock geometries for zonal stats computation.

    Args:
        paddocks: List of paddock dictionaries

    Returns:
        List of GeoJSON Feature dictionaries
    """
    features = []

    for paddock in paddocks:
        geometry = paddock.get("geometry", {})
        if not geometry:
            continue

        feature = {
            "type": "Feature",
            "properties": {
                "id": paddock.get("externalId", paddock.get("id")),
                "name": paddock.get("name"),
            },
            "geometry": geometry,
        }
        features.append(feature)

    return features
