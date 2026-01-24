import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { ClerkProvider, SignIn, useAuth } from '@clerk/clerk-react'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'

export const DEV_USER_EXTERNAL_ID = 'dev-user-1'

interface AppAuthContextValue {
  userId: string | null
  isLoaded: boolean
  isSignedIn: boolean
  isDevAuth: boolean
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null)

const devAuthEnabled = import.meta.env.VITE_DEV_AUTH === 'true'
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  // Use useAuth() instead of useUser() - useAuth() tells us when Clerk is loaded
  // regardless of sign-in state, while useUser() only loads with a signed-in user
  const { userId, isLoaded, isSignedIn } = useAuth()

  // Debug logging
  console.log('[ClerkAuthBridge] Auth state from Clerk:', { userId, isLoaded, isSignedIn })

  const value = useMemo<AppAuthContextValue>(() => {
    return {
      userId: userId ?? null,
      isLoaded,
      isSignedIn: !!isSignedIn,
      isDevAuth: false,
    }
  }, [userId, isLoaded, isSignedIn])

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
