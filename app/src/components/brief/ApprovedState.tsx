import { Check, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { GrassQualityBadge } from './GrassQualityBadge'
import { PastureMiniMap } from './PastureMiniMap'
import type { Pasture, Paddock } from '@/lib/types'
import type { GrassQuality } from '@/lib/grassQuality'
import { getGrassQuality } from '@/lib/grassQuality'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface ApprovedStateProps {
  pasture: Pasture
  currentPastureId: string
  approvedAt: string
  wasModified?: boolean
  // Paddock-specific props
  paddock?: Paddock
  daysInCurrentPasture?: number
  totalDaysPlanned?: number
  previousPaddocks?: Paddock[]
  // Computed props for simplified display
  grassQuality?: GrassQuality
  summaryReason?: string
}

export function ApprovedState({
  pasture,
  currentPastureId,
  approvedAt,
  wasModified,
  paddock,
  daysInCurrentPasture = 1,
  totalDaysPlanned = 4,
  previousPaddocks = [],
  grassQuality,
  summaryReason,
}: ApprovedStateProps) {
  const { format } = useAreaUnit()
  const daysRemaining = totalDaysPlanned - daysInCurrentPasture

  // Use provided grassQuality or compute from NDVI
  const quality = grassQuality ?? getGrassQuality(pasture.ndvi)

  // Generate summary from reasoning if not provided
  const summary = summaryReason ?? `Best forage available after ${pasture.restDays} days rest`

  // Days remaining text
  const daysText = daysRemaining === 0
    ? 'Last day'
    : daysRemaining === 1
      ? 'Move tomorrow'
      : `Move in ${daysRemaining} days`

  return (
    <div className="h-full overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Success banner */}
      <div className="flex items-center gap-2 rounded-md border border-olive/20 bg-olive/10 p-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-olive shrink-0">
          <Check className="h-3 w-3 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-olive">
            {wasModified ? 'Plan modified' : 'Plan approved'}
          </p>
          <p className="text-[10px] text-muted-foreground">at {approvedAt}</p>
        </div>
      </div>

      {/* Main card with same layout as BriefCard */}
      <Card className="overflow-hidden !p-0 !gap-0">
        {/* Stats Row */}
        <div className="p-3 flex items-center gap-3">
          {/* Map Thumbnail - 64x64px */}
          <div className="shrink-0 w-16 h-16">
            <PastureMiniMap
              currentPastureId={currentPastureId}
              targetPastureId={pasture.id}
              paddock={paddock}
              previousPaddocks={previousPaddocks}
              size="sm"
              className="!w-16 !h-16 !rounded-md"
            />
          </div>

          {/* Pasture Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-sm truncate">{pasture.name}</span>
              <GrassQualityBadge quality={quality} className="shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{daysText}</span>
              <span className="text-muted-foreground/50">-</span>
              <span>{paddock ? format(paddock.targetArea) : format(pasture.area)} paddock</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="px-3 pb-3 border-t border-border pt-2">
          <p className="text-xs font-medium text-foreground mb-0.5">Why this pasture?</p>
          <p className="text-xs text-muted-foreground">{summary}</p>
        </div>
      </Card>
    </div>
  )
}
