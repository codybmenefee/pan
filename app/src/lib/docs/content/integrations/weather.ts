import type { ArticleContent } from '../types'

export const weather: ArticleContent = {
  title: 'Weather Services',
  description:
    'Weather data integration for growth context. Data fields, integration patterns, forecast vs historical data, and handling unavailable weather.',
  sections: [
    {
      heading: 'Weather as Growth Context',
      content: `Weather data provides context for interpreting vegetation measurements and setting expectations:

**Growth rate modifiers:**
- Temperature drives metabolic rates
- Precipitation determines soil moisture
- Sunshine hours affect photosynthesis

**Risk indicators:**
- Heat stress events
- Frost damage potential
- Drought conditions

**Recovery expectations:**
- Favorable weather accelerates recovery
- Unfavorable weather extends recovery time

Weather doesn't drive recommendations directly—it contextualizes satellite data and confidence levels.`,
    },
    {
      heading: 'Data Fields',
      content: `Weather history captures key variables:`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `weatherHistory: defineTable({
  farmId: v.id('farms'),
  date: v.string(),
  temperature: v.number(),        // Daily average or high (°C)
  precipitation: v.number(),      // Daily total (mm)
  humidity: v.optional(v.number()),     // Percentage
  windSpeed: v.optional(v.number()),    // km/h
  windDirection: v.optional(v.number()), // Degrees
  createdAt: v.string(),
}).index('by_farm_date', ['farmId', 'date'])`,
      },
    },
    {
      heading: 'Integration Patterns',
      content: `Weather data can enter the platform through several methods:

**API integration:**
Automated fetch from weather services (Bureau of Meteorology, Open-Meteo, etc.). Runs on schedule.

**Manual entry:**
For farms with on-site weather stations, direct data entry through the interface.

**Third-party sync:**
Integration with farm weather stations that push data automatically.

**Interpolated data:**
For farms without local measurement, interpolated grid data from regional sources.

The platform is agnostic to data source—any method that produces valid weather records works.`,
    },
    {
      heading: 'Forecast vs Historical',
      content: `The platform handles forecasts and historical data differently:

**Historical data (preferred):**
- Actual conditions that affected current pasture state
- High confidence in values
- Directly relevant to what you're seeing now

**Forecast data (supplementary):**
- Useful for planning, not current decisions
- Accuracy degrades beyond ~3 days
- Used for warnings, not predictions

**Platform approach:**
- Recent 7-14 days of actual conditions inform recommendations
- Forecasts may appear in justification text as context
- Confidence isn't reduced based on forecast uncertainty

This reflects a key principle: what happened matters more than what might happen.`,
    },
    {
      heading: 'Temperature Effects',
      content: `Temperature affects pasture growth rates:

**Below 5°C:** Most temperate grasses dormant. Recovery essentially stops.

**5-15°C:** Slow growth. Extended recovery periods expected.

**15-25°C:** Optimal range for many pastures. Normal recovery expectations.

**25-35°C:** Growth slows, especially with low moisture. Heat stress possible.

**Above 35°C:** Severe heat stress. Growth may stop. Animal welfare concern.

The platform notes extreme temperature events in recommendation justifications.`,
    },
    {
      heading: 'Precipitation Effects',
      content: `Rainfall drives soil moisture and growth:

**Recent rain (past 7 days):**
- Indicates current soil moisture
- Recent rain + warm temps = active growth
- Recent rain + cold temps = waterlogging risk

**Dry period (>14 days without rain):**
- Soil moisture depleting
- Growth rate declining
- Conservation approach may be warranted

**Heavy rain events:**
- May create access problems
- Compaction risk if grazed too soon
- Ponding in low areas

The platform doesn't calculate soil moisture models—it surfaces precipitation patterns for farmer interpretation.`,
    },
    {
      heading: 'Fallback When Unavailable',
      content: `Weather integration is optional. Without weather data:

**Recommendations still work:**
NDVI and rest days provide the primary decision basis.

**Context is reduced:**
Justifications can't reference weather conditions.

**Farmer judgment needed:**
Apply your knowledge of recent weather when evaluating recommendations.

**Confidence may decrease slightly:**
Missing context signals increase uncertainty.

The platform degrades gracefully. Weather adds value but isn't required for operation.`,
    },
    {
      heading: 'Setting Up Weather Integration',
      content: `To enable weather data for your farm:

**Option 1: Automated service**
Configure weather API credentials in farm settings. The platform fetches data automatically.

**Option 2: Manual entry**
Record daily conditions through the interface. Useful for farms with local instruments.

**Option 3: No weather**
The platform operates without weather data. Add it later when convenient.

Weather setup is in farm settings under "Integrations." Choose the method that fits your operation.`,
    },
  ],
  relatedArticles: [
    '/docs/daily-operations/weather',
    '/docs/integrations/satellites',
    '/docs/system-architecture/data-pipeline',
  ],
}
