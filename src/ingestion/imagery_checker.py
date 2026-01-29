"""
Lightweight Copernicus imagery availability checker.

Queries the Copernicus Data Space catalog to check if new Sentinel-2
imagery is available, without downloading any actual data.

This is used by the scheduler to determine which farms need processing.
"""
import logging
import os
from datetime import datetime, timedelta
from typing import Optional

import requests

logger = logging.getLogger(__name__)


class CopernicusChecker:
    """
    Lightweight Copernicus catalog checker.

    Only queries metadata - no data downloads.
    """

    # API endpoints
    TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    CATALOG_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1"

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
    ):
        """
        Initialize the checker.

        Args:
            client_id: OAuth2 client ID (defaults to COPERNICUS_CLIENT_ID env var)
            client_secret: OAuth2 client secret (defaults to COPERNICUS_CLIENT_SECRET env var)
        """
        self.client_id = client_id or os.getenv("COPERNICUS_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("COPERNICUS_CLIENT_SECRET")

        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None

    def _get_access_token(self) -> str:
        """Get or refresh the OAuth2 access token."""
        # Check if we have a valid cached token
        if self._access_token and self._token_expires_at:
            if datetime.now() < self._token_expires_at - timedelta(minutes=5):
                return self._access_token

        if not self.client_id or not self.client_secret:
            raise ValueError(
                "Copernicus credentials not configured. "
                "Set COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET environment variables."
            )

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
        expires_in = token_data.get("expires_in", 300)
        self._token_expires_at = datetime.now() + timedelta(seconds=expires_in)

        return self._access_token

    def get_latest_imagery_date(
        self,
        bbox: list[float],
        max_cloud_cover: int = 50,
        days_back: int = 30,
    ) -> Optional[str]:
        """
        Query the catalog to find the most recent available imagery.

        Args:
            bbox: Bounding box [west, south, east, north]
            max_cloud_cover: Maximum cloud cover percentage
            days_back: How many days back to search

        Returns:
            Date string (YYYY-MM-DD) of most recent imagery, or None if not found
        """
        token = self._get_access_token()

        # Date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)

        # Build OData query footprint
        west, south, east, north = bbox
        footprint = f"POLYGON(({west} {south},{east} {south},{east} {north},{west} {north},{west} {south}))"

        # Build filter
        filter_parts = [
            "Collection/Name eq 'SENTINEL-2'",
            "Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'S2MSI2A')",
            f"ContentDate/Start gt {start_date.strftime('%Y-%m-%d')}T00:00:00.000Z",
            f"ContentDate/Start lt {end_date.strftime('%Y-%m-%d')}T23:59:59.999Z",
            f"OData.CSC.Intersects(area=geography'SRID=4326;{footprint}')",
            f"Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value lt {max_cloud_cover})",
        ]

        filter_str = " and ".join(filter_parts)

        url = f"{self.CATALOG_URL}/Products"
        params = {
            "$filter": filter_str,
            "$orderby": "ContentDate/Start desc",
            "$top": 1,  # Only need the most recent one
            "$select": "Id,Name,ContentDate",  # Minimal fields
        }

        logger.debug(f"Querying Copernicus catalog for latest imagery...")

        response = requests.get(
            url,
            params=params,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )

        if response.status_code != 200:
            logger.error(f"Catalog query failed: {response.status_code}")
            return None

        data = response.json()
        products = data.get("value", [])

        if not products:
            logger.debug("No products found")
            return None

        # Get the date from the most recent product
        latest = products[0]
        content_date = latest.get("ContentDate", {}).get("Start")

        if content_date:
            # Parse ISO format and return YYYY-MM-DD
            try:
                dt = datetime.fromisoformat(content_date.replace("Z", "+00:00"))
                return dt.strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                pass

        return None

    def count_available_images(
        self,
        bbox: list[float],
        start_date: str,
        end_date: str,
        max_cloud_cover: int = 50,
    ) -> int:
        """
        Count available images in a date range.

        Useful for debugging/monitoring.

        Args:
            bbox: Bounding box [west, south, east, north]
            start_date: Start date YYYY-MM-DD
            end_date: End date YYYY-MM-DD
            max_cloud_cover: Maximum cloud cover percentage

        Returns:
            Number of available products
        """
        token = self._get_access_token()

        west, south, east, north = bbox
        footprint = f"POLYGON(({west} {south},{east} {south},{east} {north},{west} {north},{west} {south}))"

        filter_parts = [
            "Collection/Name eq 'SENTINEL-2'",
            "Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'S2MSI2A')",
            f"ContentDate/Start gt {start_date}T00:00:00.000Z",
            f"ContentDate/Start lt {end_date}T23:59:59.999Z",
            f"OData.CSC.Intersects(area=geography'SRID=4326;{footprint}')",
            f"Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value lt {max_cloud_cover})",
        ]

        filter_str = " and ".join(filter_parts)

        url = f"{self.CATALOG_URL}/Products/$count"
        params = {"$filter": filter_str}

        response = requests.get(
            url,
            params=params,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )

        if response.status_code != 200:
            logger.error(f"Count query failed: {response.status_code}")
            return 0

        try:
            return int(response.text)
        except ValueError:
            return 0


def get_bbox_from_geometry(geometry: dict) -> list[float]:
    """
    Extract bounding box from a GeoJSON geometry.

    Args:
        geometry: GeoJSON Feature or Geometry

    Returns:
        Bounding box [west, south, east, north]
    """
    if not geometry:
        raise ValueError("Geometry is required")

    # Handle Feature wrapper
    if geometry.get("type") == "Feature":
        geometry = geometry.get("geometry", {})

    coords = geometry.get("coordinates", [])

    if not coords:
        raise ValueError("No coordinates in geometry")

    # Handle Polygon
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


def check_new_imagery_available(
    farm_geometry: dict,
    last_known_date: Optional[str] = None,
    max_cloud_cover: int = 50,
) -> tuple[bool, Optional[str]]:
    """
    Check if new satellite imagery is available for a farm.

    This is the main entry point for the scheduler.

    Args:
        farm_geometry: GeoJSON geometry of the farm boundary
        last_known_date: Last known imagery date (YYYY-MM-DD), if any
        max_cloud_cover: Maximum acceptable cloud cover percentage

    Returns:
        Tuple of (has_new_imagery: bool, latest_date: str or None)
    """
    try:
        bbox = get_bbox_from_geometry(farm_geometry)
    except ValueError as e:
        logger.error(f"Failed to get bbox from geometry: {e}")
        return (False, None)

    checker = CopernicusChecker()

    try:
        latest_date = checker.get_latest_imagery_date(
            bbox=bbox,
            max_cloud_cover=max_cloud_cover,
            days_back=30,
        )
    except Exception as e:
        logger.error(f"Failed to check imagery availability: {e}")
        return (False, None)

    if not latest_date:
        return (False, None)

    # Compare with last known date
    if last_known_date:
        # New imagery is available if latest > last_known
        has_new = latest_date > last_known_date
    else:
        # No previous date - consider as new
        has_new = True

    return (has_new, latest_date)


# CLI for manual testing
if __name__ == "__main__":
    import argparse
    import json

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )

    parser = argparse.ArgumentParser(description="Check Copernicus imagery availability")
    parser.add_argument("--bbox", help="Bounding box: west,south,east,north")
    parser.add_argument("--geometry-file", help="GeoJSON file with farm geometry")
    parser.add_argument("--last-date", help="Last known imagery date (YYYY-MM-DD)")
    parser.add_argument("--cloud-cover", type=int, default=50, help="Max cloud cover %")

    args = parser.parse_args()

    if args.geometry_file:
        with open(args.geometry_file) as f:
            geometry = json.load(f)
        bbox = get_bbox_from_geometry(geometry)
    elif args.bbox:
        bbox = [float(x) for x in args.bbox.split(",")]
    else:
        parser.error("Either --bbox or --geometry-file is required")

    print(f"Checking imagery for bbox: {bbox}")

    checker = CopernicusChecker()
    latest = checker.get_latest_imagery_date(
        bbox=bbox,
        max_cloud_cover=args.cloud_cover,
    )

    print(f"Latest imagery date: {latest}")

    if args.last_date:
        has_new = latest and latest > args.last_date
        print(f"Has new imagery since {args.last_date}: {has_new}")
