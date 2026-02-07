import type { Pasture } from '@/lib/types'
import { calculateAreaHectares } from '@/lib/geometry/geometryUtils'

// Columbia, TN area - realistic farm layout
const baseLng = -87.0403892
const baseLat = 35.6389946

function createPolygon(offsetLng: number, offsetLat: number, size: number): Pasture['geometry'] {
  const lng = baseLng + offsetLng
  const lat = baseLat + offsetLat
  const s = size * 0.005 // scale factor

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

function createPasture(data: Omit<Pasture, 'area'>): Pasture {
  return {
    ...data,
    area: calculateAreaHectares(data.geometry),
  }
}

export const pastures: Pasture[] = [
  createPasture({
    id: 'p1',
    name: 'South Valley',
    status: 'recovering',
    ndvi: 0.31,
    restDays: 14,
    waterAccess: 'Trough (north)',
    lastGrazed: 'Jan 2',
    geometry: createPolygon(0, 0, 1.2),
  }),
  createPasture({
    id: 'p2',
    name: 'North Flat',
    status: 'almost_ready',
    ndvi: 0.48,
    restDays: 19,
    waterAccess: 'Stream (west)',
    lastGrazed: 'Dec 28',
    geometry: createPolygon(-0.008, 0.006, 1.1),
  }),
  createPasture({
    id: 'p3',
    name: 'Top Block',
    status: 'recovering',
    ndvi: 0.39,
    restDays: 16,
    waterAccess: 'Trough (center)',
    lastGrazed: 'Dec 31',
    geometry: createPolygon(0.006, 0.008, 0.9),
  }),
  createPasture({
    id: 'p4',
    name: 'East Ridge',
    status: 'ready',
    ndvi: 0.52,
    restDays: 24,
    waterAccess: 'Creek (east)',
    lastGrazed: 'Dec 23',
    geometry: createPolygon(0.012, 0.004, 1.0),
  }),
  createPasture({
    id: 'p5',
    name: 'Creek Bend',
    status: 'grazed',
    ndvi: 0.22,
    restDays: 3,
    waterAccess: 'Creek (south)',
    lastGrazed: 'Jan 13',
    geometry: createPolygon(-0.006, -0.008, 1.0),
  }),
  createPasture({
    id: 'p6',
    name: 'West Slope',
    status: 'recovering',
    ndvi: 0.35,
    restDays: 12,
    waterAccess: 'Trough (west)',
    lastGrazed: 'Jan 4',
    geometry: createPolygon(0.004, -0.008, 1.1),
  }),
  createPasture({
    id: 'p7',
    name: 'Creek Side',
    status: 'almost_ready',
    ndvi: 0.44,
    restDays: 28,
    waterAccess: 'Creek (east)',
    lastGrazed: 'Dec 19',
    geometry: createPolygon(0.018, -0.004, 1.3),
  }),
  createPasture({
    id: 'p8',
    name: 'Lower Paddock',
    status: 'grazed',
    ndvi: 0.19,
    restDays: 5,
    waterAccess: 'Trough (south)',
    lastGrazed: 'Jan 11',
    geometry: createPolygon(0.020, -0.012, 1.4),
  }),
]

export function getPastureById(id: string): Pasture | undefined {
  return pastures.find(p => p.id === id)
}

export function getPasturesByStatus(status: Pasture['status']): Pasture[] {
  return pastures.filter(p => p.status === status)
}

export function getStatusCounts(): Record<Pasture['status'], number> {
  return pastures.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {} as Record<Pasture['status'], number>)
}
