import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'

/**
 * Internal function to get a farm by Clerk organization ID.
 * Used by webhook handlers.
 */
export const getFarmByClerkOrgId = internalMutation({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    // First try to find by externalId (which should be the Clerk org ID for new farms)
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.clerkOrgId))
      .first()

    if (farm) {
      return farm
    }

    // Fallback: Try legacy external ID mapping
    farm = await ctx.db
      .query('farms')
      .withIndex('by_legacyExternalId', (q) =>
        q.eq('legacyExternalId', args.clerkOrgId)
      )
      .first()

    return farm
  },
})

/**
 * Internal function to list all farms with their settings and subscriptions.
 * Used by the satellite pipeline scheduler.
 */
export const listAllFarmsWithSettings = internalQuery({
  handler: async (ctx) => {
    const farms = await ctx.db.query('farms').collect()

    const farmsWithData = await Promise.all(
      farms.map(async (farm) => {
        // Get settings
        const settings = await ctx.db
          .query('farmSettings')
          .withIndex('by_farm', (q) => q.eq('farmExternalId', farm.externalId))
          .first()

        // Get subscription
        const subscription = await ctx.db
          .query('subscriptions')
          .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
          .first()

        // Get pastures
        const pastures = await ctx.db
          .query('paddocks')
          .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
          .collect()

        return {
          ...farm,
          settings,
          subscription,
          pastures,
        }
      })
    )

    return farmsWithData
  },
})

/**
 * Internal function to get the latest observation date for a farm.
 * Used by the satellite pipeline to determine if updates are needed.
 */
export const getLatestObservationDate = internalQuery({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const observation = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .order('desc')
      .first()

    return observation?.date ?? null
  },
})
