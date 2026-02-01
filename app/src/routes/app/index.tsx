import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import type { Geometry } from 'geojson'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { Crosshair, Focus, Save, Satellite } from 'lucide-react'
import { FarmMap, type FarmMapHandle } from '@/components/map/FarmMap'
import { HistoricalPanel, HistoricalPanelButton } from '@/components/satellite/HistoricalPanel'
import { FarmBoundaryDrawer } from '@/components/map/FarmBoundaryDrawer'
import { AnimalLocationStep, PaddockPositionStep } from '@/components/onboarding'
import { LayerSelector } from '@/components/map/LayerSelector'
import { SaveIndicator } from '@/components/map/SaveIndicator'
import { MapAddMenu } from '@/components/map/MapAddMenu'
import { DragPreview, type DragEntityType } from '@/components/map/DragPreview'
import { NoGrazeEditPanel } from '@/components/map/NoGrazeEditPanel'
import { WaterSourceEditPanel } from '@/components/map/WaterSourceEditPanel'
import { BoundarySavedDialog } from '@/components/map/BoundarySavedDialog'
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
import { useFarmBoundary } from '@/lib/hooks/useFarmBoundary'
import { useFarmSettings } from '@/lib/convex/useFarmSettings'
import { useAvailableDates, useAvailableTileDates } from '@/lib/hooks/useSatelliteTiles'
import { useTutorial, getTutorialCompleted } from '@/components/onboarding/tutorial'
import type { Feature, Polygon } from 'geojson'
import type { Paddock, Section } from '@/lib/types'

const searchSchema = z.object({
  editBoundary: z.string().optional(),
  onboarded: z.string().optional(),
  editPaddock: z.string().optional(),
  setAnimalLocation: z.string().optional(),
})

type DrawEntityType = 'paddock' | 'section' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'

// Simplified edit drawer state using typed feature IDs
interface EditDrawerState {
  open: boolean
  // Typed feature ID in format "entityType:entityId" (e.g., "paddock:abc123")
  featureId: string | null
  // Optional geometry for newly created entities
  geometry?: Feature<Polygon>
  // Parent paddock ID for sections (needed for plan sections not in geometry context)
  paddockId?: string
}

