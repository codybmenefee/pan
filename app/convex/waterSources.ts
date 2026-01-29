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

const pointFeature = v.object({
  type: v.literal('Feature'),
  properties: v.optional(v.any()),
  geometry: v.object({
    type: v.literal('Point'),
    coordinates: v.array(v.number()), // [lng, lat]
  }),
})

const waterSourceType = v.union(
  v.literal('trough'),
  v.literal('pond'),
  v.literal('dam'),
  v.literal('tank'),
  v.literal('stream'),
  v.literal('other')
)

const waterSourceStatus = v.union(
  v.literal('active'),
  v.literal('seasonal'),
  v.literal('maintenance'),
  v.literal('dry'),
)

/**
 * List all water sources for a farm by external ID.
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

    const sources = await ctx.db
      .query('waterSources')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()
    return sources
  },
})

/**
 * Create a new water source.
 */
export const create = mutation({
  args: {
    farmId: v.string(),
    name: v.string(),
    type: waterSourceType,
    geometryType: v.union(v.literal('point'), v.literal('polygon')),
    geometry: v.union(pointFeature, polygonFeature),
    area: v.optional(v.number()),
    description: v.optional(v.string()),
    status: v.optional(waterSourceStatus),
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
    const sourceId = await ctx.db.insert('waterSources', {
      farmId: farm._id,
      name: args.name,
      type: args.type,
      geometryType: args.geometryType,
      geometry: args.geometry,
      area: args.area,
      description: args.description,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    })
    return sourceId
  },
})

/**
 * Update a water source.
 */
export const update = mutation({
  args: {
    id: v.id('waterSources'),
    name: v.optional(v.string()),
    type: v.optional(waterSourceType),
    geometry: v.optional(v.union(pointFeature, polygonFeature)),
    area: v.optional(v.number()),
    description: v.optional(v.string()),
    status: v.optional(waterSourceStatus),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error('Water source not found')
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }
    if (args.name !== undefined) updates.name = args.name
    if (args.type !== undefined) updates.type = args.type
    if (args.geometry !== undefined) updates.geometry = args.geometry
    if (args.area !== undefined) updates.area = args.area
    if (args.description !== undefined) updates.description = args.description
    if (args.status !== undefined) updates.status = args.status

    await ctx.db.patch(args.id, updates)
    return args.id
  },
})

/**
 * Update metadata for a water source (without geometry changes).
 */
export const updateMetadata = mutation({
  args: {
    id: v.id('waterSources'),
    name: v.optional(v.string()),
    type: v.optional(waterSourceType),
    description: v.optional(v.string()),
    status: v.optional(waterSourceStatus),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error('Water source not found')
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }
    if (args.name !== undefined) updates.name = args.name
    if (args.type !== undefined) updates.type = args.type
    if (args.description !== undefined) updates.description = args.description
    if (args.status !== undefined) updates.status = args.status

    await ctx.db.patch(args.id, updates)
    return args.id
  },
})

/**
 * Delete a water source.
 */
export const remove = mutation({
  args: {
    id: v.id('waterSources'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return { success: true }
  },
})
