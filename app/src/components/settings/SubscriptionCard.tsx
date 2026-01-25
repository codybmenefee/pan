import type { SubscriptionTier } from '../../lib/hooks/useSubscription'
import { useSubscription } from '../../lib/hooks/useSubscription'
import { useStorageUsage } from '../../lib/hooks/useSatelliteTiles'

interface SubscriptionCardProps {
  /**
   * Farm ID to display subscription for (external ID)
   */
  farmId: string

  /**
   * Farm's total acreage for usage display
   */
  farmAcreage?: number

  /**
   * Additional CSS classes
   */
  className?: string
}

// Plan details for display
const PLAN_DETAILS: Record<
  SubscriptionTier,
  {
    name: string
    price: string
    description: string
    color: string
    features: string[]
  }
> = {
  free: {
    name: 'Free',
    price: '$0/mo',
    description: 'Basic satellite monitoring for small properties',
    color: 'gray',
    features: [
      'Sentinel-2 indices (NDVI)',
      'Up to 5 acres',
      '1 year data retention',
      'Historical satellite viewer',
    ],
  },
  starter: {
    name: 'Starter',
    price: '$10/mo',
    description: 'Full satellite imagery for growing operations',
    color: 'blue',
    features: [
      'Everything in Free',
      'Raw satellite imagery',
      'EVI & NDWI indices',
      'Up to 25 acres',
      '1 year raw imagery retention',
      'Data export',
    ],
  },
  professional: {
    name: 'Professional',
    price: '$50/mo',
    description: 'High-resolution imagery for professional farms',
    color: 'purple',
    features: [
      'Everything in Starter',
      'PlanetScope (3m resolution)',
      'Up to 100 acres',
      '3 year retention',
      'API access',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Unlimited capabilities for large operations',
    color: 'amber',
    features: [
      'Everything in Professional',
      'Unlimited acreage',
      'Unlimited retention',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
}

/**
 * Displays current subscription plan and usage metrics.
 * Includes upgrade/downgrade options and link to billing portal.
 */
export function SubscriptionCard({
  farmId,
  farmAcreage = 0,
  className = '',
}: SubscriptionCardProps) {
  const { subscription, isLoading, tier, isActive } = useSubscription(farmId)
  const { usage, isLoading: usageLoading } = useStorageUsage(farmId)

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg h-64 ${className}`} />
    )
  }

  const planDetails = PLAN_DETAILS[tier]
  const acreageUsage = (farmAcreage / (subscription?.acreageLimit ?? 5)) * 100

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-6 py-4 bg-${planDetails.color}-50 border-b border-${planDetails.color}-100`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {planDetails.name} Plan
            </h3>
            <p className="text-sm text-gray-600">{planDetails.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{planDetails.price}</p>
            {!isActive && tier !== 'free' && (
              <span className="text-xs text-red-600 font-medium">
                {subscription?.status === 'past_due' ? 'Payment past due' : 'Canceled'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Usage</h4>
        <div className="space-y-3">
          {/* Acreage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Acreage</span>
              <span className="text-gray-900 font-medium">
                {farmAcreage.toFixed(1)} / {subscription?.acreageLimit ?? 5} acres
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  acreageUsage > 90 ? 'bg-red-500' : acreageUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(acreageUsage, 100)}%` }}
              />
            </div>
          </div>

          {/* Storage (for paid tiers) */}
          {tier !== 'free' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Tile Storage</span>
                <span className="text-gray-900 font-medium">
                  {usageLoading ? '...' : `${usage?.totalMB ?? 0} MB`}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {usage?.tileCount ?? 0} satellite tiles stored
              </p>
            </div>
          )}

          {/* Period end */}
          {subscription?.currentPeriodEnd && tier !== 'free' && (
            <p className="text-xs text-gray-500">
              {subscription.status === 'active'
                ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                : `Access until ${formatDate(subscription.currentPeriodEnd)}`}
            </p>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Plan Features</h4>
        <ul className="space-y-2">
          {planDetails.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <svg
                className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center gap-3">
          {tier === 'free' ? (
            <a
              href="/upgrade"
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Upgrade Plan
            </a>
          ) : (
            <>
              <a
                href="/billing"
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Manage Billing
              </a>
              {tier !== 'enterprise' && (
                <a
                  href="/upgrade"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                >
                  Upgrade
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Compact subscription status display for headers/sidebars.
 */
export function SubscriptionBadge({ farmId }: { farmId: string }) {
  const { tier, isActive } = useSubscription(farmId)
  const planDetails = PLAN_DETAILS[tier]

  const colorClasses: Record<SubscriptionTier, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[tier]}`}
    >
      {planDetails.name}
      {!isActive && tier !== 'free' && (
        <span className="ml-1 text-red-500">!</span>
      )}
    </span>
  )
}

/**
 * Plan comparison grid for upgrade page.
 */
export function PlanComparisonGrid({ currentTier }: { currentTier: SubscriptionTier }) {
  const tiers: SubscriptionTier[] = ['free', 'starter', 'professional', 'enterprise']

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiers.map((tier) => {
        const details = PLAN_DETAILS[tier]
        const isCurrent = tier === currentTier

        return (
          <div
            key={tier}
            className={`rounded-lg border-2 p-6 ${
              isCurrent ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
          >
            {isCurrent && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-green-500 text-white rounded mb-3">
                Current Plan
              </span>
            )}
            <h3 className="text-lg font-semibold">{details.name}</h3>
            <p className="text-2xl font-bold my-2">{details.price}</p>
            <p className="text-sm text-gray-600 mb-4">{details.description}</p>
            <ul className="space-y-2 mb-4">
              {details.features.slice(0, 4).map((feature, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            {!isCurrent && (
              <button
                className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                  tier === 'enterprise'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {tier === 'enterprise' ? 'Contact Sales' : 'Select Plan'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
