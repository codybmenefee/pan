import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import type { Feature, Point, Polygon } from 'geojson'
import type { Pasture, Paddock, NoGrazeZone, WaterSource, WaterSourceType } from '@/lib/types'
import type {
  GeometryContextValue,
  GeometryProviderProps,
  GeometryChange,
  PendingChange,
} from './types'
import { pastures as mockPastures } from '@/data/mock/pastures'
import { calculateAreaHectares } from './geometryUtils'

const GeometryContext = createContext<GeometryContextValue | null>(null)

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createDefaultPastureMetadata(): Omit<Pasture, 'id' | 'geometry'> {
  return {
    name: 'New Pasture',
    status: 'recovering',
    ndvi: 0.35,
    restDays: 0,
    area: 0,
    waterAccess: 'None',
    lastGrazed: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }
}

function createDefaultPaddockMetadata(): Omit<Paddock, 'id' | 'pastureId' | 'geometry'> {
  return {
    date: new Date().toISOString().split('T')[0],
    targetArea: 0,
    reasoning: ['User-defined paddock'],
  }
}

function createDefaultNoGrazeZoneMetadata(): Pick<NoGrazeZone, 'name' | 'type'> {
  return {
    name: 'New No-graze Zone',
    type: 'other',
  }
}

function createDefaultWaterSourceMetadata(): Pick<WaterSource, 'name' | 'type'> {
  return {
    name: 'New Water Source',
    type: 'other' as WaterSourceType,
  }
}

function normalizePastures(list: Pasture[]): Pasture[] {
  return list.map((pasture) => ({
    ...pasture,
    area: calculateAreaHectares(pasture.geometry),
  }))
}

function normalizePaddocks(list: Paddock[]): Paddock[] {
  return list.map((paddock) => ({
    ...paddock,
    targetArea: calculateAreaHectares(paddock.geometry),
  }))
}

function stripFeatureId(feature: Feature<Polygon>): Feature<Polygon> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...rest } = feature as Feature<Polygon> & { id?: string | number }
  return rest
}

function stripAnyFeatureId<T extends Feature<Point | Polygon>>(feature: T): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...rest } = feature as T & { id?: string | number }
  return rest as T
}

