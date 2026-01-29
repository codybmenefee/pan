import type { SubscriptionTier } from '@/lib/hooks/useSubscription'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useStorageUsage } from '@/lib/hooks/useSatelliteTiles'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'
import { ACRES_PER_HECTARE } from '@/lib/areaUnits'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlanSummaryProps {
  farmId: string
  farmAcreage?: number
}

const PLAN_DETAILS: Record<
  SubscriptionTier,
  {
    name: string
    price: string
    features: string[]
  }
> = {
  free: {
    name: 'Free',
    price: '$0/mo',
    features: ['Latest imagery', '10m resolution', 'Up to 5 acres'],
  },
  homesteader: {
    name: 'Homesteader',
    price: '$10/mo',
    features: ['Historical data', '3m resolution', 'Up to 25 acres'],
  },
  producer: {
    name: 'Producer',
    price: '$50/mo',
    features: ['Up to 100 acres', 'Priority support', 'API access'],
  },
  commercial: {
    name: 'Commercial',
    price: 'Custom',
    features: ['Unlimited acreage', 'Custom integrations', 'Dedicated support'],
  },
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PlanSummary({ farmId, farmAcreage = 0 }: PlanSummaryProps) {
  const { subscription, isLoading, tier, isActive } = useSubscription(farmId)
  const { usage, isLoading: usageLoading } = useStorageUsage(farmId)
  const { unit } = useAreaUnit()
  const preferHectares = unit === 'hectares'

  if (isLoading) {
    return <div className="h-32 animate-pulse bg-muted rounded-lg" />
  }

  const planDetails = PLAN_DETAILS[tier]
  const acreageUsage = (farmAcreage / (subscription?.acreageLimit ?? 5)) * 100

  const farmHectares = farmAcreage / ACRES_PER_HECTARE
  const limitHectares = (subscription?.acreageLimit ?? 5) / ACRES_PER_HECTARE

  const colorClasses: Record<SubscriptionTier, string> = {
    free: 'bg-muted text-muted-foreground',
    homesteader: 'bg-blue-500/20 text-blue-400',
    producer: 'bg-purple-500/20 text-purple-400',
    commercial: 'bg-amber-500/20 text-amber-400',
  }

  return (
    <div className="space-y-4">
      {/* Plan Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium',
              colorClasses[tier]
            )}
          >
            {planDetails.name}
          </span>
          <span className="text-lg font-semibold">{planDetails.price}</span>
          {!isActive && tier !== 'free' && (
            <span className="text-xs text-destructive font-medium">
              {subscription?.status === 'past_due' ? 'Payment past due' : 'Canceled'}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={tier === 'free' ? '/upgrade' : '/billing'}>
            {tier === 'free' ? 'Upgrade' : 'Manage'}
          </a>
        </Button>
      </div>

      {/* Usage Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">Land Area</span>
          <span className="font-medium tabular-nums">
            {preferHectares
              ? `${farmHectares.toFixed(1)} / ${limitHectares.toFixed(1)} ha`
              : `${farmAcreage.toFixed(1)} / ${subscription?.acreageLimit ?? 5} ac`}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              acreageUsage > 90
                ? 'bg-red-500'
                : acreageUsage > 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            )}
            style={{ width: `${Math.min(acreageUsage, 100)}%` }}
          />
        </div>
        {tier !== 'free' && (
          <p className="text-xs text-muted-foreground mt-1">
            {usageLoading ? '...' : `${usage?.tileCount ?? 0} satellite tiles stored`}
          </p>
        )}
      </div>

      {/* Features Row */}
      <div className="flex flex-wrap gap-2">
        {planDetails.features.map((feature, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
          >
            {feature}
          </span>
        ))}
      </div>

      {/* Period info */}
      {subscription?.currentPeriodEnd && tier !== 'free' && (
        <p className="text-xs text-muted-foreground">
          {subscription.status === 'active'
            ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
            : `Access until ${formatDate(subscription.currentPeriodEnd)}`}
        </p>
      )}
    </div>
  )
}
