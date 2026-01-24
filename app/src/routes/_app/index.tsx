import { createFileRoute } from '@tanstack/react-router'
import { MorningBrief } from '@/components/brief/MorningBrief'
import { useCurrentUser } from '@/lib/convex/useCurrentUser'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { ErrorState } from '@/components/ui/error/ErrorState'

function DashboardRoute() {
  console.log('[_app/index] Rendering DashboardRoute')
  const { farmId, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    )
  }

  if (!farmId) {
    return (
      <ErrorState
        title="Farm mapping unavailable"
        message="No farm is associated with this account yet."
        details={['Seed a farm record or map this user to a farm in Convex.']}
        className="min-h-screen"
      />
    )
  }

  return <MorningBrief farmExternalId={farmId} />
}

export const Route = createFileRoute('/_app/')({
  component: DashboardRoute,
})
