# Domain Knowledge: Remote Sensing for Grazing

This document provides the minimum remote-sensing context needed to work confidently on this project.

## Satellite Fundamentals

### Why Satellites Work for Grazing

Grazing decisions operate on daily to multi-day timescales. Grass doesn't change meaningfully hour-to-hour. Satellite revisit rates (2-5 days) align well with:

- Grazing recovery cycles (7-60 days depending on conditions)
- Rotational grazing patterns
- Farmer decision rhythms

### Sentinel-2 Overview

Our primary data source is ESA's Sentinel-2 mission:

| Property | Value |
|----------|-------|
| Operator | European Space Agency |
| Satellites | 2 (Sentinel-2A, 2B) |
| Revisit time | ~5 days each, ~2-3 days combined |
| Spatial resolution | 10m (visible), 20m (vegetation red edge) |
| Archive | 2015-present |
| Cost | Free and open |

### Relevant Spectral Bands

| Band | Name | Wavelength | Resolution | Use |
|------|------|------------|------------|-----|
| B02 | Blue | 490 nm | 10m | EVI calculation, atmospheric correction |
| B04 | Red | 665 nm | 10m | NDVI, chlorophyll absorption |
| B08 | NIR | 842 nm | 10m | NDVI, vegetation structure |
| B11 | SWIR | 1610 nm | 20m | NDWI, moisture content |
| SCL | Scene Classification | - | 20m | Cloud masking |

## Vegetation Indices Deep Dive

### NDVI (Normalized Difference Vegetation Index)

The foundational vegetation index.

**Formula:**
```
NDVI = (NIR - Red) / (NIR + Red)
```

**Why it works:**
- Healthy leaves absorb red light (for photosynthesis)
- Healthy leaves reflect NIR strongly (cell structure)
- The ratio normalizes for lighting conditions

**Value interpretation for pastures:**

| NDVI Range | Condition | Grazing Implication |
|------------|-----------|---------------------|
| < 0.1 | Bare soil, water, rock | Not grazeable |
| 0.1 - 0.2 | Heavily grazed, dormant | Recovery needed |
| 0.2 - 0.3 | Sparse vegetation | Approaching ready |
| 0.3 - 0.4 | Recovering pasture | Monitor closely |
| 0.4 - 0.5 | Healthy pasture | Graze-ready |
| 0.5 - 0.6 | Lush pasture | Optimal grazing |
| > 0.6 | Very dense | Graze before senescence |

**Limitations:**
- Saturates in very dense vegetation (all high values look the same)
- Affected by soil background in sparse cover
- Can be influenced by water stress before visible wilting

### EVI (Enhanced Vegetation Index)

Addresses NDVI limitations in dense vegetation.

**Formula:**
```
EVI = G * (NIR - Red) / (NIR + C1*Red - C2*Blue + L)

Where (Sentinel-2 coefficients):
  G = 2.5
  C1 = 6.0
  C2 = 7.5
  L = 1.0
```

**When to use EVI:**
- High-productivity pastures
- Peak growing season
- Comparing pastures that all show high NDVI
- Irrigated land

**Practical note:** For most grazing applications, NDVI is sufficient. Use EVI when NDVI values cluster near saturation (> 0.65).

### NDWI (Normalized Difference Water Index)

Detects plant water stress before it's visible.

**Formula:**
```
NDWI = (NIR - SWIR) / (NIR + SWIR)
```

**Interpretation:**
- Higher values = more moisture
- Declining trend = increasing stress
- Useful for drought early warning

**When to use NDWI:**
- Summer months in dry climates
- Irrigated vs. dryland comparison
- Prioritizing grazing ahead of heat stress

## Time-Series Analysis

Single observations are snapshots. Intelligence comes from trends.

### Rolling Composites

To handle cloud cover:
1. Collect all observations in a time window (e.g., 21 days)
2. For each pixel, take median value
3. Median is robust to outliers (clouds, shadows)

This produces a "clean" view even with intermittent clouds.

### Trend Detection

For each pasture, track NDVI over time:

```
Slope = (NDVI_recent - NDVI_prior) / days_between
```

