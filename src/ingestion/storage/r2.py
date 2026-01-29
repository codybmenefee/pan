"""
Cloudflare R2 storage integration for satellite imagery tiles.

Provides S3-compatible storage operations for GeoTIFF tiles with
signed URL generation and retention management.
"""
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import BinaryIO, TypedDict

import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)


class TileUploadResult(TypedDict):
    """Result of uploading a tile to R2."""
    r2_key: str
    r2_url: str
    file_size_bytes: int
    expires_at: str | None


@dataclass
class R2Config:
    """Configuration for R2 storage."""
    account_id: str
    access_key_id: str
    secret_access_key: str
    bucket_name: str
    public_url_base: str | None = None

    @classmethod
    def from_env(cls) -> "R2Config":
        """Load R2 configuration from environment variables."""
        account_id = os.getenv("R2_ACCOUNT_ID")
        access_key_id = os.getenv("R2_ACCESS_KEY_ID")
        secret_access_key = os.getenv("R2_SECRET_ACCESS_KEY")
        bucket_name = os.getenv("R2_BUCKET_NAME", "grazing-satellite-tiles")
        public_url_base = os.getenv("R2_PUBLIC_URL_BASE")

        if not all([account_id, access_key_id, secret_access_key]):
            raise ValueError(
                "R2 credentials not configured. Set R2_ACCOUNT_ID, "
                "R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables."
            )

        return cls(
            account_id=account_id,
            access_key_id=access_key_id,
            secret_access_key=secret_access_key,
            bucket_name=bucket_name,
            public_url_base=public_url_base,
        )


