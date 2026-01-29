import type { ArticleContent } from '../types'

export const scaling: ArticleContent = {
  title: 'Scaling Architecture',
  description:
    'How the platform enables agricultural operations to scale without proportionally scaling management overhead. API-first design, future integration patterns, and economic leverage through technology.',
  sections: [
    {
      heading: 'Why API-First Enables Scale',
      content: `The platform exposes all functionality through typed APIs. This design choice has strategic implications:

**No UI Lock-in**
The web interface is one consumer of the API. Other interfaces (mobile apps, hardware integrations, third-party systems) can use the same endpoints.

**Headless Operation**
Automated systems can interact without human presence. Scheduled jobs, sensor triggers, and external events can invoke platform functionality.

**Composability**
Multiple systems can combine platform capabilities. A farm management system might query paddock status while a virtual fencing system consumes section geometry.

**Evolution**
New interfaces can be built without backend changes. Today's web UI can become tomorrow's voice interface or AR overlay—the API remains stable.`,
    },
    {
      heading: 'Future Integration Points',
      content: `The architecture anticipates several integration categories:

**Hardware Sensors**
- Soil moisture probes updating observations
- Weather stations providing hyperlocal data
- Animal tracking devices recording movements
- Water flow meters monitoring infrastructure

**Autonomous Systems**
- Virtual fencing receiving section boundaries
- Drone surveys augmenting satellite data
- Robotic inspection documenting conditions
- Automated gates following rotation plans

**Business Systems**
- Farm management software syncing events
- Accounting systems tracking productivity
- Compliance platforms accessing records
- Insurance providers assessing practices

**Research Access**
- Agronomic analysis of long-term patterns
- Academic studies using anonymized data
- Industry benchmarking across operations

Each integration follows the same pattern: authenticate, query/mutate, respect rate limits.`,
    },
    {
      heading: 'Convex Architecture Benefits',
      content: `The Convex backend provides characteristics suited to scaling:

**Serverless Functions**
- Automatic scaling with demand
- No server management
- Pay-per-use economics
- Cold start optimization

**Real-time Subscriptions**
- Changes propagate instantly
- No polling overhead
- Efficient for dashboards and monitoring

**Strong Consistency**
- Transactions are ACID
- No stale reads
- Predictable behavior

**Type Safety**
- End-to-end TypeScript
- Schema validation
- Generated API types`,
      codeExample: {
        language: 'typescript',
        filename: 'Convex function pattern',
        code: `// Queries are reactive - UI updates automatically
export const getAllPaddocksWithObservations = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<PaddockSummary[]> => {
    // Database queries are automatically optimized
    const paddocks = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()
    // ...
  },
})`,
      },
    },
    {
      heading: 'Research Access Patterns',
      content: `The platform supports research through several mechanisms:

**Query APIs**
Researchers can query historical data for analysis:
- Observation time series
- Plan history and outcomes
- Feedback patterns

**Export Capabilities**
Data can be extracted for offline analysis:
- GeoJSON paddock boundaries
- CSV observation records
- JSON plan archives

**Anonymization**
When required, farm identities can be anonymized while preserving analytical value:
- Relative locations instead of coordinates
- Farm codes instead of names
- Aggregated metrics instead of individual records

**Benchmarking**
Cross-farm comparisons (with consent) enable:
- Regional productivity analysis
- Practice effectiveness studies
- Technology adoption research`,
    },
    {
      heading: 'Economic Leverage',
      content: `The platform's value proposition scales differently than traditional inputs:

**Traditional scaling:**
- More land → proportionally more labor
- More paddocks → proportionally more management time
- Growth limited by available attention

**Platform-enabled scaling:**
- More land → same cognitive load (platform handles data)
- More paddocks → incremental complexity (thresholds to configure)
- Growth limited by capital and land availability

This creates economic leverage:

**Farmer with 20 paddocks (manual)**
- ~30 minutes daily on grazing decisions
- Cognitive load limits expansion
- Each additional paddock adds burden

**Farmer with 50 paddocks (platform-assisted)**
- ~10 minutes daily reviewing recommendations
- Cognitive load managed by platform
- Each additional paddock is configuration, not daily work

The difference compounds over years. Operations that scale land faster than management overhead achieve structural advantages.`,
    },
    {
      heading: 'Avoiding Lock-in',
      content: `The platform is designed to be replaceable:

**Data Portability**
All farm data can be exported. If you leave, your data comes with you.

**Standard Formats**
- GeoJSON for spatial data
- ISO dates for timestamps
- Standard units (hectares, not proprietary measures)

**Open Integrations**
- No proprietary hardware requirements
- Works with any satellite provider
- Standard authentication protocols

**No Hostage Data**
Your grazing history, observations, and plans belong to you. The platform adds value through analysis and recommendations, not through data hoarding.

This philosophy builds trust. Farmers adopt tools they can abandon. Lock-in fears prevent adoption; portability enables it.`,
    },
  ],
  relatedArticles: [
    '/docs/core-concepts/time-constraint',
    '/docs/platform-interfaces/overview',
    '/docs/integrations/data-flywheel',
  ],
}
