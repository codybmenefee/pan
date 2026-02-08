import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'
import { defaultFarmSettings } from './seedData'

const mapPreferencesShape = v.object({
  showRGBSatellite: v.boolean(),
  showNDVIHeatmap: v.optional(v.boolean()),
})

const livestockSettingsShape = v.object({
  cowAU: v.number(),
  calfAU: v.number(),
  sheepAU: v.number(),
  lambAU: v.number(),
  dailyDMPerAU: v.number(),
})

const areaUnitShape = v.optional(v.union(v.literal('hectares'), v.literal('acres')))

const settingsShape = {
  minNDVIThreshold: v.number(),
  minRestPeriod: v.number(),
  cloudCoverTolerance: v.number(),
  rotationFrequency: v.number(),
  dailyBriefTime: v.string(),
  emailNotifications: v.boolean(),
  pushNotifications: v.boolean(),
  virtualFenceProvider: v.optional(v.string()),
  apiKey: v.optional(v.string()),
  mapPreferences: v.optional(mapPreferencesShape),
  areaUnit: areaUnitShape,
}

export const getSettings = query({
  args: { farmId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .first()
  },
})

export const updateSettings = mutation({
  args: {
    farmId: v.string(),
    settings: v.object(settingsShape),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .first()

    if (!existing) {
      const id = await ctx.db.insert('farmSettings', {
        farmExternalId: args.farmId,
        ...args.settings,
        createdAt: now,
        updatedAt: now,
      })
      return { id }
    }

    await ctx.db.patch(existing._id, {
      ...args.settings,
      updatedAt: now,
    })

    return { id: existing._id }
  },
})

export const resetSettings = mutation({
  args: { farmId: v.string() },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .first()

    if (!existing) {
      const id = await ctx.db.insert('farmSettings', {
        farmExternalId: args.farmId,
        ...defaultFarmSettings,
        createdAt: now,
        updatedAt: now,
      })
      return { id }
    }

    await ctx.db.patch(existing._id, {
      ...defaultFarmSettings,
      updatedAt: now,
    })

    return { id: existing._id }
  },
})

export const updateMapPreference = mutation({
  args: {
    farmId: v.string(),
    key: v.string(),
    value: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .first()

    const currentPrefs = existing?.mapPreferences ?? { showRGBSatellite: false, showNDVIHeatmap: false }
    const updatedPrefs = { ...currentPrefs, [args.key]: args.value }

    if (!existing) {
      const id = await ctx.db.insert('farmSettings', {
        farmExternalId: args.farmId,
        ...defaultFarmSettings,
        mapPreferences: updatedPrefs,
        createdAt: now,
        updatedAt: now,
      })
      return { id }
    }

    await ctx.db.patch(existing._id, {
      mapPreferences: updatedPrefs,
      updatedAt: now,
    })

    return { id: existing._id }
  },
})

/**
 * Update imagery check tracking for a farm.
 * Called by the scheduler after checking Copernicus catalog.
 */
export const updateImageryCheckTime = mutation({
  args: {
    farmExternalId: v.string(),
    checkTimestamp: v.string(),  // ISO timestamp of when we checked
    latestImageryDate: v.optional(v.string()),  // YYYY-MM-DD of newest imagery found
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .first()

    if (!existing) {
      // Create settings with imagery check info
      const id = await ctx.db.insert('farmSettings', {
        farmExternalId: args.farmExternalId,
        ...defaultFarmSettings,
        lastImageryCheckAt: args.checkTimestamp,
        lastNewImageryDate: args.latestImageryDate,
        createdAt: now,
        updatedAt: now,
      })
      return { id }
    }

    // Update existing settings
    const updates: Record<string, string | undefined> = {
      lastImageryCheckAt: args.checkTimestamp,
      updatedAt: now,
    }

    // Only update lastNewImageryDate if we found new imagery
    if (args.latestImageryDate) {
      updates.lastNewImageryDate = args.latestImageryDate
    }

    await ctx.db.patch(existing._id, updates)
    return { id: existing._id }
  },
})

/**
 * Get farms that need their imagery checked (not checked in 24h).
 * Used by daily scheduler to determine which farms to check.
 */
