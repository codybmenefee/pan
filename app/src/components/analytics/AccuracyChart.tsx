import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecommendationAccuracy } from '@/lib/types'

interface AccuracyChartProps {
  data: RecommendationAccuracy
  title?: string
}

export function AccuracyChart({ 
  data, 
  title = 'Recommendation Accuracy' 
}: AccuracyChartProps) {
  const items = [
    { label: 'Approved as-is', value: data.approvedAsIs, color: 'bg-olive' },
    { label: 'Modified', value: data.modified, color: 'bg-terracotta' },
    { label: 'Rejected', value: data.rejected, color: 'bg-terracotta' },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">{item.value}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={`absolute h-full ${item.color} transition-all`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
