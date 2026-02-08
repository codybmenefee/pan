# Agents Reference - Grazing Intelligence Demo

> This file is the primary reference for AI agents working on this codebase.
> Read this first before making any changes.

## What This Project Is

A **daily decision intelligence system for adaptive grazing**, powered by satellite data and human-in-the-loop AI. The core product is called the **Morning Farm Brief** - a daily ritual where farmers receive land status and recommended grazing actions.

**Core thesis:** Grass is dynamic, fences are static. Satellite sensing lets us understand land conditions daily. We build the software brain that translates land signals into clear daily grazing decisions.

## What This Project Is NOT

Do not build or propose:
- Livestock collar integration or firmware
- Real-time livestock tracking/movement
- Custom hardware
- Automated actuation systems
- Drone-based sensing
- Real-time autonomous herding

This is a **decision support system**, not an automation or control system.

## Core User Flow

1. User opens app in the morning
2. Receives status report on their farm
3. Sees recommended grazing plan for today
4. Approves or provides natural language feedback
5. System updates plan accordingly
6. User gets execution instructions for manual or virtual fencing workflow

## Technical Architecture

### Data Flow
```
Satellite Imagery (Sentinel-2)
        |
        v
STAC API Query (farm AOI + time window)
        |
        v
Cloud Masking + Index Computation (NDVI, EVI, NDWI)
        |
        v
Zonal Statistics (per pasture polygon)
        |
        v
Rules-Based Planner (pasture scoring)
        |
        v
Morning Farm Brief + Recommendation
        |
        v
User Approval/Feedback Loop
        |
        v
Exportable Plan Artifacts
```

### Key Entities

| Entity | Description |
|--------|-------------|
| Farm | Boundary polygon, contains pastures |
| Pasture | Grazing zone within farm, user-defined or auto-segmented |
| Herd | Metadata only (species, count) - no tracking |
| Observation | Satellite-derived metrics for a pasture at a point in time |
| Plan | Daily grazing recommendation with confidence score |
| Brief | Natural language summary of farm status |

## Domain Knowledge: Vegetation Indices

These are the core metrics computed from satellite imagery:

### NDVI (Normalized Difference Vegetation Index)
```
NDVI = (NIR - Red) / (NIR + Red)
```
- Range: -1 to +1
- < 0.2: bare soil / heavily grazed / dormant
- 0.2-0.4: sparse or recovering forage
- 0.4-0.6: healthy, graze-ready pasture
- > 0.6: dense biomass (graze before senescence)

### EVI (Enhanced Vegetation Index)
- Improves on NDVI for dense vegetation
- Use when NDVI saturates in high biomass

### NDWI (Normalized Difference Water Index)
- Detects plant water stress and surface moisture
- Early drought detection

## Pasture Readiness Rules (Initial Heuristics)

A pasture is graze-ready when ALL conditions are met:
1. NDVI exceeds configurable threshold (default: 0.4)
2. NDVI slope is positive or stable (not declining)
3. Rest period exceeds minimum recovery window

These rules are intentionally simple and explainable for farmer trust.

## Tech Stack Guidance

### Required Libraries
| Purpose | Library |
|---------|---------|
| Satellite catalog query | `pystac-client` |
| Image loading | `odc-stac` or `stackstac` |
| Raster operations | `rasterio`, `xarray`, `numpy` |
| Map tile generation | `rio-tiler` |
| Tile server | `TiTiler` (FastAPI) |
| Geometry | GeoJSON format |
| Optional DB | PostGIS |

### Data Sources
- **Primary:** Microsoft Planetary Computer (Sentinel-2)
- **Format:** Cloud-Optimized GeoTIFFs (COGs)
- **API:** STAC (SpatioTemporal Asset Catalog)

## Design Principles

1. **Plain language over charts** - Briefs should read like a farmer talking to a farmer
2. **Transparency over magic** - Show assumptions and confidence, not black box scores
3. **Daily cadence is sufficient** - Satellite refresh aligns with biological reality
4. **Cloud cover is manageable** - Use rolling composites and multiple sources
5. **Collar-agnostic output** - Generate geometry and copy-ready instructions, no direct integration

## File Structure Convention

```
/
├── agents.md              # This file - agent reference
├── README.md              # User-facing documentation
├── docs/
│   ├── architecture.md    # Detailed technical architecture
│   ├── domain.md          # Remote sensing domain knowledge
│   └── phasing.md         # Development phasing plan
├── src/
│   ├── ingestion/         # Satellite data fetching
│   ├── processing/        # Index computation, cloud masking
│   ├── intelligence/      # Pasture scoring, plan generation
│   └── app/               # Web application
└── ...
```

## Success Metrics

The demo succeeds when:
- A farmer says: "This matches how I think about my land."
- An investor says: "This has a clear wedge and expansion path."
- A collar company says: "This would make our product more valuable."

## Questions to Ask Before Building

1. Does this feature support the Morning Farm Brief flow?
2. Is this within MVP scope (no hardware, no real-time, no collars)?
3. Can a farmer understand the output in plain language?
4. Are we using existing OSS tools where available?
5. Which phase does this work belong to? (see [phasing.md](docs/phasing.md))

## Development Phasing

See [docs/phasing.md](docs/phasing.md) for the complete development plan. Key phases:| Phase | Focus |
|-------|-------|
| 0 | UX Design & Prototyping |
| 1 | Farm Geometry Foundation |
| 2 | Satellite Pipeline PoC |
| 3 | Processing Pipeline |
| 4 | Intelligence Layer |
| 5 | Morning Brief & Approval |
| 6 | Export & Polish |

Each phase produces testable artifacts. Do not skip phases or build "finished" features before foundational work is validated.
