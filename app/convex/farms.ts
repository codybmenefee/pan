import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'
import area from '@turf/area'
import { api } from './_generated/api'
import {
  DEFAULT_FARM_EXTERNAL_ID,
  DEFAULT_USER_EXTERNAL_ID,
  defaultFarmSettings,
  sampleFarm,
  samplePastures,
  sampleGrazingEvents,
  sampleObservations,
  sampleWaterSources,
  sampleNoGrazeZones,
  sampleLivestock,
  generateSamplePlans,
  tutorialDemoPastures,
  generateTutorialDemoGrazingEvents,
  generateTutorialDemoObservations,
} from './seedData'
import { HECTARES_PER_SQUARE_METER } from './lib/areaConstants'

const polygonFeature = v.object({
  type: v.literal('Feature'),
  properties: v.optional(v.any()),
  geometry: v.object({
    type: v.literal('Polygon'),
    coordinates: v.array(v.array(v.array(v.number()))),
  }),
})

export const getFarm = query({
  args: { farmId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const externalId = args.farmId ?? DEFAULT_FARM_EXTERNAL_ID
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .first()

    if (farm) {
      return farm
    }

    return ctx.db.query('farms').first()
  },
})

/**
 * Get farm by external ID (for pipeline use).
 * Returns null if not found (doesn't fall back to first farm).
 */
export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    // Try by externalId first
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.externalId))
      .first()

    // Also check legacyExternalId for migration support
    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', args.externalId))
        .first()
    }

    return farm
  },
})

