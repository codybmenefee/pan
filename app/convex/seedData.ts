import type { Feature, Polygon, Point } from 'geojson'
import area from '@turf/area'
import { HECTARES_PER_SQUARE_METER } from './lib/areaConstants'

export const DEFAULT_FARM_EXTERNAL_ID = 'farm-1'
export const DEFAULT_USER_EXTERNAL_ID = 'dev-user-1'

export const defaultFarmSettings = {
  minNDVIThreshold: 0.4,
  minRestPeriod: 21,
  cloudCoverTolerance: 50,
  rotationFrequency: 1,
  dailyBriefTime: '06:00',
  emailNotifications: true,
  pushNotifications: false,
  virtualFenceProvider: '',
  apiKey: '',
  areaUnit: 'hectares' as const,
}

function calculateAreaHectares(feature: Feature<Polygon>, decimals = 1): number {
  if (!feature) return 0
  const squareMeters = area(feature)
  if (!Number.isFinite(squareMeters)) return 0
  const hectares = squareMeters * HECTARES_PER_SQUARE_METER
  const factor = Math.pow(10, decimals)
  return Math.round(hectares * factor) / factor
}

// Rotation configuration constants
export const ROTATION_CONFIG = {
  /** Minimum days to spend in a paddock before moving */
  MIN_DAYS_IN_PADDOCK: 3,
  /** Maximum days to spend in a paddock before moving */
  MAX_DAYS_IN_PADDOCK: 4,
  /** Minimum rest period between grazing same paddock (days) */
  MIN_REST_PERIOD: 21,
  /** NDVI recovery rate per day (approximate) */
  NDVI_RECOVERY_RATE_PER_DAY: 0.025,
  /** Minimum NDVI after grazing */
  MIN_NDVI_AFTER_GRAZING: 0.20,
  /** Maximum NDVI when fully recovered */
  MAX_NDVI_RECOVERED: 0.70,
  /** Default number of strips per paddock */
  DEFAULT_STRIPS_PER_PADDOCK: 3,
}

