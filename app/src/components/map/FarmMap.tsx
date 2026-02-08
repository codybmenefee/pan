import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import type { Pasture, PastureStatus } from '@/lib/types'
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
  onPastureClick?: (pasture: Pasture) => void
  onEditPastureSelect?: (pasture: Pasture | null) => void
  onEditRequest?: (request: {
    entityType: 'pasture' | 'paddock' | 'noGrazeZone' | 'waterPolygon'
    pastureId?: string
    paddockId?: string
    noGrazeZoneId?: string
    waterSourceId?: string
    geometry?: Feature<Polygon>
  }) => void
  onNoGrazeZoneClick?: (zoneId: string) => void
  onWaterSourceClick?: (sourceId: string) => void
  selectedPastureId?: string
  selectedPaddockId?: string
  showNdviHeat?: boolean
  showPastures?: boolean
  showLabels?: boolean
  showPaddocks?: boolean
  showRGBSatellite?: boolean
  editable?: boolean
  editMode?: boolean
  entityType?: 'pasture' | 'paddock' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'
  parentPastureId?: string
  initialPaddockFeature?: Feature<Polygon>
  initialPaddockId?: string
  initialPastureId?: string
  initialNoGrazeZoneId?: string
  initialWaterSourceId?: string
  showToolbar?: boolean
  toolbarPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  compactToolbar?: boolean
}

export type EntityDropType = 'pasture' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'

export interface FarmMapHandle {
  getMap: () => maplibregl.Map | null
  getDraw: () => MapboxDraw | null
  setDrawMode: (mode: DrawMode) => void
  deleteSelected: () => void
  cancelDrawing: () => void
  focusOnPasture: (pastureId: string) => void
  focusOnGeometry: (geometry: Feature<Polygon>, padding?: number, force?: boolean) => void
  focusOnFarmBoundary: () => void
  createPastureAtCenter: () => string | null
  createEntityAtScreenPoint: (type: EntityDropType, screenX: number, screenY: number) => string | null
  getMapContainerRect: () => DOMRect | null
  resetUserInteraction: () => void
}

interface PaddockRenderItem {
  id: string
  pastureId: string
  geometry: Feature<Polygon>
  properties: Record<string, unknown>
}

interface PaddockRenderState {
  current: PaddockRenderItem[]
  yesterday: PaddockRenderItem[]
  grazed: PaddockRenderItem[]
  alternatives: PaddockRenderItem[]
}

const statusColors: Record<PastureStatus, string> = {
  ready: '#22c55e',
  almost_ready: '#f59e0b',
  recovering: '#6b7280',
  grazed: '#ef4444',
}

function pushPaddockData(mapInstance: maplibregl.Map, paddockState: PaddockRenderState) {
  log('[Paddocks] pushPaddockData called')
  const updateSource = (sourceId: string, items: PaddockRenderItem[]) => {
    const source = mapInstance.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
    if (!source) {
      log.warn('[Paddocks] Source not found:', sourceId)
      return
    }

    const features = items.map((item) => {
      const coords = item.geometry.geometry.coordinates[0]
      log(`[Paddocks] ${sourceId} feature ${item.id}:`, {
        coordCount: coords.length,
        sampleCoord: coords[0],
        pastureId: item.pastureId,
      })

      return {
        ...item.geometry,
        properties: {
          ...(item.geometry.properties ?? {}),
          ...item.properties,
          id: item.id,
          pastureId: item.pastureId,
        },
      }
    })

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    }
    log(`[Paddocks] Updating ${sourceId}:`, { count: items.length })
    source.setData(geojson)
  }

  updateSource('paddocks-grazed', paddockState.grazed)
  updateSource('paddocks-yesterday', paddockState.yesterday)
  updateSource('paddocks-current', paddockState.current)
  updateSource('paddocks-alternatives', paddockState.alternatives)
}

