import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecoveryData {
  pastureId: string
  pastureName: string
  currentNdvi: number
  recoveryPct: number
  restDays: number
  lastGrazed: string | null
  status: string
}

interface RecoveryTrackerProps {
  data: RecoveryData[]
  title?: string
}

function getRecoveryColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 60) return 'bg-lime-500'
  if (pct >= 40) return 'bg-amber-500'
  if (pct >= 20) return 'bg-orange-500'
  return 'bg-red-500'
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    ready: { label: 'Ready', className: 'bg-green-100 text-green-700' },
    almost_ready: { label: 'Almost Ready', className: 'bg-lime-100 text-lime-700' },
    recovering: { label: 'Recovering', className: 'bg-amber-100 text-amber-700' },
    grazed: { label: 'Grazed', className: 'bg-slate-100 text-slate-700' },
  }
  const config = statusMap[status] || { label: status, className: 'bg-slate-100 text-slate-700' }
  return (
    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', config.className)}>
      {config.label}
    </span>
  )
}

export function RecoveryTracker({
  data,
  title = 'Pasture Recovery'
}: RecoveryTrackerProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="text-sm">No recovery data available</p>
            <p className="text-xs">Grazing events needed to track recovery</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Leaf className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {data.map((pasture) => (
            <div key={pasture.pastureId} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{pasture.pastureName}</span>
                  {getStatusBadge(pasture.status)}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-xs">
                  <span>NDVI: {pasture.currentNdvi}</span>
                  <span>{pasture.restDays}d rest</span>
                  <span className="font-medium text-foreground">{pasture.recoveryPct}%</span>
                </div>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'absolute h-full transition-all',
                    getRecoveryColor(pasture.recoveryPct)
                  )}
                  style={{ width: `${pasture.recoveryPct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