// Real paddock geometries from production (oriented over actual Columbia, TN fields)
export const paddockGeometries: Record<string, Feature<Polygon>> = {
  p1: {
    type: 'Feature',
    properties: { entityId: 'p1', entityType: 'paddock' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-87.0397151751705, 35.64517947639289],
        [-87.03859429334015, 35.64481193563437],
        [-87.03774455927639, 35.64426942801891],
        [-87.0392354865863, 35.64344523496971],
        [-87.04003725584133, 35.64408961008082],
        [-87.03960210716617, 35.644556580655056],
        [-87.03980940419737, 35.64493484980728],
        [-87.0397151751705, 35.64517947639289],
      ]],
    },
  },
  p2: {
    type: 'Feature',
    properties: { entityId: 'p2', entityType: 'paddock' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-87.04129253080069, 35.645489348163714],
        [-87.03998354641223, 35.64471899067983],
        [-87.0404278, 35.64461346],
        [-87.04047000608041, 35.64415853002819],
        [-87.03960934858975, 35.643314249419596],
        [-87.04119274471498, 35.64244250645793],
        [-87.04129253080069, 35.645489348163714],
      ]],
    },
  },
  p3: {
    type: 'Feature',
    properties: { entityId: 'p3', entityType: 'paddock' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-87.03793806153855, 35.64398436238422],
        [-87.0371872608203, 35.64407217655365],
        [-87.03602321174208, 35.64352716],
        [-87.03539432293357, 35.64318068832997],
        [-87.03522492457154, 35.64278754147296],
        [-87.03616337293026, 35.642323140968294],
        [-87.03793806153855, 35.64398436238422],
      ]],
    },
  },
  p4: {
    type: 'Feature',
    properties: { entityId: 'p4', entityType: 'paddock' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-87.03754364707473, 35.641668279812805],
        [-87.03628096325767, 35.642172808890706],
        [-87.03512001710901, 35.6425942771626],
        [-87.03485083970001, 35.64184580957378],
        [-87.03484013324115, 35.641175136772496],
        [-87.03658744189558, 35.64038521823965],
        [-87.03754364707473, 35.641668279812805],
      ]],
    },
  },
  p5: {
    type: 'Feature',
    properties: { entityId: 'p5', entityType: 'paddock' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-87.0406044827726, 35.6396559687299],
        [-87.0373031908863, 35.64106750277516],
        [-87.0366576096398, 35.64036891907377],
        [-87.04036547413159, 35.639016396706715],
        [-87.04062866443813, 35.63923238216604],
        [-87.0406044827726, 35.6396559687299],
      ]],
    },
  },
  p6: {
    type: 'Feature',
    properties: { entityId: 'p6', entityType: 'paddock' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-87.03884751709019, 35.64339541993121],
        [-87.03798785636894, 35.643953401441024],
        [-87.03625145893781, 35.64226066124887],
        [-87.03746820096396, 35.64183209220326],
        [-87.03884751709019, 35.64339541993121],
      ]],
    },
  },
  p7: {
    type: 'Feature',
    properties: { entityId: 'p7', entityType: 'paddock' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-87.03934550934439, 35.64193806372046],
        [-87.0389974656823, 35.642496819503236],
        [-87.03915182562857, 35.64304578996256],
        [-87.03900245715545, 35.64330015418798],
        [-87.03775642063364, 35.64177810914282],
        [-87.03911227371509, 35.641141876784275],
        [-87.03934550934439, 35.64193806372046],
      ]],
    },
  },
  p8: {
    type: 'Feature',
    properties: { entityId: 'p8', entityType: 'paddock' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-87.04123692533379, 35.64202019092877],
        [-87.04054797413285, 35.64239044525953],
        [-87.04031355794291, 35.64165524105345],
        [-87.03979879170721, 35.64112106426853],
        [-87.04076483026331, 35.64054630948765],
        [-87.04111631764795, 35.641068816643575],
        [-87.04091275646923, 35.64145069411512],
        [-87.04123692533379, 35.64202019092877],
      ]],
    },
  },
}

// Real farm boundary that encompasses all paddocks
const farmGeometry: Feature<Polygon> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-87.04303251567856, 35.646039653104296],
      [-87.03323954437344, 35.646039653104296],
      [-87.03323954437344, 35.638081167693215],
      [-87.04303251567856, 35.638081167693215],
      [-87.04303251567856, 35.646039653104296],
    ]],
  },
}

const farmCoordinates: [number, number] = [-87.03813603002601, 35.642060410398756]

const basePaddocks = [
  {
    externalId: 'p1',
    name: 'South Valley',
    status: 'recovering' as const,
    ndvi: 0.31,
    restDays: 14,
    waterAccess: 'Trough (north)',
    lastGrazed: 'Jan 2',
    geometry: paddockGeometries.p1,
  },
  {
    externalId: 'p2',
    name: 'North Flat',
    status: 'almost_ready' as const,
    ndvi: 0.48,
    restDays: 19,
    waterAccess: 'Stream (west)',
    lastGrazed: 'Dec 28',
    geometry: paddockGeometries.p2,
  },
  {
    externalId: 'p3',
    name: 'Top Block',
    status: 'recovering' as const,
    ndvi: 0.39,
    restDays: 16,
    waterAccess: 'Trough (center)',
    lastGrazed: 'Dec 31',
    geometry: paddockGeometries.p3,
  },
  {
    externalId: 'p4',
    name: 'East Ridge',
    status: 'ready' as const,
    ndvi: 0.52,
    restDays: 24,
    waterAccess: 'Creek (east)',
    lastGrazed: 'Dec 23',
    geometry: paddockGeometries.p4,
  },
  {
    externalId: 'p5',
    name: 'Creek Bend',
    status: 'grazed' as const,
    ndvi: 0.22,
    restDays: 3,
    waterAccess: 'Creek (south)',
    lastGrazed: 'Jan 13',
    geometry: paddockGeometries.p5,
  },
  {
    externalId: 'p6',
    name: 'West Slope',
    status: 'recovering' as const,
    ndvi: 0.35,
    restDays: 12,
    waterAccess: 'Trough (west)',
    lastGrazed: 'Jan 4',
    geometry: paddockGeometries.p6,
  },
  {
    externalId: 'p7',
    name: 'Creek Side',
    status: 'almost_ready' as const,
    ndvi: 0.44,
    restDays: 28,
    waterAccess: 'Creek (east)',
    lastGrazed: 'Dec 19',
    geometry: paddockGeometries.p7,
  },
  {
    externalId: 'p8',
    name: 'Lower Paddock',
    status: 'grazed' as const,
    ndvi: 0.19,
    restDays: 5,
    waterAccess: 'Trough (south)',
    lastGrazed: 'Jan 11',
    geometry: paddockGeometries.p8,
  },
]

