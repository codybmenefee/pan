import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearch } from '@tanstack/react-router'
import { Crosshair } from 'lucide-react'
import { FarmMap, type FarmMapHandle } from './FarmMap'
import { PasturePanel } from './PasturePanel'
import { PastureEditPanel } from './PastureEditPanel'
import { NoGrazeEditPanel } from './NoGrazeEditPanel'
import { WaterSourceEditPanel } from './WaterSourceEditPanel'
import { LayerSelector } from './LayerSelector'
import { MapAddMenu } from './MapAddMenu'
import { Button } from '@/components/ui/button'
import { useGeometry, clipPolygonToPolygon } from '@/lib/geometry'
import { useTodayPlan } from '@/lib/convex/usePlan'
import { useCurrentUser } from '@/lib/convex/useCurrentUser'
import { useFarmSettings } from '@/lib/convex/useFarmSettings'
import { useFarmBoundary } from '@/lib/hooks/useFarmBoundary'
import type { Pasture, Paddock, PaddockAlternative, NoGrazeZone, WaterSource } from '@/lib/types'
import type { Feature, Polygon } from 'geojson'

interface MapSearchParams {
  edit?: boolean
  pastureId?: string
  paddockId?: string
  entityType?: 'pasture' | 'paddock'
}

export function MapView() {
  const search = useSearch({ strict: false }) as MapSearchParams

  const { farmId } = useCurrentUser()
  const { plan } = useTodayPlan(farmId || '')
  const { settings, updateMapPreference } = useFarmSettings()
  const { hasBoundary: hasFarmBoundary } = useFarmBoundary()

  const [selectedPasture, setSelectedPasture] = useState<Pasture | null>(null)
  const [selectedNoGrazeZone, setSelectedNoGrazeZone] = useState<NoGrazeZone | null>(null)
  const [selectedWaterSource, setSelectedWaterSource] = useState<WaterSource | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [entityType, setEntityType] = useState<'pasture' | 'paddock' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'>('pasture')
  const [focusPastureId, setFocusPastureId] = useState<string | undefined>(undefined)
  const [editPaddockFeature, setEditPaddockFeature] = useState<Feature<Polygon> | null>(null)
  const [editPaddockId, setEditPaddockId] = useState<string | undefined>(undefined)
  const [initialPastureId, setInitialPastureId] = useState<string | undefined>(undefined)
  const mapRef = useRef<FarmMapHandle>(null)
  const {
    getPaddockById,
    getPastureById,
    addPasture,
    paddocks,
    deleteNoGrazeZone,
    deleteWaterSource,
    getNoGrazeZoneById,
    getWaterSourceById,
  } = useGeometry()

  const [layers, setLayers] = useState({
    ndviHeat: false,
    pastures: true,
    labels: true,
    paddocks: true,
  })

  // RGB satellite toggle is persisted in settings
  const showRGBSatellite = settings.mapPreferences?.showRGBSatellite ?? false

  // Derive current satellite layer from state
  const satelliteLayer = showRGBSatellite ? 'rgb' : layers.ndviHeat ? 'ndvi' : null

  // Handle satellite layer change (mutually exclusive)
  const handleSatelliteLayerChange = useCallback((layer: 'ndvi' | 'rgb' | null) => {
    setLayers(prev => ({ ...prev, ndviHeat: layer === 'ndvi' }))
    updateMapPreference('showRGBSatellite', layer === 'rgb')
  }, [updateMapPreference])

  // Extract today's paddock from plan or fallback to most recent paddock
  const todaysPaddock = useMemo<Paddock | null>(() => {
    console.log('[MapView] Computing todaysPaddock, plan:', plan ? { id: plan._id, hasSectionGeometry: !!plan.sectionGeometry } : null)
    console.log('[MapView] paddocks from useGeometry:', paddocks.length, paddocks.map(s => ({ id: s.id, pastureId: s.pastureId })))

    if (plan?.sectionGeometry) {
      const paddock = {
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
      console.log('[MapView] Created todaysPaddock from plan:', paddock.id, paddock.pastureId)
      return paddock
    }
    // Fallback to most recent paddock from geometry context
    const fallback = paddocks[0] ?? null
    console.log('[MapView] Using fallback paddock:', fallback?.id)
    return fallback
  }, [plan, paddocks])

  // Initialize from URL search params on mount
  useEffect(() => {
    // Only enter edit mode if explicitly requested via URL params
    if (search.edit) {
      setEditMode(true)
      if (search.entityType === 'paddock') {
        setEntityType('paddock')
      }
      if (search.pastureId) {
        setFocusPastureId(search.pastureId)
      }
    }
  }, [search.edit, search.entityType, search.pastureId])

  const paddockFeature = useMemo<Paddock | PaddockAlternative | null>(() => {
    if (search.entityType !== 'paddock' || !search.paddockId) {
      // Return today's paddock when no specific paddock is requested
      return todaysPaddock
    }
    const paddock = getPaddockById(search.paddockId)
    if (paddock) return paddock
    if (todaysPaddock?.id === search.paddockId) {
      return todaysPaddock
    }
    return null
  }, [getPaddockById, search.entityType, search.paddockId, todaysPaddock])

  const paddockPastureId = useMemo(() => {
    if (search.pastureId) return search.pastureId
    if (paddockFeature && 'pastureId' in paddockFeature) return paddockFeature.pastureId
    const props = paddockFeature?.geometry?.properties as { pastureId?: string } | undefined
    return props?.pastureId
  }, [search.pastureId, paddockFeature])

  const paddockPasture = useMemo(() => {
    if (!paddockPastureId) return undefined
    return getPastureById(paddockPastureId)
  }, [getPastureById, paddockPastureId])

  const clippedPaddockGeometry = useMemo(() => {
    if (!paddockFeature) return null
    if (!paddockPasture) return paddockFeature.geometry
    const clipped = clipPolygonToPolygon(paddockFeature.geometry, paddockPasture.geometry)
    return clipped ?? paddockPasture.geometry
  }, [paddockFeature, paddockPasture])

  const effectivePaddockGeometry = editPaddockFeature ?? clippedPaddockGeometry ??
    (search.entityType !== 'paddock' && !search.paddockId && todaysPaddock ? todaysPaddock.geometry : null)
  const effectivePaddockId = editPaddockId ?? paddockFeature?.id

  // Focus map on paddock bounds when available
  useEffect(() => {
    if (editMode) return
    if (!effectivePaddockGeometry) return

    const tryFocus = () => {
      if (mapRef.current) {
        mapRef.current.focusOnGeometry(effectivePaddockGeometry)
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
  }, [editMode, effectivePaddockGeometry])

  // Focus map on pasture when editing paddocks
  // Use a retry mechanism since the map ref might not be ready immediately
  useEffect(() => {
    if (editMode) return
    if (!focusPastureId || effectivePaddockGeometry) return

    const tryFocus = () => {
      if (mapRef.current) {
        mapRef.current.focusOnPasture(focusPastureId)
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
  }, [editMode, focusPastureId, effectivePaddockGeometry])

  // Focus map on today's paddock by default when navigating via sidebar
  useEffect(() => {
    if (editMode) return
    console.log('[MapView] Focus effect running, todaysPaddock:', todaysPaddock?.id, 'search:', search)
    if (search.edit || search.paddockId) {
      console.log('[MapView] Skipping focus - edit mode or specific paddock requested')
      return
    }
    if (!todaysPaddock) {
      console.log('[MapView] Skipping focus - no todaysPaddock')
      return
    }
    if (effectivePaddockGeometry) {
      console.log('[MapView] Skipping focus - effectivePaddockGeometry already set')
      return
    }

    const tryFocus = () => {
      if (mapRef.current) {
        console.log('[MapView] Focusing on todaysPaddock geometry')
        mapRef.current.focusOnGeometry(todaysPaddock.geometry)
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
  }, [editMode, search.edit, search.paddockId, todaysPaddock, effectivePaddockGeometry])

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
    console.log('[MapView] handleEditRequest called:', request)
    const isDuplicatePaddock =
      editMode &&
      request.entityType === 'paddock' &&
      entityType === 'paddock' &&
      request.paddockId &&
      request.paddockId === editPaddockId
    const sameEffectivePaddock =
      editMode &&
      entityType === 'paddock' &&
      request.entityType === 'paddock' &&
      request.paddockId &&
      request.paddockId === effectivePaddockId
    if (isDuplicatePaddock || sameEffectivePaddock) {
      return
    }
    setEditMode(true)
    setEntityType(request.entityType)
    let nextFocusPastureId: string | undefined
    let nextInitialPastureId: string | undefined
    let nextEditPaddockId: string | undefined

    if (request.entityType === 'paddock') {
      setSelectedPasture(null)
      setSelectedNoGrazeZone(null)
      setSelectedWaterSource(null)
      nextFocusPastureId = request.pastureId
      nextEditPaddockId = request.paddockId
      nextInitialPastureId = undefined
      setFocusPastureId(nextFocusPastureId)
      setEditPaddockFeature(request.geometry ?? null)
      setEditPaddockId(nextEditPaddockId)
      setInitialPastureId(nextInitialPastureId)
    } else if (request.entityType === 'noGrazeZone') {
      // For no-graze zones, enter edit mode and select the zone to show the edit panel
      console.log('[MapView] handleEditRequest noGrazeZone:', { noGrazeZoneId: request.noGrazeZoneId })
      setSelectedPasture(null)
      setSelectedWaterSource(null)
      setEditPaddockFeature(null)
      setEditPaddockId(undefined)
      setFocusPastureId(undefined)
      setInitialPastureId(undefined)
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
      setSelectedPasture(null)
      setSelectedNoGrazeZone(null)
      setEditPaddockFeature(null)
      setEditPaddockId(undefined)
      setFocusPastureId(undefined)
      setInitialPastureId(undefined)
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
      // For pastures, enter edit mode and select the pasture to show the edit panel
      setSelectedNoGrazeZone(null)
      setSelectedWaterSource(null)
      setEditPaddockFeature(null)
      setEditPaddockId(undefined)
      nextEditPaddockId = undefined
      if (request.geometry) {
        const newId = addPasture(request.geometry)
        nextFocusPastureId = newId
        nextInitialPastureId = newId
        setFocusPastureId(nextFocusPastureId)
        setInitialPastureId(nextInitialPastureId)
        setSelectedPasture(null) // New pasture, no selection yet
      } else if (request.pastureId) {
        // Look up and select the pasture to show the edit panel
        const pasture = getPastureById(request.pastureId)
        if (pasture) {
          setSelectedPasture(pasture)
        } else {
          setSelectedPasture(null)
        }
        nextFocusPastureId = request.pastureId
        nextInitialPastureId = request.pastureId
        setFocusPastureId(nextFocusPastureId)
        setInitialPastureId(nextInitialPastureId)
      } else {
        setSelectedPasture(null)
      }
    }
  }, [addPasture, editMode, entityType, editPaddockId, effectivePaddockId, getNoGrazeZoneById, getWaterSourceById, getPastureById])

  const handleEditPastureSelect = useCallback((pasture: Pasture | null) => {
    setSelectedPasture(pasture)
  }, [])

  const handleNoGrazeZoneClick = useCallback((zoneId: string) => {
    console.log('[MapView] handleNoGrazeZoneClick:', { zoneId })
    const zone = getNoGrazeZoneById(zoneId)
    console.log('[MapView] handleNoGrazeZoneClick - zone found:', { found: !!zone, zoneName: zone?.name })
    if (zone) {
      setSelectedNoGrazeZone(zone)
      setSelectedPasture(null)
      setSelectedWaterSource(null)
      setEditMode(true)
      setEntityType('noGrazeZone')
    }
  }, [getNoGrazeZoneById])

  const handleWaterSourceClick = useCallback((sourceId: string) => {
    const source = getWaterSourceById(sourceId)
    if (source) {
      setSelectedWaterSource(source)
      setSelectedPasture(null)
      setSelectedNoGrazeZone(null)
      setEditMode(true)
      setEntityType('waterPolygon')
    }
  }, [getWaterSourceById])

  const handleNoGrazeZoneDelete = useCallback((id: string) => {
    console.log('[MapView] handleNoGrazeZoneDelete:', { id })
    console.log('[MapView] handleNoGrazeZoneDelete - calling deleteNoGrazeZone')
    deleteNoGrazeZone(id)
    console.log('[MapView] handleNoGrazeZoneDelete - clearing selectedNoGrazeZone')
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
          onPastureClick={(pasture) => {
            setSelectedPasture(pasture)
            setEditMode(true)
            setEntityType('pasture')
            setInitialPastureId(pasture.id)
          }}
          onEditPastureSelect={handleEditPastureSelect}
          onEditRequest={handleEditRequest}
          onNoGrazeZoneClick={handleNoGrazeZoneClick}
          onWaterSourceClick={handleWaterSourceClick}
          selectedPastureId={selectedPasture?.id}
          showNdviHeat={layers.ndviHeat}
          showPastures={layers.pastures}
          showLabels={layers.labels}
          showPaddocks={layers.paddocks}
          showRGBSatellite={showRGBSatellite}
          editable={true}
          editMode={editMode}
          entityType={entityType}
          parentPastureId={entityType === 'paddock' ? focusPastureId : undefined}
          initialPaddockFeature={effectivePaddockGeometry ?? undefined}
          initialPaddockId={effectivePaddockId}
          initialPastureId={initialPastureId}
          initialNoGrazeZoneId={selectedNoGrazeZone?.id}
          initialWaterSourceId={selectedWaterSource?.id}
          toolbarPosition="top-left"
        />

        {/* Edit mode indicator */}
        {editMode && (
          <div className="absolute top-2 right-2 z-10">
            <div className="rounded-lg border border-primary bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
              Editing {entityType === 'paddock' ? 'Paddocks' : entityType === 'noGrazeZone' ? 'No-graze Zone' : entityType === 'waterPoint' || entityType === 'waterPolygon' ? 'Water Source' : 'Pastures'}
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
            onAddPasture={() => {
              // Create a new pasture at the center of the map
              const pastureId = mapRef.current?.createPastureAtCenter()
              if (pastureId) {
                // Enter edit mode with the new pasture selected
                // FarmMap will handle selecting the pasture via onEditPastureSelect
                setEditMode(true)
                setEntityType('pasture')
                setEditPaddockFeature(null)
                setEditPaddockId(undefined)
                setFocusPastureId(pastureId)
                setInitialPastureId(pastureId)
              }
            }}
            onAddNoGrazeZone={() => {
              setEditMode(true)
              setEntityType('noGrazeZone')
              setSelectedPasture(null)
            }}
            onAddWaterSource={(geometryType) => {
              setEditMode(true)
              setEntityType(geometryType === 'point' ? 'waterPoint' : 'waterPolygon')
              setSelectedPasture(null)
            }}
          />
        )}

        {/* Layer selector - top left */}
        <div className="absolute top-2 left-2 z-10">
          <LayerSelector
            satelliteLayer={satelliteLayer}
            onSatelliteLayerChange={handleSatelliteLayerChange}
            layers={layers}
            onToggleLayer={toggleLayer}
          />
        </div>
      </div>

      {/* Side panel */}
      {selectedPasture && !editMode && (
        <PasturePanel
          pasture={selectedPasture}
          onClose={() => setSelectedPasture(null)}
        />
      )}

      {selectedPasture && editMode && entityType === 'pasture' && (
        <PastureEditPanel
          pasture={selectedPasture}
          open={true}
          onClose={() => {
            setSelectedPasture(null)
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
