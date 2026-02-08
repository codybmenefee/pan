import type { ArticleContent } from '../types'

export const partialData: ArticleContent = {
  title: 'Partial Data & Uncertainty',
  description:
    'How the platform operates when information is incomplete. Data as confidence signals rather than ground truth, and why waiting for perfect data fails in agricultural systems.',
  sections: [
    {
      heading: 'The Norm: Incomplete Information',
      content: `Perfect data doesn't exist in agricultural systems.

**Satellite imagery** has gaps:
- Cloud cover blocks observation (tropical regions: 70%+ cloud days)
- Sensor revisit intervals create temporal gaps
- Resolution limits what can be detected

**Weather data** has uncertainty:
- Measurement stations are sparse in rural areas
- Microclimates vary within farms
- Forecasts degrade rapidly beyond 3 days

**Ground truth** is expensive:
- Walking every pasture takes time
- Biomass sampling is labor-intensive
- Records depend on consistent entry

The platform is designed for this reality. It expects gaps and handles them explicitly rather than failing or producing garbage outputs.`,
    },
    {
      heading: 'Data as Confidence, Not Truth',
      content: `Each data point carries a confidence level reflecting:
- **Recency**: How old is this reading?
- **Coverage**: What percentage of the pasture was visible?
- **Agreement**: Do multiple signals align?

Consider NDVI for a pasture:

**High confidence scenario**:
- Clear observation 2 days ago
- 95% cloud-free coverage
- Consistent with 7-day trend
- Confidence: 0.85

**Low confidence scenario**:
- Last clear observation 12 days ago
- 40% cloud-free coverage
- Limited readings to establish trend
- Confidence: 0.55

Both scenarios produce NDVI values. But the platform treats them differently—weighting the recommendation toward higher-confidence alternatives when available.`,
    },
    {
      heading: 'Why Waiting for Perfect Data Fails',
      content: `A tempting approach: wait until you have good data before deciding.

This fails for two reasons:

**1. Animals eat every day**
There's no "wait and see" option. Animals must graze somewhere. Delaying a decision doesn't delay the need—it just makes you decide under worse conditions (hungry animals, stressed farmer).

**2. Agricultural systems are time-sensitive**
The optimal grazing window is measured in days, not weeks. Waiting for better satellite coverage often means missing the window entirely. A good-enough decision today beats a perfect decision next week.

The platform embraces this constraint. It always produces a recommendation, even with poor data. The confidence score communicates data quality; the farmer decides whether the recommendation is acceptable given that quality.`,
    },
    {
      heading: 'Operating Under Uncertainty',
      content: `The platform handles uncertainty through several mechanisms:

**Graceful Degradation**
When data quality declines, recommendations become more conservative:
- Prefer pastures with recent, clear observations
- Reduce confidence scores to signal uncertainty
- Include explicit notes about data limitations

**Multiple Signals**
NDVI is primary, but not sole. Recovery time provides a constraint independent of satellite data. Farmer observations can override both.

**Confidence Scoring**
Every recommendation includes a confidence score. This isn't a probability of success—it's a quality indicator for the underlying data.`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `// Confidence score normalization
const normalizeConfidenceScore = (value: number | undefined): number => {
  // Agent often produces 0-1 floats; convert to percent
  if (value === undefined || !Number.isFinite(value)) return 50
  if (value >= 0 && value <= 1) return Math.round(value * 100)
  return value
}`,
      },
    },
    {
      heading: 'Cloud-Free Percentage',
      content: `The \`cloudFreePct\` field in observations indicates what portion of the pasture was visible:`,
      codeExample: {
        language: 'typescript',
        filename: 'observations schema',
        code: `observations: defineTable({
  farmExternalId: v.string(),
  paddockExternalId: v.string(),
  date: v.string(),
  ndviMean: v.number(),
  ndviStd: v.number(),
  cloudFreePct: v.number(), // 0-100, percent of pasture visible
  pixelCount: v.number(),
  isValid: v.boolean(),
  sourceProvider: v.string(),
  resolutionMeters: v.number(),
  // ...
})`,
      },
    },
    {
      heading: 'Practical Implications',
      content: `For farmers using the platform:

**High confidence (75+)**: Data is recent and clear. Recommendation reflects current conditions well.

**Moderate confidence (55-74)**: Some data gaps or staleness. Recommendation is reasonable but verify with ground observation if convenient.

**Low confidence (<55)**: Significant data limitations. Use the recommendation as a starting point but apply heavy local judgment.

**When confidence consistently runs low**:
- Check satellite provider status
- Consider supplementing with farmer observations
- Review if weather patterns are causing systematic cloud cover

Low confidence doesn't mean the recommendation is wrong. It means the system is honest about its uncertainty. A confident wrong answer is more dangerous than a humble uncertain one.`,
    },
  ],
  relatedArticles: [
    '/docs/core-concepts/decision-support',
    '/docs/daily-operations/confidence',
    '/docs/daily-operations/ndvi',
  ],
}
