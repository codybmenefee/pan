import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { FarmMap, type FarmMapHandle } from './FarmMap'
import { PaddockPanel } from './PaddockPanel'
import { PaddockEditPanel } from './PaddockEditPanel'
import { LayerToggles } from './LayerToggles'
import { useGeometry, clipPolygonToPolygon } from '@/lib/geometry'
import { useTodayPlan } from '@/lib/convex/usePlan'
import { useCurrentUser } from '@/lib/convex/useCurrentUser'
import type { Paddock, Section, SectionAlternative } from '@/lib/types'
import type { Feature, Polygon } from 'geojson'

interface MapSearchParams {
  edit?: boolean
  paddockId?: string
  sectionId?: string
  entityType?: 'paddock' | 'section'
}

export function MapView() {
  const search = useSearch({ strict: false }) as MapSearchParams
  const navigate = useNavigate()
  
  const { farmId } = useCurrentUser()
  const { plan } = useTodayPlan(farmId || '')
  
  const [selectedPaddock, setSelectedPaddock] = useState<Paddock | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [entityType, setEntityType] = useState<'paddock' | 'section'>('paddock')
  const [focusPaddockId, setFocusPaddockId] = useState<string | undefined>(undefined)
  const [editSectionFeature, setEditSectionFeature] = useState<Feature<Polygon> | null>(null)
  const [editSectionId, setEditSectionId] = useState<string | undefined>(undefined)
  const [initialPaddockId, setInitialPaddockId] = useState<string | undefined>(undefined)
  const mapRef = useRef<FarmMapHandle>(null)
  const { getSectionById, getPaddockById, addPaddock, sections } = useGeometry()
  
  const [layers, setLayers] = useState({
    satellite: false,
    ndviHeat: false,
    paddocks: true,
    labels: true,
    sections: true,
  })

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
    // If no search params but we have a plan with a section, redirect to edit mode
    if (!search.edit && !search.entityType && plan?.sectionGeometry) {
      navigate({
        to: '/map',
        search: {
          edit: true,
          entityType: 'section',
          paddockId: plan.primaryPaddockExternalId || '',
          sectionId: plan._id,
        },
        replace: true,
      })
      return
    }

    if (search.edit) {
      setEditMode(true)
      // When editing sections, show satellite imagery
      if (search.entityType === 'section') {
        setEntityType('section')
        setLayers(prev => ({ ...prev, satellite: true }))
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
  }, [effectiveSectionGeometry])

  // Focus map on paddock when editing sections
  // Use a retry mechanism since the map ref might not be ready immediately
  useEffect(() => {
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
  }, [focusPaddockId, effectiveSectionGeometry])

  // Focus map on today's section by default when navigating via sidebar
  useEffect(() => {
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
  }, [search.edit, search.sectionId, todaysSection, effectiveSectionGeometry])

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }

  const toggleEditMode = () => {
    setEditMode((prev) => !prev)
    // Clear selection when entering edit mode
    if (!editMode) {
      setSelectedPaddock(null)
    } else {
      // Reset entity type when exiting edit mode
      setEntityType('paddock')
      setFocusPaddockId(undefined)
      setEditSectionFeature(null)
      setEditSectionId(undefined)
      setInitialPaddockId(undefined)
    }
  }

  const handleEditRequest = useCallback((request: {
    entityType: 'paddock' | 'section'
    paddockId?: string
    sectionId?: string
    geometry?: Feature<Polygon>
  }) => {
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
    setSelectedPaddock(null)
    let nextFocusPaddockId: string | undefined
    let nextInitialPaddockId: string | undefined
    let nextEditSectionId: string | undefined

    if (request.entityType === 'section') {
      setLayers(prev => ({ ...prev, satellite: true }))
      nextFocusPaddockId = request.paddockId
      nextEditSectionId = request.sectionId
      nextInitialPaddockId = undefined
      setFocusPaddockId(nextFocusPaddockId)
      setEditSectionFeature(request.geometry ?? null)
      setEditSectionId(nextEditSectionId)
      setInitialPaddockId(nextInitialPaddockId)
    } else {
      setEditSectionFeature(null)
      setEditSectionId(undefined)
      nextEditSectionId = undefined
      if (request.geometry) {
        const newId = addPaddock(request.geometry)
        nextFocusPaddockId = newId
        nextInitialPaddockId = newId
        setFocusPaddockId(nextFocusPaddockId)
        setInitialPaddockId(nextInitialPaddockId)
      } else {
        nextFocusPaddockId = request.paddockId
        nextInitialPaddockId = request.paddockId
        setFocusPaddockId(nextFocusPaddockId)
        setInitialPaddockId(nextInitialPaddockId)
      }
    }
  }, [addPaddock, editMode, entityType, editSectionId, effectiveSectionId])

  const handleEditPaddockSelect = useCallback((paddock: Paddock | null) => {
    setSelectedPaddock(paddock)
  }, [])

  return (
    <div className="flex h-full">
      {/* Map area */}
      <div className="relative flex-1">
        <FarmMap
          ref={mapRef}
          onPaddockClick={setSelectedPaddock}
          onEditPaddockSelect={handleEditPaddockSelect}
          onEditRequest={handleEditRequest}
          selectedPaddockId={selectedPaddock?.id}
          showSatellite={layers.satellite}
          showNdviHeat={layers.ndviHeat}
          showPaddocks={layers.paddocks}
          showLabels={layers.labels}
          showSections={layers.sections}
          editable={true}
          editMode={editMode}
          entityType={entityType}
          parentPaddockId={entityType === 'section' ? focusPaddockId : undefined}
          initialSectionFeature={effectiveSectionGeometry ?? undefined}
          initialSectionId={effectiveSectionId}
          initialPaddockId={initialPaddockId}
          toolbarPosition="top-left"
        />
        
        {/* Edit mode indicator */}
        {editMode && (
          <div className="absolute top-3 right-3 z-10">
            <div className="rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              Editing {entityType === 'section' ? 'Sections' : 'Paddocks'}
            </div>
          </div>
        )}
        
        {/* Layer toggles */}
        <div className="absolute bottom-4 left-4 z-10">
          <LayerToggles 
            layers={layers} 
            onToggle={toggleLayer}
            editMode={editMode}
            onEditModeToggle={toggleEditMode}
            showEditToggle={true}
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
          onClose={() => {
            setSelectedPaddock(null)
            mapRef.current?.setDrawMode('simple_select')
          }}
        />
      )}
    </div>
  )
}
