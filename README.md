# OpenPasture

An open-source intelligence and orchestration layer for adaptive grazing. This system translates satellite-derived land signals into clear daily grazing decisions.

## Overview

Grass is dynamic. Fences are static. Modern sensing allows us to understand land conditions daily - what's been missing is software that turns those signals into actionable guidance.

This project provides the **decision-making brain** that tells farmers:

> "Here is the current state of your land, and here is the best grazing action for today."

## The Morning Farm Brief

The core experience is a daily ritual:

1. **Open the app** each morning
2. **Receive a status report** on your farm's pasture conditions
3. **Review the recommended grazing plan** for today
4. **Approve or adjust** using natural language feedback
5. **Get execution instructions** ready for your virtual fencing system or manual workflow

This is decision support - you stay in control.

## Features

### Digital Twin of Your Farm
- Define farm boundaries and paddock zones
- Track herd metadata (species, count)
- Visualize all zones on an interactive map

### Satellite-Derived Land Intelligence
- Vegetation health metrics (NDVI, EVI)
- Relative forage availability by paddock
- Regrowth trends over time
- Over/under-utilization indicators

### Daily Recommendations
- Which paddock to graze today
- Suggested area and duration
- Confidence score and assumptions
- Plain-language explanations

### Flexible Output
- Visual fence geometry for planning
- Copy-ready instructions for third-party virtual fencing tools
- Manual execution guidance

## Technical Approach

### Satellite Imaging

We use publicly available satellite imagery (primarily Sentinel-2) to compute vegetation indices across your farm. This provides:

- Scalable, low-cost land sensing
- Multispectral data for vegetation analysis
- Frequent revisits (daily to every few days)
- Historical archive for trend analysis

Satellite cadence aligns with biological reality - grazing decisions are daily or multi-day decisions, not minute-by-minute.

### Vegetation Indices

| Index | Purpose |
|-------|---------|
| NDVI | Primary vegetation health indicator |
| EVI | Enhanced sensitivity for dense pastures |
| NDWI | Water stress and drought detection |

### Processing Pipeline

1. Query satellite imagery for your farm's area
2. Apply cloud masking to remove unusable pixels
3. Compute vegetation indices
4. Aggregate time-series data (rolling means/medians)
5. Calculate zonal statistics per paddock
6. Score paddock readiness using transparent rules
7. Generate recommendation with confidence level

## What This Is Not

To maintain focus, this demo does not include:

- Real-time livestock tracking
- Custom hardware or collars
- Automated fence actuation
- Drone-based sensing

These are future integration points, not current scope.

## Getting Started

The web app lives in `app/`. Prerequisites: Node.js 18+ and npm.

```bash
cd app
npm install
npm run dev
```

Common scripts:

- `npm run dev` - start the Vite dev server
- `npm run build` - type-check and build for production
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build

### Environment Variables

The following environment variables are required for full functionality:

- `BRAINTRUST_API_KEY` - API key for Braintrust observability platform. Required for agent behavior tracking and debugging. Get your API key from [Braintrust](https://www.braintrust.dev). Set this in your Convex dashboard environment variables for production, or in `.env.local` for local development.

  Without this key, agent logging will be disabled but the application will continue to function.

## Tech Stack

- **Satellite Access:** pystac-client, odc-stac
- **Raster Processing:** rasterio, xarray, numpy
- **Tile Services:** rio-tiler, TiTiler
- **Geometry:** GeoJSON, PostGIS (optional)
- **Data Source:** Microsoft Planetary Computer (Sentinel-2)

## Project Structure

```
/
├── agents.md              # AI agent reference
├── README.md              # This file
├── app/                   # Web application (Vite + React)
│   ├── public/
│   ├── src/
│   └── ...
├── docs/
│   ├── architecture.md    # Technical architecture details
│   ├── domain.md          # Remote sensing domain knowledge
│   └── phasing.md         # Development phases
└── ...
```

## Documentation

- [Development Phasing](docs/phasing.md) - How we build this incrementally
- [Technical Architecture](docs/architecture.md) - System design and data flow
- [Domain Knowledge](docs/domain.md) - Remote sensing and vegetation science primer

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and contribution guidelines.

## Security

If you discover a vulnerability, see [SECURITY.md](SECURITY.md).

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

---

*OpenPasture - Building the intelligence layer for regenerative grazing.*
