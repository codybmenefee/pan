import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import type { Paddock, PaddockStatus } from '@/lib/types'
import { useGeometry, clipPolygonToPolygon, getTranslationDelta, translatePolygon } from '@/lib/geometry'
import { createNoGrazeStripePatternByType, getNoGrazeZoneTypes } from '@/lib/map/patterns'
import { useMapDraw, loadGeometriesToDraw, type DrawMode } from '@/lib/hooks'
import { DrawingToolbar } from './DrawingToolbar'
import type { Feature, Polygon } from 'geojson'
import { useFarm } from '@/lib/convex/useFarm'
import { MapSkeleton } from '@/components/ui/loading/MapSkeleton'
import { ErrorState } from '@/components/ui/error/ErrorState'

// Extend maplibre-gl types to include EventData for event handlers
interface MapEventData {
  features?: Array<{
    properties?: Record<string, unknown>
    geometry?: GeoJSON.Geometry
    layer?: { id: string }
  }>
}

type MapEvent = maplibregl.MapMouseEvent & MapEventData

interface FarmMapProps {
  onPaddockClick?: (paddock: Paddock) => void
  onEditPaddockSelect?: (paddock: Paddock | null) => void
  onEditRequest?: (request: {
    entityType: 'paddock' | 'section' | 'noGrazeZone' | 'waterPolygon'
    paddockId?: string
    sectionId?: string
    noGrazeZoneId?: string
    waterSourceId?: string
    geometry?: Feature<Polygon>
  }) => void
  onNoGrazeZoneClick?: (zoneId: string) => void
  onWaterSourceClick?: (sourceId: string) => void
  selectedPaddockId?: string
  showSatellite?: boolean
  showNdviHeat?: boolean
  showPaddocks?: boolean
  showLabels?: boolean
  showSections?: boolean
  editable?: boolean
  editMode?: boolean
  entityType?: 'paddock' | 'section' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'
  parentPaddockId?: string
  initialSectionFeature?: Feature<Polygon>
  initialSectionId?: string
  initialPaddockId?: string
  showToolbar?: boolean
  toolbarPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  compactToolbar?: boolean
}

export type EntityDropType = 'paddock' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'

export interface FarmMapHandle {
  getMap: () => maplibregl.Map | null
  getDraw: () => MapboxDraw | null
  setDrawMode: (mode: DrawMode) => void
  deleteSelected: () => void
  cancelDrawing: () => void
  focusOnPaddock: (paddockId: string) => void
  focusOnGeometry: (geometry: Feature<Polygon>, padding?: number) => void
  createPaddockAtCenter: () => string | null
  createEntityAtScreenPoint: (type: EntityDropType, screenX: number, screenY: number) => string | null
  getMapContainerRect: () => DOMRect | null
}

interface SectionRenderItem {
  id: string
  paddockId: string
  geometry: Feature<Polygon>
  properties: Record<string, unknown>
}

interface SectionRenderState {
  current: SectionRenderItem[]
  grazed: SectionRenderItem[]
  alternatives: SectionRenderItem[]
}

const statusColors: Record<PaddockStatus, string> = {
  ready: '#22c55e',
  almost_ready: '#f59e0b',
  recovering: '#6b7280',
  grazed: '#ef4444',
}

function pushSectionData(mapInstance: maplibregl.Map, sectionState: SectionRenderState) {
  console.log('[Sections] pushSectionData called')
  const updateSource = (sourceId: string, items: SectionRenderItem[]) => {
    const source = mapInstance.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
    if (!source) {
      console.warn('[Sections] Source not found:', sourceId)
      return
    }

    const features = items.map((item) => {
      const coords = item.geometry.geometry.coordinates[0]
      console.log(`[Sections] ${sourceId} feature ${item.id}:`, {
        coordCount: coords.length,
        sampleCoord: coords[0],
        paddockId: item.paddockId,
      })

      return {
        ...item.geometry,
        properties: {
          ...(item.geometry.properties ?? {}),
          ...item.properties,
          id: item.id,
          paddockId: item.paddockId,
        },
      }
    })

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    }
    console.log(`[Sections] Updating ${sourceId}:`, items.length, 'features')
    source.setData(geojson)
  }

  updateSource('sections-grazed', sectionState.grazed)
  updateSource('sections-current', sectionState.current)
  updateSource('sections-alternatives', sectionState.alternatives)
}

