import type { Feature, Point, Polygon } from 'geojson'

export type PastureStatus = 'ready' | 'almost_ready' | 'recovering' | 'grazed'

// Livestock types
export type AnimalType = 'cow' | 'sheep'

export interface LivestockEntry {
  id: string
  farmId: string
  animalType: AnimalType
  adultCount: number
  offspringCount: number
  notes?: string
}

export interface LivestockSettings {
  cowAU: number
  calfAU: number
  sheepAU: number
  lambAU: number
  dailyDMPerAU: number
}

export interface LivestockSummary {
  cows: number
  calves: number
  sheep: number
  lambs: number
  totalAnimalUnits: number
  dailyConsumptionKg: number
  auFactors: LivestockSettings
}

export type PlanStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'modified'

// Paddock: Ephemeral, AI-generated daily grazing polygon within a pasture
export interface Paddock {
  id: string
  pastureId: string
  date: string
  geometry: Feature<Polygon>
  targetArea: number // hectares
  reasoning: string[] // Why this shape/location
}

export interface Farm {
  id: string
  name: string
  location: string
  totalArea: number
  paddockCount: number
  coordinates: [number, number] // [lng, lat] center point
  geometry: Feature<Polygon>
}

export interface Pasture {
  id: string
  name: string
  status: PastureStatus
  ndvi: number
  restDays: number
  area: number
  waterAccess: string
  lastGrazed: string
  geometry: Feature<Polygon>
}

// Paddock alternative: Another possible paddock polygon within the same pasture
export interface PaddockAlternative {
  id: string
  geometry: Feature<Polygon>
  targetArea: number
  confidence: number
  reasoning: string // Brief explanation of why this is an option
}

// Pasture alternative (for pasture transitions)
export interface PastureAlternative {
  pastureId: string
  confidence: number
}

export interface Plan {
  id: string
  date: string
  currentPastureId: string // Where livestock are now
  recommendedPastureId: string
  confidence: number
  reasoning: string[]
  status: PlanStatus
  approvedAt?: string
  briefNarrative: string
  // Paddock-based grazing fields
  daysInCurrentPasture: number // How many days spent in current pasture
  totalDaysPlanned: number // Total days planned for current pasture rotation
  recommendedPaddock: Paddock // The AI-drawn polygon for today
  isPastureTransition: boolean // True when moving to a new pasture
  nextPastureId?: string // Only set when isPastureTransition is true
  previousPaddocks: Paddock[] // Paddocks already grazed in current pasture stay
  // Paddock alternatives: other polygon options within the same pasture
  paddockAlternatives: PaddockAlternative[]
  // Pasture alternatives: only relevant for pasture transitions
  pastureAlternatives: PastureAlternative[]
}

export interface Observation {
  id: string
  paddockId: string
  date: string
  ndviMean: number
  ndviMin: number
  ndviMax: number
  ndviStd: number
  eviMean: number
  ndwiMean: number
  cloudFreePct: number
  pixelCount: number
  isValid: boolean
  sourceProvider: string
  resolutionMeters: number
}

export interface DataStatus {
  lastSatellitePass: string
  cloudCoverage: number
  observationQuality: 'good' | 'limited' | 'poor'
  nextExpectedPass: string
}

// Extended observation with EVI and NDWI for pasture detail view
export interface ExtendedObservation extends Observation {
  evi?: number
  ndwi?: number
}

// History types
export interface GrazingEvent {
  id: string
  paddockId: string
  date: string
  duration: number // days
  entryNdvi: number
  exitNdvi: number
  paddockGeometry?: Feature<Polygon> // The paddock that was grazed
}

// Pasture stay: A multi-day rotation through a pasture with multiple paddocks
export interface PastureStay {
  id: string
  pastureId: string
  pastureName: string
  entryDate: string
  exitDate?: string // null if currently in this pasture
  paddocks: Paddock[]
  totalArea: number // hectares covered
}

export type HistoryEventType = 'paddock_rotation' | 'pasture_transition'

