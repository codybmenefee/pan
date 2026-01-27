import { useState, useCallback, useEffect, useMemo } from 'react'
import { useMutation } from 'convex/react'
import { Check, MapPin, ChevronRight, Pencil, X } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useGeometry } from '@/lib/geometry'
import { calculateAreaHectares } from '@/lib/geometry/geometryUtils'
import { createSquareFromCorners } from '@/lib/geometry'
import type { Feature, Polygon } from 'geojson'
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl'
import type { Paddock } from '@/lib/types'

interface AnimalLocationStepProps {
  farmExternalId: string
  map: MapLibreMap | null
  onComplete: () => void
  onSkip?: () => void
}

const SECTION_PREVIEW_SOURCE = 'animal-location-section-preview'
const SECTION_PREVIEW_FILL = 'animal-location-section-fill'
const SECTION_PREVIEW_OUTLINE = 'animal-location-section-outline'

type StepPhase = 'select-paddock' | 'draw-section' | 'confirm'

export function AnimalLocationStep({
  farmExternalId,
  map,
  onComplete,
  onSkip,
}: AnimalLocationStepProps) {
  const { paddocks } = useGeometry()
  const setInitialLocation = useMutation(api.onboarding.setInitialAnimalLocation)

  const [phase, setPhase] = useState<StepPhase>('select-paddock')
  const [selectedPaddock, setSelectedPaddock] = useState<Paddock | null>(null)
  const [sectionGeometry, setSectionGeometry] = useState<Feature<Polygon> | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)


  // Setup preview layer for section drawing
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
        if (!map.getSource(SECTION_PREVIEW_SOURCE)) {
          map.addSource(SECTION_PREVIEW_SOURCE, {
            type: 'geojson',
            data: emptyCollection,
          })

          map.addLayer({
            id: SECTION_PREVIEW_FILL,
            type: 'fill',
            source: SECTION_PREVIEW_SOURCE,
            paint: {
              'fill-color': '#f59e0b',
              'fill-opacity': 0.3,
            },
          })

          map.addLayer({
            id: SECTION_PREVIEW_OUTLINE,
            type: 'line',
            source: SECTION_PREVIEW_SOURCE,
            paint: {
              'line-color': '#f59e0b',
              'line-width': 2,
              'line-dasharray': [4, 2],
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
          if (map.getLayer(SECTION_PREVIEW_FILL)) {
            map.removeLayer(SECTION_PREVIEW_FILL)
          }
          if (map.getLayer(SECTION_PREVIEW_OUTLINE)) {
            map.removeLayer(SECTION_PREVIEW_OUTLINE)
          }
          if (map.getSource(SECTION_PREVIEW_SOURCE)) {
            map.removeSource(SECTION_PREVIEW_SOURCE)
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

      const source = map.getSource(SECTION_PREVIEW_SOURCE) as GeoJSONSource | undefined
      if (!source) return

      if (geometry) {
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

  // Create square from two corners
  const createSquare = useCallback((p1: [number, number], p2: [number, number]): Feature<Polygon> | null => {
    if (!map) return null
    return createSquareFromCorners(map, p1, p2)
  }, [map])

  // Handle paddock selection from list
  const handlePaddockSelect = useCallback((paddock: Paddock) => {
    setSelectedPaddock(paddock)
    setPhase('confirm')

    // Fit map to selected paddock
    if (map && paddock.geometry) {
      const coords = paddock.geometry.geometry.coordinates[0]
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
      paddocks,
    }

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      // Paddock selection phase
      if (stateRef.phase === 'select-paddock') {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['paddocks-fill'],
        })

        if (features.length > 0) {
          const feature = features[0]
          const paddockId = feature.properties?.id
          const paddock = stateRef.paddocks.find(p => p.id === paddockId)
          if (paddock) {
            handlePaddockSelect(paddock)
          }
        }
        return
      }

      // Section drawing phase
      if (stateRef.phase === 'draw-section' && stateRef.isDrawing) {
        const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]

        if (!stateRef.startPoint) {
          setStartPoint(clickPoint)
        } else {
          // Complete the square
          const square = createSquare(stateRef.startPoint, clickPoint)
          if (square) {
            setSectionGeometry(square)
            updatePreview(square)
            setIsDrawing(false)
            setStartPoint(null)
            setPhase('confirm')
          }
        }
      }
    }

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      // Only handle mouse move during section drawing with a start point
      if (stateRef.phase !== 'draw-section' || !stateRef.isDrawing || !stateRef.startPoint) return

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
    stateRef.paddocks = paddocks

    map.on('click', handleClick)
    map.on('mousemove', handleMouseMove)

    // Set cursor based on current phase
    if (phase === 'select-paddock') {
      map.getCanvas().style.cursor = 'pointer'
    } else if (phase === 'draw-section' && isDrawing) {
      map.getCanvas().style.cursor = 'crosshair'
    } else {
      map.getCanvas().style.cursor = ''
    }

    return () => {
      map.off('click', handleClick)
      map.off('mousemove', handleMouseMove)
      map.getCanvas().style.cursor = ''
    }
  }, [map, phase, isDrawing, startPoint, paddocks, handlePaddockSelect, createSquare, updatePreview])

  // Start drawing a section
  const handleStartDrawSection = useCallback(() => {
    setPhase('draw-section')
    setIsDrawing(true)
    setStartPoint(null)
    setSectionGeometry(null)
    updatePreview(null)
  }, [updatePreview])

  // Cancel section drawing
  const handleCancelDrawing = useCallback(() => {
    setIsDrawing(false)
    setStartPoint(null)
    setSectionGeometry(null)
    updatePreview(null)
    setPhase('confirm')
  }, [updatePreview])

  // Clear section and go back to confirm
  const handleClearSection = useCallback(() => {
    setSectionGeometry(null)
    updatePreview(null)
  }, [updatePreview])

  // Go back to paddock selection
  const handleBackToPaddockSelect = useCallback(() => {
    setSelectedPaddock(null)
    setSectionGeometry(null)
    updatePreview(null)
    setPhase('select-paddock')
  }, [updatePreview])

  // Save and complete
  const handleConfirm = useCallback(async () => {
    if (!selectedPaddock) return

    setIsSaving(true)
    setError(null)

    try {
      const sectionArea = sectionGeometry
        ? calculateAreaHectares(sectionGeometry)
        : undefined

      await setInitialLocation({
        farmExternalId,
        paddockExternalId: selectedPaddock.id,
        sectionGeometry: sectionGeometry?.geometry,
        sectionAreaHectares: sectionArea,
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
  }, [selectedPaddock, sectionGeometry, farmExternalId, setInitialLocation, updatePreview, onComplete])

  // Calculate section area for display
  const sectionArea = useMemo(() => {
    if (!sectionGeometry) return null
    return calculateAreaHectares(sectionGeometry)
  }, [sectionGeometry])

  // Render paddock selection phase
  if (phase === 'select-paddock') {
    return (
      <Card className="absolute top-3 left-1/2 -translate-x-1/2 z-20 shadow-lg max-w-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Where are your animals today?</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Click a paddock on the map or select from the list below.
                </p>
              </div>
            </div>

            {paddocks.length > 0 ? (
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {paddocks.map((paddock) => (
                  <button
                    key={paddock.id}
                    onClick={() => handlePaddockSelect(paddock)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center justify-between border-b last:border-b-0"
                  >
                    <span>{paddock.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No paddocks found. Create paddocks first.
              </div>
            )}

            {onSkip && (
              <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs">
                Skip for now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render section drawing phase
  if (phase === 'draw-section' && isDrawing) {
    return (
      <Card className="absolute top-3 left-1/2 -translate-x-1/2 z-20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  {startPoint
                    ? 'Click the opposite corner to complete the section'
                    : 'Click to set the first corner'}
                </span>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCancelDrawing}>
              <X className="h-4 w-4" />
              <span className="ml-1">Cancel</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render confirmation phase
  return (
    <Card className="absolute top-3 left-1/2 -translate-x-1/2 z-20 shadow-lg max-w-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Confirm animal location</p>
              <p className="text-muted-foreground text-xs mt-1">
                Your animals are in <span className="font-medium text-foreground">{selectedPaddock?.name}</span>
                {sectionGeometry && (
                  <> within a <span className="font-medium text-foreground">{sectionArea?.toFixed(2)} ha</span> section</>
                )}
              </p>
            </div>
          </div>

          {/* Section drawing option */}
          {!sectionGeometry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartDrawSection}
              className="gap-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              Draw exact section (optional)
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 text-xs text-muted-foreground">
                Section drawn: {sectionArea?.toFixed(2)} hectares
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSection}
                className="text-xs h-7 px-2"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartDrawSection}
                className="text-xs h-7 px-2"
              >
                Redraw
              </Button>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToPaddockSelect}
              disabled={isSaving}
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isSaving}
              className="flex-1 gap-2"
            >
              <Check className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Confirm Location'}
            </Button>
          </div>

          {onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs text-muted-foreground"
              disabled={isSaving}
            >
              Skip for now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
