import type { ArticleContent } from '../types'

export const sections: ArticleContent = {
  title: 'Sections',
  description:
    'Understanding AI-generated grazing sections. How sections are created, overlap prevention, boundary validation, and interpreting section recommendations.',
  sections: [
    {
      heading: 'What a Section Represents',
      content: `A section is a daily grazing allocation—a specific polygon within a paddock where animals should graze today.

**Key characteristics:**

- **Temporary**: Sections aren't permanent features. Each day's plan generates a new section.
- **AI-generated**: The platform creates section geometry based on paddock shape, previous sections, and constraints.
- **~20% of paddock area**: Default sizing assumes 4-5 days to graze a paddock completely.
- **Non-overlapping**: Today's section shouldn't overlap with recent previous sections in the same paddock.

Sections translate the abstract "graze this paddock" into concrete "graze this specific area."`,
    },
    {
      heading: 'Section Generation Algorithm',
      content: `The AI generates sections through a constrained optimization process:

**Inputs:**
- Paddock boundary geometry
- Previous sections in this paddock (with dates)
- Target section size (default: 20% of paddock area)
- Water zone locations (if defined)

**Constraints:**
- Must be 100% within paddock boundary
- Must not overlap with recent previous sections
- Should maintain reasonable aspect ratio
- Should consider water access

**Output:**
- GeoJSON Polygon for the section
- Centroid coordinates
- Area in hectares
- Justification text explaining placement`,
    },
    {
      heading: 'Strip Pattern Approach',
      content: `Sections typically follow strip patterns—dividing the paddock into roughly equal portions:

**First section**: One edge of the paddock, sized to ~20% of total area.

**Second section**: Adjacent to first, avoiding overlap.

**Third section**: Continues the pattern.

**Subsequent sections**: The pattern adapts to paddock shape and remaining ungrazed area.

**Why strips:**
- Simple to execute with portable fencing
- Even distribution across paddock
- Predictable progression for planning
- Works with most paddock shapes

Complex paddock shapes (L-shaped, irregular) may produce non-strip sections that better fit the geometry.`,
    },
    {
      heading: 'Overlap Prevention',
      content: `The platform validates that new sections don't overlap with recent grazing:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `// Check for overlap with previous sections
for (const prevSection of previousSections) {
  const overlap = intersect(featureCollection([currentFeature, prevFeature]))
  if (overlap) {
    const overlapArea = area(overlap as Feature<Polygon>)
    const currentArea = area(currentFeature)
    const overlapPercent = (overlapArea / currentArea) * 100

    // Allow very small overlaps due to floating point precision (< 1%)
    if (overlapPercent >= 1) {
      // Subtract overlap from current section
      const differenceResult = difference(
        featureCollection([currentFeature, prevFeature])
      )
      // Use adjusted geometry...
    }
  }
}`,
      },
    },
    {
      heading: 'Boundary Validation and Auto-Clipping',
      content: `Generated sections must stay within paddock boundaries:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `// Validate section is within paddock
const intersection = intersect(
  featureCollection([sectionFeature, paddockFeature])
)

if (!intersection) {
  throw new Error('Section completely outside paddock boundaries')
}

const sectionArea = area(sectionFeature)
const intersectionArea = area(intersection)
const areaRatio = intersectionArea / sectionArea

// If section extends outside, clip to paddock boundary
if (areaRatio < 0.99) {
  // Use intersection as the clipped geometry
  finalSectionGeometry = intersection.geometry
  console.log(\`Clipped section: \${Math.round(areaRatio * 100)}% within paddock\`)
}`,
      },
    },
    {
      heading: 'Why Auto-Clipping Exists',
      content: `The AI generates section coordinates based on paddock geometry, but imprecision can occur:

**Sources of imprecision:**
- LLM coordinate generation isn't pixel-perfect
- Floating point arithmetic accumulates errors
- Complex paddock shapes are harder to subdivide precisely

**Auto-clipping solution:**
Rather than rejecting slightly imprecise sections, the platform clips them to paddock boundaries automatically. A section that's 97% within the paddock becomes a valid section after clipping.

This approach:
- Tolerates reasonable AI imprecision
- Ensures no section extends outside paddock
- Preserves section intent while fixing geometry

**Limits:**
Sections completely outside or mostly outside paddocks are rejected. Auto-clipping handles minor boundary overlap, not fundamentally wrong placements.`,
    },
    {
      heading: 'Section Justification',
      content: `Each section includes justification text explaining the recommendation:

**Content includes:**
- Why this area was selected
- NDVI conditions in the section
- Position relative to previous sections
- Any warnings or considerations

**Example justification:**

*"This section covers the northeast portion of Paddock 3, avoiding the western strip grazed on January 20. NDVI values in this area range 0.42-0.48, indicating good forage quality. The section provides direct access to the trough on the eastern boundary. Consider monitoring grazing duration as this area typically drains faster than the paddock average."*

Justifications help farmers evaluate whether the recommendation makes sense given local knowledge.`,
    },
    {
      heading: 'Section Visualization',
      content: `On the map, sections appear as:

**Current recommended section**: Highlighted polygon, distinct color from paddock boundary.

**Previous sections in same paddock**: Faded polygons showing historical grazing pattern.

**Section centroid**: Point marker indicating approximate center.

This visualization helps farmers:
- See exactly where animals should graze
- Understand the rotation pattern within the paddock
- Identify if the recommendation conflicts with known conditions

Sections can be modified before approval if the farmer sees a reason to adjust the AI's recommendation.`,
    },
  ],
  relatedArticles: [
    '/docs/farm-setup/paddocks',
    '/docs/daily-operations/recommendations',
    '/docs/farm-setup/modeling-philosophy',
  ],
}
