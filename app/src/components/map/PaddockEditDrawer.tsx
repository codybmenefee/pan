import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FloatingPanel } from '@/components/ui/floating-panel'
import type { Paddock, PaddockStatus } from '@/lib/types'
import { useGeometry } from '@/lib/geometry'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface PaddockEditDrawerProps {
  paddock: Paddock
  open: boolean
  onClose: () => void
}

interface PaddockFormState {
  name: string
  status: PaddockStatus
  ndvi: number
  restDays: number
  area: number
  waterAccess: string
  lastGrazed: string
}

const statusOptions: { value: PaddockStatus; label: string }[] = [
  { value: 'ready', label: 'Ready' },
  { value: 'almost_ready', label: 'Almost Ready' },
  { value: 'recovering', label: 'Recovering' },
  { value: 'grazed', label: 'Recently Grazed' },
]

function buildFormState(paddock: Paddock): PaddockFormState {
  return {
    name: paddock.name,
    status: paddock.status,
    ndvi: paddock.ndvi,
    restDays: paddock.restDays,
    area: paddock.area,
    waterAccess: paddock.waterAccess,
    lastGrazed: paddock.lastGrazed,
  }
}

export function PaddockEditDrawer({ paddock, open, onClose }: PaddockEditDrawerProps) {
  const { deletePaddock } = useGeometry()
  const { label } = useAreaUnit()
  const [form, setForm] = useState<PaddockFormState>(() => buildFormState(paddock))
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [lastPaddockId, setLastPaddockId] = useState(paddock.id)

  // Reset form when paddock changes
  if (paddock.id !== lastPaddockId) {
    setLastPaddockId(paddock.id)
    setForm(buildFormState(paddock))
  }

  const statusLabel = useMemo(
    () => statusOptions.find((option) => option.value === form.status)?.label ?? 'Select status',
    [form.status]
  )

  const handleDelete = () => {
    deletePaddock(paddock.id)
    setDeleteDialogOpen(false)
    onClose()
  }

  return (
    <>
      <FloatingPanel
        open={open}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        title={`Edit ${paddock.name}`}
        subtitle={`Paddock ${paddock.id.replace('p', '')}`}
        defaultWidth={340}
        defaultHeight={520}
        minWidth={300}
        maxWidth={450}
        minHeight={400}
        initialPosition={{ x: typeof window !== 'undefined' ? window.innerWidth - 360 : 800, y: 64 }}
      >
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Name</label>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Status</label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as PaddockStatus }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{statusLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">NDVI</label>
              <Input
                type="number"
                min={-1}
                max={1}
                step={0.01}
                value={Number.isNaN(form.ndvi) ? '' : form.ndvi}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    ndvi: Number.isNaN(event.target.valueAsNumber) ? prev.ndvi : event.target.valueAsNumber,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Rest Days</label>
              <Input
                type="number"
                min={0}
                step={1}
                value={Number.isNaN(form.restDays) ? '' : form.restDays}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    restDays: Number.isNaN(event.target.valueAsNumber) ? prev.restDays : event.target.valueAsNumber,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Area ({label})</label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={Number.isNaN(form.area) ? '' : form.area}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    area: Number.isNaN(event.target.valueAsNumber) ? prev.area : event.target.valueAsNumber,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Last Grazed</label>
              <Input
                type="text"
                value={form.lastGrazed}
                onChange={(event) => setForm((prev) => ({ ...prev, lastGrazed: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Water Access</label>
            <Textarea
              rows={2}
              value={form.waterAccess}
              onChange={(event) => setForm((prev) => ({ ...prev, waterAccess: event.target.value }))}
            />
          </div>
        </div>

        {/* Fixed footer */}
        <div className="border-t p-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Paddock
          </Button>
        </div>
      </FloatingPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Paddock</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{paddock.name}"? This action cannot be undone.
              All sections within this paddock will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
