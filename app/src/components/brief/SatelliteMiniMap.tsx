import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { useGeometry, clipPolygonToPolygon } from '@/lib/geometry'
import type { Paddock } from '@/lib/types'
import type { Feature, Polygon } from 'geojson'
import { cn } from '@/lib/utils'
import { DrawingToolbar } from '@/components/map/DrawingToolbar'
import type { DrawMode } from '@/lib/hooks'

// Extend maplibre-gl types to include EventData for event handlers
interface MapEventData {
  features?: Array<{
    properties?: Record<string, unknown>
    geometry?: GeoJSON.Geometry
    layer?: { id: string }
  }>
}

type MapEvent = maplibregl.MapMouseEvent & MapEventData

// Edit icon SVG component
function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </svg>
  )
}

interface SatelliteMiniMapProps {
  pastureId: string
  paddock?: Paddock
  previousPaddocks?: Paddock[]
  className?: string
  editable?: boolean
  editMode?: boolean
  onPaddockUpdate?: (paddock: Paddock) => void
  showEditButton?: boolean
}

// Draw styles for paddock editing
const drawStyles = [
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': '#22c55e',
      'fill-opacity': 0.3,
    },
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: {
      'line-color': '#22c55e',
      'line-width': 3,
      'line-dasharray': [2, 2],
    },
  },
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': '#22c55e',
      'fill-opacity': 0.4,
    },
  },
  {
    id: 'gl-draw-polygon-stroke-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
    paint: {
      'line-color': '#22c55e',
      'line-width': 2,
    },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
    paint: {
      'circle-radius': 6,
      'circle-color': '#fff',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#22c55e',
    },
  },
  {
    id: 'gl-draw-polygon-midpoint',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
    paint: {
      'circle-radius': 4,
      'circle-color': '#22c55e',
      'circle-opacity': 0.8,
    },
  },
  {
    id: 'gl-draw-line-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'LineString']],
    paint: {
      'line-color': '#22c55e',
      'line-width': 2,
      'line-dasharray': [2, 2],
    },
  },
  {
    id: 'gl-draw-point-active',
    type: 'circle',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint']],
    paint: {
      'circle-radius': 5,
      'circle-color': '#22c55e',
    },
  },
]

