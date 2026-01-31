import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser, useClerk, useAuth, PricingTable } from '@clerk/clerk-react'
import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Leaf, LogOut } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'

export const Route = createFileRoute('/subscribe')({
  component: SubscribePage,
})

function SubscribePage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { has, isLoaded: isAuthLoaded } = useAuth()
  const { signOut } = useClerk()
  const navigate = useNavigate()

  // Debug: log what Clerk knows about the user's subscription
  useEffect(() => {
    if (isUserLoaded && user) {
      console.log('[Subscribe] User data:', user)
      console.log('[Subscribe] User publicMetadata:', user.publicMetadata)
      console.log('[Subscribe] has() free_user:', has?.({ plan: 'free_user' }))
      console.log('[Subscribe] has() early_access:', has?.({ plan: 'early_access' }))
    }
  }, [isUserLoaded, user, has])

  // Check if user has any plan via Clerk's session (works for free plans too)
  // The plan slug should match what you created in Clerk Dashboard
  const checkHasPlan = useCallback(() => {
    if (!has) return false
    // Check for any of your plans - add your plan slugs here
    // Clerk's has() returns true if the user has the specified plan
    return has({ plan: 'free_user' }) || has({ plan: 'early_access' })
  }, [has])

  // Paywall can be disabled via env var
  const paywallEnabled = import.meta.env.VITE_PAYWALL_ENABLED === 'true'
  const hasPlan = isAuthLoaded ? checkHasPlan() : false

  // If paywall disabled or user already has a plan, redirect to main app
  useEffect(() => {
    if (!paywallEnabled || (isAuthLoaded && hasPlan)) {
      navigate({ to: '/' })
    }
  }, [paywallEnabled, isAuthLoaded, hasPlan, navigate])

  // Show loading while checking auth
  if (!isUserLoaded || !isAuthLoaded) {
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
              onClick={() => navigate({ to: '/' })}
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
