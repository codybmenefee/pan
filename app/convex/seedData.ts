import type { Feature, Polygon } from 'geojson'
import area from '@turf/area'

const BASE_LNG = -87.0403892
const BASE_LAT = 35.6389946
const HECTARES_PER_SQUARE_METER = 1 / 10000

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

// Helper to generate EVI from NDVI (simplified approximation)
function estimateEvi(ndvi: number): number {
  return Math.round(ndvi * 0.85 * 100) / 100
}

// Helper to generate NDWI from NDVI (simplified approximation)
function estimateNdwi(ndvi: number): number {
  return Math.round((ndvi * 0.6 - 0.1) * 100) / 100
}

export const sampleObservations = [
  {
    farmExternalId: DEFAULT_FARM_EXTERNAL_ID,
    paddockExternalId: 'p1',
    date: '2026-01-20',
    ndviMean: 0.31,
    ndviMin: 0.18,
    ndviMax: 0.42,
    ndviStd: 0.06,
    eviMean: estimateEvi(0.31),
    ndwiMean: estimateNdwi(0.31),
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
    eviMean: estimateEvi(0.48),
    ndwiMean: estimateNdwi(0.48),
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
    eviMean: estimateEvi(0.39),
    ndwiMean: estimateNdwi(0.39),
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
    eviMean: estimateEvi(0.52),
    ndwiMean: estimateNdwi(0.52),
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
    eviMean: estimateEvi(0.22),
    ndwiMean: estimateNdwi(0.22),
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
    eviMean: estimateEvi(0.35),
    ndwiMean: estimateNdwi(0.35),
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
    eviMean: estimateEvi(0.44),
    ndwiMean: estimateNdwi(0.44),
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
    eviMean: estimateEvi(0.19),
    ndwiMean: estimateNdwi(0.19),
    cloudFreePct: 87,
    pixelCount: 1400,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
  },
]