function ensurePaddockLayers(mapInstance: maplibregl.Map) {
  log('[Paddocks] ensurePaddockLayers called')
  const emptyCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  if (!mapInstance.getSource('paddocks-grazed')) {
    log('[Paddocks] Adding source: paddocks-grazed')
    mapInstance.addSource('paddocks-grazed', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    log('[Paddocks] Source already exists: paddocks-grazed')
  }

  if (!mapInstance.getLayer('paddocks-grazed-fill')) {
    log('[Paddocks] Adding layer: paddocks-grazed-fill')
    mapInstance.addLayer({
      id: 'paddocks-grazed-fill',
      type: 'fill',
      source: 'paddocks-grazed',
      paint: {
        'fill-color': '#64748b',
        'fill-opacity': 0.18,
      },
    })
  }

  if (!mapInstance.getLayer('paddocks-grazed-outline')) {
    log('[Paddocks] Adding layer: paddocks-grazed-outline')
    mapInstance.addLayer({
      id: 'paddocks-grazed-outline',
      type: 'line',
      source: 'paddocks-grazed',
      paint: {
        'line-color': '#94a3b8',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    })
  }

  // Yesterday paddocks - yellow styling
  if (!mapInstance.getSource('paddocks-yesterday')) {
    log('[Paddocks] Adding source: paddocks-yesterday')
    mapInstance.addSource('paddocks-yesterday', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    log('[Paddocks] Source already exists: paddocks-yesterday')
  }

  if (!mapInstance.getLayer('paddocks-yesterday-fill')) {
    log('[Paddocks] Adding layer: paddocks-yesterday-fill')
    mapInstance.addLayer({
      id: 'paddocks-yesterday-fill',
      type: 'fill',
      source: 'paddocks-yesterday',
      paint: {
        'fill-color': '#c06a62', // terracotta-muted
        'fill-opacity': 0.35,
      },
    })
  }

  if (!mapInstance.getLayer('paddocks-yesterday-outline')) {
    log('[Paddocks] Adding layer: paddocks-yesterday-outline')
    mapInstance.addLayer({
      id: 'paddocks-yesterday-outline',
      type: 'line',
      source: 'paddocks-yesterday',
      paint: {
        'line-color': '#a83a32', // terracotta
        'line-width': 2,
      },
    })
  }

  if (!mapInstance.getSource('paddocks-current')) {
    log('[Paddocks] Adding source: paddocks-current')
    mapInstance.addSource('paddocks-current', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    log('[Paddocks] Source already exists: paddocks-current')
  }

  if (!mapInstance.getLayer('paddocks-current-fill')) {
    log('[Paddocks] Adding layer: paddocks-current-fill')
    mapInstance.addLayer({
      id: 'paddocks-current-fill',
      type: 'fill',
      source: 'paddocks-current',
      paint: {
        'fill-color': '#22c55e',
        'fill-opacity': 0.45,
      },
    })
  }

  if (!mapInstance.getLayer('paddocks-current-outline')) {
    log('[Paddocks] Adding layer: paddocks-current-outline')
    mapInstance.addLayer({
      id: 'paddocks-current-outline',
      type: 'line',
      source: 'paddocks-current',
      paint: {
        'line-color': '#22c55e',
        'line-width': 3,
      },
    })
  }

  if (!mapInstance.getSource('paddocks-alternatives')) {
    log('[Paddocks] Adding source: paddocks-alternatives')
    mapInstance.addSource('paddocks-alternatives', {
      type: 'geojson',
      data: emptyCollection,
    })
  } else {
    log('[Paddocks] Source already exists: paddocks-alternatives')
  }

  if (!mapInstance.getLayer('paddocks-alternatives-fill')) {
    log('[Paddocks] Adding layer: paddocks-alternatives-fill')
    mapInstance.addLayer({
      id: 'paddocks-alternatives-fill',
      type: 'fill',
      source: 'paddocks-alternatives',
      paint: {
        'fill-color': '#60a5fa',
        'fill-opacity': 0.25,
      },
    })
  }

  if (!mapInstance.getLayer('paddocks-alternatives-outline')) {
    log('[Paddocks] Adding layer: paddocks-alternatives-outline')
    mapInstance.addLayer({
      id: 'paddocks-alternatives-outline',
      type: 'line',
      source: 'paddocks-alternatives',
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
  onPastureClick,
  onEditPastureSelect,
  onEditRequest,
  onNoGrazeZoneClick,
  onWaterSourceClick,
  selectedPastureId: _selectedPastureId,
  selectedPaddockId,
  showNdviHeat = false,
  showPastures = true,
  showLabels = true,
  showPaddocks = true,
  showRGBSatellite = false,
  editable = false,
  editMode = false,
  entityType = 'pasture',
  parentPastureId,
  initialPaddockFeature,
  initialPaddockId,
  initialPastureId: _initialPastureId,
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
  const lastPaddockPickRef = useRef<{ time: number; point: maplibregl.Point; index: number; ids: string[] } | null>(null)
  const dragStateRef = useRef<{
    featureId: string
    startPoint: maplibregl.Point
    startLngLat: maplibregl.LngLat
    startGeometry: Feature<Polygon> | null
    dragging: boolean
    manual: boolean
    lastGeometry?: Feature<Polygon> | null
  } | null>(null)
  const lastSelectedPastureIdRef = useRef<string | null>(null)
  const paddockStateRef = useRef<PaddockRenderState>({ current: [], yesterday: [], grazed: [], alternatives: [] })
  const pastureGeometryRef = useRef<Record<string, Feature<Polygon>>>({})
  const lastResetCounterRef = useRef<number>(0)
  // Refs for initial bounds calculation (to avoid map recreation on every change)
  const initialPasturesRef = useRef<Pasture[] | null>(null)
  const initialFarmGeometryRef = useRef<Feature<Polygon> | null>(null)
  const initialMapCenterRef = useRef<[number, number] | null>(null)
  // Track if user has manually adjusted the map (pan/zoom) to suppress auto-focus
  const userHasInteractedRef = useRef(false)
  // Track the last paddock ID we focused on to avoid re-focusing during vertex edits
  const lastFocusedPaddockIdRef = useRef<string | null>(null)

  const { pastures, paddocks, getPastureById, noGrazeZones, waterSources, addPasture, addNoGrazeZone, addWaterSource, resetCounter } = useGeometry()
  const { activeFarm: farm, isLoading: isFarmLoading } = useFarmContext()
  const farmId = farm?.id ?? null
  const farmLng = farm?.coordinates?.[0] ?? null
  const farmLat = farm?.coordinates?.[1] ?? null
  const farmGeometry = farm?.geometry ?? null

  // Capture initial pastures and farmGeometry for bounds calculation (only once)
  if (initialPasturesRef.current === null && pastures.length > 0) {
    initialPasturesRef.current = pastures
  }
  if (initialFarmGeometryRef.current === null && farmGeometry) {
    initialFarmGeometryRef.current = farmGeometry
  }

  // Compute initial map center - prefer pasture bounds (more reliable than farm geometry which may be out of sync)
  // Use ref to cache value and prevent map recreation on every pasture change
  const initialMapCenter = useMemo<[number, number] | null>(() => {
    // Return cached value if already computed
    if (initialMapCenterRef.current !== null) {
      return initialMapCenterRef.current
    }

    let center: [number, number] | null = null

    // First try to use the pasture bounds center (most reliable)
    if (pastures.length > 0) {
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
      pastures.forEach(pasture => {
        const coords = pasture.geometry?.geometry?.coordinates?.[0]
        if (coords) {
          coords.forEach(([lng, lat]) => {
            minLng = Math.min(minLng, lng)
            maxLng = Math.max(maxLng, lng)
            minLat = Math.min(minLat, lat)
            maxLat = Math.max(maxLat, lat)
          })
        }
      })
      if (minLng !== Infinity) {
        center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
      }
    }

    // Fall back to farm boundary center
    if (!center && farmGeometry) {
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
          center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
        }
      }
    }

    // Fall back to address coordinates
    if (!center && farmLng !== null && farmLat !== null) {
      center = [farmLng, farmLat]
    }

    // Cache the computed center
    if (center !== null) {
      initialMapCenterRef.current = center
    }

    return center
  }, [pastures, farmGeometry, farmLng, farmLat])

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
  // This handles cases where MapboxDraw selection changes (e.g., clicking between paddocks)
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
      if (entityType === 'pasture') {
        onEditRequest?.({ entityType: 'pasture', pastureId: entityId })
      } else if (entityType === 'paddock') {
        const paddock = paddocks.find(s => s.id === entityId)
        onEditRequest?.({
          entityType: 'paddock',
          paddockId: entityId,
          pastureId: paddock?.pastureId,
          geometry: paddock?.geometry,
        })
      } else if (entityType === 'noGrazeZone') {
        onEditRequest?.({ entityType: 'noGrazeZone', noGrazeZoneId: entityId })
      } else if (entityType === 'waterPolygon') {
        onEditRequest?.({ entityType: 'waterPolygon', waterSourceId: entityId })
      }
    }
  }, [onEditRequest, paddocks])

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
    parentPastureId,
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
    focusOnPasture: (pastureId: string) => {
      if (!mapInstance) return
      const pasture = getPastureById(pastureId)
      if (!pasture) return

      const doFocus = () => {
        fitPolygonBounds(pasture.geometry, 120)
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
      if (!mapInstance) return
      userHasInteractedRef.current = false  // Reset so focus works

      // If we have pastures, compute their bounding box and use that
      // This handles cases where farm boundary geometry is out of sync with pasture locations
      if (pastures.length > 0) {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
        pastures.forEach(pasture => {
          const coords = pasture.geometry?.geometry?.coordinates?.[0]
          if (coords) {
            coords.forEach(([lng, lat]) => {
              minLng = Math.min(minLng, lng)
              maxLng = Math.max(maxLng, lng)
              minLat = Math.min(minLat, lat)
              maxLat = Math.max(maxLat, lat)
            })
          }
        })

        if (minLng !== Infinity) {
          // Add some padding around the pasture bounds
          const padding = 0.002 // ~200m
          const pastureBoundsGeometry: Feature<Polygon> = {
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
              ]]
            }
          }
          fitPolygonBounds(pastureBoundsGeometry, 50)
          return
        }
      }

      // Fall back to farm boundary if no pastures
      if (farmGeometry) {
        fitPolygonBounds(farmGeometry, 50)
      }
    },
    createPastureAtCenter: () => {
      if (!mapInstance) return null
      const center = mapInstance.getCenter()
      const draft = createDraftSquare(center, 100) // 100px square
      if (!draft) return null
      const pastureId = addPasture(draft)
      return pastureId
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
        pasture: 100,
        noGrazeZone: 100,
        waterPolygon: 100,
      }
      const sizePx = sizes[type as Exclude<EntityDropType, 'waterPoint'>]
      const draft = createDraftSquare(lngLat, sizePx)
      if (!draft) return null

      let entityId: string | null = null
      switch (type) {
        case 'pasture':
          entityId = addPasture(draft)
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
  }), [mapInstance, draw, setMode, deleteSelected, cancelDrawing, getPastureById, fitPolygonBounds, createDraftSquare, addPasture, addNoGrazeZone, addWaterSource, farmGeometry, pastures])

  // Handle pasture click wrapper
  const handlePastureClick = useCallback((pasture: Pasture) => {
    // Don't trigger click handler when in edit mode
    if (isEditActive) return
    onPastureClick?.(pasture)
  }, [isEditActive, onPastureClick])

  useEffect(() => {
    if (!isEditActive || entityType !== 'pasture') {
      if (lastSelectedPastureIdRef.current !== null) {
        lastSelectedPastureIdRef.current = null
        onEditPastureSelect?.(null)
      }
      return
    }

    const nextSelectedId = selectedFeatureIds[0] ?? null
    if (nextSelectedId === lastSelectedPastureIdRef.current) return

    lastSelectedPastureIdRef.current = nextSelectedId
    const pasture = nextSelectedId ? getPastureById(nextSelectedId) ?? null : null
    onEditPastureSelect?.(pasture)
  }, [isEditActive, entityType, selectedFeatureIds, getPastureById, onEditPastureSelect])

  const updatePaddockListForPasture = useCallback(
    (
      list: PaddockRenderItem[],
      pastureId: string,
      boundary: Feature<Polygon>,
      translation?: { deltaLng: number; deltaLat: number } | null
    ) => {
      return list.flatMap((item) => {
        if (item.pastureId !== pastureId) {
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

  // Render initial paddock - keep visible even during paddock editing so it shows when draw control deselects
  useEffect(() => {
    if (!mapInstance || !isMapReady()) return

    const sourceId = 'paddock-initial'
    const fillLayerId = `${sourceId}-fill`
    const outlineLayerId = `${sourceId}-outline`

    // Hide paddock layers only when no paddock or paddocks toggled off
    // Note: We keep the layer visible during paddock editing as a "backing" layer
    // so the paddock remains visible even when the draw control deselects it
    if (!initialPaddockFeature || !showPaddocks) {
      if (mapInstance.getLayer(fillLayerId)) {
        mapInstance.setLayoutProperty(fillLayerId, 'visibility', 'none')
      }
      if (mapInstance.getLayer(outlineLayerId)) {
        mapInstance.setLayoutProperty(outlineLayerId, 'visibility', 'none')
      }
      return
    }

    const paddockGeoJson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        ...initialPaddockFeature,
        properties: {
          ...(initialPaddockFeature.properties || {}),
          id: initialPaddockId || 'initial-paddock',
          pastureId: parentPastureId,
        },
      }],
    }
    log('[Paddock] Rendering initial paddock:', {
      id: initialPaddockId,
      pastureId: parentPastureId,
      coordCount: initialPaddockFeature.geometry.coordinates[0]?.length,
      firstCoord: initialPaddockFeature.geometry.coordinates[0]?.[0],
    })

    if (!mapInstance.getSource(sourceId)) {
      mapInstance.addSource(sourceId, {
        type: 'geojson',
        data: paddockGeoJson,
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
      (mapInstance.getSource(sourceId) as maplibregl.GeoJSONSource).setData(paddockGeoJson)
      // Ensure layers are visible
      if (mapInstance.getLayer(fillLayerId)) {
        mapInstance.setLayoutProperty(fillLayerId, 'visibility', 'visible')
      }
      if (mapInstance.getLayer(outlineLayerId)) {
        mapInstance.setLayoutProperty(outlineLayerId, 'visibility', 'visible')
      }
    }
  }, [isMapReady, mapInstance, initialPaddockFeature, initialPaddockId, showPaddocks, parentPastureId])

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

      // Fit to pasture bounds first (more reliable than farm geometry which may be out of sync)
      // Use refs to avoid recreating map on every pasture change
      const initialPastures = initialPasturesRef.current
      if (initialPastures && initialPastures.length > 0) {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
        initialPastures.forEach(pasture => {
          const coords = pasture.geometry?.geometry?.coordinates?.[0]
          if (coords) {
            coords.forEach(([lng, lat]) => {
              minLng = Math.min(minLng, lng)
              maxLng = Math.max(maxLng, lng)
              minLat = Math.min(minLat, lat)
              maxLat = Math.max(maxLat, lat)
            })
          }
        })

        if (minLng !== Infinity) {
          const padding = 0.002 // ~200m padding around pastures
          const bounds = new maplibregl.LngLatBounds(
            [minLng - padding, minLat - padding],
            [maxLng + padding, maxLat + padding]
          )
          map.fitBounds(bounds, { padding: 50, duration: 0 })
          return
        }
      }

      // Fall back to farm boundary if no pastures
      const initialFarmGeometry = initialFarmGeometryRef.current
      if (hasValidBoundary() && initialFarmGeometry) {
        const coords = initialFarmGeometry.geometry.coordinates[0]
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
    // Note: pastures/farmGeometry are accessed via refs to avoid map recreation on every change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, initialMapCenter, hasValidBoundary])

  // Add pasture and paddock layers once map is loaded
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      log('[Pastures] Map not ready, skipping layer creation', { hasMapInstance: !!mapInstance, isMapLoaded })
      return
    }
    const map = mapInstance

    // Safety check - ensure map style is still valid
    try {
      if (!map.getStyle()) {
        log('[Pastures] Map style not available, skipping')
        return
      }
    } catch {
      log('[Pastures] Map is being destroyed, skipping')
      return
    }

    log('[Pastures] Creating/updating pasture layers, count:', pastures.length)

    // Create GeoJSON feature collection for pastures
    const pasturesGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: pastures.map((p) => ({
        ...p.geometry,
        properties: {
          id: p.id,
          name: p.name,
          status: p.status,
          ndvi: p.ndvi,
        },
      })),
    }

    // Log detailed pasture info for debugging
    log('[Pastures] Source data:', pastures.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      coordCount: p.geometry.geometry.coordinates[0]?.length,
      firstCoord: p.geometry.geometry.coordinates[0]?.[0],
    })))

    // Check for duplicate IDs
    const ids = pastures.map(p => p.id)
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    if (duplicates.length > 0) {
      log.warn('[Pastures] DUPLICATE IDS DETECTED:', duplicates)
    }

    // Check for pastures with same name (might indicate accidental duplicates)
    const names = pastures.map(p => p.name)
    const dupNames = names.filter((name, i) => names.indexOf(name) !== i)
    if (dupNames.length > 0) {
      log('[Pastures] Pastures with same name:', dupNames)
    }

    // Add or update pastures source
    try {
      if (map.getSource('pastures')) {
        log('[Pastures] Updating existing source')
        ;(map.getSource('pastures') as maplibregl.GeoJSONSource).setData(pasturesGeojson)
      } else {
        map.addSource('pastures', {
          type: 'geojson',
          data: pasturesGeojson,
        })

      // Add fill layer
      map.addLayer({
        id: 'pastures-fill',
        type: 'fill',
        source: 'pastures',
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
        id: 'pastures-outline',
        type: 'line',
        source: 'pastures',
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
        id: 'pastures-labels',
        type: 'symbol',
        source: 'pastures',
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

      // Add paddock (daily strip) source and layers
      ensurePaddockLayers(map)

      // Push paddock data to sources after layers are created
      pushPaddockData(map, paddockStateRef.current)

      // Add no-graze zone and water source layers
      ensureNoGrazeZoneLayers(map)
      ensureWaterSourceLayers(map)
    }
    } catch (err) {
      // Map may have been destroyed during component unmount - ignore
      log('[Pastures] Map operation failed (likely unmounting):', err)
      return
    }

    const filterExistingLayers = (layerIds: string[]) =>
      layerIds.filter((layerId) => map.getLayer(layerId))

    const handlePastureLayerClick = (e: MapEvent) => {
      log('[PastureLayerClick] Handler called', { point: e.point, features: e.features?.length, entityType, isEditActive })

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
            log('[PastureLayerClick] Click on vertex/midpoint, letting MapboxDraw handle it')
            return
          }
        }
      }

      // Check if a paddock was clicked first (paddocks are top layer)
      // Include both the initial paddock layer and the paddock state layers
      const paddockLayers = ['paddock-initial-fill', 'paddocks-current-fill', 'paddocks-yesterday-fill', 'paddocks-grazed-fill', 'paddocks-alternatives-fill']
      const existingLayers = paddockLayers.filter((l) => map.getLayer(l))
      log('[PastureLayerClick] Paddock layers check', { paddockLayers, existingLayers })

      if (existingLayers.length > 0) {
        const paddockHits = map.queryRenderedFeatures(e.point, { layers: existingLayers })
        log('[PastureLayerClick] Paddock hits', {
          hitCount: paddockHits.length,
          hits: paddockHits.map(f => ({
            id: f.properties?.id,
            pastureId: f.properties?.paddockId,
            layer: f.layer?.id,
            geometryType: f.geometry?.type,
            properties: f.properties
          }))
        })
        if (paddockHits.length > 0) {
          const feature = paddockHits[0]
          const paddockId = feature.properties?.id as string | undefined
          // Use parentPastureId as fallback if paddockId not in feature properties
          const featurePastureId = feature.properties?.paddockId as string | undefined
          const effectivePastureId = featurePastureId || parentPastureId
          log('[PastureLayerClick] Paddock found', { paddockId, featurePastureId, parentPastureId: parentPastureId, effectivePastureId, geometryType: feature.geometry?.type })
          if (paddockId && feature.geometry?.type === 'Polygon') {
            // Skip if we're already editing this same paddock
            if (entityType === 'paddock' && isEditActive && initialPaddockId === paddockId) {
              log('[PastureLayerClick] Already editing this paddock, ignoring click')
              return
            }

            // In edit mode, select the paddock directly in draw control
            const typedId = createTypedFeatureId('paddock', paddockId)
            if (isEditActive && draw) {
              const existing = draw.get(typedId)
              if (existing) {
                log('[PastureLayerClick] Selecting paddock in draw:', typedId)
                draw.changeMode('direct_select', { featureId: typedId })
              }
            }

            // Update last notified to prevent double notification from handleFeatureSelected
            lastNotifiedFeatureIdRef.current = typedId

            log('[PastureLayerClick] Triggering paddock edit request')
            onEditRequest?.({
              entityType: 'paddock',
              paddockId,
              pastureId: effectivePastureId,
              geometry: {
                type: 'Feature',
                properties: feature.properties ?? {},
                geometry: feature.geometry as GeoJSON.Polygon,
              },
            })
            return // Don't process as paddock click
          } else {
            log('[PastureLayerClick] Paddock check failed', { paddockId, geometryType: feature.geometry?.type })
          }
        }
      }

      // If already in paddock edit mode, don't fall through to pasture click
      // The paddock layer is hidden during edit, so clicks should not switch entities
      if (entityType === 'paddock' && isEditActive) {
        log('[PastureLayerClick] Already in paddock edit mode, ignoring pasture click')
        return
      }

      // Check for no-graze zones (higher priority than paddocks - they render on top)
      if (map.getLayer('no-graze-fill')) {
        const noGrazeHits = map.queryRenderedFeatures(e.point, { layers: ['no-graze-fill'] })
        if (noGrazeHits.length > 0) {
          log('[PastureLayerClick] No-graze zone at point, deferring to its handler')
          return // Let the no-graze zone handler deal with it
        }
      }

      // Check for water source polygons (higher priority than paddocks - they render on top)
      if (map.getLayer('water-source-fill')) {
        const waterHits = map.queryRenderedFeatures(e.point, { layers: ['water-source-fill'] })
        if (waterHits.length > 0) {
          log('[PastureLayerClick] Water source at point, deferring to its handler')
          return // Let the water source handler deal with it
        }
      }

      // No paddock/no-graze/water found, handle as pasture click
      log('[PastureLayerClick] No overlay found, handling as pasture click')
      if (e.features && e.features[0]) {
        const pastureId = e.features[0].properties?.id as string | undefined
        if (pastureId) {
          // Skip if we're already editing this same pasture
          if (entityType === 'pasture' && isEditActive && initialPaddockId === pastureId) {
            log('[PastureLayerClick] Already editing this pasture, ignoring click')
            return
          }
          const pasture = getPastureById(pastureId)
          if (pasture) {
            // In edit mode, select the pasture directly in draw control
            if (isEditActive && draw) {
              const typedId = createTypedFeatureId('pasture', pastureId)
              const existing = draw.get(typedId)
              if (existing) {
                log('[PastureLayerClick] Selecting pasture in draw:', typedId)
                draw.changeMode('direct_select', { featureId: typedId })
              }
              // Update last notified to prevent double notification from handleFeatureSelected
              lastNotifiedFeatureIdRef.current = typedId
              onEditRequest?.({ entityType: 'pasture', pastureId })
            } else {
              handlePastureClick(pasture)
            }
          }
        }
      }
    }

    const handleMapClickLog = (e: MapEvent) => {
      if (!isEditActive || entityType !== 'paddock') return
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

      const paddockHitLayers = filterExistingLayers([
        'paddocks-current-fill',
        'paddocks-yesterday-fill',
        'paddocks-grazed-fill',
        'paddocks-alternatives-fill',
      ])
      const paddockHits = paddockHitLayers.length
        ? map.queryRenderedFeatures(e.point, { layers: paddockHitLayers })
        : []
      if (!isDoubleCandidate && drawHits.length === 0 && paddockHits[0]) {
        const feature = paddockHits[0]
        const paddockId = feature.properties?.id
        const pastureId = feature.properties?.paddockId
        if (paddockId && feature.geometry?.type === 'Polygon') {
          onEditRequest?.({
            entityType: 'paddock',
            paddockId,
            pastureId,
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
      const isPaddockEditDoubleClick = isEditActive && entityType === 'paddock'
      if (isEditActive && !isPaddockEditDoubleClick) return
      if (isDrawing) return
      e.preventDefault()

      const paddockFeatureLayers = filterExistingLayers([
        'paddocks-current-fill',
        'paddocks-yesterday-fill',
        'paddocks-grazed-fill',
        'paddocks-alternatives-fill',
      ])
      const paddockFeatures = paddockFeatureLayers.length
        ? map.queryRenderedFeatures(e.point, { layers: paddockFeatureLayers })
        : []
      const drawHitLayers = [
        'gl-draw-polygon-fill-active',
        'gl-draw-polygon-fill-inactive',
        'gl-draw-polygon-fill-active.hot',
        'gl-draw-polygon-fill-inactive.cold',
      ]

      if (isPaddockEditDoubleClick) {
        if (paddockFeatures[0]) {
          return
        }

        const availableDrawLayers = filterExistingLayers(drawHitLayers)
        const drawFeatures = availableDrawLayers.length
          ? map.queryRenderedFeatures(e.point, { layers: availableDrawLayers })
          : []
        if (drawFeatures.length > 0) {
          return
        }

        const pastureFeatures = map.queryRenderedFeatures(e.point, {
          layers: ['pastures-fill'],
        })
        if (pastureFeatures.length > 0) {
          const paddockId = pastureFeatures[0]?.properties?.id
          if (paddockId) {
            onEditRequest?.({ entityType: 'paddock', paddockId })
          }
        }
        return
      }

      if (paddockFeatures[0]) {
        const now = Date.now()
        const ids = paddockFeatures.map((f) => String(f.properties?.id ?? ''))
        const last = lastPaddockPickRef.current
        const dt = last ? now - last.time : null
        const dx = last ? e.point.x - last.point.x : null
        const dy = last ? e.point.y - last.point.y : null
        const dist = last && dx !== null && dy !== null ? Math.hypot(dx, dy) : null
        const sameIds = last && last.ids.length === ids.length && last.ids.every((id, index) => id === ids[index])
        const shouldCycle = !!last && !!sameIds && dt !== null && dt < 2000 && dist !== null && dist < 12
        const nextIndex = shouldCycle ? (last.index + 1) % paddockFeatures.length : 0
        lastPaddockPickRef.current = { time: now, point: e.point, index: nextIndex, ids }
        // Sort by visual priority: current > yesterday > alternative > grazed
        const layerPriority: Record<string, number> = {
          'paddocks-current-fill': 4,
          'paddocks-yesterday-fill': 3,
          'paddocks-alternatives-fill': 2,
          'paddocks-grazed-fill': 1,
        }
        const sortedFeatures = [...paddockFeatures].sort((a, b) => {
          const aPriority = layerPriority[a.layer?.id ?? ''] ?? 0
          const bPriority = layerPriority[b.layer?.id ?? ''] ?? 0
          return bPriority - aPriority
        })
        const feature = sortedFeatures[nextIndex % sortedFeatures.length]
        const paddockId = feature.properties?.id
        const pastureId = feature.properties?.paddockId
        if (paddockId && feature.geometry?.type === 'Polygon') {
          const geometry: Feature<Polygon> = {
            type: 'Feature',
            properties: feature.properties ?? {},
            geometry: feature.geometry as Polygon,
          }
          // Focus on double-click and reset interaction flag
          fitPolygonBounds(geometry, 120)
          userHasInteractedRef.current = false
          lastFocusedPaddockIdRef.current = paddockId
          onEditRequest?.({
            entityType: 'paddock',
            paddockId,
            pastureId,
            geometry,
          })
        }
        return
      }

      const pastureFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['pastures-fill'],
      })

      if (pastureFeatures.length > 0) {
        const pastureId = pastureFeatures[0]?.properties?.id
        if (pastureId) {
          // Focus on pasture on double-click
          const pasture = getPastureById(pastureId)
          if (pasture) {
            fitPolygonBounds(pasture.geometry, 120)
            userHasInteractedRef.current = false
          }
          onEditRequest?.({ entityType: 'pasture', pastureId })
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

    if (map.getLayer('pastures-fill')) {
      map.on('click', 'pastures-fill', handlePastureLayerClick)
      map.on('mouseenter', 'pastures-fill', handlePaddocksMouseEnter)
      map.on('mouseleave', 'pastures-fill', handlePaddocksMouseLeave)
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

    // Double click behavior: select paddock or create new pasture
    map.on('dblclick', handleMapDoubleClick)
    map.on('click', handleMapClickLog)

    return () => {
      map.off('dblclick', handleMapDoubleClick)
      map.off('click', handleMapClickLog)
      map.off('click', 'pastures-fill', handlePastureLayerClick)
      map.off('mouseenter', 'pastures-fill', handlePaddocksMouseEnter)
      map.off('mouseleave', 'pastures-fill', handlePaddocksMouseLeave)
      map.off('click', 'no-graze-fill', handleNoGrazeZoneClick)
      map.off('dblclick', 'no-graze-fill', handleNoGrazeZoneDblClick)
      map.off('click', 'water-source-fill', handleWaterSourceClick)
      map.off('dblclick', 'water-source-fill', handleWaterSourceDblClick)
      map.off('click', 'water-source-markers', handleWaterSourceClick)
    }
  }, [mapInstance, isMapLoaded, paddocks, getPastureById, handlePastureClick, isEditActive, isDrawing, onEditRequest, createDraftSquare, entityType, currentMode, selectedFeatureIds, onNoGrazeZoneClick, onWaterSourceClick, noGrazeZones, waterSources, draw, initialPaddockId, initialPaddockId])

  // Keep paddock sources synced and clipped to pasture bounds
  useEffect(() => {
    if (!isMapReady()) return
    const paddockState = paddockStateRef.current
    if (!paddockState) return

    log('[Paddocks] Updating paddock sources, pastures:', pastures.length)

    const nextPastureGeometries: Record<string, Feature<Polygon>> = {}
    pastures.forEach((pasture) => {
      nextPastureGeometries[pasture.id] = pasture.geometry
    })

    const previousGeometries = pastureGeometryRef.current

    Object.entries(nextPastureGeometries).forEach(([pastureId, geometry]) => {
      const previousGeometry = previousGeometries[pastureId]
      const translation = previousGeometry ? getTranslationDelta(previousGeometry, geometry) : null

      paddockState.current = updatePaddockListForPasture(paddockState.current, pastureId, geometry, translation)
      paddockState.yesterday = updatePaddockListForPasture(paddockState.yesterday, pastureId, geometry, translation)
      paddockState.grazed = updatePaddockListForPasture(paddockState.grazed, pastureId, geometry, translation)
      paddockState.alternatives = updatePaddockListForPasture(
        paddockState.alternatives,
        pastureId,
        geometry,
        translation
      )
    })

    const validPastureIds = new Set(Object.keys(nextPastureGeometries))
    paddockState.current = paddockState.current.filter((item) => validPastureIds.has(item.pastureId))
    paddockState.yesterday = paddockState.yesterday.filter((item) => validPastureIds.has(item.pastureId))
    paddockState.grazed = paddockState.grazed.filter((item) => validPastureIds.has(item.pastureId))
    paddockState.alternatives = paddockState.alternatives.filter((item) => validPastureIds.has(item.pastureId))

    pastureGeometryRef.current = nextPastureGeometries

    if (mapInstance) {
      try {
        pushPaddockData(mapInstance, paddockState)
      } catch (err) {
        log('[Paddocks] Map operation failed (likely unmounting):', err)
      }
    }
  }, [mapInstance, isMapLoaded, pastures, updatePaddockListForPasture])

  // Categorize paddocks by date (today, yesterday, older)
  useEffect(() => {
    if (!mapInstance || !isMapLoaded || !paddocks) return

    // Safety check - ensure map style is still valid
    try {
      if (!mapInstance.getStyle()) {
        log('[Paddocks] Map style not available, skipping')
        return
      }
    } catch {
      log('[Paddocks] Map is being destroyed, skipping')
      return
    }

    // Use local date (not UTC) since paddock dates are in local time
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const yesterdayDate = new Date(now)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`

    const categorized: PaddockRenderState = {
      current: [],
      yesterday: [],
      grazed: [],
      alternatives: [],
    }

    paddocks.forEach((paddock) => {
      // Skip the paddock being edited/displayed via initialPaddockFeature to avoid duplicate rendering
      // The initialPaddockFeature is rendered separately via the 'paddock-initial' layer
      if (initialPaddockId && paddock.id === initialPaddockId) {
        return
      }

      const item: PaddockRenderItem = {
        id: paddock.id,
        pastureId: paddock.pastureId,
        geometry: paddock.geometry,
        properties: { date: paddock.date, targetArea: paddock.targetArea },
      }

      if (paddock.date === today) {
        categorized.current.push(item)
      } else if (paddock.date === yesterday) {
        categorized.yesterday.push(item)
      } else {
        categorized.grazed.push(item)
      }
    })

    log('[Paddocks] Date categorization:', {
      today,
      yesterday,
      currentCount: categorized.current.length,
      yesterdayCount: categorized.yesterday.length,
      grazedCount: categorized.grazed.length,
      excludedPaddockId: initialPaddockId,
    })

    paddockStateRef.current = categorized
    try {
      pushPaddockData(mapInstance, categorized)
    } catch (err) {
      log('[Paddocks] Map operation failed (likely unmounting):', err)
    }
  }, [mapInstance, isMapLoaded, paddocks, initialPaddockId])

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
      }, 'pastures-fill') // Insert below paddocks

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
      }, 'pastures-fill') // Insert below paddocks
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

      // Priority order matches visual z-index: paddocks > waterPolygon > noGrazeZone > pasture
      // Higher number = higher priority (selected first when overlapping)
      const priorityOrder: Record<string, number> = {
        paddock: 4,
        waterPolygon: 3,
        noGrazeZone: 2,
        pasture: 1,
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
        // When editing paddocks, don't deselect when clicking outside
        // This keeps the paddock visible (inactive polygons are transparent)
        if (entityType === 'paddock') {
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
  // Z-index layering: pastures first (bottom), then overlays, paddocks last (top)
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

    // 1. Pastures (bottom layer)
    pastures.forEach((p) => {
      features.push({
        ...p.geometry,
        id: createTypedFeatureId('pasture', p.id),
        properties: {
          ...(p.geometry.properties ?? {}),
          entityType: 'pasture',
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

    // 4. Paddocks (top layer - always clickable even when inside pastures)
    // Load ALL paddocks so clicking between them doesn't trigger reload
    paddocks.forEach((s) => {
      features.push({
        ...s.geometry,
        id: createTypedFeatureId('paddock', s.id),
        properties: {
          ...(s.geometry.properties ?? {}),
          entityType: 'paddock',
          entityId: s.id,
          pastureId: s.pastureId,
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
      pastures: pastures.length,
      noGrazeZones: noGrazeZones.length,
      noGrazeZoneIds: noGrazeZones.map(z => ({ id: z.id, name: z.name })),
      waterPolygons: waterSources.filter(s => s.geometryType === 'polygon').length,
      paddocks: paddocks.length,
      total: features.length,
    })
    log('[UnifiedDraw] Loading all geometries into draw:', {
      pastures: pastures.length,
      noGrazeZones: noGrazeZones.length,
      waterPolygons: waterSources.filter(s => s.geometryType === 'polygon').length,
      paddocks: paddocks.length,
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
      } else if (entityType === 'paddock' && initialPaddockId) {
        typedIdToSelect = createTypedFeatureId('paddock', initialPaddockId)
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
  }, [draw, isEditActive, pastures, paddocks, noGrazeZones, waterSources, resetCounter, entityType, initialPaddockId, initialPaddockId, initialNoGrazeZoneId, initialWaterSourceId])

  // Select initial feature when entering edit mode
  useEffect(() => {
    if (!draw || !isEditActive) return

    // Determine which feature to select based on entity type
    let typedIdToSelect: string | null = null

    if (entityType === 'paddock' && initialPaddockId) {
      typedIdToSelect = createTypedFeatureId('paddock', initialPaddockId)
    } else if (entityType === 'paddock' && initialPaddockId) {
      typedIdToSelect = createTypedFeatureId('paddock', initialPaddockId)
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
  }, [draw, isEditActive, entityType, initialPaddockId, initialPaddockId, initialNoGrazeZoneId, initialWaterSourceId])

  // Focus map on the paddock bounds when editing paddocks
  // Only focus when the paddock ID changes, not when geometry updates during vertex editing
  // Store the initial geometry in a ref to avoid re-focusing on every vertex edit
  const initialPaddockGeometryRef = useRef<Feature<Polygon> | null>(null)
  useEffect(() => {
    // Capture geometry when paddock ID changes
    if (initialPaddockId && initialPaddockFeature) {
      if (initialPaddockGeometryRef.current === null || lastFocusedPaddockIdRef.current !== initialPaddockId) {
        initialPaddockGeometryRef.current = initialPaddockFeature
      }
    }
  }, [initialPaddockId, initialPaddockFeature])

  useEffect(() => {
    if (!isMapLoaded || !isEditActive || entityType !== 'paddock' || !initialPaddockId) return
    // Skip if user has manually adjusted the map or we already focused on this paddock
    if (userHasInteractedRef.current) return
    if (lastFocusedPaddockIdRef.current === initialPaddockId) return
    lastFocusedPaddockIdRef.current = initialPaddockId
    // Use the captured initial geometry, not the current (possibly updated) geometry
    const geometryToFocus = initialPaddockGeometryRef.current
    if (geometryToFocus) {
      fitPolygonBounds(geometryToFocus, 120)
    }
    // Note: initialPaddockFeature is NOT in dependencies - we only focus when paddock ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, fitPolygonBounds, initialPaddockId, isEditActive, isMapLoaded])

  // Reset focus tracking when leaving paddock edit mode
  useEffect(() => {
    if (entityType !== 'paddock' || !isEditActive) {
      lastFocusedPaddockIdRef.current = null
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
        if (map.getLayer('pastures-fill')) {
          map.setFilter('pastures-fill', null)
        }
        if (map.getLayer('pastures-outline')) {
          map.setFilter('pastures-outline', null)
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
        if (map.getLayer('pastures-fill')) {
          map.setFilter('pastures-fill', ['!=', ['get', 'id'], entityId])
        }
        if (map.getLayer('pastures-outline')) {
          map.setFilter('pastures-outline', ['!=', ['get', 'id'], entityId])
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
      // Paddocks use different source/layers, handled separately
    } catch (err) {
      log('[DisplayLayerFilter] Error setting filter:', err)
    }

    return () => {
      // Reset filters on cleanup
      try {
        if (map.getLayer('pastures-fill')) {
          map.setFilter('pastures-fill', null)
        }
        if (map.getLayer('pastures-outline')) {
          map.setFilter('pastures-outline', null)
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

  // Toggle pasture boundary/fill visibility
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      log('[Pastures] Visibility effect: map not ready')
      return
    }
    const map = mapInstance

    // Safety check - ensure map style is available (may be destroyed during navigation)
    try {
      if (!map.getStyle()) {
        log('[Pastures] Visibility effect: map style not available, skipping')
        return
      }
    } catch {
      log('[Pastures] Visibility effect: map is being destroyed, skipping')
      return
    }

    const pastureLayers = ['pastures-fill', 'pastures-outline']
    const visibility = showPastures ? 'visible' : 'none'
    log('[Pastures] Setting visibility:', { showPastures, visibility })

    try {
      pastureLayers.forEach(layerId => {
        const layerExists = !!map.getLayer(layerId)
        log('[Pastures] Layer check', { layerId, exists: layerExists })
        if (layerExists) {
          map.setLayoutProperty(layerId, 'visibility', visibility)
        }
      })
    } catch (err) {
      log('[Pastures] Visibility effect: error accessing map layers, likely destroyed', err)
    }
  }, [mapInstance, isMapLoaded, showPastures])

  // Update selected paddock highlight
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return

    if (map.getLayer('pastures-selected')) {
      map.removeLayer('pastures-selected')
    }

    if (selectedPaddockId && !isEditActive) {
      map.addLayer({
        id: 'pastures-selected',
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

  // Update selected paddock highlight
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return

    // Remove existing highlight layers
    const sources = ['paddocks-current', 'paddocks-yesterday', 'paddocks-grazed'] as const
    sources.forEach((sourceId) => {
      const layerId = `paddock-selected-highlight-${sourceId}`
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
    })

    // selectedPaddockId is only passed when viewing (not editing) a paddock
    if (selectedPaddockId) {
      // Add highlight layer to each source - the filter will only match in the right one
      sources.forEach((sourceId) => {
        if (map.getSource(sourceId)) {
          const layerId = `paddock-selected-highlight-${sourceId}`
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#ffffff',
              'line-width': 4,
            },
            filter: ['==', ['get', 'id'], selectedPaddockId],
          })
        }
      })
    }
  }, [mapInstance, isMapLoaded, selectedPaddockId])


  // Toggle labels visibility
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return
    
    if (map.getLayer('pastures-labels')) {
      map.setLayoutProperty(
        'pastures-labels',
        'visibility',
        showLabels ? 'visible' : 'none'
      )
    }
  }, [mapInstance, isMapLoaded, showLabels])

  // Toggle paddock layer visibility
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return

    log('[Paddocks] Toggle visibility, showPaddocks:', showPaddocks)

    const paddockLayers = [
      'paddocks-grazed-fill',
      'paddocks-grazed-outline',
      'paddocks-yesterday-fill',
      'paddocks-yesterday-outline',
      'paddocks-current-fill',
      'paddocks-current-outline',
      'paddocks-alternatives-fill',
      'paddocks-alternatives-outline',
    ]
    paddockLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          showPaddocks ? 'visible' : 'none'
        )
        log('[Paddocks] Set visibility', { layerId, visibility: showPaddocks ? 'visible' : 'none' })
      } else {
        log.warn('[Paddocks] Layer not found', { layerId })
      }
    })
  }, [mapInstance, isMapLoaded, showPaddocks])

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
