import { Check, Copy, Download, Map, Grid3X3 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SatelliteMiniMap } from './SatelliteMiniMap'
import { PaddockMiniMap } from './PaddockMiniMap'
import type { Paddock, Section } from '@/lib/types'

interface ApprovedStateProps {
  paddock: Paddock
  currentPaddockId: string
  approvedAt: string
  confidence: number
  wasModified?: boolean
  // Section-specific props
  section?: Section
  daysInCurrentPaddock?: number
  totalDaysPlanned?: number
  isPaddockTransition?: boolean
  previousSections?: Section[]
  // New props from agent
  sectionJustification?: string
  paddockGrazedPercentage?: number
}

export function ApprovedState({ 
  paddock, 
  currentPaddockId, 
  approvedAt, 
  confidence, 
  wasModified,
  section,
  daysInCurrentPaddock = 1,
  totalDaysPlanned = 4,
  isPaddockTransition = false,
  previousSections = [],
  sectionJustification,
  paddockGrazedPercentage,
}: ApprovedStateProps) {
  const daysRemaining = totalDaysPlanned - daysInCurrentPaddock

  return (
    <div className="p-4 space-y-4">
      {/* Success banner */}
      <div className="flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 p-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            {isPaddockTransition 
              ? `Transition ${wasModified ? 'modified' : 'approved'}`
              : `Section ${wasModified ? 'modified' : 'approved'}`
            }
          </p>
          <p className="text-xs text-muted-foreground">at {approvedAt}</p>
        </div>
      </div>

      {/* Today's Execution */}
      <Card className="overflow-hidden !p-0 !gap-0">
        {/* Full-bleed map at top */}
        <div className="relative">
          <div className="aspect-[2/1] border-b border-border">
            {isPaddockTransition ? (
              <PaddockMiniMap
                currentPaddockId={currentPaddockId}
                targetPaddockId={paddock.id}
                section={section}
                previousSections={previousSections}
                size="full"
                className="rounded-none border-0"
              />
            ) : (
              <SatelliteMiniMap
                paddockId={paddock.id}
                section={section}
                previousSections={previousSections}
                showEditButton={false}
              />
            )}
          </div>
          {/* Overlapping header */}
          <div className="absolute inset-x-0 top-0 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Today's Execution
            </p>
          </div>
        </div>
        
        <CardContent className="space-y-4 py-4">
          {/* Current paddock with section info */}
          <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {isPaddockTransition ? 'Transitioning To' : 'Current Paddock'}
                  </p>
                  <p className="text-base font-semibold mt-0.5">{paddock.name}</p>
                  {!isPaddockTransition && (
                    <p className="text-xs text-muted-foreground">
                      Day {daysInCurrentPaddock}/{totalDaysPlanned} - {daysRemaining} left
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  {confidence}%
                </Badge>
              </div>
              
              {/* Section info */}
              {section && (
                <div className="mt-2 p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
                    <Grid3X3 className="h-3 w-3" />
                    <span>Today's Section</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div>
                      <span className="text-muted-foreground">Area:</span>{' '}
                      <span className="font-medium">{section.targetArea.toFixed(1)} ha</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Coverage:</span>{' '}
                      <span className="font-medium">{Math.round((daysInCurrentPaddock / totalDaysPlanned) * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Justification */}
              {sectionJustification && (
                <div className="mt-2 p-2 rounded-md bg-muted/30 border-l-2 border-green-500">
                  <p className="text-[10px] font-medium mb-0.5 text-muted-foreground">Agent Recommendation</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {sectionJustification}
                  </p>
                </div>
              )}

              {/* Grazed Percentage */}
              {paddockGrazedPercentage !== undefined && (
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Paddock grazed</span>
                  <span className="font-medium">{paddockGrazedPercentage}%</span>
                </div>
              )}
          </div>

          <hr className="border-border" />

          {/* Fencing instructions - updated for sections */}
          <div>
            <p className="text-xs font-medium mb-2">
              {isPaddockTransition ? 'Transition instructions' : 'Section fencing'}
            </p>
            <ol className="space-y-1 text-xs text-muted-foreground">
              {isPaddockTransition ? (
                <>
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">1.</span>
                    Open gate between current paddock and {paddock.name}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">2.</span>
                    Close gate to previous paddock
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">3.</span>
                    Verify water access at {paddock.waterAccess}
                  </li>
                </>
              ) : (
                <>
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">1.</span>
                    Set virtual fence to today's section boundary (see map)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">2.</span>
                    Ensure section includes access to {paddock.waterAccess}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">3.</span>
                    Previous section ({previousSections.length > 0 ? 'grazed' : 'none'}) will begin recovery
                  </li>
                </>
              )}
            </ol>
            <p className="mt-2 text-xs">
              <span className="text-muted-foreground">
                {isPaddockTransition ? 'Rotation:' : 'Allocation:'}
              </span>{' '}
              <span className="font-medium">
                {isPaddockTransition 
                  ? `${totalDaysPlanned}d in ${paddock.name}`
                  : `${section?.targetArea.toFixed(1) || '~3.5'} ha today`
                }
              </span>
            </p>
          </div>

          <hr className="border-border" />

          {/* Virtual fencing exports */}
          <div>
            <p className="text-xs font-medium mb-2">Virtual fencing</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Copy className="h-3 w-3 mr-1.5" />
                Copy Coords
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1.5" />
                GeoJSON
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link to="/map">
                  <Map className="h-3 w-3 mr-1.5" />
                  Map
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paddock details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Paddock Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Area</p>
              <p className="font-medium">{paddock.area} ha</p>
            </div>
            <div>
              <p className="text-muted-foreground">NDVI</p>
              <p className="font-medium">{paddock.ndvi.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Recovery</p>
              <p className="font-medium">{paddock.restDays}d</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Rotation</p>
              <p className="font-medium">{paddock.lastGrazed}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Water</p>
              <p className="font-medium">{paddock.waterAccess}</p>
            </div>
            {!isPaddockTransition && (
              <div>
                <p className="text-muted-foreground">Sections</p>
                <p className="font-medium">{previousSections.length + 1}/{totalDaysPlanned}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
