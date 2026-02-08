import type { ArticleContent } from '../types'

export const recommendations: ArticleContent = {
  title: 'Recommendations',
  description:
    'How the platform generates grazing recommendations. The decision logic, constraints considered, and why the system never recommends "rest."',
  sections: [
    {
      heading: 'What Question the System Answers',
      content: `The recommendation engine answers: **"Given current conditions and constraints, what is the best grazing decision for today?"**

The answer is always actionable:
- A specific pasture
- A specific paddock within that pasture
- Reasoning for the choice

The answer is never "don't graze" or "let them rest everywhere." Animals eat daily. The system respects this biological reality.`,
    },
    {
      heading: 'Constraints Considered',
      content: `The decision engine evaluates multiple constraints:

**NDVI Threshold**
Pastures below the minimum NDVI (default: 0.40) are deprioritized. They may still be selected if no better options exist.

**Rest Days**
Pastures that haven't met minimum rest period (default: 21 days) are deprioritized. Recent grazing (< 7 days) strongly discourages selection.

**Water Access**
If water zones are defined, proximity influences paddock placement.

**Historical Utilization**
Pastures already heavily utilized (high grazed percentage) may be deprioritized to balance usage.

**Previous Paddocks**
Within a pasture, paddocks must not overlap with recent previous paddocks.

No single constraint is absolute except: **animals must graze somewhere**.`,
    },
    {
      heading: 'Decision Logic',
      content: `The agent follows this logic flow:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentDirect.ts',
        code: `// Decision tree for paddock selection
let targetPaddock = currentPaddock
let recommendation = "graze"

if (currentNdvi < threshold) {
  // Current paddock below threshold - look for alternatives
  const alternatives = allPaddocks.filter(p => p.ndviMean >= threshold)

  if (alternatives.length > 0) {
    // Move to best alternative that meets threshold
    alternatives.sort((a, b) => {
      if (b.ndviMean !== a.ndviMean) return b.ndviMean - a.ndviMean
      return b.restDays - a.restDays
    })
    targetPaddock = alternatives[0]
    recommendation = "move"
  } else {
    // No paddocks meet threshold - find best available
    const allSorted = [...allPaddocks].sort((a, b) => {
      if (b.ndviMean !== a.ndviMean) return b.ndviMean - a.ndviMean
      return b.restDays - a.restDays
    })
    const bestAvailable = allSorted[0]

    if (bestAvailable.externalId !== currentPaddock.externalId) {
      targetPaddock = bestAvailable
      recommendation = "move"
    }
    // Else: stay in current (best available option)
  }
}`,
      },
    },
    {
      heading: 'Never Recommend "Rest"',
      content: `A critical design decision: **the platform never recommends doing nothing**.

**Why:**
- Animals must eat daily—"rest" isn't an option for livestock
- Recommending rest would be avoiding the decision, not making it
- Even suboptimal grazing is better than starving

**Implementation:**
The agent always selects a pasture and creates a paddock, even when all options are below threshold.

**When conditions are poor:**
- The recommendation acknowledges suboptimal conditions
- Confidence score is reduced
- Justification explains why this was the best available choice
- The farmer can still reject, but must then decide manually

This design respects the biological reality of livestock operations.`,
    },
    {
      heading: 'Pasture Selection Priority',
      content: `When choosing between pastures, the system prioritizes:

**1. NDVI above threshold + adequate rest**
Ideal conditions. High confidence recommendation.

**2. NDVI above threshold + partial rest (14-21 days)**
Good forage, approaching ideal rest. Moderate confidence.

**3. Highest available NDVI regardless of threshold**
When no pasture meets threshold, choose the best available.

**4. Balance NDVI and rest days**
When tie-breaking, prefer pastures with longer rest periods.

The system avoids:
- Pastures recently grazed (< 7 days)
- Heavily utilized pastures when others available
- Pastures without water access (if water zones defined)`,
    },
    {
      heading: 'Paddock Selection Within Pasture',
      content: `Once a pasture is selected, the AI generates a paddock:

**Size target:** ~20% of pasture area (configurable)

**Placement criteria:**
- Avoid overlap with previous paddocks
- Stay within pasture boundaries
- Consider water access proximity
- Maintain reasonable aspect ratio

**Geometry generation:**
The AI produces GeoJSON polygon coordinates that define the paddock boundary. This is validated and auto-clipped if needed.

**Justification:**
Text explaining why this specific area within the pasture was chosen.`,
    },
    {
      heading: 'What the Farmer Does With Output',
      content: `The recommendation is a starting point, not an order:

**Review the logic:**
Does the reasoning make sense? Are the factors weighted appropriately for your situation?

**Apply local knowledge:**
You know things the system doesn't. Adjust for unreported conditions.

**Make the call:**
Approve, reject, or modify. Your decision is recorded.

**Execute:**
Move animals according to your decision. The platform doesn't control physical execution.

**Provide feedback:**
If you rejected or modified, consider explaining why. This improves future recommendations.

The system optimizes based on available data. The farmer optimizes based on complete context. Both are necessary.`,
    },
  ],
  relatedArticles: [
    '/docs/daily-operations/overview',
    '/docs/daily-operations/confidence',
    '/docs/core-concepts/decision-support',
  ],
}
