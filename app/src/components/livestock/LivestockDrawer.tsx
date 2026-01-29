import { useState, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useLivestock } from '@/lib/convex/useLivestock'
import { toast } from 'sonner'

interface LivestockDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LivestockFormState {
  cows: number
  calves: number
  sheep: number
  lambs: number
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

export function LivestockDrawer({ open, onOpenChange }: LivestockDrawerProps) {
  const { summary, upsertLivestock } = useLivestock()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<LivestockFormState>({
    cows: 0,
    calves: 0,
    sheep: 0,
    lambs: 0,
  })

  // Initialize form from summary when drawer opens
  useEffect(() => {
    if (open && summary) {
      setForm({
        cows: summary.cows,
        calves: summary.calves,
        sheep: summary.sheep,
        lambs: summary.lambs,
      })
    }
  }, [open, summary])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save cattle if any values are set
      if (form.cows > 0 || form.calves > 0) {
        await upsertLivestock({
          animalType: 'cow',
          adultCount: form.cows,
          offspringCount: form.calves,
        })
      }

      // Save sheep if any values are set
      if (form.sheep > 0 || form.lambs > 0) {
        await upsertLivestock({
          animalType: 'sheep',
          adultCount: form.sheep,
          offspringCount: form.lambs,
        })
      }

      toast.success('Livestock updated')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save livestock:', error)
      toast.error('Failed to save livestock')
    } finally {
      setSaving(false)
    }
  }

  const updateForm = (key: keyof LivestockFormState, value: number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" width={320}>
        <DrawerHeader>
          <DrawerTitle>Manage Livestock</DrawerTitle>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-6">
            {/* Cattle Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Cattle</h3>
              <NumberInput
                label="Cows"
                value={form.cows}
                onChange={(v) => updateForm('cows', v)}
              />
              <NumberInput
                label="Calves"
                value={form.calves}
                onChange={(v) => updateForm('calves', v)}
              />
            </div>

            <Separator />

            {/* Sheep Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Sheep</h3>
              <NumberInput
                label="Ewes"
                value={form.sheep}
                onChange={(v) => updateForm('sheep', v)}
              />
              <NumberInput
                label="Lambs"
                value={form.lambs}
                onChange={(v) => updateForm('lambs', v)}
              />
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
