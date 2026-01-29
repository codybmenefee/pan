import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

const observationShape = {
  farmExternalId: v.string(),
  paddockExternalId: v.string(),
  date: v.string(),
  ndviMean: v.number(),
  ndviMin: v.number(),
  ndviMax: v.number(),
  ndviStd: v.number(),
  eviMean: v.number(),
  ndwiMean: v.number(),
  cloudFreePct: v.number(),
  pixelCount: v.number(),
  isValid: v.boolean(),
  sourceProvider: v.string(),
  resolutionMeters: v.number(),
  createdAt: v.string(),
}

export const getObservations = query({
  args: {
    farmId: v.string(),
    paddockId: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query('observations').withIndex('by_farm', (q) =>
      q.eq('farmExternalId', args.farmId)
    )

    let observations = await q.collect()

    if (args.paddockId) {
      observations = observations.filter(o => o.paddockExternalId === args.paddockId)
    }

    if (args.days) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - args.days)
      observations = observations.filter(o => new Date(o.date) >= cutoff)
    }

    observations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return observations
  },
})

export const getLatestObservation = query({
  args: {
    farmId: v.string(),
    paddockId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('observations')
      .withIndex('by_paddock_date', (q) =>
        q.eq('paddockExternalId', args.paddockId)
      )
      .collect()
      .then(obs => {
        obs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        return obs[0] ?? null
      })
  },
})

export const getObservationsByDate = query({
  args: {
    farmId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const allObs = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .collect()
    return allObs.filter(o => o.date === args.date)
  },
})

export const refreshObservations = mutation({
  args: {
    observations: v.array(v.object(observationShape)),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const obs of args.observations) {
      const existing = await ctx.db
        .query('observations')
        .withIndex('by_paddock_date', (q) => q.eq('paddockExternalId', obs.paddockExternalId))
        .collect()
        .then(obsList => obsList.find(o => o.date === obs.date))

      if (existing) {
        await ctx.db.patch(existing._id, {
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
        updated += 1
      } else {
        await ctx.db.insert('observations', {
          ...obs,
          createdAt: now,
        })
        inserted += 1
      }
    }

    return { inserted, updated, skipped }
  },
})

/**
 * Batch create observations (for pipeline writer).
 * This is an alias for refreshObservations to maintain API compatibility.
 */
export const createBatch = mutation({
  args: {
    observations: v.array(v.object(observationShape)),
  },
  handler: async (ctx, args): Promise<{ count: number }> => {
    const result: { inserted: number; updated: number; skipped: number } = await ctx.runMutation(api.observations.refreshObservations, {
      observations: args.observations,
    })
    return { count: result.inserted + result.updated }
  },
})

export const deleteObservations = mutation({
  args: {
    farmId: v.string(),
    beforeDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmId))
      .collect()

    let deleted = 0
    for (const obs of observations) {
      if (args.beforeDate && new Date(obs.date) >= new Date(args.beforeDate)) {
        continue
      }
      await ctx.db.delete(obs._id)
      deleted += 1
    }

    return { deleted }
  },
})

/**
 * Get the most recent observation meeting quality thresholds.
 * Used by agent to avoid making decisions on cloudy data.
 */
export const getLatestReliableObservation = query({
  args: {
    farmId: v.string(),
    paddockId: v.string(),
    minCloudFreePct: v.number(), // 0-1
  },
  handler: async (ctx, args) => {
    const observations = await ctx.db
      .query('observations')
      .withIndex('by_paddock_date', (q) =>
        q.eq('paddockExternalId', args.paddockId)
      )
      .collect()

    // Sort by date descending
    observations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Find first observation meeting quality threshold
    return observations.find(o =>
      o.isValid && o.cloudFreePct >= args.minCloudFreePct
    ) ?? null
  },
})

/**
 * Get observation quality context for a paddock.
 * Returns both latest and latest reliable observations with metadata.
 */
export const getObservationQualityContext = query({
  args: {
    farmId: v.string(),
    paddockId: v.string(),
    minCloudFreePct: v.number(), // 0-1
  },
  handler: async (ctx, args) => {
    const observations = await ctx.db
      .query('observations')
      .withIndex('by_paddock_date', (q) =>
        q.eq('paddockExternalId', args.paddockId)
      )
      .collect()

    // Sort by date descending
    observations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const latest = observations[0] ?? null
    const reliable = observations.find(o =>
      o.isValid && o.cloudFreePct >= args.minCloudFreePct
    ) ?? null

    const isCurrentReliable = latest && latest.cloudFreePct >= args.minCloudFreePct && latest.isValid
    const daysSinceReliable = reliable
      ? Math.floor((Date.now() - new Date(reliable.date).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      latestObservation: latest,
      latestReliableObservation: reliable,
      isCurrentReliable,
      daysSinceReliable,
      usingFallback: !isCurrentReliable && reliable !== null,
    }
  },
})

export const getObservationsTrend = query({
  args: {
    paddockId: v.string(),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - args.days)

    const observations = await ctx.db
      .query('observations')
      .withIndex('by_paddock_date', (q) => q.eq('paddockExternalId', args.paddockId))
      .collect()
      .then(obs =>
        obs.filter(o => new Date(o.date) >= cutoff)
           .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      )

    return observations.map(o => ({
      date: o.date,
      ndvi: o.ndviMean,
      isValid: o.isValid,
    }))
  },
})

/**
 * Get the most recent observation date for a farm.
 * Used by the satellite pipeline to determine if updates are needed.
 */
export const getLatestObservationDate = query({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    if (observations.length === 0) {
      return null
    }

    // Sort by date descending and return the most recent
    observations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return observations[0].date
  },
})