export const getFarmsNeedingImageryCheck = query({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Get all farm settings
    const allSettings = await ctx.db.query('farmSettings').collect()

    // Filter to farms not checked in 24 hours
    const needsCheck = allSettings.filter((settings) => {
      // If never checked, needs check
      if (!settings.lastImageryCheckAt) {
        return true
      }
      // If last check was more than 24 hours ago, needs check
      return settings.lastImageryCheckAt < twentyFourHoursAgo
    })

    // Return farm external IDs with their last imagery dates
    return needsCheck.map((s) => ({
      farmExternalId: s.farmExternalId,
      lastNewImageryDate: s.lastNewImageryDate ?? null,
      lastImageryCheckAt: s.lastImageryCheckAt ?? null,
    }))
  },
})

/**
 * Get imagery check status for a farm.
 */
export const getImageryCheckStatus = query({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .first()

    if (!settings) {
      return {
        lastImageryCheckAt: null,
        lastNewImageryDate: null,
      }
    }

    return {
      lastImageryCheckAt: settings.lastImageryCheckAt ?? null,
      lastNewImageryDate: settings.lastNewImageryDate ?? null,
    }
  },
})

/**
 * Update specific farm settings.
 * Used during onboarding where we don't want to overwrite other settings.
 */
export const updateFarmSettings = mutation({
  args: {
    farmId: v.string(),
    settings: v.object({
      virtualFenceProvider: v.optional(v.string()),
      apiKey: v.optional(v.string()),
      areaUnit: v.optional(v.union(v.literal('hectares'), v.literal('acres'))),
    }),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .first()

    if (!existing) {
      const id = await ctx.db.insert('farmSettings', {
        farmExternalId: args.farmId,
        ...defaultFarmSettings,
        ...args.settings,
        createdAt: now,
        updatedAt: now,
      })
      return { id }
    }

    await ctx.db.patch(existing._id, {
      ...args.settings,
      updatedAt: now,
    })

    return { id: existing._id }
  },
})

/**
 * Update livestock settings (AU factors and consumption rate)
 */
export const updateLivestockSettings = mutation({
  args: {
    farmId: v.string(),
    livestockSettings: livestockSettingsShape,
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .first()

    if (!existing) {
      const id = await ctx.db.insert('farmSettings', {
        farmExternalId: args.farmId,
        ...defaultFarmSettings,
        livestockSettings: args.livestockSettings,
        createdAt: now,
        updatedAt: now,
      })
      return { id }
    }

    await ctx.db.patch(existing._id, {
      livestockSettings: args.livestockSettings,
      updatedAt: now,
    })

    return { id: existing._id }
  },
})

/**
 * Pipeline health monitoring.
 * Returns staleness info for all farms with settings.
 * Useful for manual checks: npx convex run settings:getPipelineHealth
 */
export const getPipelineHealth = query({
  args: {},
  handler: async (ctx) => {
    const allSettings = await ctx.db.query('farmSettings').collect()
    const now = Date.now()

    return allSettings.map((s) => {
      const lastCheckMs = s.lastImageryCheckAt
        ? new Date(s.lastImageryCheckAt).getTime()
        : null
      const lastImageryMs = s.lastNewImageryDate
        ? new Date(s.lastNewImageryDate).getTime()
        : null

      const hoursSinceCheck = lastCheckMs
        ? (now - lastCheckMs) / (1000 * 60 * 60)
        : null
      const daysSinceImagery = lastImageryMs
        ? (now - lastImageryMs) / (1000 * 60 * 60 * 24)
        : null

      return {
        farmExternalId: s.farmExternalId,
        lastImageryCheckAt: s.lastImageryCheckAt ?? null,
        lastNewImageryDate: s.lastNewImageryDate ?? null,
        hoursSinceCheck: hoursSinceCheck !== null ? Math.round(hoursSinceCheck * 10) / 10 : null,
        daysSinceImagery: daysSinceImagery !== null ? Math.round(daysSinceImagery * 10) / 10 : null,
        checkStale: hoursSinceCheck === null || hoursSinceCheck > 48,
        imageryStale: daysSinceImagery === null || daysSinceImagery > 7,
      }
    })
  },
})

/**
 * Get livestock settings for a farm
 */
export const getLivestockSettings = query({
  args: { farmId: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .first()

    // Return default settings if not configured
    const defaultLivestockSettings = {
      cowAU: 1.0,
      calfAU: 0.5,
      sheepAU: 0.2,
      lambAU: 0.1,
      dailyDMPerAU: 12,
    }

    return settings?.livestockSettings ?? defaultLivestockSettings
  },
})
