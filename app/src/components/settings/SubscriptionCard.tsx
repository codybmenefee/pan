import type { SubscriptionTier } from '../../lib/hooks/useSubscription'
import { useSubscription } from '../../lib/hooks/useSubscription'
import { useStorageUsage } from '../../lib/hooks/useSatelliteTiles'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'
import { ACRES_PER_HECTARE } from '@/lib/areaUnits'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    description: 'Get started with satellite monitoring',
    color: 'gray',
    features: [
      'Latest satellite imagery',
      'NDVI, EVI & vegetation indices',
      '10m resolution (Sentinel-2)',
      'Updates every 3-5 days',
      'Up to 5 acres',
    ],
  },
  homesteader: {
    name: 'Homesteader',
    price: '$10/mo',
    description: 'Full features for small operations',
    color: 'blue',
    features: [
      'Historical satellite data',
      'Daily satellite imagery',
      '3m resolution imagery',
      'Up to 25 acres',
      'Data export',
    ],
  },
  producer: {
    name: 'Producer',
    price: '$50/mo',
    description: 'Everything you need to scale',
    color: 'purple',
    features: [
      'Everything in Homesteader',
      'Up to 100 acres',
      'Priority support',
      'API access',
      'Advanced analytics',
    ],
  },
  commercial: {
    name: 'Commercial',
    price: 'Custom',
    description: 'Tailored solutions for large operations',
    color: 'amber',
    features: [
      'Everything in Producer',
      'Unlimited acreage',
      'Custom integrations',
      'Dedicated account manager',
      'Custom data retention',
    ],
  },
}

/**
 * Displays current subscription plan and usage metrics.
 * Includes upgrade/downgrade options and link to billing portal.
 */
/**
 * Transforms features list to add hectare equivalents when user prefers hectares.
 */
function transformFeatures(features: string[], preferHectares: boolean): string[] {
  if (!preferHectares) return features

  return features.map(feature => {
    // Transform "Up to X acres" to "Up to X acres (Y ha)"
    const acreMatch = feature.match(/Up to (\d+) acres/)
    if (acreMatch) {
      const acres = parseInt(acreMatch[1], 10)
      const hectares = (acres / ACRES_PER_HECTARE).toFixed(1)
      return feature.replace(/Up to \d+ acres/, `Up to ${acres} acres (${hectares} ha)`)
    }
    return feature
  })
}

export function SubscriptionCard({
  farmId,
  farmAcreage = 0,
  className = '',
}: SubscriptionCardProps) {
  const { subscription, isLoading, tier, isActive } = useSubscription(farmId)
  const { usage, isLoading: usageLoading } = useStorageUsage(farmId)
  const { unit } = useAreaUnit()
  const preferHectares = unit === 'hectares'

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse h-64', className)} />
    )
  }

  const planDetails = PLAN_DETAILS[tier]
  const acreageUsage = (farmAcreage / (subscription?.acreageLimit ?? 5)) * 100

  // Transform features to include hectare equivalents when user prefers hectares
  const displayFeatures = transformFeatures(planDetails.features, preferHectares)

  // Convert farm acreage (in acres) to hectares for display
  const farmHectares = farmAcreage / ACRES_PER_HECTARE
  const limitHectares = (subscription?.acreageLimit ?? 5) / ACRES_PER_HECTARE

  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">
              {planDetails.name} Plan
            </CardTitle>
            <CardDescription>{planDetails.description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{planDetails.price}</p>
            {!isActive && tier !== 'free' && (
              <span className="text-xs text-destructive font-medium">
                {subscription?.status === 'past_due' ? 'Payment past due' : 'Canceled'}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Usage Metrics */}
      <CardContent className="space-y-3">
        <h4 className="text-sm font-medium">Usage</h4>
        {/* Acreage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Land Area</span>
            <span className="font-medium">
              {preferHectares
                ? `${farmHectares.toFixed(1)} / ${limitHectares.toFixed(1)} ha`
                : `${farmAcreage.toFixed(1)} / ${subscription?.acreageLimit ?? 5} ac`
              }
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                acreageUsage > 90 ? 'bg-terracotta' : acreageUsage > 70 ? 'bg-terracotta-muted' : 'bg-olive'
              }`}
              style={{ width: `${Math.min(acreageUsage, 100)}%` }}
            />
          </div>
        </div>

        {/* Storage (for paid tiers) */}
        {tier !== 'free' && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Tile Storage</span>
              <span className="font-medium">
                {usageLoading ? '...' : `${usage?.totalMB ?? 0} MB`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {usage?.tileCount ?? 0} satellite tiles stored
            </p>
          </div>
        )}

        {/* Period end */}
        {subscription?.currentPeriodEnd && tier !== 'free' && (
          <p className="text-xs text-muted-foreground">
            {subscription.status === 'active'
              ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
              : `Access until ${formatDate(subscription.currentPeriodEnd)}`}
          </p>
        )}
      </CardContent>

      <Separator />

      {/* Features */}
      <CardContent className="space-y-3">
        <h4 className="text-sm font-medium">Plan Features</h4>
        <ul className="space-y-2">
          {displayFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-olive flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      {/* Actions */}
      <CardFooter className="border-t pt-4">
        <div className="flex items-center gap-3 w-full">
          {tier === 'free' ? (
            <Button asChild className="flex-1">
              <a href="/upgrade">Upgrade Plan</a>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild className="flex-1">
                <a href="/billing">Manage Billing</a>
              </Button>
              {tier !== 'commercial' && (
                <Button variant="secondary" asChild>
                  <a href="/upgrade">Upgrade</a>
                </Button>
              )}
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * Compact subscription status display for headers/sidebars.
 */
export function SubscriptionBadge({ farmId }: { farmId: string }) {
  const { tier, isActive } = useSubscription(farmId)
  const planDetails = PLAN_DETAILS[tier]

  const colorClasses: Record<SubscriptionTier, string> = {
    free: 'bg-muted text-muted-foreground',
    homesteader: 'bg-cobalt/20 text-cobalt-muted',
    producer: 'bg-cobalt/20 text-cobalt-muted',
    commercial: 'bg-terracotta/20 text-terracotta',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[tier]}`}
    >
      {planDetails.name}
      {!isActive && tier !== 'free' && (
        <span className="ml-1 text-destructive">!</span>
      )}
    </span>
  )
}

/**
 * Plan comparison grid for upgrade page.
 */
export function PlanComparisonGrid({ currentTier }: { currentTier: SubscriptionTier }) {
  const tiers: SubscriptionTier[] = ['free', 'homesteader', 'producer', 'commercial']

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiers.map((tier) => {
        const details = PLAN_DETAILS[tier]
        const isCurrent = tier === currentTier

        return (
          <Card
            key={tier}
            className={cn(
              'p-6',
              isCurrent && 'border-2 border-primary bg-primary/5'
            )}
          >
            {isCurrent && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded mb-3">
                Current Plan
              </span>
            )}
            <h3 className="text-lg font-semibold">{details.name}</h3>
            <p className="text-2xl font-bold my-2">{details.price}</p>
            <p className="text-sm text-muted-foreground mb-4">{details.description}</p>
            <ul className="space-y-2 mb-4">
              {details.features.slice(0, 4).map((feature, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="h-4 w-4 text-olive mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            {!isCurrent && (
              <Button
                variant={tier === 'commercial' ? 'outline' : 'default'}
                className="w-full"
              >
                {tier === 'commercial' ? 'Contact Sales' : 'Select Plan'}
              </Button>
            )}
          </Card>
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
