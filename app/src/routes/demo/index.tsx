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
import { PaddockEditDrawer } from '@/components/map/PaddockEditDrawer'
import { SectionEditDrawer } from '@/components/map/SectionEditDrawer'
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
import type { Paddock, Section } from '@/lib/types'

type DrawEntityType = 'paddock' | 'section' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'

interface EditDrawerState {
  open: boolean
  featureId: string | null
  geometry?: Feature<Polygon>
  paddockId?: string
}

function DemoGISRoute() {
  const { activeFarmId, activeFarm, isLoading } = useFarmContext()
  const { briefOpen, setBriefOpen } = useBriefPanel()
  const hasFarmBoundary = activeFarm?.geometry != null
  const { plan } = useTodayPlan(activeFarmId || '')
  const {
    getPaddockById,
    getSectionById,
    addPaddock,
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
  const [drawEntityType, setDrawEntityType] = useState<DrawEntityType>('paddock')
  const [sectionEditModeActive, setSectionEditModeActive] = useState(false)

  const parsedFeatureId = useMemo(() => {
    if (!editDrawerState.featureId) return null
    return parseTypedFeatureId(editDrawerState.featureId)
  }, [editDrawerState.featureId])

  const selectedEntityType = parsedFeatureId?.entityType as 'paddock' | 'section' | undefined
  const selectedEntityId = parsedFeatureId?.entityId
  const isEditingSection = selectedEntityType === 'section' && sectionEditModeActive

  const [selectedNoGrazeZone, setSelectedNoGrazeZone] = useState<NoGrazeZone | null>(null)
  const [selectedWaterSource, setSelectedWaterSource] = useState<WaterSource | null>(null)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    type: DragEntityType
    position: { x: number; y: number }
    isOverMap: boolean
  } | null>(null)

  const [layers, setLayers] = useState({
    ndviHeat: false,
    paddocks: true,
    labels: true,
    sections: true,
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

  const todaysSection = useMemo<Section | null>(() => {
    if (plan?.sectionGeometry) {
      return {
        id: plan._id,
        paddockId: plan.primaryPaddockExternalId || '',
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

  const sectionPaddock = useMemo(() => {
    if (!todaysSection?.paddockId) return undefined
    return getPaddockById(todaysSection.paddockId)
  }, [getPaddockById, todaysSection])

  const sectionHasPendingDelete = useCallback((sectionId: string) => {
    return pendingChanges.some(
      (c) => !c.synced && c.entityType === 'section' && c.changeType === 'delete' && c.id === sectionId
    )
  }, [pendingChanges])

  const clippedSectionGeometry = useMemo(() => {
    if (!todaysSection) return null
    if (sectionHasPendingDelete(todaysSection.id)) return null
    if (!sectionPaddock) return todaysSection.geometry
    const clipped = clipPolygonToPolygon(todaysSection.geometry, sectionPaddock.geometry)
    return clipped ?? sectionPaddock.geometry
  }, [todaysSection, sectionPaddock, sectionHasPendingDelete])

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }

  const handleEditRequest = useCallback((request: {
    entityType: 'paddock' | 'section' | 'noGrazeZone' | 'waterPolygon'
    paddockId?: string
    sectionId?: string
    noGrazeZoneId?: string
    waterSourceId?: string
    geometry?: Feature<Polygon>
  }) => {
    if (request.entityType === 'paddock' && request.geometry && !request.paddockId) {
      const newId = addPaddock(request.geometry)
      setEditDrawerState({
        open: true,
        featureId: createTypedFeatureId('paddock', newId),
        geometry: request.geometry,
      })
      setDrawEntityType('paddock')
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

    if (request.entityType === 'paddock' && request.paddockId) {
      setEditDrawerState({
        open: true,
        featureId: createTypedFeatureId('paddock', request.paddockId),
        geometry: request.geometry,
      })
      setDrawEntityType('paddock')
    } else if (request.entityType === 'section' && request.sectionId) {
      setEditDrawerState({
        open: true,
        featureId: createTypedFeatureId('section', request.sectionId),
        geometry: request.geometry,
        paddockId: request.paddockId,
      })
      setDrawEntityType('section')
    }
  }, [addPaddock, getNoGrazeZoneById, getWaterSourceById])

  const closeEditDrawer = useCallback(() => {
    setEditDrawerState({
      open: false,
      featureId: null,
    })
    setSectionEditModeActive(false)
  }, [])

  const handleEnterSectionEditMode = useCallback(() => {
    setSectionEditModeActive(true)
    setDrawEntityType('section')
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

  const handleAddPaddock = useCallback(() => {
    setDrawEntityType('paddock')
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

  const handleZoomToSection = useCallback((geometry: Geometry) => {
    if (geometry.type === 'Polygon') {
      const feature: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: geometry as Polygon,
      }
      mapRef.current?.focusOnGeometry(feature, 120, true)
    }
  }, [])

  const selectedPaddock: Paddock | undefined = useMemo(() => {
    if (selectedEntityType === 'paddock' && selectedEntityId) {
      return getPaddockById(selectedEntityId)
    }
    return undefined
  }, [selectedEntityType, selectedEntityId, getPaddockById])

  const parentPaddockIdForSection = useMemo(() => {
    if (selectedEntityType === 'section' && selectedEntityId) {
      const section = getSectionById(selectedEntityId)
      return section?.paddockId ?? editDrawerState.paddockId
    }
    return undefined
  }, [selectedEntityType, selectedEntityId, getSectionById, editDrawerState.paddockId])

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
        showPaddocks={layers.paddocks}
        showLabels={layers.labels}
        showSections={layers.sections}
        showRGBSatellite={showRGBSatellite}
        editable={true}
        editMode={true}
        entityType={drawEntityType}
        parentPaddockId={parentPaddockIdForSection}
        initialSectionFeature={
          isEditingSection && editDrawerState.geometry && selectedEntityId && !sectionHasPendingDelete(selectedEntityId)
            ? editDrawerState.geometry
            : clippedSectionGeometry ?? undefined
        }
        initialSectionId={
          isEditingSection && selectedEntityId && !sectionHasPendingDelete(selectedEntityId)
            ? selectedEntityId
            : (todaysSection && !sectionHasPendingDelete(todaysSection.id) ? todaysSection.id : undefined)
        }
        initialPaddockId={selectedEntityType === 'paddock' ? selectedEntityId : undefined}
        showToolbar={false}
        selectedSectionId={
          editDrawerState.open &&
          selectedEntityType === 'section' &&
          !isEditingSection
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-full shadow-lg">
            <Satellite className="h-3.5 w-3.5" />
            <span>
              {new Date(rgbImageryInfo.date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="text-blue-200">•</span>
            <span className="text-blue-100">{rgbImageryInfo.provider}</span>
          </div>
        </div>
      )}

      {/* NDVI Imagery info badge */}
      {layers.ndviHeat && ndviImageryInfo && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-full shadow-lg">
            <Satellite className="h-3.5 w-3.5" />
            <span>NDVI</span>
            <span className="text-green-200">•</span>
            <span>
              {new Date(ndviImageryInfo.date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
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
        onAddPaddock={handleAddPaddock}
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
          todaysSection && !sectionHasPendingDelete(todaysSection.id) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoomToSection(todaysSection.geometry.geometry)}
              className="gap-1 h-5 text-[10px] px-1.5"
            >
              <Focus className="h-3 w-3" />
              <span className="hidden sm:inline">View Section</span>
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
          onZoomToSection={handleZoomToSection}
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

      {/* Paddock Edit Modal */}
      {selectedEntityType === 'paddock' && selectedPaddock && (
        <PaddockEditDrawer
          paddock={selectedPaddock}
          open={editDrawerState.open}
          onClose={closeEditDrawer}
        />
      )}

      {/* Section Edit Drawer */}
      <Drawer
        open={editDrawerState.open && selectedEntityType === 'section'}
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
          ariaLabel="Grazing Section"
        >
          {selectedEntityType === 'section' && selectedEntityId && editDrawerState.geometry ? (
            <SectionEditDrawer
              sectionId={selectedEntityId}
              paddockId={parentPaddockIdForSection || ''}
              geometry={editDrawerState.geometry}
              isEditMode={isEditingSection}
              onEnterEditMode={handleEnterSectionEditMode}
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