export const seedSampleFarm = mutation({
  args: {
    farmId: v.optional(v.string()),
    seedUser: v.optional(v.boolean()),
    userExternalId: v.optional(v.string()),
    seedSettings: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const externalId = args.farmId ?? DEFAULT_FARM_EXTERNAL_ID
    const now = new Date().toISOString()

    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .first()

    // Also check legacyExternalId for migration support
    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', externalId))
        .first()
    }

    let farmSeeded = false
    if (!farm) {
      const farmId = await ctx.db.insert('farms', {
        ...sampleFarm,
        externalId,
        legacyExternalId: externalId, // Store as legacy ID for migration support
        createdAt: now,
        updatedAt: now,
      })
      farm = await ctx.db.get(farmId)
      farmSeeded = true
    }

    if (!farm) {
      return { seeded: false, reason: 'Farm insert failed.' }
    }

    const existingPastures = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    let pasturesSeeded = false
    if (existingPastures.length === 0) {
      for (const pasture of samplePastures) {
        await ctx.db.insert('paddocks', {
          farmId: farm._id,
          externalId: pasture.externalId,
          name: pasture.name,
          status: pasture.status,
          ndvi: pasture.ndvi,
          restDays: pasture.restDays,
          area: pasture.area,
          waterAccess: pasture.waterAccess,
          lastGrazed: pasture.lastGrazed,
          geometry: pasture.geometry,
          createdAt: now,
          updatedAt: now,
        })
      }

      await ctx.db.patch(farm._id, {
        paddockCount: samplePastures.length,
        updatedAt: now,
      })

      pasturesSeeded = true

    }

    if (!pasturesSeeded && farm.paddockCount !== existingPastures.length) {
      await ctx.db.patch(farm._id, {
        paddockCount: existingPastures.length,
        updatedAt: now,
      })
    }

    const pastureCount = pasturesSeeded ? samplePastures.length : existingPastures.length

    let userSeeded = false
    if (args.seedUser) {
      const userExternalId = args.userExternalId ?? DEFAULT_USER_EXTERNAL_ID
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_externalId', (q) => q.eq('externalId', userExternalId))
        .first()

      if (!existingUser) {
        await ctx.db.insert('users', {
          externalId: userExternalId,
          farmExternalId: externalId,
          createdAt: now,
          updatedAt: now,
        })
        userSeeded = true
      }
    }

    let settingsSeeded = false
    if (args.seedSettings) {
      const existingSettings = await ctx.db
        .query('farmSettings')
        .withIndex('by_farm', (q: any) => q.eq('farmExternalId', externalId))
        .first()

      if (!existingSettings) {
        await ctx.db.insert('farmSettings', {
          farmExternalId: externalId,
          ...defaultFarmSettings,
          createdAt: now,
          updatedAt: now,
        })
        settingsSeeded = true
      }
    }

    let grazingEventsSeeded = false
    const existingGrazingEvents = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', externalId))
      .collect()

    if (existingGrazingEvents.length === 0) {
      for (const event of sampleGrazingEvents) {
        await ctx.db.insert('grazingEvents', {
          farmExternalId: externalId,
          paddockExternalId: event.paddockExternalId,
          date: event.date,
          durationDays: event.durationDays,
          notes: event.notes,
          createdAt: now,
        })
      }
      grazingEventsSeeded = true
    }

    let observationsSeeded = false
    const existingObservations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', externalId))
      .collect()

    if (existingObservations.length === 0) {
      for (const obs of sampleObservations) {
        await ctx.db.insert('observations', {
          farmExternalId: externalId,
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
          createdAt: now,
        })
      }
      observationsSeeded = true
    }

    // Seed water sources
    let waterSourcesSeeded = false
    const existingWaterSources = await ctx.db
      .query('waterSources')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    if (existingWaterSources.length === 0 && sampleWaterSources.length > 0) {
      for (const source of sampleWaterSources) {
        await ctx.db.insert('waterSources', {
          farmId: farm._id,
          name: source.name,
          type: source.type,
          geometryType: source.geometryType,
          geometry: source.geometry,
          status: source.status,
          description: source.description,
          createdAt: now,
          updatedAt: now,
        })
      }
      waterSourcesSeeded = true
    }

    // Seed no-graze zones
    let noGrazeZonesSeeded = false
    const existingNoGrazeZones = await ctx.db
      .query('noGrazeZones')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    if (existingNoGrazeZones.length === 0 && sampleNoGrazeZones.length > 0) {
      for (const zone of sampleNoGrazeZones) {
        await ctx.db.insert('noGrazeZones', {
          farmId: farm._id,
          name: zone.name,
          type: zone.type,
          description: zone.description,
          geometry: zone.geometry,
          createdAt: now,
          updatedAt: now,
        })
      }
      noGrazeZonesSeeded = true
    }

    // Seed livestock
    let livestockSeeded = false
    const existingLivestock = await ctx.db
      .query('livestock')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    if (existingLivestock.length === 0 && sampleLivestock.length > 0) {
      for (const animal of sampleLivestock) {
        await ctx.db.insert('livestock', {
          farmId: farm._id,
          animalType: animal.animalType,
          adultCount: animal.adultCount,
          offspringCount: animal.offspringCount,
          notes: animal.notes,
          createdAt: now,
          updatedAt: now,
        })
      }
      livestockSeeded = true
    }

    // Seed plans with paddocks (for strip grazing demo)
    let plansSeeded = false
    const existingPlans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', externalId))
      .collect()

    if (existingPlans.length === 0) {
      const samplePlans = generateSamplePlans(externalId)
      for (const plan of samplePlans) {
        await ctx.db.insert('plans', {
          farmExternalId: plan.farmExternalId,
          date: plan.date,
          primaryPaddockExternalId: plan.primaryPaddockExternalId,
          alternativePaddockExternalIds: plan.alternativePaddockExternalIds,
          confidenceScore: plan.confidenceScore,
          reasoning: plan.reasoning,
          status: plan.status,
          sectionGeometry: plan.sectionGeometry,
          sectionAreaHectares: plan.sectionAreaHectares,
          sectionJustification: plan.sectionJustification,
          paddockGrazedPercentage: plan.paddockGrazedPercentage,
          createdAt: now,
          updatedAt: now,
        })
      }
      plansSeeded = true
    }

    return {
      farmId: farm._id,
      farmExternalId: externalId,
      pastureCount,
      seededFarm: farmSeeded,
      seededPastures: pasturesSeeded,
      seededUser: userSeeded,
      seededSettings: settingsSeeded,
      seededGrazingEvents: grazingEventsSeeded,
      seededObservations: observationsSeeded,
      seededWaterSources: waterSourcesSeeded,
      seededNoGrazeZones: noGrazeZonesSeeded,
      seededLivestock: livestockSeeded,
      seededPlans: plansSeeded,
    }
  },
})

