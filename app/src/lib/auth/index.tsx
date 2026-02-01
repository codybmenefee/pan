import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react'
import { ClerkProvider, SignIn, useAuth, useOrganization, useOrganizationList } from '@clerk/clerk-react'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { clerkAppearance } from './clerkTheme'

export const DEV_USER_EXTERNAL_ID = 'dev-user-1'

// Mock organization data for local development
// Uses 'farm-1' to match seeded data in Convex
export const DEV_ORGS = [
  { id: 'farm-1', name: 'Hillcrest Station' },
] as const

export const DEV_DEFAULT_ORG_ID = DEV_ORGS[0].id

interface OrganizationInfo {
  id: string
  name: string
}

interface AppAuthContextValue {
  userId: string | null
  isLoaded: boolean
  isSignedIn: boolean
  isDevAuth: boolean
  // Demo mode fields
  isDemoMode: boolean
  demoSessionId: string | null
  // Organization fields
  organizationId: string | null
  organizationList: OrganizationInfo[]
  isOrgLoaded: boolean
  setActiveOrganization: (orgId: string) => Promise<void>
  // Onboarding detection - true when user is signed in but has no organizations
  needsOnboarding: boolean
  // Subscription/plan checking
  hasPlan: (plan: string) => boolean
  isPlanLoaded: boolean
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null)

const devAuthEnabled = import.meta.env.VITE_DEV_AUTH === 'true'
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  // Use useAuth() instead of useUser() - useAuth() tells us when Clerk is loaded
  // regardless of sign-in state, while useUser() only loads with a signed-in user
  const { userId, isLoaded, isSignedIn, has } = useAuth()

  // Organization hooks
  const { organization, isLoaded: isOrgLoaded } = useOrganization()
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  })

  // Debug logging
  console.log('[ClerkAuthBridge] Auth state from Clerk:', {
    userId,
    isLoaded,
    isSignedIn,
    organizationId: organization?.id,
    isOrgLoaded,
    membershipCount: userMemberships?.data?.length
  })

  const organizationList = useMemo<OrganizationInfo[]>(() => {
    if (!userMemberships?.data) return []
    return userMemberships.data.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
    }))
  }, [userMemberships?.data])

  const setActiveOrganization = useCallback(async (orgId: string) => {
    if (setActive) {
      await setActive({ organization: orgId })
    }
  }, [setActive])

  // Determine if user needs onboarding (signed in but no organizations)
  const needsOnboarding = useMemo(() => {
    // Wait until both auth and org data are loaded
    if (!isLoaded || !isOrgLoaded) return false
    // User must be signed in
    if (!isSignedIn) return false
    // If they have an active organization, they don't need onboarding
    // (organization?.id updates immediately when setActive is called, before organizationList refreshes)
    if (organization?.id) return false
    // If they have organizations in the list, they don't need onboarding
    return organizationList.length === 0
  }, [isLoaded, isOrgLoaded, isSignedIn, organization?.id, organizationList.length])

  // Wrap Clerk's has() function for plan checking
  const hasPlan = useCallback((plan: string) => {
    if (!has) return false
    return has({ plan })
  }, [has])

  const value = useMemo<AppAuthContextValue>(() => {
    return {
      userId: userId ?? null,
      isLoaded,
      isSignedIn: !!isSignedIn,
      isDevAuth: false,
      isDemoMode: false,
      demoSessionId: null,
      organizationId: organization?.id ?? null,
      organizationList,
      isOrgLoaded,
      setActiveOrganization,
      needsOnboarding,
      hasPlan,
      isPlanLoaded: isLoaded,
    }
  }, [userId, isLoaded, isSignedIn, organization?.id, organizationList, isOrgLoaded, setActiveOrganization, needsOnboarding, hasPlan])

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  if (devAuthEnabled) {
    return (
      <AppAuthContext.Provider
        value={{
          userId: DEV_USER_EXTERNAL_ID,
          isLoaded: true,
          isSignedIn: true,
          isDevAuth: true,
          isDemoMode: false,
          demoSessionId: null,
          organizationId: DEV_DEFAULT_ORG_ID,
          organizationList: DEV_ORGS.map(org => ({ id: org.id, name: org.name })),
          isOrgLoaded: true,
          setActiveOrganization: async () => {
            // No-op in dev mode, could add localStorage persistence if needed
          },
          needsOnboarding: false, // Dev mode always has an org
          hasPlan: () => true, // Dev mode bypasses subscription checks
          isPlanLoaded: true,
        }}
      >
        {children}
      </AppAuthContext.Provider>
    )
  }

  if (!clerkPublishableKey) {
    return (
      <ErrorState
        title="Clerk configuration missing"
        message="Set VITE_CLERK_PUBLISHABLE_KEY to enable authentication."
        details={['Provide a Clerk publishable key in app/.env.local.']}
        className="min-h-screen"
      />
    )
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={clerkAppearance}
      signInForceRedirectUrl="/app"
      signUpForceRedirectUrl="/app"
      afterSignOutUrl="/sign-in"
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  )
}

export function useAppAuth() {
  const context = useContext(AppAuthContext)
  if (!context) {
    throw new Error('useAppAuth must be used within AppAuthProvider')
  }
  return context
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, isDevAuth } = useAppAuth()

  if (isDevAuth) {
    return <>{children}</>
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <SignIn routing="hash" forceRedirectUrl="/app" appearance={clerkAppearance} />
      </div>
    )
  }

  return <>{children}</>
}
