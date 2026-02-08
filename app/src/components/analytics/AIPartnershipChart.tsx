import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, AlertTriangle } from 'lucide-react'

interface PlanApprovalStats {
  totals: {
    total: number
    approved: number
    modified: number
    rejected: number
    pending: number
    approvalRate: number
  }
  weeklyTrend: {
    week: string
    approved: number
    modified: number
    rejected: number
  }[]
}

interface AIPartnershipChartProps {
  data: PlanApprovalStats
  title?: string
}

export function AIPartnershipChart({
  data,
  title = 'AI Partnership'
}: AIPartnershipChartProps) {
  const { totals } = data
  const reviewed = totals.total - totals.pending

  if (reviewed === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="text-sm">No reviewed plans yet</p>
            <p className="text-xs">Approve or modify plans to track AI accuracy</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const approvedPct = Math.round((totals.approved / reviewed) * 100)
  const modifiedPct = Math.round((totals.modified / reviewed) * 100)
  const rejectedPct = Math.round((totals.rejected / reviewed) * 100)

  const items = [
    { label: 'Approved as-is', value: approvedPct, count: totals.approved, color: 'bg-olive' },
    { label: 'Modified', value: modifiedPct, count: totals.modified, color: 'bg-terracotta' },
    { label: 'Rejected', value: rejectedPct, count: totals.rejected, color: 'bg-terracotta' },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {title}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {reviewed} reviewed • {totals.pending} pending
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">({item.count})</span>
                <span className="font-medium">{item.value}%</span>
              </div>
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
