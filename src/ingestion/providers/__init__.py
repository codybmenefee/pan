"""
Provider abstraction layer for satellite data sources.

This module provides a common interface for different satellite providers,
allowing the pipeline to work with Sentinel-2, PlanetScope, and future
providers through a unified API.
"""
from abc import ABC, abstractmethod
from typing import Protocol, TypedDict


# Provider-specific exceptions
class ProviderError(Exception):
    """Base exception for satellite provider errors."""
    pass


class ActivationTimeoutError(ProviderError):
    """Raised when asset activation times out (Planet API specific)."""
    def __init__(self, item_id: str, asset_type: str, timeout: int):
        self.item_id = item_id
        self.asset_type = asset_type
        self.timeout = timeout
        super().__init__(
            f"Asset activation timed out after {timeout}s for item {item_id}, "
            f"asset type {asset_type}"
        )


class QuotaExceededError(ProviderError):
    """Raised when provider quota or rate limit is exceeded."""
    def __init__(self, provider: str, message: str = ""):
        self.provider = provider
        super().__init__(f"Quota exceeded for {provider}: {message}" if message else f"Quota exceeded for {provider}")


class BandNames(TypedDict, total=False):
    """Map semantic band names to provider-specific identifiers."""
    nir: str   # Near-infrared
    red: str   # Red
    green: str # Green (for RGB composite)
    swir: str  # Short-wave infrared (optional)
    blue: str  # Blue (optional for some computations)


class SatelliteProvider(Protocol):
    """
    Protocol defining the interface for satellite data providers.

    All providers must implement these methods to work with the pipeline.
    """

    @property
    def resolution_meters(self) -> int:
        """
        Native resolution of this provider in meters.

        Returns:
            Resolution in meters per pixel (e.g., 10 for Sentinel-2, 3 for PlanetScope)
        """
        ...

    @property
    def band_names(self) -> BandNames:
        """
        Map semantic band names to provider-specific identifiers.

        Returns:
            Dictionary mapping semantic names to band identifiers.
            Example: {"nir": "B08", "red": "B04", "swir": "B11", "blue": "B02"}
        """
        ...

    @property
    def requires_auth(self) -> bool:
        """
        Whether this provider requires API authentication.

        Returns:
            True if API key or credentials are required.
        """
        ...

    @property
    def is_free(self) -> bool:
        """
        Whether this provider is free to use.

        Returns:
            True if no per-use costs, False if paid service.
        """
        ...

    def query(
        self,
        bbox: list[float],
        start_date: str,
        end_date: str,
        max_cloud_cover: int = 50
    ) -> list:
        """
        Query the provider's catalog for matching imagery.

        Args:
            bbox: Bounding box [west, south, east, north] in WGS84
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            max_cloud_cover: Maximum cloud cover percentage (0-100)

        Returns:
            List of STAC items or equivalent metadata objects
        """
        ...

    def load(
        self,
        items: list,
        bands: list[str],
        bbox: list[float]
    ) -> 'xr.DataArray':
        """
        Load specified bands for an area of interest.

        Args:
            items: STAC items from query()
            bands: List of semantic band names to load (e.g., ["nir", "red"])
            bbox: Bounding box [west, south, east, north]

        Returns:
            xarray DataArray with loaded band data
        """
        ...

    def cloud_mask(
        self,
        data: 'xr.DataArray',
        items: list,
        bbox: list[float] | None = None
    ) -> tuple['xr.DataArray', float]:
        """
        Apply cloud masking to the data.

        Args:
            data: xarray DataArray with band data
            items: STAC items used to load the data
            bbox: Optional bounding box [west, south, east, north]

        Returns:
            Tuple of (masked_data, cloud_free_percentage)
            cloud_free_percentage is 0.0-1.0 representing usable pixels
        """
        ...

    def get_metadata(self, item: dict) -> dict:
        """
        Extract useful metadata from a catalog item.

        Args:
            item: STAC item or equivalent from query()

        Returns:
            Dictionary with useful properties (cloud cover, date, etc.)
        """
        ...


class BaseSatelliteProvider(ABC):
    """
    Abstract base class for satellite providers.

    Provides common functionality and serves as a template for implementing
    new providers.
    """

    @property
    def resolution_meters(self) -> int:
        """Override in subclass."""
        raise NotImplementedError()

    @property
    def band_names(self) -> BandNames:
        """Override in subclass."""
        raise NotImplementedError()

    @property
    def requires_auth(self) -> bool:
        """Whether provider needs authentication. Override if needed."""
        return False

    @property
    def is_free(self) -> bool:
        """Whether provider is free. Override if provider is paid."""
        return True

    def get_metadata(self, item: dict) -> dict:
        """
        Default metadata extraction from STAC item.

        Override if provider uses different metadata structure.

        Args:
            item: STAC item dictionary

        Returns:
            Dictionary with common metadata fields
        """
        import dateutil.parser

        props = item.get("properties", {})

        # Try to get cloud cover from various possible keys
        cloud_cover = props.get("eo:cloud_cover")
        if cloud_cover is None:
            cloud_cover = props.get("cloudCover")

        # Try to get datetime
        datetime_str = props.get("datetime")
        if datetime_str is None:
            datetime_str = props.get("start_datetime")

        try:
            datetime_obj = dateutil.parser.parse(datetime_str) if datetime_str else None
            date = datetime_obj.strftime("%Y-%m-%d") if datetime_obj else None
        except (ValueError, TypeError):
            date = None

        return {
            "id": item.get("id", "unknown"),
            "cloud_cover": cloud_cover,
            "datetime": date,
            "collection": item.get("collection", "unknown"),
        }


