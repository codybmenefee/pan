/**
 * localStorage data layer for demo mode.
 * Stores ephemeral edits that override Convex data for public demo users.
 */

import type { FarmSettings, Paddock, NoGrazeZone, WaterSource, Section } from '@/lib/types'
import type { GeometryChange } from '@/lib/geometry/types'
import type { Feature, Polygon, Point } from 'geojson'

// Storage key prefix
const DEMO_EDITS_KEY = 'demo-edits'

/**
 * Farmer observation stored in localStorage.
 */
export interface DemoFarmerObservation {
  id: string
  farmId: string
  authorId: string
  level: 'farm' | 'paddock' | 'zone'
  targetId: string
  content: string
  tags?: string[]
  createdAt: string
}

/**
 * Structure of stored demo edits.
 * Each field stores the full entity data, keyed by entity ID.
 */
export interface DemoEdits {
  // Geometry edits (paddocks, zones, water sources)
  paddocks?: Record<string, Paddock | null> // null = deleted
  noGrazeZones?: Record<string, NoGrazeZone | null>
  waterSources?: Record<string, WaterSource | null>
  sections?: Record<string, Section | null>

  // Settings override
  settings?: FarmSettings | null

  // Farmer observations
  farmerObservations?: DemoFarmerObservation[]

  // Track pending geometry changes (for batching)
  pendingGeometryChanges?: GeometryChange[]
}

/**
 * Get the storage key for a session.
 */
function getStorageKey(sessionId: string): string {
  return `${DEMO_EDITS_KEY}-${sessionId}`
}

/**
 * Get all demo edits for a session.
 */
export function getDemoEdits(sessionId: string): DemoEdits {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const stored = localStorage.getItem(getStorageKey(sessionId))
    if (!stored) {
      return {}
    }
    return JSON.parse(stored) as DemoEdits
  } catch (error) {
    console.error('[demoLocalStorage] Failed to parse demo edits:', error)
    return {}
  }
}

/**
 * Save all demo edits for a session.
 */
export function setDemoEdits(sessionId: string, edits: DemoEdits): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(getStorageKey(sessionId), JSON.stringify(edits))
  } catch (error) {
    console.error('[demoLocalStorage] Failed to save demo edits:', error)
  }
}

/**
 * Clear all demo edits for a session.
 */
export function clearDemoEdits(sessionId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(getStorageKey(sessionId))
}

/**
 * Update a specific paddock in demo edits.
 */
export function setDemoPaddock(sessionId: string, paddockId: string, paddock: Paddock | null): void {
  const edits = getDemoEdits(sessionId)
  edits.paddocks = edits.paddocks ?? {}
  edits.paddocks[paddockId] = paddock
  setDemoEdits(sessionId, edits)
}

/**
 * Update a specific no-graze zone in demo edits.
 */
export function setDemoNoGrazeZone(sessionId: string, zoneId: string, zone: NoGrazeZone | null): void {
  const edits = getDemoEdits(sessionId)
  edits.noGrazeZones = edits.noGrazeZones ?? {}
  edits.noGrazeZones[zoneId] = zone
  setDemoEdits(sessionId, edits)
}

/**
 * Update a specific water source in demo edits.
 */
export function setDemoWaterSource(sessionId: string, sourceId: string, source: WaterSource | null): void {
  const edits = getDemoEdits(sessionId)
  edits.waterSources = edits.waterSources ?? {}
  edits.waterSources[sourceId] = source
  setDemoEdits(sessionId, edits)
}

/**
 * Update a specific section in demo edits.
 */
export function setDemoSection(sessionId: string, sectionId: string, section: Section | null): void {
  const edits = getDemoEdits(sessionId)
  edits.sections = edits.sections ?? {}
  edits.sections[sectionId] = section
  setDemoEdits(sessionId, edits)
}

/**
 * Update demo settings.
 */
export function setDemoSettings(sessionId: string, settings: FarmSettings | null): void {
  const edits = getDemoEdits(sessionId)
  edits.settings = settings
  setDemoEdits(sessionId, edits)
}

/**
 * Get demo settings override.
 */
export function getDemoSettings(sessionId: string): FarmSettings | null | undefined {
  const edits = getDemoEdits(sessionId)
  return edits.settings
}

/**
 * Get farmer observations from localStorage.
 */
export function getDemoFarmerObservations(sessionId: string): DemoFarmerObservation[] {
  const edits = getDemoEdits(sessionId)
  return edits.farmerObservations ?? []
}

/**
 * Add a farmer observation to localStorage.
 */
