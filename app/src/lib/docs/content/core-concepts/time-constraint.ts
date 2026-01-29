import type { ArticleContent } from '../types'

export const timeConstraint: ArticleContent = {
  title: 'Time as the Constraint',
  description:
    'Understanding why most grazing failures are timing errors, not spatial errors. The combinatorial explosion of decisions limits human capacity and creates the scaling bottleneck that the platform addresses.',
  sections: [
    {
      heading: 'Timing Errors vs. Space Errors',
      content: `Most grazing management failures are **timing errors**, not spatial errors.

**Spatial errors** (less common):
- Moving to the wrong paddock entirely
- Fencing that doesn't match paddock boundaries
- Infrastructure in the wrong location

**Timing errors** (most common):
- Returning to a paddock before adequate recovery
- Staying in a section too long, depleting regrowth capacity
- Missing the optimal grazing window when forage is most nutritious

A farmer can have perfect paddock layout and still degrade land through poor timing. Conversely, adequate timing with imperfect layout often produces acceptable results.

The platform focuses on timing: which paddock today, which section, how long before moving.`,
    },
    {
      heading: 'The Cognitive Scaling Problem',
      content: `Human cognition handles complexity well up to a point, then fails rapidly.

**Small operation (5 paddocks)**
- 5 paddocks with ~5 key variables each = 25 data points
- Farmer visits all paddocks regularly
- Mental model stays current
- Intuitive decisions work

**Medium operation (20 paddocks)**
- 20 paddocks × 5 variables = 100 data points
- Some paddocks not visited for weeks
- Mental model lags reality
- Errors increase, especially under stress

**Large operation (50+ paddocks)**
- 250+ data points
- Impossible to hold complete picture
- Decisions become reactive, not proactive
- Systematic optimization impossible

This isn't a criticism of farmers—it's a fundamental constraint of human working memory. The same farmer who excels at 5 paddocks struggles at 50 not because of skill but because of cognitive architecture.`,
    },
    {
      heading: 'Decision Surface Expansion',
      content: `The complexity isn't just the number of data points—it's the interaction between decisions.

Today's grazing choice affects:
- Tomorrow's options (one fewer paddock available)
- Next week's options (recovery timing of today's paddock)
- Next month's options (cumulative utilization patterns)

For a 20-paddock farm with 4 possible section choices per paddock, the decision tree for one week is: 20 × 4 × 19 × 4 × 18 × 4... = millions of paths.

Humans navigate this by heuristics and habits. But heuristics:
- Miss non-obvious optimal paths
- Fail under novel conditions (drought, disease)
- Encode biases that may not serve the operation

The platform doesn't enumerate all paths (computationally infeasible). It applies constrained optimization: find a good-enough choice that satisfies all hard constraints (NDVI, rest days) and optimizes soft factors (utilization, efficiency).`,
    },
    {
      heading: 'Why This Is the Scaling Bottleneck',
      content: `Land scales linearly. Equipment scales with capital. Labor scales with hiring.

**Management attention doesn't scale.**

A farmer managing 1,000 acres makes essentially the same daily decisions as one managing 10,000 acres—just more of them. At some threshold, the decision volume exceeds capacity. Quality degrades.

This explains a persistent pattern in agriculture:
- Small intensive operations achieve excellent per-acre yields
- Large extensive operations achieve lower per-acre yields but scale labor
- The middle zone is unstable—too big for intuitive management, too small for dedicated specialists

The platform targets this middle zone. By automating the **data aggregation and decision support** (where computers excel) while preserving **judgment and execution** (where humans excel), operations can scale land under intensive management without proportionally scaling management attention.`,
    },
    {
      heading: 'How the Platform Addresses Timing',
      content: `The platform attacks the timing problem through:

**Continuous Data Integration**
Satellite imagery updates independent of farmer visits. The system knows paddock conditions even for areas not recently walked.

**Automated Tracking**
Rest days calculate automatically from grazing event records. No need to remember when each paddock was last grazed.

**Daily Recommendations**
The system produces a decision every day, ensuring no decision is delayed by distraction or workload.

**Temporal Reasoning**
The AI considers not just current state but projected future state. Will this paddock be ready next week? Is utilization getting uneven?

**Consistent Execution**
No fatigue, no off days, no distraction from other priorities. The system maintains attention that humans cannot sustain.

The farmer still makes the final call. But the farmer makes that call with complete, current information and a reasoned recommendation—not from memory of a walk-through two weeks ago.`,
    },
  ],
  relatedArticles: [
    '/docs/core-concepts/grazing-control-system',
    '/docs/core-concepts/decision-support',
    '/docs/system-architecture/scaling',
  ],
}
