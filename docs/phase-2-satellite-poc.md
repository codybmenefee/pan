# Phase 2: Satellite Pipeline Proof of Concept

**Duration:** 1-2 weeks

**Goal:** Prove we can fetch satellite data and compute NDVI for a known location.

## Overview

This phase validates the data path from Microsoft Planetary Computer to usable NDVI values for our sample farm in Tennessee. We will:

1. Set up Python environment with required dependencies
2. Query Sentinel-2 data via STAC API for the sample farm AOI
3. Compute NDVI from NIR and Red bands
4. Validate results are in expected range (0.2-0.6 for pasture)

## Farm Geometry (from Phase 1)

The sample farm is located at:
- **Location:** 943 Riverview Ln, Columbia, TN 38401
- **Coordinates:** [-87.0403892, 35.6389946]
- **Area:** ~142 hectares
- **Pastures:** 8 (South Valley, North Flat, Top Block, East Ridge, Creek Bend, West Slope, Creek Side, Lower Pasture)

### Bounding Box for AOI

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [-87.0583, 35.6554],
      [-87.0183, 35.6554],
      [-87.0183, 35.6234],
      [-87.0583, 35.6234],
      [-87.0583, 35.6554]
    ]]
  }
}
```

## Implementation Steps

### Step 1: Python Environment Setup

Create `src/ingestion/pyproject.toml`:

```toml
[project]
name = "pan-satellite"
version = "0.1.0"
description = "Satellite data ingestion for Grazing Intelligence"

[project.dependencies]
pystac-client = ">=0.7.2"
odc-stac = ">=0.3.0"
rasterio = ">=1.3.0"
numpy = ">=1.24.0"
matplotlib = ">=3.7.0"

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"
```

**Validation criteria:**
- All imports successful
- Can connect to Planetary Computer STAC API

### Step 2: STAC API Query Script

Create `src/ingestion/query_sentinel.py`:

```python
"""
Query Microsoft Planetary Computer for Sentinel-2 imagery over farm AOI.
"""
from pystac_client import Client
import planetary_computer

def query_sentinel2(aoi_bbox, start_date, end_date, max_cloud_cover=50):
    """
    Query Sentinel-2 STAC catalog for cloud-free imagery.

    Args:
        aoi_bbox: [west, south, east, north] bounding box
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        max_cloud_cover: Maximum cloud cover percentage

    Returns:
        List of STAC items matching criteria
    """
    catalog = Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=planetary_computer.sign_inplace,
    )

    search = catalog.search(
        collections=["sentinel-2-l2a"],
        bbox=aoi_bbox,
        datetime=f"{start_date}/{end_date}",
        query={
            "eo:cloud_cover": {"lte": max_cloud_cover},
        },
    )

    items = list(search.items())
    print(f"Found {len(items)} cloud-free scenes")
    return items
```

**Validation criteria:**
- Successfully authenticates with Planetary Computer
- Returns 1+ Sentinel-2 L2A items for known cloud-free date
- Items contain required bands (B04, B08 for NDVI)

### Step 3: NDVI Computation

Create `src/ingestion/compute_ndvi.py`:

```python
"""
Compute NDVI from Sentinel-2 imagery.
"""
import numpy as np
import rasterio
from odc.stac import load

def compute_ndvi(items, aoi_bbox):
    """
    Load NIR and Red bands, compute NDVI.

    NDVI = (NIR - Red) / (NIR + Red)
    NIR = Sentinel-2 Band 8 (near-infrared, 0.78-0.90 µm)
    Red = Sentinel-2 Band 4 (red, 0.65-0.68 µm)

    Args:
        items: STAC items from query
        aoi_bbox: Bounding box for crop

    Returns:
        xarray DataArray with NDVI values
    """
    # Load bands 4 (Red) and 8 (NIR) for all items
    data = load(
        items,
        bands=["B04", "B08"],
        bbox=aoi_bbox,
        resolution=10,  # 10m per pixel for Sentinel-2
    )

    # Convert to float for NDVI computation
    red = data.B04.astype("float32") / 10000  # Scale factor for L2A
    nir = data.B08.astype("float32") / 10000

    # Compute NDVI with division by zero protection
    with np.errstate(divide="ignore", invalid="ignore"):
        ndvi = (nir - red) / (nir + red)
        ndvi = np.where(np.isfinite(ndvi), ndvi, np.nan)

    return ndvi
```

**Validation criteria:**
- NDVI values range from -1.0 to +1.0
- Known pasture areas show 0.2-0.6 range
- Water/bare soil shows < 0.2

### Step 4: Visualization Script

Create `src/ingestion/visualize_ndvi.py`:

```python
"""
Visualize NDVI output for validation.
"""
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

def visualize_ndvi(ndvi_data, output_path="ndvi_output.png"):
    """
    Create NDVI visualization with color scale.

    NDVI Color Scale:
    - < 0.0: Blue (water)
    - 0.0-0.2: Brown (bare soil)
    - 0.2-0.4: Light green (sparse vegetation)
    - 0.4-0.6: Green (healthy pasture)
    - > 0.6: Dark green (dense biomass)
    """
    fig, ax = plt.subplots(figsize=(10, 10))

    # Custom NDVI colormap
    colors = [
        (0.0, "#0000FF"),   # Water - blue
        (0.2, "#8B4513"),   # Bare soil - brown
        (0.4, "#90EE90"),   # Sparse - light green
        (0.6, "#228B22"),   # Healthy - forest green
        (1.0, "#006400"),   # Dense - dark green
    ]
    cmap = mcolors.LinearSegmentedColormap.from_list("ndvi", colors)

    im = ax.imshow(ndvi_data[0], cmap=cmap, vmin=-0.2, vmax=1.0)
    ax.set_title("NDVI - Hillcrest Station")
    ax.axis("off")
    plt.colorbar(im, ax=ax, label="NDVI")

    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"NDVI visualization saved to {output_path}")
