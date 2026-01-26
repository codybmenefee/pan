import { Satellite, Loader2 } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useFarmContext } from '@/lib/farm'

export function SatelliteFetchBanner() {
  const { activeFarmId } = useFarmContext()

  const activeJob = useQuery(
    api.satelliteFetchJobs.getActiveJob,
    activeFarmId ? { farmExternalId: activeFarmId } : 'skip'
  )

  // Don't render if no active job
  if (!activeJob) {
    return null
  }

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        <Satellite className="h-4 w-4" />
        <span>Fetching new satellite imagery...</span>
        <span className="text-blue-200">You'll be notified when ready</span>
      </div>
    </div>
  )
}
