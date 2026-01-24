import { createFileRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { GeometryProviderWithConvex } from '@/lib/geometry/GeometryProviderWithConvex'
import { FarmProvider } from '@/lib/farm'
import { useAppAuth } from '@/lib/auth'
import { useEffect } from 'react'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { isLoaded, isSignedIn, isDevAuth } = useAppAuth()
  const navigate = useNavigate()
  const location = useRouterState({ select: (s) => s.location })

  console.log('[AppLayout] Rendering with auth:', { isLoaded, isSignedIn, isDevAuth, pathname: location.pathname })

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

  return (
    <FarmProvider>
      <GeometryProviderWithConvex>
        <div className="flex h-screen bg-background text-foreground">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </GeometryProviderWithConvex>
    </FarmProvider>
  )
}
