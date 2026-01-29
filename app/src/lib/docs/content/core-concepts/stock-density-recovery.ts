import type { ArticleContent } from '../types'

export const stockDensityRecovery: ArticleContent = {
  title: 'Stock Density & Recovery',
  description:
    'The biological foundation of rotational grazing: why rest periods matter, how stock density affects pasture health, and how the platform tracks recovery status.',
  sections: [
    {
      heading: 'The Recovery Principle',
      content: `Grasses evolved with grazing. Herbivores bite, trample, and deposit manure. Plants regrow. This cycle, repeated over millennia, created the grasslands we manage today.

The critical insight: **recovery time between grazing events determines long-term productivity**.

When animals graze a pasture:
- Above-ground biomass is removed
- Plants mobilize root reserves to regrow
- Root systems temporarily shrink to balance reduced leaf area
- Soil biology adjusts to changed conditions

If animals return before recovery completes:
- Plants draw from already-depleted reserves
- Root systems shrink further
- Soil biology destabilizes
- Productivity spirals downward

Continuous grazing (animals always present) keeps pastures in permanent partial recovery. Rotational grazing allows full recovery between grazing events.`,
    },
    {
      heading: 'Stock Density vs. Continuous Grazing',
      content: `**Continuous grazing** spreads animals across all available pasture. Animals selectively graze preferred species and areas. Result: overgrazing of preferred spots, undergrazing of others.

**Rotational grazing** concentrates animals in smaller areas for shorter periods. Higher **stock density** (animals per unit area) forces less selective grazing. Result: more uniform utilization, then complete rest.

The platform supports this by:
- Dividing paddocks into sections (~20% of area)
- Recommending one section per day
- Tracking recovery time since last grazing

Higher stock density per section means:
- More complete utilization of available forage
- Shorter grazing periods per section
- Longer rest periods between return visits

The trade-off: Very high density can cause compaction and excessive stress. The platform's default 20% sections balance utilization against these concerns.`,
    },
    {
      heading: 'Compounding Land Health',
      content: `Proper recovery creates positive feedback loops:

**Year 1**: Adequate rest allows root recovery. Soil organic matter begins to build.

**Year 3**: Deeper root systems access more water and nutrients. Drought resilience improves.

**Year 5**: Soil biology establishes. Nutrient cycling accelerates. Pasture composition shifts toward productive species.

**Year 10+**: The land's carrying capacity has measurably increased. The same area supports more animals.

This compounding effect is why rotational grazing, properly executed, produces exponentially better returns than continuous grazing. But the compounding requires **consistent execution**—which is where most operations fail.

A single season of overgrazing can set back years of progress. The platform's role is ensuring consistent daily decisions that protect long-term compounding.`,
    },
    {
      heading: 'Platform Tracking: Rest Days',
      content: `The platform calculates \`restDays\` for each paddock:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `// Calculate rest days since last grazing event
let restDays = 0
if (mostRecentEvent?.date && latestObservation?.date) {
  const lastDate = new Date(mostRecentEvent.date)
  const obsDate = new Date(latestObservation.date)
  restDays = Math.max(0, Math.floor(
    (obsDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  ))
}`,
      },
    },
    {
      heading: 'Paddock Status Logic',
      content: `Rest days combine with NDVI to determine paddock status:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `let status = 'recovering'
if (ndviMean >= 0.4 && restDays >= 21) {
  status = 'ready'        // Green - available for grazing
} else if (ndviMean >= 0.4 && restDays >= 14) {
  status = 'almost_ready' // Yellow - approaching readiness
} else if (restDays < 7) {
  status = 'grazed'       // Gray - recently grazed
}`,
      },
    },
    {
      heading: 'Default Thresholds',
      content: `The platform applies configurable defaults:

**Minimum Rest Period: 21 days**
Based on temperate pasture regrowth cycles. Tropical systems may need less (14 days); dormant seasons may need more (45+ days). This can be adjusted in farm settings.

**NDVI Threshold: 0.40**
Represents moderate vegetation vigor. Below this, forage quality and quantity are likely insufficient. Above this, pasture is ready for grazing. Varies by region and species composition.

These thresholds are starting points. Your farm's optimal values depend on:
- Climate and season
- Pasture species
- Animal type and stocking rate
- Management goals (growth vs. maintenance)

The platform allows per-paddock overrides for areas with known differences (e.g., irrigated vs. dryland, improved vs. native pasture).`,
    },
    {
      heading: 'Why Recovery is Non-Negotiable',
      content: `The platform will not recommend a paddock that hasn't met minimum rest requirements, even if NDVI looks acceptable.

This is intentional. NDVI can appear adequate while root systems remain depleted. Visual forage availability doesn't indicate below-ground recovery.

If no paddocks meet both NDVI and rest thresholds, the platform selects the **best available option** with reduced confidence and explicit warning. Animals must eat somewhere—but the recommendation acknowledges suboptimal conditions.

This design choice reflects a core principle: **never sacrifice long-term land health for short-term convenience**. The platform will help you make the best of a difficult situation, but it won't pretend that overgrazing is acceptable.`,
    },
  ],
  relatedArticles: [
    '/docs/core-concepts/grazing-control-system',
    '/docs/core-concepts/time-constraint',
    '/docs/farm-setup/paddocks',
  ],
}
