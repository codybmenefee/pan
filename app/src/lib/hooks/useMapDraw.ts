import { useEffect, useRef, useCallback, useState } from 'react'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import type { Feature, Point, Polygon, FeatureCollection } from 'geojson'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useGeometry, clipPolygonToPolygon, getTranslationDelta, translatePolygon } from '@/lib/geometry'
import type { EntityType } from '@/lib/geometry'

// Import MapboxDraw styles - these need to be imported in the component that uses this hook
// or added globally: import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

export type DrawMode = 'simple_select' | 'direct_select' | 'draw_polygon' | 'draw_point'

// Parse typed feature ID (format: "entityType:entityId")
export function parseTypedFeatureId(typedId: string): { entityType: EntityType; entityId: string } | null {
  const colonIndex = typedId.indexOf(':')
  if (colonIndex === -1) return null
  const entityType = typedId.slice(0, colonIndex) as EntityType
  const entityId = typedId.slice(colonIndex + 1)
  if (!['paddock', 'section', 'noGrazeZone', 'waterPoint', 'waterPolygon'].includes(entityType)) {
    return null
  }
  return { entityType, entityId }
}

// Create typed feature ID
export function createTypedFeatureId(entityType: EntityType, entityId: string): string {
  return `${entityType}:${entityId}`
}

export interface UseMapDrawOptions {
  map: MapLibreMap | null
  editable?: boolean
  // Called when a feature is selected in the draw control
  onFeatureSelected?: (typedId: string | null, entityType: EntityType | null, entityId: string | null) => void
  // Called when a new feature is created (for drawing new entities)
  onFeatureCreated?: (entityType: EntityType, geometry: Feature<Polygon | Point>) => void
  // Called when a feature is updated
  onFeatureUpdated?: (entityType: EntityType, entityId: string, geometry: Feature<Polygon | Point>) => void
  // Called when a feature is deleted
  onFeatureDeleted?: (entityType: EntityType, entityId: string) => void
  // Drawing mode entity type (for creating new entities)
  drawingEntityType?: EntityType
  // Parent paddock ID (for creating sections)
  parentPaddockId?: string
}

