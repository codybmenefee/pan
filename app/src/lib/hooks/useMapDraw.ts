import { useEffect, useRef, useCallback, useState } from 'react'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import type { Feature, Point, Polygon, FeatureCollection } from 'geojson'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useGeometry, clipPolygonToPolygon, getTranslationDelta, translatePolygon } from '@/lib/geometry'
import type { EntityType } from '@/lib/geometry'

// Import MapboxDraw styles - these need to be imported in the component that uses this hook
// or added globally: import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

export type DrawMode = 'simple_select' | 'direct_select' | 'draw_polygon' | 'draw_point'

export interface UseMapDrawOptions {
  map: MapLibreMap | null
  entityType: EntityType
  parentPaddockId?: string // Required when entityType is 'section'
  editable?: boolean
  onFeatureCreated?: (id: string, geometry: Feature<Polygon>) => void
  onFeatureUpdated?: (id: string, geometry: Feature<Polygon>) => void
  onFeatureDeleted?: (id: string) => void
}

export interface UseMapDrawReturn {
  draw: MapboxDraw | null
  currentMode: DrawMode
  selectedFeatureIds: string[]
  setMode: (mode: DrawMode) => void
  deleteSelected: () => void
  cancelDrawing: () => void
  isDrawing: boolean
}

// Custom draw styles to match the app theme
const drawStyles = [
  // Active polygon being drawn
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': '#22c55e',
      'fill-opacity': 0.2,
    },
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: {
      'line-color': '#22c55e',
      'line-width': 2,
      'line-dasharray': [2, 2],
    },
  },
  // Inactive polygon - transparent so native layers show through with status colors
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': '#000000',
      'fill-opacity': 0,
    },
  },
  {
    id: 'gl-draw-polygon-stroke-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
    paint: {
      'line-color': '#000000',
      'line-opacity': 0,
      'line-width': 2,
    },
  },
  // Vertices
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
  // Midpoints
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
  // Line being drawn
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
  // Points while drawing
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