export function addDemoFarmerObservation(sessionId: string, observation: DemoFarmerObservation): void {
  const edits = getDemoEdits(sessionId)
  const observations = edits.farmerObservations ?? []
  observations.push(observation)
  edits.farmerObservations = observations
  setDemoEdits(sessionId, edits)
}

/**
 * Merge localStorage overrides with Convex base data.
 * Returns merged arrays with localStorage edits taking precedence.
 */
export function mergeDemoData<T extends { id: string }>(
  sessionId: string,
  baseData: T[],
  editKey: keyof Pick<DemoEdits, 'paddocks' | 'noGrazeZones' | 'waterSources' | 'sections'>
): T[] {
  const edits = getDemoEdits(sessionId)
  const overrides = edits[editKey] as Record<string, T | null> | undefined

  if (!overrides) {
    return baseData
  }

  // Start with base data, applying overrides
  const result: T[] = []
  const seenIds = new Set<string>()

  // Process base data, applying overrides
  for (const item of baseData) {
    seenIds.add(item.id)
    const override = overrides[item.id]

    if (override === null) {
      // Item was deleted in localStorage
      continue
    } else if (override !== undefined) {
      // Item was modified in localStorage
      result.push(override)
    } else {
      // No override, use base data
      result.push(item)
    }
  }

  // Add any new items from localStorage that weren't in base data
  for (const [id, item] of Object.entries(overrides)) {
    if (!seenIds.has(id) && item !== null) {
      result.push(item)
    }
  }

  return result
}

/**
 * Create a paddock entity from geometry change data.
 */
export function createPaddockFromChange(
  change: GeometryChange,
  _farmId: string
): Paddock {
  const metadata = change.metadata as Partial<Omit<Paddock, 'id' | 'geometry'>> | undefined
  return {
    id: change.id,
    name: metadata?.name ?? 'New Paddock',
    status: metadata?.status ?? 'ready',
    ndvi: metadata?.ndvi ?? 0,
    restDays: metadata?.restDays ?? 0,
    area: metadata?.area ?? 0,
    waterAccess: metadata?.waterAccess ?? 'unknown',
    lastGrazed: metadata?.lastGrazed ?? new Date().toISOString().split('T')[0],
    geometry: change.geometry as Feature<Polygon>,
  }
}

/**
 * Create a no-graze zone entity from geometry change data.
 */
export function createNoGrazeZoneFromChange(
  change: GeometryChange,
  farmId: string
): NoGrazeZone {
  const metadata = change.metadata as Partial<Omit<NoGrazeZone, 'id' | 'farmId' | 'geometry' | 'createdAt' | 'updatedAt'>> | undefined
  const now = new Date().toISOString()
  return {
    id: change.id,
    farmId,
    name: metadata?.name ?? 'New No-graze Zone',
    type: metadata?.type ?? 'other',
    area: metadata?.area ?? 0,
    description: metadata?.description,
    geometry: change.geometry as Feature<Polygon>,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Create a water source entity from geometry change data.
 */
export function createWaterSourceFromChange(
  change: GeometryChange,
  farmId: string
): WaterSource {
  const metadata = change.metadata as Partial<Omit<WaterSource, 'id' | 'farmId' | 'geometry' | 'geometryType' | 'createdAt' | 'updatedAt'>> | undefined
  const now = new Date().toISOString()
  const geometryType = change.entityType === 'waterPoint' ? 'point' : 'polygon'
  return {
    id: change.id,
    farmId,
    name: metadata?.name ?? 'New Water Source',
    type: metadata?.type ?? 'other',
    geometryType,
    geometry: change.geometry as Feature<Point | Polygon>,
    area: metadata?.area,
    description: metadata?.description,
    status: metadata?.status,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Create a section entity from geometry change data.
 */
export function createSectionFromChange(
  change: GeometryChange
): Section {
  const metadata = change.metadata as Partial<Omit<Section, 'id' | 'paddockId' | 'geometry'>> | undefined
  return {
    id: change.id,
    paddockId: change.parentId ?? '',
    date: metadata?.date ?? new Date().toISOString().split('T')[0],
    geometry: change.geometry as Feature<Polygon>,
    targetArea: metadata?.targetArea ?? 0,
    reasoning: metadata?.reasoning ?? [],
  }
}

/**
 * Check if there are any demo edits stored for a session.
 */
export function hasDemoEdits(sessionId: string): boolean {
  const edits = getDemoEdits(sessionId)
  return !!(
    (edits.paddocks && Object.keys(edits.paddocks).length > 0) ||
    (edits.noGrazeZones && Object.keys(edits.noGrazeZones).length > 0) ||
    (edits.waterSources && Object.keys(edits.waterSources).length > 0) ||
    (edits.sections && Object.keys(edits.sections).length > 0) ||
    edits.settings !== undefined
  )
}
