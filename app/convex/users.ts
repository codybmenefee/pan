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

/**
 * Get user subscription status for paywall checks.
 * Returns subscription info for the Early Access paywall.
 */
export const getUserSubscription = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.externalId))
      .first()

    if (!user) {
      return {
        hasAccess: false,
        status: 'none' as const,
        isNewUser: true,
      }
    }

    const status = user.subscriptionStatus ?? 'none'
    const hasAccess = status === 'active'

    return {
      hasAccess,
      status,
      isNewUser: false,
      planId: user.subscriptionPlanId,
      subscriptionId: user.subscriptionId,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
    }
  },
})

/**
 * Sync user subscription from Clerk billing webhook.
 * Called when user subscribes, updates payment, or cancels.
 */
export const syncUserSubscription = mutation({
  args: {
    userExternalId: v.string(),
    subscriptionId: v.string(),
    planId: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('past_due'),
      v.literal('canceled')
    ),
    currentPeriodEnd: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.userExternalId))
      .first()

    if (!user) {
      // User doesn't exist yet - they might be subscribing before first app load
      // Create a minimal user record
      await ctx.db.insert('users', {
        externalId: args.userExternalId,
        farmExternalId: '', // Will be set during onboarding
        subscriptionStatus: args.status,
        subscriptionId: args.subscriptionId,
        subscriptionPlanId: args.planId,
        subscriptionCurrentPeriodEnd: args.currentPeriodEnd,
        createdAt: now,
        updatedAt: now,
      })
      return { success: true, created: true }
    }

    await ctx.db.patch(user._id, {
      subscriptionStatus: args.status,
      subscriptionId: args.subscriptionId,
      subscriptionPlanId: args.planId,
      subscriptionCurrentPeriodEnd: args.currentPeriodEnd,
      updatedAt: now,
    })

    return { success: true, created: false }
  },
})

/**
 * Cancel user subscription (mark as canceled).
 */
export const cancelUserSubscription = mutation({
  args: {
    userExternalId: v.string(),
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
      subscriptionStatus: 'canceled',
      updatedAt: now,
    })

    return { success: true }
  },
})
