import type { ArticleContent } from '../types'

export const humanInLoop: ArticleContent = {
  title: 'Human-in-the-Loop',
  description:
    'How the platform keeps humans in control of grazing decisions. Plan lifecycle, approval workflows, and feedback mechanisms that enable learning while preserving farmer authority.',
  sections: [
    {
      heading: 'Plan Lifecycle',
      content: `Every recommendation moves through defined states:

**pending** → Initial state after AI generation. Awaiting farmer review.

**approved** → Farmer accepted the plan. Grazing event recorded.

**rejected** → Farmer declined the plan. Optional feedback captured.

**modified** → Farmer changed the plan before approval.

**executed** → Plan was carried out (post-approval state for tracking).

This lifecycle ensures no automated action occurs without human approval.`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `plans: defineTable({
  // ...
  status: v.union(
    v.literal('pending'),
    v.literal('approved'),
    v.literal('rejected'),
    v.literal('executed'),
    v.literal('modified')
  ),
  approvedAt: v.optional(v.string()),
  approvedBy: v.optional(v.string()),
  feedback: v.optional(v.string()),
  // ...
})`,
      },
    },
    {
      heading: 'Review Interface Components',
      content: `When reviewing a recommendation, farmers see:

**Map View**
- Paddock boundaries with status colors
- Recommended section highlighted
- Previous sections shown for context

**Confidence Score**
- Numeric indicator (0-100)
- Visual badge (high/moderate/low)
- Tooltip explaining what affects confidence

**Reasoning Panel**
- 2-3 bullet points explaining the decision
- Factors considered (NDVI, rest days, utilization)
- Any warnings or caveats

**Section Details**
- Area in hectares
- Position within paddock
- NDVI estimate for section
- Justification text explaining placement

**Action Buttons**
- Approve: Accept as-is
- Reject: Decline with optional feedback
- Modify: Adjust before approval`,
    },
    {
      heading: 'Override Mechanisms',
      content: `Farmers can override recommendations at multiple levels:

**Plan Override**
Reject a specific recommendation and optionally provide feedback:`,
      codeExample: {
        language: 'typescript',
        code: `// Plan rejection with feedback
await ctx.runMutation(api.plans.updatePlanStatus, {
  planId,
  status: 'rejected',
  feedback: 'Water access blocked due to fence repair'
})`,
      },
    },
    {
      heading: 'Paddock-Level Overrides',
      content: `Adjust thresholds for specific paddocks that differ from farm defaults:`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `paddocks: defineTable({
  // ...standard fields...
  overrideMinNDVIThreshold: v.optional(v.number()),
  overrideMinRestPeriodDays: v.optional(v.number()),
  // ...
})`,
      },
    },
    {
      heading: 'Farm Settings Override',
      content: `Modify global defaults for the entire operation:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `export const getFarmSettings = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', farmExternalId))
      .first()

    if (!settings) {
      return {
        minNDVIThreshold: 0.40,  // Default
        minRestPeriod: 21,       // Default
        defaultSectionPct: 0.20, // Default
      }
    }

    return {
      minNDVIThreshold: settings.minNDVIThreshold,
      minRestPeriod: settings.minRestPeriod,
      defaultSectionPct: 0.20,
    }
  },
})`,
      },
    },
    {
      heading: 'Why Approval Is Required',
      content: `The platform intentionally does not automate execution. This design choice serves multiple purposes:

**Safety**
Wrong decisions have real consequences. A human checkpoint catches errors before they affect animals and land.

**Legal Accountability**
The farmer, not the software, is responsible for animal welfare and land management. Approval creates a clear decision record.

**Trust Building**
By reviewing recommendations before execution, farmers develop calibrated trust. They learn when the system is reliable and when to be skeptical.

**Learning Opportunity**
Seeing recommendations exposes the system's reasoning. Farmers learn rotational management principles through use.

**Context Integration**
Humans know things the system doesn't. That truck blocking the gate, the fence that needs repair, the animal showing signs of illness. Approval allows this context to influence decisions.`,
    },
    {
      heading: 'Feedback Incorporation',
      content: `Feedback improves future recommendations:

**Immediate Impact**
Rejecting a plan prevents that recommendation from affecting rest day calculations.

**Reasoning Context**
Feedback text is stored with the plan, creating an audit trail of decisions.

**Pattern Learning**
Over time, consistent feedback (e.g., always rejecting certain paddock combinations) can inform system improvements.

**Farm-Specific Adaptation**
Feedback accumulates at the farm level, building a history of what works for your operation.

The feedback loop is why the platform improves with use. A system that doesn't learn from farmer judgment would be static and eventually obsolete.`,
    },
  ],
  relatedArticles: [
    '/docs/core-concepts/decision-support',
    '/docs/system-architecture/farm-learning',
    '/docs/daily-operations/recommendations',
  ],
}
