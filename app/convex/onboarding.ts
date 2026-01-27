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
 * Creates a grazing event for the selected paddock, and optionally
 * creates a day-0 approved plan with section geometry if provided.
 */
export const setInitialAnimalLocation = mutation({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
    sectionGeometry: v.optional(rawPolygon),
    sectionAreaHectares: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // 1. Create grazing event (establishes current paddock)
    await ctx.db.insert('grazingEvents', {
      farmExternalId: args.farmExternalId,
      paddockExternalId: args.paddockExternalId,
      date: today,
      durationDays: 1,
      notes: 'Initial location set during onboarding',
      createdAt: now,
    })

    // 2. If section drawn, create day-0 approved plan
    if (args.sectionGeometry) {
      await ctx.db.insert('plans', {
        farmExternalId: args.farmExternalId,
        date: today,
        primaryPaddockExternalId: args.paddockExternalId,
        alternativePaddockExternalIds: [],
        confidenceScore: 100,
        reasoning: ['Initial location set by farmer during onboarding'],
        status: 'approved',
        approvedAt: now,
        approvedBy: 'onboarding',
        sectionGeometry: args.sectionGeometry,
        sectionAreaHectares: args.sectionAreaHectares,
        sectionJustification: 'Initial grazing area set by farmer',
        createdAt: now,
        updatedAt: now,
      })
    }

    return { success: true, date: today }
  },
})