/**
 * Update the farm boundary geometry.
 * Recalculates the center coordinates and total area based on the new boundary.
 */
export const updateFarmBoundary = mutation({
  args: {
    farmExternalId: v.string(),
    geometry: polygonFeature,
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Find farm by externalId
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmExternalId))
      .first()

    // Also check legacyExternalId for migration support
    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', args.farmExternalId))
        .first()
    }

    if (!farm) {
      throw new Error(`Farm not found: ${args.farmExternalId}`)
    }

    // Calculate center from polygon bounds
    const coords = args.geometry.geometry.coordinates[0]
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity

    coords.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })

    const centerLng = (minLng + maxLng) / 2
    const centerLat = (minLat + maxLat) / 2

    // Calculate area in hectares
    // Cast to Feature type for turf compatibility
    const geometryFeature = {
      ...args.geometry,
      properties: args.geometry.properties ?? {},
    } as GeoJSON.Feature<GeoJSON.Polygon>
    const squareMeters = area(geometryFeature)
    const hectares = Math.round(squareMeters * HECTARES_PER_SQUARE_METER * 10) / 10

    // Update farm with new geometry, coordinates, and area
    await ctx.db.patch(farm._id, {
      geometry: args.geometry,
      coordinates: [centerLng, centerLat],
      totalArea: hectares,
      updatedAt: now,
    })

    // Trigger satellite fetch job immediately so imagery processing starts early
    // Duplicate prevention is built into createForOnboardingComplete
    await ctx.runMutation(api.satelliteFetchJobs.createForOnboardingComplete, {
      farmExternalId: args.farmExternalId,
      provider: 'sentinel2',
    })

    return {
      success: true,
      coordinates: [centerLng, centerLat],
      totalArea: hectares,
    }
  },
})

/**
 * List all farms with their settings and subscriptions.
 * Used by the satellite pipeline scheduler to determine which farms need updates.
 */
export const listAllWithSettings = query({
  handler: async (ctx) => {
    const farms = await ctx.db.query('farms').collect()

    const farmsWithData = await Promise.all(
      farms.map(async (farm) => {
        // Get settings
        const settings = await ctx.db
          .query('farmSettings')
          .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farm.externalId))
          .first()

        // Get subscription
        const subscription = await ctx.db
          .query('subscriptions')
          .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
          .first()

        // Get pastures
        const pastures = await ctx.db
          .query('paddocks')
          .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
          .collect()

        return {
          ...farm,
          settings: settings ?? null,
          subscription: subscription ?? null,
          pastures,
        }
      })
    )

    return farmsWithData
  },
})

/**
 * Export all farm data for seeding production.
 * Fetches farm-1 and all related data, returns in seedData.ts format.
 * Run with: npx convex run farms:exportFarmData
 */
