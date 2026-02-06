import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser, useClerk, useAuth, PricingTable } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Leaf, LogOut } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useAppAuth } from '@/lib/auth'
import { useAnalytics } from '@/lib/analytics'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/subscribe')({
  component: SubscribePage,
})

function SubscribePage() {
  const { isDevAuth } = useAppAuth()
  const navigate = useNavigate()

  // In dev mode, redirect to app (no Clerk provider available)
  useEffect(() => {
    if (isDevAuth) {
      navigate({ to: '/app' })
    }
  }, [isDevAuth, navigate])

  // Don't render Clerk components in dev mode
  if (isDevAuth) {
    return null
  }

  return <SubscribePageContent />
}

function SubscribePageContent() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { has, isLoaded: isAuthLoaded } = useAuth()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const { trackSubscriptionStarted } = useAnalytics()

  // Check subscription status from Convex (set by webhook)
  const convexSubscription = useQuery(
    api.users.getUserSubscription,
    user?.id ? { externalId: user.id } : 'skip'
  )

  // Debug: log subscription status (after checkHasPlan is defined below)
  useEffect(() => {
    if (isUserLoaded && user) {
      console.log('[Subscribe] User ID:', user.id)
      console.log('[Subscribe] Clerk has() early_access:', has?.({ plan: 'early_access' }))
      console.log('[Subscribe] Convex subscription:', convexSubscription)
      if (!convexSubscription?.hasAccess && !has?.({ plan: 'early_access' })) {
        console.warn('[Subscribe] Subscription not detected. If you just subscribed, the webhook may not be configured.')
        console.warn('[Subscribe] Configure Clerk webhook to send to: <your-convex-url>/webhooks/clerk-billing')
      }
    }
  }, [isUserLoaded, user, has, convexSubscription])

  // Check if user has the early_access plan via multiple sources
  const checkHasPlan = useCallback(() => {
    // 1. Check Convex subscription status (most reliable - set by webhook)
    if (convexSubscription?.hasAccess) return true
    // 2. Check via has() function (Clerk's session claims)
    if (has?.({ plan: 'early_access' })) return true
    // 3. Fallback: check publicMetadata (set by webhook on subscription change)
    const tier = user?.publicMetadata?.subscriptionTier as string | undefined
    if (tier === 'early_access') return true
    return false
  }, [convexSubscription?.hasAccess, has, user?.publicMetadata])

  // Paywall is enabled by default, can be disabled via env var (useful for dev)
  const paywallDisabled = import.meta.env.VITE_PAYWALL_DISABLED === 'true'
  const paywallEnabled = !paywallDisabled
  const isSubscriptionLoaded = isAuthLoaded && isUserLoaded && convexSubscription !== undefined
  const hasPlan = isSubscriptionLoaded ? checkHasPlan() : false

  // If paywall disabled or user already has a plan, redirect to main app
  useEffect(() => {
    if (!paywallEnabled || (isSubscriptionLoaded && hasPlan)) {
      trackSubscriptionStarted({ plan: 'early_access' })
      navigate({ to: '/app' })
    }
  }, [paywallEnabled, isSubscriptionLoaded, hasPlan, navigate, trackSubscriptionStarted])

  // Show loading while redirect is in progress (user has plan)
  if (hasPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111719]">
        <LoadingSpinner message="Redirecting to app..." />
      </div>
    )
  }

  // Show loading while checking auth (only wait if user is signed in)
  if (!isUserLoaded || !isAuthLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111719]">
        <LoadingSpinner message="Loading..." />
      </div>
    )
  }

  // For authenticated users, wait for subscription check
  if (user && convexSubscription === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111719]">
        <LoadingSpinner message="Checking subscription..." />
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/sign-in' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a2429] via-[#111719] to-[#1a2429] flex flex-col relative">
      {/* Subtle gradient accent */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#075056]/20 via-transparent to-[#075056]/20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-10 border-b border-[#075056]/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-[#075056]" />
          <span className="font-semibold text-lg text-[#FDF6E3]">OpenPasture</span>
        </div>
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-[#D3DBDD] hover:text-[#FDF6E3] hover:bg-[#075056]/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/sign-in' })}
            className="text-[#D3DBDD] hover:text-[#FDF6E3] hover:bg-[#075056]/20"
          >
            Sign in
          </Button>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-[#FDF6E3]">
              {user ? 'Subscribe to Continue' : 'Get Early Access'}
            </h1>
            <p className="text-lg text-[#D3DBDD]">
              {user
                ? 'Get early access to AI-powered grazing management'
                : 'Join OpenPasture and get AI-powered grazing recommendations'}
            </p>
          </div>

          {/* Clerk's PricingTable component handles plan display and checkout */}
          <div className="flex justify-center [&_.cl-pricingTable]:bg-transparent [&_.cl-pricingTableCard]:bg-[#1a2429]/80 [&_.cl-pricingTableCard]:border-[#075056]/30 [&_.cl-pricingTableCard]:text-[#FDF6E3] [&_.cl-pricingTableCardTitle]:text-[#FDF6E3] [&_.cl-pricingTableCardPrice]:text-[#FDF6E3] [&_.cl-pricingTableCardDescription]:text-[#D3DBDD] [&_.cl-pricingTableCardFeatureItem]:text-[#D3DBDD]">
            <PricingTable />
          </div>

          {/* Continue button for authenticated users */}
          {user && (
            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                className="bg-[#075056] hover:bg-[#086369] text-[#FDF6E3]"
                onClick={() => navigate({ to: '/app' })}
              >
                Continue to App
              </Button>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-[#D3DBDD]">
            <p>
              Questions?{' '}
              <a
                href="mailto:support@openpasture.com"
                className="text-[#FF5B04] hover:underline"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
