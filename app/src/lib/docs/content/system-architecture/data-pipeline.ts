import type { ArticleContent } from '../types'

export const dataPipeline: ArticleContent = {
  title: 'Data Pipeline',
  description:
    'How data flows from external sources into the platform, is normalized and validated, and becomes available for queries and AI analysis.',
  sections: [
    {
      heading: 'Data Sources',
      content: `The platform integrates multiple data types:

**Satellite Imagery (NDVI)**
Primary source for vegetation condition. Observations include:
- NDVI mean, min, max, standard deviation
- EVI (Enhanced Vegetation Index)
- NDWI (Normalized Difference Water Index)
- Cloud-free percentage
- Pixel count and resolution

**Weather Data**
Growth context and constraint signal:
- Temperature
- Precipitation
- Humidity (optional)
- Wind speed/direction (optional)

**User Input**
Events and observations from farmers:
- Grazing events (paddock, date, duration)
- Plan approvals and feedback
- Farmer observations (notes, tags)

**Configuration**
Farm-specific settings:
- Paddock boundaries and areas
- Threshold overrides
- Notification preferences`,
    },
    {
      heading: 'Ingestion Patterns',
      content: `Data enters the system through different mechanisms:

**Batch Upsert (Observations)**
Satellite data arrives in batches. The system upserts (insert or update) based on farm/paddock/date combination:`,
      codeExample: {
        language: 'typescript',
        code: `// Observation upsert pattern
observations: defineTable({
  farmExternalId: v.string(),
  paddockExternalId: v.string(),
  date: v.string(),  // ISO date, used as dedup key
  ndviMean: v.number(),
  // ...
})
.index('by_paddock_date', ['paddockExternalId', 'date'])
.index('by_farm_date', ['farmExternalId', 'date'])
.index('by_farm', ['farmExternalId'])`,
      },
    },
    {
      heading: 'Event-Driven Input',
      content: `User actions trigger immediate writes:`,
      codeExample: {
        language: 'typescript',
        code: `// Grazing event recorded on plan approval
grazingEvents: defineTable({
  farmExternalId: v.string(),
  paddockExternalId: v.string(),
  date: v.string(),
  durationDays: v.optional(v.number()),
  notes: v.optional(v.string()),
  createdAt: v.string(),
})
.index('by_paddock', ['paddockExternalId'])
.index('by_farm', ['farmExternalId'])`,
      },
    },
    {
      heading: 'Normalization',
      content: `Raw data is processed to ensure consistency:

**Validation**
- Required fields must be present
- Numeric values must be in valid ranges (NDVI: -1 to 1)
- Dates must parse correctly
- Geometries must be valid GeoJSON

**Cleaning**
- Cloud-covered observations marked but retained
- Invalid readings flagged with \`isValid: false\`
- Missing optional fields get defaults

**Contextualization**
- Farm-specific thresholds applied
- Paddock-level overrides merged
- Relative metrics calculated (rest days, utilization %)`,
    },
    {
      heading: 'Storage Model',
      content: `Data is stored in Convex tables optimized for query patterns:

**Observations Table**
Satellite readings per paddock per day. Indexed for:
- Single paddock time series
- Farm-wide date queries
- Farm-wide collection for AI analysis

**Plans Table**
Generated recommendations and their outcomes:`,
      codeExample: {
        language: 'typescript',
        code: `plans: defineTable({
  farmExternalId: v.string(),
  date: v.string(),
  primaryPaddockExternalId: v.optional(v.string()),
  confidenceScore: v.number(),
  reasoning: v.array(v.string()),
  status: v.union(
    v.literal('pending'),
    v.literal('approved'),
    v.literal('rejected'),
    v.literal('executed'),
    v.literal('modified')
  ),
  sectionGeometry: v.optional(rawPolygon),
  sectionJustification: v.optional(v.string()),
  // ...
})
.index('by_farm_date', ['farmExternalId', 'date'])
.index('by_farm', ['farmExternalId'])`,
      },
    },
    {
      heading: 'Query Patterns',
      content: `Common access patterns for the agent and UI:

**Get all paddocks with current status**
Joins paddocks with latest observations and calculates rest days:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `export const getAllPaddocksWithObservations = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<PaddockSummary[]> => {
    const paddocks = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', farmExternalId))
      .collect()

    const grazingEvents = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', farmExternalId))
      .collect()

    // Join and compute derived fields
    return paddocks.map(paddock => ({
      ...paddock,
      ndviMean: latestObservation?.ndviMean ?? paddock.ndvi,
      restDays: calculateRestDays(paddock, grazingEvents),
      status: computeStatus(ndviMean, restDays),
    }))
  },
})`,
      },
    },
    {
      heading: 'Data Freshness',
      content: `The system tracks data age for quality signaling:

**Observation Recency**
Each observation has a date. The agent compares observation dates against "today" to determine staleness.

**Computed Metrics**
Rest days are calculated at query time, always reflecting current date:

\`\`\`
restDays = today - mostRecentGrazingEvent.date
\`\`\`

**Cache Behavior**
Convex queries are reactive—when underlying data changes, queries automatically re-execute and UI updates.`,
    },
  ],
  relatedArticles: [
    '/docs/system-architecture/overview',
    '/docs/integrations/satellites',
    '/docs/daily-operations/ndvi',
  ],
}
