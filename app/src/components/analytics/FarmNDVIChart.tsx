import { useMemo } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FarmNdviTrend } from '@/lib/types'

interface FarmNDVIChartProps {
  data: FarmNdviTrend[]
  title?: string
}

export function FarmNDVIChart({ 
  data, 
  title = 'Farm-Wide NDVI Trend' 
}: FarmNDVIChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }))
  }, [data])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="stroke-muted" 
                vertical={false}
              />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0.2, 0.6]}
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
                        <p className="text-sm font-medium">{data.date}</p>
                        <p className="text-sm text-olive">
                          NDVI: {data.ndvi.toFixed(2)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area 
                type="monotone" 
                dataKey="ndvi" 
                stroke="hsl(142.1 76.2% 36.3%)"
                strokeWidth={2}
                fill="url(#ndviGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