class ProviderFactory:
    """
    Factory for creating satellite providers based on farm tier.

    Default provider is Copernicus Data Space for Sentinel-2 data.
    Premium tiers can add PlanetScope for higher resolution.
    """

    @staticmethod
    def get_provider(provider_name: str, **kwargs) -> SatelliteProvider:
        """
        Create a specific provider by name.

        Args:
            provider_name: Name of the provider ("copernicus", "sentinel2", "planet_scope")
            **kwargs: Provider-specific arguments (e.g., api_key)

        Returns:
            Provider instance

        Raises:
            ValueError: If provider name is not recognized
        """
        if provider_name == "copernicus":
            from .copernicus import CopernicusProvider
            return CopernicusProvider(
                client_id=kwargs.get("client_id"),
                client_secret=kwargs.get("client_secret"),
            )
        elif provider_name == "sentinel2":
            # Legacy Planetary Computer provider (fallback)
            from .sentinel2 import Sentinel2Provider
            return Sentinel2Provider()
        elif provider_name == "planet_scope":
            from .planet_scope import PlanetScopeProvider
            return PlanetScopeProvider(
                api_key=kwargs.get("api_key"),
                client_id=kwargs.get("client_id"),
                client_secret=kwargs.get("client_secret"),
            )
        else:
            raise ValueError(f"Unknown provider: {provider_name}")

    @staticmethod
    def get_providers_for_tier(
        tier: str,
        planet_api_key: str | None = None,
        planet_client_id: str | None = None,
        planet_client_secret: str | None = None,
        use_copernicus: bool = True,
    ) -> list[SatelliteProvider]:
        """
        Get appropriate providers for a farm's subscription tier.

        Args:
            tier: Subscription tier ("free", "starter", "professional", "enterprise")
            planet_api_key: Optional Planet API key for premium tiers
            planet_client_id: Optional Planet OAuth2 client ID
            planet_client_secret: Optional Planet OAuth2 client secret
            use_copernicus: Whether to use Copernicus (default) or Planetary Computer

        Returns:
            List of providers to use for this farm
        """
        import logging
        import os

        logger = logging.getLogger(__name__)
        providers: list[SatelliteProvider] = []

        # Determine which Sentinel-2 provider to use
        if use_copernicus:
            # Check if Copernicus credentials are available
            has_copernicus_creds = (
                os.getenv("COPERNICUS_CLIENT_ID") and
                os.getenv("COPERNICUS_CLIENT_SECRET")
            )

            if has_copernicus_creds:
                from .copernicus import CopernicusProvider
                providers.append(CopernicusProvider())
                logger.info("Using Copernicus Data Space for Sentinel-2")
            else:
                # Fall back to Planetary Computer
                from .sentinel2 import Sentinel2Provider
                providers.append(Sentinel2Provider())
                logger.info("Copernicus credentials not found, using Planetary Computer fallback")
        else:
            # Explicitly use Planetary Computer
            from .sentinel2 import Sentinel2Provider
            providers.append(Sentinel2Provider())

        # Premium tiers (professional, enterprise) can add PlanetScope
        premium_tiers = ["professional", "enterprise"]

        # Check for Planet API key (required for Data API)
        # Note: OAuth2 is only supported for Sentinel Hub, not Data API
        has_planet_api_key = (
            planet_api_key or
            (os.getenv("PL_API_KEY") and os.getenv("PL_API_KEY") != "your_planet_api_key")
        )

        if tier in premium_tiers and has_planet_api_key:
            from .planet_scope import PlanetScopeProvider
            providers.append(PlanetScopeProvider(
                api_key=planet_api_key,
                client_id=planet_client_id,
                client_secret=planet_client_secret,
            ))
            logger.info("Added PlanetScope provider for premium tier (auth: API key)")
        elif tier in premium_tiers and not has_planet_api_key:
            # Check if OAuth credentials exist but no API key
            has_planet_oauth = (
                (planet_client_id and planet_client_secret) or
                (os.getenv("PL_CLIENT_ID") and os.getenv("PL_CLIENT_SECRET"))
            )
            if has_planet_oauth:
                logger.warning(
                    f"Farm is {tier} tier with Planet OAuth2 credentials, but Planet's "
                    "Data API requires an API key. OAuth2 is only supported for Sentinel Hub. "
                    "Get an API key from https://www.planet.com/account/"
                )
            else:
                logger.warning(
                    f"Farm is {tier} tier but no Planet API key configured. "
                    "Using Sentinel-2 only. Get an API key from https://www.planet.com/account/"
                )

        return providers

    @staticmethod
    def get_default_resolution(providers: list[SatelliteProvider]) -> int:
        """
        Get the target resolution for merging multiple providers.

        For mixed providers, returns the highest resolution (smallest pixel size).
        For single provider, returns that provider's native resolution.

        Args:
            providers: List of providers being used

        Returns:
            Target resolution in meters
        """
        if len(providers) == 0:
            return 10  # Default

        if len(providers) == 1:
            return providers[0].resolution_meters

        # Multiple providers - use highest resolution
        return min(p.resolution_meters for p in providers)
