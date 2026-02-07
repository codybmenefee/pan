import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { PastureAlternative } from '@/lib/types'
import { useGeometry } from '@/lib/geometry'

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alternatives: PastureAlternative[]
  onSubmit: (alternativePastureId: string) => void
}

const quickReasons = [
  'Infrastructure issue',
  'Water access problem',
  'Weather concern',
  'Prefer different pasture',
]

export function FeedbackModal({ open, onOpenChange, alternatives, onSubmit }: FeedbackModalProps) {
  const { getPastureById } = useGeometry()
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [selectedPasture, setSelectedPasture] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (selectedPasture) {
      onSubmit(selectedPasture)
    }
    // Reset state
    setSelectedReason(null)
    setSelectedPasture(null)
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modify Today's Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick reasons */}
          <div>
            <p className="text-sm font-medium mb-3">What's the issue with the recommendation?</p>
            <div className="grid grid-cols-2 gap-2">
              {quickReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                    selectedReason === reason
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Additional context (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gate on east side needs repair..."
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>

          {/* Alternative selection */}
          <div>
            <p className="text-sm font-medium mb-3">Select alternative</p>
            <div className="space-y-2">
              {alternatives.map((alt) => {
                const pasture = getPastureById(alt.pastureId)
                if (!pasture) return null
                return (
                  <button
                    key={alt.pastureId}
                    onClick={() => setSelectedPasture(alt.pastureId)}
                    className={`w-full flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors ${
                      selectedPasture === alt.pastureId
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{pasture.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Pasture {pasture.id.replace('p', '')}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {alt.confidence}% confidence
                    </span>
                  </button>
                )
              })}
              <button
                onClick={() => setSelectedPasture('skip')}
                className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
                  selectedPasture === 'skip'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium">Skip today</p>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedPasture}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