export const exportFarmData = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const externalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    // Get the farm
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .first()

    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', externalId))
        .first()
    }

    if (!farm) {
      return { error: `Farm not found: ${externalId}` }
    }

    // Get pastures (filter out "New Pasture" - only p1-p8)
    const allPastures = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    const pastures = allPastures
      .filter((p) => p.externalId.startsWith('p') && !p.name.includes('New Pasture'))
      .map((p) => ({
        externalId: p.externalId,
        name: p.name,
        status: p.status,
        ndvi: p.ndvi,
        restDays: p.restDays,
        area: p.area,
        waterAccess: p.waterAccess,
        lastGrazed: p.lastGrazed,
        geometry: p.geometry,
      }))

    // Get water sources
    const waterSources = await ctx.db
      .query('waterSources')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    const waterSourceData = waterSources.map((w) => ({
      name: w.name,
      type: w.type,
      geometryType: w.geometryType,
      geometry: w.geometry,
      area: w.area,
      description: w.description,
      status: w.status,
    }))

    // Get no-graze zones
    const noGrazeZones = await ctx.db
      .query('noGrazeZones')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    const noGrazeZoneData = noGrazeZones.map((z) => ({
      name: z.name,
      type: z.type,
      area: z.area,
      description: z.description,
      geometry: z.geometry,
    }))

    // Get livestock
    const livestock = await ctx.db
      .query('livestock')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    const livestockData = livestock.map((l) => ({
      animalType: l.animalType,
      adultCount: l.adultCount,
      offspringCount: l.offspringCount,
      notes: l.notes,
    }))

    // Get farm settings
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', externalId))
      .first()

    // Get plans
    const plansData = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', externalId))
      .collect()

    const plans = plansData.map((p) => ({
      date: p.date,
      primaryPaddockExternalId: p.primaryPaddockExternalId,
      alternativePaddockExternalIds: p.alternativePaddockExternalIds,
      confidenceScore: p.confidenceScore,
      reasoning: p.reasoning,
      status: p.status,
      approvedAt: p.approvedAt,
      approvedBy: p.approvedBy,
      feedback: p.feedback,
      sectionGeometry: p.sectionGeometry,
      sectionAreaHectares: p.sectionAreaHectares,
      sectionCentroid: p.sectionCentroid,
      sectionAvgNdvi: p.sectionAvgNdvi,
      sectionJustification: p.sectionJustification,
      paddockGrazedPercentage: p.paddockGrazedPercentage,
    }))

    return {
      farm: {
        name: farm.name,
        location: farm.location,
        totalArea: farm.totalArea,
        coordinates: farm.coordinates,
        geometry: farm.geometry,
      },
      pastures,
      waterSources: waterSourceData,
      noGrazeZones: noGrazeZoneData,
      livestock: livestockData,
      plans,
      settings: settings ? {
        minNDVIThreshold: settings.minNDVIThreshold,
        minRestPeriod: settings.minRestPeriod,
        cloudCoverTolerance: settings.cloudCoverTolerance,
        rotationFrequency: settings.rotationFrequency,
        dailyBriefTime: settings.dailyBriefTime,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        areaUnit: settings.areaUnit,
        livestockSettings: settings.livestockSettings,
      } : null,
    }
  },
})

/**
 * Setup tutorial demo data for compelling screenshots.
 * Updates farm name, pasture NDVI/restDays, grazing events, and observations.
 */
/**
 * Import farm data from an export (for syncing dev to prod).
 * Upserts pastures by externalId, replaces water sources/zones/livestock/plans.
 * Run with: npx convex run farms:importFarmData '{"targetFarmExternalId": "farm-1", "data": {...}}'
 */
