import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/Sidebar'
import { DemoHeader } from '@/components/demo/DemoHeader'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { DemoGeometryProvider } from '@/lib/demo/DemoGeometryProvider'
import { DemoFarmProvider } from '@/lib/farm/DemoFarmProvider'
import { BriefPanelProvider } from '@/lib/brief'
import { DemoAuthProvider, useDemoAuth } from '@/lib/auth/DemoAuthProvider'
import { SatelliteAnimationProvider } from '@/lib/satellite-animation'
import { SatelliteCollapseAnimation } from '@/components/layout/SatelliteCollapseAnimation'
import { useDemoSeeding } from '@/lib/convex/useDemoSeeding'
import { TutorialProvider, TutorialOverlay } from '@/components/onboarding/tutorial'
import { isDemoDevMode } from '@/lib/demo/isDemoDevMode'

export const Route = createFileRoute('/demo')({
  component: DemoLayout,
})

function DemoLayoutContent() {
  const { isLoaded, demoSessionId } = useDemoAuth()
  const { isSeeding, isSeeded } = useDemoSeeding()

  // Show loading while session initializes
  // In dev mode, we don't need a demoSessionId (we use farm-1 directly)
  const sessionReady = isDemoDevMode ? isLoaded : (isLoaded && demoSessionId)
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Starting demo..." />
      </div>
    )
  }

  // Show loading while demo data is being seeded
  if (isSeeding || !isSeeded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Setting up your demo farm..." />
      </div>
    )
  }

  return (
    <DemoFarmProvider>
      <DemoGeometryProvider>
        <BriefPanelProvider>
          <SatelliteAnimationProvider>
            <TutorialProvider forceStart>
              <div className="flex h-screen flex-col bg-background text-foreground">
                <DemoHeader />
                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />
                  <main className="flex-1 overflow-hidden">
                    <Outlet />
                  </main>
                </div>
              </div>
              <SatelliteCollapseAnimation />
              <TutorialOverlay />
            </TutorialProvider>
          </SatelliteAnimationProvider>
        </BriefPanelProvider>
      </DemoGeometryProvider>
    </DemoFarmProvider>
  )
}

function DemoLayout() {
  return (
    <DemoAuthProvider>
      <DemoLayoutContent />
    </DemoAuthProvider>
  )
}
