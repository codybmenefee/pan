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
  pastureYieldKgPerHa?: number
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
export type AgentProfileId = 'conservative' | 'balanced' | 'aggressive' | 'custom'

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
  agentProfileId?: AgentProfileId
  mapPreferences?: MapPreferences
  areaUnit?: AreaUnit
}

export type AgentRunStatus = 'started' | 'succeeded' | 'failed' | 'blocked'
export type AgentTriggerType = 'morning_brief' | 'observation_refresh' | 'plan_execution'
export type AgentRiskPosture = 'low' | 'medium' | 'high'
export type AgentExplanationStyle = 'concise' | 'balanced' | 'detailed'
export type AgentMemoryScope = 'farm' | 'paddock'
export type AgentMemoryStatus = 'active' | 'archived'
export type AgentMemorySource = 'farmer' | 'system'
export type AgentRunStepType = 'prompt' | 'tool_call' | 'tool_result' | 'decision' | 'error' | 'info'

export interface AgentBehaviorConfig {
  riskPosture: AgentRiskPosture
  explanationStyle: AgentExplanationStyle
  forageSensitivity: number
  movementBias: number
  enableWeatherSignals: boolean
}

export interface AgentRun {
  _id: string
  farmExternalId: string
  trigger: AgentTriggerType
  profileId: AgentProfileId
  adapterId: string
  provider?: string
  model?: string
  status: AgentRunStatus
  dryRun: boolean
  requestedBy: string
  toolCallCount?: number
  toolSummary?: string[]
  outputPlanId?: string
  errorCode?: string
  errorMessage?: string
  startedAt: string
  completedAt?: string
  latencyMs?: number
}

export interface AgentRunStep {
  _id: string
  runId: string
  farmExternalId: string
  stepIndex: number
  stepType: AgentRunStepType
  title: string
  toolName?: string
  justification?: string
  input?: unknown
  output?: unknown
  error?: string
  createdAt: string
}

export interface AgentRunDeepDive {
  run: AgentRun
  steps: AgentRunStep[]
  hasDeepDive: boolean
}

