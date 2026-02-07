import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useFarmContext } from '@/lib/farm'
import {
  HistoryTimeline,
  DateRangeSelector,
  type DateRange
} from '@/components/history'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import type { Id } from '../../../convex/_generated/dataModel'

export const Route = createFileRoute('/app/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const { activeFarmId, isLoading: farmLoading } = useFarmContext()
  const [dateRange, setDateRange] = useState<DateRange>('month')

  // Calculate days based on date range
  const days = dateRange === 'week' ? 7
    : dateRange === 'month' ? 30
    : dateRange === 'quarter' ? 90
    : 365

  // Fetch plans from Convex
  const plans = useQuery(
    api.intelligence.getPlanHistory,
    activeFarmId ? { farmExternalId: activeFarmId, days } : 'skip'
  )

  // Fetch pastures for name lookup
  const pastures = useQuery(
    api.intelligence.getPasturesForFarm,
    activeFarmId ? { farmExternalId: activeFarmId } : 'skip'
  )

  // Build pasture name lookup map
  const pastureNameMap = useMemo(() => {
    if (!pastures) return new Map<string, string>()
    return new Map(pastures.map(p => [p.externalId, p.name]))
  }, [pastures])

  // Get plan IDs for fetching modifications
  const planIds = useMemo(() => {
    if (!plans) return []
    return plans.map(p => p._id as Id<'plans'>)
  }, [plans])

  // Fetch paddock modifications for all plans
  const modifications = useQuery(
    api.intelligence.getPaddockModificationsByPlanIds,
    planIds.length > 0 ? { planIds } : 'skip'
  )

  // Build modification lookup map by planId
  const modificationsMap = useMemo(() => {
    if (!modifications) return new Map()
    return new Map(modifications.map(m => [m.planId, m]))
  }, [modifications])

  // Simple stats from real data
  const stats = useMemo(() => {
    if (!plans) return null
    return {
      total: plans.length,
      approved: plans.filter(p => p.status === 'approved').length,
      modified: plans.filter(p => p.status === 'modified').length,
      pending: plans.filter(p => p.status === 'pending').length,
    }
  }, [plans])

  if (farmLoading || plans === undefined || pastures === undefined) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <LoadingSpinner message="Loading history..." />
      </div>
    )
  }

  if (!activeFarmId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <ErrorState
          title="No farm selected"
          message="Please select a farm to view grazing history."
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-muted-foreground">Track grazing decisions over time</p>
        </div>
        <DateRangeSelector value={dateRange} onValueChange={setDateRange} />
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Plans</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-semibold text-green-600">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Modified</p>
              <p className="text-2xl font-semibold text-amber-600">{stats.modified}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.pending}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline - full width now */}
      <HistoryTimeline
        plans={plans}
        pastureNameMap={pastureNameMap}
        modificationsMap={modificationsMap}
      />
    </div>
    </div>
  )
}
