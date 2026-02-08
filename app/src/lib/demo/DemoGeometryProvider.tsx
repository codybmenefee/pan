/**
 * Demo-aware geometry provider that intercepts writes based on mode.
 *
 * - VITE_DEV_AUTH=true (Developer): Writes go to Convex (persistent)
 * - Otherwise (Public Demo): Writes go to localStorage (ephemeral)
 */

import { useCallback, useMemo, useState } from 'react'
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
import type { Pasture, NoGrazeZone, WaterSource, Paddock, WaterSourceType } from '@/lib/types'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { GeometryProvider } from '@/lib/geometry/GeometryContext'
import { useDemoAuth } from '@/lib/auth/DemoAuthProvider'
import { isDemoDevMode } from './isDemoDevMode'
import {
  setDemoPasture,
  setDemoNoGrazeZone,
  setDemoWaterSource,
  setDemoPaddock,
  mergeDemoData,
  createPastureFromChange,
  createNoGrazeZoneFromChange,
  createWaterSourceFromChange,
  createPaddockFromChange,
} from './demoLocalStorage'
import type { Feature, Polygon } from 'geojson'

interface DemoGeometryProviderProps {
  children: ReactNode
}

export function DemoGeometryProvider({ children }: DemoGeometryProviderProps) {
  const { activeFarmId: farmId, isLoading: isFarmLoading } = useFarmContext()
  const { demoSessionId } = useDemoAuth()

  // Force re-render when localStorage changes
  const [localStorageVersion, setLocalStorageVersion] = useState(0)

  // Convex queries (same as GeometryProviderWithConvex)
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

  // Convex mutations (only used in dev mode)
  const applyPastureChanges = useMutation(api.paddocks.applyPastureChanges)
  const updatePastureMetadata = useMutation(api.paddocks.updatePastureMetadata)
  const updatePlanPaddockGeometry = useMutation(api.intelligence.updatePlanPaddockGeometry)
  const updatePaddockDate = useMutation(api.intelligence.updatePaddockDate)
  const deletePlan = useMutation(api.intelligence.forceDeleteTodayPlan)
  const createNoGrazeZone = useMutation(api.noGrazeZones.create)
  const updateNoGrazeZoneMutation = useMutation(api.noGrazeZones.update)
  const removeNoGrazeZone = useMutation(api.noGrazeZones.remove)
  const createWaterSource = useMutation(api.waterSources.create)
  const updateWaterSourceMutation = useMutation(api.waterSources.update)
  const removeWaterSource = useMutation(api.waterSources.remove)

  // Map Convex docs to domain types
  const basePastures = useMemo(() => (pastureDocs ?? []).map(mapPastureDoc), [pastureDocs])
  const farm = farmDoc ? mapFarmDoc(farmDoc) : null
  const basePaddocks = useMemo(() => (paddockDocs ?? []).map(mapPaddockDoc), [paddockDocs])
  const baseNoGrazeZones = useMemo(() => (noGrazeZoneDocs ?? []).map(mapNoGrazeZoneDoc), [noGrazeZoneDocs])
  const baseWaterSources = useMemo(() => (waterSourceDocs ?? []).map(mapWaterSourceDoc), [waterSourceDocs])

  // Merge localStorage overrides with Convex base data (for public demo mode)
  const pastures = useMemo(() => {
    if (isDemoDevMode || !demoSessionId) {
      return basePastures
    }
    // Force dependency on localStorageVersion for re-render
    void localStorageVersion
    return mergeDemoData(demoSessionId, basePastures, 'pastures')
  }, [basePastures, demoSessionId, localStorageVersion])

  const paddocks = useMemo(() => {
    if (isDemoDevMode || !demoSessionId) {
      return basePaddocks
    }
    void localStorageVersion
    return mergeDemoData(demoSessionId, basePaddocks, 'paddocks')
  }, [basePaddocks, demoSessionId, localStorageVersion])

  const noGrazeZones = useMemo(() => {
    if (isDemoDevMode || !demoSessionId) {
      return baseNoGrazeZones
    }
    void localStorageVersion
    return mergeDemoData(demoSessionId, baseNoGrazeZones, 'noGrazeZones')
  }, [baseNoGrazeZones, demoSessionId, localStorageVersion])

  const waterSources = useMemo(() => {
    if (isDemoDevMode || !demoSessionId) {
      return baseWaterSources
    }
    void localStorageVersion
    return mergeDemoData(demoSessionId, baseWaterSources, 'waterSources')
  }, [baseWaterSources, demoSessionId, localStorageVersion])

  // Helper to trigger re-render after localStorage update
  const triggerLocalStorageUpdate = useCallback(() => {
    setLocalStorageVersion((v) => v + 1)
  }, [])

  // Handle localStorage writes for public demo mode
  const handleLocalStorageGeometryChange = useCallback(
    async (changes: GeometryChange[]) => {
      if (!demoSessionId || !farmId) return

      for (const change of changes) {
        if (change.entityType === 'pasture') {
          if (change.changeType === 'add' && change.geometry) {
            const pasture = createPastureFromChange(change, farmId)
            setDemoPasture(demoSessionId, change.id, pasture)
          } else if (change.changeType === 'update' && change.geometry) {
            // Find existing pasture and update geometry
            const existing = pastures.find((p) => p.id === change.id)
            if (existing) {
              const updated: Pasture = { ...existing, geometry: change.geometry as Feature<Polygon> }
              setDemoPasture(demoSessionId, change.id, updated)
            }
          } else if (change.changeType === 'delete') {
            setDemoPasture(demoSessionId, change.id, null)
          }
        } else if (change.entityType === 'noGrazeZone') {
          if (change.changeType === 'add' && change.geometry) {
            const zone = createNoGrazeZoneFromChange(change, farmId)
            setDemoNoGrazeZone(demoSessionId, change.id, zone)
          } else if (change.changeType === 'update' && change.geometry) {
            const existing = noGrazeZones.find((z) => z.id === change.id)
            if (existing) {
              const updated: NoGrazeZone = {
                ...existing,
                geometry: change.geometry as Feature<Polygon>,
                updatedAt: new Date().toISOString(),
              }
              setDemoNoGrazeZone(demoSessionId, change.id, updated)
            }
          } else if (change.changeType === 'delete') {
            setDemoNoGrazeZone(demoSessionId, change.id, null)
          }
        } else if (change.entityType === 'waterPoint' || change.entityType === 'waterPolygon') {
          if (change.changeType === 'add' && change.geometry) {
            const source = createWaterSourceFromChange(change, farmId)
            setDemoWaterSource(demoSessionId, change.id, source)
          } else if (change.changeType === 'update' && change.geometry) {
            const existing = waterSources.find((s) => s.id === change.id)
            if (existing) {
              const updated: WaterSource = {
                ...existing,
                geometry: change.geometry as Feature<Polygon>,
                updatedAt: new Date().toISOString(),
              }
              setDemoWaterSource(demoSessionId, change.id, updated)
            }
          } else if (change.changeType === 'delete') {
            setDemoWaterSource(demoSessionId, change.id, null)
          }
        } else if (change.entityType === 'paddock') {
          if (change.changeType === 'add' && change.geometry) {
            const paddock = createPaddockFromChange(change)
            setDemoPaddock(demoSessionId, change.id, paddock)
          } else if (change.changeType === 'update' && change.geometry) {
            const existing = paddocks.find((s) => s.id === change.id)
            if (existing) {
              const updated: Paddock = { ...existing, geometry: change.geometry as Feature<Polygon> }
              setDemoPaddock(demoSessionId, change.id, updated)
            }
          } else if (change.changeType === 'delete') {
            setDemoPaddock(demoSessionId, change.id, null)
          }
        }
      }

      // Trigger re-render with updated localStorage data
      triggerLocalStorageUpdate()
    },
    [demoSessionId, farmId, pastures, noGrazeZones, waterSources, paddocks, triggerLocalStorageUpdate]
  )

  // Handle Convex writes (same as GeometryProviderWithConvex)
  const handleConvexGeometryChange = useCallback(
    async (changes: GeometryChange[]) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }

      // Handle pasture changes
      const pastureChanges = changes
        .filter((c): c is GeometryChange & { entityType: 'pasture' } => c.entityType === 'pasture')
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

      // Handle paddock changes
      const paddockChanges = changes.filter((c) => c.entityType === 'paddock')
      for (const change of paddockChanges) {
        if (change.changeType === 'update' && change.geometry) {
          const planId = change.id as any
          const geometry = change.geometry.geometry
          if (geometry.type === 'Polygon') {
            await updatePlanPaddockGeometry({ planId, sectionGeometry: geometry })
          }
        } else if (change.changeType === 'delete') {
          const planId = change.id
          await deletePlan({ planId })
        }
      }

      // Handle no-graze zone changes
      const noGrazeZoneChanges = changes.filter((c) => c.entityType === 'noGrazeZone')
      const newlyAddedNoGrazeZoneIds = new Set(
        noGrazeZoneChanges.filter((c) => c.changeType === 'add').map((c) => c.id)
      )
      for (const change of noGrazeZoneChanges) {
        if (change.changeType === 'add' && change.geometry) {
          const metadata = change.metadata as { name?: string; type?: string; area?: number } | undefined
          await createNoGrazeZone({
            farmId,
            name: metadata?.name ?? 'New No-graze Zone',
            type: (metadata?.type as 'environmental' | 'hazard' | 'infrastructure' | 'protected' | 'other') ?? 'other',
            area: metadata?.area,
            geometry: change.geometry,
          })
        } else if (change.changeType === 'update') {
          if (newlyAddedNoGrazeZoneIds.has(change.id)) continue
          const metadata = change.metadata as { area?: number } | undefined
          await updateNoGrazeZoneMutation({
            id: change.id as any,
            geometry: change.geometry,
            area: metadata?.area,
          })
        } else if (change.changeType === 'delete') {
          if (newlyAddedNoGrazeZoneIds.has(change.id)) continue
          await removeNoGrazeZone({ id: change.id as any })
        }
      }

      // Handle water source changes
      const waterSourceChanges = changes.filter(
        (c) => c.entityType === 'waterPoint' || c.entityType === 'waterPolygon'
      )
      const newlyAddedWaterSourceIds = new Set(
        waterSourceChanges.filter((c) => c.changeType === 'add').map((c) => c.id)
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
          if (newlyAddedWaterSourceIds.has(change.id)) continue
          const metadata = change.metadata as { area?: number } | undefined
          await updateWaterSourceMutation({
            id: change.id as any,
            geometry: change.geometry as any,
            area: metadata?.area,
          })
        } else if (change.changeType === 'delete') {
          if (newlyAddedWaterSourceIds.has(change.id)) continue
          await removeWaterSource({ id: change.id as any })
        }
      }
    },
    [
      applyPastureChanges,
      updatePlanPaddockGeometry,
      deletePlan,
      createNoGrazeZone,
      updateNoGrazeZoneMutation,
      removeNoGrazeZone,
      createWaterSource,
      updateWaterSourceMutation,
      removeWaterSource,
      farmId,
    ]
  )

  // Route to appropriate handler based on mode
  const handleGeometryChange = useCallback(
    async (changes: GeometryChange[]) => {
      if (isDemoDevMode) {
        // Developer mode: write to Convex
        await handleConvexGeometryChange(changes)
      } else {
        // Public demo mode: write to localStorage
        await handleLocalStorageGeometryChange(changes)
      }
    },
    [handleConvexGeometryChange, handleLocalStorageGeometryChange]
  )

  const handlePastureMetadataChange = useCallback(
    async (pastureId: string, metadata: Partial<Omit<Pasture, 'id' | 'geometry'>>) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }

      if (isDemoDevMode) {
        // Developer mode: write to Convex
        await updatePastureMetadata({ farmId, paddockId: pastureId, metadata })
      } else if (demoSessionId) {
        // Public demo mode: update localStorage
        const existing = pastures.find((p) => p.id === pastureId)
        if (existing) {
          const updated: Pasture = { ...existing, ...metadata }
          setDemoPasture(demoSessionId, pastureId, updated)
          triggerLocalStorageUpdate()
        }
      }
    },
    [farmId, demoSessionId, pastures, updatePastureMetadata, triggerLocalStorageUpdate]
  )

  const handlePaddockMetadataChange = useCallback(
    async (paddockId: string, metadata: Partial<Omit<Paddock, 'id' | 'pastureId' | 'geometry'>>) => {
      if (isDemoDevMode) {
        if (metadata.date) {
          await updatePaddockDate({ planId: paddockId as any, date: metadata.date })
        }
      } else if (demoSessionId) {
        const existing = paddocks.find((s) => s.id === paddockId)
        if (existing) {
          setDemoPaddock(demoSessionId, paddockId, { ...existing, ...metadata })
          triggerLocalStorageUpdate()
        }
      }
    },
    [demoSessionId, paddocks, updatePaddockDate, triggerLocalStorageUpdate]
  )

  const isLoading =
    isFarmLoading ||
    (!!farmId &&
      (farmDoc === undefined ||
        pastureDocs === undefined ||
        paddockDocs === undefined ||
        noGrazeZoneDocs === undefined ||
        waterSourceDocs === undefined))

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
      onPaddockMetadataChange={handlePaddockMetadataChange}
    >
      {children}
    </GeometryProvider>
  )
}
