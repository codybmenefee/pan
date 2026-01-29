import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HistoryEventCard, type PlanData, type SectionModification } from './HistoryEventCard'

interface HistoryTimelineProps {
  plans: PlanData[]
  paddockNameMap: Map<string, string>
  modificationsMap?: Map<string, SectionModification>
  title?: string
}

export function HistoryTimeline({ plans, paddockNameMap, modificationsMap, title = 'Timeline' }: HistoryTimelineProps) {
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)

  const handleToggleExpand = (planId: string) => {
    setExpandedPlanId(prev => prev === planId ? null : planId)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No plans found for the selected period
          </p>
        ) : (
          <div className="space-y-0">
            {plans.map((plan, index) => (
              <HistoryEventCard
                key={plan._id}
                plan={plan}
                paddockName={paddockNameMap.get(plan.primaryPaddockExternalId ?? '') ?? 'Unknown'}
                modification={modificationsMap?.get(plan._id)}
                isLast={index === plans.length - 1}
                isExpanded={expandedPlanId === plan._id}
                onToggleExpand={() => handleToggleExpand(plan._id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
