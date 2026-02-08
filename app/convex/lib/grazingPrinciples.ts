/**
 * Grazing Principles - Natural language guidance for the autonomous grazing agent
 *
 * This module provides:
 * - GrazingPrinciples interface for farmer preferences
 * - Natural language prompt generation for the agent's system prompt
 * - The agent makes all decisions autonomously - no coded evaluation logic
 */

export interface GrazingPrinciples {
  // Section timing
  minDaysPerSection: number
  maxDaysPerSection: number

  // Vegetation quality
  minNdviThreshold: number
  preferHighNdviAreas: boolean

  // Section placement
  requireAdjacentSections: boolean
  allowSectionOverlapPct: number

  // Progression
  defaultStartingCorner: 'NW' | 'NE' | 'SW' | 'SE'
  defaultDirection: 'horizontal' | 'vertical'
}

/**
 * Global default grazing principles
 */
export const DEFAULT_GRAZING_PRINCIPLES: GrazingPrinciples = {
  minDaysPerSection: 1,
  maxDaysPerSection: 7,
  minNdviThreshold: 0.35,
  preferHighNdviAreas: true,
  requireAdjacentSections: true,
  allowSectionOverlapPct: 5,
  defaultStartingCorner: 'NW',
  defaultDirection: 'horizontal',
}

/**
 * Merge farm-specific overrides with global defaults
 */
export function mergeGrazingPrinciples(
  overrides?: Partial<GrazingPrinciples>
): GrazingPrinciples {
  if (!overrides) {
    return { ...DEFAULT_GRAZING_PRINCIPLES }
  }

  return {
    minDaysPerSection: overrides.minDaysPerSection ?? DEFAULT_GRAZING_PRINCIPLES.minDaysPerSection,
    maxDaysPerSection: overrides.maxDaysPerSection ?? DEFAULT_GRAZING_PRINCIPLES.maxDaysPerSection,
    minNdviThreshold: overrides.minNdviThreshold ?? DEFAULT_GRAZING_PRINCIPLES.minNdviThreshold,
    preferHighNdviAreas: overrides.preferHighNdviAreas ?? DEFAULT_GRAZING_PRINCIPLES.preferHighNdviAreas,
    requireAdjacentSections: overrides.requireAdjacentSections ?? DEFAULT_GRAZING_PRINCIPLES.requireAdjacentSections,
    allowSectionOverlapPct: overrides.allowSectionOverlapPct ?? DEFAULT_GRAZING_PRINCIPLES.allowSectionOverlapPct,
    defaultStartingCorner: overrides.defaultStartingCorner ?? DEFAULT_GRAZING_PRINCIPLES.defaultStartingCorner,
    defaultDirection: overrides.defaultDirection ?? DEFAULT_GRAZING_PRINCIPLES.defaultDirection,
  }
}

/**
 * Generate the detailed grazing principles for the agent's system prompt.
 * These are natural language instructions that guide the agent's autonomous decisions.
 */
