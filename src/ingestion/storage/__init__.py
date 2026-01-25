"""
Storage abstraction layer for satellite imagery tiles.

Provides interfaces for cloud storage backends (Cloudflare R2, S3, etc.)
"""
from .r2 import R2Storage, TileUploadResult

__all__ = ["R2Storage", "TileUploadResult"]
