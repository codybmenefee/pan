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

      // Handle paddock and section changes
      const paddockSectionChanges = changes
        .filter((c): c is GeometryChange & { entityType: 'paddock' | 'section' } =>
          c.entityType === 'paddock' || c.entityType === 'section'
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
      if (paddockSectionChanges.length > 0) {
        await applyPaddockChanges({ farmId, changes: paddockSectionChanges })
      }

      // Handle no-graze zone changes
      for (const change of changes.filter((c) => c.entityType === 'noGrazeZone')) {
        if (change.changeType === 'add' && change.geometry) {
          const name = (change.metadata as { name?: string })?.name ?? 'New No-graze Zone'
          await createNoGrazeZone({
            farmId,
            name,
            geometry: change.geometry,
          })
        } else if (change.changeType === 'update') {
          await updateNoGrazeZone({
            id: change.id as any,
            geometry: change.geometry,
          })
        } else if (change.changeType === 'delete') {
          await removeNoGrazeZone({ id: change.id as any })
        }
      }

      // Handle water source changes
      for (const change of changes.filter((c) => c.entityType === 'waterPoint' || c.entityType === 'waterPolygon')) {
        const geometryType = change.entityType === 'waterPoint' ? 'point' : 'polygon'
        if (change.changeType === 'add' && change.geometry) {
          const metadata = change.metadata as { name?: string; type?: WaterSourceType } | undefined
          await createWaterSource({
            farmId,
            name: metadata?.name ?? 'New Water Source',
            type: metadata?.type ?? 'other',
            geometryType,
            geometry: change.geometry as any,
          })
        } else if (change.changeType === 'update') {
          await updateWaterSource({
            id: change.id as any,
            geometry: change.geometry as any,
          })
        } else if (change.changeType === 'delete') {
          await removeWaterSource({ id: change.id as any })
        }
      }
    },
    [applyPaddockChanges, createNoGrazeZone, updateNoGrazeZone, removeNoGrazeZone, createWaterSource, updateWaterSource, removeWaterSource, farmId]
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
