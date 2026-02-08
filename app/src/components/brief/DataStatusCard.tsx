import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { dataStatus } from '@/data/mock/farm'

export function DataStatusCard() {
  const qualityColors = {
    good: 'bg-olive/10 text-olive border-olive/20',
    limited: 'bg-terracotta/10 text-terracotta border-terracotta/20',
    poor: 'bg-terracotta/10 text-terracotta border-terracotta/20',
  }

  return (
    <Card>
      <CardHeader className="pb-1.5 xl:pb-2">
        <CardTitle className="text-xs xl:text-sm font-medium">Data Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 xl:space-y-1.5 text-[10px] xl:text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last satellite pass</span>
          <span>{dataStatus.lastSatellitePass}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Next satellite pass</span>
          <span>{dataStatus.nextExpectedPass}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Cloud coverage</span>
          <div className="flex items-center gap-1.5">
            <span>{dataStatus.cloudCoverage}%</span>
            <div className="w-12 xl:w-16 h-1 xl:h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${dataStatus.cloudCoverage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Observation quality</span>
          <Badge variant="outline" className={`${qualityColors[dataStatus.observationQuality]} text-[9px] px-1 py-0`}>
            {dataStatus.observationQuality.charAt(0).toUpperCase() + dataStatus.observationQuality.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