export interface AgentConfig {
  _id: string
  farmExternalId: string
  profileId: AgentProfileId
  behaviorConfig: AgentBehaviorConfig
  promptOverrideEnabled: boolean
  promptOverrideText?: string
  promptOverrideVersion: number
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface AgentMemory {
  _id: string
  farmExternalId: string
  scope: AgentMemoryScope
  targetId?: string
  title: string
  content: string
  tags?: string[]
  priority: number
  status: AgentMemoryStatus
  source: AgentMemorySource
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
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

// Progressive grazing types
export type RotationStatus = 'active' | 'completed' | 'interrupted'

export type StartingCorner = 'NW' | 'NE' | 'SW' | 'SE'

export type ProgressionDirection = 'horizontal' | 'vertical'

export interface UngrazedArea {
  approximateCentroid: [number, number] // [lng, lat]
  approximateAreaHa: number
  reason: string
  ndviAtSkip: number
}

export interface ProgressionSettings {
  defaultStartCorner: StartingCorner | 'auto'
  defaultDirection: ProgressionDirection | 'auto'
  trackUngrazedAreas: boolean
}

export interface ProgressionContext {
  rotationId: string
  sequenceNumber: number
  progressionQuadrant: string
  wasUngrazedAreaReturn: boolean
}

export interface PaddockRotation {
  id: string
  farmExternalId: string
  paddockExternalId: string
  status: RotationStatus
  startDate: string
  endDate?: string
  entryNdviMean: number
  startingCorner?: StartingCorner
  progressionDirection?: ProgressionDirection
  totalSectionsGrazed: number
  totalAreaGrazedHa: number
  grazedPercentage: number
  ungrazedAreas?: UngrazedArea[]
  exitNdviMean?: number
  daysInRotation?: number
  createdAt: string
  updatedAt: string
}

export interface SectionGrazingEvent {
  id: string
  farmExternalId: string
  paddockExternalId: string
  rotationId: string
  planId: string
  date: string
  sequenceNumber: number
  sectionGeometry: Feature<Polygon>
  sectionAreaHa: number
  centroid: [number, number]
  sectionNdviMean: number
  progressionQuadrant?: string
  adjacentToPrevious: boolean
  cumulativeAreaGrazedHa: number
  cumulativeGrazedPct: number
  createdAt: string
}

// ============================================================================
// PADDOCK FORECAST + DAILY PLAN TYPES
// ============================================================================

export type BriefDecision = 'MOVE' | 'STAY'

export type BriefStatus = 'pending' | 'approved' | 'rejected' | 'executed'

export type DailyPlanStatus = 'pending' | 'approved' | 'rejected'

export type ForecastStatus = 'active' | 'completed' | 'paused'

// Legacy type alias
export type GrazingPlanStatus = ForecastStatus

/**
 * Forecasted Section
 * A pre-generated section in a paddock rotation forecast
 */
export interface ForecastedSection {
  index: number
  geometry: Feature<Polygon>
  centroid: [number, number]
  areaHa: number
  quadrant: string
  estimatedDays: number
}

/**
 * Grazing History Entry
 * Record of what actually happened when a section was grazed
 */
export interface GrazingHistoryEntry {
  sectionIndex: number
  geometry: Feature<Polygon>
  areaHa: number
  startedDate: string
  endedDate: string
  actualDays: number
}

/**
 * Paddock Forecast
 * The baseline rotation forecast for a paddock - all sections pre-generated
 */
export interface PaddockForecast {
  id: string
  farmExternalId: string
  paddockExternalId: string
  status: ForecastStatus
  startingCorner: StartingCorner
  progressionDirection: ProgressionDirection
  targetSectionHa: number
  targetSectionPct: number
  forecastedSections: ForecastedSection[]
  estimatedTotalDays: number
  activeSectionIndex: number
  daysInActiveSection: number
  grazingHistory: GrazingHistoryEntry[]
  createdAt: string
  createdBy: 'agent' | 'farmer'
  updatedAt: string
}

/**
 * Daily Plan
 * Today's concrete grazing recommendation
 */
export interface DailyPlan {
  id: string
  farmExternalId: string
  date: string
  forecastId: string
  paddockExternalId: string
  recommendedSectionIndex: number
  sectionGeometry: Feature<Polygon>
  sectionAreaHa: number
  sectionCentroid: [number, number]
  daysInSection: number
  estimatedForageRemaining?: number
  currentNdvi?: number
  reasoning: string[]
  confidence: number
  status: DailyPlanStatus
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

// Legacy types for backward compatibility
export interface CompletedSectionRecord {
  geometry: Feature<Polygon>
  areaHa: number
  startedDate: string
  endedDate: string
  daysGrazed: number
}

export interface CurrentSectionState {
  geometry: Feature<Polygon>
  centroid: [number, number]
  areaHa: number
  quadrant: string
  startedDate: string
  daysInSection: number
}

/**
 * @deprecated Use PaddockForecast instead
 */
export interface PaddockGrazingPlan {
  id: string
  farmExternalId: string
  paddockExternalId: string
  status: GrazingPlanStatus
  startingCorner: StartingCorner
  progressionDirection: ProgressionDirection
  targetSectionHa: number
  targetSectionPct: number
  sectionsCompleted: number
  totalAreaGrazedHa: number
  grazedPercentage: number
  currentSection?: CurrentSectionState
  completedSections: CompletedSectionRecord[]
  createdAt: string
  createdBy: 'agent' | 'farmer'
  updatedAt: string
}

/**
 * @deprecated Use DailyPlan instead
 */
export interface DailyBrief {
  id: string
  farmExternalId: string
  date: string
  decision: BriefDecision
  paddockExternalId: string
  sectionGeometry?: Feature<Polygon>
  sectionAreaHa?: number
  sectionCentroid?: [number, number]
  daysInCurrentSection: number
  estimatedForageRemaining?: number
  currentNdvi?: number
  reasoning: string[]
  confidence: number
  status: BriefStatus
  grazingPlanId?: string
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

/**
 * Grazing Principles
 * Farm-level rules that the agent follows when making decisions
 */
export interface GrazingPrinciples {
  minDaysPerSection: number
  maxDaysPerSection: number
  minNdviThreshold: number
  preferHighNdviAreas: boolean
  requireAdjacentSections: boolean
  allowSectionOverlapPct: number
  fillCornersCompletely: boolean
  avoidSkinnyStrips: boolean
  defaultStartingCorner: StartingCorner
  defaultDirection: ProgressionDirection
  customRules?: string[]
}
