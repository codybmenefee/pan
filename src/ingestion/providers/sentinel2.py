"""
Sentinel-2 satellite data provider implementation.

Provides access to Sentinel-2 L2A data from Microsoft Planetary Computer.
"""
from typing import TYPE_CHECKING

from . import BaseSatelliteProvider, BandNames

if TYPE_CHECKING:
    import xarray as xr


class Sentinel2Provider(BaseSatelliteProvider):
    """
    Provider for Sentinel-2 L2A data from Microsoft Planetary Computer.

    Resolution: 10m for visible/NIR bands, 20m for red-edge/SWIR
    Cost: Free
    Authentication: Requires Planetary Computer signed URLs (handled automatically)
    """

    @property
    def resolution_meters(self) -> int:
        """Sentinel-2 native resolution for NIR/Red bands."""
        return 10

    @property
    def band_names(self) -> BandNames:
        """
        Sentinel-2 band mappings.

        Uses B04 (Red), B08 (NIR), B11 (SWIR), B02 (Blue) at native resolutions.
        SCL band is used for cloud masking.
        """
        return BandNames(
            nir="B08",   # Near-infrared, 10m
            red="B04",   # Red, 10m
            swir="B11",  # Short-wave infrared, 20m (will be resampled)
            blue="B02",  # Blue, 10m
        )

    @property
    def requires_auth(self) -> bool:
        """Planetary Computer requires signed URLs but handles auth internally."""
        return False

    @property
    def is_free(self) -> bool:
        """Sentinel-2 data is free."""
        return True

    def query(
        self,
        bbox: list[float],
        start_date: str,
        end_date: str,
        max_cloud_cover: int = 50
    ) -> list:
        """
        Query Microsoft Planetary Computer STAC API for Sentinel-2 imagery.

        Args:
            bbox: Bounding box [west, south, east, north]
            start_date: Start date YYYY-MM-DD
            end_date: End date YYYY-MM-DD
            max_cloud_cover: Maximum cloud cover percentage (0-100)

        Returns:
            List of STAC items matching criteria
        """
        from pystac_client import Client
        import planetary_computer

        catalog = Client.open(
            "https://planetarycomputer.microsoft.com/api/stac/v1",
            modifier=planetary_computer.sign_inplace,
        )

        search = catalog.search(
            collections=["sentinel-2-l2a"],
            bbox=bbox,
            datetime=f"{start_date}/{end_date}",
            query={
                "eo:cloud_cover": {"lte": max_cloud_cover},
            },
        )

        items = list(search.items())
        return items

    def load(
        self,
        items: list,
        bands: list[str],
        bbox: list[float]
    ) -> 'xr.DataArray':
        """
        Load specified bands from Sentinel-2 items.

        Args:
            items: STAC items from query()
            bands: Semantic band names to load ["nir", "red", "swir", "blue"]
            bbox: Bounding box [west, south, east, north]

        Returns:
            xarray DataArray with loaded band data
        """
        from odc.stac import load

        # Convert semantic band names to Sentinel-2 band IDs
        band_ids = [self.band_names[b] for b in bands]

        data = load(
            items,
            bands=band_ids,
            bbox=bbox,
            resolution=self.resolution_meters,
        )

        # Convert from DN (0-10000) to reflectance (0-1)
        for band_id in band_ids:
            if band_id in data:
                data[band_id] = data[band_id].astype("float32") / 10000

        # Rename back to semantic names for consistency
        renamed = data.rename({
            self.band_names["nir"]: "nir",
            self.band_names["red"]: "red",
            self.band_names["swir"]: "swir",
            self.band_names["blue"]: "blue",
        })

        return renamed

    def cloud_mask(
        self,
        data: 'xr.DataArray',
        items: list
    ) -> tuple['xr.DataArray', float]:
        """
        Apply cloud mask using Sentinel-2 SCL (Scene Classification) band.

        The SCL band classifies each pixel into categories. We include only
        pixels classified as:
        - 4: Vegetation
        - 5: Bare soil
        - 7: Unclassified

        We exclude:
        - 0: No data
        - 1: Saturated/defective
        - 3: Cloud shadow
        - 6: Water (not useful for pasture)
        - 8, 9, 10: Various cloud types
        - 11: Snow/ice

        Args:
            data: xarray DataArray with band data
            items: STAC items used to load the data

        Returns:
            Tuple of (masked_data, cloud_free_percentage)
        """
        from odc.stac import load
        import numpy as np

        # Load SCL band for the same area and items
        scl_data = load(
            items,
            bands=["SCL"],
            bbox=data.odc.bbox,
            resolution=self.resolution_meters,
        )

        scl = scl_data.SCL

        # Valid pixel classes (vegetation, bare soil, unclassified)
        valid_classes = [4, 5, 7]

        # Create mask: True = keep, False = cloud/masked
        mask = np.isin(scl, valid_classes)

        # Ensure mask matches data dimensions
        if mask.shape != data.isel(time=0).nir.shape:
            mask = mask.isel(time=0)
            scl = scl.isel(time=0)

        # Calculate cloud-free percentage
        total_pixels = mask.size
        valid_pixels = mask.sum()
        cloud_free_pct = float(valid_pixels) / float(total_pixels) if total_pixels > 0 else 0.0

        # Apply mask to all bands - set invalid pixels to NaN
        masked = data.where(mask)

        return masked, cloud_free_pct

    def get_scl_band(self, items: list, bbox: list[float]) -> 'xr.DataArray':
        """
        Load just the SCL band for cloud masking.

        Args:
            items: STAC items from query()
            bbox: Bounding box [west, south, east, north]

        Returns:
            xarray DataArray with SCL classification data
        """
        from odc.stac import load

        scl = load(
            items,
            bands=["SCL"],
            bbox=bbox,
            resolution=20,  # SCL is natively 20m
        )

        return scl.SCL
