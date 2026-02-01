import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useFarmContext } from '@/lib/farm'
import { DateRangeSelector, type DateRange } from '@/components/history'
import { LoadingSpinner } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import {
  MetricCard,
  FarmNDVIChart,
  RecoveryTracker,
  RestPeriodChart,
  AIPartnershipChart,
} from '@/components/analytics'

export const Route = createFileRoute('/app/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { activeFarmId, isLoading: farmLoading } = useFarmContext()
  const [dateRange, setDateRange] = useState<DateRange>('quarter')

  // Calculate days based on date range
  const days = dateRange === 'week' ? 7
    : dateRange === 'month' ? 30
    : dateRange === 'quarter' ? 90
    : 365

  // All queries use activeFarmId (Clerk org ID) with 'skip' pattern
  const recoveryData = useQuery(
    api.observations.getRecoveryTracker,
    activeFarmId ? { farmExternalId: activeFarmId } : 'skip'
  )

  const restPeriodData = useQuery(
    api.intelligence.getRestPeriodDistribution,
    activeFarmId ? { farmExternalId: activeFarmId, days } : 'skip'
  )

  const ndviTrend = useQuery(
    api.observations.getFarmNDVITrend,
    activeFarmId ? { farmExternalId: activeFarmId, days } : 'skip'
  )

  const planStats = useQuery(
    api.intelligence.getPlanApprovalStats,
    activeFarmId ? { farmExternalId: activeFarmId, days } : 'skip'
  )

  // Handle loading states
  if (farmLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <LoadingSpinner message="Loading farm..." />
      </div>
    )
  }

  if (!activeFarmId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <ErrorState
          title="No farm selected"
          message="Please select a farm to view analytics."
        />
      </div>
    )
  }

  // Check if any data is still loading
  const isLoading = recoveryData === undefined ||
    restPeriodData === undefined ||
    ndviTrend === undefined ||
    planStats === undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <LoadingSpinner message="Loading analytics..." />
      </div>
    )
  }

  // Calculate summary metrics
  const avgRecovery = recoveryData.length > 0
    ? Math.round(recoveryData.reduce((sum, p) => sum + p.recoveryPct, 0) / recoveryData.length)
    : 0

  const readyPaddocks = recoveryData.filter(p => p.recoveryPct >= 80).length

  return (
    <div className="h-full overflow-auto">
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">Farm performance and insights</p>
        </div>
        <DateRangeSelector value={dateRange} onValueChange={setDateRange} />
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="Avg Rest Period"
          value={`${restPeriodData.avgRestPeriod} days`}
          trendDirection={restPeriodData.avgRestPeriod >= 21 ? 'up' : 'down'}
          tooltip="Average days paddocks rest between grazing events. Target: 21-45 days for optimal regrowth."
        />
        <MetricCard
          title="Avg Recovery"
          value={`${avgRecovery}%`}
          trendDirection={avgRecovery >= 60 ? 'up' : avgRecovery >= 40 ? 'stable' : 'down'}
          tooltip="Average NDVI recovery across all paddocks since last graze."
        />
        <MetricCard
          title="Ready Paddocks"
          value={`${readyPaddocks} of ${recoveryData.length}`}
          trendDirection={readyPaddocks > 0 ? 'up' : 'stable'}
          tooltip="Paddocks with 80%+ recovery, ready for grazing."
        />
        <MetricCard
          title="AI Approval Rate"
          value={`${planStats.totals.approvalRate}%`}
          trendDirection={planStats.totals.approvalRate >= 70 ? 'up' : 'stable'}
          tooltip="Percentage of AI-generated plans approved without modification."
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecoveryTracker data={recoveryData} />
        <RestPeriodChart data={restPeriodData} />
        <FarmNDVIChart data={ndviTrend} />
        <AIPartnershipChart data={planStats} />
      </div>
    </div>
    </div>
  )
}
