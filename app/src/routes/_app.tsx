import { createFileRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { GeometryProviderWithConvex } from '@/lib/geometry/GeometryProviderWithConvex'
import { FarmProvider } from '@/lib/farm'
import { BriefPanelProvider } from '@/lib/brief'
import { useAppAuth } from '@/lib/auth'
import { useEffect } from 'react'
import { TutorialProvider, TutorialOverlay } from '@/components/onboarding/tutorial'
import { SatelliteAnimationProvider } from '@/lib/satellite-animation'
import { SatelliteCollapseAnimation } from '@/components/layout/SatelliteCollapseAnimation'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { isLoaded, isSignedIn, isDevAuth, needsOnboarding, isOrgLoaded } = useAppAuth()
  const navigate = useNavigate()
  const location = useRouterState({ select: (s) => s.location })
  const isOnboarding = location.pathname === '/onboarding'

  console.log('[AppLayout] Rendering with auth:', { isLoaded, isSignedIn, isDevAuth, needsOnboarding, pathname: location.pathname })

  // Handle auth redirect in component when auth loads
  useEffect(() => {
    if (isDevAuth) return
    if (isLoaded && !isSignedIn) {
      console.log('[AppLayout] Redirecting to sign-in')
      navigate({
        to: '/sign-in',
        search: { redirect: location.pathname },
      })
    }
  }, [isLoaded, isSignedIn, isDevAuth, navigate, location.pathname])

  // Handle onboarding redirect for first-time users (no organizations)
  useEffect(() => {
    if (isDevAuth) return
    // Wait until auth and org data are fully loaded
    if (!isLoaded || !isOrgLoaded) return
    // Must be signed in
    if (!isSignedIn) return
    // Check if user needs onboarding and is not already on the onboarding page
    if (needsOnboarding && !isOnboarding) {
      console.log('[AppLayout] First-time user detected, redirecting to onboarding')
      navigate({ to: '/onboarding' })
    }
    // If user is on onboarding but doesn't need it anymore (org was created), redirect to home
    // BUT only if onboarding is not actively in progress (user hasn't completed all steps yet)
    const onboardingInProgress = sessionStorage.getItem('onboardingInProgress') === 'true'
    if (!needsOnboarding && isOnboarding && !onboardingInProgress) {
      console.log('[AppLayout] Onboarding complete, redirecting to home')
      navigate({ to: '/', search: { onboarded: 'true', editBoundary: 'true' } })
    }
  }, [isDevAuth, isLoaded, isOrgLoaded, isSignedIn, needsOnboarding, isOnboarding, navigate])

  // Show loading while auth is being checked
  if (!isDevAuth && !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    )
  }

  // Show loading while redirect is happening
  if (!isDevAuth && !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Redirecting to sign in..." />
      </div>
    )
  }

  // Show loading while checking for onboarding redirect
  // Skip this check on the onboarding page - onboarding handles its own loading states
  // and shouldn't be unmounted during org state transitions (which would reset step state)
  if (!isDevAuth && isSignedIn && !isOrgLoaded && !isOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading your account..." />
      </div>
    )
  }

  // Show loading while onboarding redirect is happening
  if (!isDevAuth && needsOnboarding && !isOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Setting up your account..." />
      </div>
    )
  }

  // Onboarding doesn't need geometry provider (no farm exists yet)
  if (isOnboarding) {
    return (
      <FarmProvider>
        <div className="flex h-screen flex-col bg-background text-foreground">
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </FarmProvider>
    )
  }

  return (
    <FarmProvider>
      <GeometryProviderWithConvex>
        <BriefPanelProvider>
          <SatelliteAnimationProvider>
            <TutorialProvider>
              <div className="flex h-screen flex-col bg-background text-foreground">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />
                  <main className="flex-1 overflow-hidden">
                    <Outlet />
                  </main>
                </div>
              </div>
              <TutorialOverlay />
              <SatelliteCollapseAnimation />
            </TutorialProvider>
          </SatelliteAnimationProvider>
        </BriefPanelProvider>
      </GeometryProviderWithConvex>
    </FarmProvider>
  )
}
