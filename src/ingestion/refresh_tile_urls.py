#!/usr/bin/env python3
"""
Refresh presigned R2 URLs for satellite tiles.

Generates new presigned URLs for existing tiles in R2 and updates
the Convex database. Temporary fix while the ingestion service is
being rewired for better R2 connectivity.

Usage:
    cd src/ingestion
    python refresh_tile_urls.py
    python refresh_tile_urls.py --farm-id farm-1 --expiry-days 30
    python refresh_tile_urls.py --no-cleanup-demos
"""
import argparse
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

import boto3
import requests
from botocore.config import Config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def load_env(env_path: str = ".env.local"):
    """Load environment variables from .env.local file."""
    path = Path(env_path)
    if not path.exists():
        logger.warning(f"{env_path} not found, using existing environment variables")
        return

    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip()
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                os.environ.setdefault(key, value)


def create_r2_client():
    """Create an S3-compatible R2 client."""
    account_id = os.environ.get("R2_ACCOUNT_ID")
    access_key = os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")

    if not all([account_id, access_key, secret_key]):
        raise ValueError(
            "R2 credentials not configured. "
            "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
        )

    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
    )


def list_r2_tiles(client, bucket: str, farm_id: str) -> list[dict]:
    """List all tiles for a farm in R2."""
    prefix = f"{farm_id}/"
    tiles = []

    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            parts = key.split("/")
            if len(parts) >= 5:
                # Format: farm_id/year/month/date/type_resolution.ext
                capture_date = parts[3]
                filename = parts[4]
                tile_type_res = filename.rsplit(".", 1)[0]  # e.g. "ndvi_heatmap_10m"
                tile_type = tile_type_res.rsplit("_", 1)[0]  # e.g. "ndvi_heatmap"

                tiles.append(
                    {
                        "r2_key": key,
                        "capture_date": capture_date,
                        "tile_type": tile_type,
                        "size_bytes": obj["Size"],
                    }
                )

    return tiles


def generate_presigned_url(
    client, bucket: str, key: str, expiry_seconds: int
) -> str:
    """Generate a presigned URL for an R2 object."""
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expiry_seconds,
    )


