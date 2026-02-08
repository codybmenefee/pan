# Technical Architecture

This document details the system architecture for the Grazing Intelligence Demo.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │   Map View      │  │  Morning Brief   │  │  Feedback Interface    │  │
│  │   (Pastures)    │  │  (Narrative)     │  │  (Approval/Adjust)     │  │
│  └─────────────────┘  └──────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │   Brief         │  │  Plan            │  │  Export                │  │
│  │   Generator     │  │  Generator       │  │  Service               │  │
│  └─────────────────┘  └──────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       INTELLIGENCE LAYER                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │   Pasture       │  │  Recovery        │  │  Change                │  │
│  │   Scorer        │  │  Modeler         │  │  Detector              │  │
│  └─────────────────┘  └──────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PROCESSING LAYER                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │   Cloud         │  │  Index           │  │  Zonal                 │  │
│  │   Masking       │  │  Computation     │  │  Statistics            │  │
│  └─────────────────┘  └──────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │   STAC          │  │  Image           │  │  Time-Series           │  │
│  │   Query         │  │  Fetcher         │  │  Aggregator            │  │
│  └─────────────────┘  └──────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              Microsoft Planetary Computer (Sentinel-2)          │    │
│  │                    via STAC API + COG access                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### Data Sources

**Sentinel-2 via Planetary Computer**
- Cloud-hosted, cloud-optimized datasets (COGs)
- STAC-compliant metadata
- No data download required - stream directly from source
- Revisit frequency: ~5 days per satellite, ~2-3 days combined

### Ingestion Layer

**STAC Query**
- Queries satellite catalog for farm AOI (Area of Interest)
- Filters by time window (typically 21-30 days rolling)
- Returns asset references, not raw data

**Image Fetcher**
- Streams only required bands (Red, NIR, Blue, SWIR)
- Clips to farm boundary
- Handles partial/failed fetches gracefully

**Time-Series Aggregator**
- Maintains rolling window of observations
- Handles irregular cadence due to cloud cover
- Supports gap-filling strategies

### Processing Layer

**Cloud Masking**
- Uses Sentinel-2 SCL (Scene Classification Layer)
- Removes clouds, shadows, snow, water
- Tracks percentage of usable pixels per pasture

**Index Computation**
- NDVI: `(NIR - Red) / (NIR + Red)`
- EVI: `G * (NIR - Red) / (NIR + C1*Red - C2*Blue + L)`
- NDWI: `(NIR - SWIR) / (NIR + SWIR)`

**Zonal Statistics**
- For each pasture polygon, computes:
  - Mean/median index values
  - Standard deviation (uniformity indicator)
  - Pixel count (coverage indicator)
  - Percentiles (outlier detection)

### Intelligence Layer

**Pasture Scorer**
- Ranks pastures by grazing readiness
- Configurable scoring weights
- Outputs ranked list with scores and reasoning

**Recovery Modeler**
- Tracks time since last graze per pasture
- Computes NDVI recovery trajectory
- Estimates days until graze-ready

**Change Detector**
- Compares current vs prior observations
- Flags anomalies (rapid decline, unexpected patterns)
- Generates alerts for human review

### Application Layer

**Brief Generator**
- Produces narrative summary in plain language
- Prioritizes key insights over raw data
- Adapts tone based on conditions (normal vs alert)

**Plan Generator**
- Outputs single primary recommendation
- Includes confidence score and assumptions
- Provides alternatives if primary is rejected

**Export Service**
- Generates visual fence geometry (GeoJSON)
- Formats instructions for various virtual fencing platforms
- Produces printable/shareable artifacts

### User Interface

**Map View**
- Interactive pasture visualization
- Color-coded by current status
- Click for pasture details

**Morning Brief**
- Narrative text summary
- Key metrics highlighted
- Action-oriented language

**Feedback Interface**
- Approve/reject buttons
- Free-text adjustment input
- Voice input support (future)

## Data Models

### Farm
```json
{
  "id": "uuid",
  "name": "string",
  "boundary": "GeoJSON Polygon",
  "timezone": "string",
  "created_at": "timestamp"
}
```

### Pasture
```json
{
  "id": "uuid",
  "farm_id": "uuid",
  "name": "string",
  "geometry": "GeoJSON Polygon",
  "area_hectares": "number",
  "notes": "string"
}
```

### Observation
```json
{
  "id": "uuid",
  "pasture_id": "uuid",
  "observed_at": "timestamp",
  "source": "sentinel-2",
  "ndvi_mean": "number",
  "ndvi_median": "number",
  "ndvi_std": "number",
  "evi_mean": "number",
  "ndwi_mean": "number",
  "cloud_free_pct": "number",
  "pixel_count": "integer"
}
```

### GrazingEvent
```json
{
  "id": "uuid",
  "pasture_id": "uuid",
  "started_at": "timestamp",
  "ended_at": "timestamp",
  "herd_count": "integer",
  "notes": "string"
}
```

### Plan
```json
{
  "id": "uuid",
  "farm_id": "uuid",
  "for_date": "date",
  "recommended_pasture_id": "uuid",
  "confidence": "number (0-1)",
  "reasoning": "string",
  "assumptions": ["string"],
  "alternatives": [
    {
      "pasture_id": "uuid",
      "score": "number",
      "note": "string"
    }
  ],
  "status": "pending | approved | modified | rejected",
  "user_feedback": "string",
  "created_at": "timestamp"
}
```

## API Design (Conceptual)

### Farm Management
```
GET    /farms
POST   /farms
GET    /farms/{id}
PUT    /farms/{id}
DELETE /farms/{id}

GET    /farms/{id}/pastures
POST   /farms/{id}/pastures
```

### Intelligence
```
GET    /farms/{id}/brief              # Today's morning brief
GET    /farms/{id}/brief/{date}       # Brief for specific date

GET    /farms/{id}/plan               # Today's recommended plan
POST   /farms/{id}/plan/approve       # Approve current plan
POST   /farms/{id}/plan/feedback      # Submit feedback/adjustment
```

### Observations
```
GET    /pastures/{id}/observations    # Historical observations
GET    /pastures/{id}/current         # Current status
```

### Export
```
GET    /plans/{id}/export/geojson     # Fence geometry
GET    /plans/{id}/export/text        # Copy-ready instructions
```

## Caching Strategy

| Data Type | Cache Duration | Invalidation |
|-----------|----------------|--------------|
| Satellite imagery | 7 days | Never (immutable) |
| Computed indices | 7 days | Never (derived from immutable source) |
| Zonal statistics | 24 hours | On new satellite data |
| Plans | Session | On user action |
| Briefs | 24 hours | On new plan generation |

## Error Handling

### Satellite Data Unavailable
- Fall back to most recent valid observation
- Display data age prominently
- Lower confidence scores accordingly

### Partial Cloud Cover
- Use median compositing over time window
- Report percentage of usable data
- Flag pastures with insufficient coverage

### Processing Failures
- Retry with exponential backoff
- Log for debugging
- Show graceful degradation in UI

## Security Considerations

- Farm boundaries are sensitive data (property information)
- All API endpoints require authentication
- Pasture data scoped to authenticated user
- No PII stored beyond account basics
