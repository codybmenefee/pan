import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react'
import { ClerkProvider, SignIn, useAuth, useOrganization, useOrganizationList } from '@clerk/clerk-react'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'

export const DEV_USER_EXTERNAL_ID = 'dev-user-1'

// Mock organization data for local development
export const DEV_ORGS = [
  { id: 'org_dev_farm1', name: 'Hillcrest Station' },
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
  // Organization fields
  organizationId: string | null
  organizationList: OrganizationInfo[]
  isOrgLoaded: boolean
  setActiveOrganization: (orgId: string) => Promise<void>
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null)

const devAuthEnabled = import.meta.env.VITE_DEV_AUTH === 'true'
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  // Use useAuth() instead of useUser() - useAuth() tells us when Clerk is loaded
  // regardless of sign-in state, while useUser() only loads with a signed-in user
  const { userId, isLoaded, isSignedIn } = useAuth()

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

  const value = useMemo<AppAuthContextValue>(() => {
    return {
      userId: userId ?? null,
      isLoaded,
      isSignedIn: !!isSignedIn,
      isDevAuth: false,
      organizationId: organization?.id ?? null,
      organizationList,
      isOrgLoaded,
      setActiveOrganization,
    }
  }, [userId, isLoaded, isSignedIn, organization?.id, organizationList, isOrgLoaded, setActiveOrganization])

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
          organizationId: DEV_DEFAULT_ORG_ID,
          organizationList: DEV_ORGS.map(org => ({ id: org.id, name: org.name })),
          isOrgLoaded: true,
          setActiveOrganization: async () => {
            // No-op in dev mode, could add localStorage persistence if needed
          },
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
    <ClerkProvider publishableKey={clerkPublishableKey}>
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
        <SignIn routing="hash" />
      </div>
    )
  }

  return <>{children}</>
}
