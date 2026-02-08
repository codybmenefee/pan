import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Check, MousePointer2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useFarmBoundary } from '@/lib/hooks/useFarmBoundary'
import { createSquareFromCorners, translatePolygon } from '@/lib/geometry'
import { createLogger } from '@/lib/logger'
import type { Feature, Polygon } from 'geojson'
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl'

const log = createLogger('boundary')

interface FarmBoundaryDrawerProps {
  map: MapLibreMap | null
  onComplete?: () => void
  onCancel?: () => void
  /** When true, shows detailed post-onboarding instructions */
  isPostOnboarding?: boolean
  /** Callback with the saved geometry when boundary is confirmed */
  onBoundarySaved?: (geometry: Feature<Polygon>) => void
  /** Existing boundary to edit (enables edit mode) */
  existingBoundary?: Feature<Polygon> | null
}

const PREVIEW_SOURCE_ID = 'boundary-preview'
const PREVIEW_FILL_LAYER_ID = 'boundary-preview-fill'
const PREVIEW_OUTLINE_LAYER_ID = 'boundary-preview-outline'
const CORNER_MARKERS_SOURCE_ID = 'boundary-corner-markers'
const CORNER_MARKERS_LAYER_ID = 'boundary-corner-markers-layer'

interface DragState {
  isDragging: boolean
  dragType: 'corner' | 'move'
  // For corner drag:
  cornerIndex?: number
  anchorCorner?: [number, number]
  // For move drag:
  startLngLat?: [number, number]
  originalGeometry?: Feature<Polygon>
}

