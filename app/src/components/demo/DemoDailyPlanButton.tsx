import { Calendar, CheckCircle } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useBriefPanel } from '@/lib/brief'
import { useFarmContext } from '@/lib/farm'
import { useTodayPlan } from '@/lib/convex/usePlan'

export function DemoDailyPlanButton() {
  const location = useLocation()
  const { briefOpen, setBriefOpen } = useBriefPanel()
  const { activeFarmId } = useFarmContext()
  const { plan } = useTodayPlan(activeFarmId || '')

  // Only show on the main map view (demo index route)
  const isMapView = location.pathname === '/demo'

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
        className="gap-1 h-6 text-[10px] bg-olive hover:bg-olive-bright uppercase tracking-wider font-bold shadow-[2px_2px_0_var(--dark)]"
      >
        <CheckCircle className="h-3 w-3" />
        [approved]
      </Button>
    )
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => setBriefOpen(true)}
      className="gap-1 h-6 text-[10px] uppercase tracking-wider font-bold shadow-[2px_2px_0_var(--dark)]"
    >
      <Calendar className="h-3 w-3" />
      daily-plan
    </Button>
  )
}
