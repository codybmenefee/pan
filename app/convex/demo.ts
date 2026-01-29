import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'

// Source farm to copy data from (dev user's farm)
const SOURCE_FARM_EXTERNAL_ID = 'farm-1'

/**
 * Helper to copy data from the source farm to a demo farm.
 * Copies all farm data including paddocks, observations, events, settings, etc.
 */
async function copyFarmData(
  ctx: any,
  sourceFarmExternalId: string,
  demoFarmId: string,
  demoUserId: string
) {
  const now = new Date().toISOString()

  // Get the source farm
  let sourceFarm = await ctx.db
    .query('farms')
    .withIndex('by_externalId', (q: any) => q.eq('externalId', sourceFarmExternalId))
    .first()

  // Also check legacyExternalId for migration support
  if (!sourceFarm) {
    sourceFarm = await ctx.db
      .query('farms')
      .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', sourceFarmExternalId))
      .first()
  }

  if (!sourceFarm) {
    throw new Error(`Source farm not found: ${sourceFarmExternalId}`)
  }

  // Create the demo farm (copy farm data)
  const farmId = await ctx.db.insert('farms', {
    externalId: demoFarmId,
    name: `Demo - ${sourceFarm.name}`,
    location: sourceFarm.location,
    totalArea: sourceFarm.totalArea,
    paddockCount: sourceFarm.paddockCount,
    coordinates: sourceFarm.coordinates,
    geometry: sourceFarm.geometry,
    isDemoFarm: true,
    demoCreatedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  // Copy paddocks
  const sourcePaddocks = await ctx.db
    .query('paddocks')
    .withIndex('by_farm', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  const paddockIdMap = new Map<string, string>() // old _id -> new _id
  for (const paddock of sourcePaddocks) {
    const newPaddockId = await ctx.db.insert('paddocks', {
      farmId,
      externalId: paddock.externalId,
      name: paddock.name,
      status: paddock.status,
      ndvi: paddock.ndvi,
      restDays: paddock.restDays,
      area: paddock.area,
      waterAccess: paddock.waterAccess,
      lastGrazed: paddock.lastGrazed,
      geometry: paddock.geometry,
      overrideMinNDVIThreshold: paddock.overrideMinNDVIThreshold,
      overrideMinRestPeriodDays: paddock.overrideMinRestPeriodDays,
      createdAt: now,
      updatedAt: now,
    })
    paddockIdMap.set(paddock._id, newPaddockId)
  }

  // Copy observations (use demo farm external ID)
  const sourceObservations = await ctx.db
    .query('observations')
    .withIndex('by_farm', (q: any) => q.eq('farmExternalId', sourceFarmExternalId))
    .collect()

  for (const obs of sourceObservations) {
    await ctx.db.insert('observations', {
      farmExternalId: demoFarmId,
      paddockExternalId: obs.paddockExternalId,
      date: obs.date,
      ndviMean: obs.ndviMean,
      ndviMin: obs.ndviMin,
      ndviMax: obs.ndviMax,
      ndviStd: obs.ndviStd,
      eviMean: obs.eviMean,
      ndwiMean: obs.ndwiMean,
      cloudFreePct: obs.cloudFreePct,
      pixelCount: obs.pixelCount,
      isValid: obs.isValid,
      sourceProvider: obs.sourceProvider,
      resolutionMeters: obs.resolutionMeters,
      createdAt: obs.createdAt,
    })
  }

  // Copy grazing events
  const sourceEvents = await ctx.db
    .query('grazingEvents')
    .withIndex('by_farm', (q: any) => q.eq('farmExternalId', sourceFarmExternalId))
    .collect()

  for (const event of sourceEvents) {
    await ctx.db.insert('grazingEvents', {
      farmExternalId: demoFarmId,
      paddockExternalId: event.paddockExternalId,
      date: event.date,
      durationDays: event.durationDays,
      notes: event.notes,
      createdAt: event.createdAt,
    })
  }

  // Copy farm settings
  const sourceSettings = await ctx.db
    .query('farmSettings')
    .withIndex('by_farm', (q: any) => q.eq('farmExternalId', sourceFarmExternalId))
    .first()

  if (sourceSettings) {
    await ctx.db.insert('farmSettings', {
      farmExternalId: demoFarmId,
      subscriptionTier: sourceSettings.subscriptionTier,
      minNDVIThreshold: sourceSettings.minNDVIThreshold,
      minRestPeriod: sourceSettings.minRestPeriod,
      cloudCoverTolerance: sourceSettings.cloudCoverTolerance,
      dailyBriefTime: sourceSettings.dailyBriefTime,
      emailNotifications: sourceSettings.emailNotifications,
      pushNotifications: sourceSettings.pushNotifications,
      virtualFenceProvider: sourceSettings.virtualFenceProvider,
      apiKey: sourceSettings.apiKey,
      mapPreferences: sourceSettings.mapPreferences,
      livestockSettings: sourceSettings.livestockSettings,
      areaUnit: sourceSettings.areaUnit,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Copy no-graze zones
  const sourceNoGrazeZones = await ctx.db
    .query('noGrazeZones')
    .withIndex('by_farm', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  for (const zone of sourceNoGrazeZones) {
    await ctx.db.insert('noGrazeZones', {
      farmId,
      name: zone.name,
      type: zone.type,
      area: zone.area,
      description: zone.description,
      geometry: zone.geometry,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Copy water sources
  const sourceWaterSources = await ctx.db
    .query('waterSources')
    .withIndex('by_farm', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  for (const source of sourceWaterSources) {
    await ctx.db.insert('waterSources', {
      farmId,
      name: source.name,
      type: source.type,
      geometryType: source.geometryType,
      geometry: source.geometry,
      area: source.area,
      description: source.description,
      status: source.status,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Copy livestock
  const sourceLivestock = await ctx.db
    .query('livestock')
    .withIndex('by_farm', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  for (const animal of sourceLivestock) {
    await ctx.db.insert('livestock', {
      farmId,
      animalType: animal.animalType,
      adultCount: animal.adultCount,
      offspringCount: animal.offspringCount,
      notes: animal.notes,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Copy today's plan (if exists)
  const today = now.split('T')[0]
  const sourcePlan = await ctx.db
    .query('plans')
    .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', sourceFarmExternalId).eq('date', today))
    .first()

  if (sourcePlan) {
    await ctx.db.insert('plans', {
      farmExternalId: demoFarmId,
      date: sourcePlan.date,
      primaryPaddockExternalId: sourcePlan.primaryPaddockExternalId,
      alternativePaddockExternalIds: sourcePlan.alternativePaddockExternalIds,
      confidenceScore: sourcePlan.confidenceScore,
      reasoning: sourcePlan.reasoning,
      status: 'pending', // Reset to pending for demo users to interact with
      sectionGeometry: sourcePlan.sectionGeometry,
      sectionAreaHectares: sourcePlan.sectionAreaHectares,
      sectionCentroid: sourcePlan.sectionCentroid,
      sectionAvgNdvi: sourcePlan.sectionAvgNdvi,
      sectionJustification: sourcePlan.sectionJustification,
      paddockGrazedPercentage: sourcePlan.paddockGrazedPercentage,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Copy satellite image tiles (reference same R2 URLs - they're read-only)
  const sourceTiles = await ctx.db
    .query('satelliteImageTiles')
    .withIndex('by_farm_date', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  for (const tile of sourceTiles) {
    await ctx.db.insert('satelliteImageTiles', {
      farmId,
      captureDate: tile.captureDate,
      provider: tile.provider,
      tileType: tile.tileType,
      r2Key: tile.r2Key,
      r2Url: tile.r2Url,
      bounds: tile.bounds,
      cloudCoverPct: tile.cloudCoverPct,
      resolutionMeters: tile.resolutionMeters,
      fileSizeBytes: tile.fileSizeBytes,
      createdAt: tile.createdAt,
      expiresAt: tile.expiresAt,
    })
  }

  // Create demo user
  await ctx.db.insert('users', {
    externalId: demoUserId,
    farmExternalId: demoFarmId,
    name: 'Demo User',
    createdAt: now,
    updatedAt: now,
  })

  return {
    farmId,
    paddockCount: sourcePaddocks.length,
    observationCount: sourceObservations.length,
    eventCount: sourceEvents.length,
    tileCount: sourceTiles.length,
  }
}

/**
 * Seed a demo farm by copying data from the dev user's farm.
 * Creates isolated farm data that's tied to the demo session.
 */
export const seedDemoFarm = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const demoFarmId = `demo-farm-${args.sessionId}`
    const demoUserId = `demo-user-${args.sessionId}`

    // Check if demo farm already exists
    const existingFarm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', demoFarmId))
      .first()

    if (existingFarm) {
      return {
        farmId: existingFarm._id,
        farmExternalId: demoFarmId,
        alreadySeeded: true,
      }
    }

    // Copy data from the source farm
    const result = await copyFarmData(ctx, SOURCE_FARM_EXTERNAL_ID, demoFarmId, demoUserId)

    return {
      farmId: result.farmId,
      farmExternalId: demoFarmId,
      paddockCount: result.paddockCount,
      alreadySeeded: false,
    }
  },
})

/**
 * Helper to delete all demo farm data.
 */
async function deleteDemoFarmData(ctx: any, demoFarmId: string, demoUserId: string) {
  // Find the farm
  const farm = await ctx.db
    .query('farms')
    .withIndex('by_externalId', (q: any) => q.eq('externalId', demoFarmId))
    .first()

  if (farm) {
    // Delete paddocks
    const paddocks = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const p of paddocks) {
      await ctx.db.delete(p._id)
    }

    // Delete grazing events
    const events = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', demoFarmId))
      .collect()
    for (const e of events) {
      await ctx.db.delete(e._id)
    }

    // Delete observations
    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', demoFarmId))
      .collect()
    for (const o of observations) {
      await ctx.db.delete(o._id)
    }

    // Delete plans
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', demoFarmId))
      .collect()
    for (const p of plans) {
      await ctx.db.delete(p._id)
    }

    // Delete farm settings
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', demoFarmId))
      .first()
    if (settings) {
      await ctx.db.delete(settings._id)
    }

    // Delete no-graze zones
    const noGrazeZones = await ctx.db
      .query('noGrazeZones')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const z of noGrazeZones) {
      await ctx.db.delete(z._id)
    }

    // Delete water sources
    const waterSources = await ctx.db
      .query('waterSources')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const w of waterSources) {
      await ctx.db.delete(w._id)
    }

    // Delete livestock
    const livestock = await ctx.db
      .query('livestock')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const l of livestock) {
      await ctx.db.delete(l._id)
    }

    // Delete satellite tiles
    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const t of tiles) {
      await ctx.db.delete(t._id)
    }

    // Delete the farm
    await ctx.db.delete(farm._id)
  }

  // Delete user
  const user = await ctx.db
    .query('users')
    .withIndex('by_externalId', (q: any) => q.eq('externalId', demoUserId))
    .first()
  if (user) {
    await ctx.db.delete(user._id)
  }
}

/**
 * Reset a demo farm by deleting all data and re-copying from source.
 */
export const resetDemoFarm = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const demoFarmId = `demo-farm-${args.sessionId}`
    const demoUserId = `demo-user-${args.sessionId}`

    // Delete existing demo data
    await deleteDemoFarmData(ctx, demoFarmId, demoUserId)

    // Re-copy from source farm
    const result = await copyFarmData(ctx, SOURCE_FARM_EXTERNAL_ID, demoFarmId, demoUserId)

    return {
      farmId: result.farmId,
      farmExternalId: demoFarmId,
      paddockCount: result.paddockCount,
      reset: true,
    }
  },
})

/**
 * Clean up demo farms older than 24 hours.
 * Called by a scheduled cron job.
 */
export const cleanupOldDemoFarms = mutation({
  handler: async (ctx) => {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Find all demo farms older than 24 hours
    const demoFarms = await ctx.db
      .query('farms')
      .withIndex('by_isDemoFarm', (q: any) => q.eq('isDemoFarm', true))
      .collect()

    let deletedCount = 0
    for (const farm of demoFarms) {
      if (farm.demoCreatedAt && farm.demoCreatedAt < cutoffTime) {
        const demoUserId = farm.externalId.replace('demo-farm-', 'demo-user-')
        await deleteDemoFarmData(ctx, farm.externalId, demoUserId)
        deletedCount++
      }
    }

    return { deletedCount }
  },
})

/**
 * Check if a demo farm exists for a given session ID.
 */
export const getDemoFarm = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const demoFarmId = `demo-farm-${args.sessionId}`
    return await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', demoFarmId))
      .first()
  },
})
