"""
Main entry point for Phase 2 satellite pipeline PoC.
"""
import json
from pathlib import Path
import numpy as np

from query_sentinel2 import query_sentinel2
from compute_ndvi import compute_ndvi
from visualize_ndvi import visualize_ndvi

FARM_BBOX = [-87.0583, 35.6234, -87.0183, 35.6554]

START_DATE = "2026-01-10"
END_DATE = "2026-01-20"

def main():
    print("=" * 60)
    print("Phase 2: Satellite Pipeline Proof of Concept")
    print("=" * 60)

    print("\n[1/4] Querying Planetary Computer STAC API...")
    items = query_sentinel2(
        aoi_bbox=FARM_BBOX,
        start_date=START_DATE,
        end_date=END_DATE,
        max_cloud_cover=30,
    )

    if not items:
        print("ERROR: No cloud-free imagery found")
        return

    best_item = min(items, key=lambda i: i.properties.get("eo:cloud_cover", 100))
    print(f"Selected scene: {best_item.id}")
    print(f"Cloud cover: {best_item.properties.get('eo:cloud_cover')}%")

    print("\n[2/4] Computing NDVI...")
    ndvi = compute_ndvi([best_item], FARM_BBOX)

    print("\n[3/4] Computing statistics...")
    valid_ndvi = ndvi[~np.isnan(ndvi)]
    print(f"  Min NDVI: {np.nanmin(ndvi):.3f}")
    print(f"  Max NDVI: {np.nanmax(ndvi):.3f}")
    print(f"  Mean NDVI: {np.nanmean(ndvi):.3f}")
    print(f"  Valid pixels: {len(valid_ndvi)}")

    print("\n[4/4] Generating visualization...")
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    visualize_ndvi(ndvi, str(output_dir / "ndvi_hillcrest.png"))

    print("\n" + "=" * 60)
    print("Pipeline complete! Check output/ndvi_hillcrest.png")
    print("=" * 60)

if __name__ == "__main__":
    main()
