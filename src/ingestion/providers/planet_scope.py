"""
PlanetScope satellite data provider implementation.

Provides access to PlanetScope imagery via the Planet Data API.
Requires API key and has per-scene costs.
"""
from typing import TYPE_CHECKING, Optional

from . import BaseSatelliteProvider, BandNames

if TYPE_CHECKING:
    import xarray as xr
    import geopandas as gpd


class PlanetScopeProvider(BaseSatelliteProvider):
    """
    Provider for PlanetScope 4-band imagery.

    Resolution: 3m (native)
    Cost: Paid (per scene)
    Authentication: Requires API key via environment or parameter
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.planet.com/data/v1"
    ):
        """
        Initialize the PlanetScope provider.

        Args:
            api_key: Planet API key. Falls back to PL_API_KEY env var.
            base_url: Base URL for Planet Data API
        """
        self._api_key = api_key
        self._base_url = base_url

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
    def api_key(self) -> str:
        """Get API key from parameter or environment."""
        if self._api_key:
            return self._api_key
        import os
        api_key = os.environ.get("PL_API_KEY", "")
        if not api_key:
            raise ValueError(
                "Planet API key required. Set PL_API_KEY environment variable "
                "or pass api_key parameter."
            )
        return api_key

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
        import json

        # Planet API request for PlanetScope items
        # Filter for 4-band analytic assets (Ortho Visual 4-Band)
        filter_geometry = {
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
                },
                {
                    "type": "AssetTypeFilter",
                    "config": ["ortho_analytic_4b"]
                }
            ]
        }

        url = f"{self._base_url}/quick-search"
        headers = {
            "Authorization": f"api-key {self.api_key}",
            "Content-Type": "application/json",
        }

        # Paginated search - get first page (typically enough for small areas)
        params = {
            "sort": "acquired desc",
            "limit": 100,
            "_schema": "2.0",
        }

        response = requests.post(
            url,
            headers=headers,
            params=params,
            json={"filter": filter_geometry},
            timeout=60
        )

        response.raise_for_status()
        results = response.json()

        items = results.get("items", [])
        return items

    def load(
        self,
        items: list,
        bands: list[str],
        bbox: list[float]
    ) -> 'xr.DataArray':
        """
        Load PlanetScope bands and clip to bounding box.

        Note: PlanetScope items require asset activation before download.
        This implementation assumes items have been pre-activated or
        uses the download URL directly for simple cases.

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
        import xarray as xr
        import rioxarray  # Enables .rio accessor

        # For each item, download and clip the 4-band asset
        all_band_arrays = []

        for item in items:
            # Get download URL for analytic asset
            assets = item.get("assets", {})
            analytic_4b = assets.get("ortho_analytic_4b")

            if analytic_4b is None:
                continue

            # For signed URLs from Planet (or pre-signed)
            href = analytic_4b.get("href")

            if not href:
                continue

            # Download the asset
            import requests
            from io import BytesIO

            response = requests.get(href, timeout=120)
            response.raise_for_status()

            with rasterio.open(BytesIO(response.content)) as src:
                # Read all 4 bands: Blue, Green, Red, NIR
                band_data = src.read()

                # Get CRS
                src_crs = src.crs.to_epsg() if src.crs else 4326

                # Calculate output transform for target CRS and resolution
                dst_crs = "EPSG:4326"  # WGS84

                # Target shape at 3m resolution over the bbox
                # Convert bbox degrees to approximate pixels
                width = int((bbox[2] - bbox[0]) * 111000 / 3)  # ~111km per degree
                height = int((bbox[3] - bbox[1]) * 111000 / 3)

                # Ensure reasonable bounds
                width = max(min(width, 2000), 100)
                height = max(min(height, 2000), 100)

                # Create destination arrays
                dst_shape = (4, height, width)
                dst_blue = np.zeros(dst_shape, dtype=np.float32)
                dst_green = np.zeros(dst_shape, dtype=np.float32)
                dst_red = np.zeros(dst_shape, dtype=np.float32)
                dst_nir = np.zeros(dst_shape, dtype=np.float32)

                # Reproject each band
                reproject(
                    band_data[0], dst_blue,
                    src_transform=src.transform,
                    src_crs=src_crs,
                    dst_transform=calculate_default_transform(
                        src_crs, dst_crs, src.width, src.height,
                        left=bbox[0], bottom=bbox[1], right=bbox[2], top=bbox[3]
                    )[0],
                    dst_crs=dst_crs,
                    resampling=Resampling.bilinear
                )
                reproject(
                    band_data[1], dst_green,
                    src_transform=src.transform,
                    src_crs=src_crs,
                    dst_transform=calculate_default_transform(
                        src_crs, dst_crs, src.width, src.height,
                        left=bbox[0], bottom=bbox[1], right=bbox[2], top=bbox[3]
                    )[0],
                    dst_crs=dst_crs,
                    resampling=Resampling.bilinear
                )
                reproject(
                    band_data[2], dst_red,
                    src_transform=src.transform,
                    src_crs=src_crs,
                    dst_transform=calculate_default_transform(
                        src_crs, dst_crs, src.width, src.height,
                        left=bbox[0], bottom=bbox[1], right=bbox[2], top=bbox[3]
                    )[0],
                    dst_crs=dst_crs,
                    resampling=Resampling.bilinear
                )
                reproject(
                    band_data[3], dst_nir,
                    src_transform=src.transform,
                    src_crs=src_crs,
                    dst_transform=calculate_default_transform(
                        src_crs, dst_crs, src.width, src.height,
                        left=bbox[0], bottom=bbox[1], right=bbox[2], top=bbox[3]
                    )[0],
                    dst_crs=dst_crs,
                    resampling=Resampling.bilinear
                )

                # Normalize to 0-1 reflectance (PlanetScope is typically 0-10000 or similar)
                for arr in [dst_blue, dst_green, dst_red, dst_nir]:
                    max_val = arr.max()
                    if max_val > 0:
                        arr[:] = arr / max_val

                # Stack into xarray with band dimension
                stacked = np.stack([dst_blue, dst_green, dst_red, dst_nir], axis=0)

                # Create xarray DataArray
                da = xr.DataArray(
                    stacked,
                    dims=["band", "y", "x"],
                    coords={
                        "band": [0, 1, 2, 3],  # Blue, Green, Red, NIR
                        "y": np.linspace(bbox[3], bbox[1], height),
                        "x": np.linspace(bbox[0], bbox[2], width),
                    }
                )

                all_band_arrays.append(da)

        if not all_band_arrays:
            raise ValueError("No valid PlanetScope items could be loaded")

        # Stack all items along a new time dimension
        stacked = xr.concat(all_band_arrays, dim="time")

        # Rename to semantic names
        renamed = stacked.rename({
            "band": "band",
        })

        # Map bands: Band 0=Blue, 1=Green, 2=Red, 3=NIR
        # Create individual DataArrays for each semantic band
        result = xr.DataArray(
            stacked.values,
            dims=["time", "band", "y", "x"],
            coords={
                "time": range(len(stacked)),
                "band": ["blue", "green", "red", "nir"],
                "y": stacked.y,
                "x": stacked.x,
            }
        )

        return result

    def cloud_mask(
        self,
        data: 'xr.DataArray',
        items: list
    ) -> tuple['xr.DataArray', float]:
        """
        Apply cloud mask using PlanetScope Quality Assessment (QA) band.

        PlanetScope provides a per-pixel quality mask indicating:
        - Clear: Pixel is usable
        - Snow: Snow/ice
        - Shadow: Cloud shadow
        - Cloud: Cloud
        - Water: Water bodies
        - Cirrus: High-altitude cirrus

        We include only clear pixels.

        Args:
            data: xarray DataArray with band data
            items: Item metadata from query()

        Returns:
            Tuple of (masked_data, cloud_free_percentage)
        """
        import numpy as np
        import xarray as xr

        # Build a clear mask from all items
        # For each item, check if we have QA information
        clear_mask = None

        for item in items:
            assets = item.get("assets", {})
            qa_asset = assets.get("ortho_udm2")  # UDM2 has quality classification

            if qa_asset is None:
                # No QA available - assume all pixels are clear
                item_mask = np.ones(
                    (data.sizes["y"], data.sizes["x"]),
                    dtype=bool
                )
            else:
                # Download and process QA band
                # QA values: 0=clear, 1=snow, 2=shadow, 3=camera, 4=cloud
                href = qa_asset.get("href")
                if href:
                    import requests
                    from io import BytesIO
                    import rasterio

                    response = requests.get(href, timeout=60)
                    response.raise_for_status()

                    with rasterio.open(BytesIO(response.content)) as src:
                        qa_data = src.read(1)
                        # Include only clear pixels (value 0)
                        item_mask = qa_data == 0
                else:
                    item_mask = np.ones(
                        (data.sizes["y"], data.sizes["x"]),
                        dtype=bool
                    )

            if clear_mask is None:
                clear_mask = item_mask
            else:
                # Union of clear pixels across all items
                clear_mask = clear_mask | item_mask

        if clear_mask is None:
            clear_mask = np.ones(
                (data.sizes["y"], data.sizes["x"]),
                dtype=bool
            )

        # Calculate cloud-free percentage
        total_pixels = clear_mask.size
        valid_pixels = clear_mask.sum()
        cloud_free_pct = float(valid_pixels) / float(total_pixels) if total_pixels > 0 else 0.0

        # Apply mask to all bands
        masked = data.where(clear_mask)

        return masked, cloud_free_pct
