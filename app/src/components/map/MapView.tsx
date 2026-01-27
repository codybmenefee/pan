import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearch } from '@tanstack/react-router'
import { Crosshair } from 'lucide-react'
import { FarmMap, type FarmMapHandle } from './FarmMap'
import { PaddockPanel } from './PaddockPanel'
import { PaddockEditPanel } from './PaddockEditPanel'
import { NoGrazeEditPanel } from './NoGrazeEditPanel'
import { WaterSourceEditPanel } from './WaterSourceEditPanel'
import { LayerToggles } from './LayerToggles'
import { MapAddMenu } from './MapAddMenu'
import { Button } from '@/components/ui/button'
import { useGeometry, clipPolygonToPolygon } from '@/lib/geometry'
import { useTodayPlan } from '@/lib/convex/usePlan'
import { useCurrentUser } from '@/lib/convex/useCurrentUser'
import { useFarmSettings } from '@/lib/convex/useFarmSettings'
import { useFarmBoundary } from '@/lib/hooks/useFarmBoundary'
import type { Paddock, Section, SectionAlternative, NoGrazeZone, WaterSource } from '@/lib/types'
import type { Feature, Polygon } from 'geojson'

interface MapSearchParams {
  edit?: boolean
  paddockId?: string
  sectionId?: string
  entityType?: 'paddock' | 'section'
}

