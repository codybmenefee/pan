import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlanModifyViewProps {
  paddockName: string
  onSave: (feedback: string) => void
  onCancel: () => void
}

const quickReasons = [
  'Too small',
  'Too large',
  'Wrong location',
  'Water access',
  'Infrastructure',
  'Weather concern',
]

export function PlanModifyView({ paddockName, onSave, onCancel }: PlanModifyViewProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    const feedback = [selectedReason, notes].filter(Boolean).join(': ')
    onSave(feedback || 'Section adjusted')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b">
        <button
          onClick={onCancel}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-sm font-semibold">Modify Section</h2>
          <p className="text-xs text-muted-foreground">{paddockName}</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Instructions */}
        <div className="rounded-md border border-border bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            Drag section vertices on the map to adjust the grazing area.
          </p>
        </div>

        {/* Quick reasons */}
        <div>
          <p className="text-sm font-medium mb-2">Reason for change (optional)</p>
          <div className="grid grid-cols-2 gap-2">
            {quickReasons.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(selectedReason === reason ? null : reason)}
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
          <label className="text-sm font-medium">Additional notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the adjustment needed..."
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
          />
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-10 border-t bg-background p-3">
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1 h-9 text-sm">
            Save Changes
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1 h-9 text-sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
