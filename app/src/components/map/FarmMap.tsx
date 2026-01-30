import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import type { Paddock, PaddockStatus } from '@/lib/types'
import { useGeometry, clipPolygonToPolygon, getTranslationDelta, translatePolygon } from '@/lib/geometry'
import { createNoGrazeStripePatternByType, getNoGrazeZoneTypes } from '@/lib/map/patterns'
import { useMapDraw, loadGeometriesToDraw, createTypedFeatureId, parseTypedFeatureId, type DrawMode } from '@/lib/hooks'
import type { EntityType } from '@/lib/geometry'
import { useSatelliteTile, useAvailableTileDates } from '@/lib/hooks/useSatelliteTiles'
import { DrawingToolbar } from './DrawingToolbar'
import { RasterTileLayer } from './RasterTileLayer'
import type { Feature, Polygon } from 'geojson'
import { useFarmContext } from '@/lib/farm'
import { MapSkeleton } from '@/components/ui/loading/MapSkeleton'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { createLogger } from '@/lib/logger'

const log = createLogger('map')

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
  selectedSectionId?: string
  showNdviHeat?: boolean
  showPaddocks?: boolean
  showLabels?: boolean
  showSections?: boolean
  showRGBSatellite?: boolean
  editable?: boolean
  editMode?: boolean
  entityType?: 'paddock' | 'section' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'
  parentPaddockId?: string
  initialSectionFeature?: Feature<Polygon>
  initialSectionId?: string
  initialPaddockId?: string
  initialNoGrazeZoneId?: string
  initialWaterSourceId?: string
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
  focusOnGeometry: (geometry: Feature<Polygon>, padding?: number, force?: boolean) => void
  focusOnFarmBoundary: () => void
  createPaddockAtCenter: () => string | null
  createEntityAtScreenPoint: (type: EntityDropType, screenX: number, screenY: number) => string | null
  getMapContainerRect: () => DOMRect | null
  resetUserInteraction: () => void
}

interface SectionRenderItem {
  id: string
  paddockId: string
  geometry: Feature<Polygon>
  properties: Record<string, unknown>
}

