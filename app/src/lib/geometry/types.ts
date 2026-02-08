import type { Feature, Point, Polygon } from 'geojson'
import type { Pasture, Paddock, NoGrazeZone, WaterSource } from '@/lib/types'

export type GeometryChangeType = 'add' | 'update' | 'delete'
export type EntityType = 'pasture' | 'paddock' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'

// Legacy entity type values for backward compatibility with stored data
export function isPastureEntity(type: string): boolean {
  return type === 'pasture' || type === 'paddock'
}
export function isPaddockEntity(type: string): boolean {
  return type === 'paddock' || type === 'section'
}

export type PastureMetadata = Omit<Pasture, 'id' | 'geometry'>
export type PaddockMetadata = Omit<Paddock, 'id' | 'pastureId' | 'geometry'>
export type NoGrazeZoneMetadata = Omit<NoGrazeZone, 'id' | 'farmId' | 'geometry' | 'createdAt' | 'updatedAt'>
export type WaterSourceMetadata = Omit<WaterSource, 'id' | 'farmId' | 'geometry' | 'createdAt' | 'updatedAt'>

export interface GeometryChange {
  id: string
  entityType: EntityType
  changeType: GeometryChangeType
  geometry?: Feature<Polygon>
  originalGeometry?: Feature<Polygon> // Original geometry before modification (for paddock updates)
  parentId?: string // pastureId for paddocks
  timestamp: string
  metadata?: Partial<PastureMetadata | PaddockMetadata | NoGrazeZoneMetadata | WaterSourceMetadata>
}

export interface PendingChange extends GeometryChange {
  synced: boolean
}

export interface GeometryContextValue {
  // State
  pastures: Pasture[]
  paddocks: Paddock[]
  noGrazeZones: NoGrazeZone[]
  waterSources: WaterSource[]
  pendingChanges: PendingChange[]
  hasUnsavedChanges: boolean
  isSaving: boolean
  resetCounter: number

  // Pasture operations
  addPasture: (geometry: Feature<Polygon>, metadata?: Partial<Omit<Pasture, 'id' | 'geometry'>>) => string
  updatePasture: (id: string, geometry: Feature<Polygon>) => void
  updatePastureMetadata: (id: string, metadata: Partial<Omit<Pasture, 'id' | 'geometry'>>) => void
  deletePasture: (id: string) => void

  // Paddock operations
  addPaddock: (pastureId: string, geometry: Feature<Polygon>, metadata?: Partial<Omit<Paddock, 'id' | 'pastureId' | 'geometry'>>) => string
  updatePaddock: (id: string, geometry: Feature<Polygon>) => void
  updatePaddockMetadata: (id: string, metadata: Partial<PaddockMetadata>) => void
  deletePaddock: (id: string) => void

  // No-graze zone operations
  addNoGrazeZone: (geometry: Feature<Polygon>, metadata?: Partial<Omit<NoGrazeZone, 'id' | 'farmId' | 'geometry' | 'createdAt' | 'updatedAt'>>) => string
  updateNoGrazeZone: (id: string, geometry: Feature<Polygon>) => void
  updateNoGrazeZoneMetadata: (id: string, metadata: Partial<Omit<NoGrazeZone, 'id' | 'farmId' | 'geometry' | 'createdAt' | 'updatedAt'>>) => void
  deleteNoGrazeZone: (id: string) => void
  getNoGrazeZoneById: (id: string) => NoGrazeZone | undefined

  // Water source operations
  addWaterSource: (geometry: Feature<Point | Polygon>, geometryType: 'point' | 'polygon', metadata?: Partial<Omit<WaterSource, 'id' | 'farmId' | 'geometry' | 'geometryType' | 'createdAt' | 'updatedAt'>>) => string
  updateWaterSource: (id: string, geometry: Feature<Point | Polygon>) => void
  updateWaterSourceMetadata: (id: string, metadata: Partial<Omit<WaterSource, 'id' | 'farmId' | 'geometry' | 'geometryType' | 'createdAt' | 'updatedAt'>>) => void
  deleteWaterSource: (id: string) => void
  getWaterSourceById: (id: string) => WaterSource | undefined

  // Utility
  getPastureById: (id: string) => Pasture | undefined
  getPaddockById: (id: string) => Paddock | undefined
  getPaddocksByPastureId: (pastureId: string) => Paddock[]

  // Save operations
  saveChanges: () => Promise<void>

  // Backend integration hook
  onGeometryChange?: (changes: GeometryChange[]) => Promise<void>
  onPastureMetadataChange?: (id: string, metadata: Partial<PastureMetadata>) => Promise<void>

  // Reset to initial state (useful for testing/demo)
  resetToInitial: () => void
}

export interface GeometryProviderProps {
  children: React.ReactNode
  initialPastures?: Pasture[]
  initialPaddocks?: Paddock[]
  initialNoGrazeZones?: NoGrazeZone[]
  initialWaterSources?: WaterSource[]
  onGeometryChange?: (changes: GeometryChange[]) => Promise<void>
  onPastureMetadataChange?: (id: string, metadata: Partial<PastureMetadata>) => Promise<void>
  onPaddockMetadataChange?: (id: string, metadata: Partial<PaddockMetadata>) => Promise<void>
}
