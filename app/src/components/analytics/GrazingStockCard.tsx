import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, Minus, Wallet, AlertTriangle, Info, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GrazingStock, ReserveStatus } from '@/lib/types'

interface GrazingStockCardProps {
  data: GrazingStock
  className?: string
}

function getStatusColor(status: ReserveStatus): string {
  switch (status) {
    case 'critical':
      return 'text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400'
    case 'low':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400'
    case 'healthy':
      return 'text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400'
    case 'abundant':
      return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

function getGaugeColor(status: ReserveStatus): string {
  switch (status) {
    case 'critical':
      return 'bg-red-500'
    case 'low':
      return 'bg-amber-500'
    case 'healthy':
      return 'bg-green-500'
    case 'abundant':
      return 'bg-emerald-500'
    default:
      return 'bg-muted-foreground'
  }
}

function StatusBadge({ status }: { status: ReserveStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        getStatusColor(status)
      )}
    >
      {status === 'critical' && <AlertTriangle className="mr-1 h-3 w-3" />}
      {label}
    </span>
  )
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  return (
    <Icon
      className={cn(
        'h-4 w-4',
        trend === 'up' && 'text-green-600',
        trend === 'down' && 'text-red-600',
        trend === 'stable' && 'text-muted-foreground'
      )}
    />
  )
}

export function GrazingStockCard({ data, className }: GrazingStockCardProps) {
  // Sort pastures by reserve days (lowest first to highlight concerns)
  const sortedPastures = [...data.byPasture].sort(
    (a, b) => a.reserveDays - b.reserveDays
  )

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Wallet className="h-4 w-4" />
          Grazing Stock (Pasture Reserve)
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="max-w-72" side="top">
              Your pasture "savings account" - how many days of grazing you have banked across pastures. Think of it like a financial reserve: higher reserves mean more flexibility during drought or slow growth periods.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Farm-level summary */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-muted-foreground">Farm Total Reserve</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64" side="top">
                    Combined grazing days available across all pastures. This tells you how long you could sustain your herd if no new forage grew - your buffer against weather uncertainty.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-3xl font-semibold">{data.farmTotalDays} days</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <StatusBadge status={data.farmStatus} />
                <TrendIndicator trend={data.farmTrend} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {data.farmCapacityPercent}% capacity
              </p>
            </div>
          </div>
          {/* Gauge bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'absolute h-full transition-all duration-500',
                getGaugeColor(data.farmStatus)
              )}
              style={{ width: `${data.farmCapacityPercent}%` }}
            />
            {/* Zone markers */}
            <div className="absolute inset-0 flex">
              <div className="w-1/4 border-r border-background/50" />
              <div className="w-1/4 border-r border-background/50" />
              <div className="w-1/4 border-r border-background/50" />
              <div className="w-1/4" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Critical</span>
            <span>Low</span>
            <span>Healthy</span>
            <span>Abundant</span>
          </div>
        </div>

        {/* Pasture breakdown table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pasture</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Reserve
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-56" side="top">
                        Estimated grazing days remaining in this pasture based on current biomass and typical consumption rates.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    Status
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-56" side="top">
                        Reserve health: Critical (0-3 days), Low (4-5 days), Healthy (6-10 days), Abundant (11+ days).
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    Trend
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-56" side="top">
                        Is reserve growing (recovery) or shrinking (consumption/stress)? Up is good - pasture is rebuilding.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPastures.map((pasture) => (
                <TableRow key={pasture.pastureId}>
                  <TableCell className="font-medium">
                    {pasture.pastureName}
                  </TableCell>
                  <TableCell className="text-right">
                    {pasture.reserveDays} days
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={pasture.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <TrendIndicator trend={pasture.trend} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Assumption footnote */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{data.assumptionNote}</span>
        </div>
      </CardContent>
    </Card>
  )
}
