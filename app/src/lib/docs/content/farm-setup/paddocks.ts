import type { ArticleContent } from '../types'

export const paddocks: ArticleContent = {
  title: 'Paddocks',
  description:
    'How the platform represents and tracks paddocks. Key attributes, status calculation logic, threshold overrides, and managing paddock boundaries.',
  sections: [
    {
      heading: 'What a Paddock Represents',
      content: `A paddock is the fundamental management unit in the platform:

**Physical definition:**
A discrete area where livestock can be contained—typically bounded by fencing, natural barriers, or infrastructure.

**Management definition:**
The smallest unit you'd consider for a grazing decision. You move animals "to a paddock" not "to a corner of land."

**Platform definition:**
A database record with geometry, observations, status, and history. The unit against which NDVI is calculated and recommendations are made.

Paddocks can vary in size from a few hectares to hundreds. The platform treats them equivalently—section sizing scales to paddock area.`,
    },
    {
      heading: 'Key Attributes',
      content: `Each paddock record contains:`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `paddocks: defineTable({
  farmId: v.id('farms'),
  externalId: v.string(),        // Your identifier (e.g., "North-7")
  name: v.string(),              // Display name
  status: paddockStatus,         // ready | almost_ready | recovering | grazed
  ndvi: v.number(),              // Current NDVI reading
  restDays: v.number(),          // Days since last grazing
  area: v.number(),              // Hectares
  waterAccess: v.string(),       // Description of water availability
  lastGrazed: v.string(),        // ISO date of most recent grazing
  geometry: polygonFeature,      // GeoJSON boundary
  overrideMinNDVIThreshold: v.optional(v.number()),
  overrideMinRestPeriodDays: v.optional(v.number()),
  createdAt: v.string(),
  updatedAt: v.string(),
})`,
      },
    },
    {
      heading: 'Status Calculation Logic',
      content: `Paddock status is computed from NDVI and rest days:`,
      codeExample: {
        language: 'typescript',
        filename: 'grazingAgentTools.ts',
        code: `// Status determination logic
const ndviMean = latestObservation?.ndviMean ?? paddock.ndvi ?? 0

let status = 'recovering'
if (ndviMean >= 0.4 && restDays >= 21) {
  status = 'ready'        // Green: meets both thresholds
} else if (ndviMean >= 0.4 && restDays >= 14) {
  status = 'almost_ready' // Yellow: NDVI good, rest approaching
} else if (restDays < 7) {
  status = 'grazed'       // Gray: recently grazed
}
// else: status remains 'recovering' (Orange)`,
      },
    },
    {
      heading: 'Status Definitions',
      content: `**ready (Green)**
NDVI meets or exceeds threshold AND rest days meet or exceed minimum. This paddock is a candidate for grazing.

**almost_ready (Yellow)**
NDVI meets threshold but rest days are between 14-21. Approaching readiness—don't graze yet unless necessary.

**recovering (Orange)**
Either NDVI below threshold OR rest days below 14. Needs more time. The platform will avoid recommending this paddock unless no alternatives exist.

**grazed (Gray)**
Less than 7 days since last grazing event. Too recent to consider regardless of NDVI readings.

Status colors appear on the map and in paddock lists, providing at-a-glance understanding of farm condition.`,
    },
    {
      heading: 'Per-Paddock Threshold Overrides',
      content: `Default thresholds apply farm-wide, but individual paddocks can override:

**When to use overrides:**

*Irrigated paddocks* - May have higher NDVI baseline and faster recovery. Override: lower rest period requirement.

*Native pasture* - May have naturally lower NDVI. Override: lower NDVI threshold.

*Challenging terrain* - May need longer recovery. Override: higher rest period requirement.

*High-productivity improved pasture* - May saturate NDVI quickly. Override: higher NDVI threshold.

**Setting overrides:**
Overrides are stored per-paddock and applied when computing status:`,
      codeExample: {
        language: 'typescript',
        code: `// Override fields in paddock schema
overrideMinNDVIThreshold: v.optional(v.number()),
overrideMinRestPeriodDays: v.optional(v.number()),

// When computing status, check for paddock-level override
const threshold = paddock.overrideMinNDVIThreshold
  ?? farmSettings.minNDVIThreshold
  ?? 0.40`,
      },
    },
    {
      heading: 'Paddock Geometry',
      content: `Boundaries are stored as GeoJSON Features with Polygon geometry:`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `const polygonFeature = v.object({
  type: v.literal('Feature'),
  properties: v.optional(v.any()),
  geometry: v.object({
    type: v.literal('Polygon'),
    coordinates: v.array(v.array(v.array(v.number()))),
  }),
})`,
      },
    },
    {
      heading: 'Geometry Requirements',
      content: `**Coordinate format:**
Coordinates are [longitude, latitude] pairs (GeoJSON standard). The outer ring defines the paddock boundary; inner rings can define exclusions (though rarely used).

**Precision:**
GPS-quality precision (6 decimal places) is sufficient. Survey-grade precision isn't required.

**Validation:**
- Polygons must be closed (first and last coordinates match)
- Coordinates must form a valid polygon (no self-intersection)
- Area must be computable

**Practical tips:**
- Draw boundaries slightly inside fence lines to ensure all pixels fall within
- Exclude non-grazeable areas (yards, buildings) if they're significant
- Simpler boundaries (fewer vertices) process faster`,
    },
    {
      heading: 'Creating and Editing Boundaries',
      content: `Paddock boundaries can be created through:

**Import**
GeoJSON files from GIS software, existing farm maps, or property boundary data.

**Manual Drawing**
Use the map interface to draw boundaries by clicking vertices.

**GPS Track**
Walk or drive the boundary while recording GPS track, then import.

**Editing**
Existing boundaries can be adjusted by moving vertices. Changes take effect immediately for subsequent recommendations.

When boundaries change:
- Historical observations remain associated with old geometry
- New observations use new geometry
- Status recalculates with current boundary`,
    },
  ],
  relatedArticles: [
    '/docs/farm-setup/modeling-philosophy',
    '/docs/farm-setup/sections',
    '/docs/daily-operations/ndvi',
  ],
}
