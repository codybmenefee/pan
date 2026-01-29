import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Paddock, PaddockStatus } from '@/lib/types'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface PaddockPanelProps {
  paddock: Paddock
  onClose: () => void
}

const statusLabels: Record<PaddockStatus, string> = {
  ready: 'Ready',
  almost_ready: 'Almost Ready',
  recovering: 'Recovering',
  grazed: 'Recently Grazed',
}

const statusColors: Record<PaddockStatus, string> = {
  ready: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  almost_ready: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  recovering: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  grazed: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
}

export function PaddockPanel({ paddock, onClose }: PaddockPanelProps) {
  const { format } = useAreaUnit()

  return (
    <aside className="w-80 border-l border-border bg-card p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-lg">{paddock.name}</h2>
          <p className="text-sm text-muted-foreground">
            Paddock {paddock.id.replace('p', '')}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Status badge */}
      <Badge variant="outline" className={statusColors[paddock.status]}>
        {statusLabels[paddock.status]}
      </Badge>

      <Separator className="my-4" />

      {/* Metrics */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">NDVI</p>
            <p className="text-lg font-semibold">{paddock.ndvi.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Rest</p>
            <p className="text-lg font-semibold">{paddock.restDays} days</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Area</p>
            <p className="text-sm font-medium">{format(paddock.area)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Grazed</p>
            <p className="text-sm font-medium">{paddock.lastGrazed}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Water Access</p>
          <p className="text-sm font-medium">{paddock.waterAccess}</p>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Actions */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start" disabled>
          View History
        </Button>
        <Button variant="outline" className="w-full justify-start" disabled>
          Log Grazing Event
        </Button>
      </div>
    </aside>
  )
}