export function GeometryProvider({
  children,
  initialPastures,
  initialPaddocks,
  initialNoGrazeZones,
  initialWaterSources,
  onGeometryChange,
  onPastureMetadataChange,
  onPaddockMetadataChange,
}: GeometryProviderProps) {
  const [pastures, setPastures] = useState<Pasture[]>(() => {
    const source = initialPastures ?? mockPastures
    return normalizePastures(source)
  })
  const [paddocks, setPaddocks] = useState<Paddock[]>(() => {
    const source = initialPaddocks ?? []
    return normalizePaddocks(source)
  })
  const [noGrazeZones, setNoGrazeZones] = useState<NoGrazeZone[]>(() => initialNoGrazeZones ?? [])
  const [waterSources, setWaterSources] = useState<WaterSource[]>(() => initialWaterSources ?? [])
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [resetCounter, setResetCounter] = useState(0)

  // Sync pastures state with initialPastures prop changes
  // IMPORTANT: Preserve local geometry changes that haven't been saved to Convex yet
  // IMPORTANT: Respect pending delete changes (don't restore deleted pastures)
  useEffect(() => {
    console.log('[GeometryContext] Sync effect triggered, initialPastures:', initialPastures?.length ?? 'undefined', 'pendingChanges:', pendingChanges.length)
    if (initialPastures && initialPastures.length > 0) {
      setPastures((currentPastures) => {
        console.log('[GeometryContext] Sync effect currentPastures:', currentPastures.map(p => ({
          id: p.id,
          name: p.name,
          firstCoord: p.geometry.geometry.coordinates[0]?.[0],
        })))
        // Check if there are pending geometry changes for any pasture
        const pendingGeometryIds = new Set(
          pendingChanges
            .filter((c) => !c.synced && c.entityType === 'pasture' && c.geometry)
            .map((c) => c.id)
        )

        // Check for pending delete changes - these pastures should NOT be restored
        const pendingDeleteIds = new Set(
          pendingChanges
            .filter((c) => !c.synced && c.entityType === 'pasture' && c.changeType === 'delete')
            .map((c) => c.id)
        )

        if (pendingDeleteIds.size > 0) {
          console.log('[GeometryContext] Excluding pastures with pending deletes:', Array.from(pendingDeleteIds))
        }

        // Check for pending add changes - these are new pastures not yet in Convex
        const pendingAddIds = new Set(
          pendingChanges
            .filter((c) => !c.synced && c.entityType === 'pasture' && c.changeType === 'add')
            .map((c) => c.id)
        )

        if (pendingGeometryIds.size > 0 || pendingAddIds.size > 0) {
          console.log('[GeometryContext] Preserving local geometry for pastures with pending changes:',
            Array.from(pendingGeometryIds))
          console.log('[GeometryContext] Preserving newly added pastures:', Array.from(pendingAddIds))

          // Create a map of current pasture geometries for those with pending changes
          const localGeometries = new Map<string, typeof currentPastures[0]['geometry']>()
          currentPastures.forEach((p) => {
            if (pendingGeometryIds.has(p.id)) {
              localGeometries.set(p.id, p.geometry)
            }
          })

          // Get newly added pastures that aren't in Convex yet
          const newPastures = currentPastures.filter((p) => pendingAddIds.has(p.id))

          // Merge: use Convex metadata but preserve local geometry for changed pastures
          // Also filter out any pastures with pending deletes
          const merged = normalizePastures(initialPastures)
            .filter((p) => !pendingDeleteIds.has(p.id))
            .map((p) => {
              if (localGeometries.has(p.id)) {
                const localGeo = localGeometries.get(p.id)!
                return { ...p, geometry: localGeo, area: calculateAreaHectares(localGeo) }
              }
              return p
            })

          // Add newly created pastures that aren't in Convex yet
          const result = [...merged, ...newPastures]

          console.log('[GeometryContext] Merged pastures, preserving', localGeometries.size, 'local geometries and', newPastures.length, 'new pastures')
          return result
        }

        // Filter out pastures with pending deletes
        const filteredPastures = normalizePastures(initialPastures).filter((p) => !pendingDeleteIds.has(p.id))
        console.log('[GeometryContext] Updating pastures state with', filteredPastures.length, 'pastures (no pending geometry changes)')
        return filteredPastures
      })
    }
  }, [initialPastures, pendingChanges])

  // Sync paddocks state with initialPaddocks prop changes
  // IMPORTANT: Preserve local geometry changes that haven't been saved to Convex yet
  // IMPORTANT: Respect pending delete changes (don't restore deleted paddocks)
  useEffect(() => {
    if (initialPaddocks) {
      setPaddocks((currentPaddocks) => {
        // Check if there are pending geometry changes for any paddock
        const pendingPaddockIds = new Set(
          pendingChanges
            .filter((c) => !c.synced && c.entityType === 'paddock' && c.geometry)
            .map((c) => c.id)
        )

        // Check for pending delete changes - these paddocks should NOT be restored
        const pendingDeleteIds = new Set(
          pendingChanges
            .filter((c) => !c.synced && c.entityType === 'paddock' && c.changeType === 'delete')
            .map((c) => c.id)
        )

        if (pendingDeleteIds.size > 0) {
          console.log('[GeometryContext] Paddocks sync: excluding pending deletes:', Array.from(pendingDeleteIds))
        }

        if (pendingPaddockIds.size > 0) {
          console.log('[GeometryContext] Preserving local geometry for paddocks with pending changes:',
            Array.from(pendingPaddockIds))

          // Create a map of current paddock geometries for those with pending changes
          const localGeometries = new Map<string, typeof currentPaddocks[0]['geometry']>()
          currentPaddocks.forEach((s) => {
            if (pendingPaddockIds.has(s.id)) {
              localGeometries.set(s.id, s.geometry)
            }
          })

          // Merge: use Convex data but preserve local geometry for changed paddocks
          // Also filter out any paddocks with pending deletes
          const merged = normalizePaddocks(initialPaddocks)
            .filter((s) => !pendingDeleteIds.has(s.id))
            .map((s) => {
              if (localGeometries.has(s.id)) {
                const localGeo = localGeometries.get(s.id)!
                return { ...s, geometry: localGeo, targetArea: calculateAreaHectares(localGeo) }
              }
              return s
            })

          return merged
        }

        // Filter out paddocks with pending deletes
        return normalizePaddocks(initialPaddocks).filter((s) => !pendingDeleteIds.has(s.id))
      })
    }
  }, [initialPaddocks, pendingChanges])

  const hasUnsavedChanges = useMemo(
    () => pendingChanges.some((c) => !c.synced),
    [pendingChanges]
  )

  const recordChange = useCallback(
    (change: GeometryChange) => {
      const normalizedChange: GeometryChange = change.geometry
        ? { ...change, geometry: stripFeatureId(change.geometry) }
        : change
      const pendingChange: PendingChange = { ...normalizedChange, synced: false }
      setPendingChanges((prev) => [...prev, pendingChange])
      // Changes are now queued for manual save - no auto-sync
    },
    []
  )

  const saveChanges = useCallback(async () => {
    const unsyncedChanges = pendingChanges.filter((c) => !c.synced)
    if (unsyncedChanges.length === 0 || !onGeometryChange) return

    setIsSaving(true)
    try {
      // Strip the 'synced' field before sending to backend
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const changesToSync: GeometryChange[] = unsyncedChanges.map(
        ({ synced: _, ...change }) => change
      )
      await onGeometryChange(changesToSync)
      setPendingChanges((prev) =>
        prev.map((pc) =>
          unsyncedChanges.some((uc) => uc.id === pc.id && uc.timestamp === pc.timestamp)
            ? { ...pc, synced: true }
            : pc
        )
      )
    } finally {
      setIsSaving(false)
    }
  }, [pendingChanges, onGeometryChange])

  // Pasture operations
  const addPasture = useCallback(
    (geometry: Feature<Polygon>, metadata?: Partial<Omit<Pasture, 'id' | 'geometry'>>): string => {
      const id = `p-${generateId()}`
      const area = calculateAreaHectares(geometry)
      const newPasture: Pasture = {
        ...createDefaultPastureMetadata(),
        ...metadata,
        id,
        geometry,
        area: metadata?.area ?? area,
      }

      setPastures((prev) => [...prev, newPasture])
      const changeMetadata = {
        name: newPasture.name,
        status: newPasture.status,
        ndvi: newPasture.ndvi,
        restDays: newPasture.restDays,
        area: newPasture.area,
        waterAccess: newPasture.waterAccess,
        lastGrazed: newPasture.lastGrazed,
      }
      recordChange({
        id,
        entityType: 'pasture',
        changeType: 'add',
        geometry,
        metadata: changeMetadata,
        timestamp: new Date().toISOString(),
      })

      return id
    },
    [recordChange]
  )

  const updatePasture = useCallback(
    (id: string, geometry: Feature<Polygon>) => {
      const area = calculateAreaHectares(geometry)
      setPastures((prev) =>
        prev.map((p) => (p.id === id ? { ...p, geometry, area } : p))
      )
      recordChange({
        id,
        entityType: 'pasture',
        changeType: 'update',
        geometry,
        timestamp: new Date().toISOString(),
      })
    },
    [recordChange]
  )

  const updatePastureMetadata = useCallback(
    (id: string, metadata: Partial<Omit<Pasture, 'id' | 'geometry'>>) => {
      setPastures((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...metadata } : p))
      )
      if (onPastureMetadataChange) {
        void onPastureMetadataChange(id, metadata)
      }
    },
    [onPastureMetadataChange]
  )

  const deletePasture = useCallback(
    (id: string) => {
      setPastures((prev) => prev.filter((p) => p.id !== id))
      // Also delete all paddocks in this pasture
      setPaddocks((prev) => prev.filter((s) => s.pastureId !== id))
      recordChange({
        id,
        entityType: 'pasture',
        changeType: 'delete',
        timestamp: new Date().toISOString(),
      })
    },
    [recordChange]
  )

  // Paddock operations
  const addPaddock = useCallback(
    (
      pastureId: string,
      geometry: Feature<Polygon>,
      metadata?: Partial<Omit<Paddock, 'id' | 'pastureId' | 'geometry'>>
    ): string => {
      const id = `s-${generateId()}`
      const targetArea = calculateAreaHectares(geometry)
      const newPaddock: Paddock = {
        ...createDefaultPaddockMetadata(),
        ...metadata,
        id,
        pastureId,
        geometry,
        targetArea: metadata?.targetArea ?? targetArea,
      }

      setPaddocks((prev) => [...prev, newPaddock])
      recordChange({
        id,
        entityType: 'paddock',
        changeType: 'add',
        geometry,
        parentId: pastureId,
        timestamp: new Date().toISOString(),
      })

      return id
    },
    [recordChange]
  )

  const updatePaddock = useCallback(
    (id: string, geometry: Feature<Polygon>) => {
      const targetArea = calculateAreaHectares(geometry)
      // Capture original geometry before updating state
      const paddock = paddocks.find((s) => s.id === id)
      const originalGeometry = paddock?.geometry

      setPaddocks((prev) =>
        prev.map((s) => (s.id === id ? { ...s, geometry, targetArea } : s))
      )

      recordChange({
        id,
        entityType: 'paddock',
        changeType: 'update',
        geometry,
        originalGeometry, // Store original for rationale dialog
        parentId: paddock?.pastureId,
        timestamp: new Date().toISOString(),
      })
    },
    [recordChange, paddocks]
  )

  const deletePaddock = useCallback(
    (id: string) => {
      const paddock = paddocks.find((s) => s.id === id)
      setPaddocks((prev) => prev.filter((s) => s.id !== id))
      recordChange({
        id,
        entityType: 'paddock',
        changeType: 'delete',
        parentId: paddock?.pastureId,
        timestamp: new Date().toISOString(),
      })
    },
    [recordChange, paddocks]
  )

  const updatePaddockMetadata = useCallback(
    (id: string, metadata: Partial<Omit<Paddock, 'id' | 'pastureId' | 'geometry'>>) => {
      setPaddocks((prev) => prev.map((s) => (s.id === id ? { ...s, ...metadata } : s)))
      if (onPaddockMetadataChange) {
        void onPaddockMetadataChange(id, metadata)
      }
    },
    [onPaddockMetadataChange]
  )

  // No-graze zone operations
  const addNoGrazeZone = useCallback(
    (
      geometry: Feature<Polygon>,
      metadata?: Partial<Omit<NoGrazeZone, 'id' | 'farmId' | 'geometry' | 'createdAt' | 'updatedAt'>>
    ): string => {
      const id = `ngz-${generateId()}`
      const now = new Date().toISOString()
      const area = calculateAreaHectares(geometry)
      const defaults = createDefaultNoGrazeZoneMetadata()
      const newZone: NoGrazeZone = {
        ...defaults,
        ...metadata,
        id,
        farmId: '', // Will be set by backend
        area: metadata?.area ?? area,
        geometry,
        createdAt: now,
        updatedAt: now,
      }

      setNoGrazeZones((prev) => [...prev, newZone])
      recordChange({
        id,
        entityType: 'noGrazeZone',
        changeType: 'add',
        geometry,
        metadata: { name: newZone.name, type: newZone.type, area: newZone.area },
        timestamp: now,
      })

      return id
    },
    [recordChange]
  )

  const updateNoGrazeZone = useCallback(
    (id: string, geometry: Feature<Polygon>) => {
      console.log('[GeometryContext] updateNoGrazeZone:', { id, area: calculateAreaHectares(geometry) })
      const area = calculateAreaHectares(geometry)
      setNoGrazeZones((prev) =>
        prev.map((z) => (z.id === id ? { ...z, geometry, area, updatedAt: new Date().toISOString() } : z))
      )
      recordChange({
        id,
        entityType: 'noGrazeZone',
        changeType: 'update',
        geometry,
        metadata: { area },
        timestamp: new Date().toISOString(),
      })
    },
    [recordChange]
  )

  const updateNoGrazeZoneMetadata = useCallback(
    (id: string, metadata: Partial<Omit<NoGrazeZone, 'id' | 'farmId' | 'geometry' | 'createdAt' | 'updatedAt'>>) => {
      console.log('[GeometryContext] updateNoGrazeZoneMetadata:', { id, metadata })
      setNoGrazeZones((prev) =>
        prev.map((z) => (z.id === id ? { ...z, ...metadata, updatedAt: new Date().toISOString() } : z))
      )
    },
    []
  )

  const deleteNoGrazeZone = useCallback(
    (id: string) => {
      console.log('[GeometryContext] deleteNoGrazeZone:', { id })
      const zoneExists = noGrazeZones.find((z) => z.id === id)
      console.log('[GeometryContext] deleteNoGrazeZone - zone exists:', { found: !!zoneExists, zoneName: zoneExists?.name })
      setNoGrazeZones((prev) => {
        const filtered = prev.filter((z) => z.id !== id)
        console.log('[GeometryContext] deleteNoGrazeZone - zones after filter:', { before: prev.length, after: filtered.length })
        return filtered
      })
      recordChange({
        id,
        entityType: 'noGrazeZone',
        changeType: 'delete',
        timestamp: new Date().toISOString(),
      })
      console.log('[GeometryContext] deleteNoGrazeZone - change recorded')
    },
    [recordChange, noGrazeZones]
  )

  const getNoGrazeZoneById = useCallback(
    (id: string): NoGrazeZone | undefined => {
      const result = noGrazeZones.find((z) => z.id === id)
      console.log('[GeometryContext] getNoGrazeZoneById:', { id, found: !!result, zoneName: result?.name })
      return result
    },
    [noGrazeZones]
  )

  // Water source operations
  const addWaterSource = useCallback(
    (
      geometry: Feature<Point | Polygon>,
      geometryType: 'point' | 'polygon',
      metadata?: Partial<Omit<WaterSource, 'id' | 'farmId' | 'geometry' | 'geometryType' | 'createdAt' | 'updatedAt'>>
    ): string => {
      const id = `ws-${generateId()}`
      const now = new Date().toISOString()
      // Calculate area only for polygon types
      const area = geometryType === 'polygon'
        ? calculateAreaHectares(geometry as Feature<Polygon>)
        : undefined
      const newSource: WaterSource = {
        ...createDefaultWaterSourceMetadata(),
        ...metadata,
        id,
        farmId: '', // Will be set by backend
        geometryType,
        geometry,
        area: metadata?.area ?? area,
        createdAt: now,
        updatedAt: now,
      }

      setWaterSources((prev) => [...prev, newSource])
      recordChange({
        id,
        entityType: geometryType === 'point' ? 'waterPoint' : 'waterPolygon',
        changeType: 'add',
        geometry: stripAnyFeatureId(geometry) as Feature<Polygon>,
        metadata: { name: newSource.name, type: newSource.type, geometryType, area: newSource.area },
        timestamp: now,
      })

      return id
    },
    [recordChange]
  )

  const updateWaterSource = useCallback(
    (id: string, geometry: Feature<Point | Polygon>) => {
      const source = waterSources.find((s) => s.id === id)
      // Recalculate area for polygon types
      const area = source?.geometryType === 'polygon'
        ? calculateAreaHectares(geometry as Feature<Polygon>)
        : undefined
      setWaterSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, geometry, area: s.geometryType === 'polygon' ? area : s.area, updatedAt: new Date().toISOString() } : s))
      )
      if (source) {
        recordChange({
          id,
          entityType: source.geometryType === 'point' ? 'waterPoint' : 'waterPolygon',
          changeType: 'update',
          geometry: stripAnyFeatureId(geometry) as Feature<Polygon>,
          metadata: area !== undefined ? { area } : undefined,
          timestamp: new Date().toISOString(),
        })
      }
    },
    [recordChange, waterSources]
  )

  const updateWaterSourceMetadata = useCallback(
    (id: string, metadata: Partial<Omit<WaterSource, 'id' | 'farmId' | 'geometry' | 'geometryType' | 'createdAt' | 'updatedAt'>>) => {
      setWaterSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...metadata, updatedAt: new Date().toISOString() } : s))
      )
    },
    []
  )

  const deleteWaterSource = useCallback(
    (id: string) => {
      const source = waterSources.find((s) => s.id === id)
      setWaterSources((prev) => prev.filter((s) => s.id !== id))
      if (source) {
        recordChange({
          id,
          entityType: source.geometryType === 'point' ? 'waterPoint' : 'waterPolygon',
          changeType: 'delete',
          timestamp: new Date().toISOString(),
        })
      }
    },
    [recordChange, waterSources]
  )

  const getWaterSourceById = useCallback(
    (id: string): WaterSource | undefined => {
      return waterSources.find((s) => s.id === id)
    },
    [waterSources]
  )

  // Utility functions
  const getPastureById = useCallback(
    (id: string): Pasture | undefined => {
      return pastures.find((p) => p.id === id)
    },
    [pastures]
  )

  const getPaddockById = useCallback(
    (id: string): Paddock | undefined => {
      return paddocks.find((s) => s.id === id)
    },
    [paddocks]
  )

  const getPaddocksByPastureId = useCallback(
    (pastureId: string): Paddock[] => {
      return paddocks.filter((s) => s.pastureId === pastureId)
    },
    [paddocks]
  )

  const resetToInitial = useCallback(() => {
    const resetPastures = normalizePastures(initialPastures ?? mockPastures)
    console.log('[GeometryContext] resetToInitial called, resetting to:', resetPastures.map(p => ({
      id: p.id,
      name: p.name,
      firstCoord: p.geometry.geometry.coordinates[0]?.[0],
    })))
    setPastures(resetPastures)
    setPaddocks(normalizePaddocks(initialPaddocks ?? []))
    setNoGrazeZones(initialNoGrazeZones ?? [])
    setWaterSources(initialWaterSources ?? [])
    setPendingChanges([])
    setResetCounter((c) => c + 1)
  }, [initialPastures, initialPaddocks, initialNoGrazeZones, initialWaterSources])

  const value = useMemo<GeometryContextValue>(
    () => ({
      pastures,
      paddocks,
      noGrazeZones,
      waterSources,
      pendingChanges,
      hasUnsavedChanges,
      isSaving,
      resetCounter,
      addPasture,
      updatePasture,
      updatePastureMetadata,
      deletePasture,
      addPaddock,
      updatePaddock,
      updatePaddockMetadata,
      deletePaddock,
      addNoGrazeZone,
      updateNoGrazeZone,
      updateNoGrazeZoneMetadata,
      deleteNoGrazeZone,
      getNoGrazeZoneById,
      addWaterSource,
      updateWaterSource,
      updateWaterSourceMetadata,
      deleteWaterSource,
      getWaterSourceById,
      getPastureById,
      getPaddockById,
      getPaddocksByPastureId,
      saveChanges,
      onGeometryChange,
      onPastureMetadataChange,
      resetToInitial,
    }),
    [
      pastures,
      paddocks,
      noGrazeZones,
      waterSources,
      pendingChanges,
      hasUnsavedChanges,
      isSaving,
      resetCounter,
      addPasture,
      updatePasture,
      updatePastureMetadata,
      deletePasture,
      addPaddock,
      updatePaddock,
      updatePaddockMetadata,
      deletePaddock,
      addNoGrazeZone,
      updateNoGrazeZone,
      updateNoGrazeZoneMetadata,
      deleteNoGrazeZone,
      getNoGrazeZoneById,
      addWaterSource,
      updateWaterSource,
      updateWaterSourceMetadata,
      deleteWaterSource,
      getWaterSourceById,
      getPastureById,
      getPaddockById,
      getPaddocksByPastureId,
      saveChanges,
      onGeometryChange,
      onPastureMetadataChange,
      resetToInitial,
    ]
  )

  return <GeometryContext.Provider value={value}>{children}</GeometryContext.Provider>
}

export function useGeometry(): GeometryContextValue {
  const context = useContext(GeometryContext)
  if (!context) {
    throw new Error('useGeometry must be used within a GeometryProvider')
  }
  return context
}

export { GeometryContext }
