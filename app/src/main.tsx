/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useCallback, useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { PostHogProvider } from 'posthog-js/react'
import { Toaster } from 'sonner'
import { AppAuthProvider, useAppAuth } from '@/lib/auth'
import { useAuth } from '@clerk/clerk-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { initAnalytics } from '@/lib/analytics'
import { routeTree } from './routeTree.gen'
import './index.css'

const convexUrl = import.meta.env.VITE_CONVEX_URL
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null
const posthogClient = initAnalytics()

// Create router with context placeholder
const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Inner component that has access to auth context
function InnerApp() {
  const auth = useAppAuth()
  console.log('[InnerApp] Auth context:', auth)
  return (
    <TooltipProvider delayDuration={300}>
      <RouterProvider router={router} context={{ auth }} />
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  )
}

function ConvexClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken, orgId, orgRole } = useAuth()
  const templateName = import.meta.env.VITE_CLERK_CONVEX_TEMPLATE as string | undefined
  const templateSupportedRef = useRef(true)

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (templateSupportedRef.current && templateName) {
        try {
          return await getToken({
            template: templateName,
            skipCache: forceRefreshToken,
          })
        } catch (error) {
          const status = typeof error === 'object' && error && 'status' in error
            ? (error as { status?: unknown }).status
            : undefined

          if (status === 404) {
            templateSupportedRef.current = false
            console.warn(
              `[ConvexAuth] Clerk JWT template "${templateName}" not found; falling back to default session token.`
            )
          } else {
            return null
          }
        }
      }

      try {
        return await getToken({
          skipCache: forceRefreshToken,
        })
      } catch {
        return null
      }
    },
    // Rebuild token fetcher when org context changes so org claims stay in sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getToken, orgId, orgRole, templateName]
  )

  const useAuthForConvex = useMemo(
    () => () => ({
      isLoading: !isLoaded,
      isAuthenticated: isSignedIn ?? false,
      fetchAccessToken,
    }),
    [isLoaded, isSignedIn, fetchAccessToken]
  )

  return (
    <ConvexProviderWithAuth client={convexClient!} useAuth={useAuthForConvex}>
      {children}
    </ConvexProviderWithAuth>
  )
}

function AppTree() {
  return convexClient ? (
    <AppAuthProvider>
      <ConvexClerkAuthBridge>
        <InnerApp />
      </ConvexClerkAuthBridge>
    </AppAuthProvider>
  ) : (
    <ErrorState
      title="Convex configuration missing"
      message="Set VITE_CONVEX_URL to your Convex deployment URL before running the app."
      details={[
        'Run `npx convex dev` in app/ to create a local deployment.',
        'Copy the deployment URL into a .env file as VITE_CONVEX_URL.',
      ]}
      className="min-h-screen"
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {posthogClient ? (
      <PostHogProvider client={posthogClient}>
        <AppTree />
      </PostHogProvider>
    ) : (
      <AppTree />
    )}
  </StrictMode>,
)
