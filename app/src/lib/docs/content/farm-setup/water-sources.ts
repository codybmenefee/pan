import type { ArticleContent } from '../types'

export const waterSources: ArticleContent = {
  title: 'Water Sources',
  description:
    'How the platform models water access. Water as a hard constraint, creating water zones, and how water availability influences grazing recommendations.',
  sections: [
    {
      heading: 'Water as a Hard Constraint',
      content: `Water access is non-negotiable for grazing animals. Unlike forage quality (which can be suboptimal but tolerable), lack of water causes immediate welfare and productivity problems.

The platform treats water as a **hard constraint**:
- Sections should provide reasonable water access
- Paddocks without water access require different management
- Water failure is an operational emergency, not a planning consideration

This constraint influences section placement. When water sources are defined, the AI considers proximity when generating section geometry.`,
    },
    {
      heading: 'Modeling Water Access',
      content: `Water sources are modeled as zones within paddocks:`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `zones: defineTable({
  paddockId: v.id('paddocks'),
  name: v.string(),
  type: v.union(
    v.literal('water'),      // Water troughs, dams, streams
    v.literal('shade'),      // Trees, shelters
    v.literal('feeding'),    // Feeding stations
    v.literal('mineral'),    // Mineral licks
    v.literal('other')       // Catch-all
  ),
  geometry: polygonFeature,  // Location within paddock
  metadata: v.optional(v.any()),
})`,
      },
    },
    {
      heading: 'Water Zone Types',
      content: `**Permanent water**
Reliable year-round: bores, mains-connected troughs, permanent streams.

**Seasonal water**
Available part of the year: seasonal creeks, dams that dry up, springs that reduce in summer.

**Portable water**
Can be moved: mobile troughs, temporary tanks. Not modeled as fixed zones.

**Natural water**
Streams, rivers, ponds. May have access limitations (steep banks, boggy areas).

The platform currently treats all water zones as equivalent—present or absent. Future versions may incorporate reliability and capacity.`,
    },
    {
      heading: 'Impact on Section Recommendations',
      content: `When water zones are defined, the AI considers them during section generation:

**Zone inclusion preference:**
Sections that include or are adjacent to water sources are preferred over sections far from water.

**Access path consideration:**
If water is outside the recommended section, the AI may note this in the justification.

**Practical limits:**
The platform doesn't calculate animal walking distance or grazing time lost to travel. These are operational details the farmer manages.

**Missing water data:**
If no water zones are defined, the AI assumes water access is not a constraint—the farmer has arranged access separately.`,
    },
    {
      heading: 'Seasonal Reliability',
      content: `Water reliability varies by season:

**Wet season:**
- Dams full, streams flowing
- Natural water abundant
- Portable infrastructure less critical

**Dry season:**
- Dams may empty, streams may cease
- Bore/mains water becomes essential
- Paddock rotation may be constrained by water, not forage

**Transition periods:**
- Reliability uncertain
- Monitoring water levels becomes important
- May need to adjust rotation patterns

The platform doesn't automatically adjust for seasons. Farmers should:
- Update water zone status when reliability changes
- Override recommendations that assume unavailable water
- Consider adding seasonal notes to zones`,
    },
    {
      heading: 'Creating Water Zones',
      content: `To add a water zone to a paddock:

**Step 1: Identify the water source type**
- Trough, dam, creek, bore, etc.

**Step 2: Draw the zone boundary**
- For point sources (troughs): small polygon around the fixture
- For linear sources (creeks): polygon along the accessible reach
- For area sources (dams): polygon around the water body

**Step 3: Name and classify**
- Give a descriptive name ("North Trough", "Boundary Creek")
- Set type to 'water'
- Add metadata if relevant (capacity, seasonal notes)

**Step 4: Associate with paddock**
- Link the zone to its parent paddock
- If water serves multiple paddocks, create zones in each

Water zones appear on the map within their paddock boundaries.`,
    },
    {
      heading: 'When Water Constraints Override Forage',
      content: `In extreme cases, water availability trumps forage optimization:

**No water in ready paddock:**
Even if NDVI is excellent and rest days are sufficient, a paddock without functioning water shouldn't receive animals. The farmer should reject such recommendations.

**Water in recovering paddock:**
If the only available water is in a paddock still recovering, the farmer faces a trade-off. The platform doesn't make this decision—it surfaces the information.

**Emergency water failure:**
If water fails mid-rotation, operational response is required. The platform's daily recommendation doesn't handle emergencies.

Water is a fundamental constraint that the platform respects but cannot solve. Infrastructure investment, backup systems, and contingency planning are farmer responsibilities.`,
    },
  ],
  relatedArticles: [
    '/docs/farm-setup/paddocks',
    '/docs/farm-setup/sections',
    '/docs/daily-operations/recommendations',
  ],
}
