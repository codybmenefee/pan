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
      <div className="animate-pulse bg-muted h-32" />
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
    <div className="border-2 border-terracotta-muted bg-olive-light p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-terracotta"
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
          <h3 className="text-sm font-medium text-foreground">
            {featureInfo.name} - Upgrade Required
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{featureInfo.description}</p>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
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
              className="inline-flex items-center px-4 py-2 border-2 border-olive text-sm font-medium shadow-hard-sm text-white bg-olive hover:bg-olive-bright focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-olive"
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
    starter: 'bg-olive/10 text-olive',
    professional: 'bg-terracotta/10 text-terracotta',
    enterprise: 'bg-cobalt/10 text-cobalt',
  }

  const colorClass = colors[tier as keyof typeof colors] ?? colors.starter

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${colorClass}`}
    >
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  )
}
