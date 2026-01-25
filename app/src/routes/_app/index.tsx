import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import type { Geometry } from 'geojson'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { Calendar } from 'lucide-react'
import { FarmMap, type FarmMapHandle } from '@/components/map/FarmMap'
import { FarmBoundaryDrawer } from '@/components/map/FarmBoundaryDrawer'
import { LayerToggles } from '@/components/map/LayerToggles'
import { SaveIndicator } from '@/components/map/SaveIndicator'
import { MorningBrief } from '@/components/brief/MorningBrief'
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
})

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
  const { getPaddockById, addPaddock } = useGeometry()
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

  const [layers, setLayers] = useState({
    satellite: false,
    ndviHeat: false,
    paddocks: true,
    labels: true,
    sections: true,
  })

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
  }, [addPaddock])

  const closeEditDrawer = useCallback(() => {
    setEditDrawerState({
      open: false,
      entityType: 'paddock',
    })
  }, [])

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
        showSatellite={layers.satellite}
        showNdviHeat={layers.ndviHeat}
        showPaddocks={layers.paddocks}
        showLabels={layers.labels}
        showSections={layers.sections}
        editable={true}
        editMode={true}
        entityType={editDrawerState.entityType}
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

      {/* Save indicator - top right */}
      <div className="absolute top-3 right-3 z-10">
        <SaveIndicator />
      </div>

      {/* Daily Plan Floating Panel */}
      <FloatingPanel
        open={briefOpen}
        onOpenChange={setBriefOpen}
        title="Daily Plan"
        defaultWidth={600}
        defaultHeight={600}
        minWidth={320}
        maxWidth={600}
        minHeight={300}
        initialPosition={{ x: 64, y: 64 }}
      >
        <MorningBrief farmExternalId={activeFarmId} compact onClose={() => setBriefOpen(false)} onZoomToSection={handleZoomToSection} />
      </FloatingPanel>

      {/* Toggle button when panel is closed */}
      {!briefOpen && (
        <div className="absolute top-16 left-3 z-10">
          <Button
            variant="default"
            size="sm"
            onClick={() => setBriefOpen(true)}
            className="gap-2 shadow-lg"
          >
            <Calendar className="h-4 w-4" />
            Daily Plan
          </Button>
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
    </div>
  )
}

export const Route = createFileRoute('/_app/')({
  component: GISRoute,
  validateSearch: searchSchema,
})
