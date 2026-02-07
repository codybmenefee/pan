import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'
import { cn } from '@/lib/utils'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'

const QUICK_REASONS = [
  'Avoid wet/muddy area',
  'Better grass quality elsewhere',
  'Water access issue',
  'Fence line adjustment',
  'Terrain/slope concern',
  'Shade/shelter preference',
  'Previous day impact',
  'Other',
] as const

interface PaddockModificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  originalAreaHectares: number
  modifiedAreaHectares: number
  originalGeometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  modifiedGeometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  onComplete: () => void
  userId?: string
}

export function PaddockModificationDialog({
  open,
  onOpenChange,
  planId,
  originalAreaHectares,
  modifiedAreaHectares,
  originalGeometry,
  modifiedGeometry,
  onComplete,
  userId,
}: PaddockModificationDialogProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [rationale, setRationale] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { format } = useAreaUnit()
  const recordModification = useMutation(api.intelligence.recordPaddockModification)

  const areaChange = modifiedAreaHectares - originalAreaHectares
  const areaChangePercent = originalAreaHectares > 0
    ? Math.round((areaChange / originalAreaHectares) * 100)
    : 0

  const toggleReason = useCallback((reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    )
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await recordModification({
        planId: planId as Id<'plans'>,
        originalGeometry,
        modifiedGeometry,
        originalAreaHectares,
        modifiedAreaHectares,
        rationale: rationale.trim() || undefined,
        quickReasons: selectedReasons.length > 0 ? selectedReasons : undefined,
        modifiedBy: userId,
      })
      onComplete()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    recordModification,
    planId,
    originalGeometry,
    modifiedGeometry,
    originalAreaHectares,
    modifiedAreaHectares,
    rationale,
    selectedReasons,
    userId,
    onComplete,
    onOpenChange,
  ])

  const handleSkip = useCallback(async () => {
    setIsSubmitting(true)
    try {
      // Record modification without rationale
      await recordModification({
        planId: planId as Id<'plans'>,
        originalGeometry,
        modifiedGeometry,
        originalAreaHectares,
        modifiedAreaHectares,
        modifiedBy: userId,
      })
      onComplete()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    recordModification,
    planId,
    originalGeometry,
    modifiedGeometry,
    originalAreaHectares,
    modifiedAreaHectares,
    userId,
    onComplete,
    onOpenChange,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Paddock Modified</DialogTitle>
          <DialogDescription>
            Help improve future AI suggestions by sharing why you changed the grazing area.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Area comparison */}
          <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">AI Suggested</div>
              <div className="font-medium">{format(originalAreaHectares)}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Your Change</div>
              <div className="font-medium">{format(modifiedAreaHectares)}</div>
            </div>
            {areaChange !== 0 && (
              <Badge
                variant={areaChange > 0 ? 'default' : 'secondary'}
                className="ml-2 gap-1"
              >
                {areaChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {areaChangePercent > 0 ? '+' : ''}{areaChangePercent}%
              </Badge>
            )}
          </div>

          {/* Quick reasons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Why did you make this change?
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((reason) => (
                <Badge
                  key={reason}
                  variant={selectedReasons.includes(reason) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedReasons.includes(reason)
                      ? ''
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => toggleReason(reason)}
                >
                  {reason}
                </Badge>
              ))}
            </div>
          </div>

          {/* Free-form rationale */}
          <div className="space-y-2">
            <label htmlFor="rationale" className="text-sm font-medium">
              Additional details (optional)
            </label>
            <Textarea
              id="rationale"
              placeholder="Any other context that might help improve future suggestions..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
