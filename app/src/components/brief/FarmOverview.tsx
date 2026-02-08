import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
// HelpCircle removed - was unused
import type { Pasture, PastureStatus } from '@/lib/types'
import { useGeometry } from '@/lib/geometry'
import { useFarm } from '@/lib/convex/useFarm'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

type StatusGroup = 'ready' | 'recovering' | 'grazed'

const statusGroupConfig: Record<StatusGroup, {
  label: string
  statuses: PastureStatus[]
  bgClass: string
  textClass: string
  badgeClass: string
  tooltip: string
}> = {
  ready: {
    label: 'Ready to Graze',
    statuses: ['ready'],
    bgClass: 'bg-olive/10',
    textClass: 'text-olive',
    badgeClass: 'bg-olive/20 text-olive',
    tooltip: 'Pastures with sufficient forage recovery (NDVI above threshold) and adequate rest period. These are your options for the next grazing rotation.',
  },
  recovering: {
    label: 'Recovering',
    statuses: ['recovering', 'almost_ready'],
    bgClass: 'bg-terracotta/10',
    textClass: 'text-terracotta',
    badgeClass: 'bg-terracotta/20 text-terracotta',
    tooltip: 'Pastures rebuilding forage after grazing. Plants are restoring root reserves and regrowing leaf area. Avoid grazing until ready.',
  },
  grazed: {
    label: 'Recently Grazed',
    statuses: ['grazed'],
    bgClass: 'bg-terracotta/10',
    textClass: 'text-terracotta',
    badgeClass: 'bg-terracotta/20 text-terracotta',
    tooltip: 'Pastures grazed within the last week. Need the most recovery time before returning. Re-grazing too soon damages root systems.',
  },
}

function getPasturesByGroup(group: StatusGroup, pastures: Pasture[]): Pasture[] {
  const config = statusGroupConfig[group]
  return pastures.filter(p => config.statuses.includes(p.status))
}

function getStatusLabel(status: PastureStatus): string {
  switch (status) {
    case 'ready': return 'Ready'
    case 'almost_ready': return 'Almost Ready'
    case 'recovering': return 'Recovering'
    case 'grazed': return 'Grazed'
  }
}

export function FarmOverview() {
  const { pastures } = useGeometry()
  const { farm } = useFarm()
  const { format } = useAreaUnit()
  const counts = pastures.reduce((acc, pasture) => {
    acc[pasture.status] = (acc[pasture.status] || 0) + 1
    return acc
  }, {} as Record<PastureStatus, number>)
  const [openGroup, setOpenGroup] = useState<StatusGroup | null>(null)

  const groupCounts = {
    ready: counts.ready || 0,
    recovering: (counts.recovering || 0) + (counts.almost_ready || 0),
    grazed: counts.grazed || 0,
  }

  const selectedPastures = openGroup ? getPasturesByGroup(openGroup, pastures) : []
  const selectedConfig = openGroup ? statusGroupConfig[openGroup] : null

  return (
    <>
      <Card>
        <CardHeader className="pb-1.5 xl:pb-2">
          <CardTitle className="text-xs xl:text-sm font-medium">Farm Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 xl:space-y-2">
          <div>
            <p className="text-xs xl:text-sm font-medium">{farm?.name ?? 'Farm overview'}</p>
            <p className="text-[10px] xl:text-xs text-muted-foreground">{farm?.location ?? 'Location unavailable'}</p>
          </div>

          <div className="text-[10px] xl:text-xs text-muted-foreground">
            {farm?.paddockCount ?? pastures.length} pastures / {farm?.totalArea ? format(farm.totalArea) : '\u2014'}
          </div>

          <div className="grid grid-cols-3 gap-1 xl:gap-1.5 text-center">
            {(['ready', 'recovering', 'grazed'] as StatusGroup[]).map((group) => {
              const config = statusGroupConfig[group]
              return (
                <Tooltip key={group}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setOpenGroup(group)}
                      className={`rounded-md ${config.bgClass} py-1 xl:py-1.5 transition-all hover:ring-2 hover:ring-offset-1 hover:ring-current/20 cursor-pointer`}
                    >
                      <p className={`text-xs xl:text-sm font-semibold ${config.textClass}`}>
                        {groupCounts[group]}
                      </p>
                      <p className="text-[9px] xl:text-[10px] text-muted-foreground">
                        {group === 'recovering' ? 'Recov.' : group === 'ready' ? 'Ready' : 'Grazed'}
                      </p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-56" side="bottom">
                    {config.tooltip}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={openGroup !== null} onOpenChange={(open) => !open && setOpenGroup(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedConfig?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedPastures.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pastures in this status
              </p>
            ) : (
              selectedPastures.map((pasture) => (
                <div
                  key={pasture.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{pasture.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(pasture.area)} / {pasture.restDays} days rest
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${selectedConfig?.badgeClass}`}>
                      {getStatusLabel(pasture.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      NDVI: {pasture.ndvi.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
