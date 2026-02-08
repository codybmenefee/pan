import { useRef, useEffect } from 'react'
import { Satellite } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useFarmContext } from '@/lib/farm'
import { useSatelliteAnimation } from '@/lib/satellite-animation'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function SatelliteStatusIcon() {
  const { activeFarmId } = useFarmContext()
  const { showTooltip, registerTargetRef } = useSatelliteAnimation()
  const iconRef = useRef<HTMLDivElement>(null)

  // Register ref with animation context
  useEffect(() => {
    registerTargetRef(iconRef)
  }, [registerTargetRef])

  const activeJob = useQuery(
    api.satelliteFetchJobs.getActiveJob,
    activeFarmId ? { farmExternalId: activeFarmId } : 'skip'
  )

  // Don't render if no active job
  if (!activeJob) {
    return null
  }

  return (
    <Tooltip open={showTooltip || undefined}>
      <TooltipTrigger asChild>
        <div ref={iconRef} className="flex h-5 w-5 items-center justify-center">
          <Satellite className="h-3 w-3 text-cobalt animate-pulse" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Fetching satellite imagery. You'll be notified when ready.
      </TooltipContent>
    </Tooltip>
  )
}
