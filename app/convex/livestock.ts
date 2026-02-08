import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'

const animalType = v.union(v.literal('cow'), v.literal('sheep'))

// Default AU factors and consumption rate
const DEFAULT_LIVESTOCK_SETTINGS = {
  cowAU: 1.0,
  calfAU: 0.5,
  sheepAU: 0.2,
  lambAU: 0.1,
  dailyDMPerAU: 12, // kg dry matter per AU per day
  pastureYieldKgPerHa: 2500, // kg dry matter per hectare
}

/**
 * Get all livestock entries for a farm by external ID.
 */
export const getLivestock = query({
  args: { farmId: v.string() },
  handler: async (ctx, args) => {
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmId))
      .first()

    if (!farm) {
      return []
    }

    return ctx.db
      .query('livestock')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()
  },
})

/**
 * Get livestock entry by farm and animal type
 */
export const getLivestockByType = query({
  args: {
    farmId: v.string(),
    animalType: animalType,
  },
  handler: async (ctx, args) => {
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmId))
      .first()

    if (!farm) {
      return null
    }

    return ctx.db
      .query('livestock')
      .withIndex('by_farm_type', (q: any) =>
        q.eq('farmId', farm._id).eq('animalType', args.animalType)
      )
      .first()
  },
})

/**
 * Create or update livestock entry for a farm
 */
export const upsertLivestock = mutation({
  args: {
    farmId: v.string(),
    animalType: animalType,
    adultCount: v.number(),
    offspringCount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmId))
      .first()

    if (!farm) {
      throw new Error('Farm not found')
    }

    const now = new Date().toISOString()
    const existing = await ctx.db
      .query('livestock')
      .withIndex('by_farm_type', (q: any) =>
        q.eq('farmId', farm._id).eq('animalType', args.animalType)
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        adultCount: args.adultCount,
        offspringCount: args.offspringCount,
        notes: args.notes,
        updatedAt: now,
      })
      return { id: existing._id }
    }

    const id = await ctx.db.insert('livestock', {
      farmId: farm._id,
      animalType: args.animalType,
      adultCount: args.adultCount,
      offspringCount: args.offspringCount,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    })
    return { id }
  },
})

/**
 * Delete a livestock entry
 */
export const deleteLivestock = mutation({
  args: { id: v.id('livestock') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

/**
 * Get computed livestock summary with AU totals
 * Uses farm-specific settings if available, otherwise defaults
 */
export const getLivestockSummary = query({
  args: { farmId: v.string() },
  handler: async (ctx, args) => {
    // Get farm by external ID
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmId))
      .first()

    if (!farm) {
      return null
    }

    // Get farm settings for AU factors
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .first()

    const ls = settings?.livestockSettings ?? DEFAULT_LIVESTOCK_SETTINGS

    // Get all livestock entries
    const entries = await ctx.db
      .query('livestock')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    // Initialize summary values
    let cows = 0
    let calves = 0
    let sheep = 0
    let lambs = 0

    // Aggregate from entries
    for (const entry of entries) {
      if (entry.animalType === 'cow') {
        cows = entry.adultCount
        calves = entry.offspringCount
      } else if (entry.animalType === 'sheep') {
        sheep = entry.adultCount
        lambs = entry.offspringCount
      }
    }

    // Calculate total animal units
    const totalAnimalUnits =
      cows * ls.cowAU +
      calves * ls.calfAU +
      sheep * ls.sheepAU +
      lambs * ls.lambAU

    // Calculate daily consumption in kg
    const dailyConsumptionKg = totalAnimalUnits * ls.dailyDMPerAU

    return {
      cows,
      calves,
      sheep,
      lambs,
      totalAnimalUnits: Math.round(totalAnimalUnits * 10) / 10, // 1 decimal place
      dailyConsumptionKg: Math.round(dailyConsumptionKg),
      // Include AU factors used for transparency
      auFactors: {
        cowAU: ls.cowAU,
        calfAU: ls.calfAU,
        sheepAU: ls.sheepAU,
        lambAU: ls.lambAU,
        dailyDMPerAU: ls.dailyDMPerAU,
      },
    }
  },
})
