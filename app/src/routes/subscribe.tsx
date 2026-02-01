import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser, useClerk, useAuth, PricingTable } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Leaf, LogOut } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useAppAuth } from '@/lib/auth'
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
      navigate({ to: '/app' })
    }
  }, [paywallEnabled, isSubscriptionLoaded, hasPlan, navigate])

  // Show loading while redirect is in progress (user has plan)
  if (hasPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner message="Redirecting to app..." />
      </div>
    )
  }

  // Show loading while checking auth and subscription
  if (!isUserLoaded || !isAuthLoaded || convexSubscription === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner message="Checking subscription..." />
      </div>
    )
  }

  // If not signed in, redirect to sign-in
  if (!user) {
    navigate({ to: '/sign-in' })
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/sign-in' })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-green-500" />
          <span className="font-semibold text-lg">OpenPasture</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Subscribe to Continue</h1>
            <p className="text-muted-foreground text-lg">
              Get early access to AI-powered grazing management
            </p>
          </div>

          {/* Clerk's PricingTable component handles plan display and checkout */}
          <div className="flex justify-center">
            <PricingTable />
          </div>

          {/* Continue button for when user has selected a plan */}
          <div className="mt-6 flex justify-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => navigate({ to: '/app' })}
            >
              Continue to App
            </Button>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Questions?{' '}
              <a
                href="mailto:support@openpasture.com"
                className="text-primary hover:underline"
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