export function SatelliteMiniMap({
  pastureId,
  paddock,
  previousPaddocks = [],
  className,
  editable = false,
  editMode = false,
  onPaddockUpdate,
  showEditButton = true,
}: SatelliteMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const dragStateRef = useRef<{ featureId: string; startPoint: maplibregl.Point; dragging: boolean } | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [currentMode, setCurrentMode] = useState<DrawMode>('simple_select')
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  const { getPastureById, addPaddock, updatePaddock } = useGeometry()
  const pasture = getPastureById(pastureId)

  const isEditActive = editable && editMode

  const pastureBounds = useMemo(() => {
    if (!pasture) return null

    const coords = (pasture.geometry.geometry as GeoJSON.Polygon).coordinates[0]
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity

    coords.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })

    return new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat])
  }, [pasture])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !pasture || !pastureBounds) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '',
          },
        },
        layers: [
          {
            id: 'satellite-tiles',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      bounds: pastureBounds,
      fitBoundsOptions: {
        padding: 40,
      },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: !isEditActive,
      scrollZoom: !isEditActive,
      doubleClickZoom: false,
      keyboard: false,
    })

    map.on('load', () => {
      mapRef.current = map

      // Add pasture outline source
      const pastureGeojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{
          ...pasture.geometry,
          properties: {
            id: pasture.id,
            name: pasture.name,
          },
        }],
      }

      map.addSource('pasture', {
        type: 'geojson',
        data: pastureGeojson,
      })

      // Pasture outline
      map.addLayer({
        id: 'pasture-outline',
        type: 'line',
        source: 'pasture',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.8,
        },
      })

      // Add previous (grazed) paddocks
      if (previousPaddocks.length > 0) {
        const grazedPaddocksGeojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: previousPaddocks.map((s, index) => ({
            ...s.geometry,
            properties: {
              id: s.id,
              day: index + 1,
            },
          })),
        }

        map.addSource('paddocks-grazed', {
          type: 'geojson',
          data: grazedPaddocksGeojson,
        })

        map.addLayer({
          id: 'paddocks-grazed-fill',
          type: 'fill',
          source: 'paddocks-grazed',
          paint: {
            'fill-color': '#6b7280',
            'fill-opacity': 0.4,
          },
        })

        map.addLayer({
          id: 'paddocks-grazed-outline',
          type: 'line',
          source: 'paddocks-grazed',
          paint: {
            'line-color': '#9ca3af',
            'line-width': 1,
          },
        })
      }

      // Add current paddock (only if not in edit mode - Draw will handle it)
      if (paddock && !isEditActive) {
        const currentPaddockGeojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: [{
            ...paddock.geometry,
            properties: {
              id: paddock.id,
              area: paddock.targetArea,
            },
          }],
        }

        map.addSource('paddock-current', {
          type: 'geojson',
          data: currentPaddockGeojson,
        })

        map.addLayer({
          id: 'paddock-current-fill',
          type: 'fill',
          source: 'paddock-current',
          paint: {
            'fill-color': '#22c55e',
            'fill-opacity': 0.5,
          },
        })

        map.addLayer({
          id: 'paddock-current-outline',
          type: 'line',
          source: 'paddock-current',
          paint: {
            'line-color': '#22c55e',
            'line-width': 3,
          },
        })
      }

      setIsMapLoaded(true)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      setIsMapLoaded(false)
    }
  }, [pasture, pastureBounds, previousPaddocks, paddock, isEditActive])

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return

    const activeMode = drawRef.current?.getMode?.() ?? currentMode
    const shouldEnableDrag =
      !isEditActive || (activeMode === 'simple_select' && selectedFeatureIds.length === 0)

    if (shouldEnableDrag) {
      if (!mapRef.current.dragPan.isEnabled()) {
        mapRef.current.dragPan.enable()
      }
    } else if (mapRef.current.dragPan.isEnabled()) {
      mapRef.current.dragPan.disable()
    }
  }, [isMapLoaded, isEditActive, currentMode, selectedFeatureIds.length])

  // Initialize/cleanup MapboxDraw when edit mode changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !isEditActive) {
      // Cleanup draw if it exists
      if (drawRef.current && mapRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mapRef.current.removeControl(drawRef.current as any)
        } catch {
          // Map may already be destroyed
        }
        drawRef.current = null
      }
      return
    }

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: false,
        trash: false,
      },
      styles: drawStyles,
      defaultMode: 'simple_select',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRef.current.addControl(draw as any)
    drawRef.current = draw

    // Load existing paddock into draw
    if (paddock) {
      const feature = { ...paddock.geometry, id: paddock.id }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw.add(feature as any)
    }

    // Handle draw events
    const handleCreate = (e: { features: Feature<Polygon>[] }) => {
      const feature = e.features[0]
      if (!feature || feature.geometry.type !== 'Polygon') return

      const newId = addPaddock(pastureId, feature as Feature<Polygon>, {
        reasoning: ['User-defined paddock'],
      })

      // Update feature ID
      if (drawRef.current && feature.id) {
        drawRef.current.delete(feature.id as string)
        const updatedFeature = { ...feature, id: newId }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        drawRef.current.add(updatedFeature as any)
      }

      setCurrentMode('simple_select')
      setIsDrawing(false)
    }

    const handleUpdate = (e: { features: Feature<Polygon>[] }) => {
      e.features.forEach((feature) => {
        if (!feature.id || feature.geometry.type !== 'Polygon') return
        let nextGeometry = feature as Feature<Polygon>

        if (pasture) {
          const clipped = clipPolygonToPolygon(nextGeometry, pasture.geometry)
          if (!clipped) return
          nextGeometry = clipped
        }

        updatePaddock(String(feature.id), nextGeometry)
      })
    }

    const handleModeChange = (e: { mode: DrawMode }) => {
      setCurrentMode(e.mode)
      setIsDrawing(e.mode === 'draw_polygon')
    }

    const handleSelectionChange = (e: { features: Feature[] }) => {
      setSelectedFeatureIds(e.features.map((f) => String(f.id)))
    }

    mapRef.current.on('draw.create', handleCreate)
    mapRef.current.on('draw.update', handleUpdate)
    mapRef.current.on('draw.modechange', handleModeChange)
    mapRef.current.on('draw.selectionchange', handleSelectionChange)

    return () => {
      if (mapRef.current) {
        mapRef.current.off('draw.create', handleCreate)
        mapRef.current.off('draw.update', handleUpdate)
        mapRef.current.off('draw.modechange', handleModeChange)
        mapRef.current.off('draw.selectionchange', handleSelectionChange)
      }
      if (drawRef.current && mapRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mapRef.current.removeControl(drawRef.current as any)
        } catch {
          // Map may already be destroyed
        }
        drawRef.current = null
      }
    }
  }, [isMapLoaded, isEditActive, paddock, pastureId, pasture, addPaddock, updatePaddock, onPaddockUpdate])

  useEffect(() => {
    if (!mapRef.current || !drawRef.current || !isMapLoaded || !isEditActive) return

    const map = mapRef.current
    const draw = drawRef.current
    const filterExistingLayers = (layerIds: string[]) =>
      layerIds.filter((layerId) => map.getLayer(layerId))

    const vertexLayerIds = filterExistingLayers([
      'gl-draw-polygon-and-line-vertex-active',
      'gl-draw-polygon-midpoint',
    ])

    const getFeatureIdAtPoint = (point: maplibregl.Point) => {
      const ids = draw.getFeatureIdsAt({ x: point.x, y: point.y })
      return ids.length > 0 ? String(ids[0]) : null
    }

    const isVertexHit = (point: maplibregl.Point) => {
      if (!vertexLayerIds.length) return false
      const features = map.queryRenderedFeatures(point, { layers: vertexLayerIds })
      return features.length > 0
    }

    const handleMouseDown = (e: MapEvent) => {
      if (isDrawing || isVertexHit(e.point)) return
      const featureId = getFeatureIdAtPoint(e.point)
      if (!featureId) return

      dragStateRef.current = {
        featureId,
        startPoint: e.point,
        dragging: false,
      }
      draw.changeMode('simple_select', { featureIds: [featureId] })
    }

    const handleMouseMove = (e: MapEvent) => {
      const state = dragStateRef.current
      if (!state || state.dragging) return
      const dx = e.point.x - state.startPoint.x
      const dy = e.point.y - state.startPoint.y
      if (Math.hypot(dx, dy) > 4) {
        state.dragging = true
      }
    }

    const handleMouseUp = () => {
      const state = dragStateRef.current
      if (!state) return
      draw.changeMode('direct_select', { featureId: state.featureId })
      dragStateRef.current = null
    }

    const handleMapClick = (e: MapEvent) => {
      if (isDrawing || dragStateRef.current || isVertexHit(e.point)) return
      const featureId = getFeatureIdAtPoint(e.point)
      if (!featureId) {
        draw.changeMode('simple_select')
        return
      }
      draw.changeMode('direct_select', { featureId })
    }

    map.on('mousedown', handleMouseDown)
    map.on('mousemove', handleMouseMove)
    map.on('mouseup', handleMouseUp)
    map.on('click', handleMapClick)

    return () => {
      map.off('mousedown', handleMouseDown)
      map.off('mousemove', handleMouseMove)
      map.off('mouseup', handleMouseUp)
      map.off('click', handleMapClick)
    }
  }, [isMapLoaded, isEditActive, isDrawing])

  const setMode = useCallback((mode: DrawMode) => {
    if (drawRef.current) {
      // Type assertion needed due to MapboxDraw's strict overload types
      drawRef.current.changeMode(mode as 'simple_select')
      setCurrentMode(mode)
      setIsDrawing(mode === 'draw_polygon')
    }
  }, [])

  const deleteSelected = useCallback(() => {
    if (drawRef.current && selectedFeatureIds.length > 0) {
      drawRef.current.delete(selectedFeatureIds)
      setSelectedFeatureIds([])
    }
  }, [selectedFeatureIds])

  const cancelDrawing = useCallback(() => {
    if (drawRef.current) {
      drawRef.current.changeMode('simple_select')
      setCurrentMode('simple_select')
      setIsDrawing(false)
    }
  }, [])

  if (!pasture) {
    return (
      <div className={cn('bg-muted flex items-center justify-center', className)}>
        <span className="text-muted-foreground text-sm">Pasture not found</span>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full h-full', className)}>
      <div
        ref={mapContainer}
        className="w-full h-full touch-none"
        style={{ cursor: isEditActive ? 'crosshair' : 'grab' }}
      />

      {/* Edit button - links to map page with edit mode */}
      {!isEditActive && isMapLoaded && showEditButton && (
        <Link
          to="/app/map"
          search={{
            edit: true,
            paddockId: pastureId,
            entityType: 'paddock',
            ...(paddock?.id ? { paddockId: paddock.id } : {}),
          }}
          className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 rounded-md bg-background/90 backdrop-blur-sm border border-border px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
        >
          <EditIcon />
          <span>Edit Paddock</span>
        </Link>
      )}

      {isEditActive && isMapLoaded && (
        <div className="absolute top-2 left-2 z-10">
          <DrawingToolbar
            currentMode={currentMode}
            selectedFeatureIds={selectedFeatureIds}
            isDrawing={isDrawing}
            onSetMode={setMode}
            onDeleteSelected={deleteSelected}
            onCancelDrawing={cancelDrawing}
            entityType="paddock"
            compact={true}
          />
        </div>
      )}
    </div>
  )
}
