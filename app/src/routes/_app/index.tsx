import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import type { Geometry } from 'geojson'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { Calendar, CheckCircle, Focus, Save } from 'lucide-react'
import { FarmMap, type FarmMapHandle } from '@/components/map/FarmMap'
import { FarmBoundaryDrawer } from '@/components/map/FarmBoundaryDrawer'
import { LayerToggles } from '@/components/map/LayerToggles'
import { SaveIndicator } from '@/components/map/SaveIndicator'
import { MapAddMenu } from '@/components/map/MapAddMenu'
import { DragPreview, type DragEntityType } from '@/components/map/DragPreview'
import { NoGrazeEditPanel } from '@/components/map/NoGrazeEditPanel'
import { WaterSourceEditPanel } from '@/components/map/WaterSourceEditPanel'
import type { NoGrazeZone, WaterSource, WaterSourceType } from '@/lib/types'
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
import { useGeometry, clipPolygonToPolygon } from '@/lib/geometry'
import { useTodayPlan } from '@/lib/convex/usePlan'
import { useFarmBoundary } from '@/lib/hooks/useFarmBoundary'
import type { Feature, Polygon } from 'geojson'
import type { Paddock, Section } from '@/lib/types'

const searchSchema = z.object({
  editBoundary: z.string().optional(),
  onboarded: z.string().optional(),
})

type DrawEntityType = 'paddock' | 'section' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'

interface EditDrawerState {
  open: boolean
  entityType: 'paddock' | 'section'
  paddockId?: string
  sectionId?: string
  geometry?: Feature<Polygon>
}

