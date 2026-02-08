import { Calendar, CheckCircle } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useBriefPanel } from '@/lib/brief'
import { useFarmContext } from '@/lib/farm'
import { useTodayPlan } from '@/lib/convex/usePlan'

export function DailyPlanButton() {
  const location = useLocation()
  const { briefOpen, setBriefOpen } = useBriefPanel()
  const { activeFarmId } = useFarmContext()
  const { plan } = useTodayPlan(activeFarmId || '')

  // Only show on the main map view (index route)
  const isMapView = location.pathname === '/'

  // Don't render if not on map view or no farm
  if (!isMapView || !activeFarmId) {
    return null
  }

  // Don't render if the panel is already open
  if (briefOpen) {
    return null
  }

  const isApproved = plan?.status === 'approved' || plan?.status === 'modified'

  if (isApproved) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => setBriefOpen(true)}
        className="gap-1 h-6 text-xs bg-olive hover:bg-olive-bright"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Approved
      </Button>
    )
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => setBriefOpen(true)}
      className="gap-1 h-6 text-xs"
    >
      <Calendar className="h-3.5 w-3.5" />
      Daily Plan
    </Button>
  )
}
