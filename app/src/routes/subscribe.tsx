import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useUser, useClerk, useAuth, PricingTable } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Terminal, LogOut } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useAppAuth } from '@/lib/auth'
import { useAnalytics } from '@/lib/analytics'
import { api } from '../../convex/_generated/api'
import { z } from 'zod'

export const Route = createFileRoute('/subscribe')({
  validateSearch: z.object({ preview: z.boolean().optional() }),
  component: SubscribePage,
})

function SubscribePage() {
  const { isDevAuth } = useAppAuth()
  const navigate = useNavigate()
  const { preview } = useSearch({ from: '/subscribe' })

  // ?preview=true renders a mock page for local styling work
  if (preview) {
    return <SubscribePagePreview />
  }

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner message="Redirecting to app..." />
      </div>
    )
  }

  // Show loading while checking auth (only wait if user is signed in)
  if (!isUserLoaded || !isAuthLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner message="Loading..." />
      </div>
    )
  }

  // For authenticated users, wait for subscription check
  if (user && convexSubscription === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner message="Checking subscription..." />
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/sign-in' })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Header */}
      <header className="relative z-10 border-b-2 border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-olive flex items-center justify-center">
            <Terminal className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-foreground">OpenPasture</span>
        </div>
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/sign-in' })}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Button>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-foreground">
            {user ? 'Subscribe to Continue' : 'Get Early Access'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {user
              ? 'Get early access to AI-powered grazing management'
              : 'Join OpenPasture and get AI-powered grazing recommendations'}
          </p>
        </div>

        {/* Clerk's PricingTable component handles plan display and checkout */}
        <div className="w-full max-w-5xl flex justify-center">
          <PricingTable />
        </div>

        {/* Continue button for authenticated users */}
        {user && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="brutalist"
              size="lg"
              onClick={() => navigate({ to: '/app' })}
            >
              Continue to App
            </Button>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Questions?{' '}
            <a
              href="mailto:support@openpasture.com"
              className="text-terracotta hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

function SubscribePagePreview() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Dev banner */}
      <div className="bg-cobalt text-white text-center text-xs font-mono py-1 tracking-wider uppercase">
        Subscribe page preview -- styling only
      </div>

      {/* Header */}
      <header className="relative z-10 border-b-2 border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-olive flex items-center justify-center">
            <Terminal className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-foreground">OpenPasture</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/app' })}
          className="text-muted-foreground hover:text-foreground"
        >
          Back to app
        </Button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-foreground">
            Get Early Access
          </h1>
          <p className="text-lg text-muted-foreground">
            Join OpenPasture and get AI-powered grazing recommendations
          </p>
        </div>

        {/* Clerk PricingTable from dev environment */}
        <div className="w-full max-w-5xl flex justify-center">
          <PricingTable />
        </div>

        {/* Continue button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="brutalist"
            size="lg"
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
              className="text-terracotta hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
