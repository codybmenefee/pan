import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'
import area from '@turf/area'
import { api } from './_generated/api'
import {
  DEFAULT_FARM_EXTERNAL_ID,
  DEFAULT_USER_EXTERNAL_ID,
  defaultFarmSettings,
  sampleFarm,
  samplePaddocks,
  sampleGrazingEvents,
  sampleObservations,
  tutorialDemoPaddocks,
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

    const existingPaddocks = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    let paddocksSeeded = false
    if (existingPaddocks.length === 0) {
      for (const paddock of samplePaddocks) {
        await ctx.db.insert('paddocks', {
          farmId: farm._id,
          externalId: paddock.externalId,
          name: paddock.name,
          status: paddock.status,
          ndvi: paddock.ndvi,
          restDays: paddock.restDays,
          area: paddock.area,
          waterAccess: paddock.waterAccess,
          lastGrazed: paddock.lastGrazed,
          geometry: paddock.geometry,
          createdAt: now,
          updatedAt: now,
        })
      }

      await ctx.db.patch(farm._id, {
        paddockCount: samplePaddocks.length,
        updatedAt: now,
      })

      paddocksSeeded = true

    }

    if (!paddocksSeeded && farm.paddockCount !== existingPaddocks.length) {
      await ctx.db.patch(farm._id, {
        paddockCount: existingPaddocks.length,
        updatedAt: now,
      })
    }

    const paddockCount = paddocksSeeded ? samplePaddocks.length : existingPaddocks.length

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

    return {
      farmId: farm._id,
      farmExternalId: externalId,
      paddockCount,
      seededFarm: farmSeeded,
      seededPaddocks: paddocksSeeded,
      seededUser: userSeeded,
      seededSettings: settingsSeeded,
      seededGrazingEvents: grazingEventsSeeded,
      seededObservations: observationsSeeded,
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

        // Get paddocks
        const paddocks = await ctx.db
          .query('paddocks')
          .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
          .collect()

        return {
          ...farm,
          settings: settings ?? null,
          subscription: subscription ?? null,
          paddocks,
        }
      })
    )

    return farmsWithData
  },
})

/**
 * Setup tutorial demo data for compelling screenshots.
 * Updates farm name, paddock NDVI/restDays, grazing events, and observations.
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

    // 3. Update each paddock with tutorial demo data
    const allPaddocks = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    for (const demoData of tutorialDemoPaddocks) {
      const paddock = allPaddocks.find(p => p.externalId === demoData.externalId)

      if (paddock) {
        // Calculate lastGrazed based on restDays
        const lastGrazedDate = new Date()
        lastGrazedDate.setDate(lastGrazedDate.getDate() - demoData.restDays)
        const lastGrazed = lastGrazedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })

        await ctx.db.patch(paddock._id, {
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
      paddocksUpdated: tutorialDemoPaddocks.length,
      grazingEventsInserted: demoEvents.length,
      observationsInserted: demoObservations.length,
      planDeleted: !!todayPlan,
    }
  },
})
