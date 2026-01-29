import type { ArticleContent } from '../types'

export const weather: ArticleContent = {
  title: 'Weather Integration',
  description:
    'How weather data influences grazing recommendations. Weather as growth modifier, risk constraint, and timing signal. Understanding the relationship between conditions and recovery.',
  sections: [
    {
      heading: 'Weather as Growth Context',
      content: `Weather doesn't directly determine grazing decisions, but it provides essential context:

**Growth modifiers:**
- Temperature affects growth rate
- Precipitation drives soil moisture
- Sunshine hours influence photosynthesis

**Risk constraints:**
- Extreme heat limits animal movement
- Heavy rain creates access problems
- Frost damages vulnerable growth

**Timing signals:**
- Seasons affect recovery expectations
- Weather patterns shift optimal grazing windows

The platform uses weather to contextualize satellite observations and adjust confidence in recommendations.`,
    },
    {
      heading: 'Data Fields',
      content: `Weather history tracks key variables:`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `weatherHistory: defineTable({
  farmId: v.id('farms'),
  date: v.string(),
  temperature: v.number(),      // Daily average or high
  precipitation: v.number(),    // mm
  humidity: v.optional(v.number()),
  windSpeed: v.optional(v.number()),
  windDirection: v.optional(v.number()),
  createdAt: v.string(),
}).index('by_farm_date', ['farmId', 'date'])`,
      },
    },
    {
      heading: 'Recent Conditions Over Forecasts',
      content: `The platform weights historical weather more heavily than forecasts.

**Why:**
- Forecasts degrade rapidly beyond 3 days
- Past conditions directly affected current pasture state
- Forecast uncertainty compounds with timeframe

**Implementation:**
- Recent 7-14 days of actual conditions are considered
- Forecasts may inform confidence but don't drive recommendations
- Unusual recent weather triggers cautionary notes

**Example:**
If the past two weeks were unseasonably dry, NDVI might look acceptable but recovery assumptions should be conservative. The platform notes this rather than predicting future recovery.`,
    },
    {
      heading: 'Forecasts as Constraints',
      content: `Weather forecasts serve as constraints, not predictions:

**"Don't graze if heavy rain expected"**
Rather than predicting rain impact, the platform might note upcoming conditions in the justification.

**"Heat event approaching"**
Extreme temperature forecasts may warrant cautionary notes about animal stress.

**Operational, not predictive:**
The platform doesn't predict pasture response to forecast weather. It flags conditions the farmer should consider.

This conservative approach acknowledges forecast limitations while still providing useful information.`,
    },
    {
      heading: 'Impact on Recovery Expectations',
      content: `Weather affects how long recovery should take:

**Favorable conditions:**
- Adequate rainfall, moderate temperatures
- Faster expected recovery
- Standard rest periods apply

**Unfavorable conditions:**
- Drought, extreme heat, extended cold
- Slower expected recovery
- Rest periods may need extension

**Seasonal patterns:**
- Growing season: active recovery
- Dormant season: minimal recovery regardless of time
- Transition periods: variable

The platform doesn't automatically adjust rest periods for weather. It surfaces conditions so farmers can make informed adjustments.`,
    },
    {
      heading: 'Stress Events',
      content: `Certain weather events warrant special attention:

**Heat stress:**
- Affects animal behavior and intake
- May change optimal grazing timing
- Consider shade access in recommendations

**Drought:**
- Reduces growth rates dramatically
- NDVI may decline despite rest
- Conservative grazing prevents long-term damage

**Frost:**
- Damages actively growing tissue
- Affects some species more than others
- May warrant delaying grazing until recovery

**Flooding:**
- Creates access problems
- Compaction risk increases
- Paddock status may need manual update

The platform flags known stress events in recommendation justifications when weather data indicates them.`,
    },
    {
      heading: 'When Weather Data Is Unavailable',
      content: `Weather integration is optional. Without weather data:

**Recommendations still work:**
NDVI and rest days provide the primary decision basis. Weather adds context but isn't required.

**Confidence may be lower:**
Missing weather context means less complete picture.

**Manual consideration:**
The farmer should apply weather judgment that the system lacks.

The platform degrades gracefully without weather data rather than failing or producing invalid recommendations.`,
    },
  ],
  relatedArticles: [
    '/docs/daily-operations/ndvi',
    '/docs/daily-operations/confidence',
    '/docs/integrations/weather',
  ],
}
