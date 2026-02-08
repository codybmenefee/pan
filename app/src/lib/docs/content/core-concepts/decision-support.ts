import type { ArticleContent } from '../types'

export const decisionSupport: ArticleContent = {
  title: 'Decision Support Philosophy',
  description:
    'The role of AI in grazing management: what decisions the platform automates, what it leaves to humans, and why this division matters for scaling agricultural operations.',
  sections: [
    {
      heading: 'Decision Automation vs. Decision Replacement',
      content: `The platform occupies a specific position on the automation spectrum:

**Full automation** (not our approach):
- System makes decisions without human input
- Animals move autonomously
- Farmer monitors results

**Decision replacement** (not our approach):
- System tells farmer what to do
- Farmer executes without judgment
- System takes responsibility for outcomes

**Decision support** (our approach):
- System gathers data and generates recommendations
- System explains reasoning explicitly
- Farmer reviews, approves, or overrides
- Farmer retains authority and accountability

This distinction matters because agricultural systems have consequences that AI cannot fully model. A wrong recommendation about grazing might affect animal health, land degradation, or business viability in ways that take months or years to manifest.`,
    },
    {
      heading: 'What AI Does Well',
      content: `The platform uses AI for tasks where machine capabilities exceed human capabilities:

**Data Fusion**
Combining satellite imagery, weather data, historical events, and configuration into a coherent picture. Humans struggle with multidimensional data; machines excel at it.

**Consistent Application**
Applying the same logic every day without fatigue, distraction, or bias. The 500th recommendation follows the same rules as the first.

**Pattern Recognition**
Identifying trends in NDVI, recovery patterns, and utilization across many pastures simultaneously.

**Documentation**
Generating reasoning text that explains decisions. This creates an audit trail and enables learning.

**Spatial Computation**
Calculating paddock geometries, avoiding overlaps, clipping to boundaries. Geometric operations that would take humans considerable effort.`,
    },
    {
      heading: 'What AI Does Poorly',
      content: `The platform explicitly avoids tasks where human judgment is superior:

**Local Knowledge**
That pasture floods when the creek rises. The AI doesn't know this unless told. Farmer observations capture what satellites miss.

**Novel Situations**
Drought, disease outbreak, equipment failure. These require creative problem-solving that AI handles poorly.

**Stakeholder Management**
Explaining decisions to family, partners, or lenders. The AI can document reasoning, but humans navigate relationships.

**Ethical Judgment**
When to push animals harder vs. accept lower productivity. These trade-offs involve values that shouldn't be automated.

**Long-term Strategy**
Whether to expand, contract, change enterprises. The platform optimizes within a strategy; it doesn't set strategy.`,
    },
    {
      heading: 'The Human Remains the Decision-Maker',
      content: `Every recommendation requires explicit human approval before execution.

This isn't a limitation—it's a design choice with specific benefits:

**Accountability stays with the farmer**
When things go wrong (they will), the farmer made the call. There's no ambiguity about who is responsible.

**Learning opportunity**
Reviewing recommendations teaches the farmer what the system values. Over time, this builds intuition about rotational dynamics.

**Override capability**
When local knowledge contradicts the recommendation, the farmer can act on that knowledge without fighting the system.

**Trust calibration**
By seeing recommendations before execution, farmers develop calibrated trust—knowing when to follow and when to question.

The platform's value isn't in removing human involvement but in **focusing human attention** on judgment rather than data gathering.`,
    },
    {
      heading: 'AI Limitations Acknowledged',
      content: `To be explicit about what the AI cannot do:

**Not ecological expertise**
The platform applies general principles. It doesn't understand your specific ecosystem, soil type, or species composition at a deep level.

**Not predictive oracle**
Recommendations are based on current state and historical patterns. Novel weather, market conditions, or biological events aren't predicted.

**Not infallible**
The AI will occasionally make recommendations that, in hindsight, were suboptimal. This is why human review exists.

**Not aware of consequences**
The AI doesn't experience outcomes. It doesn't know if animals lost condition or pasture degraded unless that data is fed back.

These limitations aren't failures—they're inherent in any computational system. Acknowledging them prevents misplaced trust and ensures appropriate human oversight.`,
    },
    {
      heading: 'Scaling Farmers, Not Replacing Them',
      content: `The economic thesis: skilled agricultural operators are the scarce resource.

Land is relatively abundant. Capital follows opportunity. Labor can be hired.

But a farmer with 30 years of experience, deep intuition about their land, and judgment honed by success and failure—that's irreplaceable.

The platform's goal is to **extend the reach of skilled farmers**:
- Manage more acres with the same attention
- Spend mental energy on high-value decisions
- Document institutional knowledge for succession
- Scale operations without proportionally scaling stress

This is why decision support (human + machine) outperforms both pure automation (machine alone) and traditional management (human alone). Each component does what it does best.

The farmer who can confidently manage 100 pastures instead of 20—without working 3x the hours—achieves leverage that transforms agricultural economics.`,
    },
  ],
  relatedArticles: [
    '/docs/core-concepts/time-constraint',
    '/docs/system-architecture/human-in-loop',
    '/docs/system-architecture/scaling',
  ],
}