def convex_query(deployment_url: str, api_key: str, path: str, args: dict):
    """Call a Convex query function via HTTP API."""
    url = f'{deployment_url.rstrip("/")}/api/query'
    headers = {
        "Authorization": f"Convex {api_key}",
        "Content-Type": "application/json",
    }
    payload = {"path": path, "args": args, "format": "json"}

    response = requests.post(url, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
    result = response.json()

    if result.get("status") == "error":
        raise Exception(f"Convex query error: {result.get('errorMessage')}")

    return result.get("value")


def convex_mutation(deployment_url: str, api_key: str, path: str, args: dict):
    """Call a Convex mutation function via HTTP API."""
    url = f'{deployment_url.rstrip("/")}/api/mutation'
    headers = {
        "Authorization": f"Convex {api_key}",
        "Content-Type": "application/json",
    }
    payload = {"path": path, "args": args, "format": "json"}

    response = requests.post(url, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
    result = response.json()

    if result.get("status") == "error":
        raise Exception(f"Convex mutation error: {result.get('errorMessage')}")

    return result.get("value")


def main():
    parser = argparse.ArgumentParser(
        description="Refresh presigned R2 URLs for satellite tiles"
    )
    parser.add_argument(
        "--farm-id",
        default="farm-1",
        help="Farm external ID (default: farm-1)",
    )
    parser.add_argument(
        "--expiry-days",
        type=int,
        default=7,
        help="Presigned URL expiry in days (default: 7, max: 7 for R2/S3)",
    )
    parser.add_argument(
        "--cleanup-demos",
        action="store_true",
        default=True,
        help="Force cleanup all demo farms after refresh (default: true)",
    )
    parser.add_argument(
        "--no-cleanup-demos",
        action="store_false",
        dest="cleanup_demos",
        help="Skip demo farm cleanup",
    )
    args = parser.parse_args()

    # Load environment
    load_env()

    deployment_url = os.environ.get("CONVEX_DEPLOYMENT_URL")
    api_key = os.environ.get("CONVEX_API_KEY")
    bucket = os.environ.get("R2_BUCKET_NAME", "grazing-satellite-tiles")

    if not deployment_url or not api_key:
        logger.error("CONVEX_DEPLOYMENT_URL and CONVEX_API_KEY required")
        sys.exit(1)

    # R2/S3 presigned URLs have a max expiry of 7 days
    if args.expiry_days > 7:
        logger.warning(
            f"Expiry of {args.expiry_days} days exceeds R2 max of 7 days. Clamping to 7."
        )
        args.expiry_days = 7

    # Connect to R2
    logger.info("Connecting to R2...")
    r2_client = create_r2_client()

    # List tiles in R2 for the farm
    logger.info(f"Listing tiles for {args.farm_id} in R2 bucket {bucket}...")
    r2_tiles = list_r2_tiles(r2_client, bucket, args.farm_id)
    logger.info(f"Found {len(r2_tiles)} tiles in R2")

    if not r2_tiles:
        logger.warning("No tiles found in R2. Nothing to refresh.")
        return

    # Get existing tile records from Convex
    logger.info("Querying existing tile records from Convex...")
    existing_tiles = convex_query(
        deployment_url,
        api_key,
        "satelliteTiles:getTilesForFarmByExternalId",
        {"farmExternalId": args.farm_id},
    )
    logger.info(f"Found {len(existing_tiles or [])} existing tile records in Convex")

    # Build lookup of existing tiles
    existing_map = {}
    for tile in existing_tiles or []:
        key = f"{tile['captureDate']}:{tile['tileType']}"
        existing_map[key] = tile

    # Deduplicate R2 tiles: prefer .png over .tif when both exist
    tile_map: dict[str, dict] = {}
    for r2_tile in r2_tiles:
        key = f"{r2_tile['capture_date']}:{r2_tile['tile_type']}"
        existing = tile_map.get(key)
        if existing:
            # Prefer PNG over GeoTIFF (MapLibre can only display PNG/JPEG)
            if r2_tile["r2_key"].endswith(".png"):
                tile_map[key] = r2_tile
        else:
            tile_map[key] = r2_tile
    r2_tiles_deduped = list(tile_map.values())
    if len(r2_tiles_deduped) < len(r2_tiles):
        logger.info(
            f"Deduplicated {len(r2_tiles)} -> {len(r2_tiles_deduped)} tiles "
            "(preferring .png over .tif)"
        )

    # Generate fresh presigned URLs and update Convex
    expiry_seconds = args.expiry_days * 24 * 60 * 60
    expires_at = (datetime.now() + timedelta(days=args.expiry_days)).isoformat()

    updated = 0
    skipped = 0
    errors = 0

    for r2_tile in r2_tiles_deduped:
        key = f"{r2_tile['capture_date']}:{r2_tile['tile_type']}"

        # Generate fresh presigned URL
        presigned_url = generate_presigned_url(
            r2_client, bucket, r2_tile["r2_key"], expiry_seconds
        )

        existing = existing_map.get(key)

        if existing:
            # Update existing tile record
            try:
                convex_mutation(
                    deployment_url,
                    api_key,
                    "satelliteTiles:refreshTileUrl",
                    {
                        "farmExternalId": args.farm_id,
                        "captureDate": r2_tile["capture_date"],
                        "tileType": r2_tile["tile_type"],
                        "r2Url": presigned_url,
                        "expiresAt": expires_at,
                    },
                )
                updated += 1
                logger.info(
                    f"  Updated: {r2_tile['capture_date']}/{r2_tile['tile_type']}"
                )
            except Exception as e:
                logger.error(f"  Error updating {key}: {e}")
                errors += 1
        else:
            # No existing record - create one using createTileByExternalId
            # Need bounds from the source farm. Query the farm geometry.
            logger.warning(
                f"  No existing record for {key} - "
                "skipping (run full pipeline to create with bounds)"
            )
            skipped += 1

    logger.info(
        f"\nRefresh complete: {updated} updated, {skipped} skipped, {errors} errors"
    )

    # Cleanup demo farms so they pick up fresh URLs on next seed
    if args.cleanup_demos:
        logger.info("\nCleaning up demo farms...")
        try:
            result = convex_mutation(
                deployment_url,
                api_key,
                "demo:forceCleanupAllDemoFarms",
                {},
            )
            deleted = (
                result.get("deletedCount", 0) if isinstance(result, dict) else result
            )
            logger.info(f"Cleaned up {deleted} demo farms")
        except Exception as e:
            logger.error(f"Error cleaning up demo farms: {e}")

    logger.info("\nDone. New demo sessions will use fresh tile URLs.")


if __name__ == "__main__":
    main()
