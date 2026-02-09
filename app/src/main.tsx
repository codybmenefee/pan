/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
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
const devAuthEnabled = import.meta.env.VITE_DEV_AUTH === 'true'

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

function AppTree() {
  return convexClient ? (
    devAuthEnabled ? (
      <ConvexProvider client={convexClient}>
        <AppAuthProvider>
          <InnerApp />
        </AppAuthProvider>
      </ConvexProvider>
    ) : (
      <AppAuthProvider>
        <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
          <InnerApp />
        </ConvexProviderWithClerk>
      </AppAuthProvider>
    )
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
