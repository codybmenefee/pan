import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GrassQualityBadge } from './GrassQualityBadge'
import { DaysRemainingIndicator } from './DaysRemainingIndicator'
import { ExpandableReasoning } from './ExpandableReasoning'
import { PastureMiniMap } from './PastureMiniMap'
import type { Pasture, Paddock } from '@/lib/types'
import type { GrassQuality } from '@/lib/grassQuality'
import { getGrassQuality } from '@/lib/grassQuality'
import { MapPin } from 'lucide-react'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface BriefCardProps {
  currentPastureId: string
  pasture: Pasture
  onApprove: () => void
  onReject: () => void
  // Paddock-specific props
  paddock?: Paddock
  daysInCurrentPasture?: number
  totalDaysPlanned?: number
  previousPaddocks?: Paddock[]
  // Computed props for simplified display
  grassQuality?: GrassQuality
  summaryReason?: string
  reasoningDetails?: string[]
  // Hide action buttons (for sticky footer pattern)
  hideActions?: boolean
}

export function BriefCard({
  currentPastureId,
  pasture,
  onApprove,
  onReject,
  paddock,
  daysInCurrentPasture = 1,
  totalDaysPlanned = 4,
  previousPaddocks = [],
  grassQuality,
  summaryReason,
  reasoningDetails = [],
  hideActions = false,
}: BriefCardProps) {
  const { format } = useAreaUnit()
  const daysRemaining = totalDaysPlanned - daysInCurrentPasture

  // Use provided grassQuality or compute from NDVI
  const quality = grassQuality ?? getGrassQuality(pasture.ndvi)

  // Generate summary from reasoning if not provided
  const summary = summaryReason ?? `Best forage available after ${pasture.restDays} days rest`

  return (
    <Card className="overflow-hidden !p-0 !gap-0">
      {/* Tier 1: Stats Row */}
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
            <DaysRemainingIndicator daysRemaining={daysRemaining} />
            <span className="text-muted-foreground/50">-</span>
            <span>{paddock ? format(paddock.targetArea) : format(pasture.area)} paddock</span>
          </div>
        </div>
      </div>

      {/* Tier 2: Expandable Reasoning */}
      <ExpandableReasoning
        summary={summary}
        details={reasoningDetails}
      />

      {/* Tier 3: Action Footer */}
      {!hideActions && (
        <div className="p-3 border-t border-border bg-muted/20">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onReject}
              className="flex-1 h-9"
            >
              Reject
            </Button>
            <Button
              onClick={onApprove}
              className="flex-1 h-9"
            >
              Approve
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