class R2Storage:
    """
    Cloudflare R2 storage client for satellite imagery tiles.

    Uses S3-compatible API to upload/download GeoTIFF tiles.

    Tile organization:
        {bucket}/
          {farm_external_id}/
            {year}/
              {month}/
                {capture_date}/
                  rgb_10m.tif
                  ndvi_10m.tif
                  evi_10m.tif
                  ndwi_10m.tif
    """

    def __init__(self, config: R2Config | None = None):
        """
        Initialize R2 storage client.

        Args:
            config: R2 configuration (defaults to loading from env)
        """
        self.config = config or R2Config.from_env()

        # Create S3 client for R2
        self._client = boto3.client(
            "s3",
            endpoint_url=f"https://{self.config.account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=self.config.access_key_id,
            aws_secret_access_key=self.config.secret_access_key,
            config=Config(
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "adaptive"},
            ),
        )

    def _get_tile_key(
        self,
        farm_external_id: str,
        capture_date: str,
        tile_type: str,
        resolution_meters: int,
        file_extension: str = "tif",
    ) -> str:
        """
        Generate the R2 object key for a tile.

        Args:
            farm_external_id: Farm identifier
            capture_date: Capture date YYYY-MM-DD
            tile_type: Type of tile (rgb, ndvi, evi, ndwi)
            resolution_meters: Resolution in meters
            file_extension: File extension (tif, png)

        Returns:
            R2 object key
        """
        # Parse date for year/month organization
        dt = datetime.strptime(capture_date, "%Y-%m-%d")
        year = dt.strftime("%Y")
        month = dt.strftime("%m")

        return f"{farm_external_id}/{year}/{month}/{capture_date}/{tile_type}_{resolution_meters}m.{file_extension}"

    def upload_tile(
        self,
        file_path: str | Path,
        farm_external_id: str,
        capture_date: str,
        tile_type: str,
        resolution_meters: int,
        retention_days: int | None = None,
    ) -> TileUploadResult:
        """
        Upload a tile image to R2.

        Supports both PNG (for RGB tiles) and GeoTIFF (for index tiles).

        Args:
            file_path: Path to the local image file (PNG or GeoTIFF)
            farm_external_id: Farm identifier
            capture_date: Capture date YYYY-MM-DD
            tile_type: Type of tile (rgb, ndvi, evi, ndwi)
            resolution_meters: Resolution in meters
            retention_days: Optional retention period (for lifecycle management)

        Returns:
            TileUploadResult with R2 key, URL, and metadata
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"Tile file not found: {file_path}")

        # Detect file type and set appropriate content type
        file_extension = file_path.suffix.lower().lstrip('.')
        if file_extension == 'png':
            content_type = "image/png"
        elif file_extension in ('tif', 'tiff'):
            content_type = "image/tiff"
            file_extension = "tif"
        else:
            content_type = "application/octet-stream"

        r2_key = self._get_tile_key(
            farm_external_id, capture_date, tile_type, resolution_meters, file_extension
        )

        file_size = file_path.stat().st_size

        logger.info(f"Uploading tile to R2: {r2_key} ({file_size / 1024 / 1024:.2f} MB)")

        # Calculate expiration if retention specified
        expires_at = None
        extra_args = {
            "ContentType": content_type,
            "Metadata": {
                "farm_external_id": farm_external_id,
                "capture_date": capture_date,
                "tile_type": tile_type,
                "resolution_meters": str(resolution_meters),
            },
        }

        if retention_days:
            expires_at = (datetime.now() + timedelta(days=retention_days)).isoformat()
            extra_args["Metadata"]["expires_at"] = expires_at

        # Upload file
        with open(file_path, "rb") as f:
            self._client.upload_fileobj(
                f,
                self.config.bucket_name,
                r2_key,
                ExtraArgs=extra_args,
            )

        # Generate URL
        if self.config.public_url_base:
            r2_url = f"{self.config.public_url_base}/{r2_key}"
        else:
            # Generate presigned URL valid for 7 days
            r2_url = self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.config.bucket_name, "Key": r2_key},
                ExpiresIn=7 * 24 * 60 * 60,  # 7 days
            )

        logger.info(f"Uploaded tile successfully: {r2_key}")

        return TileUploadResult(
            r2_key=r2_key,
            r2_url=r2_url,
            file_size_bytes=file_size,
            expires_at=expires_at,
        )

    def upload_tile_bytes(
        self,
        data: bytes | BinaryIO,
        farm_external_id: str,
        capture_date: str,
        tile_type: str,
        resolution_meters: int,
        retention_days: int | None = None,
    ) -> TileUploadResult:
        """
        Upload tile data directly from bytes or file-like object.

        Args:
            data: Tile data as bytes or file-like object
            farm_external_id: Farm identifier
            capture_date: Capture date YYYY-MM-DD
            tile_type: Type of tile (rgb, ndvi, evi, ndwi)
            resolution_meters: Resolution in meters
            retention_days: Optional retention period

        Returns:
            TileUploadResult with R2 key, URL, and metadata
        """
        from io import BytesIO

        r2_key = self._get_tile_key(
            farm_external_id, capture_date, tile_type, resolution_meters
        )

        # Convert bytes to file-like object if needed
        if isinstance(data, bytes):
            file_size = len(data)
            data = BytesIO(data)
        else:
            # Get size from file-like object
            data.seek(0, 2)
            file_size = data.tell()
            data.seek(0)

        logger.info(f"Uploading tile to R2: {r2_key} ({file_size / 1024 / 1024:.2f} MB)")

        # Calculate expiration if retention specified
        expires_at = None
        extra_args = {
            "ContentType": "image/tiff",
            "Metadata": {
                "farm_external_id": farm_external_id,
                "capture_date": capture_date,
                "tile_type": tile_type,
                "resolution_meters": str(resolution_meters),
            },
        }

        if retention_days:
            expires_at = (datetime.now() + timedelta(days=retention_days)).isoformat()
            extra_args["Metadata"]["expires_at"] = expires_at

        self._client.upload_fileobj(
            data,
            self.config.bucket_name,
            r2_key,
            ExtraArgs=extra_args,
        )

        # Generate URL
        if self.config.public_url_base:
            r2_url = f"{self.config.public_url_base}/{r2_key}"
        else:
            r2_url = self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.config.bucket_name, "Key": r2_key},
                ExpiresIn=7 * 24 * 60 * 60,
            )

        return TileUploadResult(
            r2_key=r2_key,
            r2_url=r2_url,
            file_size_bytes=file_size,
            expires_at=expires_at,
        )

    def get_signed_url(
        self,
        r2_key: str,
        expires_in_seconds: int = 3600,
    ) -> str:
        """
        Generate a signed URL for accessing a tile.

        Args:
            r2_key: R2 object key
            expires_in_seconds: URL validity period (default 1 hour)

        Returns:
            Signed URL for accessing the tile
        """
        if self.config.public_url_base:
            return f"{self.config.public_url_base}/{r2_key}"

        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.config.bucket_name, "Key": r2_key},
            ExpiresIn=expires_in_seconds,
        )

    def delete_tile(self, r2_key: str) -> bool:
        """
        Delete a tile from R2.

        Args:
            r2_key: R2 object key

        Returns:
            True if deletion successful
        """
        logger.info(f"Deleting tile from R2: {r2_key}")

        try:
            self._client.delete_object(
                Bucket=self.config.bucket_name,
                Key=r2_key,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete tile {r2_key}: {e}")
            return False

    def list_farm_tiles(
        self,
        farm_external_id: str,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict]:
        """
        List all tiles for a farm within a date range.

        Args:
            farm_external_id: Farm identifier
            start_date: Optional start date YYYY-MM-DD
            end_date: Optional end date YYYY-MM-DD

        Returns:
            List of tile metadata dictionaries
        """
        prefix = f"{farm_external_id}/"

        paginator = self._client.get_paginator("list_objects_v2")
        pages = paginator.paginate(
            Bucket=self.config.bucket_name,
            Prefix=prefix,
        )

        tiles = []
        for page in pages:
            for obj in page.get("Contents", []):
                key = obj["Key"]

                # Parse key to extract metadata
                # Format: farm_id/year/month/date/type_resolution.tif
                parts = key.split("/")
                if len(parts) >= 5:
                    capture_date = parts[3]

                    # Filter by date range if specified
                    if start_date and capture_date < start_date:
                        continue
                    if end_date and capture_date > end_date:
                        continue

                    tiles.append({
                        "r2_key": key,
                        "capture_date": capture_date,
                        "size_bytes": obj["Size"],
                        "last_modified": obj["LastModified"].isoformat(),
                    })

        return tiles

    def cleanup_expired_tiles(self, farm_external_id: str) -> int:
        """
        Delete tiles that have passed their retention period.

        Args:
            farm_external_id: Farm identifier

        Returns:
            Number of tiles deleted
        """
        tiles = self.list_farm_tiles(farm_external_id)
        deleted_count = 0

        for tile in tiles:
            # Get object metadata to check expiration
            try:
                response = self._client.head_object(
                    Bucket=self.config.bucket_name,
                    Key=tile["r2_key"],
                )

                expires_at = response.get("Metadata", {}).get("expires_at")
                if expires_at:
                    expires_dt = datetime.fromisoformat(expires_at)
                    if datetime.now() > expires_dt:
                        if self.delete_tile(tile["r2_key"]):
                            deleted_count += 1

            except Exception as e:
                logger.warning(f"Error checking tile {tile['r2_key']}: {e}")

        logger.info(f"Cleaned up {deleted_count} expired tiles for farm {farm_external_id}")
        return deleted_count


# Retention policies by tier
RETENTION_POLICIES = {
    "free": {
        "raw_imagery": None,  # No raw imagery for free tier
        "index_data_days": 365,  # 1 year
    },
    "starter": {
        "raw_imagery_days": 365,  # 1 year
        "index_data_days": 1095,  # 3 years
    },
    "professional": {
        "raw_imagery_days": 1095,  # 3 years
        "index_data_days": 1825,  # 5 years
    },
    "enterprise": {
        "raw_imagery_days": None,  # Unlimited
        "index_data_days": None,  # Unlimited
    },
}


def get_retention_days(tier: str, data_type: str) -> int | None:
    """
    Get retention period for a tier and data type.

    Args:
        tier: Subscription tier (free, starter, professional, enterprise)
        data_type: Type of data (raw_imagery or index_data)

    Returns:
        Retention period in days, or None for unlimited
    """
    policy = RETENTION_POLICIES.get(tier, RETENTION_POLICIES["free"])
    key = f"{data_type}_days"
    return policy.get(key)
