import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Feature } from '../featureFlags'
import { FEATURES, tierHasFeature } from '../featureFlags'

export type SubscriptionTier = 'free' | 'homesteader' | 'producer' | 'commercial'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled'

export interface Subscription {
  tier: SubscriptionTier
  status: SubscriptionStatus
  acreageLimit: number
  rawImageryEnabled: boolean
  premiumProvidersEnabled: boolean
  retentionDays: number
  currentPeriodEnd?: string
  isDefaultFree: boolean
}

export interface UseSubscriptionResult {
  subscription: Subscription | null
  isLoading: boolean
  tier: SubscriptionTier
  isActive: boolean
  hasFeature: (feature: Feature) => boolean
  canAccessRawImagery: boolean
  canAccessPremiumProviders: boolean
  acreageLimit: number
  retentionDays: number
}

/**
 * Hook to access subscription data and feature flags for a farm.
 *
 * @param farmId - External farm ID (Clerk org ID or legacy farm-1 style)
 * @returns Subscription data and helper functions
 */
export function useSubscription(
  farmId: string | undefined
): UseSubscriptionResult {
  const subscription = useQuery(
    api.subscriptions.getSubscription,
    farmId ? { farmId } : 'skip'
  )

  const isLoading = subscription === undefined

  // Default to free tier if no subscription
  const tier: SubscriptionTier = (subscription?.tier as SubscriptionTier) ?? 'free'
  const status: SubscriptionStatus =
    (subscription?.status as SubscriptionStatus) ?? 'active'
  const isActive = status === 'active'

  const hasFeature = (feature: Feature): boolean => {
    if (!isActive && tier !== 'free') {
      // Inactive paid subscriptions lose features
      return tierHasFeature('free', feature)
    }
    return tierHasFeature(tier, feature)
  }

  return {
    subscription: subscription
      ? {
          tier,
          status,
          acreageLimit: subscription.acreageLimit,
          rawImageryEnabled: subscription.rawImageryEnabled,
          premiumProvidersEnabled: subscription.premiumProvidersEnabled,
          retentionDays: subscription.retentionDays,
          currentPeriodEnd: 'currentPeriodEnd' in subscription ? subscription.currentPeriodEnd : undefined,
          isDefaultFree: subscription.isDefaultFree,
        }
      : null,
    isLoading,
    tier,
    isActive,
    hasFeature,
    canAccessRawImagery: hasFeature(FEATURES.RAW_IMAGERY),
    canAccessPremiumProviders: hasFeature(FEATURES.PREMIUM_PROVIDERS),
    acreageLimit: subscription?.acreageLimit ?? 5,
    retentionDays: subscription?.retentionDays ?? 365,
  }
}

/**
 * Hook to check a single feature flag.
 *
 * @param farmId - External farm ID (Clerk org ID or legacy farm-1 style)
 * @param feature - Feature to check
 * @returns Whether the farm has access to the feature
 */
export function useFeatureFlag(
  farmId: string | undefined,
  feature: Feature
): { hasAccess: boolean; isLoading: boolean; minimumTier: string } {
  const { hasFeature, isLoading } = useSubscription(farmId)

  // Get minimum tier for this feature
  const minimumTier =
    Object.entries({
      free: ['historical_satellite', 'ndvi_heatmap'],
      homesteader: ['raw_imagery', 'evi_index', 'ndwi_index', 'export_data'],
      producer: ['premium_providers', 'api_access'],
    }).find(([_, features]) => features.includes(feature))?.[0] ?? 'producer'

  return {
    hasAccess: hasFeature(feature),
    isLoading,
    minimumTier,
  }
}
