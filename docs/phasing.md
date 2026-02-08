# Development Phasing Plan

This document outlines a methodical approach to building the Grazing Intelligence Demo. Each phase scaffolds on validated work from the previous phase, producing testable artifacts before proceeding.

## Guiding Principles

1. **Vertical slices over horizontal layers** - Each phase delivers something testable end-to-end, not just "backend done, waiting on frontend"
2. **Stub before integrating** - Mock external dependencies (satellite APIs) initially, then swap in real implementations
3. **Design drives development** - UI/UX decisions inform API shape, not the reverse
4. **Single farm, single day first** - Get one complete daily flow working before adding history, multiple farms, etc.

---

## Phase Summary

| Phase | Duration | Validates |
|-------|----------|-----------|
| 0: UX Design | 1-2 weeks | User experience before code |
| 1: Farm Geometry | 1 week | Map rendering, GeoJSON pipeline |
| 2: Satellite PoC | 1-2 weeks | Data access, NDVI computation |
| 3: Processing Pipeline | 1-2 weeks | Cloud masking, time series, zonal stats |
| 4: Intelligence Layer | 1-2 weeks | Scoring, planning, confidence |
| 5: Morning Brief | 1-2 weeks | Core product experience |
| 6: Export & Polish | 1-2 weeks | Demo readiness |

**Total: 8-14 weeks** depending on team size and iteration needs.

---

## Current State Snapshot (Jan 20, 2026)

Phases 0-3 are complete. The system can fetch satellite imagery, compute vegetation indices, and store per-pasture observations in Convex.

### What Works

**Phase 0 (UX Design) - Complete**
- Wireframes and UI components for Morning Brief, Map view, Plan approval

**Phase 1 (Farm Geometry) - Complete**
- Convex backend: farms, pastures, users, farmSettings tables
- GeoJSON geometry storage and retrieval
- Dev-mode auth bypass via `VITE_DEV_AUTH=true`
- Frontend hooks: `useFarms`, `usePastures`, `useFarmSettings`

**Phase 2 (Satellite PoC) - Complete**
- Python scripts query Planetary Computer STAC API
- NDVI computation from Sentinel-2 L2A imagery
- Visualization capability

**Phase 3 (Processing Pipeline) - Complete**
- Provider abstraction with tier-based selection
- `Sentinel2Provider`: 10m resolution, free tier
- `PlanetScopeProvider`: 3m resolution, premium tier ready
- Cloud masking using scene classification
- 21-day rolling median composite
- Zonal statistics per pasture (NDVI/EVI/NDWI mean/min/max/std)
- CRS transformation (EPSG:4326 ↔ EPSG:32616)
- Convex storage: `observations` table with frontend hooks
- Pipeline: `python src/ingestion/pipeline.py --dev --write-convex`

### Verification

```bash
source src/ingestion/venv/bin/activate
python src/ingestion/pipeline.py --dev --write-convex --output /tmp/pan_output

# Result: 8/8 pastures with valid observations
# NDVI range: 0.21-0.28 (typical pasture)
# Cloud-free: ~98%
```

### What Remains

- Phase 4: Intelligence layer (pasture scoring, plan generation)
- Phase 5: Morning Brief narrative connected to observation data
- Phase 6: Export functionality and demo polish

## Next Logical Chunk: Working Demo Slice (Single Farm)

**Goal:** Replace mock data with a minimal end-to-end data loop so a small cohort can use the app daily.

### Scope

- Convex backend foundation with `Farm`, `Pasture`, `Observation`, `Plan`, and `Feedback` data
- Clerk auth wired to a small set of users (single farm per user for now)
- Satellite PoC to minimal pipeline (latest cloud-safe NDVI, optional 21-day window + cloud mask + zonal stats)
- Rules-based planner to generate a daily recommendation with alternatives
- Frontend integration for brief, plan, approve, and feedback flows
- Basic ops: daily refresh job, cloud cover fallbacks, and logging

### Out of scope for this chunk

- Enterprise org management, billing, and admin tooling
- Production-grade exports and third-party integrations
- Multi-farm analytics and deep historical trends

---

## Phase 0: UX Design & Prototyping

**Duration:** 1-2 weeks

**Goal:** Define exactly what the Morning Farm Brief looks and feels like before writing production code.

### Deliverables

- Wireframes for core screens: Map view, Morning Brief, Plan approval, Feedback flow
- Visual design system: typography, color palette, component library decisions
- Clickable prototype (Figma or similar) of the Morning Farm Brief flow
- Sample narrative text for briefs (what does "plain language" actually sound like?)
- Defined viewport size (desktop-first, but what breakpoint?)

### Key UX Questions to Answer

