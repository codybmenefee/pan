/**
 * Context assembly for agent prompts.
 *
 * Assembles farm data from Convex into structured context objects
 * for agent prompts.
 */

import type { Id } from '../../convex/_generated/dataModel'
import type { ConvexClient } from 'convex/browser'
import type { api } from '../../convex/_generated/api'

export interface FarmContext {
  farm: {
    id: string
    name: string
    location: string
    totalArea: number
    pastureCount: number
  }
  settings: {
    minNDVIThreshold: number
    minRestPeriod: number
    cloudCoverTolerance: number
  }
  pastures: Array<{
    id: string
    externalId: string
    name: string
    status: string
    ndvi: number
    restDays: number
    area: number
    waterAccess: string
    lastGrazed: string
  }>
  observations: Array<{
    paddockExternalId: string
    date: string
    ndviMean: number
    ndviMin: number
    ndviMax: number
    isValid: boolean
  }>
  farmerObservations: Array<{
    level: 'farm' | 'paddock' | 'zone'
    targetId: string
    content: string
    tags?: string[]
    createdAt: string
  }>
  plans: Array<{
    date: string
    primaryPaddockExternalId?: string
    confidenceScore: number
    status: string
    feedback?: string
  }>
}

export async function assembleFarmContext(
  convex: ConvexClient,
  farmId: Id<'farms'>,
  farmExternalId: string
): Promise<FarmContext> {
  // Fetch all data in parallel
  const [
    farm,
    settings,
    pastures,
    latestObservations,
    recentFarmerObservations,
    recentPlans,
  ] = await Promise.all([
    convex.query(api.farms.getByExternalId, { externalId: farmExternalId }),
    convex.query(api.settings.getByFarmExternalId, {
      farmExternalId,
    }),
    convex.query(api.paddocks.listByFarm, { farmId }),
    convex.query(api.observations.getObservations, {
      farmId: farmExternalId,
      days: 7,
    }),
    convex.query(api.farmerObservations.listRecent, {
      farmId,
      limit: 5,
    }),
    convex.query(api.intelligence.getRecentPlans, {
      farmExternalId,
      limit: 5,
    }),
  ])

  if (!farm) {
    throw new Error(`Farm not found: ${farmExternalId}`)
  }

  // Get latest observation per pasture
  const observationsByPasture = new Map<string, any>()
  for (const obs of latestObservations || []) {
    const existing = observationsByPasture.get(obs.paddockExternalId)
    if (!existing || new Date(obs.date) > new Date(existing.date)) {
      observationsByPasture.set(obs.paddockExternalId, obs)
    }
  }

  // Map pastures with their latest observations
  const pasturesWithData = (pastures || []).map((p) => {
    const obs = observationsByPasture.get(p.externalId)
    return {
      id: p._id,
      externalId: p.externalId,
      name: p.name,
      status: p.status,
      ndvi: obs?.ndviMean ?? p.ndvi,
      restDays: p.restDays,
      area: p.area,
      waterAccess: p.waterAccess,
      lastGrazed: p.lastGrazed,
    }
  })

  return {
    farm: {
      id: farm._id,
      name: farm.name,
      location: farm.location,
      totalArea: farm.totalArea,
      pastureCount: farm.paddockCount,
    },
    settings: {
      minNDVIThreshold: settings?.minNDVIThreshold ?? 0.4,
      minRestPeriod: settings?.minRestPeriod ?? 21,
      cloudCoverTolerance: settings?.cloudCoverTolerance ?? 50,
    },
    pastures: pasturesWithData,
    observations: Array.from(observationsByPasture.values()),
    farmerObservations: (recentFarmerObservations || []).map((fo) => ({
      level: fo.level,
      targetId: fo.targetId,
      content: fo.content,
      tags: fo.tags,
      createdAt: fo.createdAt,
    })),
    plans: (recentPlans || []).map((p) => ({
      date: p.date,
      primaryPaddockExternalId: p.primaryPaddockExternalId,
      confidenceScore: p.confidenceScore,
      status: p.status,
      feedback: p.feedback,
    })),
  }
}

export function formatContextForPrompt(context: FarmContext): string {
  const lines: string[] = []

  lines.push(`Farm: ${context.farm.name}`)
  lines.push(`Location: ${context.farm.location}`)
  lines.push(`Total Area: ${context.farm.totalArea} hectares`)
  lines.push(`Pastures: ${context.farm.pastureCount}`)
  lines.push('')

  lines.push('Farm Settings:')
  lines.push(`  NDVI Threshold: ${context.settings.minNDVIThreshold}`)
  lines.push(`  Min Rest Period: ${context.settings.minRestPeriod} days`)
  lines.push(`  Cloud Cover Tolerance: ${context.settings.cloudCoverTolerance}%`)
  lines.push('')

  lines.push('Pastures:')
  for (const pasture of context.pastures) {
    lines.push(
      `  ${pasture.name} (${pasture.externalId}): NDVI ${pasture.ndvi.toFixed(2)}, ` +
        `${pasture.restDays} rest days, Status: ${pasture.status}`
    )
  }
  lines.push('')

  if (context.farmerObservations.length > 0) {
    lines.push('Recent Farmer Observations:')
    for (const obs of context.farmerObservations) {
      lines.push(`  [${obs.level}] ${obs.content}`)
      if (obs.tags && obs.tags.length > 0) {
        lines.push(`    Tags: ${obs.tags.join(', ')}`)
      }
    }
    lines.push('')
  }

  if (context.plans.length > 0) {
    lines.push('Recent Plans:')
    for (const plan of context.plans) {
      lines.push(
        `  ${plan.date}: ${plan.primaryPaddockExternalId || 'None'} ` +
          `(confidence: ${plan.confidenceScore.toFixed(2)}, status: ${plan.status})`
      )
    }
    lines.push('')
  }

  return lines.join('\n')
}
