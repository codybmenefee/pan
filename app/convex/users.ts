import { queryGeneric as query, mutationGeneric as mutation } from 'convex/server'
import { v } from 'convex/values'

export const getUserByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.externalId))
      .first()
  },
})

/**
 * Update user's active farm preference.
 * Used when switching between farms via the FarmSelector.
 */
export const setActiveFarm = mutation({
  args: {
    userExternalId: v.string(),
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.userExternalId))
      .first()

    if (!user) {
      throw new Error(`User not found: ${args.userExternalId}`)
    }

    await ctx.db.patch(user._id, {
      activeFarmExternalId: args.farmExternalId,
      updatedAt: now,
    })

    return { success: true }
  },
})
