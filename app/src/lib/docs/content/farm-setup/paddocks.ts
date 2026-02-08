import type { ArticleContent } from '../types'

export const paddocks: ArticleContent = {
  title: 'Paddocks',
  description:
    'Understanding AI-generated grazing paddocks. How paddocks are created, overlap prevention, boundary validation, and interpreting paddock recommendations.',
  sections: [
    {
      heading: 'What a Paddock Represents',
      content: `A paddock is a daily grazing allocation—a specific polygon within a pasture where animals should graze today.

**Key characteristics:**

- **Temporary**: Paddocks aren't permanent features. Each day's plan generates a new paddock.
- **AI-generated**: The platform creates paddock geometry based on pasture shape, previous paddocks, and constraints.
- **~20% of pasture area**: Default sizing assumes 4-5 days to graze a pasture completely.
- **Non-overlapping**: Today's paddock shouldn't overlap with recent previous paddocks in the same pasture.

Paddocks translate the abstract "graze this pasture" into concrete "graze this specific area."`,
    },
    {
      heading: 'Paddock Generation Algorithm',
      content: `The AI generates paddocks through a constrained optimization process:

**Inputs:**
- Pasture boundary geometry
- Previous paddocks in this pasture (with dates)
- Target paddock size (default: 20% of pasture area)
- Water zone locations (if defined)

**Constraints:**
- Must be 100% within pasture boundary
- Must not overlap with recent previous paddocks
- Should maintain reasonable aspect ratio
- Should consider water access

**Output:**
- GeoJSON Polygon for the paddock
- Centroid coordinates
- Area in hectares
- Justification text explaining placement`,
    },
    {
      heading: 'Strip Pattern Approach',
      content: `Paddocks typically follow strip patterns—dividing the pasture into roughly equal portions:

**First paddock**: One edge of the pasture, sized to ~20% of total area.

**Second paddock**: Adjacent to first, avoiding overlap.

**Third paddock**: Continues the pattern.

**Subsequent paddocks**: The pattern adapts to pasture shape and remaining ungrazed area.

**Why strips:**
- Simple to execute with portable fencing
- Even distribution across pasture
- Predictable progression for planning
- Works with most pasture shapes

Complex pasture shapes (L-shaped, irregular) may produce non-strip paddocks that better fit the geometry.`,
    },
    {
      heading: 'Overlap Prevention',
      content: `The platform validates that new paddocks don't overlap with recent grazing:`,
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
      content: `Generated paddocks must stay within pasture boundaries:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `// Validate paddock is within pasture
const intersection = intersect(
  featureCollection([paddockFeature, pastureFeature])
)

if (!intersection) {
  throw new Error('Paddock completely outside pasture boundaries')
}

const paddockArea = area(paddockFeature)
const intersectionArea = area(intersection)
const areaRatio = intersectionArea / paddockArea

// If paddock extends outside, clip to pasture boundary
if (areaRatio < 0.99) {
  // Use intersection as the clipped geometry
  finalPaddockGeometry = intersection.geometry
  console.log(\`Clipped paddock: \${Math.round(areaRatio * 100)}% within pasture\`)
}`,
      },
    },
    {
      heading: 'Why Auto-Clipping Exists',
      content: `The AI generates paddock coordinates based on pasture geometry, but imprecision can occur:

**Sources of imprecision:**
- LLM coordinate generation isn't pixel-perfect
- Floating point arithmetic accumulates errors
- Complex pasture shapes are harder to subdivide precisely

**Auto-clipping solution:**
Rather than rejecting slightly imprecise paddocks, the platform clips them to pasture boundaries automatically. A paddock that's 97% within the pasture becomes a valid paddock after clipping.

This approach:
- Tolerates reasonable AI imprecision
- Ensures no paddock extends outside pasture
- Preserves paddock intent while fixing geometry

**Limits:**
Paddocks completely outside or mostly outside pastures are rejected. Auto-clipping handles minor boundary overlap, not fundamentally wrong placements.`,
    },
    {
      heading: 'Paddock Justification',
      content: `Each paddock includes justification text explaining the recommendation:

**Content includes:**
- Why this area was selected
- NDVI conditions in the paddock
- Position relative to previous paddocks
- Any warnings or considerations

**Example justification:**

*"This paddock covers the northeast portion of Pasture 3, avoiding the western strip grazed on January 20. NDVI values in this area range 0.42-0.48, indicating good forage quality. The paddock provides direct access to the trough on the eastern boundary. Consider monitoring grazing duration as this area typically drains faster than the pasture average."*

Justifications help farmers evaluate whether the recommendation makes sense given local knowledge.`,
    },
    {
      heading: 'Paddock Visualization',
      content: `On the map, paddocks appear as:

**Current recommended paddock**: Highlighted polygon, distinct color from pasture boundary.

**Previous paddocks in same pasture**: Faded polygons showing historical grazing pattern.

**Paddock centroid**: Point marker indicating approximate center.

This visualization helps farmers:
- See exactly where animals should graze
- Understand the rotation pattern within the pasture
- Identify if the recommendation conflicts with known conditions

Paddocks can be modified before approval if the farmer sees a reason to adjust the AI's recommendation.`,
    },
  ],
  relatedArticles: [
    '/docs/farm-setup/pastures',
    '/docs/daily-operations/recommendations',
    '/docs/farm-setup/modeling-philosophy',
  ],
}