export interface UseMapDrawReturn {
  draw: MapboxDraw | null
  currentMode: DrawMode
  selectedFeatureIds: string[]
  selectedTypedId: string | null
  selectedEntityType: EntityType | null
  selectedEntityId: string | null
  setMode: (mode: DrawMode) => void
  selectFeature: (typedId: string) => void
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
  editable = true,
  onFeatureSelected,
  onFeatureCreated,
  onFeatureUpdated,
  onFeatureDeleted,
  drawingEntityType,
  parentPaddockId,
}: UseMapDrawOptions): UseMapDrawReturn {
  const drawRef = useRef<MapboxDraw | null>(null)
  const [draw, setDraw] = useState<MapboxDraw | null>(null)
  const [currentMode, setCurrentMode] = useState<DrawMode>('simple_select')
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  // Derived state from selected feature ID
  const [selectedTypedId, setSelectedTypedId] = useState<string | null>(null)
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | null>(null)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

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

      // For newly drawn features, use drawingEntityType to determine what to create
      const entityType = drawingEntityType
      if (!entityType) {
        console.warn('[useMapDraw] No drawingEntityType specified for create')
        return
      }

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

      // Update the feature ID in draw to match our typed ID
      const typedId = createTypedFeatureId(entityType, newId)
      if (drawRef.current && feature.id) {
        drawRef.current.delete(feature.id as string)
        const updatedFeature = { ...feature, id: typedId }
        drawRef.current.add(updatedFeature as unknown as FeatureCollection)
      }

      onFeatureCreated?.(entityType, feature as Feature<Polygon | Point>)
      setCurrentMode('simple_select')
      setIsDrawing(false)
    }

    const handleUpdate = (e: { features: Feature[]; action?: string }) => {
      e.features.forEach((feature) => {
        if (!feature.id) return

        const typedId = String(feature.id)
        const parsed = parseTypedFeatureId(typedId)

        if (!parsed) {
          console.warn('[useMapDraw] Could not parse typed ID:', typedId)
          return
        }

        const { entityType, entityId } = parsed

        if (entityType === 'paddock' && feature.geometry.type === 'Polygon') {
          const previousPaddock = getPaddockById(entityId)
          const nextGeometry = feature as Feature<Polygon>
          updatePaddock(entityId, feature as Feature<Polygon>)
          if (previousPaddock) {
            const previousGeometry = previousPaddock.geometry
            const translation = getTranslationDelta(previousGeometry, nextGeometry)
            const shouldTranslate = e.action === 'move' || (e.action !== 'change_coordinates' && translation)

            if (shouldTranslate && translation) {
              const sections = getSectionsByPaddockId(entityId)
              sections.forEach((section) => {
                const moved = translatePolygon(section.geometry, translation.deltaLng, translation.deltaLat)
                updateSection(section.id, moved)
              })
            } else {
              const sections = getSectionsByPaddockId(entityId)
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
          updateSection(entityId, feature as Feature<Polygon>)
        } else if (entityType === 'noGrazeZone' && feature.geometry.type === 'Polygon') {
          console.log('[useMapDraw] handleUpdate - noGrazeZone:', { entityId, hasPolygonGeometry: feature.geometry.type === 'Polygon' })
          updateNoGrazeZone(entityId, feature as Feature<Polygon>)
        } else if ((entityType === 'waterPoint' || entityType === 'waterPolygon')) {
          updateWaterSource(entityId, feature as Feature<Point | Polygon>)
        }

        onFeatureUpdated?.(entityType, entityId, feature as Feature<Polygon | Point>)
        if (e.action === 'move' && drawRef.current) {
          drawRef.current.changeMode('direct_select', { featureId: typedId })
        }
      })
    }

    const handleDelete = (e: { features: Feature[] }) => {
      console.log('[useMapDraw] handleDelete called:', { featureCount: e.features.length })
      e.features.forEach((feature) => {
        if (!feature.id) return

        const typedId = String(feature.id)
        const parsed = parseTypedFeatureId(typedId)

        if (!parsed) {
          console.warn('[useMapDraw] Could not parse typed ID for delete:', typedId)
          return
        }

        const { entityType, entityId } = parsed
        console.log('[useMapDraw] Deleting feature:', { typedId, entityType, entityId })

        if (entityType === 'paddock') {
          deletePaddock(entityId)
        } else if (entityType === 'section') {
          deleteSection(entityId)
        } else if (entityType === 'noGrazeZone') {
          console.log('[useMapDraw] Calling deleteNoGrazeZone:', entityId)
          deleteNoGrazeZone(entityId)
        } else if (entityType === 'waterPoint' || entityType === 'waterPolygon') {
          console.log('[useMapDraw] Calling deleteWaterSource:', entityId)
          deleteWaterSource(entityId)
        }

        onFeatureDeleted?.(entityType, entityId)
      })
    }

    const handleModeChange = (e: { mode: DrawMode }) => {
      setCurrentMode(e.mode)
      setIsDrawing(e.mode === 'draw_polygon' || e.mode === 'draw_point')
    }

    const handleSelectionChange = (e: { features: Feature[] }) => {
      const newSelectedIds = e.features.map((f) => String(f.id))
      setSelectedFeatureIds(newSelectedIds)

      // Parse the first selected feature to update derived state
      if (newSelectedIds.length > 0) {
        const typedId = newSelectedIds[0]
        const parsed = parseTypedFeatureId(typedId)
        if (parsed) {
          setSelectedTypedId(typedId)
          setSelectedEntityType(parsed.entityType)
          setSelectedEntityId(parsed.entityId)
          onFeatureSelected?.(typedId, parsed.entityType, parsed.entityId)
        } else {
          setSelectedTypedId(null)
          setSelectedEntityType(null)
          setSelectedEntityId(null)
          onFeatureSelected?.(null, null, null)
        }
      } else {
        setSelectedTypedId(null)
        setSelectedEntityType(null)
        setSelectedEntityId(null)
        onFeatureSelected?.(null, null, null)
      }
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
    drawingEntityType,
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
    onFeatureSelected,
  ])

  // Keyboard handler for vertex deletion in direct_select mode
  useEffect(() => {
    if (!map || !drawRef.current || !editable) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const draw = drawRef.current
      if (!draw) return

      // Don't intercept keyboard events when user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

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
    console.log('[useMapDraw] deleteSelected called:', { selectedFeatureIds, hasDraw: !!drawRef.current })
    if (drawRef.current && selectedFeatureIds.length > 0) {
      // Get the features before deleting them from draw
      const featuresToDelete = selectedFeatureIds.map(id => drawRef.current?.get(id)).filter(Boolean)
      console.log('[useMapDraw] Features to delete:', featuresToDelete)

      // Delete from draw control
      drawRef.current.delete(selectedFeatureIds)

      // Manually call delete functions since draw.delete event may not fire with MapLibre
      selectedFeatureIds.forEach(typedId => {
        const parsed = parseTypedFeatureId(typedId)
        if (!parsed) {
          console.warn('[useMapDraw] Could not parse typed ID for manual delete:', typedId)
          return
        }

        const { entityType, entityId } = parsed
        console.log('[useMapDraw] Manually deleting:', { typedId, entityType, entityId })

        if (entityType === 'paddock') {
          deletePaddock(entityId)
        } else if (entityType === 'section') {
          deleteSection(entityId)
        } else if (entityType === 'noGrazeZone') {
          console.log('[useMapDraw] Calling deleteNoGrazeZone:', entityId)
          deleteNoGrazeZone(entityId)
        } else if (entityType === 'waterPoint' || entityType === 'waterPolygon') {
          console.log('[useMapDraw] Calling deleteWaterSource:', entityId)
          deleteWaterSource(entityId)
        }
        onFeatureDeleted?.(entityType, entityId)
      })
    }
  }, [selectedFeatureIds, deletePaddock, deleteSection, deleteNoGrazeZone, deleteWaterSource, onFeatureDeleted])

  const selectFeature = useCallback((typedId: string) => {
    if (drawRef.current) {
      const feature = drawRef.current.get(typedId)
      if (feature) {
        drawRef.current.changeMode('direct_select', { featureId: typedId })
      }
    }
  }, [])

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
    selectedTypedId,
    selectedEntityType,
    selectedEntityId,
    setMode,
    selectFeature,
    deleteSelected,
    cancelDrawing,
    isDrawing,
  }
}

