import type { ArticleContent } from '../types'

export const introduction: ArticleContent = {
  title: 'Introduction',
  description:
    'Morning Farm Brief is an AI-powered decision support system that translates satellite-derived vegetation data into daily grazing recommendations. This documentation explains how the platform works, who it serves, and what it can and cannot do.',
  sections: [
    {
      heading: 'Who This Portal Is For',
      content: `This documentation serves multiple audiences, each with different goals:

**Farmers & Operators** seeking practical guidance on using the platform for daily grazing decisions. Start with the [Quick Start](/docs/getting-started/quick-start) guide.

**Investors & Advisors** evaluating the platform's technical foundation, scalability, and market thesis. Focus on [Core Concepts](/docs/core-concepts/overview) and [System Architecture](/docs/system-architecture/overview).

**Researchers & Agronomists** interested in the decision models, data sources, and methodological assumptions. The [Data Pipeline](/docs/system-architecture/data-pipeline) and [NDVI Analysis](/docs/daily-operations/ndvi) sections provide technical depth.

**Engineers & Developers** building integrations or extending the platform. See [Platform Interfaces](/docs/platform-interfaces/overview) for API documentation.`,
    },
    {
      heading: 'The Core Problem',
      content: `Rotational grazing improves pasture productivity, soil health, and animal performance. The science is well-established. Yet adoption remains limited, especially at scale.

The constraint is not knowledge—it's **cognitive load**.

A skilled grazier manages decisions across multiple interacting variables:
- Current forage availability across paddocks
- Recovery time since last grazing
- Weather conditions affecting growth
- Animal requirements and stocking density
- Water access and infrastructure constraints

On a small farm, a single person can hold this complexity in their head. As farm size increases, the decision surface expands combinatorially. A 20-paddock farm with 5 relevant variables creates a decision space no human can reliably optimize.

The result: farmers either under-utilize rotational strategies or spend unsustainable time on daily logistics.`,
    },
    {
      heading: 'What This Platform Is',
      content: `Morning Farm Brief is a **decision support system**, not an autonomous controller.

Each morning, the platform:
1. Aggregates satellite, weather, and farm data
2. Analyzes paddock conditions and recovery status
3. Generates a recommended grazing section with reasoning
4. Presents the recommendation for human review and approval

The farmer remains the decision-maker. The platform handles data fusion, pattern recognition, and reasoning documentation—tasks that computers do well. The farmer contributes local knowledge, judgment, and accountability—tasks that humans do well.

This is not a dashboard. Dashboards display data. Morning Farm Brief makes **recommendations** with explicit reasoning, then learns from farmer feedback.`,
    },
    {
      heading: 'What This Platform Is Not',
      content: `To set appropriate expectations:

**Not a replacement for ecological judgment.** The platform applies general principles. Your land has unique characteristics that override defaults.

**Not a prescriptive rule engine.** We don't tell you what to do. We tell you what the data suggests, with confidence levels.

**Not dependent on perfect data.** The platform operates under uncertainty. Missing satellite observations, incomplete weather data, or gaps in history are expected conditions, not failures.

**Not autonomous.** No animals move without farmer approval. The platform generates recommendations; humans decide.`,
    },
    {
      heading: 'Platform Thesis',
      content: `The economics of regenerative agriculture require scaling operator attention, not just land area.

A farmer who can confidently manage 50 paddocks instead of 20—without proportionally increasing cognitive load—achieves leverage unavailable to traditional operations. The platform's value is not in the recommendation itself (any experienced grazier could make similar decisions) but in making that decision **faster, more consistently, and with documented reasoning**.

Over time, this creates compounding advantages:
- More land under intensive management
- Better data for agronomic decisions
- Documented history for financing and certification
- Reduced burnout from daily logistics

The goal is not to replace the farmer's expertise but to multiply its reach.`,
    },
  ],
  relatedArticles: [
    '/docs/getting-started/quick-start',
    '/docs/core-concepts/overview',
    '/docs/core-concepts/decision-support',
  ],
}
