import { useState, useEffect, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FloatingPanel } from '@/components/ui/floating-panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WaterSource, WaterSourceType, WaterSourceStatus } from '@/lib/types'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface WaterSourceEditPanelProps {
  source: WaterSource
  open: boolean
  onDelete: (id: string) => void
  onClose: () => void
}

const waterSourceTypeOptions: { value: WaterSourceType; label: string }[] = [
  { value: 'trough', label: 'Trough' },
  { value: 'pond', label: 'Pond' },
  { value: 'dam', label: 'Dam' },
  { value: 'tank', label: 'Tank' },
  { value: 'stream', label: 'Stream' },
  { value: 'other', label: 'Other' },
]

const statusOptions: { value: WaterSourceStatus; label: string; description: string }[] = [
  { value: 'active', label: 'Active', description: 'Currently available and functioning' },
  { value: 'seasonal', label: 'Seasonal', description: 'Available during certain seasons only' },
  { value: 'maintenance', label: 'Maintenance', description: 'Temporarily unavailable for repairs' },
  { value: 'dry', label: 'Dry', description: 'Currently empty or unavailable' },
]

const statusStyles: Record<WaterSourceStatus, { bg: string; border: string; text: string }> = {
  active: { bg: 'bg-olive/10', border: 'border-olive/20', text: 'text-olive' },
  seasonal: { bg: 'bg-terracotta-muted/10', border: 'border-terracotta-muted/20', text: 'text-terracotta-muted' },
  maintenance: { bg: 'bg-terracotta/10', border: 'border-terracotta/20', text: 'text-terracotta' },
  dry: { bg: 'bg-terracotta/10', border: 'border-terracotta/20', text: 'text-terracotta' },
}

export function WaterSourceEditPanel({
  source,
  open,
  onDelete,
  onClose,
}: WaterSourceEditPanelProps) {
  const { label, format } = useAreaUnit()
  const [name, setName] = useState(source.name)
  const [type, setType] = useState<WaterSourceType>(source.type)
  const [status, setStatus] = useState<WaterSourceStatus>(source.status ?? 'active')
  const [description, setDescription] = useState(source.description ?? '')

  useEffect(() => {
    setName(source.name)
    setType(source.type)
    setStatus(source.status ?? 'active')
    setDescription(source.description ?? '')
  }, [source.id, source.name, source.type, source.status, source.description])

  const typeLabel = useMemo(
    () => waterSourceTypeOptions.find((opt) => opt.value === type)?.label ?? 'Select type',
    [type]
  )

  const statusLabel = useMemo(
    () => statusOptions.find((opt) => opt.value === status)?.label ?? 'Select status',
    [status]
  )

  const statusInfo = useMemo(
    () => statusOptions.find((opt) => opt.value === status),
    [status]
  )

  const currentStatusStyles = statusStyles[status] ?? statusStyles.active

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this water source?')) {
      onDelete(source.id)
    }
  }

  return (
    <FloatingPanel
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Edit Water Source"
      subtitle={source.geometryType === 'point' ? 'Point marker' : 'Area'}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter source name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Type</label>
          <Select value={type} onValueChange={(value) => setType(value as WaterSourceType)}>
            <SelectTrigger className="w-full">
              <SelectValue>{typeLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {waterSourceTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Status</label>
          <Select value={status} onValueChange={(value) => setStatus(value as WaterSourceStatus)}>
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

        {source.geometryType === 'polygon' && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Area ({label})</label>
            <Input
              type="text"
              value={source.area != null ? format(source.area, 2) : 'N/A'}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Auto-calculated from boundary</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Description</label>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes about this water source..."
          />
        </div>

        <div className={`rounded-lg ${currentStatusStyles.bg} border ${currentStatusStyles.border} p-3`}>
          <p className={`text-sm font-medium ${currentStatusStyles.text}`}>
            Status: {statusInfo?.label ?? 'Active'}
          </p>
          <p className={`text-xs ${currentStatusStyles.text} mt-1`}>
            {statusInfo?.description ?? 'Currently available and functioning'}
          </p>
          <p className="text-xs text-cobalt mt-2">
            Water sources are factored into grazing recommendations to ensure livestock have adequate access.
          </p>
        </div>

      </div>

      {/* Fixed footer */}
      <div className="border-t p-4">
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete Water Source
        </Button>
      </div>
    </FloatingPanel>
  )
}
