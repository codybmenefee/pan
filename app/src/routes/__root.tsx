import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'

interface RouterContext {
  auth: {
    userId: string | null
    isLoaded: boolean
    isSignedIn: boolean
    isDevAuth: boolean
  }
}

function RootComponent() {
  const routerState = useRouterState()
  console.log('[__root] Rendering, router state:', {
    location: routerState.location.pathname,
    status: routerState.status,
    isLoading: routerState.isLoading,
    matches: routerState.matches.map(m => m.routeId),
  })
  return <Outlet />
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})
