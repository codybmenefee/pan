import { describe, it, expect } from 'vitest'
import type { Feature, Polygon } from 'geojson'
import {
  calculateAreaHectares,
  getTranslationDelta,
  translatePolygon,
} from './geometryUtils'

// Helper to create a simple square polygon feature
function createSquarePolygon(
  minLng: number,
  minLat: number,
  size: number
): Feature<Polygon> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [minLng, minLat],
        [minLng + size, minLat],
        [minLng + size, minLat + size],
        [minLng, minLat + size],
        [minLng, minLat], // close the ring
      ]],
    },
  }
}

describe('calculateAreaHectares', () => {
  it('calculates area for a polygon', () => {
    // A roughly 1km x 1km square near the equator should be ~100 hectares
    // At latitude 0, 0.01 degrees is roughly 1.11 km
    const polygon = createSquarePolygon(0, 0, 0.01)
    const area = calculateAreaHectares(polygon)
    // Should be around 123 hectares (1.11km x 1.11km = ~1.23 km^2 = 123 ha)
    expect(area).toBeGreaterThan(100)
    expect(area).toBeLessThan(150)
  })

  it('returns 0 for null/undefined input', () => {
    expect(calculateAreaHectares(null as unknown as Feature<Polygon>)).toBe(0)
    expect(calculateAreaHectares(undefined as unknown as Feature<Polygon>)).toBe(0)
  })

  it('respects decimal parameter', () => {
    const polygon = createSquarePolygon(0, 0, 0.01)
    const area1 = calculateAreaHectares(polygon, 1)
    const area2 = calculateAreaHectares(polygon, 2)

    // area1 should have 1 decimal, area2 should have 2
    const decimal1Count = (area1.toString().split('.')[1] || '').length
    const decimal2Count = (area2.toString().split('.')[1] || '').length

    expect(decimal1Count).toBeLessThanOrEqual(1)
    expect(decimal2Count).toBeLessThanOrEqual(2)
  })
})

describe('getTranslationDelta', () => {
  it('detects pure translation', () => {
    const original = createSquarePolygon(0, 0, 0.01)
    const translated = createSquarePolygon(0.005, 0.003, 0.01)

    const delta = getTranslationDelta(original, translated)

    expect(delta).not.toBeNull()
    expect(delta!.deltaLng).toBeCloseTo(0.005, 10)
    expect(delta!.deltaLat).toBeCloseTo(0.003, 10)
  })

  it('returns null when shapes differ', () => {
    const original = createSquarePolygon(0, 0, 0.01)
    // Different size polygon
    const different = createSquarePolygon(0, 0, 0.02)

    const delta = getTranslationDelta(original, different)
    expect(delta).toBeNull()
  })

  it('returns null when vertex count differs', () => {
    const square = createSquarePolygon(0, 0, 0.01)
    const triangle: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [0, 0],
          [0.01, 0],
          [0.005, 0.01],
          [0, 0],
        ]],
      },
    }

    const delta = getTranslationDelta(square, triangle)
    expect(delta).toBeNull()
  })

  it('returns zero delta for identical polygons', () => {
    const polygon = createSquarePolygon(1, 1, 0.01)

    const delta = getTranslationDelta(polygon, polygon)

    expect(delta).not.toBeNull()
    expect(delta!.deltaLng).toBe(0)
    expect(delta!.deltaLat).toBe(0)
  })
})

describe('translatePolygon', () => {
  it('translates polygon by given delta', () => {
    const original = createSquarePolygon(0, 0, 0.01)
    const translated = translatePolygon(original, 0.1, 0.2)

    // First coordinate should be at (0.1, 0.2)
    expect(translated.geometry.coordinates[0][0][0]).toBeCloseTo(0.1, 10)
    expect(translated.geometry.coordinates[0][0][1]).toBeCloseTo(0.2, 10)
  })

  it('preserves polygon shape', () => {
    const original = createSquarePolygon(0, 0, 0.01)
    const translated = translatePolygon(original, 5, 10)

    // All vertices should be shifted by the same amount
    const origCoords = original.geometry.coordinates[0]
    const transCoords = translated.geometry.coordinates[0]

    for (let i = 0; i < origCoords.length; i++) {
      expect(transCoords[i][0] - origCoords[i][0]).toBeCloseTo(5, 10)
      expect(transCoords[i][1] - origCoords[i][1]).toBeCloseTo(10, 10)
    }
  })

  it('preserves feature properties', () => {
    const original: Feature<Polygon> = {
      type: 'Feature',
      properties: { name: 'test', id: 123 },
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
      },
    }

    const translated = translatePolygon(original, 1, 1)

    expect(translated.properties).toEqual({ name: 'test', id: 123 })
  })

  it('handles negative deltas', () => {
    const original = createSquarePolygon(1, 1, 0.01)
    const translated = translatePolygon(original, -0.5, -0.5)

    expect(translated.geometry.coordinates[0][0][0]).toBeCloseTo(0.5, 10)
    expect(translated.geometry.coordinates[0][0][1]).toBeCloseTo(0.5, 10)
  })
})
