import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Feature, Polygon } from 'geojson'
import { useFarm } from '@/lib/convex/useFarm'
import { calculateAreaHectares } from '@/lib/geometry/geometryUtils'

interface UseFarmBoundaryResult {
  /** Whether boundary drawing is active */
  isDrawingBoundary: boolean
  /** Whether a boundary save is in progress */
  isSaving: boolean
  /** Whether the farm has a valid boundary (not the default tiny polygon) */
  hasBoundary: boolean
  /** Current boundary area in hectares */
  boundaryArea: number | null
  /** The existing farm boundary geometry, if valid */
  existingGeometry: Feature<Polygon> | null
  /** Start drawing a new boundary */
  startDraw: () => void
  /** Cancel boundary drawing */
  cancelDraw: () => void
  /** Save the drawn boundary */
  saveBoundary: (geometry: Feature<Polygon>) => Promise<void>
  /** Error message if save failed */
  error: string | null
}

/**
 * Determines if a farm geometry is a valid user-defined boundary
 * vs the default tiny polygon created on farm creation.
 */
function isValidBoundary(geometry: Feature<Polygon> | undefined): boolean {
  if (!geometry) return false

  const coords = geometry.geometry.coordinates[0]
  if (!coords || coords.length < 4) return false

  // Calculate the bounding box size
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  coords.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  })

  // If the bounding box is smaller than ~100m (0.001 degrees), it's likely the default
  const lngSpan = maxLng - minLng
  const latSpan = maxLat - minLat
  const minSpan = 0.0005 // About 50 meters

  return lngSpan > minSpan && latSpan > minSpan
}

export function useFarmBoundary(): UseFarmBoundaryResult {
  const { farm, farmId } = useFarm()
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateBoundary = useMutation(api.farms.updateFarmBoundary)

  const hasBoundary = isValidBoundary(farm?.geometry)
  const boundaryArea = hasBoundary && farm?.geometry
    ? calculateAreaHectares(farm.geometry)
    : null
  const existingGeometry = hasBoundary && farm?.geometry ? farm.geometry : null

  const startDraw = useCallback(() => {
    setIsDrawingBoundary(true)
    setError(null)
  }, [])

  const cancelDraw = useCallback(() => {
    setIsDrawingBoundary(false)
  }, [])

  const saveBoundary = useCallback(async (geometry: Feature<Polygon>) => {
    if (!farmId) {
      setError('No farm selected')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await updateBoundary({
        farmExternalId: farmId,
        geometry,
      })
      setIsDrawingBoundary(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save boundary')
    } finally {
      setIsSaving(false)
    }
  }, [farmId, updateBoundary])

  return {
    isDrawingBoundary,
    isSaving,
    hasBoundary,
    boundaryArea,
    existingGeometry,
    startDraw,
    cancelDraw,
    saveBoundary,
    error,
  }
}
