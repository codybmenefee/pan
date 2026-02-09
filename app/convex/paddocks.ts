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

const pastureStatus = v.union(
  v.literal('ready'),
  v.literal('almost_ready'),
  v.literal('recovering'),
  v.literal('grazed'),
)

const geometryChange = v.object({
  id: v.string(),
  entityType: v.union(v.literal('pasture'), v.literal('paddock')),
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

async function findFarmByExternalId(ctx: any, farmExternalId: string) {
  try {
    const byExternal = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
      .first()
    if (byExternal) return byExternal
  } catch {
    // Fallback for mixed deployments where index changes may be propagating.
  }

  try {
    const byLegacy = await ctx.db
      .query('farms')
      .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', farmExternalId))
      .first()
    if (byLegacy) return byLegacy
  } catch {
    // Ignore and fallback to collection scan.
  }

  const allFarms = await ctx.db.query('farms').collect()
  return allFarms.find((farm: any) => farm.externalId === farmExternalId || farm.legacyExternalId === farmExternalId) ?? null
}

async function listPasturesByFarmDocId(ctx: any, farmDocId: unknown) {
  try {
    return await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farmDocId))
      .collect()
  } catch {
    const allPastures = await ctx.db.query('paddocks').collect()
    return allPastures.filter((pasture: any) => pasture.farmId === farmDocId)
  }
}

async function findPastureByFarmExternalId(ctx: any, farmDocId: unknown, pastureExternalId: string) {
  try {
    return await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q: any) => byFarmExternalId(q, farmDocId, pastureExternalId))
      .first()
  } catch {
    const farmPastures = await listPasturesByFarmDocId(ctx, farmDocId)
    return farmPastures.find((pasture: any) => pasture.externalId === pastureExternalId) ?? null
  }
}

export const listPasturesByFarm = query({
  args: { farmId: v.string() },
  handler: async (ctx, args) => {
    const farm = await findFarmByExternalId(ctx, args.farmId)

    if (!farm) {
      return []
    }

    return await listPasturesByFarmDocId(ctx, farm._id)
  },
})

// Backward-compatible alias for pre-rename clients.
export const listPaddocksByFarm = listPasturesByFarm

export const applyPastureChanges = mutation({
  args: {
    farmId: v.string(),
    changes: v.array(geometryChange),
  },
  handler: async (ctx, args) => {
    const farm = await findFarmByExternalId(ctx, args.farmId)

    if (!farm) {
      throw new Error('Farm not found.')
    }

    const now = new Date().toISOString()
    let countNeedsRefresh = false
    let applied = 0

    for (const change of args.changes) {
      if (change.entityType !== 'pasture' && change.entityType !== 'paddock') continue

      const existing = await findPastureByFarmExternalId(ctx, farm._id, change.id)

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

      const pastureData = {
        name: resolveString(metadata.name, 'New Pasture'),
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
          area: pastureData.area,
          updatedAt: now,
        })
        applied += 1
        continue
      }

      await ctx.db.insert('paddocks', {
        farmId: farm._id,
        externalId: change.id,
        geometry,
        ...pastureData,
        createdAt: now,
        updatedAt: now,
      })
      applied += 1
      countNeedsRefresh = true
    }

    if (countNeedsRefresh) {
      const pastureCount = await listPasturesByFarmDocId(ctx, farm._id)

      await ctx.db.patch(farm._id, {
        paddockCount: pastureCount.length,
        updatedAt: now,
      })
    }

    return { applied }
  },
})

// Backward-compatible alias for pre-rename clients.
export const applyPaddockChanges = applyPastureChanges

/**
 * Get a pasture by farm and pasture external IDs.
 * Used by NDVI grid generation for coordinate bounds.
 */
export const getPastureByExternalId = query({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const farm = await findFarmByExternalId(ctx, args.farmExternalId)

    if (!farm) {
      return null
    }

    return await findPastureByFarmExternalId(ctx, farm._id, args.paddockExternalId)
  },
})

// Backward-compatible alias for pre-rename clients.
export const getPaddockByExternalId = getPastureByExternalId

export const updatePastureMetadata = mutation({
  args: {
    farmId: v.string(),
    paddockId: v.string(),
    metadata: v.object({
      name: v.optional(v.string()),
      status: v.optional(pastureStatus),
      ndvi: v.optional(v.number()),
      restDays: v.optional(v.number()),
      area: v.optional(v.number()),
      waterAccess: v.optional(v.string()),
      lastGrazed: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const farm = await findFarmByExternalId(ctx, args.farmId)

    if (!farm) {
      throw new Error('Farm not found.')
    }

    const pasture = await findPastureByFarmExternalId(ctx, farm._id, args.paddockId)

    if (!pasture) {
      throw new Error('Pasture not found.')
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (args.metadata.name !== undefined) updates.name = args.metadata.name
    if (args.metadata.status !== undefined) updates.status = args.metadata.status
    if (args.metadata.ndvi !== undefined) updates.ndvi = args.metadata.ndvi
    if (args.metadata.restDays !== undefined) updates.restDays = args.metadata.restDays
    if (args.metadata.area !== undefined) updates.area = args.metadata.area
    if (args.metadata.waterAccess !== undefined) updates.waterAccess = args.metadata.waterAccess
    if (args.metadata.lastGrazed !== undefined) updates.lastGrazed = args.metadata.lastGrazed

    await ctx.db.patch(pasture._id, updates)

    return { updated: true }
  },
})

// Backward-compatible alias for pre-rename clients.
export const updatePaddockMetadata = updatePastureMetadata
