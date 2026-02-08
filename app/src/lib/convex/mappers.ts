import type { Feature, Point, Polygon } from 'geojson'
import type { Farm, FarmSettings, MapPreferences, Pasture, Paddock, NoGrazeZone, WaterSource, WaterSourceType } from '@/lib/types'

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

export interface PastureDoc {
  _id: string
  externalId: string
  name: string
  status: Pasture['status']
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
  rotationFrequency?: number
  dailyBriefTime: string
  emailNotifications: boolean
  pushNotifications: boolean
  virtualFenceProvider?: string
  apiKey?: string
  areaUnit?: FarmSettings['areaUnit']
  agentProfileId?: 'conservative' | 'balanced' | 'aggressive' | 'custom'
  mapPreferences?: MapPreferences
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

export function mapPastureDoc(doc: PastureDoc): Pasture {
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
    rotationFrequency: doc.rotationFrequency ?? 1,
    dailyBriefTime: doc.dailyBriefTime,
    emailNotifications: doc.emailNotifications,
    pushNotifications: doc.pushNotifications,
    virtualFenceProvider: doc.virtualFenceProvider,
    apiKey: doc.apiKey,
    agentProfileId: doc.agentProfileId ?? 'balanced',
    mapPreferences: doc.mapPreferences ?? { showRGBSatellite: false },
    areaUnit: doc.areaUnit ?? 'hectares',
  }
}


export interface PaddockDoc {
  id: string
  paddockId: string
  date: string
  geometry: Polygon
  targetArea: number
  reasoning: string[]
}

export function mapPaddockDoc(doc: PaddockDoc): Paddock {
  console.log('[mapPaddockDoc] Mapping paddock:', doc.id, 'pastureId:', doc.paddockId, 'geometry:', doc.geometry)
  return {
    id: doc.id,
    pastureId: doc.paddockId,
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

export interface NoGrazeZoneDoc {
  _id: string
  farmId: string
  name: string
  type?: NoGrazeZone['type']
  area?: number
  description?: string
  geometry: Feature<Polygon>
  createdAt: string
  updatedAt: string
}

export function mapNoGrazeZoneDoc(doc: NoGrazeZoneDoc): NoGrazeZone {
  return {
    id: doc._id,
    farmId: doc.farmId,
    name: doc.name,
    type: doc.type ?? 'other',
    area: doc.area ?? 0,
    description: doc.description,
    geometry: doc.geometry,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export interface WaterSourceDoc {
  _id: string
  farmId: string
  name: string
  type: WaterSourceType
  geometryType: 'point' | 'polygon'
  geometry: Feature<Point | Polygon>
  area?: number
  description?: string
  status?: WaterSource['status']
  createdAt: string
  updatedAt: string
}

export function mapWaterSourceDoc(doc: WaterSourceDoc): WaterSource {
  return {
    id: doc._id,
    farmId: doc.farmId,
    name: doc.name,
    type: doc.type,
    geometryType: doc.geometryType,
    geometry: doc.geometry,
    area: doc.area,
    description: doc.description,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}