export interface HistoryEntry {
  id: string
  date: string
  pastureId: string
  pastureName: string
  planStatus: PlanStatus
  confidence: number
  reasoning: string
  wasModified: boolean
  userFeedback?: string
  // Paddock-related fields
  eventType: HistoryEventType
  paddockId?: string
  paddockArea?: number // hectares
  paddockGeometry?: Feature<Polygon>
  fromPastureId?: string // For pasture transitions
  fromPastureName?: string
  dayInPasture?: number // e.g., "Day 3 of 5"
  totalDaysInPasture?: number
}

export interface PasturePerformance {
  pastureId: string
  pastureName: string
  totalUses: number
  avgRestDays: number
  avgNdvi: number
  trend: 'up' | 'down' | 'stable'
}

// Map preferences for persisting user's map layer settings
export interface MapPreferences {
  showRGBSatellite: boolean
  showNDVIHeatmap?: boolean
}

// Area unit type
export type AreaUnit = 'hectares' | 'acres'

// Settings types
export interface FarmSettings {
  minNDVIThreshold: number
  minRestPeriod: number
  cloudCoverTolerance: number
  rotationFrequency: number
  dailyBriefTime: string
  emailNotifications: boolean
  pushNotifications: boolean
  virtualFenceProvider?: string
  apiKey?: string
  mapPreferences?: MapPreferences
  areaUnit?: AreaUnit
}

// Analytics types
export interface FarmMetrics {
  grazingEventsCount: number
  grazingEventsTrend: number // percentage change
  avgRestPeriod: number
  avgRestPeriodChange: number // days change
  utilizationRate: number
  utilizationTrend: number // percentage change
  healthScore: string // e.g., "B+"
  healthTrend: 'up' | 'down' | 'stable'
}

export interface RotationEntry {
  pastureId: string
  pastureName: string
  weeklyData: boolean[] // true if grazed that week
}

export interface FarmNdviTrend {
  date: string
  ndvi: number
}

export interface RecommendationAccuracy {
  approvedAsIs: number // percentage
  modified: number
  rejected: number
}

// Movement tracking types
export interface MovementMetrics {
  ytd: number // Total movements year-to-date
  ytdTrend: number // Percentage change vs same period last year
  mtd: number // Total movements month-to-date
  mtdTrend: number // Percentage change vs same period last month
  currentPasture: number // Days/paddocks in current pasture stay
  currentPastureTotal: number // Total planned days in current pasture
}

// Grazing Stock (Pasture Savings Account) types
export type ReserveStatus = 'critical' | 'low' | 'healthy' | 'abundant'

export interface PastureGrazingReserve {
  pastureId: string
  pastureName: string
  reserveDays: number // Forecasted days of grazing under stress
  status: ReserveStatus
  trend: 'up' | 'down' | 'stable'
  biomassEstimate: number // kg/ha proxy from NDVI
  dailyConsumption: number // kg/ha per day based on stocking
}

export interface GrazingStock {
  farmTotalDays: number // Total reserve days across all pastures
  farmCapacityPercent: number // 0-100, how full the "savings account" is
  farmStatus: ReserveStatus
  farmTrend: 'up' | 'down' | 'stable'
  byPasture: PastureGrazingReserve[]
  lastUpdated: string // ISO date
  assumptionNote: string // e.g., "Assumes zero precipitation and growth stall"
}

// No-graze zone types
export type NoGrazeZoneType = 'environmental' | 'hazard' | 'infrastructure' | 'protected' | 'other'

// No-graze zones (farm-level exclusion areas)
export interface NoGrazeZone {
  id: string
  farmId: string
  name: string
  type: NoGrazeZoneType
  area: number
  description?: string
  geometry: Feature<Polygon>
  createdAt: string
  updatedAt: string
}

// Water source types
export type WaterSourceType = 'trough' | 'pond' | 'dam' | 'tank' | 'stream' | 'other'

// Water source status
export type WaterSourceStatus = 'active' | 'seasonal' | 'maintenance' | 'dry'

// Water sources (can be point or polygon)
export interface WaterSource {
  id: string
  farmId: string
  name: string
  type: WaterSourceType
  geometryType: 'point' | 'polygon'
  geometry: Feature<Point | Polygon>
  area?: number
  description?: string
  status?: WaterSourceStatus
  createdAt: string
  updatedAt: string
}
