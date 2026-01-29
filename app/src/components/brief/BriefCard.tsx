import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { ConfidenceBar } from './ConfidenceBar'
import type { Paddock, Section, SectionAlternative } from '@/lib/types'
import { MapPin, ChevronDown, ChevronUp, ArrowRight, Focus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGeometry } from '@/lib/geometry'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface BriefCardProps {
  currentPaddockId: string
  paddock: Paddock
  confidence: number
  reasoning: string[]
  onApprove: () => void
  onModify: () => void
  // Section-specific props
  section?: Section
  daysInCurrentPaddock?: number
  totalDaysPlanned?: number
  isPaddockTransition?: boolean
  previousSections?: Section[]
  // Section alternatives
  sectionAlternatives?: SectionAlternative[]
  // New props from agent
  sectionJustification?: string
  paddockGrazedPercentage?: number
  // Zoom to section on main map
  onZoomToSection?: (geometry: GeoJSON.Geometry) => void
  // Hide action buttons (for sticky footer pattern)
  hideActions?: boolean
}

export function BriefCard({
  currentPaddockId,
  paddock,
  confidence,
  reasoning,
  onApprove,
  onModify,
  section,
  daysInCurrentPaddock = 1,
  totalDaysPlanned = 4,
  isPaddockTransition = false,
  previousSections = [],
  sectionAlternatives = [],
  sectionJustification,
  paddockGrazedPercentage,
  onZoomToSection,
  hideActions = false,
}: BriefCardProps) {
  const { getPaddockById } = useGeometry()
  const { format } = useAreaUnit()
  const currentPaddock = getPaddockById(currentPaddockId)
  const daysRemaining = totalDaysPlanned - daysInCurrentPaddock
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [selectedAlternative, setSelectedAlternative] = useState<SectionAlternative | null>(null)

  // Active section is either the selected alternative or the recommended section
  const activeSection = selectedAlternative ? {
    ...section!,
    geometry: selectedAlternative.geometry,
    targetArea: selectedAlternative.targetArea,
  } : section

  const activeConfidence = selectedAlternative ? selectedAlternative.confidence : confidence

  return (
    <Card className="overflow-hidden !p-0 !gap-0">
      {/* Header section */}
      <div className="p-2 xl:p-3 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <p className="text-[10px] xl:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isPaddockTransition ? 'Paddock Transition' : 'Today\'s Section'}
            </p>
            <CardTitle className="mt-0.5 text-sm xl:text-base">
              {isPaddockTransition ? (
                <span className="flex items-center gap-1">
                  <span>Transition to {paddock.name}</span>
                  <ArrowRight className="h-3 w-3 xl:h-3.5 xl:w-3.5 text-muted-foreground" />
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 xl:h-3.5 xl:w-3.5 text-primary" />
                  <span>{paddock.name}</span>
                </span>
              )}
            </CardTitle>
            <p className="text-xs xl:text-sm text-muted-foreground">
              {isPaddockTransition ? (
                currentPaddock ? `Rotation complete in ${currentPaddock.name}` : 'Starting new rotation'
              ) : (
                `Day ${daysInCurrentPaddock} of ${totalDaysPlanned} in this paddock`
              )}
            </p>
          </div>
          {onZoomToSection && activeSection && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onZoomToSection(activeSection.geometry.geometry)}
              className="shrink-0 gap-1 h-6 text-[10px]"
            >
              <Focus className="h-3 w-3" />
              <span className="hidden sm:inline">View on Map</span>
            </Button>
          )}
        </div>
      </div>
      <CardContent className="space-y-2 xl:space-y-3 py-2 xl:py-3">
        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs xl:text-sm font-medium">Confidence</span>
            <span className="text-xs xl:text-sm font-semibold">{activeConfidence}%</span>
          </div>
          <ConfidenceBar value={activeConfidence} />
          {selectedAlternative && (
            <p className="text-[10px] xl:text-xs text-[#F4D47C] mt-0.5">
              Using alternative section - {selectedAlternative.reasoning}
            </p>
          )}
        </div>

        {/* Key metrics - section-aware */}
        <div className="grid grid-cols-2 gap-1 xl:gap-1.5 sm:grid-cols-4 text-[10px] xl:text-xs">
          {activeSection && (
            <div className="bg-muted/50 rounded-md p-1.5 xl:p-2">
              <span className="text-muted-foreground block text-[9px] xl:text-[10px] uppercase tracking-wide">Section</span>
              <span className="font-semibold text-xs xl:text-sm">{format(activeSection.targetArea)}</span>
            </div>
          )}
          <div className="bg-muted/50 rounded-md p-1.5 xl:p-2">
            <span className="text-muted-foreground block text-[9px] xl:text-[10px] uppercase tracking-wide">NDVI</span>
            <span className="font-semibold text-xs xl:text-sm">{paddock.ndvi.toFixed(2)}</span>
          </div>
          {!isPaddockTransition && (
            <div className="bg-muted/50 rounded-md p-1.5 xl:p-2">
              <span className="text-muted-foreground block text-[9px] xl:text-[10px] uppercase tracking-wide">Days Left</span>
              <span className="font-semibold text-xs xl:text-sm">{daysRemaining}</span>
            </div>
          )}
          <div className="bg-muted/50 rounded-md p-1.5 xl:p-2">
            <span className="text-muted-foreground block text-[9px] xl:text-[10px] uppercase tracking-wide">
              {isPaddockTransition ? 'Rest' : 'Coverage'}
            </span>
            <span className="font-semibold text-xs xl:text-sm">
              {isPaddockTransition
                ? `${paddock.restDays}d`
                : `${Math.round((daysInCurrentPaddock / totalDaysPlanned) * 100)}%`
              }
            </span>
          </div>
        </div>

        {/* Progress bar for section coverage */}
        {!isPaddockTransition && (
          <div>
            <div className="flex items-center justify-between mb-0.5 text-[10px] xl:text-xs text-muted-foreground">
              <span>Paddock coverage</span>
              <span>{previousSections.length + 1} of {totalDaysPlanned} sections</span>
            </div>
            <div className="h-1.5 xl:h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(daysInCurrentPaddock / totalDaysPlanned) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Reasoning */}
        <div>
          <p className="text-xs xl:text-sm font-medium mb-1">
            {isPaddockTransition ? 'Why transition now?' : 'Why this section?'}
          </p>
          <ul className="space-y-0.5 xl:space-y-1">
            {(selectedAlternative ? [selectedAlternative.reasoning] : reasoning).map((reason, i) => (
              <li key={i} className="text-xs xl:text-sm text-muted-foreground flex items-start gap-1.5">
                <span className="text-muted-foreground/50">-</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Agent Justification (3-5 sentences from LLM) */}
        {sectionJustification && (
          <div className="bg-muted/30 rounded-md p-2 xl:p-2.5 border-l-2 border-primary">
            <p className="text-[10px] xl:text-xs font-medium mb-1">Agent Recommendation</p>
            <p className="text-xs xl:text-sm text-muted-foreground leading-relaxed">
              {sectionJustification}
            </p>
          </div>
        )}

        {/* Grazed Percentage */}
        {paddockGrazedPercentage !== undefined && (
          <div className="flex items-center justify-between text-[10px] xl:text-xs text-muted-foreground">
            <span>Paddock grazed</span>
            <span className="font-medium">{paddockGrazedPercentage}%</span>
          </div>
        )}

        {/* Section Alternatives */}
        {!isPaddockTransition && sectionAlternatives.length > 0 && (
          <div className="border-t border-border pt-2">
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="flex items-center justify-between w-full text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Alternative sections ({sectionAlternatives.length})</span>
              {showAlternatives ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showAlternatives && (
              <div className="mt-1.5 space-y-1">
                {/* Recommended section option */}
                <button
                  onClick={() => setSelectedAlternative(null)}
                  className={cn(
                    "w-full text-left p-1.5 rounded-md border transition-all",
                    selectedAlternative === null
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium">
                      Recommended Section
                    </span>
                    <span className="text-[10px] text-muted-foreground">{confidence}%</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {section ? format(section.targetArea) : ''} - AI-optimized
                  </p>
                </button>

                {/* Alternative sections */}
                {sectionAlternatives.map((alt) => (
                  <button
                    key={alt.id}
                    onClick={() => setSelectedAlternative(alt)}
                    className={cn(
                      "w-full text-left p-1.5 rounded-md border transition-all",
                      selectedAlternative?.id === alt.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium">
                        {alt.reasoning.split(' - ')[0]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{alt.confidence}%</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {format(alt.targetArea)} - {alt.reasoning.split(' - ')[1] || alt.reasoning}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {!hideActions && (
          <div className="flex gap-1.5 xl:gap-2 pt-0.5">
            <Button onClick={onApprove} className="flex-1 h-6 xl:h-7 text-[10px] xl:text-xs">
              {isPaddockTransition ? 'Approve Transition' : selectedAlternative ? 'Approve Alternative' : 'Approve Section'}
            </Button>
            <Button variant="outline" onClick={onModify} className="flex-1 h-6 xl:h-7 text-[10px] xl:text-xs">
              Modify
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