function GISRoute() {
  console.log('[_app/index] Rendering GISRoute')
  const navigate = useNavigate()
  const search = useSearch({ from: '/_app/' })
  const { activeFarmId, isLoading } = useFarmContext()
  const { plan } = useTodayPlan(activeFarmId || '')
  const {
    getPaddockById,
    addPaddock,
    getNoGrazeZoneById,
    getWaterSourceById,
    updateNoGrazeZoneMetadata,
    deleteNoGrazeZone,
    updateWaterSourceMetadata,
    deleteWaterSource,
  } = useGeometry()
  const { startDraw, cancelDraw, isDrawingBoundary } = useFarmBoundary()

  const mapRef = useRef<FarmMapHandle>(null)
  const [briefOpen, setBriefOpen] = useState(true)
  const [mapInstance, setMapInstance] = useState<ReturnType<FarmMapHandle['getMap']>>(null)

  // Update map instance when ref changes
  useEffect(() => {
    const updateInstance = () => {
      if (mapRef.current) {
        setMapInstance(mapRef.current.getMap())
      }
    }
    // Poll briefly to catch when instance becomes available
    const interval = setInterval(updateInstance, 100)
    updateInstance()
    return () => clearInterval(interval)
  }, [])

  // Handle ?editBoundary=true query param
  const editBoundaryParam = search.editBoundary === 'true'
  useEffect(() => {
    if (editBoundaryParam && !isDrawingBoundary) {
      startDraw()
    }
  }, [editBoundaryParam, isDrawingBoundary, startDraw])

  // Handle ?onboarded=true query param - show welcome toast
  useEffect(() => {
    if (search.onboarded === 'true') {
      toast.success('Welcome! Your farm is set up.', {
        description: 'Edit your paddock or add more from the map.',
      })
      // Clear the param from URL
      navigate({ to: '/', search: {} })
    }
  }, [search.onboarded, navigate])

  const handleBoundaryComplete = useCallback(() => {
    // Remove the query param
    navigate({ to: '/', search: {} })
  }, [navigate])

  const handleBoundaryCancel = useCallback(() => {
    cancelDraw()
    navigate({ to: '/', search: {} })
  }, [cancelDraw, navigate])
  const [editDrawerState, setEditDrawerState] = useState<EditDrawerState>({
    open: false,
    entityType: 'paddock',
  })
  const [drawEntityType, setDrawEntityType] = useState<DrawEntityType>('paddock')
  const [selectedNoGrazeZone, setSelectedNoGrazeZone] = useState<NoGrazeZone | null>(null)
  const [selectedWaterSource, setSelectedWaterSource] = useState<WaterSource | null>(null)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    type: DragEntityType
    position: { x: number; y: number }
    isOverMap: boolean
  } | null>(null)

  const [layers, setLayers] = useState({
    satellite: true,
    ndviHeat: false,
    paddocks: true,
    labels: true,
    sections: true,
  })

  // Plan modify mode state
  const [planModifyMode, setPlanModifyMode] = useState<{
    active: boolean
    sectionGeometry: Feature<Polygon>
    paddockId: string
  } | null>(null)

  // Extract today's section from plan
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

  // Get the paddock for clipping the section
  const sectionPaddock = useMemo(() => {
    if (!todaysSection?.paddockId) return undefined
    return getPaddockById(todaysSection.paddockId)
  }, [getPaddockById, todaysSection])

  // Clip section to paddock bounds
  const clippedSectionGeometry = useMemo(() => {
    if (!todaysSection) return null
    if (!sectionPaddock) return todaysSection.geometry
    const clipped = clipPolygonToPolygon(todaysSection.geometry, sectionPaddock.geometry)
    return clipped ?? sectionPaddock.geometry
  }, [todaysSection, sectionPaddock])

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }

  const handleEditRequest = useCallback((request: {
    entityType: 'paddock' | 'section'
    paddockId?: string
    sectionId?: string
    geometry?: Feature<Polygon>
  }) => {
    // If creating a new paddock with geometry (double-click on empty space)
    if (request.entityType === 'paddock' && request.geometry && !request.paddockId) {
      const newId = addPaddock(request.geometry)
      setEditDrawerState({
        open: true,
        entityType: 'paddock',
        paddockId: newId,
        geometry: request.geometry,
      })
      setDrawEntityType('paddock')
      return
    }

    // Opening existing paddock or section
    setEditDrawerState({
      open: true,
      entityType: request.entityType,
      paddockId: request.paddockId,
      sectionId: request.sectionId,
      geometry: request.geometry,
    })
    // Also update the draw entity type so FarmMap enters the correct edit mode
    setDrawEntityType(request.entityType)
  }, [addPaddock])

  const closeEditDrawer = useCallback(() => {
    setEditDrawerState({
      open: false,
      entityType: 'paddock',
    })
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

  const handleNoGrazeZoneSave = useCallback((id: string, name: string) => {
    updateNoGrazeZoneMetadata(id, { name })
    setSelectedNoGrazeZone(null)
  }, [updateNoGrazeZoneMetadata])

  const handleNoGrazeZoneDelete = useCallback((id: string) => {
    deleteNoGrazeZone(id)
    setSelectedNoGrazeZone(null)
  }, [deleteNoGrazeZone])

  const handleWaterSourceSave = useCallback((id: string, updates: { name?: string; type?: WaterSourceType }) => {
    updateWaterSourceMetadata(id, updates)
    setSelectedWaterSource(null)
  }, [updateWaterSourceMetadata])

  const handleWaterSourceDelete = useCallback((id: string) => {
    deleteWaterSource(id)
    setSelectedWaterSource(null)
  }, [deleteWaterSource])

  const handleAddPaddock = useCallback(() => {
    setDrawEntityType('paddock')
    // Start drawing polygon after a short delay to ensure state is updated
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

  // Drag-and-drop handlers
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

  // Document-level drag event handlers
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

      console.log('[DragDrop] Drop event:', {
        type: dragState?.type,
        isOverMap,
        hasMapRef: !!mapRef.current,
        clientX: e.clientX,
        clientY: e.clientY,
        rect: rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null
      })

      if (dragState && isOverMap) {
        // Drop on map - create entity
        const entityId = mapRef.current?.createEntityAtScreenPoint(dragState.type, e.clientX, e.clientY)
        console.log('[DragDrop] Created entity:', entityId)
      }
      setDragState(null)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)

    // Set cursor style during drag
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
      mapRef.current?.focusOnGeometry(feature, 50)
    }
  }, [])

  // Plan modify mode callbacks
  const handleEnterModifyMode = useCallback((geometry: Geometry, paddockId: string) => {
    // Zoom to section
    handleZoomToSection(geometry)
    // Enable modify mode
    if (geometry.type === 'Polygon') {
      setPlanModifyMode({
        active: true,
        sectionGeometry: { type: 'Feature', properties: {}, geometry } as Feature<Polygon>,
        paddockId,
      })
    }
  }, [handleZoomToSection])

  const handleSaveModification = useCallback(async (_feedback: string) => {
    // Submit feedback via existing mechanism (future: integrate with submitFeedback)
    setPlanModifyMode(null)
  }, [])

  const handleCancelModify = useCallback(() => {
    setPlanModifyMode(null)
  }, [])

  // Get the selected paddock for the edit drawer
  const selectedPaddock: Paddock | undefined = useMemo(() => {
    if (editDrawerState.entityType === 'paddock' && editDrawerState.paddockId) {
      return getPaddockById(editDrawerState.paddockId)
    }
    return undefined
  }, [editDrawerState.entityType, editDrawerState.paddockId, getPaddockById])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    )
  }

  if (!activeFarmId) {
    return (
      <ErrorState
        title="Farm mapping unavailable"
        message="No farm is associated with this account yet."
        details={['Seed a farm record or map this user to a farm in Convex.']}
        className="min-h-screen"
      />
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Full-screen map */}
      <FarmMap
        ref={mapRef}
        onEditRequest={handleEditRequest}
        onNoGrazeZoneClick={handleNoGrazeZoneClick}
        onWaterSourceClick={handleWaterSourceClick}
        showSatellite={layers.satellite}
        showNdviHeat={layers.ndviHeat}
        showPaddocks={layers.paddocks}
        showLabels={layers.labels}
        showSections={layers.sections}
        editable={true}
        editMode={true}
        entityType={drawEntityType}
        parentPaddockId={editDrawerState.entityType === 'section' ? editDrawerState.paddockId : undefined}
        initialSectionFeature={clippedSectionGeometry ?? undefined}
        initialSectionId={todaysSection?.id}
        initialPaddockId={editDrawerState.paddockId}
        showToolbar={true}
        toolbarPosition="top-left"
        compactToolbar={true}
      />

      {/* Farm Boundary Drawer - shown when editing boundary */}
      {isDrawingBoundary && (
        <FarmBoundaryDrawer
          map={mapInstance}
          onComplete={handleBoundaryComplete}
          onCancel={handleBoundaryCancel}
        />
      )}

      {/* Layer toggles - bottom left */}
      <div className="absolute bottom-4 left-4 z-10">
        <LayerToggles
          layers={layers}
          onToggle={toggleLayer}
          showEditToggle={false}
        />
      </div>

      {/* Save indicator - top center */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <SaveIndicator />
      </div>

      {/* Add menu - below save indicator */}
      <MapAddMenu
        onAddPaddock={handleAddPaddock}
        onAddNoGrazeZone={handleAddNoGrazeZone}
        onAddWaterSource={handleAddWaterSource}
        onDragStart={handleDragStart}
        className="top-14"
      />

      {/* Floating Save Button when in plan modify mode */}
      {planModifyMode?.active && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <Button
            onClick={() => handleSaveModification('Section adjusted')}
            className="shadow-lg gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}

      {/* Daily Plan Floating Panel */}
      <FloatingPanel
        open={briefOpen}
        onOpenChange={setBriefOpen}
        title="Daily Plan"
        subtitle={getFormattedDate()}
        headerActions={
          todaysSection && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoomToSection(todaysSection.geometry.geometry)}
              className="gap-1.5"
            >
              <Focus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Section</span>
            </Button>
          )
        }
        defaultWidth={600}
        defaultHeight={600}
        minWidth={320}
        maxWidth={600}
        minHeight={300}
        initialPosition={{ x: 64, y: 64 }}
      >
        <MorningBrief
          farmExternalId={activeFarmId}
          compact
          onClose={() => setBriefOpen(false)}
          onZoomToSection={handleZoomToSection}
          onEnterModifyMode={handleEnterModifyMode}
          modifyModeActive={planModifyMode?.active ?? false}
          onSaveModification={handleSaveModification}
          onCancelModify={handleCancelModify}
        />
      </FloatingPanel>

      {/* Toggle button when panel is closed */}
      {!briefOpen && (
        <div className="absolute top-16 left-3 z-10">
          {plan?.status === 'approved' || plan?.status === 'modified' ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setBriefOpen(true)}
              className="gap-2 shadow-lg bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Approved
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => setBriefOpen(true)}
              className="gap-2 shadow-lg"
            >
              <Calendar className="h-4 w-4" />
              Daily Plan
            </Button>
          )}
        </div>
      )}

      {/* Edit Drawer - right side */}
      <Drawer
        open={editDrawerState.open}
        onOpenChange={(open) => {
          if (!open) closeEditDrawer()
        }}
        side="right"
        width={360}
        modal={false}
      >
        <DrawerContent side="right" width={360} showCloseButton={false} showOverlay={false}>
          {editDrawerState.entityType === 'paddock' && selectedPaddock ? (
            <PaddockEditDrawer paddock={selectedPaddock} onClose={closeEditDrawer} />
          ) : editDrawerState.entityType === 'section' && editDrawerState.sectionId && editDrawerState.geometry ? (
            <SectionEditDrawer
              sectionId={editDrawerState.sectionId}
              paddockId={editDrawerState.paddockId || ''}
              geometry={editDrawerState.geometry}
              onClose={closeEditDrawer}
            />
          ) : null}
        </DrawerContent>
      </Drawer>

      {/* No-graze zone edit panel */}
      {selectedNoGrazeZone && (
        <NoGrazeEditPanel
          zone={selectedNoGrazeZone}
          onSave={handleNoGrazeZoneSave}
          onDelete={handleNoGrazeZoneDelete}
          onClose={() => setSelectedNoGrazeZone(null)}
        />
      )}

      {/* Water source edit panel */}
      {selectedWaterSource && (
        <WaterSourceEditPanel
          source={selectedWaterSource}
          onSave={handleWaterSourceSave}
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
    </div>
  )
}

export const Route = createFileRoute('/_app/')({
  component: GISRoute,
  validateSearch: searchSchema,
})
