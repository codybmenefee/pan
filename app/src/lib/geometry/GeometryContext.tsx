import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { Feature, Polygon } from 'geojson'
import type { Paddock, Section } from '@/lib/types'
import type {
  GeometryContextValue,
  GeometryProviderProps,
  GeometryChange,
  PendingChange,
} from './types'
import { paddocks as mockPaddocks } from '@/data/mock/paddocks'
import { calculateAreaHectares } from './geometryUtils'

const GeometryContext = createContext<GeometryContextValue | null>(null)

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createDefaultPaddockMetadata(): Omit<Paddock, 'id' | 'geometry'> {
  return {
    name: 'New Paddock',
    status: 'recovering',
    ndvi: 0.35,
    restDays: 0,
    area: 0,
    waterAccess: 'None',
    lastGrazed: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }
}

function createDefaultSectionMetadata(): Omit<Section, 'id' | 'paddockId' | 'geometry'> {
  return {
    date: new Date().toISOString().split('T')[0],
    targetArea: 0,
    reasoning: ['User-defined section'],
  }
}

function normalizePaddocks(list: Paddock[]): Paddock[] {
  return list.map((paddock) => ({
    ...paddock,
    area: calculateAreaHectares(paddock.geometry),
  }))
}

function normalizeSections(list: Section[]): Section[] {
  return list.map((section) => ({
    ...section,
    targetArea: calculateAreaHectares(section.geometry),
  }))
}

function stripFeatureId(feature: Feature<Polygon>): Feature<Polygon> {
  const { id: _id, ...rest } = feature as Feature<Polygon> & { id?: string | number }
  return rest
}

