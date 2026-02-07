import type {
  FarmMetrics,
  RotationEntry,
  FarmNdviTrend,
  RecommendationAccuracy,
  MovementMetrics,
  GrazingStock,
} from '@/lib/types'

export const farmMetrics: FarmMetrics = {
  grazingEventsCount: 12,
  grazingEventsTrend: 15,
  avgRestPeriod: 24,
  avgRestPeriodChange: -2,
  utilizationRate: 78,
  utilizationTrend: 5,
  healthScore: 'B+',
  healthTrend: 'stable',
}

// Paddock-level metrics
export interface PaddockMetrics {
  totalPaddocks: number
  avgPaddockSize: number
  avgPaddocksPerPasture: number
  pastureUtilization: number // % of pasture area typically covered
}

export const paddockMetrics: PaddockMetrics = {
  totalPaddocks: 47,
  avgPaddockSize: 3.8,
  avgPaddocksPerPasture: 4.2,
  pastureUtilization: 92, // 92% of pasture area covered before transition
}

// Extended rotation entry with paddock counts
export interface ExtendedRotationEntry extends RotationEntry {
  paddockCounts: number[] // Number of paddocks grazed per week (0 if not grazed)
}

// Weekly rotation data for the last 6 weeks with paddock granularity
export const rotationData: ExtendedRotationEntry[] = [
  {
    pastureId: 'p4',
    pastureName: 'East Ridge',
    weeklyData: [true, false, false, true, false, false],
    paddockCounts: [4, 0, 0, 3, 0, 0],
  },
  {
    pastureId: 'p2',
    pastureName: 'North Flat',
    weeklyData: [false, true, false, false, true, false],
    paddockCounts: [0, 4, 0, 0, 5, 0],
  },
  {
    pastureId: 'p5',
    pastureName: 'Creek Bend',
    weeklyData: [false, false, true, false, false, true],
    paddockCounts: [0, 0, 4, 0, 0, 4],
  },
  {
    pastureId: 'p1',
    pastureName: 'South Valley',
    weeklyData: [true, false, false, true, false, false],
    paddockCounts: [5, 0, 0, 4, 0, 0],
  },
  {
    pastureId: 'p6',
    pastureName: 'West Slope',
    weeklyData: [false, true, false, false, true, false],
    paddockCounts: [0, 5, 0, 0, 4, 0],
  },
  {
    pastureId: 'p3',
    pastureName: 'Top Block',
    weeklyData: [false, false, true, false, false, false],
    paddockCounts: [0, 0, 3, 0, 0, 0],
  },
  {
    pastureId: 'p7',
    pastureName: 'Creek Side',
    weeklyData: [false, false, false, true, false, true],
    paddockCounts: [0, 0, 0, 6, 0, 5],
  },
  {
    pastureId: 'p8',
    pastureName: 'Lower Paddock',
    weeklyData: [true, false, true, false, true, false],
    paddockCounts: [7, 0, 6, 0, 7, 0],
  },
]

// Pasture utilization rates (% of pasture covered before moving)
export interface PastureUtilization {
  pastureId: string
  pastureName: string
  avgUtilization: number // percentage
  avgPaddocks: number
  trend: 'up' | 'down' | 'stable'
}

export const pastureUtilization: PastureUtilization[] = [
  { pastureId: 'p4', pastureName: 'East Ridge', avgUtilization: 95, avgPaddocks: 4, trend: 'stable' },
  { pastureId: 'p2', pastureName: 'North Flat', avgUtilization: 88, avgPaddocks: 4, trend: 'up' },
  { pastureId: 'p5', pastureName: 'Creek Bend', avgUtilization: 85, avgPaddocks: 4, trend: 'down' },
  { pastureId: 'p1', pastureName: 'South Valley', avgUtilization: 92, avgPaddocks: 5, trend: 'stable' },
  { pastureId: 'p6', pastureName: 'West Slope', avgUtilization: 90, avgPaddocks: 5, trend: 'up' },
  { pastureId: 'p3', pastureName: 'Top Block', avgUtilization: 78, avgPaddocks: 3, trend: 'down' },
  { pastureId: 'p7', pastureName: 'Creek Side', avgUtilization: 94, avgPaddocks: 6, trend: 'up' },
  { pastureId: 'p8', pastureName: 'Lower Paddock', avgUtilization: 96, avgPaddocks: 7, trend: 'stable' },
]

