import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SubscriptionTier } from '@/lib/hooks/useSubscription'

export const Route = createFileRoute('/app/upgrade')({
  component: UpgradePage,
})

const PLAN_TIERS: {
  tier: SubscriptionTier
  name: string
  price: string
  description: string
  features: string[]
  highlighted?: boolean
}[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    description: 'Get started with satellite monitoring',
    features: [
      'Latest satellite imagery',
      'NDVI, EVI & vegetation indices',
      '10m resolution (Sentinel-2)',
      'Updates every 3-5 days',
      'Up to 5 acres',
    ],
  },
  {
    tier: 'homesteader',
    name: 'Homesteader',
    price: '$10',
    description: 'Full features for small operations',
    features: [
      'Historical satellite data',
      'Daily satellite imagery',
      '3m resolution imagery',
      'Up to 25 acres',
      'Data export',
    ],
  },
  {
    tier: 'producer',
    name: 'Producer',
    price: '$50',
    description: 'Everything you need to scale',
    features: [
      'Everything in Homesteader',
      'Up to 100 acres',
      'Priority support',
      'API access',
      'Advanced analytics',
    ],
    highlighted: true,
  },
  {
    tier: 'commercial',
    name: 'Commercial',
    price: 'Custom',
    description: 'Tailored solutions for large operations',
    features: [
      'Everything in Producer',
      'Unlimited acreage',
      'Custom integrations',
      'Dedicated account manager',
      'Custom data retention',
    ],
  },
]

const tierColorClasses: Record<SubscriptionTier, string> = {
  free: 'bg-muted text-muted-foreground',
  homesteader: 'bg-blue-600 text-white',
  producer: 'bg-purple-600 text-white',
  commercial: 'bg-amber-600 text-white',
}

function UpgradePage() {
  return (
    <div className="h-full overflow-auto">
      <div className="p-4 max-w-6xl mx-auto">
        <Link
          to="/app/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">Choose Your Plan</h1>
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Beta Access: Full features unlocked for all users
          </div>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            During our beta period, all users have access to Professional-tier features at no cost.
            Paid plans will be available when we launch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_TIERS.map((plan) => (
            <Card
              key={plan.tier}
              className={cn(
                'relative flex flex-col',
                plan.highlighted && 'ring-2 ring-purple-500/50'
              )}
            >
              {plan.tier === 'free' && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 left-4 bg-green-500/20 text-green-400 border-green-500/30"
                >
                  Current Plan
                </Badge>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
                      tierColorClasses[plan.tier]
                    )}
                  >
                    {plan.name}
                  </span>
                </div>
                <CardTitle className="text-2xl">
                  {plan.price}
                  {plan.price !== 'Custom' && (
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <div className="px-4 pb-4 mt-auto">
                {plan.tier === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.tier === 'commercial' ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:support@openpasture.com">Contact Us</a>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    disabled
                  >
                    Coming Soon
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Questions about our plans?{' '}
            <a
              href="mailto:support@openpasture.com"
              className="text-primary hover:underline"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
