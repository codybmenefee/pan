import type { ArticleContent } from '../types'

export const satellites: ArticleContent = {
  title: 'Satellite Providers',
  description:
    'Understanding satellite data sources. Why satellites work for grazing, supported providers, data fields, update cadence, and known limitations.',
  sections: [
    {
      heading: 'Why Satellites',
      content: `Satellite imagery provides the foundation for pasture monitoring because it offers:

**Consistency:**
Every paddock measured the same way. No variation from different observers or methods.

**Scalability:**
Monitoring 10 paddocks costs the same as monitoring 100. No marginal cost per paddock.

**Objectivity:**
Sensors don't have opinions. NDVI is NDVI regardless of who's looking.

**Historical depth:**
Archives extend back years. You can analyze patterns even before you started using the platform.

**Global coverage:**
Works anywhere on Earth. No infrastructure to install or maintain.

These properties make satellites ideal for the platform's needs—consistent, scalable, objective measurement.`,
    },
    {
      heading: 'Supported Providers',
      content: `The platform can ingest data from multiple satellite sources:

**Planet Scope (Planet Labs)**
- Very high resolution (3-5 meter)
- Daily revisit capability
- Commercial service (subscription required)
- Best for detailed paddock analysis

**Sentinel-2 (European Space Agency)**
- Moderate resolution (10-20 meter)
- 5-day revisit per satellite, ~2-3 days combined
- Free and open data
- Good balance of resolution and coverage

Data fields from observations indicate the source:`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `observations: defineTable({
  // ...
  sourceProvider: v.string(),     // 'planet' | 'sentinel'
  resolutionMeters: v.number(),   // 3-5 for Planet, 10-20 for Sentinel
  // ...
})`,
      },
    },
    {
      heading: 'Data Fields',
      content: `Each observation includes:

**Vegetation indices:**
- \`ndviMean\` - Normalized Difference Vegetation Index average
- \`ndviMin\`, \`ndviMax\`, \`ndviStd\` - Range and variability
- \`eviMean\` - Enhanced Vegetation Index (better for dense vegetation)
- \`ndwiMean\` - Normalized Difference Water Index (plant moisture stress)

**Quality metrics:**
- \`cloudFreePct\` - Percentage of paddock visible (0-100)
- \`pixelCount\` - Number of pixels analyzed
- \`isValid\` - Whether observation passed quality checks

**Metadata:**
- \`date\` - Observation date
- \`sourceProvider\` - Which satellite
- \`resolutionMeters\` - Spatial resolution`,
    },
    {
      heading: 'Update Cadence',
      content: `Observation frequency depends on provider and conditions:

**Planet Scope:**
- Potentially daily imagery
- Actual availability depends on tasking and cloud cover
- Higher cost for more frequent access

**Sentinel-2:**
- ~5 day revisit per satellite
- ~2-3 days effective with both satellites
- Free but less frequent

**Practical reality:**
Cloud cover often limits usable observations. In cloudy regions, expect:
- 1-2 clear observations per week in dry season
- May go 1-2 weeks without clear imagery in wet season

The platform handles gaps gracefully—recommendations continue with stale data and reduced confidence.`,
    },
    {
      heading: 'Processing Pipeline',
      content: `Raw satellite imagery becomes observations through:

**1. Acquisition**
Imagery captured by satellite, downlinked to ground stations.

**2. Atmospheric correction**
Remove atmospheric effects to isolate surface reflectance.

**3. Cloud masking**
Identify and exclude cloud-covered pixels.

**4. Index calculation**
Compute NDVI, EVI, NDWI from band ratios.

**5. Zonal statistics**
Aggregate pixel values within paddock boundaries (mean, min, max, std).

**6. Quality flagging**
Determine if observation meets quality thresholds.

**7. Storage**
Validated observation written to database.

This pipeline runs automatically when new imagery becomes available.`,
    },
    {
      heading: 'Limitations',
      content: `Satellite data has inherent constraints:

**Not ground truth:**
NDVI correlates with forage but doesn't measure biomass directly. Calibration to your conditions is needed.

**Cloud interference:**
Optical satellites can't see through clouds. Extended cloudy periods create data gaps.

**Temporal lag:**
Processing takes time. Today's image might not be available until tomorrow.

**Spatial resolution:**
Even 3-meter pixels can't distinguish fine details. Species composition, patch grazing patterns, and small features aren't visible.

**Atmospheric variability:**
Haze, smoke, and thin clouds affect readings even in "clear" imagery.

**Seasonal artifacts:**
Dormant vegetation, standing stubble, and litter affect readings. Interpret with seasonal context.

Understanding these limitations helps you use satellite data appropriately—as a valuable signal, not perfect truth.`,
    },
  ],
  relatedArticles: [
    '/docs/daily-operations/ndvi',
    '/docs/integrations/data-flywheel',
    '/docs/system-architecture/data-pipeline',
  ],
}
