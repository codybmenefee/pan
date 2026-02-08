import { Calendar, CheckCircle } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useBriefPanel } from '@/lib/brief'
import { useFarmContext } from '@/lib/farm'
import { useTodayPlan } from '@/lib/convex/usePlan'
import { useState } from 'react'

export function DailyPlanButton() {
  const location = useLocation()
  const { briefOpen, setBriefOpen } = useBriefPanel()
  const { activeFarmId } = useFarmContext()
  const { plan, generatePlan } = useTodayPlan(activeFarmId || '')
  const [isOpening, setIsOpening] = useState(false)

  // Only show on the main GIS map route
  const isMapView = location.pathname === '/app' || location.pathname === '/app/'

  // Don't render if not on map view or no farm
  if (!isMapView || !activeFarmId) {
    return null
  }

  // Don't render if the panel is already open
  if (briefOpen) {
    return null
  }

  const handleOpenDailyPlan = async () => {
    if (!activeFarmId || isOpening) return
    setIsOpening(true)
    try {
      if (plan === null) {
        await generatePlan()
      }
      setBriefOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate today\'s plan.'
      toast.error(message)
    } finally {
      setIsOpening(false)
    }
  }

  const isApproved = plan?.status === 'approved' || plan?.status === 'modified'

  if (isApproved) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={handleOpenDailyPlan}
        disabled={isOpening}
        className="gap-1 h-6 text-xs bg-olive hover:bg-olive-bright"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        {isOpening ? 'Opening...' : 'Approved'}
      </Button>
    )
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleOpenDailyPlan}
      disabled={isOpening}
      className="gap-1 h-6 text-xs"
    >
      <Calendar className="h-3.5 w-3.5" />
      {isOpening ? 'Generating...' : 'Daily Plan'}
    </Button>
  )
}
