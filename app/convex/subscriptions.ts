import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Subscription tier configuration
const TIER_CONFIG = {
  free: {
    acreageLimit: 5,
    rawImageryEnabled: false,
    premiumProvidersEnabled: false,
    retentionDays: 365, // 1 year for index data
  },
  starter: {
    acreageLimit: 25,
    rawImageryEnabled: true,
    premiumProvidersEnabled: false,
    retentionDays: 365, // 1 year for raw imagery
  },
  professional: {
    acreageLimit: 100,
    rawImageryEnabled: true,
    premiumProvidersEnabled: true,
    retentionDays: 1095, // 3 years
  },
  enterprise: {
    acreageLimit: Infinity,
    rawImageryEnabled: true,
    premiumProvidersEnabled: true,
    retentionDays: -1, // Unlimited
  },
} as const

type SubscriptionTier = keyof typeof TIER_CONFIG

/**
 * Get subscription for a farm by external ID (Clerk org ID or legacy farm ID).
 */
export const getSubscription = query({
  args: {
    farmId: v.string(), // External ID (Clerk org ID or legacy farm-1 style)
  },
  handler: async (ctx, args) => {
    // Look up farm by external ID
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmId))
      .first()

    // If not found by externalId, try legacyExternalId
    const farmDoc = farm ?? await ctx.db
      .query('farms')
      .withIndex('by_legacyExternalId', (q) => q.eq('legacyExternalId', args.farmId))
      .first()

    if (!farmDoc) {
      // Return default free tier if farm not found
      return {
        tier: 'free' as const,
        status: 'active' as const,
        acreageLimit: TIER_CONFIG.free.acreageLimit,
        rawImageryEnabled: TIER_CONFIG.free.rawImageryEnabled,
        premiumProvidersEnabled: TIER_CONFIG.free.premiumProvidersEnabled,
        retentionDays: TIER_CONFIG.free.retentionDays,
        isDefaultFree: true,
      }
    }

    // Demo farms get professional tier access for full feature showcase
    if (farmDoc.isDemoFarm) {
      return {
        tier: 'professional' as const,
        status: 'active' as const,
        acreageLimit: TIER_CONFIG.professional.acreageLimit,
        rawImageryEnabled: true,
        premiumProvidersEnabled: true,
        retentionDays: TIER_CONFIG.professional.retentionDays,
        isDefaultFree: false,
        isDemoMode: true,
      }
    }

    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_farm', (q) => q.eq('farmId', farmDoc._id))
      .first()

    if (!subscription) {
      // Return default free tier
      return {
        tier: 'free' as const,
        status: 'active' as const,
        acreageLimit: TIER_CONFIG.free.acreageLimit,
        rawImageryEnabled: TIER_CONFIG.free.rawImageryEnabled,
        premiumProvidersEnabled: TIER_CONFIG.free.premiumProvidersEnabled,
        retentionDays: TIER_CONFIG.free.retentionDays,
        isDefaultFree: true,
      }
    }

    return {
      ...subscription,
      isDefaultFree: false,
    }
  },
})

/**
 * Check if a farm has access to a specific feature.
 */
export const hasFeature = query({
  args: {
    farmId: v.id('farms'),
    feature: v.union(
      v.literal('raw_imagery'),
      v.literal('premium_providers'),
      v.literal('historical_satellite'),
      v.literal('ndvi_heatmap')
    ),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_farm', (q) => q.eq('farmId', args.farmId))
      .first()

    const tier = (subscription?.tier ?? 'free') as SubscriptionTier
    const status = subscription?.status ?? 'active'

    // Inactive subscriptions lose premium features
    if (status !== 'active' && tier !== 'free') {
      return false
    }

    // Feature mapping
    switch (args.feature) {
      case 'raw_imagery':
        return TIER_CONFIG[tier].rawImageryEnabled

      case 'premium_providers':
        return TIER_CONFIG[tier].premiumProvidersEnabled

      case 'historical_satellite':
        // Available to all tiers, but data depth varies
        return true

      case 'ndvi_heatmap':
        // Available to all tiers
        return true

      default:
        return false
    }
  },
})

/**
 * Get tier limits for a farm.
 */
export const getTierLimits = query({
  args: {
    farmId: v.id('farms'),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_farm', (q) => q.eq('farmId', args.farmId))
      .first()

    const tier = (subscription?.tier ?? 'free') as SubscriptionTier
    return TIER_CONFIG[tier]
  },
})

/**
 * Sync subscription data from Clerk webhook.
 */
export const syncFromClerk = mutation({
  args: {
    farmId: v.id('farms'),
    clerkSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    tier: v.union(
      v.literal('free'),
      v.literal('starter'),
      v.literal('professional'),
      v.literal('enterprise')
    ),
    status: v.union(
      v.literal('active'),
      v.literal('past_due'),
      v.literal('canceled')
    ),
    currentPeriodEnd: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_farm', (q) => q.eq('farmId', args.farmId))
      .first()

    const tierConfig = TIER_CONFIG[args.tier as SubscriptionTier]

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        clerkSubscriptionId: args.clerkSubscriptionId,
        stripeCustomerId: args.stripeCustomerId,
        tier: args.tier,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        acreageLimit: tierConfig.acreageLimit,
        rawImageryEnabled: tierConfig.rawImageryEnabled,
        premiumProvidersEnabled: tierConfig.premiumProvidersEnabled,
        retentionDays: tierConfig.retentionDays,
        updatedAt: new Date().toISOString(),
      })
      return existing._id
    }

    // Create new subscription
    return await ctx.db.insert('subscriptions', {
      farmId: args.farmId,
      clerkSubscriptionId: args.clerkSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      tier: args.tier,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      acreageLimit: tierConfig.acreageLimit,
      rawImageryEnabled: tierConfig.rawImageryEnabled,
      premiumProvidersEnabled: tierConfig.premiumProvidersEnabled,
      retentionDays: tierConfig.retentionDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  },
})

/**
 * Cancel a subscription (mark as canceled).
 */
export const cancelSubscription = mutation({
  args: {
    farmId: v.id('farms'),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_farm', (q) => q.eq('farmId', args.farmId))
      .first()

    if (!subscription) {
      throw new Error('No subscription found for farm')
    }

    await ctx.db.patch(subscription._id, {
      status: 'canceled',
      updatedAt: new Date().toISOString(),
    })

    return subscription._id
  },
})

/**
 * Get all subscriptions (admin use).
 */
export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query('subscriptions').collect()
  },
})
