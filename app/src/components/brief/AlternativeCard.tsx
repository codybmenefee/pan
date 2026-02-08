import { Card, CardContent } from '@/components/ui/card'
import { ConfidenceBar } from './ConfidenceBar'
import { PastureMiniMap } from './PastureMiniMap'
import type { Pasture } from '@/lib/types'

interface AlternativeCardProps {
  pasture: Pasture
  confidence: number
  currentPastureId?: string
}

export function AlternativeCard({ pasture, confidence, currentPastureId }: AlternativeCardProps) {
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Mini map showing this alternative's location */}
          {currentPastureId && (
            <div className="flex-shrink-0">
              <PastureMiniMap
                currentPastureId={currentPastureId}
                targetPastureId={pasture.id}
                size="sm"
                className="w-16 h-16"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <p className="font-medium truncate">{pasture.name}</p>
              <p className="text-xs text-muted-foreground">
                Pasture {pasture.id.replace('p', '')}
              </p>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{confidence}%</span>
              </div>
              <ConfidenceBar value={confidence} />
            </div>

            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>NDVI {pasture.ndvi.toFixed(2)}</span>
              <span>{pasture.restDays}d</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