export const samplePaddocks = basePaddocks.map((paddock) => ({
  ...paddock,
  area: calculateAreaHectares(paddock.geometry),
}))

export const sampleFarm = {
  externalId: DEFAULT_FARM_EXTERNAL_ID,
  name: 'Hillcrest Station',
  location: '120 River Heights Drive, Columbia, Tennessee, 38401',
  totalArea: 142,
  paddockCount: samplePaddocks.length,
  coordinates: farmCoordinates,
  geometry: farmGeometry,
}

// Sample water sources
export const sampleWaterSources: Array<{
  name: string
  type: 'trough' | 'pond' | 'dam' | 'tank' | 'stream' | 'other'
  geometryType: 'point' | 'polygon'
  geometry: Feature<Point> | Feature<Polygon>
  status: 'active' | 'seasonal' | 'maintenance' | 'dry'
  description?: string
}> = [
  {
    name: 'North Trough',
    type: 'trough',
    geometryType: 'point',
    geometry: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [-87.0392, 35.6448],
      },
    },
    status: 'active',
    description: 'Main water trough near paddocks p1 and p2',
  },
  {
    name: 'Creek Access',
    type: 'stream',
    geometryType: 'point',
    geometry: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [-87.0365, 35.6405],
      },
    },
    status: 'active',
    description: 'Natural creek access point',
  },
  {
    name: 'South Tank',
    type: 'tank',
    geometryType: 'point',
    geometry: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [-87.0400, 35.6395],
      },
    },
    status: 'active',
    description: 'Storage tank for southern paddocks',
  },
]

// Sample no-graze zones
export const sampleNoGrazeZones: Array<{
  name: string
  type: 'environmental' | 'hazard' | 'infrastructure' | 'protected' | 'other'
  description?: string
  geometry: Feature<Polygon>
}> = [
  {
    name: 'Riparian Buffer',
    type: 'environmental',
    description: 'Protected riparian zone along creek',
    geometry: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-87.0368, 35.6410],
          [-87.0362, 35.6410],
          [-87.0362, 35.6400],
          [-87.0368, 35.6400],
          [-87.0368, 35.6410],
        ]],
      },
    },
  },
]

// Sample livestock
export const sampleLivestock: Array<{
  animalType: 'cow' | 'sheep'
  adultCount: number
  offspringCount: number
  notes?: string
}> = [
  {
    animalType: 'cow',
    adultCount: 45,
    offspringCount: 12,
    notes: 'Angus beef cattle, spring calving herd',
  },
  {
    animalType: 'sheep',
    adultCount: 30,
    offspringCount: 8,
    notes: 'Mixed wool flock',
  },
]

