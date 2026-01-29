"""
PlanetScope satellite data provider implementation.

Provides access to PlanetScope imagery via the Planet Data API.
Requires API key and has per-scene costs.
"""
import logging
import tempfile
import time
from typing import TYPE_CHECKING, Optional

from . import BaseSatelliteProvider, BandNames, ActivationTimeoutError, QuotaExceededError

if TYPE_CHECKING:
    import xarray as xr
    import geopandas as gpd

logger = logging.getLogger(__name__)


class PlanetScopeProvider(BaseSatelliteProvider):
    """
    Provider for PlanetScope 4-band imagery.

    Resolution: 3m (native)
    Cost: Paid (per scene)
    Authentication: Supports both API key and OAuth2 (client credentials)

    Note: Planet API requires asset activation before download. Assets may be
    in 'inactive' state and need to be activated first (takes seconds to minutes).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        base_url: str = "https://api.planet.com/data/v1"
    ):
        """
        Initialize the PlanetScope provider.

        Supports two authentication methods:
        1. API Key: Pass api_key or set PL_API_KEY env var
        2. OAuth2: Pass client_id/client_secret or set PL_CLIENT_ID/PL_CLIENT_SECRET

        OAuth2 takes precedence if both are provided.

        Args:
            api_key: Planet API key. Falls back to PL_API_KEY env var.
            client_id: OAuth2 client ID. Falls back to PL_CLIENT_ID env var.
            client_secret: OAuth2 client secret. Falls back to PL_CLIENT_SECRET env var.
            base_url: Base URL for Planet Data API
        """
        self._api_key = api_key
        self._client_id = client_id
        self._client_secret = client_secret
        self._base_url = base_url
        self._oauth_token: Optional[str] = None
        self._oauth_token_expires: float = 0

    @property
    def resolution_meters(self) -> int:
        """PlanetScope native resolution."""
        return 3

    @property
    def band_names(self) -> BandNames:
        """
        PlanetScope band mappings.

        PlanetScope 4-band (Ortho Visual) provides:
        - Red (R), Green (G), Blue (B), Near-infrared (NIR)
        """
        return BandNames(
            nir="NIR",   # Near-infrared
            red="Red",   # Red
            swir="",     # Not available in PlanetScope
            blue="Blue", # Blue
        )

    @property
    def requires_auth(self) -> bool:
        """PlanetScope requires API key."""
        return True

    @property
    def is_free(self) -> bool:
        """PlanetScope is a paid service."""
        return False

    @property
    def client_id(self) -> Optional[str]:
        """Get OAuth2 client ID from parameter or environment."""
        if self._client_id:
            return self._client_id
        import os
        return os.environ.get("PL_CLIENT_ID")

    @property
    def client_secret(self) -> Optional[str]:
        """Get OAuth2 client secret from parameter or environment."""
        if self._client_secret:
            return self._client_secret
        import os
        return os.environ.get("PL_CLIENT_SECRET")

    @property
    def api_key(self) -> Optional[str]:
        """Get API key from parameter or environment."""
        if self._api_key:
            return self._api_key
        import os
        return os.environ.get("PL_API_KEY")

    def _has_oauth_credentials(self) -> bool:
        """Check if OAuth2 credentials are available."""
        return bool(self.client_id and self.client_secret)

    def _has_api_key(self) -> bool:
        """Check if API key is available and not a placeholder."""
        key = self.api_key
        return bool(key and key != "your_planet_api_key" and len(key) > 10)

    def _get_oauth_token(self) -> str:
        """
        Get OAuth2 access token using client credentials flow.

        Caches the token and refreshes when expired.

        Returns:
            Access token string

        Raises:
            ValueError: If OAuth2 credentials are not configured
            QuotaExceededError: If authentication fails
        """
        import requests

        # Check if we have a valid cached token
        if self._oauth_token and time.time() < self._oauth_token_expires:
            return self._oauth_token

        if not self._has_oauth_credentials():
            raise ValueError(
                "Planet OAuth2 credentials required. Set PL_CLIENT_ID and "
                "PL_CLIENT_SECRET environment variables."
            )

        logger.info("Requesting Planet OAuth2 access token...")

        # Planet OAuth2 M2M uses Sentinel Hub's OAuth endpoint
        # See: https://docs.planet.com/develop/authentication/
        token_url = "https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token"
        response = requests.post(
            token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30
        )

        if response.status_code == 401:
            raise QuotaExceededError("PlanetScope", "Invalid OAuth2 credentials")
        elif response.status_code == 429:
            raise QuotaExceededError("PlanetScope", "Rate limit exceeded during auth")

        response.raise_for_status()
        token_data = response.json()

        self._oauth_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 3600)
        # Refresh 60 seconds before expiry
        self._oauth_token_expires = time.time() + expires_in - 60

        logger.info(f"Got Planet access token, expires in {expires_in}s")
        return self._oauth_token

    def _get_auth_headers(self) -> dict:
        """
        Get authorization headers for Planet API requests.

        NOTE: As of Jan 2026, Planet's Data API (api.planet.com) requires API key
        authentication. OAuth2 M2M is only supported for Sentinel Hub services.
        API key authentication is used preferentially.

        See: https://docs.planet.com/develop/authentication/
        """
        if self._has_api_key():
            return {
                "Authorization": f"api-key {self.api_key}",
                "Content-Type": "application/json",
            }
        elif self._has_oauth_credentials():
            # OAuth2 M2M tokens from Sentinel Hub don't currently work with
            # Planet's Data API. Log a warning and try anyway in case support is added.
            logger.warning(
                "OAuth2 credentials detected but Planet Data API may not support "
                "OAuth2 M2M yet. Consider getting an API key from Planet dashboard."
            )
            token = self._get_oauth_token()
            return {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
        else:
            raise ValueError(
                "Planet API key required for Data API access.\n"
                "Get your API key from: https://www.planet.com/account/\n"
                "Then set PL_API_KEY environment variable.\n"
                "\n"
                "Note: OAuth2 (PL_CLIENT_ID/PL_CLIENT_SECRET) is only supported "
                "for Sentinel Hub services, not the Data API."
            )

    def _activate_asset(self, item_id: str, item_type: str, asset_type: str) -> dict:
        """
        Activate an asset for download.

        Planet API requires assets to be "activated" before they can be downloaded.
        This POSTs to the asset's activation endpoint.

        Args:
            item_id: Planet item ID
            item_type: Item type (e.g., "PSScene")
            asset_type: Asset type (e.g., "ortho_analytic_4b")

        Returns:
            Asset metadata dict with status and location

        Raises:
            QuotaExceededError: If quota/rate limit exceeded
        """
        import requests

        # Get asset status
        asset_url = f"{self._base_url}/item-types/{item_type}/items/{item_id}/assets"
        response = requests.get(asset_url, headers=self._get_auth_headers(), timeout=30)

        if response.status_code == 429:
            raise QuotaExceededError("PlanetScope", "Rate limit exceeded")
        response.raise_for_status()

        assets = response.json()
        asset = assets.get(asset_type)

        if asset is None:
            # Empty assets usually means no download permissions
            if not assets:
                raise QuotaExceededError(
                    "PlanetScope",
                    f"No download permissions for item {item_id}. "
                    "Your Planet account may be search-only. "
                    "Contact Planet to enable download access."
                )
            raise ValueError(f"Asset type {asset_type} not available for item {item_id}")

        status = asset.get("status")

        # If already active, return the asset info
        if status == "active":
            logger.debug(f"Asset {asset_type} for {item_id} already active")
            return asset

        # If inactive, activate it
        if status == "inactive":
            activate_url = asset.get("_links", {}).get("activate")
            if not activate_url:
                raise ValueError(f"No activation link for asset {asset_type}")

            logger.info(f"Activating asset {asset_type} for item {item_id}...")
            activate_response = requests.get(
                activate_url,
                headers=self._get_auth_headers(),
                timeout=30
            )

            if activate_response.status_code == 429:
                raise QuotaExceededError("PlanetScope", "Rate limit exceeded during activation")
            elif activate_response.status_code not in (202, 204):
                activate_response.raise_for_status()

            return asset

        # If activating, return the asset info (caller will poll)
        if status == "activating":
            logger.debug(f"Asset {asset_type} for {item_id} is activating")
            return asset

        raise ValueError(f"Unexpected asset status: {status}")

    def _wait_for_activation(
        self,
        item_id: str,
        item_type: str,
        asset_type: str,
        timeout: int = 300,
        poll_interval: int = 5
    ) -> dict:
        """
        Wait for an asset to become active.

        Polls the asset status every poll_interval seconds until it becomes
        active or the timeout is exceeded.

        Args:
            item_id: Planet item ID
            item_type: Item type (e.g., "PSScene")
            asset_type: Asset type (e.g., "ortho_analytic_4b")
            timeout: Maximum time to wait in seconds (default 300 = 5 minutes)
            poll_interval: Time between status checks in seconds (default 5)

        Returns:
            Asset metadata dict with download location

        Raises:
            ActivationTimeoutError: If activation doesn't complete in time
        """
        import requests

        asset_url = f"{self._base_url}/item-types/{item_type}/items/{item_id}/assets"
        start_time = time.time()

        while (time.time() - start_time) < timeout:
            response = requests.get(asset_url, headers=self._get_auth_headers(), timeout=30)
            response.raise_for_status()

            assets = response.json()
            asset = assets.get(asset_type)

            if asset is None:
                raise ValueError(f"Asset type {asset_type} not available for item {item_id}")

            status = asset.get("status")

            if status == "active":
                logger.info(f"Asset {asset_type} for {item_id} is now active")
                return asset

            if status == "failed":
                raise ValueError(f"Asset activation failed for {item_id}/{asset_type}")

            elapsed = int(time.time() - start_time)
            logger.debug(f"Asset {asset_type} status: {status}, waiting... ({elapsed}s/{timeout}s)")
            time.sleep(poll_interval)

        raise ActivationTimeoutError(item_id, asset_type, timeout)

    def _download_asset(self, download_url: str) -> str:
        """
        Download an asset to a temporary file.

        Uses streaming download to handle large files efficiently.

        Args:
            download_url: Signed download URL from Planet API

        Returns:
            Path to temporary file containing the downloaded data
        """
        import requests

        logger.debug(f"Downloading asset from {download_url[:80]}...")

        # Create a temporary file that persists after function returns
        tmp_file = tempfile.NamedTemporaryFile(suffix=".tif", delete=False)

        try:
            with requests.get(download_url, stream=True, timeout=300) as response:
                response.raise_for_status()

                # Stream in chunks to handle large files
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        tmp_file.write(chunk)

            tmp_file.close()
            logger.debug(f"Downloaded to {tmp_file.name}")
            return tmp_file.name

        except Exception:
            tmp_file.close()
            import os
            os.unlink(tmp_file.name)
            raise

    def query(
        self,
        bbox: list[float],
        start_date: str,
        end_date: str,
        max_cloud_cover: int = 50
    ) -> list:
        """
        Query Planet Data API for PlanetScope imagery.

        Args:
            bbox: Bounding box [west, south, east, north]
            start_date: Start date YYYY-MM-DD
            end_date: End date YYYY-MM-DD
            max_cloud_cover: Maximum cloud cover percentage (0-100)

        Returns:
            List of item metadata dictionaries
        """
        import requests

        # Planet API request for PlanetScope items
        # Build filter for geometry, date range, and cloud cover
        filter_config = {
            "type": "AndFilter",
            "config": [
                {
                    "type": "GeometryFilter",
                    "field_name": "geometry",
                    "config": {
                        "type": "Polygon",
                        "coordinates": [[
                            [bbox[0], bbox[1]],
                            [bbox[2], bbox[1]],
                            [bbox[2], bbox[3]],
                            [bbox[0], bbox[3]],
                            [bbox[0], bbox[1]],
                        ]]
                    }
                },
                {
                    "type": "DateRangeFilter",
                    "field_name": "acquired",
                    "config": {
                        "gte": f"{start_date}T00:00:00Z",
                        "lte": f"{end_date}T23:59:59Z"
                    }
                },
                {
                    "type": "RangeFilter",
                    "field_name": "cloud_cover",
                    "config": {
                        "lte": max_cloud_cover / 100.0
                    }
                }
            ]
        }

        url = f"{self._base_url}/quick-search"

        # Build request payload
        payload = {
            "filter": filter_config,
            "item_types": ["PSScene"]
        }

        response = requests.post(
            url,
            headers=self._get_auth_headers(),
            json=payload,
            timeout=60
        )

        if response.status_code == 429:
            raise QuotaExceededError("PlanetScope", "Rate limit exceeded during search")
        response.raise_for_status()
        results = response.json()

        items = results.get("features", [])

        # Normalize to our expected format
        normalized_items = []
        for item in items:
            normalized = {
                "id": item.get("id"),
                "properties": item.get("properties", {}),
                "geometry": item.get("geometry"),
                "_links": item.get("_links", {}),
                "item_type": "PSScene",  # Store for activation
            }
            normalized_items.append(normalized)

        return normalized_items

    def load(
        self,
        items: list,
        bands: list[str],
        bbox: list[float]
    ) -> 'xr.DataArray':
        """
        Load PlanetScope bands and clip to bounding box.

        Implements the Planet asset activation workflow:
        1. Activate the asset if not already active
        2. Wait for activation to complete
        3. Download the asset
        4. Reproject and clip to bbox

        Args:
            items: Item metadata from query()
            bands: Semantic band names to load ["nir", "red", "blue"]
            bbox: Bounding box [west, south, east, north]

        Returns:
            xarray DataArray with loaded band data
        """
        import numpy as np
        import rasterio
        from rasterio.warp import calculate_default_transform, reproject, Resampling
        from rasterio.windows import from_bounds
        import xarray as xr
        import os

        all_band_arrays = []

        for item in items:
            item_id = item.get("id")
            item_type = item.get("item_type", "PSScene")

            logger.info(f"Processing item {item_id}...")

            try:
                # Step 1: Activate the analytic asset
                asset = self._activate_asset(item_id, item_type, "ortho_analytic_4b")

                # Step 2: Wait for activation if needed
                if asset.get("status") != "active":
                    asset = self._wait_for_activation(
                        item_id, item_type, "ortho_analytic_4b",
                        timeout=300  # 5 minute timeout
                    )

                # Step 3: Get download URL and download
                download_url = asset.get("location")
                if not download_url:
                    logger.warning(f"No download URL for item {item_id}, skipping")
                    continue

                tmp_file = self._download_asset(download_url)

                try:
                    # Step 4: Process the downloaded file
                    with rasterio.open(tmp_file) as src:
                        src_crs = src.crs
                        dst_crs = "EPSG:4326"  # WGS84

                        # Calculate output dimensions at 3m resolution over the bbox
                        # ~111km per degree at equator
                        width = int((bbox[2] - bbox[0]) * 111000 / 3)
                        height = int((bbox[3] - bbox[1]) * 111000 / 3)

                        # Ensure reasonable bounds
                        width = max(min(width, 2000), 100)
                        height = max(min(height, 2000), 100)

                        # Calculate the transform ONCE for all bands
                        dst_transform, dst_width, dst_height = calculate_default_transform(
                            src_crs, dst_crs, src.width, src.height,
                            *src.bounds,
                            dst_width=width, dst_height=height
                        )

                        # Override to use exact bbox
                        from rasterio.transform import from_bounds as transform_from_bounds
                        dst_transform = transform_from_bounds(
                            bbox[0], bbox[1], bbox[2], bbox[3],
                            width, height
                        )

                        # Read and reproject all 4 bands at once
                        # PlanetScope 4-band order: Blue (1), Green (2), Red (3), NIR (4)
                        dst_data = np.zeros((4, height, width), dtype=np.float32)

                        for band_idx in range(4):
                            src_band = src.read(band_idx + 1)

                            reproject(
                                source=src_band,
                                destination=dst_data[band_idx],
                                src_transform=src.transform,
                                src_crs=src_crs,
                                dst_transform=dst_transform,
                                dst_crs=dst_crs,
                                resampling=Resampling.bilinear
                            )

                        # Normalize to 0-1 reflectance
                        # PlanetScope typically uses 0-10000 scale
                        max_val = np.nanmax(dst_data)
                        if max_val > 1:
                            # Assume 0-10000 or similar scale
                            if max_val > 100:
                                dst_data = dst_data / 10000.0
                            else:
                                dst_data = dst_data / max_val

                        # Create xarray DataArray
                        # Map bands: 0=Blue, 1=Green, 2=Red, 3=NIR
                        da = xr.DataArray(
                            dst_data,
                            dims=["band", "y", "x"],
                            coords={
                                "band": ["blue", "green", "red", "nir"],
                                "y": np.linspace(bbox[3], bbox[1], height),
                                "x": np.linspace(bbox[0], bbox[2], width),
                            }
                        )

                        all_band_arrays.append(da)
                        logger.info(f"  Loaded {item_id}: {width}x{height} pixels")

                finally:
                    # Clean up temporary file
                    if os.path.exists(tmp_file):
                        os.unlink(tmp_file)

            except ActivationTimeoutError:
                logger.warning(f"Activation timeout for item {item_id}, skipping")
                continue
            except QuotaExceededError as e:
                logger.error(f"Quota exceeded: {e}")
                raise
            except Exception as e:
                logger.error(f"Error processing item {item_id}: {e}")
                continue

        if not all_band_arrays:
            raise ValueError("No valid PlanetScope items could be loaded")

        # Stack all items along a new time dimension
        stacked = xr.concat(all_band_arrays, dim="time")

        # Add time coordinates
        result = stacked.assign_coords(time=range(len(all_band_arrays)))

        return result

    def cloud_mask(
        self,
        data: 'xr.DataArray',
        items: list,
        bbox: list[float] | None = None
    ) -> tuple['xr.DataArray', float]:
        """
        Apply cloud mask using PlanetScope UDM2 (Usable Data Mask).

        UDM2 is an 8-band mask with the following bands:
        - Band 1: Clear mask (1 = clear, 0 = not clear)
        - Band 2: Snow mask
        - Band 3: Shadow mask
        - Band 4: Light haze mask
        - Band 5: Heavy haze mask
        - Band 6: Cloud mask
        - Band 7: Confidence mask
        - Band 8: Unusable pixels mask

        We use Band 1 (clear) OR combine Band 1 AND NOT Band 6 (cloud).

        Args:
            data: xarray DataArray with band data
            items: Item metadata from query()
            bbox: Optional bounding box (not used but kept for interface compatibility)

        Returns:
            Tuple of (masked_data, cloud_free_percentage)
        """
        import numpy as np
        import rasterio
        from rasterio.warp import reproject, Resampling
        from rasterio.transform import from_bounds as transform_from_bounds
        import os

        # Target dimensions from data
        height = data.sizes.get("y", 100)
        width = data.sizes.get("x", 100)

        # Get bbox from data coordinates if not provided
        if bbox is None:
            x_coords = data.coords.get('x')
            y_coords = data.coords.get('y')
            if x_coords is not None and y_coords is not None:
                bbox = [
                    float(x_coords.min()),
                    float(y_coords.min()),
                    float(x_coords.max()),
                    float(y_coords.max()),
                ]

        # Build a clear mask from all items
        combined_clear_mask = None

        for item in items:
            item_id = item.get("id")
            item_type = item.get("item_type", "PSScene")

            try:
                # Try to activate and get UDM2 asset
                try:
                    asset = self._activate_asset(item_id, item_type, "ortho_udm2")

                    if asset.get("status") != "active":
                        asset = self._wait_for_activation(
                            item_id, item_type, "ortho_udm2",
                            timeout=120  # Shorter timeout for UDM2
                        )

                    download_url = asset.get("location")
                    if not download_url:
                        raise ValueError("No download URL")

                    tmp_file = self._download_asset(download_url)

                    try:
                        with rasterio.open(tmp_file) as src:
                            # Read Band 1 (clear mask) and Band 6 (cloud mask)
                            clear_band = src.read(1)
                            cloud_band = src.read(6)

                            # Create destination array at target resolution
                            dst_clear = np.zeros((height, width), dtype=np.uint8)
                            dst_cloud = np.zeros((height, width), dtype=np.uint8)

                            # Calculate transform for reprojection
                            if bbox:
                                dst_transform = transform_from_bounds(
                                    bbox[0], bbox[1], bbox[2], bbox[3],
                                    width, height
                                )

                                # Reproject clear band
                                reproject(
                                    source=clear_band,
                                    destination=dst_clear,
                                    src_transform=src.transform,
                                    src_crs=src.crs,
                                    dst_transform=dst_transform,
                                    dst_crs="EPSG:4326",
                                    resampling=Resampling.nearest
                                )

                                # Reproject cloud band
                                reproject(
                                    source=cloud_band,
                                    destination=dst_cloud,
                                    src_transform=src.transform,
                                    src_crs=src.crs,
                                    dst_transform=dst_transform,
                                    dst_crs="EPSG:4326",
                                    resampling=Resampling.nearest
                                )

                            # Clear where: clear_band == 1 AND cloud_band == 0
                            # In UDM2: 1 = condition true, 0 = condition false
                            item_mask = (dst_clear == 1) & (dst_cloud == 0)

                    finally:
                        if os.path.exists(tmp_file):
                            os.unlink(tmp_file)

                except (ActivationTimeoutError, ValueError) as e:
                    logger.debug(f"UDM2 not available for {item_id}: {e}, assuming all clear")
                    # No UDM2 available - assume all pixels are clear
                    item_mask = np.ones((height, width), dtype=bool)

            except Exception as e:
                logger.warning(f"Error getting cloud mask for {item_id}: {e}")
                # On error, assume all clear
                item_mask = np.ones((height, width), dtype=bool)

            # Combine masks (union of clear pixels across all items)
            if combined_clear_mask is None:
                combined_clear_mask = item_mask
            else:
                combined_clear_mask = combined_clear_mask | item_mask

        if combined_clear_mask is None:
            combined_clear_mask = np.ones((height, width), dtype=bool)

        # Calculate cloud-free percentage
        total_pixels = combined_clear_mask.size
        valid_pixels = combined_clear_mask.sum()
        cloud_free_pct = float(valid_pixels) / float(total_pixels) if total_pixels > 0 else 0.0

        # Apply mask to all bands and time steps
        masked = data.where(combined_clear_mask)

        return masked, cloud_free_pct

    def get_metadata(self, item: dict) -> dict:
        """
        Extract metadata from a Planet item.

        Args:
            item: Item dictionary from query()

        Returns:
            Dictionary with useful metadata fields
        """
        props = item.get("properties", {})

        # Get cloud cover
        cloud_cover = props.get("cloud_cover")
        if cloud_cover is not None:
            cloud_cover = cloud_cover * 100  # Convert from 0-1 to percentage

        # Get datetime
        datetime_str = props.get("acquired")

        try:
            import dateutil.parser
            datetime_obj = dateutil.parser.parse(datetime_str) if datetime_str else None
            date = datetime_obj.strftime("%Y-%m-%d") if datetime_obj else None
        except (ValueError, TypeError):
            date = None

        return {
            "id": item.get("id", "unknown"),
            "cloud_cover": cloud_cover,
            "datetime": date,
            "collection": "PSScene",
            "provider": "planetscope",
            "resolution_meters": 3,
        }
