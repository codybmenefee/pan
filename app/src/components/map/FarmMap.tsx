import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import type { Paddock, PaddockStatus } from '@/lib/types'
import { useGeometry, clipPolygonToPolygon, getTranslationDelta, translatePolygon } from '@/lib/geometry'
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
    entityType: 'paddock' | 'section'
    paddockId?: string
    sectionId?: string
    geometry?: Feature<Polygon>
  }) => void
  selectedPaddockId?: string
  showSatellite?: boolean
  showNdviHeat?: boolean
  showPaddocks?: boolean
  showLabels?: boolean
  showSections?: boolean
  editable?: boolean
  editMode?: boolean
  entityType?: 'paddock' | 'section'
  parentPaddockId?: string
  initialSectionFeature?: Feature<Polygon>
  initialSectionId?: string
  initialPaddockId?: string
  showToolbar?: boolean
  toolbarPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  compactToolbar?: boolean
}

export interface FarmMapHandle {
  getMap: () => maplibregl.Map | null
  setDrawMode: (mode: DrawMode) => void
  deleteSelected: () => void
  cancelDrawing: () => void
  focusOnPaddock: (paddockId: string) => void
  focusOnGeometry: (geometry: Feature<Polygon>, padding?: number) => void
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

export const FarmMap = forwardRef<FarmMapHandle, FarmMapProps>(function FarmMap({ 
  onPaddockClick, 
  onEditPaddockSelect,
  onEditRequest,
  selectedPaddockId,
  showSatellite = false,
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

  const { paddocks, getPaddockById } = useGeometry()
  const { farm, isLoading: isFarmLoading } = useFarm()
  const farmId = farm?.id ?? null
  const farmLng = farm?.coordinates?.[0] ?? null
  const farmLat = farm?.coordinates?.[1] ?? null

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

  useImperativeHandle(ref, () => ({
    getMap: () => mapInstance,
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
  }), [mapInstance, setMode, deleteSelected, cancelDrawing, getPaddockById, fitPolygonBounds])

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

  // Render initial section (skip only when actively editing a section, as it's in draw control)
  const isEditingSection = isEditActive && entityType === 'section'
  useEffect(() => {
    if (!mapInstance || !isMapReady()) return

    const sourceId = 'section-initial'
    const fillLayerId = `${sourceId}-fill`
    const outlineLayerId = `${sourceId}-outline`

    // Hide section layers when editing a section (it's in draw control) or when no section/hidden
    if (isEditingSection || !initialSectionFeature || !showSections) {
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
        },
      }],
    }

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
  }, [isMapReady, mapInstance, isEditingSection, initialSectionFeature, initialSectionId, showSections])

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
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          },
          satellite: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'satellite-tiles',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 19,
            layout: {
              visibility: 'none',
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
    })

    return () => {
      map.remove()
      mapRef.current = null
      setMapInstance(null)
      setIsMapLoaded(false)
    }
  }, [farmId, farmLng, farmLat])

  // Add paddock and section layers once map is loaded
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return

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

    // Add or update paddocks source
    if (map.getSource('paddocks')) {
      (map.getSource('paddocks') as maplibregl.GeoJSONSource).setData(paddocksGeojson)
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
}

    const filterExistingLayers = (layerIds: string[]) =>
      layerIds.filter((layerId) => map.getLayer(layerId))

    const handlePaddockLayerClick = (e: MapEvent) => {
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

    // Double click behavior: select section or create new paddock
    map.on('dblclick', handleMapDoubleClick)
    map.on('click', handleMapClickLog)

    return () => {
      map.off('dblclick', handleMapDoubleClick)
      map.off('click', handleMapClickLog)
      map.off('click', 'paddocks-fill', handlePaddockLayerClick)
      map.off('mouseenter', 'paddocks-fill', handlePaddocksMouseEnter)
      map.off('mouseleave', 'paddocks-fill', handlePaddocksMouseLeave)
    }
  }, [mapInstance, isMapLoaded, paddocks, getPaddockById, handlePaddockClick, isEditActive, isDrawing, onEditRequest, createDraftSquare, entityType, currentMode, selectedFeatureIds])

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
      if (isDrawing || dragStateRef.current || isVertexHit(e.point)) return
      const featureId = getFeatureIdAtPoint(e.point)
      if (!featureId) {
        draw.changeMode('simple_select')
        return
      }
      draw.changeMode('direct_select', { featureId })
    }

    const handleMouseDownCapture = (event: MouseEvent) => {
      if (isDrawing) return
      const rect = map.getCanvas().getBoundingClientRect()
      const point = new maplibregl.Point(event.clientX - rect.left, event.clientY - rect.top)
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
  }, [mapInstance, isMapLoaded, draw, isEditActive, isDrawing])

  // Load paddock geometries into draw when edit mode is activated
  useEffect(() => {
    if (!draw || !isEditActive || entityType !== 'paddock') {
      if (!isEditActive || entityType !== 'paddock') {
        lastLoadedPaddockKeyRef.current = null
      }
      return
    }

    // Load existing paddock geometries into the draw plugin
    const features = paddocks.map((p) => ({
      ...p.geometry,
      id: p.id,
    }))
    const nextKey = paddocks.map((p) => p.id).sort().join('|')
    const drawFeatureCount = draw.getAll().features.length
    if (lastLoadedPaddockKeyRef.current === nextKey && drawFeatureCount > 0) {
      return
    }
    lastLoadedPaddockKeyRef.current = nextKey
    loadGeometriesToDraw(draw, features)
  }, [draw, isEditActive, entityType, paddocks])

  // Select a newly created paddock when entering edit mode
  useEffect(() => {
    if (!draw || !isEditActive || entityType !== 'paddock' || !initialPaddockId) return
    const existing = draw.get(initialPaddockId)
    if (!existing) return
    draw.changeMode('direct_select', { featureId: initialPaddockId })
  }, [draw, isEditActive, entityType, initialPaddockId])

  // Load section geometry into draw and select it when editing sections
  useEffect(() => {
    if (!draw || !isEditActive || entityType !== 'section' || !initialSectionFeature) return

    const featureId = initialSectionId ?? initialSectionFeature.id?.toString()
    const feature = featureId
      ? { ...initialSectionFeature, id: featureId }
      : initialSectionFeature

    loadGeometriesToDraw(draw, [feature])

    if (featureId) {
      draw.changeMode('direct_select', { featureId })
    }
  }, [draw, entityType, isEditActive, initialSectionFeature, initialSectionId])

  // Focus map on the section bounds when editing sections
  useEffect(() => {
    if (!isMapLoaded || !isEditActive || entityType !== 'section' || !initialSectionFeature) return
    fitPolygonBounds(initialSectionFeature, 80)
  }, [entityType, fitPolygonBounds, initialSectionFeature, isEditActive, isMapLoaded])

  // Hide native paddock layers when editing paddocks (Draw will render them)
  useEffect(() => {
    if (!isMapReady()) return
    const map = mapInstance!
    if (!map) return

    const paddockLayers = ['paddocks-fill', 'paddocks-outline']
    const shouldHide = isEditActive && entityType === 'paddock' && !!draw
    const visibility = shouldHide ? 'none' : (showPaddocks ? 'visible' : 'none')
    
    paddockLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility)
      }
    })
  }, [mapInstance, isMapLoaded, isEditActive, entityType, showPaddocks, draw])

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
            entityType={entityType}
            compact={compactToolbar}
          />
        </div>
      )}
    </div>
  )
})