// Sample plans with sections for strip grazing demonstration
// These are generated dynamically based on current date
export function generateSamplePlans(farmExternalId: string) {
  const today = new Date()

  // Helper to get date string N days ago
  const getDateString = (daysAgo: number): string => {
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().split('T')[0]
  }

  // East Ridge (p4) strip grazing sections - within the paddock bounds
  // p4 coordinates roughly: west=-87.0375, east=-87.0348, north=35.6426, south=35.6404
  const createEastRidgeStrip = (stripIndex: number): { type: 'Polygon'; coordinates: number[][][] } => {
    const westLng = -87.0370
    const eastLng = -87.0352
    const northLat = 35.6422
    const southLat = 35.6408

    const paddockHeight = northLat - southLat
    const stripHeight = paddockHeight * 0.30

    const stripNorth = northLat - (stripIndex * stripHeight)
    const stripSouth = stripNorth - stripHeight

    return {
      type: 'Polygon',
      coordinates: [[
        [westLng, stripNorth],
        [eastLng, stripNorth],
        [eastLng, stripSouth],
        [westLng, stripSouth],
        [westLng, stripNorth],
      ]],
    }
  }

  return [
    // Day -2: First strip (northern section)
    {
      farmExternalId,
      date: getDateString(2),
      primaryPaddockExternalId: 'p4',
      alternativePaddockExternalIds: [],
      confidenceScore: 82,
      reasoning: [
        'Day 1 of East Ridge rotation',
        'Starting from northern boundary for progressive strip grazing',
        'Good NDVI values in this section',
      ],
      status: 'executed' as const,
      sectionGeometry: createEastRidgeStrip(0),
      sectionAreaHectares: 1.1,
      sectionJustification: 'Progressive strip grazing - northern section',
      paddockGrazedPercentage: 30,
    },
    // Day -1: Second strip (middle section)
    {
      farmExternalId,
      date: getDateString(1),
      primaryPaddockExternalId: 'p4',
      alternativePaddockExternalIds: [],
      confidenceScore: 85,
      reasoning: [
        'Day 2 of East Ridge rotation',
        'Adjacent to previous section for efficient movement',
        'Continuing progressive strip pattern',
      ],
      status: 'executed' as const,
      sectionGeometry: createEastRidgeStrip(1),
      sectionAreaHectares: 1.1,
      sectionJustification: 'Progressive strip grazing - middle section',
      paddockGrazedPercentage: 60,
    },
    // Today: Third strip (southern section) - pending approval
    {
      farmExternalId,
      date: getDateString(0),
      primaryPaddockExternalId: 'p4',
      alternativePaddockExternalIds: ['p1', 'p2'],
      confidenceScore: 88,
      reasoning: [
        'Day 3 of East Ridge rotation',
        'Final strip completes paddock coverage',
        'Southern section has highest remaining NDVI',
      ],
      status: 'pending' as const,
      sectionGeometry: createEastRidgeStrip(2),
      sectionAreaHectares: 1.1,
      sectionJustification: 'Progressive strip grazing - southern section to complete rotation',
      paddockGrazedPercentage: 90,
    },
  ]
}

export const sampleGrazingEvents = [
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p4',
    date: '2026-01-16',
    durationDays: 4,
    notes: 'Cattle rotation - East Ridge',
  },
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p2',
    date: '2025-12-20',
    durationDays: 5,
    notes: 'Sheep rotation - North Flat',
  },
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p7',
    date: '2025-12-10',
    durationDays: 3,
    notes: 'Mixed herd - Creek Side',
  },
]

