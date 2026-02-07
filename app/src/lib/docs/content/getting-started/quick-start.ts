import type { ArticleContent } from '../types'

export const quickStart: ArticleContent = {
  title: 'Quick Start',
  description:
    'Get your first morning brief in under 5 minutes. This guide walks through the core workflow: viewing farm status, generating a recommendation, and reviewing the AI reasoning.',
  sections: [
    {
      heading: 'Prerequisites',
      content: `Before generating your first brief, ensure:

- Your farm has been imported into the system (see [Importing Data](/docs/farm-setup/import))
- At least one pasture has geometry defined
- You have an active user account with farm access

If you're using the demo environment, sample farm data is pre-loaded and ready to use.`,
    },
    {
      heading: 'Step 1: View Your Farm Overview',
      content: `Navigate to the main dashboard. You'll see:

**Farm Map** - Pasture boundaries with color-coded status:
- *Green (Ready)*: NDVI above threshold, sufficient rest days
- *Yellow (Almost Ready)*: NDVI above threshold, 14-21 rest days
- *Orange (Recovering)*: Below threshold or insufficient rest
- *Gray (Recently Grazed)*: Less than 7 days since grazing

**Status Summary** - Total pastures, current grazing location, and overall farm health metrics.

The map provides spatial context. The status indicators show which pastures are candidates for grazing.`,
    },
    {
      heading: 'Step 2: Generate Your Morning Brief',
      content: `Click the **"Generate Brief"** button to initiate plan generation.

The AI analyzes:
- Current NDVI readings across all pastures
- Rest days since last grazing event for each pasture
- Previous grazing paddocks in the target pasture
- Farm-specific threshold settings

Generation typically completes within a few seconds. The system will display a progress indicator while processing.`,
    },
    {
      heading: 'Step 3: Review the Recommendation',
      content: `The morning brief includes:

**Recommended Paddock** - A specific area within the target pasture, shown as a polygon on the map. Paddocks are approximately 20% of pasture area by default.

**Confidence Score** - A numeric indicator (0-100) reflecting data quality and coverage. Higher scores indicate better satellite coverage and stronger data agreement.

**Reasoning** - 2-3 bullet points explaining why this pasture and paddock were selected. Typical factors include:
- NDVI values relative to threshold
- Rest days since last grazing
- Position relative to previously grazed paddocks

**Paddock Justification** - Detailed text explaining the paddock placement, what areas to target, and any warnings about conditions.`,
    },
    {
      heading: 'Step 4: Approve or Provide Feedback',
      content: `After reviewing the recommendation:

**Approve** - Accepts the plan as-is. The system records your approval and the plan status changes to "approved."

**Reject with Feedback** - Declines the recommendation. You can optionally provide feedback explaining why (e.g., "Water access blocked in that area"). This feedback improves future recommendations.

**Modify** - Make adjustments to the paddock geometry or change the target pasture before approval.

The platform does not move animals automatically. Approval is a record of your decision, not an execution trigger.`,
    },
    {
      heading: 'What Happens Next',
      content: `After approval:

1. The plan is recorded with timestamp and approval metadata
2. A grazing event is logged for the target pasture
3. Tomorrow's brief will account for today's grazing location
4. Rest day calculations update accordingly

The platform accumulates history over time. More usage produces better recommendations as the system learns your pasture rotation patterns and farm-specific characteristics.

For detailed configuration options, see [Farm Setup](/docs/farm-setup/modeling-philosophy).`,
    },
  ],
  relatedArticles: [
    '/docs/getting-started/introduction',
    '/docs/daily-operations/overview',
    '/docs/daily-operations/recommendations',
  ],
}
