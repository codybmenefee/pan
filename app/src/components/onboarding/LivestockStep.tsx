import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export interface LivestockData {
  cows: number
  calves: number
  sheep: number
  lambs: number
}

interface LivestockStepProps {
  onNext: (data: LivestockData) => void
  onBack: () => void
  onSkip: () => void
  initialData?: LivestockData
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm">{label}</label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          type="number"
          min={min}
          value={value}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10)
            if (!isNaN(val) && val >= min) {
              onChange(val)
            }
          }}
          className="w-16 h-7 text-center text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function LivestockStep({
  onNext,
  onBack,
  onSkip,
  initialData,
}: LivestockStepProps) {
  const [formData, setFormData] = useState<LivestockData>(
    initialData || {
      cows: 0,
      calves: 0,
      sheep: 0,
      lambs: 0,
    }
  )

  const updateForm = (key: keyof LivestockData, value: number) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext(formData)
  }

  const hasAnyLivestock =
    formData.cows > 0 ||
    formData.calves > 0 ||
    formData.sheep > 0 ||
    formData.lambs > 0

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>How much livestock do you have?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cattle Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Cattle</h3>
            <NumberInput
              label="Cows"
              value={formData.cows}
              onChange={(v) => updateForm('cows', v)}
            />
            <NumberInput
              label="Calves"
              value={formData.calves}
              onChange={(v) => updateForm('calves', v)}
            />
          </div>

          <Separator />

          {/* Sheep Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Sheep</h3>
            <NumberInput
              label="Ewes"
              value={formData.sheep}
              onChange={(v) => updateForm('sheep', v)}
            />
            <NumberInput
              label="Lambs"
              value={formData.lambs}
              onChange={(v) => updateForm('lambs', v)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            You can always update these numbers later in Settings.
          </p>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
              <Button type="submit">
                {hasAnyLivestock ? 'Continue' : 'Continue without livestock'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
