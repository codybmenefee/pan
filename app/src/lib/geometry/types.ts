import type { Feature, Point, Polygon } from 'geojson'
import type { Paddock, Section, NoGrazeZone, WaterSource } from '@/lib/types'

export type GeometryChangeType = 'add' | 'update' | 'delete'
export type EntityType = 'paddock' | 'section' | 'noGrazeZone' | 'waterPoint' | 'waterPolygon'

export type PaddockMetadata = Omit<Paddock, 'id' | 'geometry'>
export type SectionMetadata = Omit<Section, 'id' | 'paddockId' | 'geometry'>
export type NoGrazeZoneMetadata = Omit<NoGrazeZone, 'id' | 'farmId' | 'geometry' | 'createdAt' | 'updatedAt'>
export type WaterSourceMetadata = Omit<WaterSource, 'id' | 'farmId' | 'geometry' | 'createdAt' | 'updatedAt'>

export interface GeometryChange {
  id: string
  entityType: EntityType
  changeType: GeometryChangeType
  geometry?: Feature<Polygon>
  originalGeometry?: Feature<Polygon> // Original geometry before modification (for section updates)
  parentId?: string // paddockId for sections
  timestamp: string
  metadata?: Partial<PaddockMetadata | SectionMetadata | NoGrazeZoneMetadata | WaterSourceMetadata>
}

export interface PendingChange extends GeometryChange {
  synced: boolean
}

export interface GeometryContextValue {
  // State
  paddocks: Paddock[]
  sections: Section[]
  noGrazeZones: NoGrazeZone[]
  waterSources: WaterSource[]
  pendingChanges: PendingChange[]
  hasUnsavedChanges: boolean
  isSaving: boolean
  resetCounter: number

  // Paddock operations
  addPaddock: (geometry: Feature<Polygon>, metadata?: Partial<Omit<Paddock, 'id' | 'geometry'>>) => string
  updatePaddock: (id: string, geometry: Feature<Polygon>) => void
  updatePaddockMetadata: (id: string, metadata: Partial<Omit<Paddock, 'id' | 'geometry'>>) => void
  deletePaddock: (id: string) => void

  // Section operations
  addSection: (paddockId: string, geometry: Feature<Polygon>, metadata?: Partial<Omit<Section, 'id' | 'paddockId' | 'geometry'>>) => string
  updateSection: (id: string, geometry: Feature<Polygon>) => void
  updateSectionMetadata: (id: string, metadata: Partial<SectionMetadata>) => void
  deleteSection: (id: string) => void

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
  getPaddockById: (id: string) => Paddock | undefined
  getSectionById: (id: string) => Section | undefined
  getSectionsByPaddockId: (paddockId: string) => Section[]

  // Save operations
  saveChanges: () => Promise<void>

  // Backend integration hook
  onGeometryChange?: (changes: GeometryChange[]) => Promise<void>
  onPaddockMetadataChange?: (id: string, metadata: Partial<PaddockMetadata>) => Promise<void>

  // Reset to initial state (useful for testing/demo)
  resetToInitial: () => void
}

export interface GeometryProviderProps {
  children: React.ReactNode
  initialPaddocks?: Paddock[]
  initialSections?: Section[]
  initialNoGrazeZones?: NoGrazeZone[]
  initialWaterSources?: WaterSource[]
  onGeometryChange?: (changes: GeometryChange[]) => Promise<void>
  onPaddockMetadataChange?: (id: string, metadata: Partial<PaddockMetadata>) => Promise<void>
  onSectionMetadataChange?: (id: string, metadata: Partial<SectionMetadata>) => Promise<void>
}
