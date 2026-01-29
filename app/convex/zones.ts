import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const polygonFeature = v.object({
  type: v.literal('Feature'),
  properties: v.optional(v.any()),
  geometry: v.object({
    type: v.literal('Polygon'),
    coordinates: v.array(v.array(v.array(v.number()))),
  }),
})

/**
 * Create a new zone.
 */
export const create = mutation({
  args: {
    paddockId: v.id('paddocks'),
    name: v.string(),
    type: v.union(
      v.literal('water'),
      v.literal('shade'),
      v.literal('feeding'),
      v.literal('mineral'),
      v.literal('other')
    ),
    geometry: polygonFeature,
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const zoneId = await ctx.db.insert('zones', {
      paddockId: args.paddockId,
      name: args.name,
      type: args.type,
      geometry: args.geometry,
      metadata: args.metadata,
    })
    return zoneId
  },
})

/**
 * List all zones for a paddock.
 */
export const listByPaddock = query({
  args: {
    paddockId: v.id('paddocks'),
  },
  handler: async (ctx, args) => {
    const zones = await ctx.db
      .query('zones')
      .withIndex('by_paddock', (q) => q.eq('paddockId', args.paddockId))
      .collect()
    return zones
  },
})

/**
 * Get a zone by ID.
 */
export const get = query({
  args: {
    zoneId: v.id('zones'),
  },
  handler: async (ctx, args) => {
    const zone = await ctx.db.get(args.zoneId)
    return zone
  },
})

/**
 * Update a zone.
 */
export const update = mutation({
  args: {
    zoneId: v.id('zones'),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('water'),
        v.literal('shade'),
        v.literal('feeding'),
        v.literal('mineral'),
        v.literal('other')
      )
    ),
    geometry: v.optional(polygonFeature),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { zoneId, ...updates } = args
    const existing = await ctx.db.get(zoneId)
    if (!existing) {
      throw new Error('Zone not found')
    }

    await ctx.db.patch(zoneId, updates)
    return zoneId
  },
})

/**
 * Delete a zone.
 */
export const remove = mutation({
  args: {
    zoneId: v.id('zones'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.zoneId)
    return { success: true }
  },
})