interface SectionRenderState {
  current: SectionRenderItem[]
  yesterday: SectionRenderItem[]
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
  log('[Sections] pushSectionData called')
  const updateSource = (sourceId: string, items: SectionRenderItem[]) => {
    const source = mapInstance.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
    if (!source) {
      log.warn('[Sections] Source not found:', sourceId)
      return
    }

    const features = items.map((item) => {
      const coords = item.geometry.geometry.coordinates[0]
      log(`[Sections] ${sourceId} feature ${item.id}:`, {
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
    log(`[Sections] Updating ${sourceId}:`, { count: items.length })
    source.setData(geojson)
  }

  updateSource('sections-grazed', sectionState.grazed)
  updateSource('sections-yesterday', sectionState.yesterday)
  updateSource('sections-current', sectionState.current)
  updateSource('sections-alternatives', sectionState.alternatives)
}

function ensureSectionLayers(mapInstance: maplibregl.Map) {
  log('[Sections] ensureSectionLayers called')
  const emptyCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  if (!mapInstance.getSource('sections-grazed')) {
    log('[Sections] Adding source: sections-grazed')
    mapInstance.addSource('sections-grazed', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    log('[Sections] Source already exists: sections-grazed')
  }

  if (!mapInstance.getLayer('sections-grazed-fill')) {
    log('[Sections] Adding layer: sections-grazed-fill')
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
    log('[Sections] Adding layer: sections-grazed-outline')
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

  // Yesterday sections - yellow styling
  if (!mapInstance.getSource('sections-yesterday')) {
    log('[Sections] Adding source: sections-yesterday')
    mapInstance.addSource('sections-yesterday', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    log('[Sections] Source already exists: sections-yesterday')
  }

  if (!mapInstance.getLayer('sections-yesterday-fill')) {
    log('[Sections] Adding layer: sections-yesterday-fill')
    mapInstance.addLayer({
      id: 'sections-yesterday-fill',
      type: 'fill',
      source: 'sections-yesterday',
      paint: {
        'fill-color': '#eab308', // yellow-500
        'fill-opacity': 0.35,
      },
    })
  }

  if (!mapInstance.getLayer('sections-yesterday-outline')) {
    log('[Sections] Adding layer: sections-yesterday-outline')
    mapInstance.addLayer({
      id: 'sections-yesterday-outline',
      type: 'line',
      source: 'sections-yesterday',
      paint: {
        'line-color': '#ca8a04', // yellow-600
        'line-width': 2,
      },
    })
  }

  if (!mapInstance.getSource('sections-current')) {
    log('[Sections] Adding source: sections-current')
    mapInstance.addSource('sections-current', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    log('[Sections] Source already exists: sections-current')
  }

  if (!mapInstance.getLayer('sections-current-fill')) {
    log('[Sections] Adding layer: sections-current-fill')
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
    log('[Sections] Adding layer: sections-current-outline')
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
    log('[Sections] Adding source: sections-alternatives')
    mapInstance.addSource('sections-alternatives', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    log('[Sections] Source already exists: sections-alternatives')
  }

  if (!mapInstance.getLayer('sections-alternatives-fill')) {
    log('[Sections] Adding layer: sections-alternatives-fill')
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
    log('[Sections] Adding layer: sections-alternatives-outline')
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
  selectedSectionId,
  showNdviHeat = false,
  showPaddocks = true,
  showLabels = true,
  showSections = true,
  showRGBSatellite = false,
  editable = false,
  editMode = false,
  entityType = 'paddock',
  parentPaddockId,
  initialSectionFeature,
  initialSectionId,
  initialPaddockId,
  initialNoGrazeZoneId,
  initialWaterSourceId,
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
  const sectionStateRef = useRef<SectionRenderState>({ current: [], yesterday: [], grazed: [], alternatives: [] })
  const paddockGeometryRef = useRef<Record<string, Feature<Polygon>>>({})
  const lastResetCounterRef = useRef<number>(0)
  // Track if user has manually adjusted the map (pan/zoom) to suppress auto-focus
  const userHasInteractedRef = useRef(false)
  // Track the last section ID we focused on to avoid re-focusing during vertex edits
  const lastFocusedSectionIdRef = useRef<string | null>(null)

  const { paddocks, sections, getPaddockById, noGrazeZones, waterSources, addPaddock, addNoGrazeZone, addWaterSource, resetCounter } = useGeometry()
  const { activeFarm: farm, isLoading: isFarmLoading } = useFarmContext()
  const farmId = farm?.id ?? null
  const farmLng = farm?.coordinates?.[0] ?? null
  const farmLat = farm?.coordinates?.[1] ?? null
  const farmGeometry = farm?.geometry ?? null

  // Compute initial map center from farm boundary if valid, otherwise use address
  const initialMapCenter = useMemo<[number, number] | null>(() => {
    // First try to use the farm boundary center
    if (farmGeometry) {
      const coords = farmGeometry.geometry.coordinates[0]
      if (coords && coords.length >= 4) {
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

        // Check if boundary is valid (not the tiny default)
        const lngSpan = maxLng - minLng
        const latSpan = maxLat - minLat
        if (lngSpan > 0.0005 && latSpan > 0.0005) {
          // Use center of the boundary
          return [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
        }
      }
    }
    // Fall back to address coordinates
    if (farmLng !== null && farmLat !== null) {
      return [farmLng, farmLat]
    }
    return null
  }, [farmGeometry, farmLng, farmLat])

  // Fetch available satellite tile dates (dates with actual raster imagery)
  // We specifically query for ndvi_heatmap tiles since that's what the NDVI layer displays
  const { dates: availableTileDates } = useAvailableTileDates(farmId ?? undefined, 'ndvi_heatmap')
  const mostRecentDate = useMemo(() => {
    if (!availableTileDates || availableTileDates.length === 0) return undefined
    // Dates are returned sorted by date descending, so first is most recent
    return availableTileDates[0].date
  }, [availableTileDates])

  // Fetch the RGB tile for the most recent date
  const { tile: rgbTile } = useSatelliteTile(
    farmId ?? undefined,
    mostRecentDate,
    'rgb'
  )

  // Fetch the NDVI heatmap tile for the most recent date
  const { tile: ndviHeatmapTile } = useSatelliteTile(
    farmId ?? undefined,
    mostRecentDate,
    'ndvi_heatmap'
  )

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

  // Track the last notified feature ID to avoid redundant onEditRequest calls
  const lastNotifiedFeatureIdRef = useRef<string | null>(null)

  // Callback when a feature is selected in the draw control
  // This handles cases where MapboxDraw selection changes (e.g., clicking between sections)
  // without going through the layer click handlers
  const handleFeatureSelected = useCallback((
    typedId: string | null,
    entityType: EntityType | null,
    entityId: string | null
  ) => {
    log('[FarmMap] Feature selected in draw:', { typedId, entityType, entityId })

    // Skip if same feature already notified (avoid redundant calls)
    if (typedId === lastNotifiedFeatureIdRef.current) {
      return
    }
    lastNotifiedFeatureIdRef.current = typedId

    // Notify parent when a feature is selected
    if (typedId && entityType && entityId) {
      if (entityType === 'paddock') {
        onEditRequest?.({ entityType: 'paddock', paddockId: entityId })
      } else if (entityType === 'section') {
        const section = sections.find(s => s.id === entityId)
        onEditRequest?.({
          entityType: 'section',
          sectionId: entityId,
          paddockId: section?.paddockId,
          geometry: section?.geometry,
        })
      } else if (entityType === 'noGrazeZone') {
        onEditRequest?.({ entityType: 'noGrazeZone', noGrazeZoneId: entityId })
      } else if (entityType === 'waterPolygon') {
        onEditRequest?.({ entityType: 'waterPolygon', waterSourceId: entityId })
      }
    }
  }, [onEditRequest, sections])

  const {
    draw,
    currentMode,
    selectedFeatureIds,
    selectedTypedId: _selectedTypedId,
    selectedEntityType: _selectedEntityType,
    selectedEntityId: _selectedEntityId,
    setMode,
    selectFeature: _selectFeature,
    deleteSelected,
    cancelDrawing,
    isDrawing,
  } = useMapDraw({
    map: isEditActive ? mapInstance : null,
    editable: isEditActive,
    onFeatureSelected: handleFeatureSelected,
    drawingEntityType: entityType,
    parentPaddockId,
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

  // Track user pan/zoom gestures to suppress auto-focus
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return

    const handleUserInteraction = () => {
      userHasInteractedRef.current = true
    }

    mapInstance.on('dragend', handleUserInteraction)
    mapInstance.on('zoomend', handleUserInteraction)

    return () => {
      mapInstance.off('dragend', handleUserInteraction)
      mapInstance.off('zoomend', handleUserInteraction)
    }
  }, [mapInstance, isMapLoaded])

  // Expose map methods via ref
  const fitPolygonBounds = useCallback((geometry: Feature<Polygon>, padding = 120) => {
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
        fitPolygonBounds(paddock.geometry, 120)
      }

      // If map is already loaded, focus immediately. Otherwise wait for it.
      if (mapInstance.loaded()) {
        doFocus()
      } else {
        mapInstance.once('load', doFocus)
      }
    },
    focusOnGeometry: (geometry: Feature<Polygon>, padding = 120, force = false) => {
      if (!mapInstance) return
      // Skip focus if user has manually interacted (unless force is true)
      if (userHasInteractedRef.current && !force) return

      const doFocus = () => {
        fitPolygonBounds(geometry, padding)
      }

      if (mapInstance.loaded()) {
        doFocus()
      } else {
        mapInstance.once('load', doFocus)
      }
    },
    focusOnFarmBoundary: () => {
      if (!mapInstance || !farmGeometry) return
      userHasInteractedRef.current = false  // Reset so focus works
      fitPolygonBounds(farmGeometry, 50)
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
      log('[FarmMap] createEntityAtScreenPoint called:', { type, screenX, screenY, hasMapInstance: !!mapInstance })
      if (!mapInstance) return null
      const rect = mapContainer.current?.getBoundingClientRect()
      if (!rect) {
        log('[FarmMap] No rect, returning null')
        return null
      }

      // Convert screen coordinates to map-relative coordinates
      const x = screenX - rect.left
      const y = screenY - rect.top

      // Check if coordinates are within map bounds
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        log('[FarmMap] Coordinates out of bounds:', { x, y, width: rect.width, height: rect.height })
        return null
      }

      const lngLat = mapInstance.unproject([x, y])
      log('[FarmMap] Unprojected lngLat:', { lng: lngLat.lng, lat: lngLat.lat })

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
        log('[FarmMap] Created water point:', { entityId, coordinates: pointFeature.geometry.coordinates })
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
      log('[FarmMap] Created entity:', { type, entityId, draft: draft.geometry.coordinates[0] })
      return entityId
    },
    resetUserInteraction: () => {
      userHasInteractedRef.current = false
    },
  }), [mapInstance, draw, setMode, deleteSelected, cancelDrawing, getPaddockById, fitPolygonBounds, createDraftSquare, addPaddock, addNoGrazeZone, addWaterSource, farmGeometry])

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
    log('[Section] Rendering initial section:', {
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
    if (!mapContainer.current || !initialMapCenter || mapRef.current) return

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
            maxzoom: 19,
            attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          },
        },
        layers: [
          {
            id: 'satellite-tiles',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: initialMapCenter,
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
  }, [farmId, initialMapCenter, hasValidBoundary, farmGeometry])

  // Add paddock and section layers once map is loaded
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      log('[Paddocks] Map not ready, skipping layer creation', { hasMapInstance: !!mapInstance, isMapLoaded })
      return
    }
    const map = mapInstance

    // Safety check - ensure map style is still valid
    try {
      if (!map.getStyle()) {
        log('[Paddocks] Map style not available, skipping')
        return
      }
    } catch {
      log('[Paddocks] Map is being destroyed, skipping')
      return
    }

    log('[Paddocks] Creating/updating paddock layers, count:', paddocks.length)

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
    log('[Paddocks] Source data:', paddocks.map((p) => ({
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
      log.warn('[Paddocks] DUPLICATE IDS DETECTED:', duplicates)
    }

    // Check for paddocks with same name (might indicate accidental duplicates)
    const names = paddocks.map(p => p.name)
    const dupNames = names.filter((name, i) => names.indexOf(name) !== i)
    if (dupNames.length > 0) {
      log('[Paddocks] Paddocks with same name:', dupNames)
    }

    // Add or update paddocks source
    try {
      if (map.getSource('paddocks')) {
        log('[Paddocks] Updating existing source')
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
          'fill-opacity': 0,
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
      log('[Paddocks] Map operation failed (likely unmounting):', err)
      return
    }

    const filterExistingLayers = (layerIds: string[]) =>
      layerIds.filter((layerId) => map.getLayer(layerId))

    const handlePaddockLayerClick = (e: MapEvent) => {
      log('[PaddockLayerClick] Handler called', { point: e.point, features: e.features?.length, entityType, isEditActive })

      // If in edit mode, check if click is on a vertex or midpoint
      // If so, let MapboxDraw handle the vertex drag - don't re-trigger selection
      if (isEditActive && draw) {
        const vertexLayers = [
          'gl-draw-polygon-and-line-vertex-active',
          'gl-draw-polygon-and-line-vertex-active.hot',
          'gl-draw-polygon-and-line-vertex-inactive',
          'gl-draw-polygon-and-line-vertex-inactive.cold',
          'gl-draw-polygon-midpoint',
          'gl-draw-polygon-midpoint.hot',
          'gl-draw-polygon-midpoint.cold',
        ]
        const existingVertexLayers = vertexLayers.filter(l => map.getLayer(l))
        if (existingVertexLayers.length > 0) {
          const vertexHits = map.queryRenderedFeatures(e.point, { layers: existingVertexLayers })
          if (vertexHits.length > 0) {
            log('[PaddockLayerClick] Click on vertex/midpoint, letting MapboxDraw handle it')
            return
          }
        }
      }

      // Check if a section was clicked first (sections are top layer)
      // Include both the initial section layer and the section state layers
      const sectionLayers = ['section-initial-fill', 'sections-current-fill', 'sections-yesterday-fill', 'sections-grazed-fill', 'sections-alternatives-fill']
      const existingLayers = sectionLayers.filter((l) => map.getLayer(l))
      log('[PaddockLayerClick] Section layers check', { sectionLayers, existingLayers })

      if (existingLayers.length > 0) {
        const sectionHits = map.queryRenderedFeatures(e.point, { layers: existingLayers })
        log('[PaddockLayerClick] Section hits', {
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
          log('[PaddockLayerClick] Section found', { sectionId, featurePaddockId, parentPaddockId, effectivePaddockId, geometryType: feature.geometry?.type })
          if (sectionId && feature.geometry?.type === 'Polygon') {
            // Skip if we're already editing this same section
            if (entityType === 'section' && isEditActive && initialSectionId === sectionId) {
              log('[PaddockLayerClick] Already editing this section, ignoring click')
              return
            }

            // In edit mode, select the section directly in draw control
            const typedId = createTypedFeatureId('section', sectionId)
            if (isEditActive && draw) {
              const existing = draw.get(typedId)
              if (existing) {
                log('[PaddockLayerClick] Selecting section in draw:', typedId)
                draw.changeMode('direct_select', { featureId: typedId })
              }
            }

            // Update last notified to prevent double notification from handleFeatureSelected
            lastNotifiedFeatureIdRef.current = typedId

            log('[PaddockLayerClick] Triggering section edit request')
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
            log('[PaddockLayerClick] Section check failed', { sectionId, geometryType: feature.geometry?.type })
          }
        }
      }

      // If already in section edit mode, don't fall through to paddock click
      // The section layer is hidden during edit, so clicks should not switch entities
      if (entityType === 'section' && isEditActive) {
        log('[PaddockLayerClick] Already in section edit mode, ignoring paddock click')
        return
      }

      // Check for no-graze zones (higher priority than paddocks - they render on top)
      if (map.getLayer('no-graze-fill')) {
        const noGrazeHits = map.queryRenderedFeatures(e.point, { layers: ['no-graze-fill'] })
        if (noGrazeHits.length > 0) {
          log('[PaddockLayerClick] No-graze zone at point, deferring to its handler')
          return // Let the no-graze zone handler deal with it
        }
      }

      // Check for water source polygons (higher priority than paddocks - they render on top)
      if (map.getLayer('water-source-fill')) {
        const waterHits = map.queryRenderedFeatures(e.point, { layers: ['water-source-fill'] })
        if (waterHits.length > 0) {
          log('[PaddockLayerClick] Water source at point, deferring to its handler')
          return // Let the water source handler deal with it
        }
      }

      // No section/no-graze/water found, handle as paddock click
      log('[PaddockLayerClick] No overlay found, handling as paddock click')
      if (e.features && e.features[0]) {
        const paddockId = e.features[0].properties?.id as string | undefined
        if (paddockId) {
          // Skip if we're already editing this same paddock
          if (entityType === 'paddock' && isEditActive && initialPaddockId === paddockId) {
            log('[PaddockLayerClick] Already editing this paddock, ignoring click')
            return
          }
          const paddock = getPaddockById(paddockId)
          if (paddock) {
            // In edit mode, select the paddock directly in draw control
            if (isEditActive && draw) {
              const typedId = createTypedFeatureId('paddock', paddockId)
              const existing = draw.get(typedId)
              if (existing) {
                log('[PaddockLayerClick] Selecting paddock in draw:', typedId)
                draw.changeMode('direct_select', { featureId: typedId })
              }
              // Update last notified to prevent double notification from handleFeatureSelected
              lastNotifiedFeatureIdRef.current = typedId
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
        'sections-yesterday-fill',
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
        'sections-yesterday-fill',
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
        // Sort by visual priority: current > yesterday > alternative > grazed
        const layerPriority: Record<string, number> = {
          'sections-current-fill': 4,
          'sections-yesterday-fill': 3,
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
          const geometry: Feature<Polygon> = {
            type: 'Feature',
            properties: feature.properties ?? {},
            geometry: feature.geometry as Polygon,
          }
          // Focus on double-click and reset interaction flag
          fitPolygonBounds(geometry, 120)
          userHasInteractedRef.current = false
          lastFocusedSectionIdRef.current = sectionId
          onEditRequest?.({
            entityType: 'section',
            sectionId,
            paddockId,
            geometry,
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
          // Focus on paddock on double-click
          const paddock = getPaddockById(paddockId)
          if (paddock) {
            fitPolygonBounds(paddock.geometry, 120)
            userHasInteractedRef.current = false
          }
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
        // Focus on new paddock on double-click
        fitPolygonBounds(draft, 120)
        userHasInteractedRef.current = false
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
      console.log('[FarmMap] handleNoGrazeZoneClick fired:', { hasFeatures: !!e.features, featureCount: e.features?.length })
      if (e.features && e.features[0]) {
        const zoneId = e.features[0].properties?.id as string | undefined
        const geometry = e.features[0].geometry
        console.log('[FarmMap] handleNoGrazeZoneClick:', { zoneId, isEditActive, geometryType: geometry?.type })
        if (zoneId) {
          // In edit mode, single click switches to editing this entity
          if (isEditActive && geometry?.type === 'Polygon') {
            console.log('[FarmMap] No-graze zone single-click (edit mode) - calling onEditRequest:', { zoneId })
            log('[FarmMap] No-graze zone single-click (edit mode):', { zoneId })
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
            console.log('[FarmMap] No-graze zone click (non-edit mode) - calling onNoGrazeZoneClick:', { zoneId })
            onNoGrazeZoneClick?.(zoneId)
          }
        }
      }
    }

    // No-graze zone double-click handler - enter edit mode when not already editing
    const handleNoGrazeZoneDblClick = (e: MapEvent) => {
      console.log('[FarmMap] handleNoGrazeZoneDblClick fired:', { isEditActive, hasFeatures: !!e.features })
      // In edit mode, single-click already handles switching - double-click does nothing extra
      if (isEditActive) return
      if (e.features && e.features[0]) {
        e.preventDefault()
        const zoneId = e.features[0].properties?.id as string | undefined
        const geom = e.features[0].geometry
        console.log('[FarmMap] No-graze zone double-click:', { zoneId, geometryType: geom?.type })
        log('[FarmMap] No-graze zone double-click:', { zoneId, geometryType: geom?.type })
        if (zoneId && geom?.type === 'Polygon') {
          const geometry: Feature<Polygon> = {
            type: 'Feature',
            properties: e.features[0].properties ?? {},
            geometry: geom as Polygon,
          }
          // Focus on double-click and reset interaction flag
          fitPolygonBounds(geometry, 120)
          userHasInteractedRef.current = false
          console.log('[FarmMap] No-graze zone double-click - calling onEditRequest:', { zoneId })
          onEditRequest?.({
            entityType: 'noGrazeZone',
            noGrazeZoneId: zoneId,
            geometry,
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
            log('[FarmMap] Water source single-click (edit mode):', { sourceId })
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
        const geom = e.features[0].geometry
        log('[FarmMap] Water source double-click:', { sourceId, geometryType: geom?.type })
        if (sourceId && geom?.type === 'Polygon') {
          const geometry: Feature<Polygon> = {
            type: 'Feature',
            properties: e.features[0].properties ?? {},
            geometry: geom as Polygon,
          }
          // Focus on double-click and reset interaction flag
          fitPolygonBounds(geometry, 120)
          userHasInteractedRef.current = false
          onEditRequest?.({
            entityType: 'waterPolygon',
            waterSourceId: sourceId,
            geometry,
          })
        }
      }
    }

    if (map.getLayer('no-graze-fill')) {
      log('[FarmMap] Binding click/dblclick to no-graze-fill layer')
      map.on('click', 'no-graze-fill', handleNoGrazeZoneClick)
      map.on('dblclick', 'no-graze-fill', handleNoGrazeZoneDblClick)
    } else {
      log('[FarmMap] no-graze-fill layer does not exist yet')
    }

    if (map.getLayer('water-source-fill')) {
      log('[FarmMap] Binding click/dblclick to water-source-fill layer')
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
  }, [mapInstance, isMapLoaded, paddocks, getPaddockById, handlePaddockClick, isEditActive, isDrawing, onEditRequest, createDraftSquare, entityType, currentMode, selectedFeatureIds, onNoGrazeZoneClick, onWaterSourceClick, noGrazeZones, waterSources, draw, initialSectionId, initialPaddockId])

  // Keep section sources synced and clipped to paddock bounds
  useEffect(() => {
    if (!isMapReady()) return
    const sectionState = sectionStateRef.current
    if (!sectionState) return

    log('[Sections] Updating section sources, paddocks:', paddocks.length)

    const nextPaddockGeometries: Record<string, Feature<Polygon>> = {}
    paddocks.forEach((paddock) => {
      nextPaddockGeometries[paddock.id] = paddock.geometry
    })

    const previousGeometries = paddockGeometryRef.current

    Object.entries(nextPaddockGeometries).forEach(([paddockId, geometry]) => {
      const previousGeometry = previousGeometries[paddockId]
      const translation = previousGeometry ? getTranslationDelta(previousGeometry, geometry) : null

      sectionState.current = updateSectionListForPaddock(sectionState.current, paddockId, geometry, translation)
      sectionState.yesterday = updateSectionListForPaddock(sectionState.yesterday, paddockId, geometry, translation)
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
    sectionState.yesterday = sectionState.yesterday.filter((item) => validPaddockIds.has(item.paddockId))
    sectionState.grazed = sectionState.grazed.filter((item) => validPaddockIds.has(item.paddockId))
    sectionState.alternatives = sectionState.alternatives.filter((item) => validPaddockIds.has(item.paddockId))

    paddockGeometryRef.current = nextPaddockGeometries

    if (mapInstance) {
      pushSectionData(mapInstance, sectionState)
    }
  }, [mapInstance, isMapLoaded, paddocks, updateSectionListForPaddock])

  // Categorize sections by date (today, yesterday, older)
  useEffect(() => {
    if (!mapInstance || !isMapLoaded || !sections) return

    // Use local date (not UTC) since section dates are in local time
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const yesterdayDate = new Date(now)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`

    const categorized: SectionRenderState = {
      current: [],
      yesterday: [],
      grazed: [],
      alternatives: [],
    }

    sections.forEach((section) => {
      const item: SectionRenderItem = {
        id: section.id,
        paddockId: section.paddockId,
        geometry: section.geometry,
        properties: { date: section.date, targetArea: section.targetArea },
      }

      if (section.date === today) {
        categorized.current.push(item)
      } else if (section.date === yesterday) {
        categorized.yesterday.push(item)
      } else {
        categorized.grazed.push(item)
      }
    })

    log('[Sections] Date categorization:', {
      today,
      yesterday,
      currentCount: categorized.current.length,
      yesterdayCount: categorized.yesterday.length,
      grazedCount: categorized.grazed.length,
    })

    sectionStateRef.current = categorized
    pushSectionData(mapInstance, categorized)
  }, [mapInstance, isMapLoaded, sections])

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
        .filter((id): id is string => id !== undefined && id !== null && id !== '')
      if (ids.length === 0) return null

      // Priority order matches visual z-index: sections > waterPolygon > noGrazeZone > paddock
      // Higher number = higher priority (selected first when overlapping)
      const priorityOrder: Record<string, number> = {
        section: 4,
        waterPolygon: 3,
        noGrazeZone: 2,
        paddock: 1,
      }

      // Sort by priority (highest first) and return the top one
      ids.sort((a, b) => {
        const parsedA = parseTypedFeatureId(a)
        const parsedB = parseTypedFeatureId(b)
        const priorityA = priorityOrder[parsedA?.entityType ?? ''] ?? 0
        const priorityB = priorityOrder[parsedB?.entityType ?? ''] ?? 0
        return priorityB - priorityA
      })

      return ids[0]
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
        // Use direct_select to immediately enable vertex editing
        draw.changeMode('direct_select', { featureId })
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

      // Check if clicking on a vertex or midpoint
      // If so, let MapboxDraw handle the vertex drag - don't deselect or switch modes
      const vertexLayers = [
        'gl-draw-polygon-and-line-vertex-active',
        'gl-draw-polygon-and-line-vertex-active.hot',
        'gl-draw-polygon-and-line-vertex-inactive',
        'gl-draw-polygon-and-line-vertex-inactive.cold',
        'gl-draw-polygon-midpoint',
        'gl-draw-polygon-midpoint.hot',
        'gl-draw-polygon-midpoint.cold',
      ]
      const existingVertexLayers = vertexLayers.filter(l => map.getLayer(l))
      if (existingVertexLayers.length > 0) {
        const vertexHits = map.queryRenderedFeatures(e.point, { layers: existingVertexLayers })
        if (vertexHits.length > 0) {
          return
        }
      }

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

      // With unified architecture, all geometries are loaded into draw with typed IDs
      // Check if clicking on no-graze zone or water source - select directly using typed ID
      const hasNoGrazeLayer = map.getLayer('no-graze-fill')
      const hasWaterLayer = map.getLayer('water-source-fill')

      log('[FarmMap] MouseDownCapture:', {
        hasNoGrazeLayer: !!hasNoGrazeLayer,
        hasWaterLayer: !!hasWaterLayer,
        point: { x: point.x, y: point.y }
      })

      if (hasNoGrazeLayer) {
        const noGrazeHits = map.queryRenderedFeatures(point, { layers: ['no-graze-fill'] })
        log('[FarmMap] No-graze query result', { hits: noGrazeHits.length })
        if (noGrazeHits.length > 0 && noGrazeHits[0]) {
          const feature = noGrazeHits[0]
          const zoneId = feature.properties?.id as string | undefined
          const geometry = feature.geometry
          if (zoneId && geometry?.type === 'Polygon') {
            const typedId = createTypedFeatureId('noGrazeZone', zoneId)
            log('[FarmMap] MouseDown on no-graze zone', { zoneId, typedId })
            event.stopImmediatePropagation()
            event.preventDefault()

            // Select directly using typed ID (all geometries are already loaded)
            const existing = draw.get(typedId)
            if (existing) {
              log('[FarmMap] Selecting no-graze zone directly:', typedId)
              draw.changeMode('direct_select', { featureId: typedId })
            }
            // Update last notified to prevent double notification from handleFeatureSelected
            lastNotifiedFeatureIdRef.current = typedId
            // Notify parent for drawer/panel
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
        log('[FarmMap] Water query result', { hits: waterHits.length })
        if (waterHits.length > 0 && waterHits[0]) {
          const feature = waterHits[0]
          const sourceId = feature.properties?.id as string | undefined
          const geometry = feature.geometry
          if (sourceId && geometry?.type === 'Polygon') {
            const typedId = createTypedFeatureId('waterPolygon', sourceId)
            log('[FarmMap] MouseDown on water source', { sourceId, typedId })
            event.stopImmediatePropagation()
            event.preventDefault()

            // Select directly using typed ID (all geometries are already loaded)
            const existing = draw.get(typedId)
            if (existing) {
              log('[FarmMap] Selecting water source directly:', typedId)
              draw.changeMode('direct_select', { featureId: typedId })
            }
            // Update last notified to prevent double notification from handleFeatureSelected
            lastNotifiedFeatureIdRef.current = typedId
            // Notify parent for drawer/panel
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
        // Use direct_select to immediately enable vertex editing
        draw.changeMode('direct_select', { featureId })
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

  // Track the last loaded features key to avoid unnecessary reloads
  const lastLoadedUnifiedKeyRef = useRef<string | null>(null)

  // UNIFIED: Load ALL editable geometries into draw when edit mode is activated
  // Z-index layering: paddocks first (bottom), then overlays, sections last (top)
  useEffect(() => {
    if (!draw || !isEditActive) {
      lastLoadedUnifiedKeyRef.current = null
      return
    }

    // Force reload if resetCounter changed (user clicked Reset)
    const forceReload = resetCounter !== lastResetCounterRef.current
    if (forceReload) {
      log('[UnifiedDraw] Reset detected, forcing reload. resetCounter:', resetCounter)
      lastResetCounterRef.current = resetCounter
      lastLoadedUnifiedKeyRef.current = null
    }

    // Build features array with typed IDs
    // Order matters for z-index: MapboxDraw renders later features on top
    const features: Feature<Polygon | GeoJSON.Point>[] = []

    // 1. Paddocks (bottom layer)
    paddocks.forEach((p) => {
      features.push({
        ...p.geometry,
        id: createTypedFeatureId('paddock', p.id),
        properties: {
          ...(p.geometry.properties ?? {}),
          entityType: 'paddock',
          entityId: p.id,
        },
      })
    })

    // 2. No-graze zones (middle layer)
    noGrazeZones.forEach((z) => {
      features.push({
        ...z.geometry,
        id: createTypedFeatureId('noGrazeZone', z.id),
        properties: {
          ...(z.geometry.properties ?? {}),
          entityType: 'noGrazeZone',
          entityId: z.id,
        },
      })
    })

    // 3. Water polygons (middle layer, after no-graze)
    waterSources.filter((s) => s.geometryType === 'polygon').forEach((w) => {
      features.push({
        ...(w.geometry as Feature<Polygon>),
        id: createTypedFeatureId('waterPolygon', w.id),
        properties: {
          ...(w.geometry.properties ?? {}),
          entityType: 'waterPolygon',
          entityId: w.id,
        },
      })
    })

    // 4. Sections (top layer - always clickable even when inside paddocks)
    // Load ALL sections so clicking between them doesn't trigger reload
    sections.forEach((s) => {
      features.push({
        ...s.geometry,
        id: createTypedFeatureId('section', s.id),
        properties: {
          ...(s.geometry.properties ?? {}),
          entityType: 'section',
          entityId: s.id,
          paddockId: s.paddockId,
        },
      })
    })

    // Generate a key for change detection
    const nextKey = features.map((f) => {
      const geom = f.geometry
      if (geom.type === 'Polygon') {
        const coords = geom.coordinates[0]
        const coordHash = coords.length + ':' + (coords[0]?.[0]?.toFixed(6) || '') + ',' + (coords[0]?.[1]?.toFixed(6) || '')
        return `${f.id}:${coordHash}`
      } else if (geom.type === 'Point') {
        return `${f.id}:${geom.coordinates[0]?.toFixed(6) || ''},${geom.coordinates[1]?.toFixed(6) || ''}`
      }
      return String(f.id)
    }).sort().join('|')

    // Check if reload is needed
    let drawFeatureCount = 0
    let hasSelection = false
    try {
      drawFeatureCount = draw.getAll()?.features?.length ?? 0
      hasSelection = draw.getSelectedIds().length > 0
    } catch {
      return
    }

    // Skip reload if there's an active selection - don't interrupt vertex editing
    // The features will be reloaded when the selection is cleared
    if (hasSelection && drawFeatureCount > 0 && !forceReload) {
      return
    }

    if (lastLoadedUnifiedKeyRef.current === nextKey && drawFeatureCount > 0 && !forceReload) {
      return
    }

    console.log('[FarmMap:UnifiedDraw] Loading all geometries into draw:', {
      paddocks: paddocks.length,
      noGrazeZones: noGrazeZones.length,
      noGrazeZoneIds: noGrazeZones.map(z => ({ id: z.id, name: z.name })),
      waterPolygons: waterSources.filter(s => s.geometryType === 'polygon').length,
      sections: sections.length,
      total: features.length,
    })
    log('[UnifiedDraw] Loading all geometries into draw:', {
      paddocks: paddocks.length,
      noGrazeZones: noGrazeZones.length,
      waterPolygons: waterSources.filter(s => s.geometryType === 'polygon').length,
      sections: sections.length,
      total: features.length,
    })

    lastLoadedUnifiedKeyRef.current = nextKey

    try {
      loadGeometriesToDraw(draw, features)
      console.log('[FarmMap:UnifiedDraw] Draw control loaded', { featureCount: draw.getAll().features.length })
      log('[UnifiedDraw] Draw control loaded', { featureCount: draw.getAll().features.length })

      // Select initial feature immediately after loading (ensures feature exists)
      let typedIdToSelect: string | null = null
      if (entityType === 'paddock' && initialPaddockId) {
        typedIdToSelect = createTypedFeatureId('paddock', initialPaddockId)
      } else if (entityType === 'section' && initialSectionId) {
        typedIdToSelect = createTypedFeatureId('section', initialSectionId)
      } else if (entityType === 'noGrazeZone' && initialNoGrazeZoneId) {
        typedIdToSelect = createTypedFeatureId('noGrazeZone', initialNoGrazeZoneId)
      } else if (entityType === 'waterPolygon' && initialWaterSourceId) {
        typedIdToSelect = createTypedFeatureId('waterPolygon', initialWaterSourceId)
      }

      if (typedIdToSelect) {
        const existing = draw.get(typedIdToSelect)
        console.log('[FarmMap:UnifiedDraw] Attempting to select feature:', { typedIdToSelect, exists: !!existing })
        if (existing) {
          log('[UnifiedDraw] Selecting initial feature:', typedIdToSelect)
          draw.changeMode('direct_select', { featureId: typedIdToSelect })
        } else {
          console.log('[FarmMap:UnifiedDraw] Feature not found for selection:', typedIdToSelect)
        }
      }
    } catch (err) {
      console.log('[FarmMap:UnifiedDraw] Draw reload failed:', err)
      log('[UnifiedDraw] Draw reload failed:', err)
    }
  }, [draw, isEditActive, paddocks, noGrazeZones, waterSources, sections, resetCounter, entityType, initialPaddockId, initialSectionId, initialNoGrazeZoneId, initialWaterSourceId])

  // Select initial feature when entering edit mode
  useEffect(() => {
    if (!draw || !isEditActive) return

    // Determine which feature to select based on entity type
    let typedIdToSelect: string | null = null

    if (entityType === 'paddock' && initialPaddockId) {
      typedIdToSelect = createTypedFeatureId('paddock', initialPaddockId)
    } else if (entityType === 'section' && initialSectionId) {
      typedIdToSelect = createTypedFeatureId('section', initialSectionId)
    } else if (entityType === 'noGrazeZone' && initialNoGrazeZoneId) {
      typedIdToSelect = createTypedFeatureId('noGrazeZone', initialNoGrazeZoneId)
    } else if (entityType === 'waterPolygon' && initialWaterSourceId) {
      typedIdToSelect = createTypedFeatureId('waterPolygon', initialWaterSourceId)
    }

    if (typedIdToSelect) {
      try {
        const existing = draw.get(typedIdToSelect)
        if (existing) {
          draw.changeMode('direct_select', { featureId: typedIdToSelect })
        }
      } catch (error) {
        log.debug('Mode change to direct_select failed', { error: String(error) })
      }
    } else {
      // No specific feature to select, go to simple_select
      try {
        draw.changeMode('simple_select')
      } catch (error) {
        log.debug('Mode change to simple_select failed', { error: String(error) })
      }
    }
  }, [draw, isEditActive, entityType, initialPaddockId, initialSectionId, initialNoGrazeZoneId, initialWaterSourceId])

  // Focus map on the section bounds when editing sections
  // Only focus when the section ID changes, not when geometry updates during vertex editing
  useEffect(() => {
    if (!isMapLoaded || !isEditActive || entityType !== 'section' || !initialSectionFeature || !initialSectionId) return
    // Skip if user has manually adjusted the map or we already focused on this section
    if (userHasInteractedRef.current) return
    if (lastFocusedSectionIdRef.current === initialSectionId) return
    lastFocusedSectionIdRef.current = initialSectionId
    fitPolygonBounds(initialSectionFeature, 120)
  }, [entityType, fitPolygonBounds, initialSectionFeature, initialSectionId, isEditActive, isMapLoaded])

  // Reset focus tracking when leaving section edit mode
  useEffect(() => {
    if (entityType !== 'section' || !isEditActive) {
      lastFocusedSectionIdRef.current = null
    }
  }, [entityType, isEditActive])

  // Hide selected feature from its MapLibre display layer to avoid duplication
  // MapboxDraw renders the selected feature with vertex handles
  useEffect(() => {
    if (!mapInstance || !isMapLoaded || !isEditActive) return

    const map = mapInstance
    try {
      if (!map.getStyle()) return
    } catch {
      return
    }

    // Get the first selected feature ID (typed format: "entityType:entityId")
    const selectedTypedId = selectedFeatureIds[0]
    if (!selectedTypedId) {
      // No selection - reset all filters
      try {
        if (map.getLayer('paddocks-fill')) {
          map.setFilter('paddocks-fill', null)
        }
        if (map.getLayer('paddocks-outline')) {
          map.setFilter('paddocks-outline', null)
        }
        if (map.getLayer('no-graze-fill')) {
          map.setFilter('no-graze-fill', null)
        }
        if (map.getLayer('no-graze-outline')) {
          map.setFilter('no-graze-outline', null)
        }
        if (map.getLayer('water-source-fill')) {
          map.setFilter('water-source-fill', null)
        }
        if (map.getLayer('water-source-outline')) {
          map.setFilter('water-source-outline', null)
        }
      } catch (error) {
        log.debug('Filter reset failed', { error: String(error) })
      }
      return
    }

    const parsed = parseTypedFeatureId(selectedTypedId)
    if (!parsed) return

    const { entityType: featureEntityType, entityId } = parsed
    log('[DisplayLayerFilter] Filtering selected feature:', { featureEntityType, entityId })

    try {
      // Hide the selected feature from its display layer
      if (featureEntityType === 'paddock') {
        if (map.getLayer('paddocks-fill')) {
          map.setFilter('paddocks-fill', ['!=', ['get', 'id'], entityId])
        }
        if (map.getLayer('paddocks-outline')) {
          map.setFilter('paddocks-outline', ['!=', ['get', 'id'], entityId])
        }
      } else if (featureEntityType === 'noGrazeZone') {
        if (map.getLayer('no-graze-fill')) {
          map.setFilter('no-graze-fill', ['!=', ['get', 'id'], entityId])
        }
        if (map.getLayer('no-graze-outline')) {
          map.setFilter('no-graze-outline', ['!=', ['get', 'id'], entityId])
        }
      } else if (featureEntityType === 'waterPolygon') {
        if (map.getLayer('water-source-fill')) {
          map.setFilter('water-source-fill', ['!=', ['get', 'id'], entityId])
        }
        if (map.getLayer('water-source-outline')) {
          map.setFilter('water-source-outline', ['!=', ['get', 'id'], entityId])
        }
      }
      // Sections use different source/layers, handled separately
    } catch (err) {
      log('[DisplayLayerFilter] Error setting filter:', err)
    }

    return () => {
      // Reset filters on cleanup
      try {
        if (map.getLayer('paddocks-fill')) {
          map.setFilter('paddocks-fill', null)
        }
        if (map.getLayer('paddocks-outline')) {
          map.setFilter('paddocks-outline', null)
        }
        if (map.getLayer('no-graze-fill')) {
          map.setFilter('no-graze-fill', null)
        }
        if (map.getLayer('no-graze-outline')) {
          map.setFilter('no-graze-outline', null)
        }
        if (map.getLayer('water-source-fill')) {
          map.setFilter('water-source-fill', null)
        }
        if (map.getLayer('water-source-outline')) {
          map.setFilter('water-source-outline', null)
        }
      } catch (error) {
        log.debug('Filter cleanup failed', { error: String(error) })
      }
    }
  }, [mapInstance, isMapLoaded, isEditActive, selectedFeatureIds])

  // Hide native paddock layers when editing paddocks (Draw will render them)
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      log('[Paddocks] Visibility effect: map not ready')
      return
    }
    const map = mapInstance

    // Safety check - ensure map style is available (may be destroyed during navigation)
    try {
      if (!map.getStyle()) {
        log('[Paddocks] Visibility effect: map style not available, skipping')
        return
      }
    } catch {
      log('[Paddocks] Visibility effect: map is being destroyed, skipping')
      return
    }

    const paddockLayers = ['paddocks-fill', 'paddocks-outline']
    // Always show native paddock layers - Draw's inactive polygons are transparent
    // so native layers show through with proper status colors
    const visibility = showPaddocks ? 'visible' : 'none'
    log('[Paddocks] Setting visibility:', { showPaddocks, visibility, isEditActive, hasDraw: !!draw })

    // Log all paddocks for debugging
    log('[Paddocks] Current paddocks:', paddocks.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
    })))

    try {
      paddockLayers.forEach(layerId => {
        const layerExists = !!map.getLayer(layerId)
        log('[Paddocks] Layer check', { layerId, exists: layerExists })
        if (layerExists) {
          map.setLayoutProperty(layerId, 'visibility', visibility)
        }
      })
    } catch (err) {
      log('[Paddocks] Visibility effect: error accessing map layers, likely destroyed', err)
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

  // Update selected section highlight
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return

    // Remove existing highlight layers
    const sources = ['sections-current', 'sections-yesterday', 'sections-grazed'] as const
    sources.forEach((sourceId) => {
      const layerId = `section-selected-highlight-${sourceId}`
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
    })

    // selectedSectionId is only passed when viewing (not editing) a section
    if (selectedSectionId) {
      // Add highlight layer to each source - the filter will only match in the right one
      sources.forEach((sourceId) => {
        if (map.getSource(sourceId)) {
          const layerId = `section-selected-highlight-${sourceId}`
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#ffffff',
              'line-width': 4,
            },
            filter: ['==', ['get', 'id'], selectedSectionId],
          })
        }
      })
    }
  }, [mapInstance, isMapLoaded, selectedSectionId])


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
    
    log('[Sections] Toggle visibility, showSections:', showSections)
    
    const sectionLayers = [
      'sections-grazed-fill',
      'sections-grazed-outline',
      'sections-yesterday-fill',
      'sections-yesterday-outline',
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
        log('[Sections] Set visibility', { layerId, visibility: showSections ? 'visible' : 'none' })
      } else {
        log.warn('[Sections] Layer not found', { layerId })
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

      {/* RGB Satellite imagery layer - renders below paddocks */}
      {rgbTile && showRGBSatellite && (
        <RasterTileLayer
          map={mapInstance}
          tileUrl={rgbTile.r2Url}
          bounds={rgbTile.bounds}
          visible={showRGBSatellite}
          opacity={1}
          layerId="rgb-satellite"
          beforeLayerId="paddocks-fill"
        />
      )}

      {/* NDVI Heatmap layer - satellite raster only, no fallback to per-paddock fills */}
      {ndviHeatmapTile && showNdviHeat && (
        <RasterTileLayer
          map={mapInstance}
          tileUrl={ndviHeatmapTile.r2Url}
          bounds={ndviHeatmapTile.bounds}
          visible={showNdviHeat}
          opacity={0.85}
          layerId="ndvi-heatmap-satellite"
          beforeLayerId="paddocks-fill"
        />
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

