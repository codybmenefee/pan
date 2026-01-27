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