export function FarmBoundaryDrawer({
  map,
  onComplete,
  onCancel,
  isPostOnboarding = false,
  onBoundarySaved,
  existingBoundary,
}: FarmBoundaryDrawerProps) {
  const { saveBoundary, isSaving, error: saveError } = useFarmBoundary()
  const [step, setStep] = useState<'instructions' | 'drawing' | 'editing' | 'confirm'>(
    existingBoundary ? 'editing' : 'instructions'
  )
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [drawnGeometry, setDrawnGeometry] = useState<Feature<Polygon> | null>(
    existingBoundary || null
  )
  const [dragState, setDragState] = useState<DragState | null>(null)
  const clickHandlerRef = useRef<((e: maplibregl.MapMouseEvent) => void) | null>(null)
  const mouseMoveHandlerRef = useRef<((e: maplibregl.MapMouseEvent) => void) | null>(null)

  // Create square from two opposite corners using screen-space calculation
  const createSquare = useCallback((p1: [number, number], p2: [number, number]): Feature<Polygon> | null => {
    if (!map) return null
    return createSquareFromCorners(map, p1, p2)
  }, [map])

  // Get corner points from a polygon (first 4 unique points)
  const getCornerPoints = useCallback((geometry: Feature<Polygon>): [number, number][] => {
    const coords = geometry.geometry.coordinates[0]
    // Take first 4 points (5th is duplicate of first to close polygon)
    return coords.slice(0, 4).map(coord => [coord[0], coord[1]] as [number, number])
  }, [])

  // Setup preview layer
  useEffect(() => {
    if (!map) return

    const emptyCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    }

    // Add source and layers if they don't exist
    if (!map.getSource(PREVIEW_SOURCE_ID)) {
      map.addSource(PREVIEW_SOURCE_ID, {
        type: 'geojson',
        data: emptyCollection,
      })

      map.addLayer({
        id: PREVIEW_FILL_LAYER_ID,
        type: 'fill',
        source: PREVIEW_SOURCE_ID,
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.2,
        },
      })

      map.addLayer({
        id: PREVIEW_OUTLINE_LAYER_ID,
        type: 'line',
        source: PREVIEW_SOURCE_ID,
        paint: {
          'line-color': '#22c55e',
          'line-width': 2,
          'line-dasharray': [4, 2],
        },
      })
    }

    // Add corner markers source and layer
    if (!map.getSource(CORNER_MARKERS_SOURCE_ID)) {
      map.addSource(CORNER_MARKERS_SOURCE_ID, {
        type: 'geojson',
        data: emptyCollection,
      })

      map.addLayer({
        id: CORNER_MARKERS_LAYER_ID,
        type: 'circle',
        source: CORNER_MARKERS_SOURCE_ID,
        paint: {
          'circle-radius': 10,
          'circle-color': '#ffffff',
          'circle-stroke-color': '#22c55e',
          'circle-stroke-width': 3,
        },
      })
    }

    return () => {
      // Cleanup layers and source - check map still exists
      try {
        if (map && map.getStyle()) {
          if (map.getLayer(CORNER_MARKERS_LAYER_ID)) {
            map.removeLayer(CORNER_MARKERS_LAYER_ID)
          }
          if (map.getSource(CORNER_MARKERS_SOURCE_ID)) {
            map.removeSource(CORNER_MARKERS_SOURCE_ID)
          }
          if (map.getLayer(PREVIEW_FILL_LAYER_ID)) {
            map.removeLayer(PREVIEW_FILL_LAYER_ID)
          }
          if (map.getLayer(PREVIEW_OUTLINE_LAYER_ID)) {
            map.removeLayer(PREVIEW_OUTLINE_LAYER_ID)
          }
          if (map.getSource(PREVIEW_SOURCE_ID)) {
            map.removeSource(PREVIEW_SOURCE_ID)
          }
        }
      } catch (error) {
        log.debug('Cleanup skipped - map may be destroyed', { error: String(error) })
      }
    }
  }, [map])

  // Update preview rectangle
  const updatePreview = useCallback((geometry: Feature<Polygon> | null) => {
    if (!map) return

    try {
      // Check if map style is loaded before accessing sources
      if (!map.getStyle()) return

      const source = map.getSource(PREVIEW_SOURCE_ID) as GeoJSONSource | undefined
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
    } catch (error) {
      log.debug('Preview update skipped - map in transition', { error: String(error) })
    }
  }, [map])

  // Update corner markers
  const updateCornerMarkers = useCallback((geometry: Feature<Polygon> | null) => {
    if (!map) return

    try {
      // Check if map style is loaded before accessing sources
      if (!map.getStyle()) return

      const source = map.getSource(CORNER_MARKERS_SOURCE_ID) as GeoJSONSource | undefined
      if (!source) return

      if (geometry) {
        const corners = getCornerPoints(geometry)
        source.setData({
          type: 'FeatureCollection',
          features: corners.map((coord, index) => ({
            type: 'Feature' as const,
            properties: { cornerIndex: index },
            geometry: {
              type: 'Point' as const,
              coordinates: coord,
            },
          })),
        })
      } else {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        })
      }
    } catch (error) {
      log.debug('Corner markers update skipped - map in transition', { error: String(error) })
    }
  }, [map, getCornerPoints])

  // Initialize edit mode when existingBoundary is provided
  useEffect(() => {
    if (!map || !existingBoundary || step !== 'editing') return

    try {
      // Check if map style is loaded
      if (!map.getStyle()) return

      // Show the existing boundary
      updatePreview(existingBoundary)
      updateCornerMarkers(existingBoundary)
      setDrawnGeometry(existingBoundary)

      // Fit map to boundary bounds
      const coords = existingBoundary.geometry.coordinates[0]
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
    } catch (error) {
      log.debug('Edit mode init skipped - map in transition', { error: String(error) })
    }
  }, [map, existingBoundary, step, updatePreview, updateCornerMarkers])

  // Handle corner dragging in edit mode
  useEffect(() => {
    if (!map || step !== 'editing') return

    const handleMouseDown = (e: maplibregl.MapMouseEvent) => {
      // Check if click is on a corner marker
      const cornerFeatures = map.queryRenderedFeatures(e.point, {
        layers: [CORNER_MARKERS_LAYER_ID],
      })

      if (cornerFeatures.length > 0 && drawnGeometry) {
        const cornerIndex = cornerFeatures[0].properties?.cornerIndex as number
        const corners = getCornerPoints(drawnGeometry)

        // The anchor is the opposite corner (index + 2) % 4
        const anchorIndex = (cornerIndex + 2) % 4
        const anchorCorner = corners[anchorIndex]

        setDragState({
          isDragging: true,
          dragType: 'corner',
          cornerIndex,
          anchorCorner,
        })

        // Disable map panning
        map.dragPan.disable()
        map.getCanvas().style.cursor = 'grabbing'

        e.preventDefault()
        return
      }

      // Check if click is on the boundary fill (for moving)
      const fillFeatures = map.queryRenderedFeatures(e.point, {
        layers: [PREVIEW_FILL_LAYER_ID],
      })

      if (fillFeatures.length > 0 && drawnGeometry) {
        setDragState({
          isDragging: true,
          dragType: 'move',
          startLngLat: [e.lngLat.lng, e.lngLat.lat],
          originalGeometry: drawnGeometry,
        })

        // Disable map panning
        map.dragPan.disable()
        map.getCanvas().style.cursor = 'grabbing'

        e.preventDefault()
      }
    }

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (!dragState?.isDragging) {
        // Update cursor on hover - check corners first, then fill
        const cornerFeatures = map.queryRenderedFeatures(e.point, {
          layers: [CORNER_MARKERS_LAYER_ID],
        })
        if (cornerFeatures.length > 0) {
          map.getCanvas().style.cursor = 'grab'
          return
        }

        const fillFeatures = map.queryRenderedFeatures(e.point, {
          layers: [PREVIEW_FILL_LAYER_ID],
        })
        map.getCanvas().style.cursor = fillFeatures.length > 0 ? 'move' : ''
        return
      }

      if (dragState.dragType === 'corner' && dragState.anchorCorner) {
        // Create new square from anchor + cursor
        const cursorPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]
        const newGeometry = createSquare(dragState.anchorCorner, cursorPoint)

        if (newGeometry) {
          setDrawnGeometry(newGeometry)
          updatePreview(newGeometry)
          updateCornerMarkers(newGeometry)
        }
      } else if (dragState.dragType === 'move' && dragState.startLngLat && dragState.originalGeometry) {
        // Calculate delta and translate the polygon
        const deltaLng = e.lngLat.lng - dragState.startLngLat[0]
        const deltaLat = e.lngLat.lat - dragState.startLngLat[1]
        const newGeometry = translatePolygon(dragState.originalGeometry, deltaLng, deltaLat)

        setDrawnGeometry(newGeometry)
        updatePreview(newGeometry)
        updateCornerMarkers(newGeometry)
      }
    }

    const handleMouseUp = () => {
      if (dragState?.isDragging) {
        setDragState(null)
        map.dragPan.enable()
        map.getCanvas().style.cursor = ''
      }
    }

    map.on('mousedown', handleMouseDown)
    map.on('mousemove', handleMouseMove)
    map.on('mouseup', handleMouseUp)

    return () => {
      map.off('mousedown', handleMouseDown)
      map.off('mousemove', handleMouseMove)
      map.off('mouseup', handleMouseUp)
      map.dragPan.enable()
      map.getCanvas().style.cursor = ''
    }
  }, [map, step, dragState, drawnGeometry, createSquare, getCornerPoints, updatePreview, updateCornerMarkers])

  // Setup click and mousemove handlers when drawing (create mode)
  useEffect(() => {
    if (!map || step !== 'drawing') return

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]

      if (!startPoint) {
        // First click - set start point
        setStartPoint(clickPoint)
      } else {
        // Second click - complete square
        const square = createSquare(startPoint, clickPoint)
        if (square) {
          setDrawnGeometry(square)
          updatePreview(square)
          setStep('confirm')
        }
      }
    }

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (!startPoint) return

      const currentPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      const preview = createSquare(startPoint, currentPoint)
      if (preview) {
        updatePreview(preview)
      }
    }

    // Store refs for cleanup
    clickHandlerRef.current = handleClick
    mouseMoveHandlerRef.current = handleMouseMove

    map.on('click', handleClick)
    map.on('mousemove', handleMouseMove)

    // Change cursor
    map.getCanvas().style.cursor = 'crosshair'

    return () => {
      map.off('click', handleClick)
      map.off('mousemove', handleMouseMove)
      map.getCanvas().style.cursor = ''
    }
  }, [map, step, startPoint, createSquare, updatePreview])

  const handleStartDrawing = useCallback(() => {
    setStartPoint(null)
    setDrawnGeometry(null)
    updatePreview(null)
    updateCornerMarkers(null)
    setStep('drawing')
  }, [updatePreview, updateCornerMarkers])

  const handleCancel = useCallback(() => {
    setStartPoint(null)
    setDrawnGeometry(null)
    updatePreview(null)
    updateCornerMarkers(null)
    setStep('instructions')
    onCancel?.()
  }, [updatePreview, updateCornerMarkers, onCancel])

  const handleDoneEditing = useCallback(async () => {
    // In edit mode, save directly without going to confirm step
    if (!drawnGeometry) return

    await saveBoundary(drawnGeometry)
    updatePreview(null)
    updateCornerMarkers(null)
    if (onBoundarySaved) {
      await onBoundarySaved(drawnGeometry)
    }
    await new Promise(resolve => setTimeout(resolve, 100))
    onComplete?.()
  }, [drawnGeometry, saveBoundary, updatePreview, updateCornerMarkers, onBoundarySaved, onComplete])

  const handleConfirm = useCallback(async () => {
    log('handleConfirm called', { hasGeometry: !!drawnGeometry })
    if (!drawnGeometry) return

    await saveBoundary(drawnGeometry)
    updatePreview(null)
    updateCornerMarkers(null)
    log('Calling onBoundarySaved', { hasCallback: !!onBoundarySaved })
    // Await the callback to ensure paddock is created before navigation
    if (onBoundarySaved) {
      await onBoundarySaved(drawnGeometry)
    }
    // Small delay to allow the map to stabilize before navigation
    await new Promise(resolve => setTimeout(resolve, 100))
    log('Calling onComplete')
    onComplete?.()
  }, [drawnGeometry, saveBoundary, updatePreview, updateCornerMarkers, onBoundarySaved, onComplete])

  const handleRedraw = useCallback(() => {
    setStartPoint(null)
    setDrawnGeometry(null)
    updatePreview(null)
    updateCornerMarkers(null)
    setStep('drawing')
  }, [updatePreview, updateCornerMarkers])

  return (
    <Card className="absolute top-3 left-1/2 -translate-x-1/2 z-20 shadow-lg">
      <CardContent className="p-4">
        {step === 'instructions' && (
          <div className="flex flex-col gap-3">
            {isPostOnboarding ? (
              <div className="flex items-start gap-2 text-sm max-w-md">
                <MousePointer2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span>
                  Draw your farm boundary below. This is a rough selection of where your entire farm is located — make sure to capture all your land. This boundary determines which areas we refresh with satellite data.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <MousePointer2 className="h-4 w-4 text-muted-foreground" />
                <span>Click two opposite corners to define your farm boundary</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleStartDrawing}>
                Start Drawing
              </Button>
              {!isPostOnboarding && (
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'drawing' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-olive animate-pulse" />
                <span>
                  {startPoint
                    ? 'Click the opposite corner to complete the square'
                    : 'Click to set the first corner'}
                </span>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4" />
              <span className="ml-1">Cancel</span>
            </Button>
          </div>
        )}

        {step === 'editing' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MousePointer2 className="h-4 w-4 text-muted-foreground" />
              <span>Drag corners to resize, or drag inside to move</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleDoneEditing} disabled={isSaving}>
                <Check className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save Boundary'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4" />
                <span className="ml-1">Cancel</span>
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Boundary drawn. </span>
              <span>Save this as your farm boundary?</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isSaving}
              >
                <Check className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save Boundary'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleRedraw}>
                Redraw
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mt-2 text-sm text-destructive">{saveError}</div>
        )}
      </CardContent>
    </Card>
  )
}
