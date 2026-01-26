import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'
import { defaultFarmSettings } from './seedData'

const mapPreferencesShape = v.object({
  showRGBSatellite: v.boolean(),
})

const settingsShape = {
  minNDVIThreshold: v.number(),
  minRestPeriod: v.number(),
  cloudCoverTolerance: v.number(),
  dailyBriefTime: v.string(),
  emailNotifications: v.boolean(),
  pushNotifications: v.boolean(),
  virtualFenceProvider: v.optional(v.string()),
  apiKey: v.optional(v.string()),
  mapPreferences: v.optional(mapPreferencesShape),
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

    const currentPrefs = existing?.mapPreferences ?? { showRGBSatellite: false }
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
