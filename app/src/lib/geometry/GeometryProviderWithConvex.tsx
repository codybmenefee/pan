import { useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  mapFarmDoc,
  mapPaddockDoc,
  mapSectionDoc,
  mapNoGrazeZoneDoc,
  mapWaterSourceDoc,
  type FarmDoc,
  type PaddockDoc,
  type SectionDoc,
  type NoGrazeZoneDoc,
  type WaterSourceDoc,
} from '@/lib/convex/mappers'
import { useFarmContext } from '@/lib/farm'
import type { GeometryChange } from '@/lib/geometry/types'
import type { Paddock, WaterSourceType } from '@/lib/types'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { GeometryProvider } from './GeometryContext'

interface GeometryProviderWithConvexProps {
  children: ReactNode
}

export function GeometryProviderWithConvex({ children }: GeometryProviderWithConvexProps) {
  const { activeFarmId: farmId, isLoading: isFarmLoading } = useFarmContext()
  const farmDoc = useQuery(api.farms.getFarm, farmId ? { farmId } : 'skip') as FarmDoc | null | undefined
  const paddockDocs = useQuery(api.paddocks.listPaddocksByFarm, farmId ? { farmId } : 'skip') as
    | PaddockDoc[]
    | undefined
  const sectionDocs = useQuery(api.intelligence.getAllSections, farmId ? { farmExternalId: farmId } : 'skip') as
    | SectionDoc[]
    | undefined
  const noGrazeZoneDocs = useQuery(api.noGrazeZones.listByFarm, farmId ? { farmId } : 'skip') as
    | NoGrazeZoneDoc[]
    | undefined
  const waterSourceDocs = useQuery(api.waterSources.listByFarm, farmId ? { farmId } : 'skip') as
    | WaterSourceDoc[]
    | undefined

  const applyPaddockChanges = useMutation(api.paddocks.applyPaddockChanges)
  const updatePaddockMetadata = useMutation(api.paddocks.updatePaddockMetadata)
  const updatePlanSectionGeometry = useMutation(api.intelligence.updatePlanSectionGeometry)
  const deletePlan = useMutation(api.intelligence.forceDeleteTodayPlan)
  const createNoGrazeZone = useMutation(api.noGrazeZones.create)
  const updateNoGrazeZone = useMutation(api.noGrazeZones.update)
  const removeNoGrazeZone = useMutation(api.noGrazeZones.remove)
  const createWaterSource = useMutation(api.waterSources.create)
  const updateWaterSource = useMutation(api.waterSources.update)
  const removeWaterSource = useMutation(api.waterSources.remove)

  const paddocks = useMemo(() => (paddockDocs ?? []).map(mapPaddockDoc), [paddockDocs])
  const farm = farmDoc ? mapFarmDoc(farmDoc) : null
  const sections = useMemo(() => {
    console.log('[GeometryProvider] Processing sections:', {
      sectionDocsCount: sectionDocs?.length ?? 0,
      sectionDocs: sectionDocs?.map(d => ({
        id: d.id,
        paddockId: d.paddockId,
        date: d.date,
        hasGeometry: !!d.geometry,
      })),
    })
    const mapped = (sectionDocs ?? []).map(mapSectionDoc)
    console.log('[GeometryProvider] Mapped sections:', mapped.length, 'sections ready')
    return mapped
  }, [sectionDocs])
  const noGrazeZones = useMemo(() => (noGrazeZoneDocs ?? []).map(mapNoGrazeZoneDoc), [noGrazeZoneDocs])
  const waterSources = useMemo(() => (waterSourceDocs ?? []).map(mapWaterSourceDoc), [waterSourceDocs])

  const handleGeometryChange = useCallback(
    async (changes: GeometryChange[]) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }

      // Handle paddock changes (not sections - those go to updatePlanSectionGeometry)
      const paddockChanges = changes
        .filter((c): c is GeometryChange & { entityType: 'paddock' } =>
          c.entityType === 'paddock'
        )
        .map(({ id, entityType, changeType, geometry, parentId, timestamp, metadata }) => ({
          id,
          entityType,
          changeType,
          geometry,
          parentId,
          timestamp,
          metadata,
        }))
      if (paddockChanges.length > 0) {
        await applyPaddockChanges({ farmId, changes: paddockChanges })
      }

      // Handle section changes - the section ID is actually the plan ID (from how sections are derived from plans)
      const sectionChanges = changes.filter((c) => c.entityType === 'section')
      for (const change of sectionChanges) {
        if (change.changeType === 'update' && change.geometry) {
          const planId = change.id as any // Convex ID type
          const geometry = change.geometry.geometry
          if (geometry.type === 'Polygon') {
            console.log('[GeometryProviderWithConvex] Updating plan section geometry', {
              planId,
              geometryType: geometry.type,
              coordinateCount: geometry.coordinates[0]?.length,
            })
            await updatePlanSectionGeometry({
              planId,
              sectionGeometry: geometry,
            })
          }
        } else if (change.changeType === 'delete') {
          const planId = change.id
          console.log('[GeometryProviderWithConvex] Deleting plan/section', { planId })
          await deletePlan({ planId })
        }
      }

      // Handle no-graze zone changes
      // Track IDs of newly added zones to skip subsequent update/delete for temp IDs
      const noGrazeZoneChanges = changes.filter((c) => c.entityType === 'noGrazeZone')
      console.log('[GeometryProviderWithConvex] Processing noGrazeZone changes:', { count: noGrazeZoneChanges.length, changes: noGrazeZoneChanges.map(c => ({ id: c.id, changeType: c.changeType })) })
      const newlyAddedNoGrazeZoneIds = new Set(
        noGrazeZoneChanges
          .filter((c) => c.changeType === 'add')
          .map((c) => c.id)
      )
      for (const change of noGrazeZoneChanges) {
        console.log('[GeometryProviderWithConvex] Processing noGrazeZone change:', { changeType: change.changeType, id: change.id })
        if (change.changeType === 'add' && change.geometry) {
          const metadata = change.metadata as { name?: string; type?: string; area?: number } | undefined
          console.log('[GeometryProviderWithConvex] Creating noGrazeZone:', { id: change.id, metadata })
          await createNoGrazeZone({
            farmId,
            name: metadata?.name ?? 'New No-graze Zone',
            type: (metadata?.type as 'environmental' | 'hazard' | 'infrastructure' | 'protected' | 'other') ?? 'other',
            area: metadata?.area,
            geometry: change.geometry,
          })
        } else if (change.changeType === 'update') {
          // Skip updates for entities that were just added (the add already has final geometry)
          if (newlyAddedNoGrazeZoneIds.has(change.id)) {
            console.log('[GeometryProviderWithConvex] Skipping update for newly added noGrazeZone:', { id: change.id })
            continue
          }
          const metadata = change.metadata as { area?: number } | undefined
          console.log('[GeometryProviderWithConvex] Updating noGrazeZone:', { id: change.id })
          await updateNoGrazeZone({
            id: change.id as any,
            geometry: change.geometry,
            area: metadata?.area,
          })
        } else if (change.changeType === 'delete') {
          // Skip deletes for entities that were just added (never persisted to Convex)
          if (newlyAddedNoGrazeZoneIds.has(change.id)) {
            console.log('[GeometryProviderWithConvex] Skipping delete for newly added noGrazeZone:', { id: change.id })
            continue
          }
          console.log('[GeometryProviderWithConvex] Deleting noGrazeZone:', { id: change.id })
          await removeNoGrazeZone({ id: change.id as any })
        }
      }

      // Handle water source changes
      // Track IDs of newly added water sources to skip subsequent update/delete for temp IDs
      const waterSourceChanges = changes.filter((c) => c.entityType === 'waterPoint' || c.entityType === 'waterPolygon')
      const newlyAddedWaterSourceIds = new Set(
        waterSourceChanges
          .filter((c) => c.changeType === 'add')
          .map((c) => c.id)
      )
      for (const change of waterSourceChanges) {
        const geometryType = change.entityType === 'waterPoint' ? 'point' : 'polygon'
        if (change.changeType === 'add' && change.geometry) {
          const metadata = change.metadata as { name?: string; type?: WaterSourceType; area?: number } | undefined
          await createWaterSource({
            farmId,
            name: metadata?.name ?? 'New Water Source',
            type: metadata?.type ?? 'other',
            geometryType,
            geometry: change.geometry as any,
            area: metadata?.area,
          })
        } else if (change.changeType === 'update') {
          // Skip updates for entities that were just added (the add already has final geometry)
          if (newlyAddedWaterSourceIds.has(change.id)) continue
          const metadata = change.metadata as { area?: number } | undefined
          await updateWaterSource({
            id: change.id as any,
            geometry: change.geometry as any,
            area: metadata?.area,
          })
        } else if (change.changeType === 'delete') {
          // Skip deletes for entities that were just added (never persisted to Convex)
          if (newlyAddedWaterSourceIds.has(change.id)) continue
          await removeWaterSource({ id: change.id as any })
        }
      }
    },
    [applyPaddockChanges, updatePlanSectionGeometry, deletePlan, createNoGrazeZone, updateNoGrazeZone, removeNoGrazeZone, createWaterSource, updateWaterSource, removeWaterSource, farmId]
  )

  const handlePaddockMetadataChange = useCallback(
    async (paddockId: string, metadata: Partial<Omit<Paddock, 'id' | 'geometry'>>) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }
      await updatePaddockMetadata({ farmId, paddockId, metadata })
    },
    [farmId, updatePaddockMetadata]
  )

  const isLoading =
    isFarmLoading ||
    (!!farmId && (farmDoc === undefined || paddockDocs === undefined || sectionDocs === undefined || noGrazeZoneDocs === undefined || waterSourceDocs === undefined))
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading farm geometry..." />
      </div>
    )
  }

  if (!farmId) {
    return (
      <ErrorState
        title="Farm mapping unavailable"
        message="No farm is associated with this account yet."
        details={['Seed a farm record or map this user to a farm in Convex.']}
        className="min-h-screen"
      />
    )
  }

  if (!farm) {
    return (
      <ErrorState
        title="Farm geometry unavailable"
        message="No farm records were found yet. Seed the database or check your Convex connection."
        details={[
          'Ensure VITE_CONVEX_URL is set in your environment.',
          'Run `npx convex dev` in app/ to initialize the project.',
        ]}
        className="min-h-screen"
      />
    )
  }

  return (
    <GeometryProvider
      initialPaddocks={paddocks}
      initialSections={sections}
      initialNoGrazeZones={noGrazeZones}
      initialWaterSources={waterSources}
      onGeometryChange={handleGeometryChange}
      onPaddockMetadataChange={handlePaddockMetadataChange}
    >
      {children}
    </GeometryProvider>
  )
}
