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

const noGrazeZoneType = v.union(
  v.literal('environmental'),
  v.literal('hazard'),
  v.literal('infrastructure'),
  v.literal('protected'),
  v.literal('other'),
)

/**
 * List all no-graze zones for a farm by external ID.
 */
export const listByFarm = query({
  args: {
    farmId: v.string(),
  },
  handler: async (ctx, args) => {
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmId))
      .first()

    if (!farm) {
      return []
    }

    const zones = await ctx.db
      .query('noGrazeZones')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()
    return zones
  },
})

/**
 * Create a new no-graze zone.
 */
export const create = mutation({
  args: {
    farmId: v.string(),
    name: v.string(),
    type: v.optional(noGrazeZoneType),
    area: v.optional(v.number()),
    description: v.optional(v.string()),
    geometry: polygonFeature,
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
    const zoneId = await ctx.db.insert('noGrazeZones', {
      farmId: farm._id,
      name: args.name,
      type: args.type,
      area: args.area,
      description: args.description,
      geometry: args.geometry,
      createdAt: now,
      updatedAt: now,
    })
    return zoneId
  },
})

/**
 * Update a no-graze zone.
 */
export const update = mutation({
  args: {
    id: v.id('noGrazeZones'),
    name: v.optional(v.string()),
    type: v.optional(noGrazeZoneType),
    area: v.optional(v.number()),
    description: v.optional(v.string()),
    geometry: v.optional(polygonFeature),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error('No-graze zone not found')
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }
    if (args.name !== undefined) updates.name = args.name
    if (args.type !== undefined) updates.type = args.type
    if (args.area !== undefined) updates.area = args.area
    if (args.description !== undefined) updates.description = args.description
    if (args.geometry !== undefined) updates.geometry = args.geometry

    await ctx.db.patch(args.id, updates)
    return args.id
  },
})

/**
 * Update metadata for a no-graze zone (without geometry changes).
 */
export const updateMetadata = mutation({
  args: {
    id: v.id('noGrazeZones'),
    name: v.optional(v.string()),
    type: v.optional(noGrazeZoneType),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error('No-graze zone not found')
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }
    if (args.name !== undefined) updates.name = args.name
    if (args.type !== undefined) updates.type = args.type
    if (args.description !== undefined) updates.description = args.description

    await ctx.db.patch(args.id, updates)
    return args.id
  },
})

/**
 * Delete a no-graze zone.
 */
export const remove = mutation({
  args: {
    id: v.id('noGrazeZones'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return { success: true }
  },
})
