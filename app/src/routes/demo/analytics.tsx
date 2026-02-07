import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { DateRangeSelector, type DateRange } from '@/components/history'
import { Button } from '@/components/ui/button'
import {
  MetricCard,
  FarmNDVIChart,
  RecoveryTracker,
  RestPeriodChart,
  AIPartnershipChart,
} from '@/components/analytics'
import { samplePastures } from '../../../convex/seedData'

export const Route = createFileRoute('/demo/analytics')({
  component: DemoAnalyticsPage,
})

// Generate recovery data from sample pastures
function generateRecoveryData() {
  return samplePastures.map(pasture => {
    // Calculate recovery percentage based on rest days (target 21 days = 100%)
    const recoveryPct = Math.min(100, Math.round((pasture.restDays / 21) * 100))

    return {
      pastureId: pasture.externalId,
      pastureName: pasture.name,
      currentNdvi: pasture.ndvi,
      recoveryPct,
      restDays: pasture.restDays,
      lastGrazed: null,
      status: pasture.status,
    }
  })
}

// Generate rest period distribution matching demo pasture rest days
function generateRestPeriodData() {
  // Buckets based on actual demo pasture rest days: 3, 5, 12, 14, 16, 19, 24, 28
  const buckets = [
    { label: '0-7 days', count: 2, isTarget: false },      // p5 (3d), p8 (5d)
    { label: '8-14 days', count: 2, isTarget: false },     // p6 (12d), p1 (14d)
    { label: '15-20 days', count: 2, isTarget: false },    // p3 (16d), p2 (19d)
    { label: '21-30 days', count: 2, isTarget: true },     // p4 (24d), p7 (28d)
    { label: '31-45 days', count: 0, isTarget: true },
    { label: '45+ days', count: 0, isTarget: false },
  ]

  return {
    buckets,
    avgRestPeriod: 15, // Average of demo pasture rest days
    totalEvents: 8,
  }
}

// Generate NDVI trend data for last 30 days
function generateNDVITrend(days: number) {
  const data = []
  const today = new Date()

  // Create a realistic NDVI trend with some variation
  let baseNdvi = 0.38

  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Add some realistic variation (+/- 0.03) with slight upward trend
    const variation = (Math.random() - 0.5) * 0.06
    const trend = ((days - i) / days) * 0.05 // Slight upward trend
    baseNdvi = Math.max(0.25, Math.min(0.55, 0.35 + trend + variation))

    data.push({
      date: date.toISOString().split('T')[0],
      ndvi: Math.round(baseNdvi * 100) / 100,
    })
  }

  return data
}

// Generate plan approval stats
function generatePlanStats() {
  return {
    totals: {
      total: 12,
      approved: 8,
      modified: 3,
      rejected: 0,
      pending: 1,
      approvalRate: 73, // 8 approved out of 11 reviewed
    },
    weeklyTrend: [
      { week: 'Week 1', approved: 2, modified: 1, rejected: 0 },
      { week: 'Week 2', approved: 2, modified: 0, rejected: 0 },
      { week: 'Week 3', approved: 2, modified: 1, rejected: 0 },
      { week: 'Week 4', approved: 2, modified: 1, rejected: 0 },
    ],
  }
}

function DemoAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('quarter')

  // Calculate days based on date range
  const days = dateRange === 'week' ? 7
    : dateRange === 'month' ? 30
    : dateRange === 'quarter' ? 90
    : 365

  // Generate all demo data
  const recoveryData = generateRecoveryData()
  const restPeriodData = generateRestPeriodData()
  const ndviTrend = generateNDVITrend(Math.min(days, 30)) // Cap at 30 days for visual clarity
  const planStats = generatePlanStats()

  // Calculate summary metrics
  const avgRecovery = recoveryData.length > 0
    ? Math.round(recoveryData.reduce((sum, p) => sum + p.recoveryPct, 0) / recoveryData.length)
    : 0

  const readyPastures = recoveryData.filter(p => p.recoveryPct >= 80).length

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
            tooltip="Average days pastures rest between grazing events. Target: 21-45 days for optimal regrowth."
          />
          <MetricCard
            title="Avg Recovery"
            value={`${avgRecovery}%`}
            trendDirection={avgRecovery >= 60 ? 'up' : avgRecovery >= 40 ? 'stable' : 'down'}
            tooltip="Average NDVI recovery across all pastures since last graze."
          />
          <MetricCard
            title="Ready Pastures"
            value={`${readyPastures} of ${recoveryData.length}`}
            trendDirection={readyPastures > 0 ? 'up' : 'stable'}
            tooltip="Pastures with 80%+ recovery, ready for grazing."
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

        {/* Sign up CTA */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Get insights from your own farm data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sign up to track NDVI trends, pasture recovery, and AI recommendation accuracy for your farm.
              </p>
            </div>
            <Link to="/sign-in">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
