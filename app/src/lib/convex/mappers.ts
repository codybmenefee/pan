import type { Feature, Polygon } from 'geojson'
import type { Farm, FarmSettings, Paddock, Section } from '@/lib/types'

export interface FarmDoc {
  _id: string
  externalId: string
  legacyExternalId?: string  // For migration: maps old farm-1 style IDs
  clerkOrgSlug?: string  // Clerk org slug
  name: string
  location: string
  totalArea: number
  paddockCount: number
  coordinates: number[]
  geometry: Feature<Polygon>
}

export interface PaddockDoc {
  _id: string
  externalId: string
  name: string
  status: Paddock['status']
  ndvi: number
  restDays: number
  area: number
  waterAccess: string
  lastGrazed: string
  geometry: Feature<Polygon>
}

export interface UserDoc {
  _id: string
  externalId: string
  farmExternalId: string
  activeFarmExternalId?: string  // Currently selected farm (Clerk org ID)
  name?: string
  email?: string
}

export interface FarmSettingsDoc {
  _id: string
  farmExternalId: string
  minNDVIThreshold: number
  minRestPeriod: number
  cloudCoverTolerance: number
  dailyBriefTime: string
  emailNotifications: boolean
  pushNotifications: boolean
  virtualFenceProvider?: string
  apiKey?: string
}

export function mapFarmDoc(doc: FarmDoc): Farm {
  return {
    id: doc.externalId,
    name: doc.name,
    location: doc.location,
    totalArea: doc.totalArea,
    paddockCount: doc.paddockCount,
    coordinates: [doc.coordinates[0], doc.coordinates[1]],
    geometry: doc.geometry,
  }
}

export function mapPaddockDoc(doc: PaddockDoc): Paddock {
  return {
    id: doc.externalId,
    name: doc.name,
    status: doc.status,
    ndvi: doc.ndvi,
    restDays: doc.restDays,
    area: doc.area,
    waterAccess: doc.waterAccess,
    lastGrazed: doc.lastGrazed,
    geometry: doc.geometry,
  }
}

export function mapFarmSettingsDoc(doc: FarmSettingsDoc): FarmSettings {
  return {
    minNDVIThreshold: doc.minNDVIThreshold,
    minRestPeriod: doc.minRestPeriod,
    cloudCoverTolerance: doc.cloudCoverTolerance,
    dailyBriefTime: doc.dailyBriefTime,
    emailNotifications: doc.emailNotifications,
    pushNotifications: doc.pushNotifications,
    virtualFenceProvider: doc.virtualFenceProvider,
    apiKey: doc.apiKey,
  }
}


export interface SectionDoc {
  id: string
  paddockId: string
  date: string
  geometry: any
  targetArea: number
  reasoning: string[]
}

export function mapSectionDoc(doc: SectionDoc): Section {
  console.log('[mapSectionDoc] Mapping section:', doc.id, 'paddockId:', doc.paddockId, 'geometry:', doc.geometry)
  return {
    id: doc.id,
    paddockId: doc.paddockId,
    date: doc.date,
    geometry: {
      type: 'Feature',
      properties: {},
      geometry: doc.geometry,
    },
    targetArea: doc.targetArea,
    reasoning: doc.reasoning,
  }
}
