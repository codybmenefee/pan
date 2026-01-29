import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import area from '@turf/area'
import intersect from '@turf/intersect'
import { featureCollection, polygon } from '@turf/helpers'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { HECTARES_PER_SQUARE_METER } from '@/lib/areaUnits'

const DEFAULT_TOLERANCE = 1e-8
const AREA_DECIMALS = 1

export function calculateAreaHectares(feature: Feature<Polygon | MultiPolygon>, decimals = AREA_DECIMALS): number {
  if (!feature) return 0
  const squareMeters = area(feature)
  if (!Number.isFinite(squareMeters)) return 0
  const hectares = squareMeters * HECTARES_PER_SQUARE_METER
  const factor = Math.pow(10, decimals)
  return Math.round(hectares * factor) / factor
}

export interface TranslationDelta {
  deltaLng: number
  deltaLat: number
}

export function getTranslationDelta(
  previous: Feature<Polygon>,
  next: Feature<Polygon>,
  tolerance: number = DEFAULT_TOLERANCE
): TranslationDelta | null {
  const prevRing = previous.geometry.coordinates[0]
  const nextRing = next.geometry.coordinates[0]

  if (prevRing.length !== nextRing.length || prevRing.length === 0) {
    return null
  }

  const deltaLng = nextRing[0][0] - prevRing[0][0]
  const deltaLat = nextRing[0][1] - prevRing[0][1]

  for (let i = 0; i < prevRing.length; i += 1) {
    const [prevLng, prevLat] = prevRing[i]
    const [nextLng, nextLat] = nextRing[i]
    if (Math.abs(prevLng + deltaLng - nextLng) > tolerance || Math.abs(prevLat + deltaLat - nextLat) > tolerance) {
      return null
    }
  }

  return { deltaLng, deltaLat }
}

export function translatePolygon(
  feature: Feature<Polygon>,
  deltaLng: number,
  deltaLat: number
): Feature<Polygon> {
  const translatedCoordinates = feature.geometry.coordinates.map((ring) =>
    ring.map(([lng, lat]) => [lng + deltaLng, lat + deltaLat] as Position)
  )

  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: translatedCoordinates,
    },
  }
}

export function clipPolygonToPolygon(
  subject: Feature<Polygon>,
  boundary: Feature<Polygon>
): Feature<Polygon> | null {
  const result = intersect(featureCollection([subject, boundary]))

  if (!result) {
    console.log('[Sections] clipPolygonToPolygon: no intersection result')
    return null
  }

  const feature = result as Feature<GeoJSON.Geometry, Record<string, unknown>>
  const geometryType = feature.geometry.type

  if (geometryType === 'Polygon') {
    return result as Feature<Polygon>
  }

  if (geometryType === 'MultiPolygon') {
    const multi = result.geometry as MultiPolygon
    let bestPolygon: Position[][] | null = null
    let bestArea = -Infinity

    multi.coordinates.forEach((coordinates) => {
      const candidate = polygon(coordinates)
      const candidateArea = area(candidate)
      if (candidateArea > bestArea) {
        bestArea = candidateArea
        bestPolygon = coordinates
      }
    })

    if (!bestPolygon) {
      console.log('[Sections] clipPolygonToPolygon: no best polygon found in MultiPolygon')
      return null
    }

    return {
      ...result,
      geometry: {
        type: 'Polygon',
        coordinates: bestPolygon,
      },
    }
  }

  console.log('[Sections] clipPolygonToPolygon: unexpected geometry type:', result.geometry.type)
  return null
}

/**
 * Creates a square polygon from an anchor corner and a target corner.
 * The square is computed in screen space to ensure visual squareness
 * regardless of latitude, then converted back to geographic coordinates.
 *
 * @param map - The MapLibre map instance for coordinate conversion
 * @param anchor - The fixed corner [lng, lat] that stays in place
 * @param target - The cursor/target position [lng, lat]
 * @returns A GeoJSON Feature<Polygon> representing the square
 */
export function createSquareFromCorners(
  map: MapLibreMap,
  anchor: [number, number],
  target: [number, number]
): Feature<Polygon> {
  // Convert to screen coordinates
  const anchorScreen = map.project(anchor)
  const targetScreen = map.project(target)

  // Calculate deltas in screen space
  const dx = targetScreen.x - anchorScreen.x
  const dy = targetScreen.y - anchorScreen.y

  // Use max of |dx| or |dy| as the square's side length
  const side = Math.max(Math.abs(dx), Math.abs(dy))

  // Determine direction signs (which quadrant the target is in)
  const signX = dx >= 0 ? 1 : -1
  const signY = dy >= 0 ? 1 : -1

  // Compute the 4 corners in screen space
  // anchor is one corner, compute the other 3 to form a square
  const corners = [
    { x: anchorScreen.x, y: anchorScreen.y },
    { x: anchorScreen.x + side * signX, y: anchorScreen.y },
    { x: anchorScreen.x + side * signX, y: anchorScreen.y + side * signY },
    { x: anchorScreen.x, y: anchorScreen.y + side * signY },
  ]

  // Convert back to geographic coordinates
  const geoCorners: Position[] = corners.map((pt) => {
    const lngLat = map.unproject([pt.x, pt.y])
    return [lngLat.lng, lngLat.lat]
  })

  // Close the polygon
  geoCorners.push(geoCorners[0])

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [geoCorners],
    },
  }
}
