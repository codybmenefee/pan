import type { ArticleContent } from '../types'

export const overview: ArticleContent = {
  title: 'Morning Brief Overview',
  description:
    'Understanding the daily morning brief: what it contains, how to interpret it, and the expected farmer workflow for reviewing and acting on recommendations.',
  sections: [
    {
      heading: 'This Is a Briefing, Not a Report',
      content: `The morning brief is designed for action, not analysis.

**What it is:**
A concise recommendation for today's grazing decision, with enough context to evaluate and act.

**What it isn't:**
A comprehensive farm report, historical analysis, or data dump.

The distinction matters. Reports inform over time. Briefings enable immediate decisions. The morning brief answers one question: *Where should animals graze today?*`,
    },
    {
      heading: 'The Daily Question',
      content: `Every morning, the platform answers:

**"Which paddock and which section should the herd graze today?"**

This question incorporates:
- Current forage conditions (NDVI across paddocks)
- Recovery status (days since last grazing)
- Utilization history (what's been grazed already)
- Constraint satisfaction (water access, rest requirements)

The answer comes as a specific recommendation with supporting reasoning.`,
    },
    {
      heading: 'Briefing Components',
      content: `Each morning brief contains:

**Primary Recommendation**
- Target paddock (e.g., "Paddock 3 - North Field")
- Recommended section (polygon on map)
- Action type: "continue grazing" or "move to new paddock"

**Confidence Score**
- Numeric indicator (0-100)
- Reflects data quality, not prediction accuracy
- Higher scores = better data coverage

**Reasoning Points**
- 2-3 bullet points explaining the decision
- Factors considered and how they influenced the choice
- Any warnings or caveats

**Section Details**
- Area in hectares
- Estimated NDVI for section
- Position relative to previous grazing
- Detailed justification text

**Alternatives** (when relevant)
- Other paddocks that could work
- Why primary choice was preferred`,
    },
    {
      heading: 'Expected Farmer Workflow',
      content: `The morning brief fits a daily routine:

**1. Review (2-3 minutes)**
Open the brief. See the recommendation on the map. Read the reasoning.

**2. Evaluate (1-2 minutes)**
Does this make sense? Any local factors the system doesn't know?

**3. Decide**
- **Approve**: Accept the recommendation. System records your decision.
- **Reject**: Decline with optional feedback. System notes the rejection.
- **Modify**: Adjust the section or paddock before approval.

**4. Execute**
Move animals according to your decision. The platform doesn't control execution.

**5. Repeat tomorrow**
The next brief accounts for today's decision.

Total time: 5-10 minutes for the decision process. Execution time depends on your operation.`,
    },
    {
      heading: 'Timing and Frequency',
      content: `**When to generate:**
Morning, before you need to make the grazing decision. Allows time for review before moving animals.

**Generation frequency:**
One plan per day. Generating multiple times overwrites the previous plan.

**Plan validity:**
The recommendation is for today's grazing. Don't carry over yesterday's plan.

**Off-hours:**
You can generate briefs at any time, but they're designed for morning decision-making.

**Weekends/Holidays:**
The platform doesn't know your schedule. Generate briefs when you need decisions, skip when you don't.`,
    },
    {
      heading: 'When the Brief Seems Wrong',
      content: `Sometimes the recommendation won't match your intuition. This is normal.

**Reasons to question:**
- You know something the system doesn't (broken fence, animal health issue)
- Local conditions changed since last satellite pass
- The system's thresholds don't match your operation

**What to do:**
- Override the recommendation (reject or modify)
- Provide feedback explaining why
- Consider whether thresholds need adjustment

**What NOT to do:**
- Blindly follow recommendations you disagree with
- Ignore the brief entirely without reason
- Assume the system is always right or always wrong

The brief is decision support, not decision replacement. Your judgment matters.`,
    },
  ],
  relatedArticles: [
    '/docs/daily-operations/recommendations',
    '/docs/daily-operations/confidence',
    '/docs/getting-started/quick-start',
  ],
}