export const importFarmData = mutation({
  args: {
    targetFarmExternalId: v.string(),
    data: v.any(), // Output from exportFarmData query
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const { farm, pastures, waterSources, noGrazeZones, livestock, plans, settings } = args.data

    // 1. Find target farm
    let targetFarm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.targetFarmExternalId))
      .first()

    if (!targetFarm) {
      targetFarm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', args.targetFarmExternalId))
        .first()
    }

    if (!targetFarm) {
      throw new Error(`Target farm not found: ${args.targetFarmExternalId}`)
    }

    // 2. Update farm metadata (name, location, geometry)
    await ctx.db.patch(targetFarm._id, {
      name: farm.name,
      location: farm.location,
      totalArea: farm.totalArea,
      coordinates: farm.coordinates,
      geometry: farm.geometry,
      updatedAt: now,
    })

    // 3. Upsert pastures by externalId
    let pasturesUpdated = 0
    let pasturesCreated = 0
    for (const pasture of pastures) {
      const existing = await ctx.db
        .query('paddocks')
        .withIndex('by_farm_externalId', (q: any) =>
          q.eq('farmId', targetFarm._id).eq('externalId', pasture.externalId)
        )
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: pasture.name,
          status: pasture.status,
          ndvi: pasture.ndvi,
          restDays: pasture.restDays,
          area: pasture.area,
          waterAccess: pasture.waterAccess,
          lastGrazed: pasture.lastGrazed,
          geometry: pasture.geometry,
          updatedAt: now,
        })
        pasturesUpdated++
      } else {
        await ctx.db.insert('paddocks', {
          farmId: targetFarm._id,
          externalId: pasture.externalId,
          name: pasture.name,
          status: pasture.status,
          ndvi: pasture.ndvi,
          restDays: pasture.restDays,
          area: pasture.area,
          waterAccess: pasture.waterAccess,
          lastGrazed: pasture.lastGrazed,
          geometry: pasture.geometry,
          createdAt: now,
          updatedAt: now,
        })
        pasturesCreated++
      }
    }

    // Update pasture count on farm
    await ctx.db.patch(targetFarm._id, {
      paddockCount: pastures.length,
      updatedAt: now,
    })

    // 4. Replace water sources (delete all existing, insert new)
    const existingWaterSources = await ctx.db
      .query('waterSources')
      .withIndex('by_farm', (q) => q.eq('farmId', targetFarm._id))
      .collect()
    for (const source of existingWaterSources) {
      await ctx.db.delete(source._id)
    }
    for (const source of waterSources) {
      await ctx.db.insert('waterSources', {
        farmId: targetFarm._id,
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

    // 5. Replace no-graze zones
    const existingNoGrazeZones = await ctx.db
      .query('noGrazeZones')
      .withIndex('by_farm', (q) => q.eq('farmId', targetFarm._id))
      .collect()
    for (const zone of existingNoGrazeZones) {
      await ctx.db.delete(zone._id)
    }
    for (const zone of noGrazeZones) {
      await ctx.db.insert('noGrazeZones', {
        farmId: targetFarm._id,
        name: zone.name,
        type: zone.type,
        area: zone.area,
        description: zone.description,
        geometry: zone.geometry,
        createdAt: now,
        updatedAt: now,
      })
    }

    // 6. Replace livestock
    const existingLivestock = await ctx.db
      .query('livestock')
      .withIndex('by_farm', (q) => q.eq('farmId', targetFarm._id))
      .collect()
    for (const animal of existingLivestock) {
      await ctx.db.delete(animal._id)
    }
    for (const animal of livestock) {
      await ctx.db.insert('livestock', {
        farmId: targetFarm._id,
        animalType: animal.animalType,
        adultCount: animal.adultCount,
        offspringCount: animal.offspringCount,
        notes: animal.notes,
        createdAt: now,
        updatedAt: now,
      })
    }

    // 7. Replace plans (if provided)
    let plansReplaced = 0
    if (plans && Array.isArray(plans)) {
      // Delete existing plans for this farm
      const existingPlans = await ctx.db
        .query('plans')
        .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.targetFarmExternalId))
        .collect()
      for (const plan of existingPlans) {
        await ctx.db.delete(plan._id)
      }

      // Insert new plans
      for (const plan of plans) {
        await ctx.db.insert('plans', {
          farmExternalId: args.targetFarmExternalId,
          date: plan.date,
          primaryPaddockExternalId: plan.primaryPaddockExternalId,
          alternativePaddockExternalIds: plan.alternativePaddockExternalIds,
          confidenceScore: plan.confidenceScore,
          reasoning: plan.reasoning,
          status: plan.status,
          approvedAt: plan.approvedAt,
          approvedBy: plan.approvedBy,
          feedback: plan.feedback,
          sectionGeometry: plan.sectionGeometry,
          sectionAreaHectares: plan.sectionAreaHectares,
          sectionCentroid: plan.sectionCentroid,
          sectionAvgNdvi: plan.sectionAvgNdvi,
          sectionJustification: plan.sectionJustification,
          paddockGrazedPercentage: plan.paddockGrazedPercentage,
          createdAt: now,
          updatedAt: now,
        })
        plansReplaced++
      }
    }

    // 8. Update farm settings (if provided)
    if (settings) {
      const existingSettings = await ctx.db
        .query('farmSettings')
        .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.targetFarmExternalId))
        .first()

      if (existingSettings) {
        await ctx.db.patch(existingSettings._id, {
          minNDVIThreshold: settings.minNDVIThreshold,
          minRestPeriod: settings.minRestPeriod,
          cloudCoverTolerance: settings.cloudCoverTolerance,
          rotationFrequency: settings.rotationFrequency,
          dailyBriefTime: settings.dailyBriefTime,
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          areaUnit: settings.areaUnit,
          livestockSettings: settings.livestockSettings,
          updatedAt: now,
        })
      }
    }

    return {
      success: true,
      farmId: targetFarm._id,
      pasturesUpdated,
      pasturesCreated,
      waterSourcesReplaced: waterSources.length,
      noGrazeZonesReplaced: noGrazeZones.length,
      livestockReplaced: livestock.length,
      plansReplaced,
      settingsUpdated: !!settings,
    }
  },
})

