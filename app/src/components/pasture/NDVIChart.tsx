import { useMemo } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExtendedObservation } from '@/lib/types'

interface NDVIChartProps {
  observations: ExtendedObservation[]
  title?: string
  showThreshold?: boolean
  thresholdValue?: number
}

export function NDVIChart({ 
  observations, 
  title = 'Vegetation Health (NDVI)',
  showThreshold = true,
  thresholdValue = 0.4
}: NDVIChartProps) {
  const chartData = useMemo(() => {
    return observations.map(obs => ({
      date: new Date(obs.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      ndvi: obs.ndviMean,
      evi: obs.evi ?? obs.eviMean,
      ndwi: obs.ndwi ?? obs.ndwiMean,
      fullDate: obs.date,
    }))
  }, [observations])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="stroke-muted" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 0.7]}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <p className="text-sm font-medium mb-1">{data.fullDate}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-green-600">NDVI: {data.ndvi.toFixed(2)}</p>
                          {data.evi && <p className="text-blue-600">EVI: {data.evi.toFixed(2)}</p>}
                          {data.ndwi && <p className="text-cyan-600">NDWI: {data.ndwi.toFixed(2)}</p>}
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {showThreshold && (
                <ReferenceLine 
                  y={thresholdValue} 
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{ 
                    value: 'Graze threshold', 
                    position: 'right',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
              )}
              <Line 
                type="monotone" 
                dataKey="ndvi" 
                stroke="hsl(142.1 76.2% 36.3%)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(142.1 76.2% 36.3%)' }}
                activeDot={{ r: 5 }}
              />
              {observations[0]?.evi !== undefined && (
                <Line 
                  type="monotone" 
                  dataKey="evi" 
                  stroke="hsl(221.2 83.2% 53.3%)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  strokeDasharray="5 5"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-green-600 rounded" />
            <span className="text-muted-foreground">NDVI</span>
          </div>
          {observations[0]?.evi !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-blue-600 rounded border-dashed" style={{ borderStyle: 'dashed' }} />
              <span className="text-muted-foreground">EVI</span>
            </div>
          )}
          {showThreshold && (
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t border-dashed border-muted-foreground" />
              <span className="text-muted-foreground">Threshold</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
