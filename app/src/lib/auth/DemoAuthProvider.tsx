import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import { isDemoDevMode } from '@/lib/demo/isDemoDevMode'

// Session storage key for demo session ID
const DEMO_SESSION_KEY = 'demo_session_id'

// Generate a unique session ID
function generateSessionId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// Get or create demo session ID from sessionStorage
function getDemoSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId()
  }

  let sessionId = sessionStorage.getItem(DEMO_SESSION_KEY)
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem(DEMO_SESSION_KEY, sessionId)
  }
  return sessionId
}

interface DemoOrganizationInfo {
  id: string
  name: string
}

interface DemoAuthContextValue {
  userId: string | null
  isLoaded: boolean
  isSignedIn: boolean
  isDevAuth: boolean
  isDemoMode: boolean
  demoSessionId: string | null
  organizationId: string | null
  organizationList: DemoOrganizationInfo[]
  isOrgLoaded: boolean
  setActiveOrganization: (orgId: string) => Promise<void>
  needsOnboarding: boolean
  resetDemoSession: () => void
}

const DemoAuthContext = createContext<DemoAuthContextValue | null>(null)

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Initialize session ID on mount (client-side only)
  useEffect(() => {
    setSessionId(getDemoSessionId())
  }, [])

  const resetDemoSession = () => {
    const newSessionId = generateSessionId()
    sessionStorage.setItem(DEMO_SESSION_KEY, newSessionId)
    setSessionId(newSessionId)
  }

  const value = useMemo<DemoAuthContextValue>(() => {
    // In dev mode, use farm-1 directly (no demo session needed)
    // This ensures mutations and queries target the same farm
    if (isDemoDevMode) {
      return {
        userId: 'dev-user-1',
        isLoaded: true,
        isSignedIn: true,
        isDevAuth: false,  // Keep false since we're in demo context
        isDemoMode: true,
        demoSessionId: null,  // No demo session in dev mode
        organizationId: 'farm-1',  // Use source farm directly
        organizationList: [{ id: 'farm-1', name: 'Demo Farm (Dev)' }],
        isOrgLoaded: true,
        setActiveOrganization: async () => {},
        needsOnboarding: false,
        resetDemoSession: () => {},  // No-op in dev mode
      }
    }

    const demoUserId = sessionId ? `demo-user-${sessionId}` : null
    const demoFarmId = sessionId ? `demo-farm-${sessionId}` : null

    return {
      userId: demoUserId,
      isLoaded: sessionId !== null,
      isSignedIn: sessionId !== null,
      isDevAuth: false,
      isDemoMode: true,
      demoSessionId: sessionId,
      organizationId: demoFarmId,
      organizationList: demoFarmId ? [{ id: demoFarmId, name: 'Demo Farm' }] : [],
      isOrgLoaded: sessionId !== null,
      setActiveOrganization: async () => {
        // No-op in demo mode - only one demo farm
      },
      needsOnboarding: false, // Demo users don't need onboarding
      resetDemoSession,
    }
  }, [sessionId])

  return (
    <DemoAuthContext.Provider value={value}>
      {children}
    </DemoAuthContext.Provider>
  )
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext)
  if (!context) {
    throw new Error('useDemoAuth must be used within DemoAuthProvider')
  }
  return context
}

// Re-export the context for use in shared components that check auth
export { DemoAuthContext }