/**
 * Setup tutorial demo data for compelling screenshots.
 * Updates farm name, pasture NDVI/restDays, grazing events, and observations.
 */
export const setupTutorialDemo = mutation({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const externalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    // 1. Get or create the farm
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .first()

    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', externalId))
        .first()
    }

    if (!farm) {
      throw new Error(`Farm not found: ${externalId}`)
    }

    // 2. Update farm name to "Hillcrest Station"
    await ctx.db.patch(farm._id, {
      name: 'Hillcrest Station',
      updatedAt: now,
    })

    // 3. Update each pasture with tutorial demo data
    const allPastures = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    for (const demoData of tutorialDemoPastures) {
      const pasture = allPastures.find(p => p.externalId === demoData.externalId)

      if (pasture) {
        // Calculate lastGrazed based on restDays
        const lastGrazedDate = new Date()
        lastGrazedDate.setDate(lastGrazedDate.getDate() - demoData.restDays)
        const lastGrazed = lastGrazedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })

        await ctx.db.patch(pasture._id, {
          name: demoData.name,
          ndvi: demoData.ndvi,
          restDays: demoData.restDays,
          status: demoData.status,
          lastGrazed,
          updatedAt: now,
        })
      }
    }

    // 4. Clear old grazing events
    const existingEvents = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', externalId))
      .collect()

    for (const event of existingEvents) {
      await ctx.db.delete(event._id)
    }

    // 5. Insert tutorial demo grazing events
    const demoEvents = generateTutorialDemoGrazingEvents(externalId)
    for (const event of demoEvents) {
      await ctx.db.insert('grazingEvents', {
        ...event,
        createdAt: now,
      })
    }

    // 6. Clear old observations for today and insert new ones
    const existingObservations = await ctx.db
      .query('observations')
      .withIndex('by_farm_date', (q: any) =>
        q.eq('farmExternalId', externalId).eq('date', today)
      )
      .collect()

    for (const obs of existingObservations) {
      await ctx.db.delete(obs._id)
    }

    // Insert tutorial demo observations
    const demoObservations = generateTutorialDemoObservations(externalId)
    for (const obs of demoObservations) {
      await ctx.db.insert('observations', {
        ...obs,
        createdAt: now,
      })
    }

    // 7. Delete today's plan so agent generates fresh one
    const existingPlans = await ctx.db
      .query('plans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', externalId))
      .collect()

    const todayPlan = existingPlans.find((p: any) => p.date === today)
    if (todayPlan) {
      await ctx.db.delete(todayPlan._id)
    }

    return {
      success: true,
      farmName: 'Hillcrest Station',
      pasturesUpdated: tutorialDemoPastures.length,
      grazingEventsInserted: demoEvents.length,
      observationsInserted: demoObservations.length,
      planDeleted: !!todayPlan,
    }
  },
})