export function generateGrazingPrinciplesPrompt(
  principles: GrazingPrinciples,
  customRules?: string[]
): string {
  const customRulesSection = customRules && customRules.length > 0
    ? `
### Custom Farm Rules
${customRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}
`
    : ''

  return `## GRAZING SECTION DRAWING PRINCIPLES

You are drawing grazing sections for rotational grazing. Think like an experienced farmer
setting up temporary electric fencing.

### SHAPE PRINCIPLES

**Comfortable Movement**: Animals need room to spread out and move freely while
grazing. Avoid any section where animals would be forced into a narrow corridor.
- Good: Roughly square, wide rectangle, or natural paddock-hugging shapes
- Bad: Skinny lanes, long narrow strips, L-shapes with tight corners

**Practical Fencing**: Imagine setting up temporary electric fencing. Straight
lines are easier than complex curves. 4-6 corner posts are typical.
- Prefer rectangular or trapezoidal shapes
- Curves are fine when following paddock boundary
- Avoid unnecessarily complex geometry (keep to 8 vertices or fewer)

### PROGRESSION PRINCIPLES

**Start in a Corner**: Begin grazing in the ${principles.defaultStartingCorner} corner of the paddock.
This gives animals a defined space with two natural boundaries.

**Work Outward Systematically**: Progress through the paddock in a ${principles.defaultDirection} pattern.
Each new section should share an edge with previously grazed area OR the paddock boundary.
- Don't leave ungrazed "islands" surrounded by grazed sections
- Don't jump to disconnected areas
- ${principles.requireAdjacentSections ? 'New sections MUST be adjacent to previous sections or paddock boundary' : 'Sections do not need to be strictly adjacent'}

**Edge Awareness**: When a section is near a paddock boundary, extend it all the
way to that boundary. Don't leave thin ungrazed strips along edges.

### TIMING PRINCIPLES

**Minimum Stay**: Animals should stay in a section for at least ${principles.minDaysPerSection} day(s)
to efficiently utilize the forage.

**Maximum Stay**: Don't exceed ${principles.maxDaysPerSection} days in one section. Overgrazing
damages pasture recovery.

**Move When Forage Depletes**: Even if minimum days not reached, move animals if:
- Estimated forage remaining drops below 20%
- Animals show signs of searching for food
- Section NDVI drops significantly

### VEGETATION QUALITY

**Target Good Pasture**: ${principles.preferHighNdviAreas ? 'Prefer sections with NDVI >= ' + principles.minNdviThreshold + ' (green, healthy vegetation)' : 'NDVI preference is disabled'}
${principles.preferHighNdviAreas ? '- Green areas on the NDVI map indicate good forage\n- Yellow/red areas may have less vegetation - graze carefully' : ''}

**Size Targeting**: Aim for the target section size provided, but prioritize good
shape over exact size. +/-30% from target is acceptable if it produces a
better-shaped section.

### OVERLAP RULES

**Allowed Overlap**: Up to ${principles.allowSectionOverlapPct}% overlap with previous sections is
acceptable to account for coordinate precision.

**Major Overlap Forbidden**: >20% overlap with already-grazed sections is not allowed.
The same grass cannot be grazed twice in one rotation.

### DAILY DECISIONS

When making daily recommendations, consider:

**STAY in current section when:**
- Animals have been in section fewer than ${principles.minDaysPerSection} day(s)
- Estimated forage remaining is above 40%
- Section NDVI is still healthy

**MOVE to next section when:**
- Animals have been in section for estimated days AND forage is depleting
- Forage remaining drops below 30%
- Section NDVI has dropped significantly
- Maximum ${principles.maxDaysPerSection} days reached

### FORECAST DEVIATION

When reviewing a forecast, you may adjust sections based on:
- Vegetation conditions (NDVI showing better/worse areas)
- Weather impacts
- Livestock behavior patterns
- Water trough accessibility

Deviation should be intentional and reasoned, not arbitrary. Always explain
why you're modifying the forecast.
${customRulesSection}`
}

/**
 * Generate context about the current grazing situation for the agent
 */
export interface GrazingContext {
  paddockName: string
  paddockAreaHa: number
  targetSectionHa: number
  targetSectionPct: number
  startingCorner: 'NW' | 'NE' | 'SW' | 'SE'
  totalAU: number
  daysInCurrentSection?: number
  estimatedForageRemainingPct?: number
  currentNdvi?: number
  grazedSectionsCount: number
  ungrazedPct: number
  ungrazedLocation?: string
}

export function generateGrazingContextPrompt(context: GrazingContext): string {
  return `## CURRENT GRAZING CONTEXT

**Paddock**: ${context.paddockName}
- Total area: ${context.paddockAreaHa} ha
- Ungrazed: ${context.ungrazedPct}%${context.ungrazedLocation ? ` (approximately ${context.ungrazedLocation})` : ''}
- Sections grazed: ${context.grazedSectionsCount}

**Livestock**: ${context.totalAU} Animal Units (AU)

**Target Section Size**: ${context.targetSectionHa} ha (${context.targetSectionPct}% of paddock)

**Starting Corner**: ${context.startingCorner}

${context.daysInCurrentSection !== undefined ? `**Current Section Status**:
- Days in section: ${context.daysInCurrentSection}
- Estimated forage remaining: ${context.estimatedForageRemainingPct ?? 'unknown'}%
- Current NDVI: ${context.currentNdvi?.toFixed(2) ?? 'unknown'}` : ''}`
}
