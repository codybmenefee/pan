import { mutationGeneric as mutation } from 'convex/server'
import { v } from 'convex/values'

const rawPolygon = v.object({
  type: v.literal('Polygon'),
  coordinates: v.array(v.array(v.array(v.number()))),
})

/**
 * Set the initial animal location during onboarding.
 * This establishes the starting point for grazing plan generation.
 *
 * Creates a grazing event for the selected pasture, and optionally
 * creates a day-0 approved plan with paddock geometry if provided.
 */
export const setInitialAnimalLocation = mutation({
  args: {
    farmExternalId: v.string(),
    pastureExternalId: v.string(),
    sectionGeometry: v.optional(rawPolygon),
    sectionAreaHectares: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use yesterday's date so the user can immediately generate a new plan for today
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const nowStr = now.toISOString()

    // 1. Create grazing event (establishes where animals were yesterday)
    await ctx.db.insert('grazingEvents', {
      farmExternalId: args.farmExternalId,
      paddockExternalId: args.pastureExternalId,
      date: yesterdayStr,
      durationDays: 1,
      notes: 'Initial location set during onboarding',
      createdAt: nowStr,
    })

    // 2. If paddock drawn, create yesterday's approved plan
    if (args.sectionGeometry) {
      await ctx.db.insert('plans', {
        farmExternalId: args.farmExternalId,
        date: yesterdayStr,
        primaryPaddockExternalId: args.pastureExternalId,
        alternativePaddockExternalIds: [],
        confidenceScore: 100,
        reasoning: ['Initial location set by farmer during onboarding'],
        status: 'approved',
        approvedAt: nowStr,
        approvedBy: 'onboarding',
        sectionGeometry: args.sectionGeometry,
        sectionAreaHectares: args.sectionAreaHectares,
        sectionJustification: 'Initial grazing area set by farmer',
        createdAt: nowStr,
        updatedAt: nowStr,
      })
    }

    // Note: Satellite fetch job is triggered earlier in updateFarmBoundary
    // so imagery processing starts as soon as boundary is drawn

    return { success: true, date: yesterdayStr }
  },
})