/**
 * Get available dates with satellite observation data for a farm.
 * Used by the historical date picker.
 */
export const getAvailableDates = query({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    if (observations.length === 0) {
      return []
    }

    // Group by date and compute aggregate stats
    const dateMap = new Map<string, {
      date: string
      cloudCoverPct: number
      provider: string
      paddockCount: number
      avgNdvi: number
    }>()

    for (const obs of observations) {
      const existing = dateMap.get(obs.date)
      if (existing) {
        existing.paddockCount += 1
        existing.avgNdvi = (existing.avgNdvi * (existing.paddockCount - 1) + obs.ndviMean) / existing.paddockCount
        // Use minimum cloud-free (maximum coverage) for the date
        existing.cloudCoverPct = Math.min(existing.cloudCoverPct, 100 - obs.cloudFreePct * 100)
      } else {
        dateMap.set(obs.date, {
          date: obs.date,
          cloudCoverPct: 100 - obs.cloudFreePct * 100,
          provider: obs.sourceProvider,
          paddockCount: 1,
          avgNdvi: obs.ndviMean,
        })
      }
    }

    // Sort by date descending
    return Array.from(dateMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    )
  },
})

/**
 * Get recovery tracking data for all paddocks.
 * Returns per-paddock NDVI recovery since last graze.
 */
export const getRecoveryTracker = query({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    // 1. Get farm by externalId (Clerk org ID)
    const farm = await ctx.db.query('farms')
      .withIndex('by_externalId', q => q.eq('externalId', args.farmExternalId))
      .first()
    if (!farm) return []

    // 2. Get paddocks
    const paddocks = await ctx.db.query('paddocks')
      .withIndex('by_farm', q => q.eq('farmId', farm._id))
      .collect()

    // 3. Get all observations for the farm
    const observations = await ctx.db.query('observations')
      .withIndex('by_farm', q => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    // 4. Get grazing events
    const grazingEvents = await ctx.db.query('grazingEvents')
      .withIndex('by_farm', q => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    // 5. Calculate recovery % per paddock
    const now = Date.now()
    const results = paddocks.map(paddock => {
      // Find the most recent grazing event for this paddock
      const paddockGrazingEvents = grazingEvents
        .filter(e => e.paddockExternalId === paddock.externalId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const lastGrazeEvent = paddockGrazingEvents[0]
      const lastGrazedDate = lastGrazeEvent?.date || paddock.lastGrazed

      // Get paddock observations sorted by date
      const paddockObs = observations
        .filter(o => o.paddockExternalId === paddock.externalId && o.isValid)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Current (most recent) NDVI
      const currentObs = paddockObs[0]
      const currentNdvi = currentObs?.ndviMean ?? paddock.ndvi

      // Find NDVI at time of last graze (or closest observation after)
      let ndviAtGraze: number | null = null
      if (lastGrazedDate) {
        const obsAfterGraze = paddockObs
          .filter(o => new Date(o.date) >= new Date(lastGrazedDate))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        ndviAtGraze = obsAfterGraze[0]?.ndviMean ?? null
      }

      // Calculate rest days since last graze
      const restDays = lastGrazedDate
        ? Math.floor((now - new Date(lastGrazedDate).getTime()) / (1000 * 60 * 60 * 24))
        : paddock.restDays

      // Calculate recovery percentage
      // Recovery assumes NDVI drops after grazing and recovers toward ~0.6 (healthy pasture)
      // recoveryPct = (current - atGraze) / (target - atGraze) * 100
      // If no graze data, use a simpler heuristic
      let recoveryPct = 0
      const targetNdvi = 0.55 // Target NDVI for "fully recovered"
      const minNdvi = 0.25 // Assumed NDVI floor after heavy grazing

      if (ndviAtGraze !== null && ndviAtGraze < targetNdvi) {
        const recovered = currentNdvi - ndviAtGraze
        const toRecover = targetNdvi - ndviAtGraze
        recoveryPct = Math.min(100, Math.max(0, (recovered / toRecover) * 100))
      } else if (currentNdvi > 0) {
        // Fallback: estimate based on current NDVI relative to target
        recoveryPct = Math.min(100, Math.max(0, ((currentNdvi - minNdvi) / (targetNdvi - minNdvi)) * 100))
      }

      return {
        paddockId: paddock.externalId,
        paddockName: paddock.name,
        currentNdvi: Math.round(currentNdvi * 100) / 100,
        recoveryPct: Math.round(recoveryPct),
        restDays,
        lastGrazed: lastGrazedDate || null,
        status: paddock.status,
      }
    })

    // Sort by recovery percentage (lowest first - needs attention)
    return results.sort((a, b) => a.recoveryPct - b.recoveryPct)
  },
})

/**
 * Get farm-wide NDVI trend aggregated by date.
 */
export const getFarmNDVITrend = query({
  args: {
    farmExternalId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    // Filter by date and valid observations
    const filtered = observations.filter(o =>
      o.isValid && new Date(o.date) >= cutoff
    )

    if (filtered.length === 0) return []

    // Aggregate by date - average NDVI across all paddocks
    const dateMap = new Map<string, { total: number; count: number }>()

    for (const obs of filtered) {
      const existing = dateMap.get(obs.date)
      if (existing) {
        existing.total += obs.ndviMean
        existing.count += 1
      } else {
        dateMap.set(obs.date, { total: obs.ndviMean, count: 1 })
      }
    }

    // Convert to array and sort by date ascending
    const result = Array.from(dateMap.entries())
      .map(([date, { total, count }]) => ({
        date,
        ndvi: Math.round((total / count) * 1000) / 1000,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return result
  },
})
