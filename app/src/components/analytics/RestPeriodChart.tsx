import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, AlertTriangle } from 'lucide-react'

interface RestPeriodBucket {
  label: string
  count: number
  isTarget: boolean
}

interface RestPeriodData {
  buckets: RestPeriodBucket[]
  avgRestPeriod: number
  totalEvents: number
}

interface RestPeriodChartProps {
  data: RestPeriodData
  title?: string
}

export function RestPeriodChart({
  data,
  title = 'Rest Period Distribution'
}: RestPeriodChartProps) {
  const chartData = useMemo(() => {
    return data.buckets.map(bucket => ({
      ...bucket,
      shortLabel: bucket.label.replace(' days', 'd'),
    }))
  }, [data.buckets])

  const hasData = data.totalEvents >= 2

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="text-sm">Not enough data</p>
            <p className="text-xs">Need at least 2 grazing events to calculate rest periods</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {title}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Avg: <span className="font-medium text-foreground">{data.avgRestPeriod} days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as RestPeriodBucket & { shortLabel: string }
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.count} rest period{item.count !== 1 ? 's' : ''}
                        </p>
                        {item.isTarget && (
                          <p className="text-xs text-green-600 mt-1">Target range</p>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isTarget ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(215 20% 65%)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[hsl(142.1_76.2%_36.3%)]" />
            <span>Target (21-45d)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[hsl(215_20%_65%)]" />
            <span>Other</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
