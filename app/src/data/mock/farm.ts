import type { Farm, DataStatus } from '@/lib/types'
import type { Feature, Polygon } from 'geojson'
import { pastures } from '@/data/mock/pastures'

function createFarmBoundary(pastureGeometries: Feature<Polygon>[]): Feature<Polygon> {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  pastureGeometries.forEach((feature) => {
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

export const farm: Farm = {
  id: 'farm-1',
  name: 'Hillcrest Station',
  location: '943 Riverview Ln, Columbia, TN 38401',
  totalArea: 142,
  paddockCount: pastures.length,
  coordinates: [-87.0403892, 35.6389946], // Columbia, TN
  geometry: createFarmBoundary(pastures.map((pasture) => pasture.geometry)),
}

export const dataStatus: DataStatus = {
  lastSatellitePass: '2 days ago',
  cloudCoverage: 12,
  observationQuality: 'good',
  nextExpectedPass: 'Tomorrow',
}
