import { createPortal } from 'react-dom'
import { Pentagon, Ban, Droplet, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DragEntityType = 'paddock' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'

interface DragPreviewProps {
  type: DragEntityType
  position: { x: number; y: number }
  isOverMap: boolean
}

const entityConfig: Record<DragEntityType, {
  icon: typeof Pentagon
  label: string
  colorClass: string
  bgClass: string
}> = {
  paddock: {
    icon: Pentagon,
    label: 'Paddock',
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10 border-green-500/30',
  },
  noGrazeZone: {
    icon: Ban,
    label: 'No-graze Zone',
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10 border-red-500/30',
  },
  waterPoint: {
    icon: MapPin,
    label: 'Water Marker',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10 border-blue-500/30',
  },
  waterPolygon: {
    icon: Droplet,
    label: 'Water Area',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10 border-blue-500/30',
  },
}

export function DragPreview({ type, position, isOverMap }: DragPreviewProps) {
  const config = entityConfig[type]
  const Icon = config.icon

  return createPortal(
    <div
      className={cn(
        'fixed pointer-events-none z-[9999] transition-transform duration-75',
        isOverMap ? 'scale-100' : 'scale-90 opacity-75'
      )}
      style={{
        left: position.x + 12,
        top: position.y + 12,
      }}
    >
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg backdrop-blur-sm',
          'bg-card/95',
          config.bgClass
        )}
      >
        <Icon className={cn('h-4 w-4', config.colorClass)} />
        <span className="text-sm font-medium whitespace-nowrap">{config.label}</span>
      </div>
      {isOverMap && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-card/95 px-2 py-0.5 rounded shadow-sm">
          Release to place
        </div>
      )}
    </div>,
    document.body
  )
}
