import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * Create a new farmer observation.
 */
export const create = mutation({
  args: {
    farmId: v.id('farms'),
    authorId: v.string(),
    level: v.union(v.literal('farm'), v.literal('paddock'), v.literal('zone')),
    targetId: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const observationId = await ctx.db.insert('farmerObservations', {
      farmId: args.farmId,
      authorId: args.authorId,
      level: args.level,
      targetId: args.targetId,
      content: args.content,
      tags: args.tags,
      createdAt: new Date().toISOString(),
    })
    return observationId
  },
})

/**
 * List all observations for a farm.
 */
export const listByFarm = query({
  args: {
    farmId: v.id('farms'),
  },
  handler: async (ctx, args) => {
    const observations = await ctx.db
      .query('farmerObservations')
      .withIndex('by_farm', (q) => q.eq('farmId', args.farmId))
      .order('desc')
      .collect()
    return observations
  },
})

/**
 * List observations for a specific target (paddock, zone, or farm).
 */
export const listByTarget = query({
  args: {
    level: v.union(v.literal('farm'), v.literal('paddock'), v.literal('zone')),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const observations = await ctx.db
      .query('farmerObservations')
      .withIndex('by_target', (q) =>
        q.eq('level', args.level).eq('targetId', args.targetId)
      )
      .order('desc')
      .collect()
    return observations
  },
})

/**
 * List the most recent N observations for a farm.
 */
export const listRecent = query({
  args: {
    farmId: v.id('farms'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5
    const observations = await ctx.db
      .query('farmerObservations')
      .withIndex('by_farm', (q) => q.eq('farmId', args.farmId))
      .order('desc')
      .take(limit)
    return observations
  },
})
