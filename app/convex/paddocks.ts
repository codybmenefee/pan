import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'
import area from '@turf/area'
import type { Feature, Polygon } from 'geojson'
import { HECTARES_PER_SQUARE_METER } from './lib/areaConstants'

const polygonFeature = v.object({
  type: v.literal('Feature'),
  properties: v.optional(v.any()),
  geometry: v.object({
    type: v.literal('Polygon'),
    coordinates: v.array(v.array(v.array(v.number()))),
  }),
})

const paddockStatus = v.union(
  v.literal('ready'),
  v.literal('almost_ready'),
  v.literal('recovering'),
  v.literal('grazed'),
)

const geometryChange = v.object({
  id: v.string(),
  entityType: v.union(v.literal('paddock'), v.literal('section')),
  changeType: v.union(v.literal('add'), v.literal('update'), v.literal('delete')),
  geometry: v.optional(polygonFeature),
  parentId: v.optional(v.string()),
  timestamp: v.string(),
  metadata: v.optional(v.any()),
})

function calculateAreaHectares(feature: Feature<Polygon>, decimals = 1): number {
  const squareMeters = area(feature)
  if (!Number.isFinite(squareMeters)) return 0
  const hectares = squareMeters * HECTARES_PER_SQUARE_METER
  const factor = Math.pow(10, decimals)
  return Math.round(hectares * factor) / factor
}

function resolveStatus(value: unknown) {
  if (value === 'ready' || value === 'almost_ready' || value === 'recovering' || value === 'grazed') {
    return value
  }
  return 'recovering'
}

function resolveNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function resolveString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function defaultLastGrazed() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function normalizeGeometry(
  geometry: { type: 'Feature'; properties?: unknown; geometry: { type: 'Polygon'; coordinates: number[][][] } }
): Feature<Polygon> {
  return {
    type: 'Feature',
    properties: (geometry.properties ?? {}) as Record<string, unknown>,
    geometry: geometry.geometry,
  }
}

function byFarmExternalId(q: any, farmId: unknown, externalId: unknown) {
  return q.eq('farmId', farmId).eq('externalId', externalId)
}

export const listPaddocksByFarm = query({
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
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()
  },
})

export const applyPaddockChanges = mutation({
  args: {
    farmId: v.string(),
    changes: v.array(geometryChange),
  },
  handler: async (ctx, args) => {
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmId))
      .first()

    if (!farm) {
      throw new Error('Farm not found.')
    }

    const now = new Date().toISOString()
    let countNeedsRefresh = false
    let applied = 0

    for (const change of args.changes) {
      if (change.entityType !== 'paddock') continue

      const existing = await ctx.db
        .query('paddocks')
        .withIndex('by_farm_externalId', (q) => byFarmExternalId(q, farm._id, change.id))
        .first()

      if (change.changeType === 'delete') {
        if (existing) {
          await ctx.db.delete(existing._id)
          applied += 1
          countNeedsRefresh = true
        }
        continue
      }

      if (!change.geometry) {
        continue
      }

      const geometry = normalizeGeometry(change.geometry)
      const metadata = (change.metadata ?? {}) as {
        name?: unknown
        status?: unknown
        ndvi?: unknown
        restDays?: unknown
        area?: unknown
        waterAccess?: unknown
        lastGrazed?: unknown
      }

      const paddockData = {
        name: resolveString(metadata.name, 'New Paddock'),
        status: resolveStatus(metadata.status),
        ndvi: resolveNumber(metadata.ndvi, 0.35),
        restDays: resolveNumber(metadata.restDays, 0),
        area: resolveNumber(metadata.area, calculateAreaHectares(geometry)),
        waterAccess: resolveString(metadata.waterAccess, 'None'),
        lastGrazed: resolveString(metadata.lastGrazed, defaultLastGrazed()),
      }

      if (existing) {
        await ctx.db.patch(existing._id, {
          geometry,
          area: paddockData.area,
          updatedAt: now,
        })
        applied += 1
        continue
      }

      await ctx.db.insert('paddocks', {
        farmId: farm._id,
        externalId: change.id,
        geometry,
        ...paddockData,
        createdAt: now,
        updatedAt: now,
      })
      applied += 1
      countNeedsRefresh = true
    }

    if (countNeedsRefresh) {
      const paddockCount = await ctx.db
        .query('paddocks')
        .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
        .collect()

      await ctx.db.patch(farm._id, {
        paddockCount: paddockCount.length,
        updatedAt: now,
      })
    }

    return { applied }
  },
})

/**
 * Get a paddock by farm and paddock external IDs.
 * Used by NDVI grid generation for coordinate bounds.
 */
export const getPaddockByExternalId = query({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    // First find the farm
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
      return null
    }

    // Find the paddock using helper to satisfy TypeScript
    const farmId = farm._id
    const paddock = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q) => byFarmExternalId(q, farmId, args.paddockExternalId))
      .first()

    return paddock
  },
})

export const updatePaddockMetadata = mutation({
  args: {
    farmId: v.string(),
    paddockId: v.string(),
    metadata: v.object({
      name: v.optional(v.string()),
      status: v.optional(paddockStatus),
      ndvi: v.optional(v.number()),
      restDays: v.optional(v.number()),
      area: v.optional(v.number()),
      waterAccess: v.optional(v.string()),
      lastGrazed: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmId))
      .first()

    if (!farm) {
      throw new Error('Farm not found.')
    }

    const paddock = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q) => byFarmExternalId(q, farm._id, args.paddockId))
      .first()

    if (!paddock) {
      throw new Error('Paddock not found.')
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (args.metadata.name !== undefined) updates.name = args.metadata.name
    if (args.metadata.status !== undefined) updates.status = args.metadata.status
    if (args.metadata.ndvi !== undefined) updates.ndvi = args.metadata.ndvi
    if (args.metadata.restDays !== undefined) updates.restDays = args.metadata.restDays
    if (args.metadata.area !== undefined) updates.area = args.metadata.area
    if (args.metadata.waterAccess !== undefined) updates.waterAccess = args.metadata.waterAccess
    if (args.metadata.lastGrazed !== undefined) updates.lastGrazed = args.metadata.lastGrazed

    await ctx.db.patch(paddock._id, updates)

    return { updated: true }
  },
})
