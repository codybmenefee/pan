"""
Copernicus Data Space provider for Sentinel-2 imagery.

Provides access to Sentinel-2 L2A data from Copernicus Data Space
(the official EU Copernicus data distribution platform).
"""
import logging
import os
from datetime import datetime, timedelta
from typing import TYPE_CHECKING

import requests

from . import BaseSatelliteProvider, BandNames

if TYPE_CHECKING:
    import xarray as xr

logger = logging.getLogger(__name__)


class CopernicusProvider(BaseSatelliteProvider):
    """
    Provider for Sentinel-2 L2A data from Copernicus Data Space.

    Uses OAuth2 authentication and the OData catalog API.

    Resolution: 10m for visible/NIR bands, 20m for red-edge/SWIR
    Cost: Free
    Authentication: OAuth2 client credentials flow

    API Documentation:
    - Catalog: https://catalogue.dataspace.copernicus.eu/odata/v1
    - S3 Download: https://eodata.dataspace.copernicus.eu
    """

    # API endpoints
    TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    CATALOG_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1"
    DOWNLOAD_URL = "https://zipper.dataspace.copernicus.eu/odata/v1"  # Zipper service for downloads
    S3_ENDPOINT = "https://eodata.dataspace.copernicus.eu"

    def __init__(
        self,
        client_id: str | None = None,
        client_secret: str | None = None,
    ):
        """
        Initialize the Copernicus provider.

        Args:
            client_id: OAuth2 client ID (defaults to COPERNICUS_CLIENT_ID env var)
            client_secret: OAuth2 client secret (defaults to COPERNICUS_CLIENT_SECRET env var)
        """
        self.client_id = client_id or os.getenv("COPERNICUS_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("COPERNICUS_CLIENT_SECRET")

        self._access_token: str | None = None
        self._token_expires_at: datetime | None = None

    @property
    def resolution_meters(self) -> int:
        """Sentinel-2 native resolution for NIR/Red bands."""
        return 10

    @property
    def band_names(self) -> BandNames:
        """
        Sentinel-2 band mappings.

        Uses B04 (Red), B03 (Green), B08 (NIR), B11 (SWIR), B02 (Blue) at native resolutions.
        """
        return BandNames(
            nir="B08",   # Near-infrared, 10m
            red="B04",   # Red, 10m
            green="B03", # Green, 10m (for RGB composite)
            swir="B11",  # Short-wave infrared, 20m (will be resampled)
            blue="B02",  # Blue, 10m
        )

    @property
    def requires_auth(self) -> bool:
        """Copernicus Data Space requires OAuth2 authentication."""
        return True

    @property
    def is_free(self) -> bool:
        """Sentinel-2 data from Copernicus is free."""
        return True

    def _get_access_token(self) -> str:
        """
        Get or refresh the OAuth2 access token.

        Uses client credentials flow to obtain an access token.
        Tokens are cached and refreshed 5 minutes before expiry.

        Returns:
            Valid access token

        Raises:
            ValueError: If credentials are not configured
            RuntimeError: If token request fails
        """
        # Check if we have a valid cached token
        if self._access_token and self._token_expires_at:
            # Refresh 5 minutes before expiry
            if datetime.now() < self._token_expires_at - timedelta(minutes=5):
                return self._access_token

        # Validate credentials
        if not self.client_id or not self.client_secret:
            raise ValueError(
                "Copernicus credentials not configured. "
                "Set COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET environment variables."
            )

        logger.info("Requesting new Copernicus access token...")

        response = requests.post(
            self.TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Failed to get Copernicus access token: {response.status_code} - {response.text}"
            )

        token_data = response.json()
        self._access_token = token_data["access_token"]

        # Calculate expiry time (typically 300 seconds)
        expires_in = token_data.get("expires_in", 300)
        self._token_expires_at = datetime.now() + timedelta(seconds=expires_in)

        logger.info(f"Got access token, expires in {expires_in}s")
        return self._access_token

    def query(
        self,
        bbox: list[float],
        start_date: str,
        end_date: str,
        max_cloud_cover: int = 50
    ) -> list:
        """
        Query Copernicus Data Space OData API for Sentinel-2 imagery.

        Args:
            bbox: Bounding box [west, south, east, north]
            start_date: Start date YYYY-MM-DD
            end_date: End date YYYY-MM-DD
            max_cloud_cover: Maximum cloud cover percentage (0-100)

        Returns:
            List of product metadata dictionaries with download URLs
        """
        # Get access token
        token = self._get_access_token()

        # Build OData query for Sentinel-2 L2A
        # Bbox format for OData: POLYGON((west south, east south, east north, west north, west south))
        west, south, east, north = bbox
        footprint = f"POLYGON(({west} {south},{east} {south},{east} {north},{west} {north},{west} {south}))"

        # OData filter
        filter_parts = [
            f"Collection/Name eq 'SENTINEL-2'",
            f"Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'S2MSI2A')",
            f"ContentDate/Start gt {start_date}T00:00:00.000Z",
            f"ContentDate/Start lt {end_date}T23:59:59.999Z",
            f"OData.CSC.Intersects(area=geography'SRID=4326;{footprint}')",
            f"Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value lt {max_cloud_cover})",
        ]

        filter_str = " and ".join(filter_parts)

        url = f"{self.CATALOG_URL}/Products"
        params = {
            "$filter": filter_str,
            "$orderby": "ContentDate/Start desc",
            "$top": 100,
            "$expand": "Attributes",
        }

        logger.info(f"Querying Copernicus catalog for {start_date} to {end_date}...")

        response = requests.get(
            url,
            params=params,
            headers={"Authorization": f"Bearer {token}"},
            timeout=60,
        )

        if response.status_code != 200:
            logger.error(f"Catalog query failed: {response.status_code} - {response.text}")
            raise RuntimeError(f"Copernicus catalog query failed: {response.status_code}")

        data = response.json()
        products = data.get("value", [])

        logger.info(f"Found {len(products)} products")

        # Transform to standardized format
        items = []
        for product in products:
            # Extract cloud cover from attributes
            cloud_cover = None
            for attr in product.get("Attributes", []):
                if attr.get("Name") == "cloudCover":
                    cloud_cover = attr.get("Value")
                    break

            item = {
                "id": product["Id"],
                "name": product["Name"],
                "properties": {
                    "datetime": product.get("ContentDate", {}).get("Start"),
                    "eo:cloud_cover": cloud_cover,
                },
                "assets": {
                    "download": {
                        # Use Zipper service for downloads (different from catalog URL)
                        "href": f"{self.DOWNLOAD_URL}/Products({product['Id']})/$value"
                    }
                },
                "_copernicus_product": product,  # Keep full product for later use
            }
            items.append(item)

        return items

    def load(
        self,
        items: list,
        bands: list[str],
        bbox: list[float]
    ) -> 'xr.DataArray':
        """
        Load specified bands from Copernicus Sentinel-2 products.

        Downloads data via S3-compatible protocol and processes bands.

        Args:
            items: Product metadata from query()
            bands: Semantic band names to load ["nir", "red", "swir", "blue"]
            bbox: Bounding box [west, south, east, north]

        Returns:
            xarray DataArray with loaded band data
        """
        import numpy as np
        import rasterio
        import rasterio.windows
        import xarray as xr
        import zipfile
        import tempfile
        import os as os_module

        if not items:
            raise ValueError("No items provided to load")

        token = self._get_access_token()

        # Convert semantic band names to Sentinel-2 band IDs
        band_ids = [self.band_names[b] for b in bands]

        logger.info(f"Loading {len(items)} products, bands: {band_ids}")

        # We'll load from the most recent clear product
        # In a production system, we'd composite multiple products
        item = items[0]
        product_id = item["id"]
        product_name = item["name"]

        logger.info(f"Loading product: {product_name}")

        # Download the product via HTTPS (Zipper service)
        download_url = item["assets"]["download"]["href"]

        logger.info(f"Downloading from: {download_url}")

        response = requests.get(
            download_url,
            headers={
                "Authorization": f"Bearer {token}",
            },
            stream=True,
            timeout=600,  # Downloads can take a while
            allow_redirects=True,
        )

        if response.status_code != 200:
            logger.error(f"Download failed: {response.status_code} - {response.text[:500] if response.text else 'No response body'}")
            raise RuntimeError(f"Failed to download product: {response.status_code}")

        # The response is a ZIP file containing the SAFE format
        # Extract to temp directory and read bands
        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = os_module.path.join(tmpdir, "product.zip")

            with open(zip_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            logger.info("Extracting product...")

            with zipfile.ZipFile(zip_path, "r") as zf:
                zf.extractall(tmpdir)

            # Find the SAFE directory
            safe_dirs = [d for d in os_module.listdir(tmpdir) if d.endswith(".SAFE")]
            if not safe_dirs:
                raise RuntimeError("No SAFE directory found in product")

            safe_dir = os_module.path.join(tmpdir, safe_dirs[0])
            granule_dir = os_module.path.join(safe_dir, "GRANULE")

            # Find the granule
            granules = os_module.listdir(granule_dir)
            if not granules:
                raise RuntimeError("No granule found in product")

            granule_path = os_module.path.join(granule_dir, granules[0], "IMG_DATA", "R10m")

            # Load each band
            band_arrays = {}
            target_shape = None  # Track the shape of 10m bands for resampling
            target_transform = None
            target_crs = None
            x_coords = None
            y_coords = None

            for band_id in band_ids:
                # Handle different resolutions
                if band_id == "B11":  # SWIR is 20m
                    res_dir = os_module.path.join(granule_dir, granules[0], "IMG_DATA", "R20m")
                else:
                    res_dir = granule_path

                # Find the band file
                band_files = [f for f in os_module.listdir(res_dir) if f"_{band_id}_" in f and f.endswith(".jp2")]
                if not band_files:
                    logger.warning(f"Band {band_id} not found, skipping")
                    continue

                band_path = os_module.path.join(res_dir, band_files[0])

                logger.info(f"Reading {band_id} from {band_files[0]}")

                with rasterio.open(band_path) as src:
                    # Read data for the bbox
                    # Convert bbox from WGS84 (lat/lon) to the raster's CRS
                    from rasterio.windows import from_bounds
                    from rasterio.warp import transform_bounds

                    # Transform bbox from WGS84 to the raster's CRS
                    src_crs = src.crs
                    if src_crs and str(src_crs) != "EPSG:4326":
                        transformed_bbox = transform_bounds(
                            "EPSG:4326",  # source CRS (WGS84)
                            src_crs,      # target CRS (UTM)
                            *bbox
                        )
                    else:
                        transformed_bbox = bbox

                    # Get window from transformed bounds
                    try:
                        window = from_bounds(*transformed_bbox, src.transform)

                        # Ensure window is within raster bounds
                        window = window.intersection(
                            rasterio.windows.Window(0, 0, src.width, src.height)
                        )

                        if window.width < 1 or window.height < 1:
                            logger.warning(f"Window for {band_id} is empty, reading full raster")
                            data = src.read(1)
                        else:
                            data = src.read(1, window=window)
                    except Exception as e:
                        logger.warning(f"Window error for {band_id}: {e}, reading full raster")
                        data = src.read(1)

                    # Convert DN to reflectance (divide by 10000)
                    data = data.astype(np.float32) / 10000

                    # Track target shape and transform from 10m bands
                    if band_id != "B11" and target_shape is None:
                        target_shape = data.shape
                        target_crs = src.crs

                        # Compute x/y coordinate arrays from window
                        if window and window.width >= 1 and window.height >= 1:
                            # Get the transform for the window
                            from rasterio.transform import from_bounds as transform_from_bounds
                            win_transform = src.window_transform(window)

                            # Create coordinate arrays
                            # rasterio convention: pixel centers
                            rows, cols = data.shape
                            x_coords = np.array([
                                win_transform.c + (col + 0.5) * win_transform.a
                                for col in range(cols)
                            ])
                            y_coords = np.array([
                                win_transform.f + (row + 0.5) * win_transform.e
                                for row in range(rows)
                            ])
                        else:
                            # Full raster - use src transform
                            rows, cols = data.shape
                            x_coords = np.array([
                                src.transform.c + (col + 0.5) * src.transform.a
                                for col in range(cols)
                            ])
                            y_coords = np.array([
                                src.transform.f + (row + 0.5) * src.transform.e
                                for row in range(rows)
                            ])

                        logger.info(f"Target shape: {target_shape}, CRS: {target_crs}")
                        logger.info(f"X range: {x_coords.min():.1f} to {x_coords.max():.1f}")
                        logger.info(f"Y range: {y_coords.min():.1f} to {y_coords.max():.1f}")

                    band_arrays[band_id] = data

            # Resample B11 (20m) to match 10m bands if needed
            if "B11" in band_arrays and target_shape is not None:
                from scipy.ndimage import zoom
                b11_data = band_arrays["B11"]
                if b11_data.shape != target_shape:
                    zoom_factors = (
                        target_shape[0] / b11_data.shape[0],
                        target_shape[1] / b11_data.shape[1]
                    )
                    logger.info(f"Resampling B11 from {b11_data.shape} to {target_shape}")
                    band_arrays["B11"] = zoom(b11_data, zoom_factors, order=1)

            # Stack into xarray DataArray
            # Rename to semantic names
            semantic_bands = []
            arrays = []
            for semantic_name, band_id in self.band_names.items():
                if band_id in band_arrays:
                    arrays.append(band_arrays[band_id])
                    semantic_bands.append(semantic_name)

            if not arrays:
                raise RuntimeError("No band data loaded")

            # Stack arrays
            stacked = np.stack(arrays, axis=0)

            # Create DataArray with proper spatial coordinates
            coords_dict = {"band": semantic_bands}
            if y_coords is not None:
                coords_dict["y"] = y_coords
            if x_coords is not None:
                coords_dict["x"] = x_coords

            result = xr.DataArray(
                stacked,
                dims=["band", "y", "x"],
                coords=coords_dict,
                attrs={"crs": str(target_crs) if target_crs else "EPSG:32616"},  # Default to UTM 16N
            )

            return result

    def cloud_mask(
        self,
        data: 'xr.DataArray',
        items: list,
        bbox: list[float] | None = None
    ) -> tuple['xr.DataArray', float]:
        """
        Apply cloud mask using Sentinel-2 SCL (Scene Classification) band.

        For now, uses cloud cover metadata from the product.
        A production implementation would load and apply the SCL band.

        Args:
            data: xarray DataArray with band data
            items: Product metadata from query()
            bbox: Optional bounding box

        Returns:
            Tuple of (masked_data, cloud_free_percentage)
        """
        import numpy as np
        import xarray as xr

        # Get average cloud cover from items
        cloud_covers = []
        for item in items:
            cc = item.get("properties", {}).get("eo:cloud_cover")
            if cc is not None:
                cloud_covers.append(cc)

        if cloud_covers:
            avg_cloud_cover = sum(cloud_covers) / len(cloud_covers)
            cloud_free_pct = 1.0 - (avg_cloud_cover / 100.0)
        else:
            cloud_free_pct = 0.7

        # For now, return data as-is
        # In production, we'd load SCL and apply proper masking
        masked = data.where(~data.isnull())

        return masked, cloud_free_pct

    def get_metadata(self, item: dict) -> dict:
        """
        Extract metadata from a Copernicus product.

        Args:
            item: Product metadata from query()

        Returns:
            Dictionary with common metadata fields
        """
        from dateutil import parser as dateparser

        props = item.get("properties", {})
        datetime_str = props.get("datetime")

        try:
            datetime_obj = dateparser.parse(datetime_str) if datetime_str else None
            date = datetime_obj.strftime("%Y-%m-%d") if datetime_obj else None
        except (ValueError, TypeError):
            date = None

        return {
            "id": item.get("id", "unknown"),
            "name": item.get("name", "unknown"),
            "cloud_cover": props.get("eo:cloud_cover"),
            "datetime": date,
            "collection": "SENTINEL-2",
        }