// Farm-wide NDVI trend over time (monthly averages)
export const farmNdviTrend: FarmNdviTrend[] = [
  { date: '2024-10-01', ndvi: 0.32 },
  { date: '2024-10-15', ndvi: 0.35 },
  { date: '2024-11-01', ndvi: 0.38 },
  { date: '2024-11-15', ndvi: 0.42 },
  { date: '2024-12-01', ndvi: 0.45 },
  { date: '2024-12-15', ndvi: 0.44 },
  { date: '2025-01-01', ndvi: 0.46 },
  { date: '2025-01-16', ndvi: 0.48 },
]

export const recommendationAccuracy: RecommendationAccuracy = {
  approvedAsIs: 85,
  modified: 12,
  rejected: 3,
}

export function getWeekLabels(): string[] {
  const labels: string[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i * 7))
    labels.push(`Wk ${6 - i}`)
  }

  return labels
}

// Movement metrics (paddock rotations + pasture transitions)
export const movementMetrics: MovementMetrics = {
  ytd: 47, // Total movements since Jan 1
  ytdTrend: 12, // 12% more than same period last year
  mtd: 8, // Movements this month
  mtdTrend: -5, // 5% fewer than same period last month
  currentPasture: 3, // Day 3 in current pasture
  currentPastureTotal: 5, // 5 days planned total
}

// Grazing Stock (Pasture Savings Account)
export const grazingStock: GrazingStock = {
  farmTotalDays: 42,
  farmCapacityPercent: 70,
  farmStatus: 'healthy',
  farmTrend: 'stable',
  lastUpdated: '2026-01-16',
  assumptionNote: 'Assumes zero precipitation and growth stall from today',
  byPasture: [
    {
      pastureId: 'p4',
      pastureName: 'East Ridge',
      reserveDays: 12,
      status: 'abundant',
      trend: 'up',
      biomassEstimate: 2400, // kg/ha
      dailyConsumption: 200, // kg/ha per day
    },
    {
      pastureId: 'p2',
      pastureName: 'North Flat',
      reserveDays: 8,
      status: 'healthy',
      trend: 'stable',
      biomassEstimate: 1600,
      dailyConsumption: 200,
    },
    {
      pastureId: 'p5',
      pastureName: 'Creek Bend',
      reserveDays: 4,
      status: 'low',
      trend: 'down',
      biomassEstimate: 800,
      dailyConsumption: 200,
    },
    {
      pastureId: 'p1',
      pastureName: 'South Valley',
      reserveDays: 6,
      status: 'healthy',
      trend: 'stable',
      biomassEstimate: 1200,
      dailyConsumption: 200,
    },
    {
      pastureId: 'p6',
      pastureName: 'West Slope',
      reserveDays: 3,
      status: 'critical',
      trend: 'down',
      biomassEstimate: 600,
      dailyConsumption: 200,
    },
    {
      pastureId: 'p3',
      pastureName: 'Top Block',
      reserveDays: 5,
      status: 'low',
      trend: 'stable',
      biomassEstimate: 1000,
      dailyConsumption: 200,
    },
    {
      pastureId: 'p7',
      pastureName: 'Creek Side',
      reserveDays: 2,
      status: 'critical',
      trend: 'down',
      biomassEstimate: 400,
      dailyConsumption: 200,
    },
    {
      pastureId: 'p8',
      pastureName: 'Lower Paddock',
      reserveDays: 2,
      status: 'critical',
      trend: 'stable',
      biomassEstimate: 400,
      dailyConsumption: 200,
    },
  ],
}
