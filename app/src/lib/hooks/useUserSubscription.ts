import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export type UserSubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled'

export interface UserSubscription {
  hasAccess: boolean
  status: UserSubscriptionStatus
  isNewUser: boolean
  planId?: string
  subscriptionId?: string
  currentPeriodEnd?: string
  agentDashboardEnabled?: boolean
}

export interface UseUserSubscriptionResult {
  subscription: UserSubscription | null
  isLoading: boolean
  hasAccess: boolean
  needsSubscription: boolean
}

/**
 * Hook to check if the current user has an active subscription.
 * Used for the Early Access paywall - checks user-level subscription,
 * not organization-level.
 *
 * @param userId - Clerk user ID (external ID)
 * @returns Subscription status and access check
 */
export function useUserSubscription(
  userId: string | null | undefined
): UseUserSubscriptionResult {
  const subscription = useQuery(
    api.users.getUserSubscription,
    userId ? { externalId: userId } : 'skip'
  )

  const isLoading = subscription === undefined

  // User has access if they have an active subscription
  const hasAccess = subscription?.hasAccess ?? false

  // User needs to subscribe if they're loaded, not a new user (has account),
  // but doesn't have access
  const needsSubscription = !isLoading && !hasAccess

  return {
    subscription: subscription ?? null,
    isLoading,
    hasAccess,
    needsSubscription,
  }
}
