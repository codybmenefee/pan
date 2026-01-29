import type { ArticleContent } from '../types'

export const ndvi: ArticleContent = {
  title: 'NDVI Analysis',
  description:
    'Understanding NDVI as a forage indicator. What it measures, where it works well, known limitations, and how the platform combines NDVI with other signals.',
  sections: [
    {
      heading: 'NDVI as a Proxy, Not Truth',
      content: `NDVI (Normalized Difference Vegetation Index) is a **proxy for forage condition**, not a direct measurement.

**What NDVI actually measures:**
The ratio of reflected near-infrared to red light. Healthy vegetation absorbs red light (for photosynthesis) and reflects near-infrared strongly (cell structure).

**What we interpret from it:**
Higher NDVI suggests more photosynthetically active vegetation—generally correlating with available forage.

**The gap:**
NDVI doesn't measure biomass, nutritional quality, or palatability directly. It measures "greenness" which usually—but not always—corresponds to these.

Treating NDVI as a proxy keeps expectations calibrated. It's useful, not perfect.`,
    },
    {
      heading: 'What NDVI Measures',
      content: `The formula:

\`\`\`
NDVI = (NIR - Red) / (NIR + Red)
\`\`\`

**Value range:** -1 to +1

**Interpretation for pastures:**
- **< 0.1**: Bare soil, water, rock (not grazeable)
- **0.1 - 0.2**: Heavily grazed, dormant, sparse
- **0.2 - 0.3**: Sparse vegetation, approaching ready
- **0.3 - 0.4**: Recovering pasture, monitor closely
- **0.4 - 0.5**: Healthy pasture, graze-ready
- **0.5 - 0.6**: Lush pasture, optimal grazing
- **> 0.6**: Very dense, graze before senescence

The platform default threshold of 0.40 targets "graze-ready" status.`,
    },
    {
      heading: 'Where NDVI Performs Well',
      content: `NDVI works best when:

**Consistent pasture types:**
Similar grass species across paddocks make relative comparisons meaningful.

**Moderate vegetation density:**
Neither too sparse (soil background dominates) nor too dense (saturation occurs).

**Clear satellite observation:**
Cloud-free, minimal atmospheric interference.

**Growing season:**
Active growth creates clear NDVI differentiation.

**Relative comparisons:**
Comparing paddocks to each other rather than to absolute standards.

Under these conditions, NDVI reliably indicates which paddocks have more forage than others.`,
    },
    {
      heading: 'NDVI Limitations',
      content: `Known issues with NDVI:

**Saturation in dense vegetation:**
Above ~0.65, NDVI stops differentiating. All lush paddocks look similar. EVI (Enhanced Vegetation Index) can help here.

**Soil background effects:**
Sparse vegetation shows soil characteristics, not just vegetation. Dry, bare soil reads differently than moist soil.

**Species composition blindness:**
NDVI can't distinguish desirable grasses from weeds. A paddock overrun with thistles might show good NDVI.

**Residue confusion:**
Dead plant material (standing or fallen) affects readings. Post-grazing residue may mask early regrowth.

**Atmospheric interference:**
Haze, smoke, and thin clouds affect readings even in "cloud-free" pixels.

**Timing mismatch:**
Satellite passes don't align with your decision schedule. Yesterday's image might not reflect this morning's conditions.`,
    },
    {
      heading: 'Combining NDVI With Other Signals',
      content: `The platform doesn't rely on NDVI alone:

**Rest days:**
Recovery time is independent of satellite data. A paddock with good NDVI but only 5 days rest shouldn't be grazed again.

**Trend direction:**
Is NDVI increasing, stable, or declining? Trend matters as much as absolute value.

**Cloud-free percentage:**
How much of the paddock was actually observed? Low coverage means lower confidence.

**Historical patterns:**
How does current NDVI compare to this paddock's typical range?

**Farmer observations:**
Local knowledge that satellites can't capture.

This multi-signal approach reduces dependence on any single measurement's accuracy.`,
    },
    {
      heading: 'NDVI in the Data Model',
      content: `Observations store multiple NDVI metrics:`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `observations: defineTable({
  farmExternalId: v.string(),
  paddockExternalId: v.string(),
  date: v.string(),
  ndviMean: v.number(),   // Average across paddock
  ndviMin: v.number(),    // Lowest pixel value
  ndviMax: v.number(),    // Highest pixel value
  ndviStd: v.number(),    // Standard deviation (uniformity)
  eviMean: v.number(),    // Enhanced Vegetation Index
  ndwiMean: v.number(),   // Water index
  cloudFreePct: v.number(),
  pixelCount: v.number(),
  isValid: v.boolean(),
  sourceProvider: v.string(),
  resolutionMeters: v.number(),
  createdAt: v.string(),
})`,
      },
    },
    {
      heading: 'Default Threshold: 0.40',
      content: `The platform uses 0.40 as the default NDVI threshold.

**Why 0.40:**
- Represents moderate-to-good pasture condition
- Provides safety margin above "sparse vegetation"
- Works across diverse pasture types
- Aligns with common agronomic recommendations

**When to adjust:**
- *Lower (0.30-0.35)*: Arid regions, native pastures, drought conditions
- *Higher (0.45-0.50)*: Irrigated land, improved pastures, high productivity expectations

**Per-paddock overrides:**
Different paddocks may need different thresholds. Use overrides for known variations.

The default is a starting point. Calibrate to your conditions over time.`,
    },
  ],
  relatedArticles: [
    '/docs/daily-operations/confidence',
    '/docs/core-concepts/partial-data',
    '/docs/integrations/satellites',
  ],
}
