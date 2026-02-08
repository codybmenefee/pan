import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import type { Geometry } from 'geojson'
import { createFileRoute } from '@tanstack/react-router'
import { Crosshair, Focus, Satellite } from 'lucide-react'
import { FarmMap, type FarmMapHandle } from '@/components/map/FarmMap'
import { HistoricalPanel, HistoricalPanelButton } from '@/components/satellite/HistoricalPanel'
import { LayerSelector } from '@/components/map/LayerSelector'
import { SaveIndicator } from '@/components/map/SaveIndicator'
import { MapAddMenu } from '@/components/map/MapAddMenu'
import { DragPreview, type DragEntityType } from '@/components/map/DragPreview'
import { NoGrazeEditPanel } from '@/components/map/NoGrazeEditPanel'
import { WaterSourceEditPanel } from '@/components/map/WaterSourceEditPanel'
import type { NoGrazeZone, WaterSource } from '@/lib/types'
import { MorningBrief } from '@/components/brief/MorningBrief'
import { getFormattedDate } from '@/data/mock/plan'
import { PastureEditDrawer } from '@/components/map/PastureEditDrawer'
import { PaddockEditDrawer } from '@/components/map/PaddockEditDrawer'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { FloatingPanel } from '@/components/ui/floating-panel'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { useFarmContext } from '@/lib/farm'
import { useBriefPanel } from '@/lib/brief'
import { useGeometry, clipPolygonToPolygon } from '@/lib/geometry'
import { createTypedFeatureId, parseTypedFeatureId } from '@/lib/hooks'
import { useTodayPlan } from '@/lib/convex/usePlan'
import { LivestockDrawer } from '@/components/livestock'
import { useFarmSettings } from '@/lib/convex/useFarmSettings'
import { useAvailableDates, useAvailableTileDates } from '@/lib/hooks/useSatelliteTiles'
import type { Feature, Polygon } from 'geojson'
import type { Pasture, Paddock } from '@/lib/types'

type DrawEntityType = 'pasture' | 'paddock' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'

function getDataAgeLabel(dateStr: string): string | null {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 3) return null
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

interface EditDrawerState {
  open: boolean
  featureId: string | null
  geometry?: Feature<Polygon>
  pastureId?: string
}