export function MapView() {
  const search = useSearch({ strict: false }) as MapSearchParams

  const { farmId } = useCurrentUser()
  const { plan } = useTodayPlan(farmId || '')
  const { settings, updateMapPreference } = useFarmSettings()
  const { hasBoundary: hasFarmBoundary } = useFarmBoundary()

  const [selectedPaddock, setSelectedPaddock] = useState<Paddock | null>(null)
  const [selectedNoGrazeZone, setSelectedNoGrazeZone] = useState<NoGrazeZone | null>(null)
  const [selectedWaterSource, setSelectedWaterSource] = useState<WaterSource | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [entityType, setEntityType] = useState<'paddock' | 'section' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'>('paddock')
  const [focusPaddockId, setFocusPaddockId] = useState<string | undefined>(undefined)
  const [editSectionFeature, setEditSectionFeature] = useState<Feature<Polygon> | null>(null)
  const [editSectionId, setEditSectionId] = useState<string | undefined>(undefined)
  const [initialPaddockId, setInitialPaddockId] = useState<string | undefined>(undefined)
  const mapRef = useRef<FarmMapHandle>(null)
  const {
    getSectionById,
    getPaddockById,
    addPaddock,
    sections,
    deleteNoGrazeZone,
    deleteWaterSource,
    getNoGrazeZoneById,
    getWaterSourceById,
  } = useGeometry()
  
  const [layers, setLayers] = useState({
    ndviHeat: false,
    paddocks: true,
    labels: true,
    sections: true,
  })

  // RGB satellite toggle is persisted in settings
  const showRGBSatellite = settings.mapPreferences?.showRGBSatellite ?? false

  const handleToggleRGB = useCallback((enabled: boolean) => {
    updateMapPreference('showRGBSatellite', enabled)
  }, [updateMapPreference])

  // Extract today's section from plan or fallback to most recent section
  const todaysSection = useMemo<Section | null>(() => {
    console.log('[MapView] Computing todaysSection, plan:', plan ? { id: plan._id, hasSectionGeometry: !!plan.sectionGeometry } : null)
    console.log('[MapView] sections from useGeometry:', sections.length, sections.map(s => ({ id: s.id, paddockId: s.paddockId })))
    
    if (plan?.sectionGeometry) {
      const section = {
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
      console.log('[MapView] Created todaysSection from plan:', section.id, section.paddockId)
      return section
    }
    // Fallback to most recent section from geometry context
    const fallback = sections[0] ?? null
    console.log('[MapView] Using fallback section:', fallback?.id)
    return fallback
  }, [plan, sections])

  // Initialize from URL search params on mount
  useEffect(() => {
    // Only enter edit mode if explicitly requested via URL params
    if (search.edit) {
      setEditMode(true)
      if (search.entityType === 'section') {
        setEntityType('section')
      }
      if (search.paddockId) {
        setFocusPaddockId(search.paddockId)
      }
    }
  }, [search.edit, search.entityType, search.paddockId])

  const sectionFeature = useMemo<Section | SectionAlternative | null>(() => {
    if (search.entityType !== 'section' || !search.sectionId) {
      // Return today's section when no specific section is requested
      return todaysSection
    }
    const section = getSectionById(search.sectionId)
    if (section) return section
    if (todaysSection?.id === search.sectionId) {
      return todaysSection
    }
    return null
  }, [getSectionById, search.entityType, search.sectionId, todaysSection])

  const sectionPaddockId = useMemo(() => {
    if (search.paddockId) return search.paddockId
    if (sectionFeature && 'paddockId' in sectionFeature) return sectionFeature.paddockId
    const props = sectionFeature?.geometry?.properties as { paddockId?: string } | undefined
    return props?.paddockId
  }, [search.paddockId, sectionFeature])

  const sectionPaddock = useMemo(() => {
    if (!sectionPaddockId) return undefined
    return getPaddockById(sectionPaddockId)
  }, [getPaddockById, sectionPaddockId])

  const clippedSectionGeometry = useMemo(() => {
    if (!sectionFeature) return null
    if (!sectionPaddock) return sectionFeature.geometry
    const clipped = clipPolygonToPolygon(sectionFeature.geometry, sectionPaddock.geometry)
    return clipped ?? sectionPaddock.geometry
  }, [sectionFeature, sectionPaddock])

  const effectiveSectionGeometry = editSectionFeature ?? clippedSectionGeometry ?? 
    (search.entityType !== 'section' && !search.sectionId && todaysSection ? todaysSection.geometry : null)
  const effectiveSectionId = editSectionId ?? sectionFeature?.id

  // Focus map on section bounds when available
  useEffect(() => {
    if (editMode) return
    if (!effectiveSectionGeometry) return

    const tryFocus = () => {
      if (mapRef.current) {
        mapRef.current.focusOnGeometry(effectiveSectionGeometry)
        return true
      }
      return false
    }

    if (tryFocus()) return

    const timeouts = [100, 300, 600, 1000]
    const timers = timeouts.map((delay) =>
      setTimeout(() => tryFocus(), delay)
    )

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [editMode, effectiveSectionGeometry])

  // Focus map on paddock when editing sections
  // Use a retry mechanism since the map ref might not be ready immediately
  useEffect(() => {
    if (editMode) return
    if (!focusPaddockId || effectiveSectionGeometry) return

    const tryFocus = () => {
      if (mapRef.current) {
        mapRef.current.focusOnPaddock(focusPaddockId)
        return true
      }
      return false
    }
    
    // Try immediately
    if (tryFocus()) return
    
    // Retry with delays if not ready
    const timeouts = [100, 300, 600, 1000]
    const timers = timeouts.map((delay) => 
      setTimeout(() => tryFocus(), delay)
    )
    
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [editMode, focusPaddockId, effectiveSectionGeometry])

  // Focus map on today's section by default when navigating via sidebar
  useEffect(() => {
    if (editMode) return
    console.log('[MapView] Focus effect running, todaysSection:', todaysSection?.id, 'search:', search)
    if (search.edit || search.sectionId) {
      console.log('[MapView] Skipping focus - edit mode or specific section requested')
      return
    }
    if (!todaysSection) {
      console.log('[MapView] Skipping focus - no todaysSection')
      return
    }
    if (effectiveSectionGeometry) {
      console.log('[MapView] Skipping focus - effectiveSectionGeometry already set')
      return
    }

    const tryFocus = () => {
      if (mapRef.current) {
        console.log('[MapView] Focusing on todaysSection geometry')
        mapRef.current.focusOnGeometry(todaysSection.geometry)
        return true
      }
      return false
    }

    if (tryFocus()) return

    const timeouts = [100, 300, 600, 1000]
    const timers = timeouts.map((delay) =>
      setTimeout(() => {
        console.log('[MapView] Retry focus attempt')
        tryFocus()
      }, delay)
    )

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [editMode, search.edit, search.sectionId, todaysSection, effectiveSectionGeometry])

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
    console.log('[MapView] handleEditRequest called:', request)
    const isDuplicateSection =
      editMode &&
      request.entityType === 'section' &&
      entityType === 'section' &&
      request.sectionId &&
      request.sectionId === editSectionId
    const sameEffectiveSection =
      editMode &&
      entityType === 'section' &&
      request.entityType === 'section' &&
      request.sectionId &&
      request.sectionId === effectiveSectionId
    if (isDuplicateSection || sameEffectiveSection) {
      return
    }
    setEditMode(true)
    setEntityType(request.entityType)
    let nextFocusPaddockId: string | undefined
    let nextInitialPaddockId: string | undefined
    let nextEditSectionId: string | undefined

    if (request.entityType === 'section') {
      setSelectedPaddock(null)
      setSelectedNoGrazeZone(null)
      setSelectedWaterSource(null)
      nextFocusPaddockId = request.paddockId
      nextEditSectionId = request.sectionId
      nextInitialPaddockId = undefined
      setFocusPaddockId(nextFocusPaddockId)
      setEditSectionFeature(request.geometry ?? null)
      setEditSectionId(nextEditSectionId)
      setInitialPaddockId(nextInitialPaddockId)
    } else if (request.entityType === 'noGrazeZone') {
      // For no-graze zones, enter edit mode and select the zone to show the edit panel
      console.log('[MapView] handleEditRequest noGrazeZone:', { noGrazeZoneId: request.noGrazeZoneId })
      setSelectedPaddock(null)
      setSelectedWaterSource(null)
      setEditSectionFeature(null)
      setEditSectionId(undefined)
      setFocusPaddockId(undefined)
      setInitialPaddockId(undefined)
      // Look up and select the zone to show the edit panel
      if (request.noGrazeZoneId) {
        const zone = getNoGrazeZoneById(request.noGrazeZoneId)
        console.log('[MapView] getNoGrazeZoneById result:', { zoneId: request.noGrazeZoneId, found: !!zone, zone })
        if (zone) {
          setSelectedNoGrazeZone(zone)
        }
      } else {
        setSelectedNoGrazeZone(null)
      }
    } else if (request.entityType === 'waterPolygon') {
      // For water sources, enter edit mode and select the source to show the edit panel
      console.log('[MapView] handleEditRequest waterPolygon:', { waterSourceId: request.waterSourceId })
      setSelectedPaddock(null)
      setSelectedNoGrazeZone(null)
      setEditSectionFeature(null)
      setEditSectionId(undefined)
      setFocusPaddockId(undefined)
      setInitialPaddockId(undefined)
      // Look up and select the source to show the edit panel
      if (request.waterSourceId) {
        const source = getWaterSourceById(request.waterSourceId)
        console.log('[MapView] getWaterSourceById result:', { sourceId: request.waterSourceId, found: !!source, source })
        if (source) {
          setSelectedWaterSource(source)
        }
      } else {
        setSelectedWaterSource(null)
      }
    } else {
      // For paddocks, enter edit mode and select the paddock to show the edit panel
      setSelectedNoGrazeZone(null)
      setSelectedWaterSource(null)
      setEditSectionFeature(null)
      setEditSectionId(undefined)
      nextEditSectionId = undefined
      if (request.geometry) {
        const newId = addPaddock(request.geometry)
        nextFocusPaddockId = newId
        nextInitialPaddockId = newId
        setFocusPaddockId(nextFocusPaddockId)
        setInitialPaddockId(nextInitialPaddockId)
        setSelectedPaddock(null) // New paddock, no selection yet
      } else if (request.paddockId) {
        // Look up and select the paddock to show the edit panel
        const paddock = getPaddockById(request.paddockId)
        if (paddock) {
          setSelectedPaddock(paddock)
        } else {
          setSelectedPaddock(null)
        }
        nextFocusPaddockId = request.paddockId
        nextInitialPaddockId = request.paddockId
        setFocusPaddockId(nextFocusPaddockId)
        setInitialPaddockId(nextInitialPaddockId)
      } else {
        setSelectedPaddock(null)
      }
    }
  }, [addPaddock, editMode, entityType, editSectionId, effectiveSectionId, getNoGrazeZoneById, getWaterSourceById, getPaddockById])

  const handleEditPaddockSelect = useCallback((paddock: Paddock | null) => {
    setSelectedPaddock(paddock)
  }, [])

  const handleNoGrazeZoneClick = useCallback((zoneId: string) => {
    const zone = getNoGrazeZoneById(zoneId)
    if (zone) {
      setSelectedNoGrazeZone(zone)
      setSelectedPaddock(null)
      setSelectedWaterSource(null)
      setEditMode(true)
      setEntityType('noGrazeZone')
    }
  }, [getNoGrazeZoneById])

  const handleWaterSourceClick = useCallback((sourceId: string) => {
    const source = getWaterSourceById(sourceId)
    if (source) {
      setSelectedWaterSource(source)
      setSelectedPaddock(null)
      setSelectedNoGrazeZone(null)
      setEditMode(true)
      setEntityType('waterPolygon')
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

  return (
    <div className="flex h-full">
      {/* Map area */}
      <div className="relative flex-1">
        <FarmMap
          ref={mapRef}
          onPaddockClick={(paddock) => {
            setSelectedPaddock(paddock)
            setEditMode(true)
            setEntityType('paddock')
            setInitialPaddockId(paddock.id)
          }}
          onEditPaddockSelect={handleEditPaddockSelect}
          onEditRequest={handleEditRequest}
          onNoGrazeZoneClick={handleNoGrazeZoneClick}
          onWaterSourceClick={handleWaterSourceClick}
          selectedPaddockId={selectedPaddock?.id}
          showNdviHeat={layers.ndviHeat}
          showPaddocks={layers.paddocks}
          showLabels={layers.labels}
          showSections={layers.sections}
          showRGBSatellite={showRGBSatellite}
          editable={true}
          editMode={editMode}
          entityType={entityType}
          parentPaddockId={entityType === 'section' ? focusPaddockId : undefined}
          initialSectionFeature={effectiveSectionGeometry ?? undefined}
          initialSectionId={effectiveSectionId}
          initialPaddockId={initialPaddockId}
          initialNoGrazeZoneId={selectedNoGrazeZone?.id}
          initialWaterSourceId={selectedWaterSource?.id}
          toolbarPosition="top-left"
        />
        
        {/* Edit mode indicator */}
        {editMode && (
          <div className="absolute top-2 right-2 z-10">
            <div className="rounded-lg border border-primary bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
              Editing {entityType === 'section' ? 'Sections' : entityType === 'noGrazeZone' ? 'No-graze Zone' : entityType === 'waterPoint' || entityType === 'waterPolygon' ? 'Water Source' : 'Paddocks'}
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

        {/* Add menu (visible when not in edit mode) */}
        {!editMode && (
          <MapAddMenu
            onAddPaddock={() => {
              // Create a new paddock at the center of the map
              const paddockId = mapRef.current?.createPaddockAtCenter()
              if (paddockId) {
                // Enter edit mode with the new paddock selected
                // FarmMap will handle selecting the paddock via onEditPaddockSelect
                setEditMode(true)
                setEntityType('paddock')
                setEditSectionFeature(null)
                setEditSectionId(undefined)
                setFocusPaddockId(paddockId)
                setInitialPaddockId(paddockId)
              }
            }}
            onAddNoGrazeZone={() => {
              setEditMode(true)
              setEntityType('noGrazeZone')
              setSelectedPaddock(null)
            }}
            onAddWaterSource={(geometryType) => {
              setEditMode(true)
              setEntityType(geometryType === 'point' ? 'waterPoint' : 'waterPolygon')
              setSelectedPaddock(null)
            }}
          />
        )}
        
        {/* Layer toggles */}
        <div className="absolute bottom-2 left-2 z-10">
          <LayerToggles
            layers={{ ...layers, rgbSatellite: showRGBSatellite }}
            onToggle={toggleLayer}
            onToggleRGB={handleToggleRGB}
          />
        </div>
      </div>

      {/* Side panel */}
      {selectedPaddock && !editMode && (
        <PaddockPanel
          paddock={selectedPaddock}
          onClose={() => setSelectedPaddock(null)}
        />
      )}

      {selectedPaddock && editMode && entityType === 'paddock' && (
        <PaddockEditPanel
          paddock={selectedPaddock}
          open={true}
          onClose={() => {
            setSelectedPaddock(null)
            mapRef.current?.setDrawMode('simple_select')
          }}
        />
      )}

      {selectedNoGrazeZone && (
        <NoGrazeEditPanel
          zone={selectedNoGrazeZone}
          open={true}
          onDelete={handleNoGrazeZoneDelete}
          onClose={() => setSelectedNoGrazeZone(null)}
        />
      )}

      {selectedWaterSource && (
        <WaterSourceEditPanel
          source={selectedWaterSource}
          open={true}
          onDelete={handleWaterSourceDelete}
          onClose={() => setSelectedWaterSource(null)}
        />
      )}
    </div>
  )
}
