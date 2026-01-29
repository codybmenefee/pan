import type { Feature, Point, Polygon } from 'geojson'

export type PaddockStatus = 'ready' | 'almost_ready' | 'recovering' | 'grazed'

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

// Section: Ephemeral, AI-generated daily grazing polygon within a paddock
export interface Section {
  id: string
  paddockId: string
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

export interface Paddock {
  id: string
  name: string
  status: PaddockStatus
  ndvi: number
  restDays: number
  area: number
  waterAccess: string
  lastGrazed: string
  geometry: Feature<Polygon>
}

// Section alternative: Another possible section polygon within the same paddock
export interface SectionAlternative {
  id: string
  geometry: Feature<Polygon>
  targetArea: number
  confidence: number
  reasoning: string // Brief explanation of why this is an option
}

// Legacy paddock alternative (for paddock transitions)
export interface PaddockAlternative {
  paddockId: string
  confidence: number
}

export interface Plan {
  id: string
  date: string
  currentPaddockId: string // Where livestock are now
  recommendedPaddockId: string
  confidence: number
  reasoning: string[]
  status: PlanStatus
  approvedAt?: string
  briefNarrative: string
  // Section-based grazing fields
  daysInCurrentPaddock: number // How many days spent in current paddock
  totalDaysPlanned: number // Total days planned for current paddock rotation
  recommendedSection: Section // The AI-drawn polygon for today
  isPaddockTransition: boolean // True when moving to a new paddock
  nextPaddockId?: string // Only set when isPaddockTransition is true
  previousSections: Section[] // Sections already grazed in current paddock stay
  // Section alternatives: other polygon options within the same paddock
  sectionAlternatives: SectionAlternative[]
  // Paddock alternatives: only relevant for paddock transitions
  paddockAlternatives: PaddockAlternative[]
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

// Extended observation with EVI and NDWI for paddock detail view
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
  sectionGeometry?: Feature<Polygon> // The section that was grazed
}

// Paddock stay: A multi-day rotation through a paddock with multiple sections
export interface PaddockStay {
  id: string
  paddockId: string
  paddockName: string
  entryDate: string
  exitDate?: string // null if currently in this paddock
  sections: Section[]
  totalArea: number // hectares covered
}

export type HistoryEventType = 'section_rotation' | 'paddock_transition'

export interface HistoryEntry {
  id: string
  date: string
  paddockId: string
  paddockName: string
  planStatus: PlanStatus
  confidence: number
  reasoning: string
  wasModified: boolean
  userFeedback?: string
  // Section-related fields
  eventType: HistoryEventType
  sectionId?: string
  sectionArea?: number // hectares
  sectionGeometry?: Feature<Polygon>
  fromPaddockId?: string // For paddock transitions
  fromPaddockName?: string
  dayInPaddock?: number // e.g., "Day 3 of 5"
  totalDaysInPaddock?: number
}

export interface PaddockPerformance {
  paddockId: string
  paddockName: string
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
  paddockId: string
  paddockName: string
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
  currentPaddock: number // Days/sections in current paddock stay
  currentPaddockTotal: number // Total planned days in current paddock
}

// Grazing Stock (Pasture Savings Account) types
export type ReserveStatus = 'critical' | 'low' | 'healthy' | 'abundant'

export interface PaddockGrazingReserve {
  paddockId: string
  paddockName: string
  reserveDays: number // Forecasted days of grazing under stress
  status: ReserveStatus
  trend: 'up' | 'down' | 'stable'
  biomassEstimate: number // kg/ha proxy from NDVI
  dailyConsumption: number // kg/ha per day based on stocking
}

export interface GrazingStock {
  farmTotalDays: number // Total reserve days across all paddocks
  farmCapacityPercent: number // 0-100, how full the "savings account" is
  farmStatus: ReserveStatus
  farmTrend: 'up' | 'down' | 'stable'
  byPaddock: PaddockGrazingReserve[]
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
