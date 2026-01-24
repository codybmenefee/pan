import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { 
  HistoryTimeline, 
  PerformanceTable, 
  DateRangeSelector,
  getDateRangeBounds,
  type DateRange 
} from '@/components/history'
import { historyEntries, paddockPerformance, getHistoryStats } from '@/data/mock/history'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Grid3X3 } from 'lucide-react'

export const Route = createFileRoute('/_app/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const [dateRange, setDateRange] = useState<DateRange>('week')
  
  const filteredEntries = useMemo(() => {
    const { start, end } = getDateRangeBounds(dateRange)
    return historyEntries.filter(entry => {
      const date = new Date(entry.date)
      return date >= start && date <= end
    })
  }, [dateRange])
  
  const stats = getHistoryStats()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-muted-foreground">Track grazing decisions over time</p>
        </div>
        <DateRangeSelector value={dateRange} onValueChange={setDateRange} />
      </div>

      {/* Stats summary - updated with section/transition breakdown */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Decisions</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Grid3X3 className="h-3.5 w-3.5" />
              <span>Section Rotations</span>
            </div>
            <p className="text-2xl font-semibold">{stats.sectionRotations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Paddock Transitions</span>
            </div>
            <p className="text-2xl font-semibold">{stats.paddockTransitions}</p>
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
            <p className="text-sm text-muted-foreground">Approval Rate</p>
            <p className="text-2xl font-semibold">{stats.approvalRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HistoryTimeline entries={filteredEntries} />
        <PerformanceTable data={paddockPerformance} />
      </div>
    </div>
  )
}
