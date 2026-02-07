import type { ArticleContent } from '../types'

export const overview: ArticleContent = {
  title: 'Core Concepts Overview',
  description:
    'The theoretical foundation for how the platform approaches grazing management. Understanding these concepts helps interpret recommendations and configure the system for your operation.',
  sections: [
    {
      heading: 'Why This Section Exists',
      content: `Most agricultural software treats farms as databases—collections of fields, animals, and events. This platform treats farms as **dynamic systems** with inputs, outputs, and feedback loops.

This distinction matters because:
- Databases describe what *is*
- Systems describe what *changes* and *why*

Grazing management is inherently dynamic. Pastures grow, animals consume, weather intervenes, and recovery periods constrain future options. A static view misses these interactions.

The concepts in this section explain the mental model underlying the platform's recommendations. You don't need to understand control theory to use the system, but understanding the framework helps you:
- Interpret why certain recommendations are made
- Configure thresholds appropriately for your operation
- Recognize when to override the system's suggestions`,
    },
    {
      heading: 'The Mental Model',
      content: `The platform views rotational grazing through the lens of **closed-loop control systems**:

**Inputs (Sensing)**
- Satellite imagery measuring vegetation vigor (NDVI)
- Weather data affecting growth rates
- Historical grazing events
- Farmer observations and overrides

**State (Understanding)**
- Current forage availability per pasture
- Recovery status (days since last grazing)
- Trend direction (improving, stable, declining)

**Actions (Recommendations)**
- Which pasture to graze
- What paddock within the pasture
- Confidence level in the recommendation

**Feedback (Learning)**
- Farmer approval or rejection
- Actual outcomes vs. predictions
- Long-term pasture performance patterns

This loop repeats daily. Each cycle incorporates new data and refines understanding of your specific farm.`,
    },
    {
      heading: 'Key Variables',
      content: `The platform tracks several interacting variables:

**Forage Availability** - Measured primarily through NDVI (Normalized Difference Vegetation Index). Higher values indicate more photosynthetically active vegetation. Not a direct measure of biomass, but a reliable proxy for relative pasture condition.

**Recovery Time** - Days since a pasture was last grazed. Recovery allows root systems to regenerate, soil biology to stabilize, and forage to regrow. Insufficient recovery is the most common failure mode in rotational systems.

**Grazing Pressure** - The relationship between animal demand and available forage. The platform models this through paddock sizing—recommending smaller paddocks when forage is limited.

**Weather Influence** - Temperature and precipitation affect growth rates. The platform weights recent weather more heavily than forecasts, using conditions as modifiers to expected recovery.

**Confidence** - Not a variable about the land, but about the data. Confidence scores reflect satellite coverage, data recency, and agreement between signals.`,
    },
    {
      heading: 'Reading Guide',
      content: `The following articles dive deeper into specific concepts:

[Grazing as a Control System](/docs/core-concepts/grazing-control-system) - The full framework for understanding grazing as a feedback loop.

[Stock Density & Recovery](/docs/core-concepts/stock-density-recovery) - Why rest periods matter and how the platform tracks them.

[Time as the Constraint](/docs/core-concepts/time-constraint) - The scaling problem that limits human management capacity.

[Partial Data & Uncertainty](/docs/core-concepts/partial-data) - How the platform operates when information is incomplete.

[Decision Support Philosophy](/docs/core-concepts/decision-support) - The role of AI and the boundaries of automation.

These articles are written for multiple audiences. Farmers will find practical implications. Investors will see the systemic thinking. Researchers will recognize the methodological foundations.`,
    },
  ],
  relatedArticles: [
    '/docs/core-concepts/grazing-control-system',
    '/docs/core-concepts/decision-support',
    '/docs/system-architecture/overview',
  ],
}