export function useMapDraw({
  map,
  entityType,
  parentPaddockId,
  editable = true,
  onFeatureCreated,
  onFeatureUpdated,
  onFeatureDeleted,
}: UseMapDrawOptions): UseMapDrawReturn {
  const drawRef = useRef<MapboxDraw | null>(null)
  const [draw, setDraw] = useState<MapboxDraw | null>(null)
  const [currentMode, setCurrentMode] = useState<DrawMode>('simple_select')
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  const {
    addPaddock,
    updatePaddock,
    deletePaddock,
    addSection,
    updateSection,
    deleteSection,
    addNoGrazeZone,
    updateNoGrazeZone,
    deleteNoGrazeZone,
    addWaterSource,
    updateWaterSource,
    deleteWaterSource,
    getPaddockById,
    getSectionsByPaddockId,
  } = useGeometry()

  // Initialize MapboxDraw
  useEffect(() => {
    if (!map || !editable) return

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: false,
        point: false,
        trash: false,
      },
      styles: drawStyles,
      defaultMode: 'simple_select',
    })

    // MapLibre compatibility: MapboxDraw works with MapLibre but we need to cast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.addControl(draw as any)
    drawRef.current = draw
    setDraw(draw)

    return () => {
      if (map && drawRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.removeControl(drawRef.current as any)
        } catch {
          // Map may already be destroyed
        }
        drawRef.current = null
      }
      setDraw(null)
    }
  }, [map, editable])

  // Handle draw events
  useEffect(() => {
    if (!map || !drawRef.current) return

    const handleCreate = (e: { features: Feature[] }) => {
      const feature = e.features[0]
      if (!feature) return

      let newId: string

      if (entityType === 'paddock' && feature.geometry.type === 'Polygon') {
        newId = addPaddock(feature as Feature<Polygon>)
      } else if (entityType === 'section' && parentPaddockId && feature.geometry.type === 'Polygon') {
        newId = addSection(parentPaddockId, feature as Feature<Polygon>)
      } else if (entityType === 'noGrazeZone' && feature.geometry.type === 'Polygon') {
        newId = addNoGrazeZone(feature as Feature<Polygon>)
      } else if (entityType === 'waterPoint' && feature.geometry.type === 'Point') {
        newId = addWaterSource(feature as Feature<Point>, 'point')
      } else if (entityType === 'waterPolygon' && feature.geometry.type === 'Polygon') {
        newId = addWaterSource(feature as Feature<Polygon>, 'polygon')
      } else {
        console.warn('Invalid entity type or geometry combination:', entityType, feature.geometry.type)
        return
      }

      // Update the feature ID in draw to match our generated ID
      if (drawRef.current && feature.id) {
        drawRef.current.delete(feature.id as string)
        const updatedFeature = { ...feature, id: newId }
        drawRef.current.add(updatedFeature as unknown as FeatureCollection)
      }

      onFeatureCreated?.(newId, feature as Feature<Polygon>)
      setCurrentMode('simple_select')
      setIsDrawing(false)
    }

    const handleUpdate = (e: { features: Feature[]; action?: string }) => {
      e.features.forEach((feature) => {
        if (!feature.id) return

        const id = String(feature.id)

        if (entityType === 'paddock' && feature.geometry.type === 'Polygon') {
          const previousPaddock = getPaddockById(id)
          const nextGeometry = feature as Feature<Polygon>
          updatePaddock(id, feature as Feature<Polygon>)
          if (previousPaddock) {
            const previousGeometry = previousPaddock.geometry
            const translation = getTranslationDelta(previousGeometry, nextGeometry)
            const shouldTranslate = e.action === 'move' || (e.action !== 'change_coordinates' && translation)

            if (shouldTranslate && translation) {
              const sections = getSectionsByPaddockId(id)
              sections.forEach((section) => {
                const moved = translatePolygon(section.geometry, translation.deltaLng, translation.deltaLat)
                updateSection(section.id, moved)
              })
            } else {
              const sections = getSectionsByPaddockId(id)
              sections.forEach((section) => {
                const clipped = clipPolygonToPolygon(section.geometry, nextGeometry)
                if (clipped) {
                  updateSection(section.id, clipped)
                } else {
                  deleteSection(section.id)
                }
              })
            }
          }
        } else if (entityType === 'section' && feature.geometry.type === 'Polygon') {
          updateSection(id, feature as Feature<Polygon>)
        } else if (entityType === 'noGrazeZone' && feature.geometry.type === 'Polygon') {
          updateNoGrazeZone(id, feature as Feature<Polygon>)
        } else if ((entityType === 'waterPoint' || entityType === 'waterPolygon')) {
          updateWaterSource(id, feature as Feature<Point | Polygon>)
        }

        onFeatureUpdated?.(id, feature as Feature<Polygon>)
        if (e.action === 'move' && drawRef.current) {
          drawRef.current.changeMode('direct_select', { featureId: id })
        }
      })
    }

    const handleDelete = (e: { features: Feature[] }) => {
      console.log('[useMapDraw] handleDelete called:', { featureCount: e.features.length, entityType })
      e.features.forEach((feature) => {
        if (!feature.id) return

        const id = String(feature.id)
        console.log('[useMapDraw] Deleting feature:', { id, entityType })
        if (entityType === 'paddock') {
          deletePaddock(id)
        } else if (entityType === 'section') {
          deleteSection(id)
        } else if (entityType === 'noGrazeZone') {
          console.log('[useMapDraw] Calling deleteNoGrazeZone:', id)
          deleteNoGrazeZone(id)
        } else if (entityType === 'waterPoint' || entityType === 'waterPolygon') {
          console.log('[useMapDraw] Calling deleteWaterSource:', id)
          deleteWaterSource(id)
        }

        onFeatureDeleted?.(id)
      })
    }

    const handleModeChange = (e: { mode: DrawMode }) => {
      setCurrentMode(e.mode)
      setIsDrawing(e.mode === 'draw_polygon' || e.mode === 'draw_point')
    }

    const handleSelectionChange = (e: { features: Feature[] }) => {
      setSelectedFeatureIds(e.features.map((f) => String(f.id)))
    }

    map.on('draw.create', handleCreate)
    map.on('draw.update', handleUpdate)
    map.on('draw.delete', handleDelete)
    map.on('draw.modechange', handleModeChange)
    map.on('draw.selectionchange', handleSelectionChange)

    return () => {
      map.off('draw.create', handleCreate)
      map.off('draw.update', handleUpdate)
      map.off('draw.delete', handleDelete)
      map.off('draw.modechange', handleModeChange)
      map.off('draw.selectionchange', handleSelectionChange)
    }
  }, [
    map,
    entityType,
    parentPaddockId,
    addPaddock,
    updatePaddock,
    deletePaddock,
    addSection,
    updateSection,
    deleteSection,
    addNoGrazeZone,
    updateNoGrazeZone,
    deleteNoGrazeZone,
    addWaterSource,
    updateWaterSource,
    deleteWaterSource,
    getPaddockById,
    getSectionsByPaddockId,
    onFeatureCreated,
    onFeatureUpdated,
    onFeatureDeleted,
  ])

  // Keyboard handler for vertex deletion in direct_select mode
  useEffect(() => {
    if (!map || !drawRef.current || !editable) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const draw = drawRef.current
      if (!draw) return

      const actualMode = draw.getMode()
      if (actualMode !== 'direct_select') return
      if (e.key !== 'Delete' && e.key !== 'Backspace') return

      e.preventDefault()

      const selectedIds = draw.getSelectedIds()
      if (selectedIds.length === 0) return

      const feature = draw.get(selectedIds[0])
      if (!feature || feature.geometry.type !== 'Polygon') return

      const coords = (feature.geometry as Polygon).coordinates[0]
      // Polygon needs 4+ coords (3 vertices + closing point)
      if (coords.length <= 4) {
        console.warn('Cannot delete vertex: polygon must have at least 3 vertices')
        return
      }

      draw.trash()  // Deletes selected vertex in direct_select mode
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [map, editable])

  const setMode = useCallback((mode: DrawMode) => {
    if (drawRef.current) {
      // Type assertion needed due to MapboxDraw's strict overload types
      drawRef.current.changeMode(mode as 'simple_select')
      setCurrentMode(mode)
      setIsDrawing(mode === 'draw_polygon' || mode === 'draw_point')
    }
  }, [])

  const deleteSelected = useCallback(() => {
    console.log('[useMapDraw] deleteSelected called:', { selectedFeatureIds, hasDraw: !!drawRef.current, entityType })
    if (drawRef.current && selectedFeatureIds.length > 0) {
      // Get the features before deleting them from draw
      const featuresToDelete = selectedFeatureIds.map(id => drawRef.current?.get(id)).filter(Boolean)
      console.log('[useMapDraw] Features to delete:', featuresToDelete)

      // Delete from draw control
      drawRef.current.delete(selectedFeatureIds)

      // Manually call delete functions since draw.delete event may not fire with MapLibre
      selectedFeatureIds.forEach(id => {
        console.log('[useMapDraw] Manually deleting:', { id, entityType })
        if (entityType === 'paddock') {
          deletePaddock(id)
        } else if (entityType === 'section') {
          deleteSection(id)
        } else if (entityType === 'noGrazeZone') {
          console.log('[useMapDraw] Calling deleteNoGrazeZone:', id)
          deleteNoGrazeZone(id)
        } else if (entityType === 'waterPoint' || entityType === 'waterPolygon') {
          console.log('[useMapDraw] Calling deleteWaterSource:', id)
          deleteWaterSource(id)
        }
        onFeatureDeleted?.(id)
      })
    }
  }, [selectedFeatureIds, entityType, deletePaddock, deleteSection, deleteNoGrazeZone, deleteWaterSource, onFeatureDeleted])

  const cancelDrawing = useCallback(() => {
    if (drawRef.current) {
      drawRef.current.changeMode('simple_select')
      setCurrentMode('simple_select')
      setIsDrawing(false)
    }
  }, [])

  return {
    draw,
    currentMode,
    selectedFeatureIds,
    setMode,
    deleteSelected,
    cancelDrawing,
    isDrawing,
  }
}

// Helper function to load existing geometries into draw
export function loadGeometriesToDraw(
  draw: MapboxDraw | null,
  features: Feature<Polygon>[]
): void {
  if (!draw) return

  console.log('[loadGeometriesToDraw] Called with', features.length, 'features')
  console.log('[loadGeometriesToDraw] Before set, draw has', draw.getAll().features.length, 'features')
  console.log('[loadGeometriesToDraw] Features to load:', features.map(f => ({
    id: f.id,
    coordCount: f.geometry.coordinates[0]?.length,
    firstCoord: f.geometry.coordinates[0]?.[0],
  })))

  // Use draw.set() to replace all features at once - more reliable than deleteAll + add
  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: features.filter(f => f.id) as Feature[],
  }
  draw.set(featureCollection)

  console.log('[loadGeometriesToDraw] After set, draw has', draw.getAll().features.length, 'features')
  console.log('[loadGeometriesToDraw] Features in draw:', draw.getAll().features.map(f => ({
    id: f.id,
    coordCount: (f.geometry as any).coordinates?.[0]?.length,
    firstCoord: (f.geometry as any).coordinates?.[0]?.[0],
  })))
}