export function GeometryProvider({
  children,
  initialPaddocks,
  initialSections,
  onGeometryChange,
  onPaddockMetadataChange,
}: GeometryProviderProps) {
  const [paddocks, setPaddocks] = useState<Paddock[]>(() => {
    const source = initialPaddocks ?? mockPaddocks
    return normalizePaddocks(source)
  })
  const [sections, setSections] = useState<Section[]>(() => {
    const source = initialSections ?? []
    return normalizeSections(source)
  })
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isSaving, setIsSaving] = useState(false)

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

  // Paddock operations
  const addPaddock = useCallback(
    (geometry: Feature<Polygon>, metadata?: Partial<Omit<Paddock, 'id' | 'geometry'>>): string => {
      const id = `p-${generateId()}`
      const area = calculateAreaHectares(geometry)
      const newPaddock: Paddock = {
        ...createDefaultPaddockMetadata(),
        ...metadata,
        id,
        geometry,
        area: metadata?.area ?? area,
      }

      setPaddocks((prev) => [...prev, newPaddock])
      const changeMetadata = {
        name: newPaddock.name,
        status: newPaddock.status,
        ndvi: newPaddock.ndvi,
        restDays: newPaddock.restDays,
        area: newPaddock.area,
        waterAccess: newPaddock.waterAccess,
        lastGrazed: newPaddock.lastGrazed,
      }
      recordChange({
        id,
        entityType: 'paddock',
        changeType: 'add',
        geometry,
        metadata: changeMetadata,
        timestamp: new Date().toISOString(),
      })

      return id
    },
    [recordChange]
  )

  const updatePaddock = useCallback(
    (id: string, geometry: Feature<Polygon>) => {
      const area = calculateAreaHectares(geometry)
      setPaddocks((prev) =>
        prev.map((p) => (p.id === id ? { ...p, geometry, area } : p))
      )
      recordChange({
        id,
        entityType: 'paddock',
        changeType: 'update',
        geometry,
        timestamp: new Date().toISOString(),
      })
    },
    [recordChange]
  )

  const updatePaddockMetadata = useCallback(
    (id: string, metadata: Partial<Omit<Paddock, 'id' | 'geometry'>>) => {
      setPaddocks((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...metadata } : p))
      )
      if (onPaddockMetadataChange) {
        void onPaddockMetadataChange(id, metadata)
      }
    },
    [onPaddockMetadataChange]
  )

  const deletePaddock = useCallback(
    (id: string) => {
      setPaddocks((prev) => prev.filter((p) => p.id !== id))
      // Also delete all sections in this paddock
      setSections((prev) => prev.filter((s) => s.paddockId !== id))
      recordChange({
        id,
        entityType: 'paddock',
        changeType: 'delete',
        timestamp: new Date().toISOString(),
      })
    },
    [recordChange]
  )

  // Section operations
  const addSection = useCallback(
    (
      paddockId: string,
      geometry: Feature<Polygon>,
      metadata?: Partial<Omit<Section, 'id' | 'paddockId' | 'geometry'>>
    ): string => {
      const id = `s-${generateId()}`
      const targetArea = calculateAreaHectares(geometry)
      const newSection: Section = {
        ...createDefaultSectionMetadata(),
        ...metadata,
        id,
        paddockId,
        geometry,
        targetArea: metadata?.targetArea ?? targetArea,
      }

      setSections((prev) => [...prev, newSection])
      recordChange({
        id,
        entityType: 'section',
        changeType: 'add',
        geometry,
        parentId: paddockId,
        timestamp: new Date().toISOString(),
      })

      return id
    },
    [recordChange]
  )

  const updateSection = useCallback(
    (id: string, geometry: Feature<Polygon>) => {
      const targetArea = calculateAreaHectares(geometry)
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, geometry, targetArea } : s))
      )

      const section = sections.find((s) => s.id === id)
      recordChange({
        id,
        entityType: 'section',
        changeType: 'update',
        geometry,
        parentId: section?.paddockId,
        timestamp: new Date().toISOString(),
      })
    },
    [recordChange, sections]
  )

  const deleteSection = useCallback(
    (id: string) => {
      const section = sections.find((s) => s.id === id)
      setSections((prev) => prev.filter((s) => s.id !== id))
      recordChange({
        id,
        entityType: 'section',
        changeType: 'delete',
        parentId: section?.paddockId,
        timestamp: new Date().toISOString(),
      })
    },
    [recordChange, sections]
  )

  // Utility functions
  const getPaddockById = useCallback(
    (id: string): Paddock | undefined => {
      return paddocks.find((p) => p.id === id)
    },
    [paddocks]
  )

  const getSectionById = useCallback(
    (id: string): Section | undefined => {
      return sections.find((s) => s.id === id)
    },
    [sections]
  )

  const getSectionsByPaddockId = useCallback(
    (paddockId: string): Section[] => {
      return sections.filter((s) => s.paddockId === paddockId)
    },
    [sections]
  )

  const resetToInitial = useCallback(() => {
    setPaddocks(normalizePaddocks(initialPaddocks ?? mockPaddocks))
    setSections(normalizeSections(initialSections ?? []))
    setPendingChanges([])
  }, [initialPaddocks, initialSections])

  const value = useMemo<GeometryContextValue>(
    () => ({
      paddocks,
      sections,
      pendingChanges,
      hasUnsavedChanges,
      isSaving,
      addPaddock,
      updatePaddock,
      updatePaddockMetadata,
      deletePaddock,
      addSection,
      updateSection,
      deleteSection,
      getPaddockById,
      getSectionById,
      getSectionsByPaddockId,
      saveChanges,
      onGeometryChange,
      onPaddockMetadataChange,
      resetToInitial,
    }),
    [
      paddocks,
      sections,
      pendingChanges,
      hasUnsavedChanges,
      isSaving,
      addPaddock,
      updatePaddock,
      updatePaddockMetadata,
      deletePaddock,
      addSection,
      updateSection,
      deleteSection,
      getPaddockById,
      getSectionById,
      getSectionsByPaddockId,
      saveChanges,
      onGeometryChange,
      onPaddockMetadataChange,
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