// Tutorial Demo Data - Ideal values for compelling screenshots
// Status distribution: 2 Ready, 2 Almost Ready, 2 Recovering, 2 Grazed (25% each)
export const tutorialDemoPaddocks = [
  { externalId: 'p1', name: 'South Valley', ndvi: 0.52, restDays: 28, status: 'ready' as const },     // Ready - fully recovered
  { externalId: 'p2', name: 'North Flat', ndvi: 0.48, restDays: 24, status: 'ready' as const },       // Ready - good candidate
  { externalId: 'p3', name: 'East Ridge', ndvi: 0.45, restDays: 18, status: 'almost_ready' as const }, // Almost Ready
  { externalId: 'p4', name: 'Creek Bend', ndvi: 0.42, restDays: 16, status: 'almost_ready' as const }, // Almost Ready
  { externalId: 'p5', name: 'Top Block', ndvi: 0.38, restDays: 12, status: 'recovering' as const },    // Recovering
  { externalId: 'p6', name: 'West Slope', ndvi: 0.35, restDays: 9, status: 'recovering' as const },    // Recovering
  { externalId: 'p7', name: 'Creek Side', ndvi: 0.28, restDays: 4, status: 'grazed' as const },        // Grazed
  { externalId: 'p8', name: 'Lower Paddock', ndvi: 0.22, restDays: 2, status: 'grazed' as const },     // Grazed
]

// Tutorial Demo Grazing Events - ~10 events over past 60 days showing healthy rotation
// Mix of statuses for ~70% approval rate
export function generateTutorialDemoGrazingEvents(farmExternalId: string) {
  const today = new Date()
  const events = [
    // Recent events (grazed paddocks)
    { paddockExternalId: 'p8', daysAgo: 2, status: 'approved', notes: 'Moved herd to Lower Paddock' },
    { paddockExternalId: 'p7', daysAgo: 6, status: 'approved', notes: 'Grazing Creek Side section' },
    // Recovering paddocks were grazed earlier
    { paddockExternalId: 'p6', daysAgo: 17, status: 'modified', notes: 'Adjusted to West Slope based on conditions' },
    { paddockExternalId: 'p5', daysAgo: 14, status: 'approved', notes: 'Top Block rotation' },
    // Almost ready paddocks grazed 2-3 weeks ago
    { paddockExternalId: 'p4', daysAgo: 26, status: 'approved', notes: 'Creek Bend looking good' },
    { paddockExternalId: 'p3', daysAgo: 22, status: 'approved', notes: 'East Ridge pasture quality excellent' },
    // Ready paddocks haven't been grazed in a while
    { paddockExternalId: 'p2', daysAgo: 48, status: 'approved', notes: 'North Flat rotation complete' },
    { paddockExternalId: 'p1', daysAgo: 56, status: 'modified', notes: 'Started with South Valley section' },
    // Some additional historical events
    { paddockExternalId: 'p8', daysAgo: 38, status: 'approved', notes: 'Lower Paddock cycle' },
    { paddockExternalId: 'p5', daysAgo: 45, status: 'rejected', notes: 'Skipped - weather conditions' },
  ]

  return events.map(event => {
    const date = new Date(today)
    date.setDate(date.getDate() - event.daysAgo)
    return {
      farmExternalId,
      paddockExternalId: event.paddockExternalId,
      date: date.toISOString().split('T')[0],
      durationDays: 3,
      notes: event.notes,
    }
  })
}

// Generate corresponding observations for tutorial demo NDVI values
export function generateTutorialDemoObservations(farmExternalId: string) {
  const today = new Date().toISOString().split('T')[0]

  return tutorialDemoPaddocks.map(paddock => ({
    farmExternalId,
    paddockExternalId: paddock.externalId,
    date: today,
    ndviMean: paddock.ndvi,
    ndviMin: Math.round((paddock.ndvi - 0.12) * 100) / 100,
    ndviMax: Math.round((paddock.ndvi + 0.10) * 100) / 100,
    ndviStd: 0.05,
    eviMean: Math.round(paddock.ndvi * 0.85 * 100) / 100,
    ndwiMean: Math.round((paddock.ndvi * 0.6 - 0.1) * 100) / 100,
    cloudFreePct: 92,
    pixelCount: 1100,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  }))
}