- How does the farmer arrive at the brief? (opens app directly to it? navigates from map?)
- What is the visual hierarchy of the recommendation? (pasture name, confidence, reasoning)
- How is feedback captured? (buttons, text input, both?)
- What does "approve" actually mean in the UI? (what happens next?)

### Why This Phase Matters

The product IS the Morning Farm Brief. If this experience isn't crisp, nothing else matters. Skipping this results in UI rework loops later.

---

## Phase 1: Farm Geometry Foundation

**Duration:** 1 week

**Goal:** Build the digital twin skeleton - farm and pasture polygons on a map.

### Deliverables

- Sample farm GeoJSON (realistic New Zealand/Australian pastoral layout)
- Sample pasture polygons (5-8 pastures, varying sizes)
- Frontend: Interactive map component with pasture visualization
- Backend: Convex functions to serve farm/pasture geometry
- Data model: `Farm`, `Pasture` collections in Convex (GeoJSON stored)

### Technical Stack (current)

- Frontend framework (React + MapLibre GL JS or Leaflet recommended)
- Backend/data layer (Convex)
- Auth (Clerk)
- Geospatial storage (GeoJSON in Convex; optional PostGIS later)

### What Gets Tested

- Can we render pastures on a map?
- Can we click a pasture and see its metadata?
- Is the GeoJSON format working correctly end-to-end?

### Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Map Component  │ --> │ Convex Query/Mutation│ --> │ Convex Data │
│   (Frontend)    │     │    (Backend API)     │     │  Storage    │
└─────────────────┘     └──────────────────────┘     └─────────────┘
```

---

## Phase 2: Satellite Pipeline - Proof of Concept

**Duration:** 1-2 weeks

**Goal:** Prove we can fetch satellite data and compute NDVI for a known location.

### Deliverables

- Python script that queries Planetary Computer STAC API for Sentinel-2
- Fetch imagery for sample farm AOI
- Compute NDVI for a single cloud-free scene
- Visualize result (notebook or simple tile endpoint)

### Scope Boundaries

- Single image, not time series yet
- Known good date (manually selected cloud-free day)
- No cloud masking logic yet - just prove the pipeline

### Libraries to Validate

| Library | Purpose |
|---------|---------|
| `pystac-client` | Catalog queries |
| `odc-stac` or `stackstac` | Loading imagery |
| `rasterio` | Raster operations |
| `numpy` | Index computation |

### What Gets Tested

- Can we authenticate and query Planetary Computer?
- Does the data come back in expected format?
- Is NDVI computation producing sensible values (0.2-0.6 range for pasture)?

This is intentionally narrow. The goal is confidence in the data path before building production infrastructure.

---

## Phase 3: Processing Pipeline - Production

**Duration:** 1-2 weeks

**Status: COMPLETE**

**Goal:** Build the full observation pipeline: cloud masking, time series, zonal statistics, with provider abstraction for tier-based satellite access.

### Deliverables

- **Provider Abstraction Layer** (`src/ingestion/providers/`)
  - `Sentinel2Provider`: Free Sentinel-2 L2A data (10m resolution)
  - `PlanetScopeProvider`: Premium PlanetScope data (3m resolution) - auto-enabled for premium tier
- Cloud masking using item metadata
- Time-series fetch (21-day rolling window) with median compositing
- Zonal statistics computation per pasture (NDVI/EVI/NDWI mean/min/max/std)
- `Observation` model and Convex storage
- Frontend hooks for observation data access
- Scheduled job / manual trigger to refresh data

### Data Flow

```
Provider Abstraction (Factory Pattern)
        │
        ├── Free Tier ──► Sentinel2Provider (10m, free)
        │
        └── Premium Tier ──► Sentinel2Provider + PlanetScopeProvider (merged 3m)
                              │
                              ▼
                    STAC API Query (21-day window)
                              │
                              ▼
                    Load Bands + Cloud Mask
                              │
                              ▼
                    Compute NDVI/EVI/NDWI
                              │
                              ▼
                    Time-Series Median Composite
                              │
                              ▼
                    CRS Transform (EPSG:4326 → EPSG:32616)
                              │
                              ▼
                    Zonal Statistics per Pasture
                              │
                              ▼
                    Observations Table (Convex)