function GISRoute() {
  console.log('[_app/index] Rendering GISRoute')
  const navigate = useNavigate()
  const search = useSearch({ from: '/app/' })
  const { activeFarmId, activeFarm, isLoading } = useFarmContext()
  const { briefOpen, setBriefOpen } = useBriefPanel()
  const hasFarmBoundary = activeFarm?.geometry != null
  const { plan } = useTodayPlan(activeFarmId || '')
  const {
    getPaddockById,
    getSectionById,
    addPaddock,
    saveChanges,
    pendingChanges,
    getNoGrazeZoneById,
    getWaterSourceById,
    deleteNoGrazeZone,
    deleteWaterSource,
  } = useGeometry()
  const { startDraw, cancelDraw, isDrawingBoundary, existingGeometry } = useFarmBoundary()
  const { startTutorial } = useTutorial()

  const mapRef = useRef<FarmMapHandle>(null)
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
    featureId: null,
  })
  // Drawing entity type - for creating NEW entities via draw mode
  const [drawEntityType, setDrawEntityType] = useState<DrawEntityType>('paddock')
  // Track when user has explicitly entered edit mode for a section
  const [sectionEditModeActive, setSectionEditModeActive] = useState(false)

  // Derived state from the typed feature ID
  const parsedFeatureId = useMemo(() => {
    if (!editDrawerState.featureId) return null
    return parseTypedFeatureId(editDrawerState.featureId)
  }, [editDrawerState.featureId])

  const selectedEntityType = parsedFeatureId?.entityType as 'paddock' | 'section' | undefined
  const selectedEntityId = parsedFeatureId?.entityId

  // Track whether we're actively editing a section (user clicked "Edit Section" button)
  const isEditingSection = selectedEntityType === 'section' && sectionEditModeActive

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

        // Keep the daily plan closed during paddock editing step
        setBriefOpen(false)

        toast.success('Farm boundary saved!', {
          description: 'Now position your paddock on the map.',
        })

        // Navigate to paddock editing step
        navigate({ to: '/app', search: { editPaddock: 'true' } })
      } catch (err) {
        console.error('[Onboarding Save Effect] Error saving paddock:', err)
        toast.error('Failed to save paddock')
      } finally {
        setPendingOnboardingSave(null)
      }
    }

    doSave()
  }, [pendingOnboardingSave, saveChanges, navigate])

  const handleBoundaryComplete = useCallback(() => {
    // Mark that we're intentionally completing to prevent effect re-triggering
    boundaryCompleteRef.current = true
    // Stop the drawing mode and remove the query param
    cancelDraw()
    navigate({ to: '/app', search: {} })
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
          status: 'ready',
          ndvi: 0.45,
          restDays: 14,
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
    navigate({ to: '/app', search: {} })
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

  // Fetch available NDVI heatmap tile dates for NDVI imagery badge
  const { dates: ndviTileDates } = useAvailableTileDates(activeFarmId ?? undefined, 'ndvi_heatmap')
  const ndviImageryInfo = useMemo(() => {
    if (!ndviTileDates || ndviTileDates.length === 0) return null
    const mostRecent = ndviTileDates[0]
    const captureDate = new Date(mostRecent.date + 'T00:00:00')
    // Sentinel-2 has ~5-day revisit time
    const nextEstimate = new Date(captureDate)
    nextEstimate.setDate(nextEstimate.getDate() + 5)
    return {
      date: mostRecent.date,
      provider: mostRecent.provider,
      nextEstimate,
    }
  }, [ndviTileDates])

  // Derive current satellite layer from state
  const satelliteLayer = showRGBSatellite ? 'rgb' : layers.ndviHeat ? 'ndvi' : null

  // Handle satellite layer change (mutually exclusive)
  const handleSatelliteLayerChange = useCallback((layer: 'ndvi' | 'rgb' | null) => {
    setLayers(prev => ({ ...prev, ndviHeat: layer === 'ndvi' }))
    updateMapPreference('showRGBSatellite', layer === 'rgb')
  }, [updateMapPreference])

  // Historical satellite view state
  const [satelliteViewOpen, setSatelliteViewOpen] = useState(false)

  // Livestock drawer state
  const [livestockDrawerOpen, setLivestockDrawerOpen] = useState(false)

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

  // Check if a section has a pending delete
  const sectionHasPendingDelete = useCallback((sectionId: string) => {
    return pendingChanges.some(
      (c) => !c.synced && c.entityType === 'section' && c.changeType === 'delete' && c.id === sectionId
    )
  }, [pendingChanges])

  // Clip section to paddock bounds (returns null if section has pending delete)
  const clippedSectionGeometry = useMemo(() => {
    if (!todaysSection) return null
    // Don't render section if it has a pending delete
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
    console.log('[handleEditRequest]', request)

    // If creating a new paddock with geometry (double-click on empty space)
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

    // For no-graze zones and water polygons, set draw entity type for the unified draw
    // No separate drawer - they use floating panels
    if (request.entityType === 'noGrazeZone') {
      setDrawEntityType('noGrazeZone')
      // Open the no-graze panel if a zone ID was provided
      if (request.noGrazeZoneId) {
        const zone = getNoGrazeZoneById(request.noGrazeZoneId)
        if (zone) setSelectedNoGrazeZone(zone)
      }
      return
    }

    if (request.entityType === 'waterPolygon') {
      setDrawEntityType('waterPolygon')
      // Open the water source panel if a source ID was provided
      if (request.waterSourceId) {
        const source = getWaterSourceById(request.waterSourceId)
        if (source) setSelectedWaterSource(source)
      }
      return
    }

    // Opening existing paddock or section - use typed feature ID
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

  // Handle entering edit mode for a section (from the "Update Section" button)
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
      mapRef.current?.focusOnGeometry(feature, 120, true) // force=true to override user interaction tracking
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
    if (selectedEntityType === 'paddock' && selectedEntityId) {
      return getPaddockById(selectedEntityId)
    }
    return undefined
  }, [selectedEntityType, selectedEntityId, getPaddockById])

  // Get the parent paddock ID for sections
  // Falls back to editDrawerState.paddockId for plan sections not in geometry context
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
        onEditRequest={search.setAnimalLocation !== 'true' ? handleEditRequest : undefined}
        onNoGrazeZoneClick={search.setAnimalLocation !== 'true' ? handleNoGrazeZoneClick : undefined}
        onWaterSourceClick={search.setAnimalLocation !== 'true' ? handleWaterSourceClick : undefined}
        showNdviHeat={layers.ndviHeat}
        showPaddocks={layers.paddocks}
        showLabels={layers.labels}
        showSections={layers.sections}
        showRGBSatellite={showRGBSatellite}
        editable={search.setAnimalLocation !== 'true'}
        editMode={search.setAnimalLocation !== 'true'}
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

      {/* Paddock Position Step - shown during onboarding after boundary is set */}
      {search.editPaddock === 'true' && (
        <PaddockPositionStep
          onComplete={() => {
            // Save any pending changes and proceed to animal location
            saveChanges().then(() => {
              navigate({ to: '/app', search: { setAnimalLocation: 'true' } })
            })
          }}
        />
      )}

      {/* Animal Location Step - shown during onboarding after paddocks exist */}
      {search.setAnimalLocation === 'true' && activeFarmId && (
        <AnimalLocationStep
          farmExternalId={activeFarmId}
          map={mapInstance}
          onComplete={() => {
            // Clear the query param
            navigate({ to: '/app', search: {} })
            // Trigger tutorial if not completed
            if (!getTutorialCompleted()) {
              startTutorial()
            }
            // Show the daily plan
            setBriefOpen(true)
          }}
          onSkip={() => {
            // Allow skipping - clear the param
            navigate({ to: '/app', search: {} })
            // Trigger tutorial if not completed
            if (!getTutorialCompleted()) {
              startTutorial()
            }
            // Show the daily plan
            setBriefOpen(true)
          }}
        />
      )}

      {/* Historical Satellite button and Livestock - bottom left */}
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

      {/* NDVI Imagery info badge - top center, below save indicator */}
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
            <span className="text-green-200">•</span>
            <span className="text-green-100">{ndviImageryInfo.provider}</span>
          </div>
        </div>
      )}

      {/* Target button - center on farm boundary */}
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

      {/* Add menu - top right */}
      <MapAddMenu
        onAddPaddock={handleAddPaddock}
        onAddNoGrazeZone={handleAddNoGrazeZone}
        onAddWaterSource={handleAddWaterSource}
        onDragStart={handleDragStart}
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
          onEnterModifyMode={handleEnterModifyMode}
          modifyModeActive={planModifyMode?.active ?? false}
          onSaveModification={handleSaveModification}
          onCancelModify={handleCancelModify}
        />
      </FloatingPanel>

      {/* Layer selector - top left */}
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

      {/* Section Edit Drawer - right side */}
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

      {/* Boundary saved dialog - offer to refresh satellite imagery */}
      <BoundarySavedDialog
        open={boundarySavedDialogOpen}
        onOpenChange={setBoundarySavedDialogOpen}
      />

      {/* Livestock drawer */}
      <LivestockDrawer
        open={livestockDrawerOpen}
        onOpenChange={setLivestockDrawerOpen}
      />
    </div>
  )
}

export const Route = createFileRoute('/app/')({
  component: GISRoute,
  validateSearch: searchSchema,
})