export const sampleFarmerObservations = [
  {
    farmId: '' as any, // Will be set during seeding
    authorId: DEFAULT_USER_EXTERNAL_ID,
    level: 'farm' as const,
    targetId: DEFAULT_FARM_EXTERNAL_ID,
    content: 'Noticed some areas recovering slower than expected after the recent rain. May need to adjust rotation timing.',
    tags: ['recovery', 'weather'],
    createdAt: new Date('2026-01-20T08:00:00Z').toISOString(),
  },
  {
    farmId: '' as any,
    authorId: DEFAULT_USER_EXTERNAL_ID,
    level: 'paddock' as const,
    targetId: 'p4',
    content: 'East Ridge looking excellent. Good grass cover, ready for grazing soon.',
    tags: ['ready', 'positive'],
    createdAt: new Date('2026-01-19T14:30:00Z').toISOString(),
  },
  {
    farmId: '' as any,
    authorId: DEFAULT_USER_EXTERNAL_ID,
    level: 'paddock' as const,
    targetId: 'p1',
    content: 'South Valley still showing signs of overgrazing from last rotation. Needs more rest time.',
    tags: ['recovery', 'concern'],
    createdAt: new Date('2026-01-18T10:15:00Z').toISOString(),
  },
]

// Pre-computed values to avoid function call issues in Convex bundler
// eviMean = Math.round(ndvi * 0.85 * 100) / 100
// ndwiMean = Math.round((ndvi * 0.6 - 0.1) * 100) / 100
export const sampleObservations = [
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p1',
    date: '2026-01-20',
    ndviMean: 0.31,
    ndviMin: 0.18,
    ndviMax: 0.42,
    ndviStd: 0.06,
    eviMean: 0.26,
    ndwiMean: 0.09,
    cloudFreePct: 95,
    pixelCount: 1250,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  },
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p2',
    date: '2026-01-20',
    ndviMean: 0.48,
    ndviMin: 0.35,
    ndviMax: 0.58,
    ndviStd: 0.05,
    eviMean: 0.41,
    ndwiMean: 0.19,
    cloudFreePct: 92,
    pixelCount: 1180,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  },
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p3',
    date: '2026-01-20',
    ndviMean: 0.39,
    ndviMin: 0.25,
    ndviMax: 0.51,
    ndviStd: 0.06,
    eviMean: 0.33,
    ndwiMean: 0.13,
    cloudFreePct: 98,
    pixelCount: 980,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  },
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p4',
    date: '2026-01-20',
    ndviMean: 0.52,
    ndviMin: 0.38,
    ndviMax: 0.64,
    ndviStd: 0.05,
    eviMean: 0.44,
    ndwiMean: 0.21,
    cloudFreePct: 90,
    pixelCount: 1100,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  },
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p5',
    date: '2026-01-20',
    ndviMean: 0.22,
    ndviMin: 0.12,
    ndviMax: 0.32,
    ndviStd: 0.05,
    eviMean: 0.19,
    ndwiMean: 0.03,
    cloudFreePct: 88,
    pixelCount: 1050,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  },
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p6',
    date: '2026-01-20',
    ndviMean: 0.35,
    ndviMin: 0.22,
    ndviMax: 0.46,
    ndviStd: 0.06,
    eviMean: 0.30,
    ndwiMean: 0.11,
    cloudFreePct: 94,
    pixelCount: 1150,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  },
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p7',
    date: '2026-01-20',
    ndviMean: 0.44,
    ndviMin: 0.30,
    ndviMax: 0.56,
    ndviStd: 0.05,
    eviMean: 0.37,
    ndwiMean: 0.16,
    cloudFreePct: 91,
    pixelCount: 1320,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  },
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p8',
    date: '2026-01-20',
    ndviMean: 0.19,
    ndviMin: 0.08,
    ndviMax: 0.28,
    ndviStd: 0.05,
    eviMean: 0.16,
    ndwiMean: 0.01,
    cloudFreePct: 87,
    pixelCount: 1400,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  },
]
