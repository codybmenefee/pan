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
 * Create a new user record (for Clerk-authenticated users).
 * Does not seed any demo data - farms come from Clerk organizations.
 */
export const createUser = mutation({
  args: {
    externalId: v.string(),
    farmExternalId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.externalId))
      .first()

    if (existingUser) {
      return { userId: existingUser._id, created: false }
    }

    const userId = await ctx.db.insert('users', {
      externalId: args.externalId,
      farmExternalId: args.farmExternalId,
      activeFarmExternalId: args.farmExternalId,
      name: args.name,
      email: args.email,
      createdAt: now,
      updatedAt: now,
    })

    return { userId, created: true }
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
