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
import type { NoGrazeZone, NoGrazeZoneType } from '@/lib/types'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface NoGrazeEditPanelProps {
  zone: NoGrazeZone
  open: boolean
  onDelete: (id: string) => void
  onClose: () => void
}

const typeOptions: { value: NoGrazeZoneType; label: string; description: string; color: string }[] = [
  { value: 'environmental', label: 'Environmental', description: 'Wetlands, riparian areas, native vegetation', color: 'green' },
  { value: 'hazard', label: 'Hazard', description: 'Steep terrain, sinkholes, contamination', color: 'orange' },
  { value: 'infrastructure', label: 'Infrastructure', description: 'Buildings, roads, equipment', color: 'gray' },
  { value: 'protected', label: 'Protected', description: 'Wildlife corridors, conservation areas', color: 'purple' },
  { value: 'other', label: 'Other', description: 'Other exclusion reason', color: 'red' },
]

const typeInfoStyles: Record<string, { bg: string; border: string; text: string }> = {
  environmental: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-600 dark:text-green-400' },
  hazard: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  infrastructure: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-600 dark:text-gray-400' },
  protected: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  other: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600 dark:text-red-400' },
}

export function NoGrazeEditPanel({ zone, open, onDelete, onClose }: NoGrazeEditPanelProps) {
  const { label, format } = useAreaUnit()
  const [name, setName] = useState(zone.name)
  const [type, setType] = useState<NoGrazeZoneType>(zone.type)
  const [description, setDescription] = useState(zone.description ?? '')

  // Debug: Log mount/update
  useEffect(() => {
    console.log('[NoGrazeEditPanel] Mounted/updated:', { zoneId: zone.id, name: zone.name, type: zone.type })
    return () => {
      console.log('[NoGrazeEditPanel] Unmounting:', { zoneId: zone.id })
    }
  }, [zone.id, zone.name, zone.type])

  useEffect(() => {
    setName(zone.name)
    setType(zone.type)
    setDescription(zone.description ?? '')
  }, [zone.id, zone.name, zone.type, zone.description])

  const typeLabel = useMemo(
    () => typeOptions.find((opt) => opt.value === type)?.label ?? 'Select type',
    [type]
  )

  const typeInfo = useMemo(
    () => typeOptions.find((opt) => opt.value === type),
    [type]
  )

  const infoStyles = typeInfoStyles[type] ?? typeInfoStyles.other

  const handleDelete = () => {
    console.log('[NoGrazeEditPanel] Delete clicked:', { zoneId: zone.id })
    if (confirm('Are you sure you want to delete this no-graze zone?')) {
      console.log('[NoGrazeEditPanel] Delete confirmed, calling onDelete:', { zoneId: zone.id })
      onDelete(zone.id)
    } else {
      console.log('[NoGrazeEditPanel] Delete cancelled by user')
    }
  }

  return (
    <FloatingPanel
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Edit No-graze Zone"
      subtitle="Exclusion area"
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
            placeholder="Enter zone name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Type</label>
          <Select value={type} onValueChange={(value) => setType(value as NoGrazeZoneType)}>
            <SelectTrigger className="w-full">
              <SelectValue>{typeLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Area ({label})</label>
          <Input
            type="text"
            value={format(zone.area, 2)}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Auto-calculated from boundary</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Description</label>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes about this zone..."
          />
        </div>

        <div className={`rounded-lg ${infoStyles.bg} border ${infoStyles.border} p-3`}>
          <p className={`text-sm font-medium ${infoStyles.text}`}>
            {typeInfo?.label ?? 'Other'}
          </p>
          <p className={`text-xs ${infoStyles.text} mt-1`}>
            {typeInfo?.description ?? 'This zone will be excluded from grazing recommendations.'}
          </p>
          <p className={`text-xs ${infoStyles.text} mt-2`}>
            Collars will receive alerts when animals enter this area.
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
          Delete Zone
        </Button>
      </div>
    </FloatingPanel>
  )
}
