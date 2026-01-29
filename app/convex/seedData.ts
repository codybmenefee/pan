import type { Feature, Polygon } from 'geojson'
import area from '@turf/area'
import { HECTARES_PER_SQUARE_METER } from './lib/areaConstants'

const BASE_LNG = -87.0403892
const BASE_LAT = 35.6389946

export const DEFAULT_FARM_EXTERNAL_ID = 'farm-1'
export const DEFAULT_USER_EXTERNAL_ID = 'dev-user-1'

export const defaultFarmSettings = {
  minNDVIThreshold: 0.4,
  minRestPeriod: 21,
  cloudCoverTolerance: 50,
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

function createPolygon(offsetLng: number, offsetLat: number, size: number): Feature<Polygon> {
  const lng = BASE_LNG + offsetLng
  const lat = BASE_LAT + offsetLat
  const s = size * 0.005

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lng, lat],
        [lng + s, lat],
        [lng + s, lat - s],
        [lng, lat - s],
        [lng, lat],
      ]],
    },
  }
}

function createFarmBoundary(paddockGeometries: Feature<Polygon>[]): Feature<Polygon> {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  paddockGeometries.forEach((feature) => {
    feature.geometry.coordinates[0].forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })
  })

  const padding = 0.006
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [minLng - padding, maxLat + padding],
        [maxLng + padding, maxLat + padding],
        [maxLng + padding, minLat - padding],
        [minLng - padding, minLat - padding],
        [minLng - padding, maxLat + padding],
      ]],
    },
  }
}

const basePaddocks = [
  {
    externalId: 'p1',
    name: 'South Valley',
    status: 'recovering',
    ndvi: 0.31,
    restDays: 14,
    waterAccess: 'Trough (north)',
    lastGrazed: 'Jan 2',
    geometry: createPolygon(0, 0, 1.2),
  },
  {
    externalId: 'p2',
    name: 'North Flat',
    status: 'almost_ready',
    ndvi: 0.48,
    restDays: 19,
    waterAccess: 'Stream (west)',
    lastGrazed: 'Dec 28',
    geometry: createPolygon(-0.008, 0.006, 1.1),
  },
  {
    externalId: 'p3',
    name: 'Top Block',
    status: 'recovering',
    ndvi: 0.39,
    restDays: 16,
    waterAccess: 'Trough (center)',
    lastGrazed: 'Dec 31',
    geometry: createPolygon(0.006, 0.008, 0.9),
  },
  {
    externalId: 'p4',
    name: 'East Ridge',
    status: 'ready',
    ndvi: 0.52,
    restDays: 24,
    waterAccess: 'Creek (east)',
    lastGrazed: 'Dec 23',
    geometry: createPolygon(0.012, 0.004, 1.0),
  },
  {
    externalId: 'p5',
    name: 'Creek Bend',
    status: 'grazed',
    ndvi: 0.22,
    restDays: 3,
    waterAccess: 'Creek (south)',
    lastGrazed: 'Jan 13',
    geometry: createPolygon(-0.006, -0.008, 1.0),
  },
  {
    externalId: 'p6',
    name: 'West Slope',
    status: 'recovering',
    ndvi: 0.35,
    restDays: 12,
    waterAccess: 'Trough (west)',
    lastGrazed: 'Jan 4',
    geometry: createPolygon(0.004, -0.008, 1.1),
  },
  {
    externalId: 'p7',
    name: 'Creek Side',
    status: 'almost_ready',
    ndvi: 0.44,
    restDays: 28,
    waterAccess: 'Creek (east)',
    lastGrazed: 'Dec 19',
    geometry: createPolygon(0.018, -0.004, 1.3),
  },
  {
    externalId: 'p8',
    name: 'Lower Paddock',
    status: 'grazed',
    ndvi: 0.19,
    restDays: 5,
    waterAccess: 'Trough (south)',
    lastGrazed: 'Jan 11',
    geometry: createPolygon(0.020, -0.012, 1.4),
  },
]

export const samplePaddocks = basePaddocks.map((paddock) => ({
  ...paddock,
  area: calculateAreaHectares(paddock.geometry),
}))

export const sampleFarm = {
  externalId: DEFAULT_FARM_EXTERNAL_ID,
  name: 'Hillcrest Station',
  location: '943 Riverview Ln, Columbia, TN 38401',
  totalArea: 142,
  paddockCount: samplePaddocks.length,
  coordinates: [BASE_LNG, BASE_LAT] as [number, number],
  geometry: createFarmBoundary(samplePaddocks.map((paddock) => paddock.geometry)),
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
