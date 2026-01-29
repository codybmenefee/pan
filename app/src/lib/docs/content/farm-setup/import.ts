import type { ArticleContent } from '../types'

export const importData: ArticleContent = {
  title: 'Importing Data',
  description:
    'How to get your farm data into the platform. Manual entry, file imports, handling incomplete data, and validation processes.',
  sections: [
    {
      heading: 'Manual vs. Automated Data Entry',
      content: `Data enters the platform through two pathways:

**Manual entry:**
- Drawing paddock boundaries on the map
- Recording grazing events through the interface
- Entering farmer observations
- Configuring settings and thresholds

**Automated entry:**
- Satellite observations (ingested from providers)
- Weather data (when integrated)
- Sync from connected systems (future)

Most farms start with manual setup (defining paddocks and initial state) then transition to automated observation updates. The morning brief workflow handles daily operations without manual data entry.`,
    },
    {
      heading: 'Supported Import Formats',
      content: `**GeoJSON (recommended)**
Standard format for geographic data. Most GIS software exports GeoJSON.

Example paddock import:`,
      codeExample: {
        language: 'json',
        filename: 'paddocks.geojson',
        code: `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "North Paddock",
        "externalId": "north-1",
        "area": 45.2
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng1, lat1], [lng2, lat2], ...]]
      }
    }
  ]
}`,
      },
    },
    {
      heading: 'Additional Formats',
      content: `**KML/KMZ**
Google Earth format. Can be converted to GeoJSON using online tools or GIS software.

**Shapefile**
Common GIS format. Requires conversion to GeoJSON before import.

**CSV with coordinates**
For point data or simple boundary lists. Limited support—primarily for observation data.

**Property boundary services**
Some regions offer digital property boundaries. These can be imported as starting points for paddock definition.`,
    },
    {
      heading: 'Why Incomplete Data Is Acceptable',
      content: `The platform is designed to work with whatever data you have:

**Missing boundaries:**
You can start with one paddock defined and add others over time. Recommendations work with available paddocks.

**No historical data:**
New farms have no grazing history. The platform starts fresh—first recommendations won't have historical overlap to avoid.

**Sparse observations:**
Cloud cover or provider gaps mean some days have no satellite data. Status calculations use most recent available observation.

**Estimated areas:**
If you don't know exact hectares, estimates work. Section sizing scales proportionally.

Incomplete data affects confidence scores but doesn't prevent operation. The platform is honest about data quality through confidence indicators.`,
    },
    {
      heading: 'How Imported Data Influences Confidence',
      content: `Data completeness affects recommendation quality:

**High confidence factors:**
- All paddocks have defined boundaries
- Recent satellite observations (< 3 days old)
- Historical grazing events recorded
- Thresholds calibrated to your conditions

**Lower confidence factors:**
- Some paddocks missing boundaries
- Stale observations (> 7 days old)
- No grazing history (fresh start)
- Default thresholds in use

The platform communicates these factors through confidence scores. A 55% confidence recommendation with sparse data is still useful—just use more judgment when reviewing.`,
    },
    {
      heading: 'Seeding Sample Data',
      content: `For testing or demonstration, sample data can be seeded:`,
      codeExample: {
        language: 'bash',
        code: `# From Convex CLI
npx convex run seedData:seedSampleFarm

# Or through the Convex dashboard:
# Functions → seedData.seedSampleFarm → Run`,
      },
    },
    {
      heading: 'Sample Data Contents',
      content: `The seed function creates:

**Sample farm:**
- Name: "Demo Farm" (or configured name)
- Location and coordinates
- Farm-level settings with defaults

**Sample paddocks:**
- Multiple paddocks with realistic geometries
- Initial NDVI values and status
- Varied sizes and configurations

**Sample observations:**
- Recent satellite readings for each paddock
- NDVI, EVI, NDWI values
- Cloud coverage data

**Sample grazing events:**
- Historical events showing rotation pattern
- Dates and paddock associations

This provides enough data to explore the platform without setting up real farm data first.`,
    },
    {
      heading: 'Validation and Error Handling',
      content: `Imported data is validated before storage:

**Geometry validation:**
- Polygons must be closed (first/last coordinates match)
- No self-intersection
- Valid coordinate ranges (-180 to 180 longitude, -90 to 90 latitude)

**Required fields:**
- Paddocks need name, externalId, and geometry
- Observations need paddockId, date, and NDVI values

**Duplicate handling:**
- Observations upsert by paddock+date (new data replaces old)
- Paddocks can be updated by matching externalId

**Error responses:**
Invalid imports return descriptive errors. Fix the data and retry—partial imports don't corrupt existing data.`,
    },
  ],
  relatedArticles: [
    '/docs/farm-setup/paddocks',
    '/docs/getting-started/quick-start',
    '/docs/core-concepts/partial-data',
  ],
}