function ensureSectionLayers(mapInstance: maplibregl.Map) {
  console.log('[Sections] ensureSectionLayers called')
  const emptyCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  if (!mapInstance.getSource('sections-grazed')) {
    console.log('[Sections] Adding source: sections-grazed')
    mapInstance.addSource('sections-grazed', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    console.log('[Sections] Source already exists: sections-grazed')
  }

  if (!mapInstance.getLayer('sections-grazed-fill')) {
    console.log('[Sections] Adding layer: sections-grazed-fill')
    mapInstance.addLayer({
      id: 'sections-grazed-fill',
      type: 'fill',
      source: 'sections-grazed',
      paint: {
        'fill-color': '#64748b',
        'fill-opacity': 0.18,
      },
    })
  }

  if (!mapInstance.getLayer('sections-grazed-outline')) {
    console.log('[Sections] Adding layer: sections-grazed-outline')
    mapInstance.addLayer({
      id: 'sections-grazed-outline',
      type: 'line',
      source: 'sections-grazed',
      paint: {
        'line-color': '#94a3b8',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    })
  }

  if (!mapInstance.getSource('sections-current')) {
    console.log('[Sections] Adding source: sections-current')
    mapInstance.addSource('sections-current', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    console.log('[Sections] Source already exists: sections-current')
  }

  if (!mapInstance.getLayer('sections-current-fill')) {
    console.log('[Sections] Adding layer: sections-current-fill')
    mapInstance.addLayer({
      id: 'sections-current-fill',
      type: 'fill',
      source: 'sections-current',
      paint: {
        'fill-color': '#22c55e',
        'fill-opacity': 0.45,
      },
    })
  }

  if (!mapInstance.getLayer('sections-current-outline')) {
    console.log('[Sections] Adding layer: sections-current-outline')
    mapInstance.addLayer({
      id: 'sections-current-outline',
      type: 'line',
      source: 'sections-current',
      paint: {
        'line-color': '#22c55e',
        'line-width': 3,
      },
    })
  }

  if (!mapInstance.getSource('sections-alternatives')) {
    console.log('[Sections] Adding source: sections-alternatives')
    mapInstance.addSource('sections-alternatives', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    console.log('[Sections] Source already exists: sections-alternatives')
  }

  if (!mapInstance.getLayer('sections-alternatives-fill')) {
    console.log('[Sections] Adding layer: sections-alternatives-fill')
    mapInstance.addLayer({
      id: 'sections-alternatives-fill',
      type: 'fill',
      source: 'sections-alternatives',
      paint: {
        'fill-color': '#60a5fa',
        'fill-opacity': 0.25,
      },
    })
  }

  if (!mapInstance.getLayer('sections-alternatives-outline')) {
    console.log('[Sections] Adding layer: sections-alternatives-outline')
    mapInstance.addLayer({
      id: 'sections-alternatives-outline',
      type: 'line',
      source: 'sections-alternatives',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-dasharray': [1.5, 1.5],
      },
    })
  }
}

// Type-specific outline colors for no-graze zones
const noGrazeZoneOutlineColors: Record<string, string> = {
  environmental: '#16a34a', // Green
  hazard: '#ea580c', // Orange
  infrastructure: '#6b7280', // Gray
  protected: '#9333ea', // Purple
  other: '#dc2626', // Red
}

function ensureNoGrazeZoneLayers(mapInstance: maplibregl.Map) {
  const emptyCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  // Add stripe pattern images for each no-graze zone type
  for (const zoneType of getNoGrazeZoneTypes()) {
    const imageName = `no-graze-stripes-${zoneType}`
    if (!mapInstance.hasImage(imageName)) {
      const patternData = createNoGrazeStripePatternByType(zoneType)
      mapInstance.addImage(imageName, patternData, { sdf: false })
    }
  }

  if (!mapInstance.getSource('no-graze-zones')) {
    mapInstance.addSource('no-graze-zones', {
      type: 'geojson',
      data: emptyCollection,
    })
  }

  if (!mapInstance.getLayer('no-graze-fill')) {
    mapInstance.addLayer({
      id: 'no-graze-fill',
      type: 'fill',
      source: 'no-graze-zones',
      paint: {
        // Use match expression to select pattern based on zone type
        'fill-pattern': [
          'match',
          ['get', 'type'],
          'environmental', 'no-graze-stripes-environmental',
          'hazard', 'no-graze-stripes-hazard',
          'infrastructure', 'no-graze-stripes-infrastructure',
          'protected', 'no-graze-stripes-protected',
          'no-graze-stripes-other', // default fallback
        ],
        'fill-opacity': 1,
      },
    })
  }

  if (!mapInstance.getLayer('no-graze-outline')) {
    mapInstance.addLayer({
      id: 'no-graze-outline',
      type: 'line',
      source: 'no-graze-zones',
      paint: {
        // Use match expression to select outline color based on zone type
        'line-color': [
          'match',
          ['get', 'type'],
          'environmental', noGrazeZoneOutlineColors.environmental,
          'hazard', noGrazeZoneOutlineColors.hazard,
          'infrastructure', noGrazeZoneOutlineColors.infrastructure,
          'protected', noGrazeZoneOutlineColors.protected,
          noGrazeZoneOutlineColors.other, // default fallback
        ],
        'line-width': 2,
        'line-dasharray': [4, 2],
      },
    })
  }
}

function ensureWaterSourceLayers(mapInstance: maplibregl.Map) {
  const emptyCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  // Polygon water sources
  if (!mapInstance.getSource('water-source-polygons')) {
    mapInstance.addSource('water-source-polygons', {
      type: 'geojson',
      data: emptyCollection,
    })
  }

  if (!mapInstance.getLayer('water-source-fill')) {
    mapInstance.addLayer({
      id: 'water-source-fill',
      type: 'fill',
      source: 'water-source-polygons',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.3,
      },
    })
  }

  if (!mapInstance.getLayer('water-source-outline')) {
    mapInstance.addLayer({
      id: 'water-source-outline',
      type: 'line',
      source: 'water-source-polygons',
      paint: {
        'line-color': '#2563eb',
        'line-width': 2,
      },
    })
  }

  // Point water sources (markers)
  if (!mapInstance.getSource('water-source-points')) {
    mapInstance.addSource('water-source-points', {
      type: 'geojson',
      data: emptyCollection,
    })
  }

  if (!mapInstance.getLayer('water-source-markers')) {
    mapInstance.addLayer({
      id: 'water-source-markers',
      type: 'circle',
      source: 'water-source-points',
      paint: {
        'circle-radius': 8,
        'circle-color': '#3b82f6',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })
  }
}

export const FarmMap = forwardRef<FarmMapHandle, FarmMapProps>(function FarmMap({
  onPaddockClick,
  onEditPaddockSelect,
  onEditRequest,
  onNoGrazeZoneClick,
  onWaterSourceClick,
  selectedPaddockId,
  showSatellite = true,
  showNdviHeat = false,
  showPaddocks = true,
  showLabels = true,
  showSections = true,
  editable = false,
  editMode = false,
  entityType = 'paddock',
  parentPaddockId,
  initialSectionFeature,
  initialSectionId,
  initialPaddockId,
  showToolbar = true,
  toolbarPosition = 'top-left',
  compactToolbar = false,
}, ref) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const lastClickRef = useRef<{ time: number; point: maplibregl.Point } | null>(null)
  const lastSectionPickRef = useRef<{ time: number; point: maplibregl.Point; index: number; ids: string[] } | null>(null)
  const dragStateRef = useRef<{
    featureId: string
    startPoint: maplibregl.Point
    startLngLat: maplibregl.LngLat
    startGeometry: Feature<Polygon> | null
    dragging: boolean
    manual: boolean
    lastGeometry?: Feature<Polygon> | null
  } | null>(null)
  const lastSelectedPaddockIdRef = useRef<string | null>(null)
  const sectionStateRef = useRef<SectionRenderState>({ current: [], grazed: [], alternatives: [] })
  const paddockGeometryRef = useRef<Record<string, Feature<Polygon>>>({})
  const lastLoadedPaddockKeyRef = useRef<string | null>(null)
  const lastLoadedNoGrazeKeyRef = useRef<string | null>(null)
  const lastLoadedWaterKeyRef = useRef<string | null>(null)
  const lastResetCounterRef = useRef<number>(0)
  const sectionEditInitializedRef = useRef<boolean>(false)
  const pendingNoGrazeSelectionRef = useRef<string | null>(null)
  const pendingWaterSelectionRef = useRef<string | null>(null)

  const { paddocks, getPaddockById, noGrazeZones, waterSources, addPaddock, addNoGrazeZone, addWaterSource, resetCounter } = useGeometry()
  const { farm, isLoading: isFarmLoading } = useFarm()
  const farmId = farm?.id ?? null
  const farmLng = farm?.coordinates?.[0] ?? null
  const farmLat = farm?.coordinates?.[1] ?? null
  const farmGeometry = farm?.geometry ?? null

  // Check if farm has a valid boundary (not the default tiny polygon)
  const hasValidBoundary = useCallback(() => {
    if (!farmGeometry) return false
    const coords = farmGeometry.geometry.coordinates[0]
    if (!coords || coords.length < 4) return false

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

    // If the bounding box is smaller than ~50m, it's likely the default
    const lngSpan = maxLng - minLng
    const latSpan = maxLat - minLat
    return lngSpan > 0.0005 && latSpan > 0.0005
  }, [farmGeometry])

  const isEditActive = editable && editMode

  const isMapReady = useCallback(() => {
    if (!mapInstance || !isMapLoaded) return false
    if (mapRef.current !== mapInstance) return false
    if (!mapInstance.isStyleLoaded?.()) return false
    try {
      mapInstance.getStyle()
    } catch {
      return false
    }
    return true
  }, [mapInstance, isMapLoaded])

  const {
    draw,
    currentMode,
    selectedFeatureIds,
    setMode,
    deleteSelected,
    cancelDrawing,
    isDrawing,
  } = useMapDraw({
    map: isEditActive ? mapInstance : null,
    entityType,
    parentPaddockId,
    editable: isEditActive,
  })

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return

    const activeMode = draw?.getMode?.() ?? currentMode
    const shouldEnableDrag =
      !isEditActive ||
      (activeMode === 'simple_select' && selectedFeatureIds.length === 0)

    if (shouldEnableDrag) {
      if (!mapInstance.dragPan.isEnabled()) {
        mapInstance.dragPan.enable()
      }
    } else if (mapInstance.dragPan.isEnabled()) {
      mapInstance.dragPan.disable()
    }
  }, [mapInstance, isMapLoaded, isEditActive, currentMode, selectedFeatureIds.length, draw])

  // Expose map methods via ref
  const fitPolygonBounds = useCallback((geometry: Feature<Polygon>, padding = 60) => {
    if (!mapInstance) return
    const coords = geometry.geometry.coordinates[0]
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity

    coords.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })

    const bounds = new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat])
    mapInstance.fitBounds(bounds, { padding, duration: 1000 })
  }, [mapInstance])

  const createDraftSquare = useCallback((center: maplibregl.LngLat, sizePx: number): Feature<Polygon> | null => {
    if (!mapInstance) return null
    const half = sizePx / 2
    const centerPoint = mapInstance.project(center)
    const topLeft = mapInstance.unproject([centerPoint.x - half, centerPoint.y - half])
    const topRight = mapInstance.unproject([centerPoint.x + half, centerPoint.y - half])
    const bottomRight = mapInstance.unproject([centerPoint.x + half, centerPoint.y + half])
    const bottomLeft = mapInstance.unproject([centerPoint.x - half, centerPoint.y + half])

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [topLeft.lng, topLeft.lat],
          [topRight.lng, topRight.lat],
          [bottomRight.lng, bottomRight.lat],
          [bottomLeft.lng, bottomLeft.lat],
          [topLeft.lng, topLeft.lat],
        ]],
      },
    }
  }, [mapInstance])

  useImperativeHandle(ref, () => ({
    getMap: () => mapInstance,
    getDraw: () => draw,
    setDrawMode: setMode,
    deleteSelected,
    cancelDrawing,
    focusOnPaddock: (paddockId: string) => {
      if (!mapInstance) return
      const paddock = getPaddockById(paddockId)
      if (!paddock) return

      const doFocus = () => {
        fitPolygonBounds(paddock.geometry, 60)
      }

      // If map is already loaded, focus immediately. Otherwise wait for it.
      if (mapInstance.loaded()) {
        doFocus()
      } else {
        mapInstance.once('load', doFocus)
      }
    },
    focusOnGeometry: (geometry: Feature<Polygon>, padding = 60) => {
      if (!mapInstance) return

      const doFocus = () => {
        fitPolygonBounds(geometry, padding)
      }

      if (mapInstance.loaded()) {
        doFocus()
      } else {
        mapInstance.once('load', doFocus)
      }
    },
    createPaddockAtCenter: () => {
      if (!mapInstance) return null
      const center = mapInstance.getCenter()
      const draft = createDraftSquare(center, 100) // 100px square
      if (!draft) return null
      const paddockId = addPaddock(draft)
      return paddockId
    },
    getMapContainerRect: () => {
      return mapContainer.current?.getBoundingClientRect() ?? null
    },
    createEntityAtScreenPoint: (type: EntityDropType, screenX: number, screenY: number) => {
      console.log('[FarmMap] createEntityAtScreenPoint called:', { type, screenX, screenY, hasMapInstance: !!mapInstance })
      if (!mapInstance) return null
      const rect = mapContainer.current?.getBoundingClientRect()
      if (!rect) {
        console.log('[FarmMap] No rect, returning null')
        return null
      }

      // Convert screen coordinates to map-relative coordinates
      const x = screenX - rect.left
      const y = screenY - rect.top

      // Check if coordinates are within map bounds
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        console.log('[FarmMap] Coordinates out of bounds:', { x, y, width: rect.width, height: rect.height })
        return null
      }

      const lngLat = mapInstance.unproject([x, y])
      console.log('[FarmMap] Unprojected lngLat:', { lng: lngLat.lng, lat: lngLat.lat })

      if (type === 'waterPoint') {
        // Create a point geometry for water marker
        const pointFeature: GeoJSON.Feature<GeoJSON.Point> = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [lngLat.lng, lngLat.lat],
          },
        }
        const entityId = addWaterSource(pointFeature, 'point')
        console.log('[FarmMap] Created water point:', { entityId, coordinates: pointFeature.geometry.coordinates })
        return entityId
      }

      // For polygon types, create a default square
      const sizes: Record<Exclude<EntityDropType, 'waterPoint'>, number> = {
        paddock: 100,
        noGrazeZone: 100,
        waterPolygon: 100,
      }
      const sizePx = sizes[type as Exclude<EntityDropType, 'waterPoint'>]
      const draft = createDraftSquare(lngLat, sizePx)
      if (!draft) return null

      let entityId: string | null = null
      switch (type) {
        case 'paddock':
          entityId = addPaddock(draft)
          break
        case 'noGrazeZone':
          entityId = addNoGrazeZone(draft)
          break
        case 'waterPolygon':
          entityId = addWaterSource(draft, 'polygon')
          break
      }
      console.log('[FarmMap] Created entity:', { type, entityId, draft: draft.geometry.coordinates[0] })
      return entityId
    },
  }), [mapInstance, draw, setMode, deleteSelected, cancelDrawing, getPaddockById, fitPolygonBounds, createDraftSquare, addPaddock, addNoGrazeZone, addWaterSource])

  // Handle paddock click wrapper
  const handlePaddockClick = useCallback((paddock: Paddock) => {
    // Don't trigger click handler when in edit mode
    if (isEditActive) return
    onPaddockClick?.(paddock)
  }, [isEditActive, onPaddockClick])

  useEffect(() => {
    if (!isEditActive || entityType !== 'paddock') {
      if (lastSelectedPaddockIdRef.current !== null) {
        lastSelectedPaddockIdRef.current = null
        onEditPaddockSelect?.(null)
      }
      return
    }

    const nextSelectedId = selectedFeatureIds[0] ?? null
    if (nextSelectedId === lastSelectedPaddockIdRef.current) return

    lastSelectedPaddockIdRef.current = nextSelectedId
    const paddock = nextSelectedId ? getPaddockById(nextSelectedId) ?? null : null
    onEditPaddockSelect?.(paddock)
  }, [isEditActive, entityType, selectedFeatureIds, getPaddockById, onEditPaddockSelect])

  const updateSectionListForPaddock = useCallback(
    (
      list: SectionRenderItem[],
      paddockId: string,
      boundary: Feature<Polygon>,
      translation?: { deltaLng: number; deltaLat: number } | null
    ) => {
      return list.flatMap((item) => {
        if (item.paddockId !== paddockId) {
          return [item]
        }

        let nextGeometry = item.geometry
        if (translation) {
          nextGeometry = translatePolygon(nextGeometry, translation.deltaLng, translation.deltaLat)
        }

        const clipped = clipPolygonToPolygon(nextGeometry, boundary)
        if (!clipped) {
          return []
        }

        return [{ ...item, geometry: clipped }]
      })
    },
    [],
  )

  // Render initial section - keep visible even during section editing so it shows when draw control deselects
  useEffect(() => {
    if (!mapInstance || !isMapReady()) return

    const sourceId = 'section-initial'
    const fillLayerId = `${sourceId}-fill`
    const outlineLayerId = `${sourceId}-outline`

    // Hide section layers only when no section or sections toggled off
    // Note: We keep the layer visible during section editing as a "backing" layer
    // so the section remains visible even when the draw control deselects it
    if (!initialSectionFeature || !showSections) {
      if (mapInstance.getLayer(fillLayerId)) {
        mapInstance.setLayoutProperty(fillLayerId, 'visibility', 'none')
      }
      if (mapInstance.getLayer(outlineLayerId)) {
        mapInstance.setLayoutProperty(outlineLayerId, 'visibility', 'none')
      }
      return
    }

    const sectionGeoJson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        ...initialSectionFeature,
        properties: {
          ...(initialSectionFeature.properties || {}),
          id: initialSectionId || 'initial-section',
          paddockId: parentPaddockId,
        },
      }],
    }
    console.log('[Section] Rendering initial section:', {
      id: initialSectionId,
      paddockId: parentPaddockId,
      coordCount: initialSectionFeature.geometry.coordinates[0]?.length,
      firstCoord: initialSectionFeature.geometry.coordinates[0]?.[0],
    })

    if (!mapInstance.getSource(sourceId)) {
      mapInstance.addSource(sourceId, {
        type: 'geojson',
        data: sectionGeoJson,
      })
      mapInstance.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.45,
        },
      })
      mapInstance.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#22c55e',
          'line-width': 3,
        },
      })
    } else {
      (mapInstance.getSource(sourceId) as maplibregl.GeoJSONSource).setData(sectionGeoJson)
      // Ensure layers are visible
      if (mapInstance.getLayer(fillLayerId)) {
        mapInstance.setLayoutProperty(fillLayerId, 'visibility', 'visible')
      }
      if (mapInstance.getLayer(outlineLayerId)) {
        mapInstance.setLayoutProperty(outlineLayerId, 'visibility', 'visible')
      }
    }
  }, [isMapReady, mapInstance, initialSectionFeature, initialSectionId, showSections, parentPaddockId])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || farmLng === null || farmLat === null || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          },
          satellite: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22,
            layout: {
              visibility: showSatellite ? 'none' : 'visible',
            },
          },
          {
            id: 'satellite-tiles',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 22,
            layout: {
              visibility: showSatellite ? 'visible' : 'none',
            },
          },
        ],
      },
      center: [farmLng, farmLat],
      zoom: 14,
      doubleClickZoom: false,
    })
    map.doubleClickZoom.disable()

    mapRef.current = map

    map.on('load', () => {
      setMapInstance(map)
      setIsMapLoaded(true)

      // Fit to farm boundary if valid, otherwise use center/zoom (already set above)
      if (hasValidBoundary() && farmGeometry) {
        const coords = farmGeometry.geometry.coordinates[0]
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

        const bounds = new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat])
        map.fitBounds(bounds, { padding: 50, duration: 0 })
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
      setMapInstance(null)
      setIsMapLoaded(false)
    }
  }, [farmId, farmLng, farmLat, hasValidBoundary, farmGeometry])

  // Add paddock and section layers once map is loaded
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      console.log('[Paddocks] Map not ready, skipping layer creation', { hasMapInstance: !!mapInstance, isMapLoaded })
      return
    }
    const map = mapInstance

    // Safety check - ensure map style is still valid
    try {
      if (!map.getStyle()) {
        console.log('[Paddocks] Map style not available, skipping')
        return
      }
    } catch {
      console.log('[Paddocks] Map is being destroyed, skipping')
      return
    }

    console.log('[Paddocks] Creating/updating paddock layers, count:', paddocks.length)

    // Create GeoJSON feature collection for paddocks
    const paddocksGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: paddocks.map((p) => ({
        ...p.geometry,
        properties: {
          id: p.id,
          name: p.name,
          status: p.status,
          ndvi: p.ndvi,
        },
      })),
    }

    // Log detailed paddock info for debugging
    console.log('[Paddocks] Source data:', paddocks.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      coordCount: p.geometry.geometry.coordinates[0]?.length,
      firstCoord: p.geometry.geometry.coordinates[0]?.[0],
    })))

    // Check for duplicate IDs
    const ids = paddocks.map(p => p.id)
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    if (duplicates.length > 0) {
      console.warn('[Paddocks] DUPLICATE IDS DETECTED:', duplicates)
    }

    // Check for paddocks with same name (might indicate accidental duplicates)
    const names = paddocks.map(p => p.name)
    const dupNames = names.filter((name, i) => names.indexOf(name) !== i)
    if (dupNames.length > 0) {
      console.log('[Paddocks] Paddocks with same name:', dupNames)
    }

    // Add or update paddocks source
    try {
      if (map.getSource('paddocks')) {
        console.log('[Paddocks] Updating existing source')
        ;(map.getSource('paddocks') as maplibregl.GeoJSONSource).setData(paddocksGeojson)
      } else {
        map.addSource('paddocks', {
          type: 'geojson',
          data: paddocksGeojson,
        })

      // Add fill layer
      map.addLayer({
        id: 'paddocks-fill',
        type: 'fill',
        source: 'paddocks',
        layout: {
          visibility: 'visible',
        },
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'],
            'ready', statusColors.ready,
            'almost_ready', statusColors.almost_ready,
            'recovering', statusColors.recovering,
            'grazed', statusColors.grazed,
            '#6b7280',
          ],
          'fill-opacity': 0.3,
        },
      })

      // Add outline layer
      map.addLayer({
        id: 'paddocks-outline',
        type: 'line',
        source: 'paddocks',
        layout: {
          visibility: 'visible',
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'ready', statusColors.ready,
            'almost_ready', statusColors.almost_ready,
            'recovering', statusColors.recovering,
            'grazed', statusColors.grazed,
            '#6b7280',
          ],
          'line-width': 2,
        },
      })

      // Add NDVI heat layer (gradient based on NDVI value)
      map.addLayer({
        id: 'ndvi-heat',
        type: 'fill',
        source: 'paddocks',
        layout: {
          visibility: 'none',
        },
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'ndvi'],
            0.0, '#d73027',   // Red - bare/stressed
            0.2, '#fc8d59',   // Orange - sparse
            0.4, '#fee08b',   // Yellow - recovering
            0.5, '#d9ef8b',   // Light green - healthy
            0.6, '#91cf60',   // Green - graze-ready
            0.8, '#1a9850',   // Dark green - dense
          ],
          'fill-opacity': 0.7,
        },
      })

      // Add NDVI heat outline for definition
      map.addLayer({
        id: 'ndvi-heat-outline',
        type: 'line',
        source: 'paddocks',
        layout: {
          visibility: 'none',
        },
        paint: {
          'line-color': '#374151',
          'line-width': 1,
        },
      })

      // Add labels
      map.addLayer({
        id: 'paddocks-labels',
        type: 'symbol',
        source: 'paddocks',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      })

      // Add sections source and layers
      ensureSectionLayers(map)

      // Push section data to sources after layers are created
      pushSectionData(map, sectionStateRef.current)

      // Add no-graze zone and water source layers
      ensureNoGrazeZoneLayers(map)
      ensureWaterSourceLayers(map)
    }
    } catch (err) {
      // Map may have been destroyed during component unmount - ignore
      console.log('[Paddocks] Map operation failed (likely unmounting):', err)
      return
    }

    const filterExistingLayers = (layerIds: string[]) =>
      layerIds.filter((layerId) => map.getLayer(layerId))

    const handlePaddockLayerClick = (e: MapEvent) => {
      console.log('[PaddockLayerClick] Handler called', { point: e.point, features: e.features?.length })

      // Check if a section was clicked first (sections are top layer)
      // Include both the initial section layer and the section state layers
      const sectionLayers = ['section-initial-fill', 'sections-current-fill', 'sections-grazed-fill', 'sections-alternatives-fill']
      const existingLayers = sectionLayers.filter((l) => map.getLayer(l))
      console.log('[PaddockLayerClick] Section layers check', { sectionLayers, existingLayers })

      if (existingLayers.length > 0) {
        const sectionHits = map.queryRenderedFeatures(e.point, { layers: existingLayers })
        console.log('[PaddockLayerClick] Section hits', {
          hitCount: sectionHits.length,
          hits: sectionHits.map(f => ({
            id: f.properties?.id,
            paddockId: f.properties?.paddockId,
            layer: f.layer?.id,
            geometryType: f.geometry?.type,
            properties: f.properties
          }))
        })
        if (sectionHits.length > 0) {
          const feature = sectionHits[0]
          const sectionId = feature.properties?.id as string | undefined
          // Use parentPaddockId as fallback if paddockId not in feature properties
          const featurePaddockId = feature.properties?.paddockId as string | undefined
          const effectivePaddockId = featurePaddockId || parentPaddockId
          console.log('[PaddockLayerClick] Section found', { sectionId, featurePaddockId, parentPaddockId, effectivePaddockId, geometryType: feature.geometry?.type })
          if (sectionId && feature.geometry?.type === 'Polygon') {
            console.log('[PaddockLayerClick] Triggering section edit request')
            onEditRequest?.({
              entityType: 'section',
              sectionId,
              paddockId: effectivePaddockId,
              geometry: {
                type: 'Feature',
                properties: feature.properties ?? {},
                geometry: feature.geometry as GeoJSON.Polygon,
              },
            })
            return // Don't process as paddock click
          } else {
            console.log('[PaddockLayerClick] Section check failed', { sectionId, geometryType: feature.geometry?.type })
          }
        }
      }

      // If already in section edit mode, don't fall through to paddock click
      // The section layer is hidden during edit, so clicks should not switch entities
      if (entityType === 'section' && isEditActive) {
        console.log('[PaddockLayerClick] Already in section edit mode, ignoring paddock click')
        return
      }

      // Check for no-graze zones (higher priority than paddocks - they render on top)
      if (map.getLayer('no-graze-fill')) {
        const noGrazeHits = map.queryRenderedFeatures(e.point, { layers: ['no-graze-fill'] })
        if (noGrazeHits.length > 0) {
          console.log('[PaddockLayerClick] No-graze zone at point, deferring to its handler')
          return // Let the no-graze zone handler deal with it
        }
      }

      // Check for water source polygons (higher priority than paddocks - they render on top)
      if (map.getLayer('water-source-fill')) {
        const waterHits = map.queryRenderedFeatures(e.point, { layers: ['water-source-fill'] })
        if (waterHits.length > 0) {
          console.log('[PaddockLayerClick] Water source at point, deferring to its handler')
          return // Let the water source handler deal with it
        }
      }

      // No section/no-graze/water found, handle as paddock click
      console.log('[PaddockLayerClick] No overlay found, handling as paddock click')
      if (e.features && e.features[0]) {
        const paddockId = e.features[0].properties?.id as string | undefined
        if (paddockId) {
          const paddock = getPaddockById(paddockId)
          if (paddock) {
            // In edit mode, single-click opens the edit drawer
            if (isEditActive) {
              onEditRequest?.({ entityType: 'paddock', paddockId })
            } else {
              handlePaddockClick(paddock)
            }
          }
        }
      }
    }

    const handleMapClickLog = (e: MapEvent) => {
      if (!isEditActive || entityType !== 'section') return
      const now = Date.now()
      const last = lastClickRef.current
      const dt = last ? now - last.time : null
      const dx = last ? e.point.x - last.point.x : null
      const dy = last ? e.point.y - last.point.y : null
      const dist = last && dx !== null && dy !== null ? Math.hypot(dx, dy) : null
      const isDoubleCandidate = !!last && dt !== null && dt < 320 && dist !== null && dist < 6
      lastClickRef.current = { time: now, point: e.point }

      if (isDrawing) {
        return
      }

      const drawHitLayers = [
        'gl-draw-polygon-fill-active',
        'gl-draw-polygon-fill-inactive',
        'gl-draw-polygon-fill-active.hot',
        'gl-draw-polygon-fill-inactive.cold',
      ]
      const availableDrawLayers = filterExistingLayers(drawHitLayers)
      const drawHits = availableDrawLayers.length
        ? map.queryRenderedFeatures(e.point, { layers: availableDrawLayers })
        : []

      const sectionHitLayers = filterExistingLayers([
        'sections-current-fill',
        'sections-grazed-fill',
        'sections-alternatives-fill',
      ])
      const sectionHits = sectionHitLayers.length
        ? map.queryRenderedFeatures(e.point, { layers: sectionHitLayers })
        : []
      if (!isDoubleCandidate && drawHits.length === 0 && sectionHits[0]) {
        const feature = sectionHits[0]
        const sectionId = feature.properties?.id
        const paddockId = feature.properties?.paddockId
        if (sectionId && feature.geometry?.type === 'Polygon') {
          onEditRequest?.({
            entityType: 'section',
            sectionId,
            paddockId,
            geometry: {
              type: 'Feature',
              properties: feature.properties ?? {},
              geometry: feature.geometry as Polygon,
            },
          })
        }
      }
    }

    const handleMapDoubleClick = (e: MapEvent) => {
      const isSectionEditDoubleClick = isEditActive && entityType === 'section'
      if (isEditActive && !isSectionEditDoubleClick) return
      if (isDrawing) return
      e.preventDefault()

      const sectionFeatureLayers = filterExistingLayers([
        'sections-current-fill',
        'sections-grazed-fill',
        'sections-alternatives-fill',
      ])
      const sectionFeatures = sectionFeatureLayers.length
        ? map.queryRenderedFeatures(e.point, { layers: sectionFeatureLayers })
        : []
      const drawHitLayers = [
        'gl-draw-polygon-fill-active',
        'gl-draw-polygon-fill-inactive',
        'gl-draw-polygon-fill-active.hot',
        'gl-draw-polygon-fill-inactive.cold',
      ]

      if (isSectionEditDoubleClick) {
        if (sectionFeatures[0]) {
          return
        }

        const availableDrawLayers = filterExistingLayers(drawHitLayers)
        const drawFeatures = availableDrawLayers.length
          ? map.queryRenderedFeatures(e.point, { layers: availableDrawLayers })
          : []
        if (drawFeatures.length > 0) {
          return
        }

        const paddockFeatures = map.queryRenderedFeatures(e.point, {
          layers: ['paddocks-fill'],
        })
        if (paddockFeatures.length > 0) {
          const paddockId = paddockFeatures[0]?.properties?.id
          if (paddockId) {
            onEditRequest?.({ entityType: 'paddock', paddockId })
          }
        }
        return
      }

      if (sectionFeatures[0]) {
        const now = Date.now()
        const ids = sectionFeatures.map((f) => String(f.properties?.id ?? ''))
        const last = lastSectionPickRef.current
        const dt = last ? now - last.time : null
        const dx = last ? e.point.x - last.point.x : null
        const dy = last ? e.point.y - last.point.y : null
        const dist = last && dx !== null && dy !== null ? Math.hypot(dx, dy) : null
        const sameIds = last && last.ids.length === ids.length && last.ids.every((id, index) => id === ids[index])
        const shouldCycle = !!last && !!sameIds && dt !== null && dt < 2000 && dist !== null && dist < 12
        const nextIndex = shouldCycle ? (last.index + 1) % sectionFeatures.length : 0
        lastSectionPickRef.current = { time: now, point: e.point, index: nextIndex, ids }
        // Sort by visual priority: current > alternative > grazed
        const layerPriority: Record<string, number> = {
          'sections-current-fill': 3,
          'sections-alternatives-fill': 2,
          'sections-grazed-fill': 1,
        }
        const sortedFeatures = [...sectionFeatures].sort((a, b) => {
          const aPriority = layerPriority[a.layer?.id ?? ''] ?? 0
          const bPriority = layerPriority[b.layer?.id ?? ''] ?? 0
          return bPriority - aPriority
        })
        const feature = sortedFeatures[nextIndex % sortedFeatures.length]
        const sectionId = feature.properties?.id
        const paddockId = feature.properties?.paddockId
        if (sectionId && feature.geometry?.type === 'Polygon') {
          onEditRequest?.({
            entityType: 'section',
            sectionId,
            paddockId,
            geometry: {
              type: 'Feature',
              properties: feature.properties ?? {},
              geometry: feature.geometry as Polygon,
            },
          })
        }
        return
      }

      const paddockFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['paddocks-fill'],
      })

      if (paddockFeatures.length > 0) {
        const paddockId = paddockFeatures[0]?.properties?.id
        if (paddockId) {
          onEditRequest?.({ entityType: 'paddock', paddockId })
        }
        return
      }

      const availableDrawLayers = filterExistingLayers(drawHitLayers)
      const drawFeatures = availableDrawLayers.length
        ? map.queryRenderedFeatures(e.point, { layers: availableDrawLayers })
        : []
      if (drawFeatures.length > 0) {
        return
      }

      const draft = createDraftSquare(e.lngLat, 50)
      if (draft) {
        onEditRequest?.({
          entityType: 'paddock',
          geometry: draft,
        })
      }
    }

    const handlePaddocksMouseEnter = () => {
      if (!isEditActive) {
        map.getCanvas().style.cursor = 'pointer'
      }
    }

    const handlePaddocksMouseLeave = () => {
      if (!isEditActive) {
        map.getCanvas().style.cursor = ''
      }
    }

    if (map.getLayer('paddocks-fill')) {
      map.on('click', 'paddocks-fill', handlePaddockLayerClick)
      map.on('mouseenter', 'paddocks-fill', handlePaddocksMouseEnter)
      map.on('mouseleave', 'paddocks-fill', handlePaddocksMouseLeave)
    }

    // No-graze zone click handler - in edit mode, single click switches to editing that zone
    const handleNoGrazeZoneClick = (e: MapEvent) => {
      if (e.features && e.features[0]) {
        const zoneId = e.features[0].properties?.id as string | undefined
        const geometry = e.features[0].geometry
        if (zoneId) {
          // In edit mode, single click switches to editing this entity
          if (isEditActive && geometry?.type === 'Polygon') {
            console.log('[FarmMap] No-graze zone single-click (edit mode):', { zoneId })
            onEditRequest?.({
              entityType: 'noGrazeZone',
              noGrazeZoneId: zoneId,
              geometry: {
                type: 'Feature',
                properties: e.features[0].properties ?? {},
                geometry: geometry as Polygon,
              },
            })
          } else {
            onNoGrazeZoneClick?.(zoneId)
          }
        }
      }
    }

    // No-graze zone double-click handler - enter edit mode when not already editing
    const handleNoGrazeZoneDblClick = (e: MapEvent) => {
      // In edit mode, single-click already handles switching - double-click does nothing extra
      if (isEditActive) return
      if (e.features && e.features[0]) {
        e.preventDefault()
        const zoneId = e.features[0].properties?.id as string | undefined
        const geometry = e.features[0].geometry
        console.log('[FarmMap] No-graze zone double-click:', { zoneId, geometryType: geometry?.type })
        if (zoneId && geometry?.type === 'Polygon') {
          onEditRequest?.({
            entityType: 'noGrazeZone',
            noGrazeZoneId: zoneId,
            geometry: {
              type: 'Feature',
              properties: e.features[0].properties ?? {},
              geometry: geometry as Polygon,
            },
          })
        }
      }
    }

    // Water source click handler - in edit mode, single click switches to editing that source
    const handleWaterSourceClick = (e: MapEvent) => {
      if (e.features && e.features[0]) {
        const sourceId = e.features[0].properties?.id as string | undefined
        const geometry = e.features[0].geometry
        if (sourceId) {
          // In edit mode, single click switches to editing this entity (for polygons)
          if (isEditActive && geometry?.type === 'Polygon') {
            console.log('[FarmMap] Water source single-click (edit mode):', { sourceId })
            onEditRequest?.({
              entityType: 'waterPolygon',
              waterSourceId: sourceId,
              geometry: {
                type: 'Feature',
                properties: e.features[0].properties ?? {},
                geometry: geometry as Polygon,
              },
            })
          } else {
            onWaterSourceClick?.(sourceId)
          }
        }
      }
    }

    // Water source polygon double-click handler - enter edit mode when not already editing
    const handleWaterSourceDblClick = (e: MapEvent) => {
      // In edit mode, single-click already handles switching - double-click does nothing extra
      if (isEditActive) return
      if (e.features && e.features[0]) {
        e.preventDefault()
        const sourceId = e.features[0].properties?.id as string | undefined
        const geometry = e.features[0].geometry
        console.log('[FarmMap] Water source double-click:', { sourceId, geometryType: geometry?.type })
        if (sourceId && geometry?.type === 'Polygon') {
          onEditRequest?.({
            entityType: 'waterPolygon',
            waterSourceId: sourceId,
            geometry: {
              type: 'Feature',
              properties: e.features[0].properties ?? {},
              geometry: geometry as Polygon,
            },
          })
        }
      }
    }

    if (map.getLayer('no-graze-fill')) {
      console.log('[FarmMap] Binding click/dblclick to no-graze-fill layer')
      map.on('click', 'no-graze-fill', handleNoGrazeZoneClick)
      map.on('dblclick', 'no-graze-fill', handleNoGrazeZoneDblClick)
    } else {
      console.log('[FarmMap] no-graze-fill layer does not exist yet')
    }

    if (map.getLayer('water-source-fill')) {
      console.log('[FarmMap] Binding click/dblclick to water-source-fill layer')
      map.on('click', 'water-source-fill', handleWaterSourceClick)
      map.on('dblclick', 'water-source-fill', handleWaterSourceDblClick)
    }

    if (map.getLayer('water-source-markers')) {
      map.on('click', 'water-source-markers', handleWaterSourceClick)
    }

    // Double click behavior: select section or create new paddock
    map.on('dblclick', handleMapDoubleClick)
    map.on('click', handleMapClickLog)

    return () => {
      map.off('dblclick', handleMapDoubleClick)
      map.off('click', handleMapClickLog)
      map.off('click', 'paddocks-fill', handlePaddockLayerClick)
      map.off('mouseenter', 'paddocks-fill', handlePaddocksMouseEnter)
      map.off('mouseleave', 'paddocks-fill', handlePaddocksMouseLeave)
      map.off('click', 'no-graze-fill', handleNoGrazeZoneClick)
      map.off('dblclick', 'no-graze-fill', handleNoGrazeZoneDblClick)
      map.off('click', 'water-source-fill', handleWaterSourceClick)
      map.off('dblclick', 'water-source-fill', handleWaterSourceDblClick)
      map.off('click', 'water-source-markers', handleWaterSourceClick)
    }
  }, [mapInstance, isMapLoaded, paddocks, getPaddockById, handlePaddockClick, isEditActive, isDrawing, onEditRequest, createDraftSquare, entityType, currentMode, selectedFeatureIds, onNoGrazeZoneClick, onWaterSourceClick, noGrazeZones, waterSources])

  // Keep section sources synced and clipped to paddock bounds
  useEffect(() => {
    if (!isMapReady()) return
    const sectionState = sectionStateRef.current
    if (!sectionState) return

    console.log('[Sections] Updating section sources, paddocks:', paddocks.length)

    const nextPaddockGeometries: Record<string, Feature<Polygon>> = {}
    paddocks.forEach((paddock) => {
      nextPaddockGeometries[paddock.id] = paddock.geometry
    })

    const previousGeometries = paddockGeometryRef.current

    Object.entries(nextPaddockGeometries).forEach(([paddockId, geometry]) => {
      const previousGeometry = previousGeometries[paddockId]
      const translation = previousGeometry ? getTranslationDelta(previousGeometry, geometry) : null

      sectionState.current = updateSectionListForPaddock(sectionState.current, paddockId, geometry, translation)
      sectionState.grazed = updateSectionListForPaddock(sectionState.grazed, paddockId, geometry, translation)
      sectionState.alternatives = updateSectionListForPaddock(
        sectionState.alternatives,
        paddockId,
        geometry,
        translation
      )
    })

    const validPaddockIds = new Set(Object.keys(nextPaddockGeometries))
    sectionState.current = sectionState.current.filter((item) => validPaddockIds.has(item.paddockId))
    sectionState.grazed = sectionState.grazed.filter((item) => validPaddockIds.has(item.paddockId))
    sectionState.alternatives = sectionState.alternatives.filter((item) => validPaddockIds.has(item.paddockId))

    paddockGeometryRef.current = nextPaddockGeometries

    if (mapInstance) {
      pushSectionData(mapInstance, sectionState)
    }
  }, [mapInstance, isMapLoaded, paddocks, updateSectionListForPaddock])

  // Update no-graze zone layer data
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return
    const map = mapInstance

    // Ensure layers exist
    ensureNoGrazeZoneLayers(map)

    const source = map.getSource('no-graze-zones') as maplibregl.GeoJSONSource | undefined
    if (!source) return

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: noGrazeZones.map((zone) => ({
        ...zone.geometry,
        properties: {
          ...(zone.geometry.properties ?? {}),
          id: zone.id,
          name: zone.name,
          type: zone.type,
          area: zone.area,
        },
      })),
    }
    source.setData(geojson)
  }, [mapInstance, isMapLoaded, noGrazeZones])

  // Update water source layer data
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return
    const map = mapInstance

    // Ensure layers exist
    ensureWaterSourceLayers(map)

    const polygonSource = map.getSource('water-source-polygons') as maplibregl.GeoJSONSource | undefined
    const pointSource = map.getSource('water-source-points') as maplibregl.GeoJSONSource | undefined

    if (!polygonSource || !pointSource) return

    const polygonSources = waterSources.filter((s) => s.geometryType === 'polygon')
    const pointSources = waterSources.filter((s) => s.geometryType === 'point')

    const polygonGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: polygonSources.map((source) => ({
        ...source.geometry,
        properties: {
          ...(source.geometry.properties ?? {}),
          id: source.id,
          name: source.name,
          type: source.type,
        },
      })),
    }

    const pointGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: pointSources.map((source) => ({
        ...source.geometry,
        properties: {
          ...(source.geometry.properties ?? {}),
          id: source.id,
          name: source.name,
          type: source.type,
        },
      })),
    }

    polygonSource.setData(polygonGeojson)
    pointSource.setData(pointGeojson)
  }, [mapInstance, isMapLoaded, waterSources])

  // Farm boundary visualization layer
  useEffect(() => {
    if (!isMapReady() || !farmGeometry) return
    const map = mapInstance!

    const sourceId = 'farm-boundary'
    const outlineLayerId = 'farm-boundary-outline'
    const fillLayerId = 'farm-boundary-fill'

    const boundaryGeoJson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [farmGeometry],
    }

    // Add or update boundary source
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(boundaryGeoJson)
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: boundaryGeoJson,
      })

      // Add fill layer (subtle, semi-transparent)
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#f59e0b',
          'fill-opacity': 0.05,
        },
      }, 'paddocks-fill') // Insert below paddocks

      // Add outline layer (dashed amber line)
      map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#f59e0b',
          'line-width': 2,
          'line-dasharray': [4, 2],
        },
      }, 'paddocks-fill') // Insert below paddocks
    }
  }, [mapInstance, isMapLoaded, farmGeometry, isMapReady])

  // Click-to-edit and drag-to-move behavior in edit mode
  useEffect(() => {
    if (!mapInstance || !isMapLoaded || !draw || !isEditActive) return

    const map = mapInstance
    const filterExistingLayers = (layerIds: string[]) =>
      layerIds.filter((layerId) => map.getLayer(layerId))

    let vertexLayerIds: string[] = []
    const getVertexLayerIds = () => {
      vertexLayerIds = filterExistingLayers([
        'gl-draw-polygon-and-line-vertex-active',
        'gl-draw-polygon-and-line-vertex-active.hot',
        'gl-draw-polygon-and-line-vertex-inactive',
        'gl-draw-polygon-and-line-vertex-inactive.cold',
        'gl-draw-polygon-midpoint',
        'gl-draw-polygon-midpoint.hot',
        'gl-draw-polygon-midpoint.cold',
      ])
      return vertexLayerIds
    }

    const getFeatureIdAtPoint = (point: maplibregl.Point) => {
      if (!draw) return null
      const ids = draw.getFeatureIdsAt({ x: point.x, y: point.y })
      const firstValid = ids.find((id) => id !== undefined && id !== null && id !== '')
      return firstValid !== undefined ? String(firstValid) : null
    }

    const isVertexHit = (point: maplibregl.Point) => {
      const activeVertexLayers = getVertexLayerIds()
      if (activeVertexLayers.length) {
        const features = map.queryRenderedFeatures(point, { layers: activeVertexLayers })
        if (features.length > 0) return true
      }

      const features = map.queryRenderedFeatures(point)
      return features.some((feature) => {
        const meta = (feature.properties as { meta?: string } | undefined)?.meta
        return meta === 'vertex' || meta === 'midpoint'
      })
    }

    const handleMouseDown = (e: MapEvent) => {
      if (!draw) return
      const vertexHit = isVertexHit(e.point)
      const featureId = isDrawing || vertexHit ? null : getFeatureIdAtPoint(e.point)
      if (isDrawing || vertexHit) return
      if (!featureId) return
      if (map.dragPan.isEnabled()) {
        map.dragPan.disable()
      }
      const alreadySelected = draw.getSelectedIds().includes(featureId)
      if (!alreadySelected) {
        draw.changeMode('simple_select', { featureIds: [featureId] })
      }
      dragStateRef.current = {
        featureId,
        startPoint: e.point,
        startLngLat: e.lngLat,
        startGeometry: (draw.get(featureId) as Feature<Polygon> | undefined) ?? null,
        dragging: false,
        manual: !alreadySelected,
      }
    }

    const handleMouseMove = (e: MapEvent) => {
      if (!draw) return
      const state = dragStateRef.current
      if (!state || state.dragging) return
      const dx = e.point.x - state.startPoint.x
      const dy = e.point.y - state.startPoint.y
      if (Math.hypot(dx, dy) > 4) {
        state.dragging = true
      }
      if (!state.dragging || !state.manual || !state.startGeometry) return
      const deltaLng = e.lngLat.lng - state.startLngLat.lng
      const deltaLat = e.lngLat.lat - state.startLngLat.lat
      const moved = translatePolygon(state.startGeometry, deltaLng, deltaLat)
      state.lastGeometry = moved
      draw.add({ ...moved, id: state.featureId })
    }

    const handleMouseUp = () => {
      if (!draw) return
      const state = dragStateRef.current
      if (!state) return
      if (state.manual && state.dragging && state.lastGeometry) {
        map.fire('draw.update', { features: [state.lastGeometry], action: 'move' })
        draw.changeMode('direct_select', { featureId: state.featureId })
      } else if (!state.dragging) {
        draw.changeMode('direct_select', { featureId: state.featureId })
      }
      dragStateRef.current = null
    }

    const handleMapClick = (e: MapEvent) => {
      if (!draw) return
      if (isDrawing || dragStateRef.current || isVertexHit(e.point)) return
      const featureId = getFeatureIdAtPoint(e.point)
      if (!featureId) {
        // When editing sections, don't deselect when clicking outside
        // This keeps the section visible (inactive polygons are transparent)
        if (entityType === 'section') {
          return
        }
        // Don't deselect if clicking on a no-graze zone or water source
        // Their click handlers will switch to editing that entity instead
        if (map.getLayer('no-graze-fill')) {
          const noGrazeHits = map.queryRenderedFeatures(e.point, { layers: ['no-graze-fill'] })
          if (noGrazeHits.length > 0) return
        }
        if (map.getLayer('water-source-fill')) {
          const waterHits = map.queryRenderedFeatures(e.point, { layers: ['water-source-fill'] })
          if (waterHits.length > 0) return
        }
        draw.changeMode('simple_select')
        return
      }
      draw.changeMode('direct_select', { featureId })
    }

    const handleMouseDownCapture = (event: MouseEvent) => {
      if (!draw) return
      if (isDrawing) return
      const rect = map.getCanvas().getBoundingClientRect()
      const point = new maplibregl.Point(event.clientX - rect.left, event.clientY - rect.top)

      // Check if clicking on no-graze zone or water source - these should switch entity types
      // Handle the switch directly and stop propagation to prevent MapboxDraw from interfering
      const hasNoGrazeLayer = map.getLayer('no-graze-fill')
      const hasWaterLayer = map.getLayer('water-source-fill')

      console.log('[FarmMap] MouseDownCapture:', {
        entityType,
        hasNoGrazeLayer: !!hasNoGrazeLayer,
        hasWaterLayer: !!hasWaterLayer,
        point: { x: point.x, y: point.y }
      })

      if (hasNoGrazeLayer) {
        const noGrazeHits = map.queryRenderedFeatures(point, { layers: ['no-graze-fill'] })
        console.log('[FarmMap] No-graze query result:', noGrazeHits.length, 'hits')
        if (noGrazeHits.length > 0 && noGrazeHits[0]) {
          const feature = noGrazeHits[0]
          const zoneId = feature.properties?.id as string | undefined
          const geometry = feature.geometry
          if (zoneId && geometry?.type === 'Polygon') {
            console.log('[FarmMap] MouseDown on no-graze zone:', zoneId, 'current entityType:', entityType)
            event.stopImmediatePropagation()
            event.preventDefault()

            // If already in noGrazeZone mode, directly select the feature
            if (entityType === 'noGrazeZone') {
              const existing = draw.get(zoneId)
              if (existing) {
                console.log('[FarmMap] Already in noGrazeZone mode, selecting directly:', zoneId)
                draw.changeMode('direct_select', { featureId: zoneId })
              }
              return
            }

            // Otherwise, set pending selection and switch entity type
            pendingNoGrazeSelectionRef.current = zoneId
            onEditRequest?.({
              entityType: 'noGrazeZone',
              noGrazeZoneId: zoneId,
              geometry: {
                type: 'Feature',
                properties: feature.properties ?? {},
                geometry: geometry as Polygon,
              },
            })
            return
          }
        }
      }
      if (hasWaterLayer) {
        const waterHits = map.queryRenderedFeatures(point, { layers: ['water-source-fill'] })
        console.log('[FarmMap] Water query result:', waterHits.length, 'hits')
        if (waterHits.length > 0 && waterHits[0]) {
          const feature = waterHits[0]
          const sourceId = feature.properties?.id as string | undefined
          const geometry = feature.geometry
          if (sourceId && geometry?.type === 'Polygon') {
            console.log('[FarmMap] MouseDown on water source:', sourceId, 'current entityType:', entityType)
            event.stopImmediatePropagation()
            event.preventDefault()

            // If already in waterPolygon mode, directly select the feature
            if (entityType === 'waterPolygon') {
              const existing = draw.get(sourceId)
              if (existing) {
                console.log('[FarmMap] Already in waterPolygon mode, selecting directly:', sourceId)
                draw.changeMode('direct_select', { featureId: sourceId })
              }
              return
            }

            // Otherwise, set pending selection and switch entity type
            pendingWaterSelectionRef.current = sourceId
            onEditRequest?.({
              entityType: 'waterPolygon',
              waterSourceId: sourceId,
              geometry: {
                type: 'Feature',
                properties: feature.properties ?? {},
                geometry: geometry as Polygon,
              },
            })
            return
          }
        }
      }

      if (isVertexHit(point)) return
      const featureId = getFeatureIdAtPoint(point)
      if (!featureId) return
      if (!draw.getSelectedIds().includes(featureId)) {
        draw.changeMode('simple_select', { featureIds: [featureId] })
      }
    }

    map.getCanvas().addEventListener('mousedown', handleMouseDownCapture, { capture: true })
    map.on('mousedown', handleMouseDown)
    map.on('mousemove', handleMouseMove)
    map.on('mouseup', handleMouseUp)
    map.on('click', handleMapClick)

    return () => {
      map.getCanvas().removeEventListener('mousedown', handleMouseDownCapture, { capture: true })
      map.off('mousedown', handleMouseDown)
      map.off('mousemove', handleMouseMove)
      map.off('mouseup', handleMouseUp)
      map.off('click', handleMapClick)
    }
  }, [mapInstance, isMapLoaded, draw, isEditActive, isDrawing, entityType])

  // Load paddock geometries into draw when edit mode is activated or reset
  useEffect(() => {
    if (!draw || !isEditActive || entityType !== 'paddock') {
      if (!isEditActive || entityType !== 'paddock') {
        lastLoadedPaddockKeyRef.current = null
      }
      return
    }

    // Force reload if resetCounter changed (user clicked Reset)
    const forceReload = resetCounter !== lastResetCounterRef.current
    if (forceReload) {
      console.log('[Paddocks] Reset detected, forcing reload. resetCounter:', resetCounter, 'previous:', lastResetCounterRef.current)
      console.log('[Paddocks] Paddocks to load:', paddocks.map(p => ({
        id: p.id,
        name: p.name,
        firstCoord: p.geometry.geometry.coordinates[0]?.[0],
      })))
      lastResetCounterRef.current = resetCounter
      lastLoadedPaddockKeyRef.current = null // Clear key to force reload
    }

    // Load existing paddock geometries into the draw plugin
    const features = paddocks.map((p) => ({
      ...p.geometry,
      id: p.id,
    }))
    // Include geometry hashes in the key to detect geometry changes
    const nextKey = paddocks.map((p) => {
      const coords = p.geometry.geometry.coordinates[0]
      const coordHash = coords.length + ':' + (coords[0]?.[0]?.toFixed(6) || '') + ',' + (coords[0]?.[1]?.toFixed(6) || '')
      return `${p.id}:${coordHash}`
    }).sort().join('|')
    // MapboxDraw internal state can be invalid during cleanup - wrap in try-catch
    let drawFeatureCount = 0
    try {
      drawFeatureCount = draw.getAll()?.features?.length ?? 0
    } catch {
      // Draw instance is in invalid state (being cleaned up), skip this update
      return
    }
    if (lastLoadedPaddockKeyRef.current === nextKey && drawFeatureCount > 0 && !forceReload) {
      return
    }
    console.log('[Paddocks] Loading geometries into draw, key changed:', lastLoadedPaddockKeyRef.current !== nextKey, 'forceReload:', forceReload)
    console.log('[Paddocks] Features being loaded:', features.map(f => ({
      id: f.id,
      coordCount: f.geometry.coordinates[0]?.length,
      firstCoord: f.geometry.coordinates[0]?.[0],
    })))
    lastLoadedPaddockKeyRef.current = nextKey
    try {
      loadGeometriesToDraw(draw, features)
      console.log('[Paddocks] Draw control reloaded, verifying:', draw.getAll().features.map(f => ({
        id: f.id,
        coordCount: (f.geometry as any).coordinates?.[0]?.length,
        firstCoord: (f.geometry as any).coordinates?.[0]?.[0],
      })))
    } catch (err) {
      // Draw instance is in invalid state, skip loading
      console.log('[Paddocks] Draw reload failed:', err)
    }
  }, [draw, isEditActive, entityType, paddocks, resetCounter])

  // Select a newly created paddock when entering edit mode
  // Note: We depend on paddocks to ensure this runs after paddocks are loaded into draw
  useEffect(() => {
    if (!draw || !isEditActive || entityType !== 'paddock' || !initialPaddockId) return
    const existing = draw.get(initialPaddockId)
    if (!existing) return
    draw.changeMode('direct_select', { featureId: initialPaddockId })
  }, [draw, isEditActive, entityType, initialPaddockId, paddocks])

  // Reset section edit initialization when exiting edit mode or changing section
  useEffect(() => {
    if (!isEditActive || entityType !== 'section') {
      sectionEditInitializedRef.current = false
    }
  }, [isEditActive, entityType, initialSectionId])

  // Load section geometry into draw and select it when editing sections
  // IMPORTANT: Only run once when first entering section edit mode to avoid
  // resetting the draw control when the user edits vertices
  useEffect(() => {
    if (!draw || !isEditActive || entityType !== 'section' || !initialSectionFeature) return

    // Skip if we've already initialized this section edit session
    if (sectionEditInitializedRef.current) {
      console.log('[FarmMap] Section edit already initialized, skipping reset')
      return
    }

    const featureId = initialSectionId ?? initialSectionFeature.id?.toString()
    const feature = featureId
      ? { ...initialSectionFeature, id: featureId }
      : initialSectionFeature

    console.log('[FarmMap] Initializing section edit mode', { featureId })
    loadGeometriesToDraw(draw, [feature])

    if (featureId) {
      draw.changeMode('direct_select', { featureId })
    }

    // Mark as initialized so we don't reset on subsequent renders
    sectionEditInitializedRef.current = true
  }, [draw, entityType, isEditActive, initialSectionFeature, initialSectionId])

  // Focus map on the section bounds when editing sections
  useEffect(() => {
    if (!isMapLoaded || !isEditActive || entityType !== 'section' || !initialSectionFeature) return
    fitPolygonBounds(initialSectionFeature, 80)
  }, [entityType, fitPolygonBounds, initialSectionFeature, isEditActive, isMapLoaded])

  // Load no-graze zone geometries into draw when edit mode is activated
  useEffect(() => {
    if (!draw || !isEditActive || entityType !== 'noGrazeZone') {
      if (!isEditActive || entityType !== 'noGrazeZone') {
        lastLoadedNoGrazeKeyRef.current = null
      }
      return
    }

    // Force reload if resetCounter changed (user clicked Reset)
    const forceReload = resetCounter !== lastResetCounterRef.current

    // Load existing no-graze zone geometries into the draw plugin
    const features = noGrazeZones.map((z) => ({
      ...z.geometry,
      id: z.id,
    }))
    // Include geometry hashes in the key to detect geometry changes
    const nextKey = noGrazeZones.map((z) => {
      const coords = z.geometry.geometry.coordinates[0]
      const coordHash = coords.length + ':' + (coords[0]?.[0]?.toFixed(6) || '') + ',' + (coords[0]?.[1]?.toFixed(6) || '')
      return `${z.id}:${coordHash}`
    }).sort().join('|')

    let drawFeatureCount = 0
    try {
      drawFeatureCount = draw.getAll()?.features?.length ?? 0
    } catch {
      return
    }
    if (lastLoadedNoGrazeKeyRef.current === nextKey && drawFeatureCount > 0 && !forceReload) {
      return
    }
    console.log('[NoGrazeZones] Loading geometries into draw')
    lastLoadedNoGrazeKeyRef.current = nextKey
    try {
      loadGeometriesToDraw(draw, features)
      // Select the pending no-graze zone if there is one
      const pendingId = pendingNoGrazeSelectionRef.current
      if (pendingId) {
        console.log('[NoGrazeZones] Selecting pending zone:', pendingId)
        pendingNoGrazeSelectionRef.current = null
        const existing = draw.get(pendingId)
        if (existing) {
          draw.changeMode('direct_select', { featureId: pendingId })
        }
      }
    } catch (err) {
      console.log('[NoGrazeZones] Draw reload failed:', err)
    }
  }, [draw, isEditActive, entityType, noGrazeZones, resetCounter])

  // Load water source polygon geometries into draw when edit mode is activated
  useEffect(() => {
    if (!draw || !isEditActive || entityType !== 'waterPolygon') {
      if (!isEditActive || entityType !== 'waterPolygon') {
        lastLoadedWaterKeyRef.current = null
      }
      return
    }

    // Force reload if resetCounter changed (user clicked Reset)
    const forceReload = resetCounter !== lastResetCounterRef.current

    // Load existing water source polygon geometries into the draw plugin (exclude points)
    const polygonSources = waterSources.filter((s) => s.geometryType === 'polygon')
    const features = polygonSources.map((s) => ({
      ...s.geometry,
      id: s.id,
    })) as Feature<Polygon>[]

    // Include geometry hashes in the key to detect geometry changes
    const nextKey = polygonSources.map((s) => {
      const geom = s.geometry.geometry
      if (geom.type !== 'Polygon') return s.id
      const coords = geom.coordinates[0]
      const coordHash = coords.length + ':' + (coords[0]?.[0]?.toFixed(6) || '') + ',' + (coords[0]?.[1]?.toFixed(6) || '')
      return `${s.id}:${coordHash}`
    }).sort().join('|')

    let drawFeatureCount = 0
    try {
      drawFeatureCount = draw.getAll()?.features?.length ?? 0
    } catch {
      return
    }
    if (lastLoadedWaterKeyRef.current === nextKey && drawFeatureCount > 0 && !forceReload) {
      return
    }
    console.log('[WaterSources] Loading polygon geometries into draw')
    lastLoadedWaterKeyRef.current = nextKey
    try {
      loadGeometriesToDraw(draw, features)
      // Select the pending water source if there is one
      const pendingId = pendingWaterSelectionRef.current
      if (pendingId) {
        console.log('[WaterSources] Selecting pending source:', pendingId)
        pendingWaterSelectionRef.current = null
        const existing = draw.get(pendingId)
        if (existing) {
          draw.changeMode('direct_select', { featureId: pendingId })
        }
      }
    } catch (err) {
      console.log('[WaterSources] Draw reload failed:', err)
    }
  }, [draw, isEditActive, entityType, waterSources, resetCounter])

  // Hide native paddock layers when editing paddocks (Draw will render them)
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      console.log('[Paddocks] Visibility effect: map not ready')
      return
    }
    const map = mapInstance

    // Safety check - ensure map style is available (may be destroyed during navigation)
    try {
      if (!map.getStyle()) {
        console.log('[Paddocks] Visibility effect: map style not available, skipping')
        return
      }
    } catch {
      console.log('[Paddocks] Visibility effect: map is being destroyed, skipping')
      return
    }

    const paddockLayers = ['paddocks-fill', 'paddocks-outline']
    // Always show native paddock layers - Draw's inactive polygons are transparent
    // so native layers show through with proper status colors
    const visibility = showPaddocks ? 'visible' : 'none'
    console.log('[Paddocks] Setting visibility:', { showPaddocks, visibility, isEditActive, hasDraw: !!draw })

    // Log all paddocks for debugging
    console.log('[Paddocks] Current paddocks:', paddocks.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
    })))

    try {
      paddockLayers.forEach(layerId => {
        const layerExists = !!map.getLayer(layerId)
        console.log('[Paddocks] Layer', layerId, 'exists:', layerExists)
        if (layerExists) {
          map.setLayoutProperty(layerId, 'visibility', visibility)
        }
      })
    } catch (err) {
      console.log('[Paddocks] Visibility effect: error accessing map layers, likely destroyed', err)
    }
  }, [mapInstance, isMapLoaded, showPaddocks, paddocks])

  // Update selected paddock highlight
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return

    if (map.getLayer('paddocks-selected')) {
      map.removeLayer('paddocks-selected')
    }

    if (selectedPaddockId && !isEditActive) {
      map.addLayer({
        id: 'paddocks-selected',
        type: 'line',
        source: 'paddocks',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3,
        },
        filter: ['==', ['get', 'id'], selectedPaddockId],
      })
    }
  }, [mapInstance, isMapLoaded, selectedPaddockId, isEditActive])

  // Toggle satellite/OSM basemap
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return

    if (map.getLayer('satellite-tiles')) {
      map.setLayoutProperty(
        'satellite-tiles',
        'visibility',
        showSatellite ? 'visible' : 'none'
      )
    }
    if (map.getLayer('osm-tiles')) {
      map.setLayoutProperty(
        'osm-tiles',
        'visibility',
        showSatellite ? 'none' : 'visible'
      )
    }
  }, [mapInstance, isMapLoaded, showSatellite])

  // Toggle NDVI heat layer
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return
    
    const ndviLayers = ['ndvi-heat', 'ndvi-heat-outline']
    ndviLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          showNdviHeat ? 'visible' : 'none'
        )
      }
    })
  }, [mapInstance, isMapLoaded, showNdviHeat])

  // Toggle labels visibility
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return
    
    if (map.getLayer('paddocks-labels')) {
      map.setLayoutProperty(
        'paddocks-labels',
        'visibility',
        showLabels ? 'visible' : 'none'
      )
    }
  }, [mapInstance, isMapLoaded, showLabels])

  // Toggle sections visibility
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return
    
    console.log('[Sections] Toggle visibility, showSections:', showSections)
    
    const sectionLayers = [
      'sections-grazed-fill',
      'sections-grazed-outline',
      'sections-current-fill',
      'sections-current-outline',
      'sections-alternatives-fill',
      'sections-alternatives-outline',
    ]
    sectionLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          showSections ? 'visible' : 'none'
        )
        console.log('[Sections] Set', layerId, 'visibility to', showSections ? 'visible' : 'none')
      } else {
        console.warn('[Sections] Layer not found:', layerId)
      }
    })
  }, [mapInstance, isMapLoaded, showSections])

  // Position classes for toolbar
  const toolbarPositionClasses = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  }

  return (
    <div className="relative h-full w-full">
      {isFarmLoading ? (
        <MapSkeleton className="h-full w-full" />
      ) : !farm ? (
        <ErrorState
          title="Map unavailable"
          message="Farm geometry could not be loaded."
          className="h-full"
        />
      ) : (
        <div ref={mapContainer} className="h-full w-full" />
      )}
      
      {isEditActive && showToolbar && (
        <div className={`absolute ${toolbarPositionClasses[toolbarPosition]} z-10`}>
          <DrawingToolbar
            currentMode={currentMode}
            selectedFeatureIds={selectedFeatureIds}
            isDrawing={isDrawing}
            onSetMode={setMode}
            onDeleteSelected={deleteSelected}
            onCancelDrawing={cancelDrawing}
            entityType={entityType === 'noGrazeZone' || entityType === 'waterPoint' || entityType === 'waterPolygon' ? 'paddock' : entityType}
            compact={compactToolbar}
          />
        </div>
      )}
    </div>
  )
})