function DemoGISRoute() {
  const { activeFarmId, activeFarm, isLoading } = useFarmContext()
  const { briefOpen, setBriefOpen } = useBriefPanel()
  const hasFarmBoundary = activeFarm?.geometry != null
  const { plan } = useTodayPlan(activeFarmId || '')
  const {
    getPastureById,
    getPaddockById,
    addPasture,
    pendingChanges,
    getNoGrazeZoneById,
    getWaterSourceById,
    deleteNoGrazeZone,
    deleteWaterSource,
  } = useGeometry()

  const mapRef = useRef<FarmMapHandle>(null)
  const [mapInstance, setMapInstance] = useState<ReturnType<FarmMapHandle['getMap']>>(null)

  // Update map instance when ref changes
  useEffect(() => {
    const updateInstance = () => {
      if (mapRef.current) {
        setMapInstance(mapRef.current.getMap())
      }
    }
    const interval = setInterval(updateInstance, 100)
    updateInstance()
    return () => clearInterval(interval)
  }, [])

  const [editDrawerState, setEditDrawerState] = useState<EditDrawerState>({
    open: false,
    featureId: null,
  })
  const [drawEntityType, setDrawEntityType] = useState<DrawEntityType>('pasture')
  const [paddockEditModeActive, setPaddockEditModeActive] = useState(false)

  const parsedFeatureId = useMemo(() => {
    if (!editDrawerState.featureId) return null
    return parseTypedFeatureId(editDrawerState.featureId)
  }, [editDrawerState.featureId])

  const selectedEntityType = parsedFeatureId?.entityType as 'pasture' | 'paddock' | undefined
  const selectedEntityId = parsedFeatureId?.entityId
  const isEditingPaddock = selectedEntityType === 'paddock' && paddockEditModeActive

  const [selectedNoGrazeZone, setSelectedNoGrazeZone] = useState<NoGrazeZone | null>(null)
  const [selectedWaterSource, setSelectedWaterSource] = useState<WaterSource | null>(null)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    type: DragEntityType
    position: { x: number; y: number }
    isOverMap: boolean
  } | null>(null)

  const [layers, setLayers] = useState({
    ndviHeat: true,
    pastures: true,
    labels: true,
    paddocks: true,
  })

  const { settings, updateMapPreference } = useFarmSettings()
  const showRGBSatellite = settings.mapPreferences?.showRGBSatellite ?? false

  const { dates: availableDates } = useAvailableDates(activeFarmId ?? undefined)
  const rgbImageryInfo = useMemo(() => {
    if (!availableDates || availableDates.length === 0) return null
    const mostRecent = availableDates[0]
    const captureDate = new Date(mostRecent.date + 'T00:00:00')
    const nextEstimate = new Date(captureDate)
    nextEstimate.setDate(nextEstimate.getDate() + 5)
    return {
      date: mostRecent.date,
      provider: mostRecent.provider,
      nextEstimate,
    }
  }, [availableDates])

  const { dates: ndviTileDates } = useAvailableTileDates(activeFarmId ?? undefined, 'ndvi_heatmap')
  const ndviImageryInfo = useMemo(() => {
    if (!ndviTileDates || ndviTileDates.length === 0) return null
    const mostRecent = ndviTileDates[0]
    const captureDate = new Date(mostRecent.date + 'T00:00:00')
    const nextEstimate = new Date(captureDate)
    nextEstimate.setDate(nextEstimate.getDate() + 5)
    return {
      date: mostRecent.date,
      provider: mostRecent.provider,
      nextEstimate,
    }
  }, [ndviTileDates])

  const satelliteLayer = showRGBSatellite ? 'rgb' : layers.ndviHeat ? 'ndvi' : null

  const handleSatelliteLayerChange = useCallback((layer: 'ndvi' | 'rgb' | null) => {
    setLayers(prev => ({ ...prev, ndviHeat: layer === 'ndvi' }))
    updateMapPreference('showRGBSatellite', layer === 'rgb')
  }, [updateMapPreference])

  const [satelliteViewOpen, setSatelliteViewOpen] = useState(false)
  const [livestockDrawerOpen, setLivestockDrawerOpen] = useState(false)

  const todaysPaddock = useMemo<Paddock | null>(() => {
    if (plan?.sectionGeometry) {
      return {
        id: plan._id,
        pastureId: plan.primaryPaddockExternalId || '',
        date: plan.date,
        geometry: {
          type: 'Feature' as const,
          properties: {},
          geometry: plan.sectionGeometry,
        },
        targetArea: plan.sectionAreaHectares || 0,
        reasoning: plan.reasoning || [],
      }
    }
    return null
  }, [plan])

  const paddockPasture = useMemo(() => {
    if (!todaysPaddock?.pastureId) return undefined
    return getPastureById(todaysPaddock.pastureId)
  }, [getPastureById, todaysPaddock])

  const paddockHasPendingDelete = useCallback((paddockId: string) => {
    return pendingChanges.some(
      (c) => !c.synced && c.entityType === 'paddock' && c.changeType === 'delete' && c.id === paddockId
    )
  }, [pendingChanges])

  const clippedPaddockGeometry = useMemo(() => {
    if (!todaysPaddock) return null
    if (paddockHasPendingDelete(todaysPaddock.id)) return null
    if (!paddockPasture) return todaysPaddock.geometry
    const clipped = clipPolygonToPolygon(todaysPaddock.geometry, paddockPasture.geometry)
    return clipped ?? paddockPasture.geometry
  }, [todaysPaddock, paddockPasture, paddockHasPendingDelete])

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }

  const handleEditRequest = useCallback((request: {
    entityType: 'pasture' | 'paddock' | 'noGrazeZone' | 'waterPolygon'
    pastureId?: string
    paddockId?: string
    noGrazeZoneId?: string
    waterSourceId?: string
    geometry?: Feature<Polygon>
  }) => {
    if (request.entityType === 'pasture' && request.geometry && !request.pastureId) {
      const newId = addPasture(request.geometry)
      setEditDrawerState({
        open: true,
        featureId: createTypedFeatureId('pasture', newId),
        geometry: request.geometry,
      })
      setDrawEntityType('pasture')
      return
    }

    if (request.entityType === 'noGrazeZone') {
      setDrawEntityType('noGrazeZone')
      if (request.noGrazeZoneId) {
        const zone = getNoGrazeZoneById(request.noGrazeZoneId)
        if (zone) setSelectedNoGrazeZone(zone)
      }
      return
    }

    if (request.entityType === 'waterPolygon') {
      setDrawEntityType('waterPolygon')
      if (request.waterSourceId) {
        const source = getWaterSourceById(request.waterSourceId)
        if (source) setSelectedWaterSource(source)
      }
      return
    }

    if (request.entityType === 'pasture' && request.pastureId) {
      setEditDrawerState({
        open: true,
        featureId: createTypedFeatureId('pasture', request.pastureId),
        geometry: request.geometry,
      })
      setDrawEntityType('pasture')
    } else if (request.entityType === 'paddock' && request.paddockId) {
      setEditDrawerState({
        open: true,
        featureId: createTypedFeatureId('paddock', request.paddockId),
        geometry: request.geometry,
        pastureId: request.pastureId,
      })
      setDrawEntityType('paddock')
    }
  }, [addPasture, getNoGrazeZoneById, getWaterSourceById])

  const closeEditDrawer = useCallback(() => {
    setEditDrawerState({
      open: false,
      featureId: null,
    })
    setPaddockEditModeActive(false)
  }, [])

  const handleEnterPaddockEditMode = useCallback(() => {
    setPaddockEditModeActive(true)
    setDrawEntityType('paddock')
  }, [])

  const handleNoGrazeZoneClick = useCallback((zoneId: string) => {
    const zone = getNoGrazeZoneById(zoneId)
    if (zone) {
      setSelectedNoGrazeZone(zone)
      setSelectedWaterSource(null)
    }
  }, [getNoGrazeZoneById])

  const handleWaterSourceClick = useCallback((sourceId: string) => {
    const source = getWaterSourceById(sourceId)
    if (source) {
      setSelectedWaterSource(source)
      setSelectedNoGrazeZone(null)
    }
  }, [getWaterSourceById])

  const handleNoGrazeZoneDelete = useCallback((id: string) => {
    deleteNoGrazeZone(id)
    setSelectedNoGrazeZone(null)
  }, [deleteNoGrazeZone])

  const handleWaterSourceDelete = useCallback((id: string) => {
    deleteWaterSource(id)
    setSelectedWaterSource(null)
  }, [deleteWaterSource])

  const handleAddPasture = useCallback(() => {
    setDrawEntityType('pasture')
    setTimeout(() => {
      mapRef.current?.setDrawMode('draw_polygon')
    }, 50)
  }, [])

  const handleAddNoGrazeZone = useCallback(() => {
    setDrawEntityType('noGrazeZone')
    setTimeout(() => {
      mapRef.current?.setDrawMode('draw_polygon')
    }, 50)
  }, [])

  const handleAddWaterSource = useCallback((geometryType: 'point' | 'polygon') => {
    setDrawEntityType(geometryType === 'point' ? 'waterPoint' : 'waterPolygon')
    setTimeout(() => {
      mapRef.current?.setDrawMode(geometryType === 'point' ? 'draw_point' : 'draw_polygon')
    }, 50)
  }, [])

  const handleDragStart = useCallback((type: DragEntityType, startPosition: { x: number; y: number }) => {
    const rect = mapRef.current?.getMapContainerRect()
    const isOverMap = rect
      ? startPosition.x >= rect.left && startPosition.x <= rect.right && startPosition.y >= rect.top && startPosition.y <= rect.bottom
      : false

    setDragState({
      isDragging: true,
      type,
      position: startPosition,
      isOverMap,
    })
  }, [])

  useEffect(() => {
    if (!dragState?.isDragging) return

    const handlePointerMove = (e: PointerEvent) => {
      const rect = mapRef.current?.getMapContainerRect()
      const isOverMap = rect
        ? e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
        : false

      setDragState((prev) =>
        prev ? { ...prev, position: { x: e.clientX, y: e.clientY }, isOverMap } : null
      )
    }

    const handlePointerUp = (e: PointerEvent) => {
      const rect = mapRef.current?.getMapContainerRect()
      const isOverMap = rect
        ? e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
        : false

      if (dragState && isOverMap) {
        mapRef.current?.createEntityAtScreenPoint(dragState.type, e.clientX, e.clientY)
      }
      setDragState(null)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.body.style.cursor = 'grabbing'

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.body.style.cursor = ''
    }
  }, [dragState])

  const handleZoomToPaddock = useCallback((geometry: Geometry) => {
    if (geometry.type === 'Polygon') {
      const feature: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: geometry as Polygon,
      }
      mapRef.current?.focusOnGeometry(feature, 120, true)
    }
  }, [])

  const selectedPasture: Pasture | undefined = useMemo(() => {
    if (selectedEntityType === 'pasture' && selectedEntityId) {
      return getPastureById(selectedEntityId)
    }
    return undefined
  }, [selectedEntityType, selectedEntityId, getPastureById])

  const parentPastureIdForPaddock = useMemo(() => {
    if (selectedEntityType === 'paddock' && selectedEntityId) {
      const paddock = getPaddockById(selectedEntityId)
      return paddock?.pastureId ?? editDrawerState.pastureId
    }
    return undefined
  }, [selectedEntityType, selectedEntityId, getPaddockById, editDrawerState.pastureId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading demo..." />
      </div>
    )
  }

  if (!activeFarmId) {
    return (
      <ErrorState
        title="Demo unavailable"
        message="Unable to load demo farm."
        details={['Please try refreshing the page.']}
        className="min-h-screen"
      />
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <FarmMap
        ref={mapRef}
        onEditRequest={handleEditRequest}
        onNoGrazeZoneClick={handleNoGrazeZoneClick}
        onWaterSourceClick={handleWaterSourceClick}
        showNdviHeat={layers.ndviHeat}
        showPastures={layers.pastures}
        showLabels={layers.labels}
        showPaddocks={layers.paddocks}
        showRGBSatellite={showRGBSatellite}
        editable={true}
        editMode={true}
        entityType={drawEntityType}
        parentPastureId={parentPastureIdForPaddock}
        initialPaddockFeature={
          isEditingPaddock && editDrawerState.geometry && selectedEntityId && !paddockHasPendingDelete(selectedEntityId)
            ? editDrawerState.geometry
            : clippedPaddockGeometry ?? undefined
        }
        initialPaddockId={
          isEditingPaddock && selectedEntityId && !paddockHasPendingDelete(selectedEntityId)
            ? selectedEntityId
            : (todaysPaddock && !paddockHasPendingDelete(todaysPaddock.id) ? todaysPaddock.id : undefined)
        }
        initialPastureId={selectedEntityType === 'pasture' ? selectedEntityId : undefined}
        showToolbar={false}
        selectedPaddockId={
          editDrawerState.open &&
          selectedEntityType === 'paddock' &&
          !isEditingPaddock
            ? selectedEntityId
            : undefined
        }
      />

      {/* Historical Satellite button and Livestock */}
      <div className="absolute bottom-2 left-2 z-10 flex gap-1">
        <HistoricalPanelButton
          onClick={() => setSatelliteViewOpen(!satelliteViewOpen)}
          active={satelliteViewOpen}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLivestockDrawerOpen(true)}
          className="h-7 text-xs shadow-lg bg-white"
        >
          Livestock
        </Button>
      </div>

      {/* Historical Satellite Panel */}
      {activeFarmId && (
        <HistoricalPanel
          farmId={activeFarmId}
          map={mapInstance}
          open={satelliteViewOpen}
          onOpenChange={setSatelliteViewOpen}
        />
      )}

      {/* Save indicator */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10">
        <SaveIndicator />
      </div>

      {/* RGB Imagery info badge */}
      {showRGBSatellite && rgbImageryInfo && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cobalt text-white text-xs font-medium shadow-hard-sm">
            <Satellite className="h-3.5 w-3.5" />
            <span>
              {new Date(rgbImageryInfo.date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="text-white/50">&bull;</span>
            <span className="text-white/80">{rgbImageryInfo.provider}</span>
            {getDataAgeLabel(rgbImageryInfo.date) && (
              <>
                <span className="text-white/50">&bull;</span>
                <span className="text-terracotta-muted">{getDataAgeLabel(rgbImageryInfo.date)}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* NDVI Imagery info badge */}
      {layers.ndviHeat && ndviImageryInfo && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-olive text-white text-xs font-medium shadow-hard-sm">
            <Satellite className="h-3.5 w-3.5" />
            <span>NDVI</span>
            <span className="text-white/50">&bull;</span>
            <span>
              {new Date(ndviImageryInfo.date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {getDataAgeLabel(ndviImageryInfo.date) && (
              <>
                <span className="text-white/50">&bull;</span>
                <span className="text-terracotta-muted">{getDataAgeLabel(ndviImageryInfo.date)}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Target button */}
      {hasFarmBoundary && (
        <Button
          size="icon"
          variant="outline"
          className="absolute top-2 right-10 z-20 h-8 w-8 rounded-full shadow-lg bg-background"
          onClick={() => mapRef.current?.focusOnFarmBoundary()}
          title="Center on farm boundary"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      )}

      {/* Add menu */}
      <MapAddMenu
        onAddPasture={handleAddPasture}
        onAddNoGrazeZone={handleAddNoGrazeZone}
        onAddWaterSource={handleAddWaterSource}
        onDragStart={handleDragStart}
      />

      {/* Daily Plan Floating Panel */}
      <FloatingPanel
        open={briefOpen}
        onOpenChange={setBriefOpen}
        title="Daily Plan"
        subtitle={getFormattedDate()}
        headerActions={
          todaysPaddock && !paddockHasPendingDelete(todaysPaddock.id) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoomToPaddock(todaysPaddock.geometry.geometry)}
              className="gap-1 h-5 text-[10px] px-1.5"
            >
              <Focus className="h-3 w-3" />
              <span className="hidden sm:inline">View Paddock</span>
            </Button>
          )
        }
        defaultWidth={600}
        defaultHeight={600}
        minWidth={320}
        maxWidth={600}
        minHeight={300}
        initialPosition={{ x: 54, y: 64 }}
      >
        <MorningBrief
          farmExternalId={activeFarmId}
          compact
          onClose={() => setBriefOpen(false)}
          onZoomToPaddock={handleZoomToPaddock}
        />
      </FloatingPanel>

      {/* Layer selector */}
      <div className="absolute top-2 left-2 z-10">
        <LayerSelector
          satelliteLayer={satelliteLayer}
          onSatelliteLayerChange={handleSatelliteLayerChange}
          layers={layers}
          onToggleLayer={toggleLayer}
        />
      </div>

      {/* Pasture Edit Modal */}
      {selectedEntityType === 'pasture' && selectedPasture && (
        <PastureEditDrawer
          pasture={selectedPasture}
          open={editDrawerState.open}
          onClose={closeEditDrawer}
        />
      )}

      {/* Paddock Edit Drawer */}
      <Drawer
        open={editDrawerState.open && selectedEntityType === 'paddock'}
        onOpenChange={(open) => {
          if (!open) closeEditDrawer()
        }}
        side="right"
        width={360}
        modal={false}
      >
        <DrawerContent
          side="right"
          width={360}
          showCloseButton={false}
          showOverlay={false}
          ariaLabel="Grazing Paddock"
        >
          {selectedEntityType === 'paddock' && selectedEntityId && editDrawerState.geometry ? (
            <PaddockEditDrawer
              paddockId={selectedEntityId}
              pastureId={parentPastureIdForPaddock || ''}
              geometry={editDrawerState.geometry}
              isEditMode={isEditingPaddock}
              onEnterEditMode={handleEnterPaddockEditMode}
              onClose={closeEditDrawer}
            />
          ) : null}
        </DrawerContent>
      </Drawer>

      {/* No-graze zone edit panel */}
      {selectedNoGrazeZone && (
        <NoGrazeEditPanel
          zone={selectedNoGrazeZone}
          open={true}
          onDelete={handleNoGrazeZoneDelete}
          onClose={() => setSelectedNoGrazeZone(null)}
        />
      )}

      {/* Water source edit panel */}
      {selectedWaterSource && (
        <WaterSourceEditPanel
          source={selectedWaterSource}
          open={true}
          onDelete={handleWaterSourceDelete}
          onClose={() => setSelectedWaterSource(null)}
        />
      )}

      {/* Drag preview */}
      {dragState?.isDragging && (
        <DragPreview
          type={dragState.type}
          position={dragState.position}
          isOverMap={dragState.isOverMap}
        />
      )}

      {/* Livestock drawer */}
      <LivestockDrawer
        open={livestockDrawerOpen}
        onOpenChange={setLivestockDrawerOpen}
      />
    </div>
  )
}

export const Route = createFileRoute('/demo/')({
  component: DemoGISRoute,
})
