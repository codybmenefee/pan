import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import type { Geometry } from 'geojson'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { Calendar, CheckCircle, Focus, Save, Satellite } from 'lucide-react'
import { FarmMap, type FarmMapHandle } from '@/components/map/FarmMap'
import { HistoricalSatelliteView } from '@/components/satellite/HistoricalSatelliteView'
import { FarmBoundaryDrawer } from '@/components/map/FarmBoundaryDrawer'
import { LayerToggles } from '@/components/map/LayerToggles'
import { SaveIndicator } from '@/components/map/SaveIndicator'
import { MapAddMenu } from '@/components/map/MapAddMenu'
import { DragPreview, type DragEntityType } from '@/components/map/DragPreview'
import { NoGrazeEditPanel } from '@/components/map/NoGrazeEditPanel'
import { WaterSourceEditPanel } from '@/components/map/WaterSourceEditPanel'
import { SatelliteFetchBanner } from '@/components/map/SatelliteFetchBanner'
import { BoundarySavedDialog } from '@/components/map/BoundarySavedDialog'
import type { NoGrazeZone, WaterSource, WaterSourceType, NoGrazeZoneType, WaterSourceStatus } from '@/lib/types'
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
import { useFarmSettings } from '@/lib/convex/useFarmSettings'
import { useAvailableDates } from '@/lib/hooks/useSatelliteTiles'
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
    saveChanges,
    getNoGrazeZoneById,
    getWaterSourceById,
    updateNoGrazeZoneMetadata,
    deleteNoGrazeZone,
    updateWaterSourceMetadata,
    deleteWaterSource,
  } = useGeometry()
  const { startDraw, cancelDraw, isDrawingBoundary, existingGeometry } = useFarmBoundary()

  const mapRef = useRef<FarmMapHandle>(null)
  // Close daily plan modal by default during onboarding/boundary edit flow
  const [briefOpen, setBriefOpen] = useState(() =>
    search.onboarded !== 'true' && search.editBoundary !== 'true'
  )
  const [mapInstance, setMapInstance] = useState<ReturnType<FarmMapHandle['getMap']>>(null)

  // Track when we need to save after creating a paddock during onboarding
  const [pendingOnboardingSave, setPendingOnboardingSave] = useState<{
    paddockId: string
    geometry: Feature<Polygon>
  } | null>(null)

  // Track if we've done the initial check for plan status
  const initialPlanCheckDone = useRef(false)

  // Close the modal on initial load if the plan is already approved
  useEffect(() => {
    if (!initialPlanCheckDone.current && plan !== undefined) {
      initialPlanCheckDone.current = true
      if (plan && (plan.status === 'approved' || plan.status === 'modified')) {
        setBriefOpen(false)
      }
    }
  }, [plan])

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

  // State declarations - must come before callbacks that use them
  const [editDrawerState, setEditDrawerState] = useState<EditDrawerState>({
    open: false,
    entityType: 'paddock',
  })
  const [drawEntityType, setDrawEntityType] = useState<DrawEntityType>('paddock')

  // Track when we're intentionally completing the boundary edit (to prevent re-triggering)
  const boundaryCompleteRef = useRef(false)

  // Handle ?editBoundary=true query param
  const editBoundaryParam = search.editBoundary === 'true'
  useEffect(() => {
    // Don't re-trigger if we just completed/canceled
    if (boundaryCompleteRef.current) {
      boundaryCompleteRef.current = false
      return
    }
    if (editBoundaryParam && !isDrawingBoundary) {
      startDraw()
    }
  }, [editBoundaryParam, isDrawingBoundary, startDraw])

  // Track if we've already processed the onboarding boundary save
  const onboardingProcessedRef = useRef(false)

  // Effect to save paddock after it's been added during onboarding
  // This ensures saveChanges has access to the updated pendingChanges
  useEffect(() => {
    if (!pendingOnboardingSave) return

    const { paddockId, geometry } = pendingOnboardingSave

    const doSave = async () => {
      console.log('[Onboarding Save Effect] Saving paddock:', paddockId)
      try {
        await saveChanges()
        console.log('[Onboarding Save Effect] Save completed successfully')

        // Focus on the new paddock
        mapRef.current?.focusOnGeometry(geometry, 100)

        // Keep the daily plan closed during paddock editing
        setBriefOpen(false)

        // Open the paddock edit drawer so user can customize
        setEditDrawerState({
          open: true,
          entityType: 'paddock',
          paddockId,
          geometry,
        })
        setDrawEntityType('paddock')

        toast.success('Farm boundary saved!', {
          description: 'We created a starter paddock for you. Resize and rename it below.',
        })
      } catch (err) {
        console.error('[Onboarding Save Effect] Error saving paddock:', err)
        toast.error('Failed to save paddock')
      } finally {
        setPendingOnboardingSave(null)
      }
    }

    doSave()
  }, [pendingOnboardingSave, saveChanges])

  const handleBoundaryComplete = useCallback(() => {
    // Mark that we're intentionally completing to prevent effect re-triggering
    boundaryCompleteRef.current = true
    // Stop the drawing mode and remove the query param
    cancelDraw()
    navigate({ to: '/', search: {} })
  }, [cancelDraw, navigate])

  const handleBoundarySaved = useCallback(async (_geometry: Feature<Polygon>) => {
    console.log('[handleBoundarySaved] Called, onboarded:', search.onboarded, 'processed:', onboardingProcessedRef.current)

    // If this is post-onboarding, create a centered paddock
    if (search.onboarded === 'true' && !onboardingProcessedRef.current) {
      onboardingProcessedRef.current = true

      const map = mapRef.current?.getMap()
      console.log('[handleBoundarySaved] Map instance:', !!map)
      if (!map) {
        console.error('[handleBoundarySaved] No map instance available!')
        toast.error('Could not create paddock - map not ready')
        return
      }

      // Create a 100px × 100px paddock centered on screen
      const container = map.getContainer()
      const centerX = container.clientWidth / 2
      const centerY = container.clientHeight / 2
      const halfSize = 50 // 100px / 2

      console.log('[handleBoundarySaved] Screen dimensions:', {
        width: container.clientWidth,
        height: container.clientHeight,
        centerX,
        centerY
      })

      // Convert screen coordinates to geographic coordinates
      const topLeft = map.unproject([centerX - halfSize, centerY - halfSize])
      const bottomRight = map.unproject([centerX + halfSize, centerY + halfSize])

      console.log('[handleBoundarySaved] Geographic bounds:', {
        topLeft: { lng: topLeft.lng, lat: topLeft.lat },
        bottomRight: { lng: bottomRight.lng, lat: bottomRight.lat }
      })

      const paddockGeometry: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [topLeft.lng, topLeft.lat],
            [bottomRight.lng, topLeft.lat],
            [bottomRight.lng, bottomRight.lat],
            [topLeft.lng, bottomRight.lat],
            [topLeft.lng, topLeft.lat],
          ]],
        },
      }

      console.log('[handleBoundarySaved] Paddock geometry created:', JSON.stringify(paddockGeometry.geometry.coordinates))

      try {
        const paddockId = addPaddock(paddockGeometry, {
          name: 'Main Paddock',
          status: 'recovering',
          ndvi: 0.35,
          restDays: 0,
          waterAccess: 'None',
        })

        console.log('[handleBoundarySaved] Created paddock with ID:', paddockId)

        // Trigger save via effect - this ensures saveChanges has updated pendingChanges
        setPendingOnboardingSave({ paddockId, geometry: paddockGeometry })
      } catch (err) {
        console.error('[handleBoundarySaved] Error creating paddock:', err)
        toast.error('Failed to create paddock')
      }
    } else {
      // For non-onboarding boundary edits, show the satellite refresh dialog
      console.log('[handleBoundarySaved] Opening satellite refresh dialog')
      setBoundarySavedDialogOpen(true)
    }
  }, [search.onboarded, addPaddock])

  const handleBoundaryCancel = useCallback(() => {
    // Mark that we're intentionally canceling to prevent effect re-triggering
    boundaryCompleteRef.current = true
    cancelDraw()
    navigate({ to: '/', search: {} })
  }, [cancelDraw, navigate])
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

  // RGB satellite toggle is persisted in settings
  const { settings, updateMapPreference } = useFarmSettings()
  const showRGBSatellite = settings.mapPreferences?.showRGBSatellite ?? false

  const handleToggleRGB = useCallback((enabled: boolean) => {
    updateMapPreference('showRGBSatellite', enabled)
  }, [updateMapPreference])

  // Fetch available satellite dates for RGB imagery badge
  const { dates: availableDates } = useAvailableDates(activeFarmId ?? undefined)
  const rgbImageryInfo = useMemo(() => {
    if (!availableDates || availableDates.length === 0) return null
    const mostRecent = availableDates[0]
    const captureDate = new Date(mostRecent.date + 'T00:00:00')
    // Sentinel-2 has ~5-day revisit time
    const nextEstimate = new Date(captureDate)
    nextEstimate.setDate(nextEstimate.getDate() + 5)
    return {
      date: mostRecent.date,
      provider: mostRecent.provider,
      nextEstimate,
    }
  }, [availableDates])

  // Historical satellite view state
  const [satelliteViewOpen, setSatelliteViewOpen] = useState(false)

  // Boundary saved dialog state - show after non-onboarding boundary save
  const [boundarySavedDialogOpen, setBoundarySavedDialogOpen] = useState(false)

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
    entityType: 'paddock' | 'section' | 'noGrazeZone' | 'waterPolygon'
    paddockId?: string
    sectionId?: string
    noGrazeZoneId?: string
    waterSourceId?: string
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

    // For no-graze zones and water polygons, just enter edit mode
    // The geometries will be loaded into draw by the FarmMap effects
    if (request.entityType === 'noGrazeZone' || request.entityType === 'waterPolygon') {
      setDrawEntityType(request.entityType)
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

  const handleNoGrazeZoneSave = useCallback((id: string, updates: { name?: string; type?: NoGrazeZoneType; description?: string }) => {
    updateNoGrazeZoneMetadata(id, updates)
    setSelectedNoGrazeZone(null)
  }, [updateNoGrazeZoneMetadata])

  const handleNoGrazeZoneDelete = useCallback((id: string) => {
    deleteNoGrazeZone(id)
    setSelectedNoGrazeZone(null)
  }, [deleteNoGrazeZone])

  const handleWaterSourceSave = useCallback((id: string, updates: { name?: string; type?: WaterSourceType; status?: WaterSourceStatus; description?: string }) => {
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
        showNdviHeat={layers.ndviHeat}
        showPaddocks={layers.paddocks}
        showLabels={layers.labels}
        showSections={layers.sections}
        showRGBSatellite={showRGBSatellite}
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
          isPostOnboarding={search.onboarded === 'true'}
          onBoundarySaved={handleBoundarySaved}
          existingBoundary={existingGeometry}
        />
      )}

      {/* Layer toggles - bottom left */}
      <div className="absolute bottom-2 left-2 z-10">
        <LayerToggles
          layers={{ ...layers, rgbSatellite: showRGBSatellite }}
          onToggle={toggleLayer}
          onToggleRGB={handleToggleRGB}
          showEditToggle={false}
        />
      </div>

      {/* Historical Satellite button - bottom left, above layer toggles */}
      <div className="absolute bottom-14 left-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSatelliteViewOpen(true)}
          className="gap-1 h-7 text-xs shadow-lg bg-white"
        >
          <Satellite className="h-3.5 w-3.5" />
          Historical
        </Button>
      </div>

      {/* Historical Satellite View */}
      {activeFarmId && (
        <HistoricalSatelliteView
          farmId={activeFarmId}
          map={mapInstance}
          isOpen={satelliteViewOpen}
          onClose={() => setSatelliteViewOpen(false)}
        />
      )}

      {/* Save indicator - top center */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10">
        <SaveIndicator />
      </div>

      {/* RGB Imagery info badge - top center, below save indicator */}
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
            <span className="text-blue-200">•</span>
            <span className="text-blue-100">
              Next: ~{rgbImageryInfo.nextEstimate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}

      {/* Add menu - below save indicator */}
      <MapAddMenu
        onAddPaddock={handleAddPaddock}
        onAddNoGrazeZone={handleAddNoGrazeZone}
        onAddWaterSource={handleAddWaterSource}
        onDragStart={handleDragStart}
        className="top-9"
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
        initialPosition={{ x: 44, y: 44 }}
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
        <div className="absolute top-11 left-2 z-10">
          {plan?.status === 'approved' || plan?.status === 'modified' ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setBriefOpen(true)}
              className="gap-1 h-6 text-xs shadow-lg bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approved
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => setBriefOpen(true)}
              className="gap-1 h-6 text-xs shadow-lg"
            >
              <Calendar className="h-3.5 w-3.5" />
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

      {/* Satellite fetch processing banner */}
      <SatelliteFetchBanner />

      {/* Boundary saved dialog - offer to refresh satellite imagery */}
      <BoundarySavedDialog
        open={boundarySavedDialogOpen}
        onOpenChange={setBoundarySavedDialogOpen}
      />
    </div>
  )
}

export const Route = createFileRoute('/_app/')({
  component: GISRoute,
  validateSearch: searchSchema,
})