// Helper function to load existing geometries into draw
// Features should have typed IDs in the format "entityType:entityId"
export function loadGeometriesToDraw(
  draw: MapboxDraw | null,
  features: Feature<Polygon | Point>[]
): void {
  if (!draw) return

  console.log('[loadGeometriesToDraw] Called with', features.length, 'features')
  console.log('[loadGeometriesToDraw] Before set, draw has', draw.getAll().features.length, 'features')
  console.log('[loadGeometriesToDraw] Features to load:', features.map(f => ({
    id: f.id,
    type: f.geometry.type,
    coordCount: f.geometry.type === 'Polygon' ? f.geometry.coordinates[0]?.length : 1,
    firstCoord: f.geometry.type === 'Polygon' ? f.geometry.coordinates[0]?.[0] : f.geometry.coordinates,
  })))

  // Clear existing features first, then set new ones
  // draw.set() alone doesn't always fully replace in all scenarios
  try {
    draw.deleteAll()
  } catch {
    // Ignore errors during cleanup
  }

  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: features.filter(f => f.id) as Feature[],
  }
  draw.set(featureCollection)

  console.log('[loadGeometriesToDraw] After set, draw has', draw.getAll().features.length, 'features')
  console.log('[loadGeometriesToDraw] Features in draw:', draw.getAll().features.map(f => ({
    id: f.id,
    type: f.geometry.type,
    coordCount: f.geometry.type === 'Polygon' ? (f.geometry as Polygon).coordinates?.[0]?.length : 1,
    firstCoord: f.geometry.type === 'Polygon' ? (f.geometry as Polygon).coordinates?.[0]?.[0] : (f.geometry as Point).coordinates,
  })))
}
