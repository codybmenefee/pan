import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import {
  HistoryTimeline,
  DateRangeSelector,
  type DateRange
} from '@/components/history'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { samplePaddocks } from '../../../convex/seedData'
import type { PlanData } from '@/components/history/HistoryEventCard'

export const Route = createFileRoute('/demo/history')({
  component: DemoHistoryPage,
})

// Generate sample plans based on the demo paddocks
function generateDemoPlans(): PlanData[] {
  const today = new Date()
  const plans: PlanData[] = []

  // Generate 12 plans over the last 30 days with realistic distribution
  const planConfigs = [
    { daysAgo: 1, paddockId: 'p4', status: 'pending' as const, confidence: 87, reasoning: ['East Ridge has the highest NDVI at 0.52', 'Adequate rest period of 24 days since last graze', 'Good water access from creek'] },
    { daysAgo: 3, paddockId: 'p2', status: 'approved' as const, confidence: 82, reasoning: ['North Flat showing strong recovery', 'NDVI trending upward over past week', 'Stream access on west side'] },
    { daysAgo: 5, paddockId: 'p5', status: 'approved' as const, confidence: 78, reasoning: ['Creek Bend ready after 3-day graze cycle', 'Good forage density observed'] },
    { daysAgo: 7, paddockId: 'p7', status: 'modified' as const, confidence: 75, reasoning: ['Creek Side initially recommended', 'Farmer adjusted based on weather forecast'] },
    { daysAgo: 10, paddockId: 'p3', status: 'approved' as const, confidence: 84, reasoning: ['Top Block well-rested at 16 days', 'Central trough accessible', 'NDVI at 0.39 indicates adequate forage'] },
    { daysAgo: 12, paddockId: 'p6', status: 'approved' as const, confidence: 79, reasoning: ['West Slope recovering well', 'Strategic rotation maintains pasture health'] },
    { daysAgo: 15, paddockId: 'p1', status: 'modified' as const, confidence: 71, reasoning: ['South Valley suggested for rotation', 'Farmer preferred different timing'] },
    { daysAgo: 18, paddockId: 'p8', status: 'approved' as const, confidence: 83, reasoning: ['Lower Paddock at optimal recovery', 'Good southern trough access'] },
    { daysAgo: 21, paddockId: 'p4', status: 'approved' as const, confidence: 86, reasoning: ['East Ridge cycle complete', 'Strong NDVI readings'] },
    { daysAgo: 24, paddockId: 'p2', status: 'approved' as const, confidence: 80, reasoning: ['North Flat rotation scheduled', 'Stream water level adequate'] },
    { daysAgo: 27, paddockId: 'p7', status: 'modified' as const, confidence: 74, reasoning: ['Creek Side recommended', 'Adjusted for herd movement'] },
    { daysAgo: 30, paddockId: 'p5', status: 'approved' as const, confidence: 81, reasoning: ['Creek Bend optimal for month start', 'Consistent grazing pattern established'] },
  ]

  planConfigs.forEach((config, idx) => {
    const planDate = new Date(today)
    planDate.setDate(planDate.getDate() - config.daysAgo)

    const paddock = samplePaddocks.find(p => p.externalId === config.paddockId)

    plans.push({
      _id: `demo-plan-${idx}`,
      date: planDate.toISOString().split('T')[0],
      primaryPaddockExternalId: config.paddockId,
      sectionAreaHectares: paddock?.area ?? 15,
      confidenceScore: config.confidence,
      status: config.status,
      reasoning: config.reasoning,
    })
  })

  return plans
}

// Build paddock name lookup from sample data
const paddockNameMap = new Map(
  samplePaddocks.map(p => [p.externalId, p.name])
)

function DemoHistoryPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month')

  // Generate demo plans
  const allPlans = generateDemoPlans()

  // Filter plans based on date range
  const days = dateRange === 'week' ? 7
    : dateRange === 'month' ? 30
    : dateRange === 'quarter' ? 90
    : 365

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const plans = allPlans.filter(plan => new Date(plan.date) >= cutoffDate)

  // Calculate stats from filtered plans
  const stats = {
    total: plans.length,
    approved: plans.filter(p => p.status === 'approved').length,
    modified: plans.filter(p => p.status === 'modified').length,
    pending: plans.filter(p => p.status === 'pending').length,
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

        {/* Timeline */}
        <HistoryTimeline
          plans={plans}
          paddockNameMap={paddockNameMap}
        />

        {/* Sign up CTA */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Track your real grazing history</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sign up to see AI recommendations for your actual paddocks with real satellite data.
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
