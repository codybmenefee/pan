import type { ReactNode } from 'react'
import type { Feature } from '../../lib/featureFlags'
import { FEATURE_INFO, getMinimumTierForFeature } from '../../lib/featureFlags'
import { useSubscription } from '../../lib/hooks/useSubscription'

interface FeatureGateProps {
  /**
   * Farm ID to check subscription for (external ID)
   */
  farmId: string | undefined

  /**
   * Feature to gate access to
   */
  feature: Feature

  /**
   * Content to show when user has access
   */
  children: ReactNode

  /**
   * Custom fallback content when user doesn't have access
   * If not provided, shows default upgrade prompt
   */
  fallback?: ReactNode

  /**
   * Whether to show a loading state while checking subscription
   * @default true
   */
  showLoading?: boolean

  /**
   * Custom loading content
   */
  loadingContent?: ReactNode
}

/**
 * Wraps premium features and shows upgrade prompts when user doesn't have access.
 *
 * @example
 * ```tsx
 * <FeatureGate farmId={farmId} feature={FEATURES.RAW_IMAGERY}>
 *   <RawImageryViewer />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  farmId,
  feature,
  children,
  fallback,
  showLoading = true,
  loadingContent,
}: FeatureGateProps) {
  const { hasFeature, isLoading, tier } = useSubscription(farmId)

  if (isLoading && showLoading) {
    return loadingContent ? (
      <>{loadingContent}</>
    ) : (
      <div className="animate-pulse bg-gray-100 rounded-lg h-32" />
    )
  }

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  // Show fallback or default upgrade prompt
  if (fallback) {
    return <>{fallback}</>
  }

  const featureInfo = FEATURE_INFO[feature]
  const minimumTier = getMinimumTierForFeature(feature)

  return <UpgradePrompt featureInfo={featureInfo} minimumTier={minimumTier} currentTier={tier} />
}

interface UpgradePromptProps {
  featureInfo: {
    name: string
    description: string
  }
  minimumTier: string
  currentTier: string
}

function UpgradePrompt({ featureInfo, minimumTier, currentTier }: UpgradePromptProps) {
  const tierDisplay = {
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  }

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            {featureInfo.name} - Upgrade Required
          </h3>
          <p className="mt-1 text-sm text-amber-700">{featureInfo.description}</p>
          <div className="mt-4">
            <p className="text-xs text-amber-600">
              This feature requires the{' '}
              <span className="font-semibold">
                {tierDisplay[minimumTier as keyof typeof tierDisplay] ?? minimumTier}
              </span>{' '}
              plan or higher.
              {currentTier !== 'free' && (
                <span>
                  {' '}
                  You're currently on the{' '}
                  <span className="font-semibold">
                    {tierDisplay[currentTier as keyof typeof tierDisplay] ?? currentTier}
                  </span>{' '}
                  plan.
                </span>
              )}
            </p>
          </div>
          <div className="mt-4">
            <a
              href="/settings?tab=subscription"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Upgrade Plan
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline version of feature gate that just hides content.
 */
export function FeatureGateInline({
  farmId,
  feature,
  children,
}: {
  farmId: string | undefined
  feature: Feature
  children: ReactNode
}) {
  const { hasFeature, isLoading } = useSubscription(farmId)

  if (isLoading || !hasFeature(feature)) {
    return null
  }

  return <>{children}</>
}

/**
 * Badge to indicate a feature requires a premium tier.
 */
export function PremiumBadge({ tier = 'starter' }: { tier?: string }) {
  const colors = {
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  }

  const colorClass = colors[tier as keyof typeof colors] ?? colors.starter

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
    >
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  )
}
