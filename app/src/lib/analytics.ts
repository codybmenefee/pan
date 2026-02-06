/**
 * PostHog Analytics
 *
 * Initializes PostHog for autocapture, SPA pageviews, session replay,
 * and custom event tracking. Dev auth sessions are opted out to avoid
 * polluting production data.
 */

import posthog from 'posthog-js'
import { useMemo } from 'react'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const posthogHost = import.meta.env.VITE_POSTHOG_HOST as string | undefined
const posthogEnabled = import.meta.env.VITE_POSTHOG_ENABLED === 'true'

export const isAnalyticsEnabled = posthogEnabled && !!(posthogKey && posthogHost)

/**
 * Initialize PostHog. Call once at module scope in main.tsx.
 * Returns the PostHog client instance (for PostHogProvider) or null.
 */
export function initAnalytics() {
  if (!isAnalyticsEnabled) return null

  posthog.init(posthogKey!, {
    api_host: posthogHost,
    defaults: '2025-11-30',
    session_recording: {
      maskAllInputs: true,
    },
    advanced_disable_feature_flags: true,
    respect_dnt: true,
  })

  return posthog
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!isAnalyticsEnabled) return
  posthog.identify(userId, properties)
}

export function setFarmGroup(orgId: string, properties?: Record<string, unknown>) {
  if (!isAnalyticsEnabled) return
  posthog.group('farm', orgId, properties)
}

export function resetAnalytics() {
  if (!isAnalyticsEnabled) return
  posthog.reset()
}

// -- Custom event helpers --

interface OnboardingCompletedProps {
  farmName?: string
  livestockConfigured?: boolean
}

interface PlanGeneratedProps {
  farmId: string
  triggeredBy: string
}

interface PlanApprovedProps {
  planId: string
  confidenceScore?: number
  pastureName?: string
}

interface PlanModifiedProps {
  planId: string
  hasFeedback: boolean
}

interface SubscriptionStartedProps {
  plan: string
}

function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!isAnalyticsEnabled) return
  posthog.capture(event, properties)
}

/**
 * Hook returning memoized tracking functions for the 5 custom events.
 * Returns no-ops when PostHog is unavailable.
 */
export function useAnalytics() {
  return useMemo(() => {
    if (!isAnalyticsEnabled) {
      return {
        trackOnboardingCompleted: (_props?: OnboardingCompletedProps) => {},
        trackPlanGenerated: (_props: PlanGeneratedProps) => {},
        trackPlanApproved: (_props: PlanApprovedProps) => {},
        trackPlanModified: (_props: PlanModifiedProps) => {},
        trackSubscriptionStarted: (_props: SubscriptionStartedProps) => {},
      }
    }

    return {
      trackOnboardingCompleted: (props?: OnboardingCompletedProps) =>
        trackEvent('onboarding_completed', props && { ...props }),
      trackPlanGenerated: (props: PlanGeneratedProps) =>
        trackEvent('plan_generated', { ...props }),
      trackPlanApproved: (props: PlanApprovedProps) =>
        trackEvent('plan_approved', { ...props }),
      trackPlanModified: (props: PlanModifiedProps) =>
        trackEvent('plan_modified', { ...props }),
      trackSubscriptionStarted: (props: SubscriptionStartedProps) =>
        trackEvent('subscription_started', { ...props }),
    }
  }, [])
}
