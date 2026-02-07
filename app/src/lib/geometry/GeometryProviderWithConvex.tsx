import { useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  mapFarmDoc,
  mapPastureDoc,
  mapPaddockDoc,
  mapNoGrazeZoneDoc,
  mapWaterSourceDoc,
  type FarmDoc,
  type PastureDoc,
  type PaddockDoc,
  type NoGrazeZoneDoc,
  type WaterSourceDoc,
} from '@/lib/convex/mappers'
import { useFarmContext } from '@/lib/farm'
import type { GeometryChange } from '@/lib/geometry/types'
import type { Pasture, WaterSourceType } from '@/lib/types'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { GeometryProvider } from './GeometryContext'

interface GeometryProviderWithConvexProps {
  children: ReactNode
}

export function GeometryProviderWithConvex({ children }: GeometryProviderWithConvexProps) {
  const { activeFarmId: farmId, isLoading: isFarmLoading } = useFarmContext()
  const farmDoc = useQuery(api.farms.getFarm, farmId ? { farmId } : 'skip') as FarmDoc | null | undefined
  const pastureDocs = useQuery(api.paddocks.listPasturesByFarm, farmId ? { farmId } : 'skip') as
    | PastureDoc[]
    | undefined
  const paddockDocs = useQuery(api.intelligence.getAllPaddocks, farmId ? { farmExternalId: farmId } : 'skip') as
    | PaddockDoc[]
    | undefined
  const noGrazeZoneDocs = useQuery(api.noGrazeZones.listByFarm, farmId ? { farmId } : 'skip') as
    | NoGrazeZoneDoc[]
    | undefined
  const waterSourceDocs = useQuery(api.waterSources.listByFarm, farmId ? { farmId } : 'skip') as
    | WaterSourceDoc[]
    | undefined

  const applyPastureChanges = useMutation(api.paddocks.applyPastureChanges)
  const updatePastureMetadataMutation = useMutation(api.paddocks.updatePastureMetadata)
  const updatePlanPaddockGeometry = useMutation(api.intelligence.updatePlanPaddockGeometry)
  const deletePlan = useMutation(api.intelligence.forceDeleteTodayPlan)
  const createNoGrazeZone = useMutation(api.noGrazeZones.create)
  const updateNoGrazeZone = useMutation(api.noGrazeZones.update)
  const removeNoGrazeZone = useMutation(api.noGrazeZones.remove)
  const createWaterSource = useMutation(api.waterSources.create)
  const updateWaterSource = useMutation(api.waterSources.update)
  const removeWaterSource = useMutation(api.waterSources.remove)

  const pastures = useMemo(() => (pastureDocs ?? []).map(mapPastureDoc), [pastureDocs])
  const farm = farmDoc ? mapFarmDoc(farmDoc) : null
  const paddocks = useMemo(() => {
    console.log('[GeometryProvider] Processing paddocks:', {
      paddockDocsCount: paddockDocs?.length ?? 0,
      paddockDocs: paddockDocs?.map(d => ({
        id: d.id,
        paddockId: d.paddockId,
        date: d.date,
        hasGeometry: !!d.geometry,
      })),
    })
    const mapped = (paddockDocs ?? []).map(mapPaddockDoc)
    console.log('[GeometryProvider] Mapped paddocks:', mapped.length, 'paddocks ready')
    return mapped
  }, [paddockDocs])
  const noGrazeZones = useMemo(() => (noGrazeZoneDocs ?? []).map(mapNoGrazeZoneDoc), [noGrazeZoneDocs])
  const waterSources = useMemo(() => (waterSourceDocs ?? []).map(mapWaterSourceDoc), [waterSourceDocs])

  const handleGeometryChange = useCallback(
    async (changes: GeometryChange[]) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }

      // Handle pasture changes (not paddocks - those go to updatePlanPaddockGeometry)
      const pastureChanges = changes
        .filter((c): c is GeometryChange & { entityType: 'pasture' } =>
          c.entityType === 'pasture'
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
      if (pastureChanges.length > 0) {
        await applyPastureChanges({ farmId, changes: pastureChanges })
      }

      // Handle paddock changes - the paddock ID is actually the plan ID (from how paddocks are derived from plans)
      const paddockChanges = changes.filter((c) => c.entityType === 'paddock')
      for (const change of paddockChanges) {
        if (change.changeType === 'update' && change.geometry) {
          const planId = change.id as any // Convex ID type
          const geometry = change.geometry.geometry
          if (geometry.type === 'Polygon') {
            console.log('[GeometryProviderWithConvex] Updating plan paddock geometry', {
              planId,
              geometryType: geometry.type,
              coordinateCount: geometry.coordinates[0]?.length,
            })
            await updatePlanPaddockGeometry({
              planId,
              sectionGeometry: geometry,
            })
          }
        } else if (change.changeType === 'delete') {
          const planId = change.id
          console.log('[GeometryProviderWithConvex] Deleting plan/paddock', { planId })
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
    [applyPastureChanges, updatePlanPaddockGeometry, deletePlan, createNoGrazeZone, updateNoGrazeZone, removeNoGrazeZone, createWaterSource, updateWaterSource, removeWaterSource, farmId]
  )

  const handlePastureMetadataChange = useCallback(
    async (pastureId: string, metadata: Partial<Omit<Pasture, 'id' | 'geometry'>>) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }
      await updatePastureMetadataMutation({ farmId, paddockId: pastureId, metadata })
    },
    [farmId, updatePastureMetadataMutation]
  )

  const isLoading =
    isFarmLoading ||
    (!!farmId && (farmDoc === undefined || pastureDocs === undefined || paddockDocs === undefined || noGrazeZoneDocs === undefined || waterSourceDocs === undefined))
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
      initialPastures={pastures}
      initialPaddocks={paddocks}
      initialNoGrazeZones={noGrazeZones}
      initialWaterSources={waterSources}
      onGeometryChange={handleGeometryChange}
      onPastureMetadataChange={handlePastureMetadataChange}
    >
      {children}
    </GeometryProvider>
  )
}
