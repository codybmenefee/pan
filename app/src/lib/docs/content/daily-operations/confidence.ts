import type { ArticleContent } from '../types'

export const confidence: ArticleContent = {
  title: 'Confidence Scoring',
  description:
    'Understanding confidence scores: what they represent, what they do not represent, and how to interpret them when reviewing recommendations.',
  sections: [
    {
      heading: 'What Confidence Represents',
      content: `The confidence score reflects **data quality**, not **prediction accuracy**.

A high confidence score means:
- Recent satellite observations available
- Good cloud-free coverage
- Multiple signals align
- Historical data is sufficient

A high confidence score does NOT mean:
- The recommendation will definitely produce good outcomes
- The system is certain about pasture condition
- You should follow it without thinking

Confidence measures the quality of inputs, not the quality of the recommendation itself.`,
    },
    {
      heading: 'What Confidence Does Not Represent',
      content: `Common misinterpretations to avoid:

**Not probability of success:**
An 80% confidence doesn't mean 80% chance of good grazing. It means 80% data quality.

**Not AI certainty:**
The AI doesn't have doubt in the human sense. Confidence reflects data coverage.

**Not recommendation strength:**
A low-confidence recommendation to paddock A isn't weaker than high-confidence to paddock B. They're about data quality, not preference.

**Not a guarantee:**
High confidence with bad underlying conditions still produces bad outcomes.

Think of confidence as "how well-informed is this decision" not "how good is this decision."`,
    },
    {
      heading: 'Score Ranges',
      content: `Confidence scores are normalized to 0-100:

**High confidence (75+):**
- Recent clear satellite observation (< 3 days)
- High cloud-free percentage (> 80%)
- Sufficient historical data
- Multiple indicators align

**Moderate confidence (55-74):**
- Some data gaps or staleness
- Partial cloud coverage
- Limited historical context
- Minor indicator disagreement

**Low confidence (< 55):**
- Stale observations (> 7 days)
- Significant cloud coverage
- Sparse history
- Conflicting signals

The platform displays these ranges with visual indicators (badges, colors) alongside the numeric score.`,
    },
    {
      heading: 'Confidence Normalization',
      content: `The AI often produces confidence as a 0-1 float. The platform normalizes to 0-100:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `const normalizeConfidenceScore = (value: number | undefined): number => {
  // App treats confidence as 0-100 score
  // Agent often produces 0-1 floats; convert when appropriate
  if (value === undefined || !Number.isFinite(value)) return 50
  if (value >= 0 && value <= 1) return Math.round(value * 100)
  return value
}`,
      },
    },
    {
      heading: 'Why Low Confidence Is Still Useful',
      content: `A low-confidence recommendation is better than no recommendation.

**The decision must happen:**
Animals eat daily. Waiting for better data isn't an option.

**Some information beats none:**
Even stale NDVI is more informative than random selection.

**Transparency helps:**
Knowing confidence is low prompts appropriate caution.

**Farmer judgment fills gaps:**
You can apply local knowledge where data is weak.

Low confidence is a signal to apply more judgment, not to ignore the recommendation entirely.`,
    },
    {
      heading: 'How Confidence Should Influence Behavior',
      content: `Use confidence to calibrate your review:

**High confidence (75+):**
- Review can be quicker
- Recommendation likely reflects current conditions
- Override if you have specific contrary information

**Moderate confidence (55-74):**
- Standard review process
- Consider local observations
- Recommendation is reasonable but verify

**Low confidence (< 55):**
- Careful review warranted
- Apply significant local judgment
- Consider ground-truthing before acting

Confidence adjusts the weight you give to the recommendation, not whether you consider it at all.`,
    },
    {
      heading: 'Extraction and Fallback Logic',
      content: `The system handles confidence robustly:

**Extraction:**
If the AI includes confidence in the section justification (malformed output), the system extracts it:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `const extractConfidenceFromJustification = (
  justification: string
): { confidence?: number; justification: string } => {
  // Common failure mode: model appends confidence in unexpected format
  const match = justification.match(
    /<parameter\\s+name=["']confidence["']>\\s*([0-9]*\\.?[0-9]+)/i
  )
  if (!match) {
    return { justification }
  }

  const extracted = Number.parseFloat(match[1] ?? '')
  const cleaned = justification
    .replace(/<\\/sectionJustification>/gi, '')
    .replace(/<parameter\\s+name=["']confidence["'][\\s\\S]*$/i, '')
    .trim()

  return {
    confidence: Number.isFinite(extracted) ? extracted : undefined,
    justification: cleaned,
  }
}`,
      },
    },
    {
      heading: 'Fallback Values',
      content: `**Default confidence: 50**
When confidence cannot be determined, 50 (neutral) is used rather than failing.

**Why 50:**
- Neither high nor low
- Signals uncertainty without alarm
- Prompts moderate review

**When fallback applies:**
- AI didn't provide confidence
- Value extraction failed
- Invalid numeric format

The system always produces a confidence score—it never leaves the field empty.`,
    },
  ],
  relatedArticles: [
    '/docs/daily-operations/recommendations',
    '/docs/core-concepts/partial-data',
    '/docs/daily-operations/ndvi',
  ],
}
