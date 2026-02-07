import { useState, useCallback, useEffect } from 'react'
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
import { cn } from '@/lib/utils'

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

interface FeedbackEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modificationId: string
  initialRationale?: string
  initialQuickReasons?: string[]
  onSaved?: () => void
}

export function FeedbackEditDialog({
  open,
  onOpenChange,
  modificationId,
  initialRationale,
  initialQuickReasons,
  onSaved,
}: FeedbackEditDialogProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>(initialQuickReasons ?? [])
  const [rationale, setRationale] = useState(initialRationale ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFeedback = useMutation(api.intelligence.updatePaddockModificationFeedback)

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setSelectedReasons(initialQuickReasons ?? [])
      setRationale(initialRationale ?? '')
    }
  }, [open, initialQuickReasons, initialRationale])

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
      await updateFeedback({
        modificationId: modificationId as Id<'sectionModifications'>,
        rationale: rationale.trim() || undefined,
        quickReasons: selectedReasons.length > 0 ? selectedReasons : undefined,
      })
      onSaved?.()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }, [updateFeedback, modificationId, rationale, selectedReasons, onSaved, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Feedback</DialogTitle>
          <DialogDescription>
            Update your feedback for this paddock modification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
