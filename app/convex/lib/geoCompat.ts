import bbox from '@turf/bbox'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

/**
 * Lightweight centroid approximation using the geometry bounding box center.
 * This avoids extra Turf subpackage imports in the Convex runtime bundle.
 */
export function getFeatureCentroid(feature: Feature<Polygon | MultiPolygon>): [number, number] {
  const [minLng, minLat, maxLng, maxLat] = bbox(feature)
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
}

/**
 * Create a Polygon feature from a bbox tuple [minLng, minLat, maxLng, maxLat].
 */
export function createBboxPolygon(bounds: [number, number, number, number]): Feature<Polygon> {
  const [minLng, minLat, maxLng, maxLat] = bounds

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ],
      ],
    },
  }
}
