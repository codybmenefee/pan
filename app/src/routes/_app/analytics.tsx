import { createFileRoute } from '@tanstack/react-router'
import { 
  MetricCard, 
  RotationHeatmap, 
  FarmNDVIChart, 
  AccuracyChart,
  GrazingStockCard,
} from '@/components/analytics'
import { DateRangeSelector, type DateRange } from '@/components/history'
import { 
  farmMetrics, 
  rotationData, 
  farmNdviTrend, 
  recommendationAccuracy,
  sectionMetrics,
  movementMetrics,
  grazingStock,
} from '@/data/mock/analytics'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Grid3X3, Target, TrendingUp, Ruler, HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const Route = createFileRoute('/_app/analytics')({
  component: AnalyticsPage,
})

// Tooltip content for section metrics
const sectionTooltips = {
  totalSections: 'The total number of subdivisions across all paddocks. More sections allow for finer grazing control and shorter grazing periods per area.',
  avgSectionSize: 'Average area per section in hectares. Smaller sections enable more precise stock density management and reduce overgrazing risk.',
  avgSectionsPerPaddock: 'How many sections each paddock is divided into on average. Higher counts indicate more intensive rotational grazing management.',
  paddockUtilization: 'Percentage of paddock area grazed before moving stock. Higher utilization means more complete use of available forage without overgrazing.',
}

function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">Farm performance and insights</p>
        </div>
        <DateRangeSelector value={dateRange} onValueChange={setDateRange} />
      </div>

      {/* Movement Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricCard
          title="Movements YTD"
          value={movementMetrics.ytd}
          trend={movementMetrics.ytdTrend}
          trendDirection={movementMetrics.ytdTrend >= 0 ? 'up' : 'down'}
          trendLabel="vs last year"
          tooltip="Total herd moves between paddocks or sections since January 1st. Frequent, shorter moves indicate active rotational grazing that promotes pasture recovery."
        />
        <MetricCard
          title="Movements MTD"
          value={movementMetrics.mtd}
          trend={movementMetrics.mtdTrend}
          trendDirection={movementMetrics.mtdTrend >= 0 ? 'up' : 'down'}
          trendLabel="vs last month"
          tooltip="Herd movements this month. Compare against seasonal norms - more moves may be needed during fast growth periods, fewer during dormancy."
        />
        <MetricCard
          title="Current Paddock"
          value={`Day ${movementMetrics.currentPaddock} of ${movementMetrics.currentPaddockTotal}`}
          trendDirection="stable"
          tooltip="Progress through the current grazing period. Staying too long risks overgrazing; moving too early leaves forage unutilized."
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="Avg Rest Period"
          value={`${farmMetrics.avgRestPeriod} days`}
          trend={`${farmMetrics.avgRestPeriodChange} days`}
          trendDirection={farmMetrics.avgRestPeriodChange < 0 ? 'down' : 'up'}
          tooltip="Average days paddocks rest between grazing events. Adequate rest (typically 21-45 days depending on season) allows plants to fully recover root reserves and regrow."
        />
        <MetricCard
          title="Utilization Rate"
          value={`${farmMetrics.utilizationRate}%`}
          trend={farmMetrics.utilizationTrend}
          trendDirection="up"
          tooltip="Percentage of available forage consumed before moving. Target 60-80% - too low wastes pasture, too high stresses plants and slows regrowth."
        />
        <MetricCard
          title="Health Score"
          value={farmMetrics.healthScore}
          trendDirection={farmMetrics.healthTrend}
          tooltip="Overall pasture health grade based on NDVI trends, rest periods, and rotation consistency. Higher scores indicate sustainable grazing patterns that build soil and forage quality."
        />
      </div>

      {/* Grazing Stock (Pasture Savings Account) */}
      <GrazingStockCard data={grazingStock} />

      {/* Section Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Section Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm mb-1">
                <Grid3X3 className="h-3.5 w-3.5" />
                <span>Total Sections</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64" side="top">
                    {sectionTooltips.totalSections}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-semibold">{sectionMetrics.totalSections}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm mb-1">
                <Ruler className="h-3.5 w-3.5" />
                <span>Avg Section Size</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64" side="top">
                    {sectionTooltips.avgSectionSize}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-semibold">{sectionMetrics.avgSectionSize} ha</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Avg Sections/Paddock</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64" side="top">
                    {sectionTooltips.avgSectionsPerPaddock}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-semibold">{sectionMetrics.avgSectionsPerPaddock}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm mb-1">
                <Target className="h-3.5 w-3.5" />
                <span>Paddock Utilization</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64" side="top">
                    {sectionTooltips.paddockUtilization}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-semibold">{sectionMetrics.paddockUtilization}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RotationHeatmap 
          data={rotationData} 
          title="Rotation Heatmap (Section Counts)"
          showSectionCounts={true}
        />
        <div className="space-y-6">
          <FarmNDVIChart data={farmNdviTrend} />
          <AccuracyChart data={recommendationAccuracy} />
        </div>
      </div>
    </div>
  )
}