```

### Step 5: Main Pipeline Script

Create `src/ingestion/pipeline.py`:

```python
"""
Main entry point for Phase 2 satellite pipeline PoC.
"""
import json
from pathlib import Path

from query_sentinel2 import query_sentinel2
from compute_ndvi import compute_ndvi
from visualize_ndvi import visualize_ndvi

# Farm AOI bounding box (from seedData.ts)
FARM_BBOX = [-87.0583, 35.6234, -87.0183, 35.6554]

# Known cloud-free date for Tennessee region
# For January 2026, aim for clear sky period
START_DATE = "2026-01-10"
END_DATE = "2026-01-20"

def main():
    print("=" * 60)
    print("Phase 2: Satellite Pipeline Proof of Concept")
    print("=" * 60)

    # Step 1: Query STAC API
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

    # Use the least cloudy scene
    best_item = min(items, key=lambda i: i.properties.get("eo:cloud_cover", 100))
    print(f"Selected scene: {best_item.id}")
    print(f"Cloud cover: {best_item.properties.get('eo:cloud_cover')}%")

    # Step 2: Compute NDVI
    print("\n[2/4] Computing NDVI...")
    ndvi = compute_ndvi([best_item], FARM_BBOX)

    # Step 3: Compute statistics
    print("\n[3/4] Computing statistics...")
    valid_ndvi = ndvi.values[~np.isnan(ndvi.values)]
    print(f"  Min NDVI: {np.nanmin(ndvi.values):.3f}")
    print(f"  Max NDVI: {np.nanmax(ndvi.values):.3f}")
    print(f"  Mean NDVI: {np.nanmean(ndvi.values):.3f}")
    print(f"  Valid pixels: {len(valid_ndvi)}")

    # Step 4: Visualize
    print("\n[4/4] Generating visualization...")
    visualize_ndvi(ndvi, "output/ndvi_hillcrest.png")

    print("\n" + "=" * 60)
    print("Pipeline complete! Check output/ndvi_hillcrest.png")
    print("=" * 60)

if __name__ == "__main__":
    main()
```

## Directory Structure

```
src/
├── ingestion/
│   ├── pyproject.toml          # Python dependencies
│   ├── __init__.py
│   ├── query_sentinel2.py      # STAC API queries
│   ├── compute_ndvi.py         # NDVI computation
│   ├── visualize_ndvi.py       # Visualization
│   ├── pipeline.py             # Main entry point
│   └── output/                 # Generated outputs
│       └── ndvi_hillcrest.png
└── README.md
```

## Dependencies Matrix

| Library | Purpose | Version Constraint |
|---------|---------|-------------------|
| `pystac-client` | STAC catalog queries | >= 0.7.2 |
| `odc-stac` | Load STAC items as xarray | >= 0.3.0 |
| `rasterio` | Raster I/O and operations | >= 1.3.0 |
| `numpy` | Numerical operations | >= 1.24.0 |
| `matplotlib` | Visualization | >= 3.7.0 |
| `planetary-computer` | Authentication modifier | Latest |

## Validation Checklist

- [ ] **Authentication:** Successfully connects to Planetary Computer without errors
- [ ] **Data retrieval:** Returns 1+ Sentinel-2 L2A items for the farm AOI
- [ ] **NDVI computation:** Values range from -1.0 to +1.0
- [ ] **Reasonable values:** Pasture areas show 0.2-0.6 range
- [ ] **Visualization:** Color-coded NDVI map renders correctly
- [ ] **Performance:** Pipeline completes in under 30 seconds for single scene

## Known Good Dates for Testing

For the Tennessee region (36°N), cloud-free Sentinel-2 scenes are typically available:
- **January:** Clear winter days with low vegetation
- **Look for:** eo:cloud_cover < 30%

The pipeline should start with a manually selected known-good date, then expand to automatic cloud-cover filtering.

## Expected Output

Running `python src/ingestion/pipeline.py` should produce:

1. Console output showing:
   - Number of scenes found
   - Selected scene ID and cloud cover
   - NDVI statistics (min, max, mean)
   - Valid pixel count

2. Visual output at `output/ndvi_hillcrest.png`:
   - Color-coded NDVI map of the farm
   - Legend showing vegetation levels
   - Professional presentation quality

## Success Criteria

Phase 2 is complete when:
1. ✅ The Python pipeline runs end-to-end without errors
2. ✅ NDVI values are in expected range for pasture (0.2-0.6)
3. ✅ Visualization is clear and interpretable
4. ✅ Documentation explains how to run the pipeline
5. ✅ Results are committed to the repository for reference

## Next Steps (Phase 3)

After Phase 2 validates the data path:
- Implement cloud masking using SCL band
- Expand to 21-day rolling window
- Add zonal statistics per pasture
- Store observations in Convex

## Troubleshooting

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Authentication error | No Planetary Computer key | Set `PC_SDK_SUBSCRIPTION_KEY` env var |
| No items returned | Cloud cover too low | Increase max_cloud_cover or change dates |
| All NDVI = 1.0 | Missing scale factor | Divide by 10000 (L2A scaling) |
| Memory error | Large AOI | Reduce resolution to 20m or 60m |

## References

- [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/)
- [Sentinel-2 L2A Data](https://planetarycomputer.microsoft.com/docs/overview/stac/sentinel-2-l2a/)
- [pystac-client Documentation](https://pystac-client.readthedocs.io/)
- [odc-stac Documentation](https://odc-stac.readthedocs.io/)
