import type { ArticleContent } from '../types'

export const farmLearning: ArticleContent = {
  title: 'Farm-Level Learning',
  description:
    'How the platform learns from your specific operation over time. Historical pattern recognition, slow-learning by design, and why farm-specific adaptation matters more than global optimization.',
  sections: [
    {
      heading: 'Learning at Farm Level, Not Global',
      content: `The platform learns from your farm specifically, not from global averages.

**Why this matters:**

Global models would:
- Average across diverse climates and soil types
- Dilute patterns specific to your operation
- Apply one-size-fits-all recommendations
- Miss what makes your land unique

Farm-level learning:
- Builds understanding of your specific paddocks
- Recognizes your rotation patterns
- Adapts to your local conditions
- Improves as your data accumulates

Each farm is its own learning environment. Your neighbor's data doesn't influence your recommendations.`,
    },
    {
      heading: 'What the System Remembers',
      content: `The platform accumulates several types of history:

**Grazing Events**
Every approved plan creates a record: which paddock, which section, what date. This history enables:
- Rest day calculations
- Utilization tracking
- Section overlap avoidance

**Observation History**
NDVI readings over time show:
- Seasonal patterns
- Recovery rates
- Trend directions (improving, stable, declining)

**Plan Outcomes**
The status of each plan (approved, rejected, modified) captures:
- Which recommendations were acceptable
- What feedback was provided
- Patterns in farmer overrides

**Paddock Performance**
Derived metrics that emerge from history:
- Typical NDVI range for each paddock
- Recovery duration under various conditions
- Utilization efficiency`,
    },
    {
      heading: 'Historical Pattern Recognition',
      content: `The agent queries historical data before generating recommendations:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `// Get previous sections to avoid overlap
export const getPreviousSections = query({
  args: {
    farmExternalId: v.optional(v.string()),
    paddockId: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<SectionWithJustification[]> => {
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', farmExternalId))
      .collect()

    // Filter to relevant historical sections
    return plans
      .filter((plan) =>
        plan.sectionGeometry &&
        plan.primaryPaddockExternalId === targetPaddockId &&
        plan.date !== today &&
        plan.status !== 'rejected'
      )
      .map((plan) => ({
        date: plan.date,
        geometry: plan.sectionGeometry,
        area: plan.sectionAreaHectares,
        justification: plan.sectionJustification,
      }))
  },
})`,
      },
    },
    {
      heading: 'Paddock Utilization Tracking',
      content: `The system calculates how much of each paddock has been grazed:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `export const calculatePaddockGrazedPercentage = query({
  args: { farmExternalId: v.optional(v.string()), paddockId: v.string() },
  handler: async (ctx, args): Promise<number> => {
    const paddockArea = paddock.area || calculateAreaHectares(paddock.geometry)
    if (paddockArea === 0) return 0

    let totalGrazedArea = 0
    for (const plan of plans) {
      // Count sections from previous days (exclude today, exclude rejected)
      if (
        plan.primaryPaddockExternalId === args.paddockId &&
        plan.sectionGeometry &&
        plan.date !== today &&
        plan.status !== 'rejected'
      ) {
        totalGrazedArea += plan.sectionAreaHectares ||
          calculateAreaHectares(plan.sectionGeometry)
      }
    }

    return Math.round((totalGrazedArea / paddockArea) * 100)
  },
})`,
      },
    },
    {
      heading: 'Slow-Learning by Design',
      content: `The platform favors stability over novelty.

**Why slow learning:**

Agricultural systems have long feedback cycles. A grazing decision today affects:
- Pasture condition in 3-4 weeks
- Soil health over seasons
- Carrying capacity over years

Rapid adaptation to recent events could:
- Overfit to weather anomalies
- Amplify noise in satellite data
- Destabilize rotation patterns

**Implementation approach:**

- Historical data weighted toward recency but includes full history
- Threshold changes require explicit farmer action
- No automated parameter adjustment without human review
- Patterns must appear consistently before influencing recommendations

The system learns, but it learns carefully. Agricultural wisdom accumulated over generations shouldn't be overwritten by a single unusual week.`,
    },
    {
      heading: 'Feedback Improves Recommendations',
      content: `Farmer feedback creates multiple learning signals:

**Immediate learning:**
Rejecting a plan prevents that section from being counted as grazed. Tomorrow's recommendation won't assume those animals were in that location.

**Pattern learning:**
Consistent rejection of certain recommendations (e.g., always rejecting Paddock 5 in early spring) creates a pattern the platform can recognize.

**Explicit knowledge:**
Farmer observations and notes capture context satellites miss:
- Infrastructure changes
- Animal health events
- Unusual conditions

**Threshold calibration:**
Over time, farmers can adjust thresholds based on observed outcomes:
- "NDVI 0.35 seems to work here" → adjust threshold
- "21 days isn't enough in our dry season" → adjust rest period

This feedback loop is continuous. Each interaction refines the platform's model of your specific operation.`,
    },
  ],
  relatedArticles: [
    '/docs/system-architecture/human-in-loop',
    '/docs/system-architecture/data-pipeline',
    '/docs/farm-setup/paddocks',
  ],
}
