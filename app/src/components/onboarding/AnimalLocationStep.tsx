import { useState, useCallback, useEffect, useMemo } from 'react'
import { useMutation } from 'convex/react'
import { Check, MapPin, Pencil, X } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useGeometry } from '@/lib/geometry'
import { calculateAreaHectares } from '@/lib/geometry/geometryUtils'
import { createSquareFromCorners } from '@/lib/geometry'
import type { Feature, Polygon } from 'geojson'
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl'
import type { Pasture } from '@/lib/types'

interface AnimalLocationStepProps {
  farmExternalId: string
  map: MapLibreMap | null
  onComplete: () => void
  onSkip?: () => void
}

const PADDOCK_PREVIEW_SOURCE = 'animal-location-paddock-preview'
const PADDOCK_PREVIEW_FILL = 'animal-location-paddock-fill'
const PADDOCK_PREVIEW_OUTLINE = 'animal-location-paddock-outline'
const START_POINT_SOURCE = 'animal-location-start-point'
const START_POINT_MARKER = 'animal-location-start-marker'

type StepPhase = 'select-pasture' | 'draw-paddock' | 'confirm'

export function AnimalLocationStep({
  farmExternalId,
  map,
  onComplete,
  onSkip,
}: AnimalLocationStepProps) {
  const { pastures } = useGeometry()
  const setInitialLocation = useMutation(api.onboarding.setInitialAnimalLocation)

  const [phase, setPhase] = useState<StepPhase>('select-pasture')
  const [selectedPasture, setSelectedPasture] = useState<Pasture | null>(null)
  const [paddockGeometry, setPaddockGeometry] = useState<Feature<Polygon> | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)


  // Setup preview layer for paddock drawing
  useEffect(() => {
    if (!map) return

    const emptyCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    }

    // Setup function to add layers when map is ready
    const setupLayers = () => {
      try {
        if (!map.getStyle()) return

        // Add source and layers if they don't exist
        if (!map.getSource(PADDOCK_PREVIEW_SOURCE)) {
          map.addSource(PADDOCK_PREVIEW_SOURCE, {
            type: 'geojson',
            data: emptyCollection,
          })

          map.addLayer({
            id: PADDOCK_PREVIEW_FILL,
            type: 'fill',
            source: PADDOCK_PREVIEW_SOURCE,
            paint: {
              'fill-color': '#f59e0b',
              'fill-opacity': 0.4,
            },
          })

          map.addLayer({
            id: PADDOCK_PREVIEW_OUTLINE,
            type: 'line',
            source: PADDOCK_PREVIEW_SOURCE,
            paint: {
              'line-color': '#f59e0b',
              'line-width': 3,
              'line-dasharray': [4, 2],
            },
          })
        }

        // Add start point marker source and layer
        if (!map.getSource(START_POINT_SOURCE)) {
          map.addSource(START_POINT_SOURCE, {
            type: 'geojson',
            data: emptyCollection,
          })

          map.addLayer({
            id: START_POINT_MARKER,
            type: 'circle',
            source: START_POINT_SOURCE,
            paint: {
              'circle-radius': 10,
              'circle-color': '#ffffff',
              'circle-stroke-color': '#f59e0b',
              'circle-stroke-width': 3,
            },
          })
        }
      } catch {
        // Map may be in transition
      }
    }

    // Try to set up layers immediately if map is ready
    if (map.isStyleLoaded()) {
      setupLayers()
    } else {
      // Wait for style to load
      map.once('style.load', setupLayers)
    }

    return () => {
      try {
        if (map && map.getStyle()) {
          if (map.getLayer(PADDOCK_PREVIEW_FILL)) {
            map.removeLayer(PADDOCK_PREVIEW_FILL)
          }
          if (map.getLayer(PADDOCK_PREVIEW_OUTLINE)) {
            map.removeLayer(PADDOCK_PREVIEW_OUTLINE)
          }
          if (map.getSource(PADDOCK_PREVIEW_SOURCE)) {
            map.removeSource(PADDOCK_PREVIEW_SOURCE)
          }
          if (map.getLayer(START_POINT_MARKER)) {
            map.removeLayer(START_POINT_MARKER)
          }
          if (map.getSource(START_POINT_SOURCE)) {
            map.removeSource(START_POINT_SOURCE)
          }
        }
      } catch {
        // Map may be destroyed
      }
    }
  }, [map])

  // Update preview layer
  const updatePreview = useCallback((geometry: Feature<Polygon> | null) => {
    if (!map) return

    try {
      if (!map.getStyle()) return

      // Ensure source exists
      if (!map.getSource(PADDOCK_PREVIEW_SOURCE)) {
        map.addSource(PADDOCK_PREVIEW_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
      }

      // Ensure layers exist
      if (!map.getLayer(PADDOCK_PREVIEW_FILL)) {
        map.addLayer({
          id: PADDOCK_PREVIEW_FILL,
          type: 'fill',
          source: PADDOCK_PREVIEW_SOURCE,
          paint: {
            'fill-color': '#f59e0b',
            'fill-opacity': 0.4,
          },
        })
      }
      if (!map.getLayer(PADDOCK_PREVIEW_OUTLINE)) {
        map.addLayer({
          id: PADDOCK_PREVIEW_OUTLINE,
          type: 'line',
          source: PADDOCK_PREVIEW_SOURCE,
          paint: {
            'line-color': '#f59e0b',
            'line-width': 3,
            'line-dasharray': [4, 2],
          },
        })
      }

      const source = map.getSource(PADDOCK_PREVIEW_SOURCE) as GeoJSONSource | undefined
      if (!source) return

      if (geometry) {
        // Move preview layers to top for visibility
        map.moveLayer(PADDOCK_PREVIEW_FILL)
        map.moveLayer(PADDOCK_PREVIEW_OUTLINE)
        source.setData({
          type: 'FeatureCollection',
          features: [geometry],
        })
      } else {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        })
      }
    } catch {
      // Map in transition
    }
  }, [map])

  // Update start point marker
  const updateStartPointMarker = useCallback((point: [number, number] | null) => {
    if (!map) return
    try {
      if (!map.getStyle()) return

      // Ensure layer exists (may have been removed or not yet added)
      if (!map.getSource(START_POINT_SOURCE)) {
        map.addSource(START_POINT_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
      }
      if (!map.getLayer(START_POINT_MARKER)) {
        map.addLayer({
          id: START_POINT_MARKER,
          type: 'circle',
          source: START_POINT_SOURCE,
          paint: {
            'circle-radius': 10,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#f59e0b',
            'circle-stroke-width': 3,
          },
        })
      }

      const source = map.getSource(START_POINT_SOURCE) as GeoJSONSource | undefined
      if (!source) return

      if (point) {
        // Move layer to top to ensure visibility
        map.moveLayer(START_POINT_MARKER)
        source.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: point },
          }],
        })
      } else {
        source.setData({ type: 'FeatureCollection', features: [] })
      }
    } catch {
      // Map in transition
    }
  }, [map])

  // Create square from two corners
  const createSquare = useCallback((p1: [number, number], p2: [number, number]): Feature<Polygon> | null => {
    if (!map) return null
    return createSquareFromCorners(map, p1, p2)
  }, [map])

  // Handle pasture selection from list
  const handlePastureSelect = useCallback((pasture: Pasture) => {
    setSelectedPasture(pasture)
    setPhase('confirm')

    // Fit map to selected pasture
    if (map && pasture.geometry) {
      const coords = pasture.geometry.geometry.coordinates[0]
      let minLng = Infinity, maxLng = -Infinity
      let minLat = Infinity, maxLat = -Infinity

      coords.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng)
        maxLng = Math.max(maxLng, lng)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
      })

      map.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 100, duration: 500 }
      )
    }
  }, [map])

  // Unified map interaction handler - only one effect to avoid conflicts
  useEffect(() => {
    if (!map) return

    // Store refs for latest state values
    const stateRef = {
      phase,
      isDrawing,
      startPoint,
      pastures,
    }

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      // Pasture selection phase
      if (stateRef.phase === 'select-pasture') {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['paddocks-fill'],
        })

        if (features.length > 0) {
          const feature = features[0]
          const pastureId = feature.properties?.id
          const pasture = stateRef.pastures.find(p => p.id === pastureId)
          if (pasture) {
            handlePastureSelect(pasture)
          }
        }
        return
      }

      // Paddock drawing phase
      if (stateRef.phase === 'draw-paddock' && stateRef.isDrawing) {
        const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]

        if (!stateRef.startPoint) {
          setStartPoint(clickPoint)
          updateStartPointMarker(clickPoint)
        } else {
          // Complete the square
          const square = createSquare(stateRef.startPoint, clickPoint)
          if (square) {
            setPaddockGeometry(square)
            updatePreview(square)
            updateStartPointMarker(null)
            setIsDrawing(false)
            setStartPoint(null)
            setPhase('confirm')
          }
        }
      }
    }

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      // Only handle mouse move during paddock drawing with a start point
      if (stateRef.phase !== 'draw-paddock' || !stateRef.isDrawing || !stateRef.startPoint) return

      const currentPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      const preview = createSquare(stateRef.startPoint, currentPoint)
      if (preview) {
        updatePreview(preview)
      }
    }

    // Update stateRef when dependencies change
    stateRef.phase = phase
    stateRef.isDrawing = isDrawing
    stateRef.startPoint = startPoint
    stateRef.pastures = pastures

    map.on('click', handleClick)
    map.on('mousemove', handleMouseMove)

    // Set cursor based on current phase
    if (phase === 'select-pasture') {
      map.getCanvas().style.cursor = 'pointer'
    } else if (phase === 'draw-paddock' && isDrawing) {
      map.getCanvas().style.cursor = 'crosshair'
    } else {
      map.getCanvas().style.cursor = ''
    }

    return () => {
      map.off('click', handleClick)
      map.off('mousemove', handleMouseMove)
      map.getCanvas().style.cursor = ''
    }
  }, [map, phase, isDrawing, startPoint, pastures, handlePastureSelect, createSquare, updatePreview, updateStartPointMarker])

  // Start drawing a paddock
  const handleStartDrawPaddock = useCallback(() => {
    setPhase('draw-paddock')
    setIsDrawing(true)
    setStartPoint(null)
    setPaddockGeometry(null)
    updatePreview(null)
    updateStartPointMarker(null)
  }, [updatePreview, updateStartPointMarker])

  // Cancel paddock drawing
  const handleCancelDrawing = useCallback(() => {
    setIsDrawing(false)
    setStartPoint(null)
    setPaddockGeometry(null)
    updatePreview(null)
    updateStartPointMarker(null)
    setPhase('confirm')
  }, [updatePreview, updateStartPointMarker])

  // Clear paddock and go back to confirm
  const handleClearPaddock = useCallback(() => {
    setPaddockGeometry(null)
    updatePreview(null)
  }, [updatePreview])

  // Go back to pasture selection
  const handleBackToPastureSelect = useCallback(() => {
    setSelectedPasture(null)
    setPaddockGeometry(null)
    updatePreview(null)
    setPhase('select-pasture')
  }, [updatePreview])

  // Save and complete
  const handleConfirm = useCallback(async () => {
    if (!selectedPasture) return

    setIsSaving(true)
    setError(null)

    try {
      const paddockArea = paddockGeometry
        ? calculateAreaHectares(paddockGeometry)
        : undefined

      await setInitialLocation({
        farmExternalId,
        pastureExternalId: selectedPasture.id,
        sectionGeometry: paddockGeometry?.geometry,
        sectionAreaHectares: paddockArea,
      })

      // Clear preview before completing
      updatePreview(null)
      onComplete()
    } catch (err) {
      console.error('Failed to save animal location:', err)
      setError(err instanceof Error ? err.message : 'Failed to save location')
    } finally {
      setIsSaving(false)
    }
  }, [selectedPasture, paddockGeometry, farmExternalId, setInitialLocation, updatePreview, onComplete])

  // Calculate paddock area for display
  const paddockArea = useMemo(() => {
    if (!paddockGeometry) return null
    return calculateAreaHectares(paddockGeometry)
  }, [paddockGeometry])

  // Render pasture selection phase
  if (phase === 'select-pasture') {
    return (
      <Card className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 shadow-lg border-2 border-amber-500/50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Where are your animals?</span>
            {' · '}Click a pasture on the map
          </div>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip} className="shrink-0 text-xs">
              Skip
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Render paddock drawing phase
  if (phase === 'draw-paddock' && isDrawing) {
    return (
      <Card className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 shadow-lg border-2 border-amber-500/50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs">
            {startPoint ? 'Click opposite corner' : 'Click first corner'}
          </span>
          <Button size="sm" variant="ghost" onClick={handleCancelDrawing} className="shrink-0 gap-1">
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Render confirmation phase
  return (
    <Card className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 shadow-lg border-2 border-amber-500/50">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
          <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Animals in {selectedPasture?.name}</span>
          {paddockGeometry && <> · {paddockArea?.toFixed(2)} ha paddock</>}
        </div>
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToPastureSelect}
            disabled={isSaving}
            className="h-8 px-2"
          >
            Back
          </Button>
          {!paddockGeometry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartDrawPaddock}
              className="h-8 gap-1.5"
            >
              <Pencil className="h-3 w-3" />
              Paddock
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearPaddock}
              className="h-8 px-2"
            >
              Clear
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isSaving}
            className="h-8 gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Confirm'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
