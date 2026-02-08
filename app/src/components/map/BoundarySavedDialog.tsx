import { Satellite } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useFarmContext } from '@/lib/farm'
import { useSatelliteAnimation } from '@/lib/satellite-animation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface BoundarySavedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BoundarySavedDialog({ open, onOpenChange }: BoundarySavedDialogProps) {
  const { activeFarmId } = useFarmContext()
  const { triggerCollapseAnimation } = useSatelliteAnimation()
  const createJob = useMutation(api.satelliteFetchJobs.createForBoundaryUpdate)

  const handleRefresh = async () => {
    if (activeFarmId) {
      await createJob({
        farmExternalId: activeFarmId,
        provider: 'sentinel2',
      })
    }
    // Trigger animation before closing dialog
    triggerCollapseAnimation()
    onOpenChange(false)
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-olive/10">
              <Satellite className="h-5 w-5 text-olive" />
            </div>
            <div>
              <DialogTitle>Boundary Updated</DialogTitle>
              <DialogDescription className="mt-1">
                Your farm boundary has been saved successfully.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Would you like to fetch the latest satellite imagery for the new boundary?
            This will process Sentinel-2 data and may take a few minutes.
          </p>
        </div>
        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={handleRefresh} className="gap-2">
            <Satellite className="h-4 w-4" />
            Refresh Satellite Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
