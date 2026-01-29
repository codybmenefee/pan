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
import type { Paddock, PaddockStatus } from '@/lib/types'
import { useGeometry } from '@/lib/geometry'
import { useFarm } from '@/lib/convex/useFarm'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

type StatusGroup = 'ready' | 'recovering' | 'grazed'

const statusGroupConfig: Record<StatusGroup, {
  label: string
  statuses: PaddockStatus[]
  bgClass: string
  textClass: string
  badgeClass: string
  tooltip: string
}> = {
  ready: {
    label: 'Ready to Graze',
    statuses: ['ready'],
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-600 dark:text-green-400',
    badgeClass: 'bg-green-500/20 text-green-700 dark:text-green-300',
    tooltip: 'Paddocks with sufficient forage recovery (NDVI above threshold) and adequate rest period. These are your options for the next grazing rotation.',
  },
  recovering: {
    label: 'Recovering',
    statuses: ['recovering', 'almost_ready'],
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    tooltip: 'Paddocks rebuilding forage after grazing. Plants are restoring root reserves and regrowing leaf area. Avoid grazing until ready.',
  },
  grazed: {
    label: 'Recently Grazed',
    statuses: ['grazed'],
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-600 dark:text-red-400',
    badgeClass: 'bg-red-500/20 text-red-700 dark:text-red-300',
    tooltip: 'Paddocks grazed within the last week. Need the most recovery time before returning. Re-grazing too soon damages root systems.',
  },
}

function getPaddocksByGroup(group: StatusGroup, paddocks: Paddock[]): Paddock[] {
  const config = statusGroupConfig[group]
  return paddocks.filter(p => config.statuses.includes(p.status))
}

function getStatusLabel(status: PaddockStatus): string {
  switch (status) {
    case 'ready': return 'Ready'
    case 'almost_ready': return 'Almost Ready'
    case 'recovering': return 'Recovering'
    case 'grazed': return 'Grazed'
  }
}

export function FarmOverview() {
  const { paddocks } = useGeometry()
  const { farm } = useFarm()
  const { format } = useAreaUnit()
  const counts = paddocks.reduce((acc, paddock) => {
    acc[paddock.status] = (acc[paddock.status] || 0) + 1
    return acc
  }, {} as Record<PaddockStatus, number>)
  const [openGroup, setOpenGroup] = useState<StatusGroup | null>(null)

  const groupCounts = {
    ready: counts.ready || 0,
    recovering: (counts.recovering || 0) + (counts.almost_ready || 0),
    grazed: counts.grazed || 0,
  }

  const selectedPaddocks = openGroup ? getPaddocksByGroup(openGroup, paddocks) : []
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
            {farm?.paddockCount ?? paddocks.length} paddocks / {farm?.totalArea ? format(farm.totalArea) : '—'}
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
            {selectedPaddocks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No paddocks in this status
              </p>
            ) : (
              selectedPaddocks.map((paddock) => (
                <div
                  key={paddock.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{paddock.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(paddock.area)} / {paddock.restDays} days rest
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${selectedConfig?.badgeClass}`}>
                      {getStatusLabel(paddock.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      NDVI: {paddock.ndvi.toFixed(2)}
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