```

### What Gets Tested

- Do composite values look reasonable compared to raw images? ✓
- Are zonal statistics stable across runs? ✓
- Is cloud masking excluding appropriate pixels? ✓
- Does tier-based provider selection work? ✓
- Can we add new providers without changing the pipeline? ✓

### Tier-Based Access

| Tier | Provider | Resolution | Cost |
|------|----------|------------|------|
| Free | Sentinel-2 | 10m | Free |
| Premium | Sentinel-2 + PlanetScope | 3m (merged) | Paid |

Free farms automatically get all Sentinel-2 functionality. Premium farms (configured via `subscriptionTier` in `farmSettings`) automatically get merged Sentinel-2 + PlanetScope data at 3m resolution.

---

## Phase 4: Intelligence Layer - Scoring & Plans

**Duration:** 1-2 weeks

**Goal:** Implement the rules-based planner that ranks pastures and generates recommendations.

### Deliverables

- Pasture scorer (graze-readiness ranking)
- Recovery modeler (days since last graze, trajectory)
- Plan generator (single recommendation with confidence)
- `GrazingEvent` model (tracks when pasture was grazed)
- `Plan` model and storage
- API: `GET /farms/{id}/plan` returns today's recommendation

### Initial Heuristics

From [domain.md](domain.md):

```python
def is_graze_ready(pasture):
    return (
        pasture.ndvi_mean >= 0.40
        and pasture.ndvi_slope >= -0.01
        and pasture.days_since_graze >= 21
        and pasture.cloud_free_pct >= 0.50
    )
```

### What Gets Tested

- Given known observation data, does the planner pick the expected pasture?
- Is confidence scoring behaving correctly with degraded data?
- Are alternatives ranked sensibly?

### Important

No LLM/AI yet. This is pure deterministic logic. Explainability comes from transparent rules, not model interpretation.

---

## Phase 5: Morning Brief & Approval Flow

**Duration:** 1-2 weeks

**Goal:** Deliver the core product experience - the Morning Farm Brief.

### Deliverables

- Brief generator (narrative text synthesis)
- Frontend: Morning Brief screen (matches Phase 0 design)
- Frontend: Plan card with approve/feedback buttons
- Backend: `POST /farms/{id}/plan/approve`
- Backend: `POST /farms/{id}/plan/feedback` (stores free-text)
- State management for plan lifecycle (pending -> approved/modified)

### Brief Generation Approach

Initially: template-based text generation with variable substitution

```
"Good morning. Your pastures are [overall_status]. 
[key_change_sentence] 
We recommend moving to [pasture_name] today ([confidence]% confidence)."
```

Future enhancement: LLM-powered narrative generation (out of MVP scope).

### What Gets Tested

- Does the brief read naturally?
- Can a user approve a plan and see the state change?
- Is feedback being captured and stored?

This is where the product "becomes real" - everything prior was infrastructure.

---

## Phase 6: Export, Polish & Demo Readiness

**Duration:** 1-2 weeks

**Goal:** Production-ready demo with export capabilities and edge case handling.

### Deliverables

- Export: GeoJSON fence geometry download
- Export: Copy-ready text instructions for virtual fencing tools
- Error states: satellite data unavailable, low confidence warnings
- Loading states and skeleton screens
- Demo script with specific scenarios to walk through
- Sample data that tells a compelling story (pasture A recovering, B ready, C overgrazed)

### Demo Scenarios to Support

1. **Normal day:** Clear recommendation, high confidence
2. **Uncertain day:** Multiple viable options, user picks
3. **Recovery tracking:** Show a pasture improving over time
4. **Feedback loop:** User rejects recommendation, provides reason

### Final Checklist

- [ ] App loads in under 3 seconds
- [ ] Map renders without glitches
- [ ] Brief text is grammatically correct
- [ ] Export files validate as proper GeoJSON
- [ ] No console errors in production build

---

## Recommended Starting Point

After this plan is approved:

1. Create Phase 0 UX artifacts (wireframes, design system choices)
2. Set up Convex project and Clerk auth integration (define user-to-farm mapping)
3. Create sample farm GeoJSON data file and seed it into Convex
4. Wire the frontend to Convex queries/mutations for pastures and plans

The first code should be a map that renders pastures. Everything else builds from there.

---

## What This Plan Intentionally Excludes

Per the existing documentation, the following are NOT in scope for the demo:

- Livestock collar integration
- Real-time tracking
- Drone sensing
- Mobile native apps
- Enterprise org management, billing, and admin tooling
- LLM-powered brief generation (template-based first)

These can be added as enhancement phases after the demo is complete.

---

## Phase Dependencies

```
Phase 0 (UX Design)
    │
    ▼
Phase 1 (Farm Geometry) ◄── Foundation for all data
    │
    ├──────────────────┐
    ▼                  ▼
Phase 2 (Satellite PoC)
    │
    ▼
Phase 3 (Processing Pipeline)
    │
    ▼
Phase 4 (Intelligence Layer)
    │
    ▼
Phase 5 (Morning Brief)
    │
    ▼
Phase 6 (Export & Polish)
```

Phase 0 and Phase 1 can run in parallel if resources allow. All subsequent phases are sequential dependencies.