**Interpretation:**
- Positive slope: recovering, growing
- Near zero: stable, plateau
- Negative slope: declining, stressed, or grazed

### Change Detection

Compare current composite to baseline:

```
Change = NDVI_current - NDVI_baseline
```

Useful for:
- Detecting overgrazing (rapid decline)
- Identifying uneven utilization within pasture
- Spotting anomalies (disease, pests, damage)

## Zonal Statistics

Converting raster imagery to pasture-level metrics.

For each pasture polygon:

| Statistic | Purpose |
|-----------|---------|
| Mean | Overall condition |
| Median | Robust central estimate |
| Std Dev | Uniformity (low = even grazing) |
| Min | Worst area within pasture |
| Max | Best area within pasture |
| Count | Usable pixel count (coverage) |

### Handling Edge Effects

Pasture boundaries may cut through pixels. Options:
- Include only pixels with centroid inside polygon
- Weight partial pixels by overlap percentage
- Buffer inward slightly to avoid boundary pixels

For this application, centroid-based inclusion is sufficient.

## Cloud Masking

Unusable pixels must be excluded before analysis.

### Sentinel-2 SCL Classes

| Value | Class | Action |
|-------|-------|--------|
| 0 | No data | Exclude |
| 1 | Saturated/defective | Exclude |
| 2 | Dark area | Use with caution |
| 3 | Cloud shadow | Exclude |
| 4 | Vegetation | Use |
| 5 | Bare soil | Use |
| 6 | Water | Exclude (for pasture) |
| 7 | Unclassified | Use with caution |
| 8 | Cloud (medium prob) | Exclude |
| 9 | Cloud (high prob) | Exclude |
| 10 | Thin cirrus | Exclude |
| 11 | Snow/ice | Exclude |

### Cloud-Free Percentage

Track per-pasture:
```
cloud_free_pct = usable_pixels / total_pixels
```

If below threshold (e.g., 50%), flag observation as low-confidence.

## Practical Thresholds

These are starting points - they should be configurable and refined with user feedback.

### Graze-Ready Conditions

```python
def is_graze_ready(pasture):
    return (
        pasture.ndvi_mean >= 0.40
        and pasture.ndvi_slope >= -0.01  # not declining
        and pasture.days_since_graze >= 21  # minimum rest
        and pasture.cloud_free_pct >= 0.50  # sufficient data
    )
```

### Recovery Estimate

```python
def days_until_ready(pasture):
    if pasture.ndvi_mean >= 0.40:
        return 0
    if pasture.ndvi_slope <= 0:
        return float('inf')  # not recovering

    needed = 0.40 - pasture.ndvi_mean
    days = needed / pasture.ndvi_slope
    return max(0, int(days))
```

### Confidence Scoring

```python
def plan_confidence(pasture, observation):
    confidence = 1.0

    # Data quality factors
    if observation.cloud_free_pct < 0.75:
        confidence *= 0.8
    if observation.age_days > 5:
        confidence *= 0.9

    # Certainty factors
    if pasture.ndvi_std > 0.15:  # uneven pasture
        confidence *= 0.85
    if abs(pasture.ndvi_slope) < 0.005:  # ambiguous trend
        confidence *= 0.9
    
    return round(confidence, 2)
```

## Common Pitfalls

### Seasonal Calibration
NDVI thresholds vary by season. A pasture at 0.35 in summer may be doing well; the same in spring may indicate stress. Consider seasonal adjustment or relative ranking.

### Mixed Land Cover
Pastures with trees, ponds, or buildings will have biased statistics. Either mask these features or accept the noise.

### Drought Conditions
During severe drought, all pastures may show low NDVI. Shift to relative ranking rather than absolute thresholds.

### Senescence
Mature grass yellowing (senescence) looks like stress in NDVI. Consider grazing timing to capture value before quality loss.

## References

- [Sentinel-2 User Handbook](https://sentinels.copernicus.eu/web/sentinel/user-guides/sentinel-2-msi)
- [NDVI Explained (NASA)](https://earthobservatory.nasa.gov/features/MeasuringVegetation)
- [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/)
- [pystac-client Documentation](https://pystac-client.readthedocs.io/)
