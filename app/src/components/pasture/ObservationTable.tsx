import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendIndicator, getTrendFromValue } from './TrendIndicator'
import type { ExtendedObservation } from '@/lib/types'

interface ObservationTableProps {
  observation: ExtendedObservation
  ndviTrend: number
  cloudCoverage: number
}

interface MetricRow {
  metric: string
  value: string
  status: string
  statusColor: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'stable'
}

export function ObservationTable({ 
  observation, 
  ndviTrend, 
  cloudCoverage 
}: ObservationTableProps) {
  const getNdviStatus = (ndvi: number): { text: string; color: string } => {
    if (ndvi >= 0.5) return { text: 'Optimal', color: 'text-green-600' }
    if (ndvi >= 0.4) return { text: 'Good', color: 'text-green-500' }
    if (ndvi >= 0.3) return { text: 'Moderate', color: 'text-amber-600' }
    if (ndvi >= 0.2) return { text: 'Low', color: 'text-amber-500' }
    return { text: 'Poor', color: 'text-red-600' }
  }

  const getCloudStatus = (coverage: number): { text: string; color: string } => {
    if (coverage <= 20) return { text: 'Clear', color: 'text-green-600' }
    if (coverage <= 50) return { text: 'Partial', color: 'text-amber-600' }
    return { text: 'Overcast', color: 'text-red-600' }
  }

  const ndviStatus = getNdviStatus(observation.ndviMean)
  const cloudStatus = getCloudStatus(cloudCoverage)

  const metrics: MetricRow[] = [
    {
      metric: 'NDVI',
      value: observation.ndviMean.toFixed(2),
      status: ndviStatus.text,
      statusColor: ndviStatus.color,
      trend: `${ndviTrend >= 0 ? '+' : ''}${ndviTrend.toFixed(3)}/week`,
      trendDirection: getTrendFromValue(ndviTrend),
    },
  ]

  if (observation.evi !== undefined) {
    metrics.push({
      metric: 'EVI',
      value: observation.evi.toFixed(2),
      status: observation.evi >= 0.35 ? 'Good' : 'Moderate',
      statusColor: observation.evi >= 0.35 ? 'text-green-600' : 'text-amber-600',
    })
  }

  if (observation.ndwi !== undefined) {
    metrics.push({
      metric: 'NDWI',
      value: observation.ndwi.toFixed(2),
      status: observation.ndwi > -0.2 && observation.ndwi < 0.1 ? 'Normal' : 'Elevated',
      statusColor: observation.ndwi > -0.2 && observation.ndwi < 0.1 ? 'text-green-600' : 'text-amber-600',
      trend: 'stable',
      trendDirection: 'stable',
    })
  }

  metrics.push({
    metric: 'Cloud Coverage',
    value: `${cloudCoverage}%`,
    status: cloudStatus.text,
    statusColor: cloudStatus.color,
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Current Observations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((row) => (
              <TableRow key={row.metric}>
                <TableCell className="font-medium">{row.metric}</TableCell>
                <TableCell className="text-right font-mono">{row.value}</TableCell>
                <TableCell className={row.statusColor}>{row.status}</TableCell>
                <TableCell className="text-right">
                  {row.trendDirection ? (
                    <TrendIndicator 
                      trend={row.trendDirection} 
                      value={row.trend}
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
