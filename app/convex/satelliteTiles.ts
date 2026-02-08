import { v } from 'convex/values'
import { internalQuery, mutation, query } from './_generated/server'

/**
 * Get a tile by its document ID. Internal-only (used by HTTP tile server).
 */
export const getTileById = internalQuery({
  args: { id: v.id('satelliteImageTiles') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

/**
 * Get satellite tiles for a farm within an optional date range.
 */
export const getTilesForFarm = query({
  args: {
    farmId: v.id('farms'),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    tileType: v.optional(
      v.union(
        v.literal('rgb'),
        v.literal('ndvi'),
        v.literal('ndvi_heatmap'),
        v.literal('evi'),
        v.literal('ndwi')
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) => q.eq('farmId', args.farmId))

    const tiles = await query.collect()

    // Filter by date range and type
    return tiles.filter((tile) => {
      if (args.startDate && tile.captureDate < args.startDate) return false
      if (args.endDate && tile.captureDate > args.endDate) return false
      if (args.tileType && tile.tileType !== args.tileType) return false
      return true
    })
  },
})

/**
 * Get list of available capture dates for a farm.
 * Useful for the historical date picker.
 */
export const getAvailableDates = query({
  args: {
    farmId: v.id('farms'),
    tileType: v.optional(
      v.union(
        v.literal('rgb'),
        v.literal('ndvi'),
        v.literal('ndvi_heatmap'),
        v.literal('evi'),
        v.literal('ndwi')
      )
    ),
  },
  handler: async (ctx, args) => {
    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) => q.eq('farmId', args.farmId))
      .collect()

    // Filter by type if specified
    const filteredTiles = args.tileType
      ? tiles.filter((t) => t.tileType === args.tileType)
      : tiles

    // Group by date and extract metadata
    const dateMap = new Map<
      string,
      {
        date: string
        cloudCoverPct: number
        tileTypes: string[]
        provider: string
      }
    >()

    for (const tile of filteredTiles) {
      const existing = dateMap.get(tile.captureDate)
      if (existing) {
        if (!existing.tileTypes.includes(tile.tileType)) {
          existing.tileTypes.push(tile.tileType)
        }
        // Use the minimum cloud cover for the date
        existing.cloudCoverPct = Math.min(
          existing.cloudCoverPct,
          tile.cloudCoverPct
        )
      } else {
        dateMap.set(tile.captureDate, {
          date: tile.captureDate,
          cloudCoverPct: tile.cloudCoverPct,
          tileTypes: [tile.tileType],
          provider: tile.provider,
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
 * Get a specific tile by farm, date, and type.
 */
export const getTile = query({
  args: {
    farmId: v.id('farms'),
    captureDate: v.string(),
    tileType: v.union(
      v.literal('rgb'),
      v.literal('ndvi'),
      v.literal('ndvi_heatmap'),
      v.literal('evi'),
      v.literal('ndwi')
    ),
  },
  handler: async (ctx, args) => {
    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) =>
        q.eq('farmId', args.farmId).eq('captureDate', args.captureDate)
      )
      .collect()

    return tiles.find((t) => t.tileType === args.tileType) ?? null
  },
})

/**
 * Get a specific tile by farm external ID, date, and type.
 * Used by frontend which only knows external IDs.
 */
export const getTileByExternalId = query({
  args: {
    farmExternalId: v.string(),
    captureDate: v.string(),
    tileType: v.union(
      v.literal('rgb'),
      v.literal('ndvi'),
      v.literal('ndvi_heatmap'),
      v.literal('evi'),
      v.literal('ndwi')
    ),
  },
  handler: async (ctx, args) => {
    // Look up farm by external ID
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmExternalId))
      .first()

    // Also try legacy external ID
    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q) =>
          q.eq('legacyExternalId', args.farmExternalId)
        )
        .first()
    }

    if (!farm) {
      return null
    }

    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) =>
        q.eq('farmId', farm._id).eq('captureDate', args.captureDate)
      )
      .collect()

    return tiles.find((t) => t.tileType === args.tileType) ?? null
  },
})

/**
 * Get tiles for a farm by external ID.
 */
export const getTilesForFarmByExternalId = query({
  args: {
    farmExternalId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    tileType: v.optional(
      v.union(
        v.literal('rgb'),
        v.literal('ndvi'),
        v.literal('ndvi_heatmap'),
        v.literal('evi'),
        v.literal('ndwi')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Look up farm by external ID
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmExternalId))
      .first()

    // Also try legacy external ID
    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q) =>
          q.eq('legacyExternalId', args.farmExternalId)
        )
        .first()
    }

    if (!farm) {
      return []
    }

    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) => q.eq('farmId', farm._id))
      .collect()

    // Filter by date range and type
    return tiles.filter((tile) => {
      if (args.startDate && tile.captureDate < args.startDate) return false
      if (args.endDate && tile.captureDate > args.endDate) return false
      if (args.tileType && tile.tileType !== args.tileType) return false
      return true
    })
  },
})

/**
 * Get available dates by farm external ID.
 */
export const getAvailableDatesByExternalId = query({
  args: {
    farmExternalId: v.string(),
    tileType: v.optional(
      v.union(
        v.literal('rgb'),
        v.literal('ndvi'),
        v.literal('ndvi_heatmap'),
        v.literal('evi'),
        v.literal('ndwi')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Look up farm by external ID
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmExternalId))
      .first()

    // Also try legacy external ID
    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q) =>
          q.eq('legacyExternalId', args.farmExternalId)
        )
        .first()
    }

    if (!farm) {
      return []
    }

    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) => q.eq('farmId', farm._id))
      .collect()

    // Filter by type if specified
    const filteredTiles = args.tileType
      ? tiles.filter((t) => t.tileType === args.tileType)
      : tiles

    // Group by date and extract metadata
    const dateMap = new Map<
      string,
      {
        date: string
        cloudCoverPct: number
        tileTypes: string[]
        provider: string
      }
    >()

    for (const tile of filteredTiles) {
      const existing = dateMap.get(tile.captureDate)
      if (existing) {
        if (!existing.tileTypes.includes(tile.tileType)) {
          existing.tileTypes.push(tile.tileType)
        }
        existing.cloudCoverPct = Math.min(
          existing.cloudCoverPct,
          tile.cloudCoverPct
        )
      } else {
        dateMap.set(tile.captureDate, {
          date: tile.captureDate,
          cloudCoverPct: tile.cloudCoverPct,
          tileTypes: [tile.tileType],
          provider: tile.provider,
        })
      }
    }

    return Array.from(dateMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    )
  },
})

/**
 * Create a new satellite tile record.
 * Called by the pipeline after uploading to R2.
 */
export const createTile = mutation({
  args: {
    farmId: v.id('farms'),
    captureDate: v.string(),
    provider: v.string(),
    tileType: v.union(
      v.literal('rgb'),
      v.literal('ndvi'),
      v.literal('ndvi_heatmap'),
      v.literal('evi'),
      v.literal('ndwi')
    ),
    r2Key: v.string(),
    r2Url: v.string(),
    bounds: v.object({
      west: v.number(),
      south: v.number(),
      east: v.number(),
      north: v.number(),
    }),
    cloudCoverPct: v.number(),
    resolutionMeters: v.number(),
    fileSizeBytes: v.number(),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if tile already exists (upsert behavior)
    const existing = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) =>
        q.eq('farmId', args.farmId).eq('captureDate', args.captureDate)
      )
      .filter((q) => q.eq(q.field('tileType'), args.tileType))
      .first()

    if (existing) {
      // Update existing tile (including bounds in case they were corrected)
      await ctx.db.patch(existing._id, {
        r2Key: args.r2Key,
        r2Url: args.r2Url,
        bounds: args.bounds,
        cloudCoverPct: args.cloudCoverPct,
        fileSizeBytes: args.fileSizeBytes,
        expiresAt: args.expiresAt,
      })
      return existing._id
    }

    // Create new tile
    return await ctx.db.insert('satelliteImageTiles', {
      ...args,
      createdAt: new Date().toISOString(),
    })
  },
})

/**
 * Create a tile using farm external ID (for pipeline use).
 * Looks up the farm by external ID first.
 */
export const createTileByExternalId = mutation({
  args: {
    farmExternalId: v.string(),
    captureDate: v.string(),
    provider: v.string(),
    tileType: v.union(
      v.literal('rgb'),
      v.literal('ndvi'),
      v.literal('ndvi_heatmap'),
      v.literal('evi'),
      v.literal('ndwi')
    ),
    r2Key: v.string(),
    r2Url: v.string(),
    bounds: v.object({
      west: v.number(),
      south: v.number(),
      east: v.number(),
      north: v.number(),
    }),
    cloudCoverPct: v.number(),
    resolutionMeters: v.number(),
    fileSizeBytes: v.number(),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Look up farm by external ID
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmExternalId))
      .first()

    // Also try legacy external ID
    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q) =>
          q.eq('legacyExternalId', args.farmExternalId)
        )
        .first()
    }

    if (!farm) {
      throw new Error(`Farm not found with external ID: ${args.farmExternalId}`)
    }

    // Check if tile already exists (upsert behavior)
    const existing = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) =>
        q.eq('farmId', farm._id).eq('captureDate', args.captureDate)
      )
      .filter((q) => q.eq(q.field('tileType'), args.tileType))
      .first()

    if (existing) {
      // Update existing tile (including bounds in case they were corrected)
      await ctx.db.patch(existing._id, {
        r2Key: args.r2Key,
        r2Url: args.r2Url,
        bounds: args.bounds,
        cloudCoverPct: args.cloudCoverPct,
        fileSizeBytes: args.fileSizeBytes,
        expiresAt: args.expiresAt,
      })
      return existing._id
    }

    // Create new tile
    return await ctx.db.insert('satelliteImageTiles', {
      farmId: farm._id,
      captureDate: args.captureDate,
      provider: args.provider,
      tileType: args.tileType,
      r2Key: args.r2Key,
      r2Url: args.r2Url,
      bounds: args.bounds,
      cloudCoverPct: args.cloudCoverPct,
      resolutionMeters: args.resolutionMeters,
      fileSizeBytes: args.fileSizeBytes,
      createdAt: new Date().toISOString(),
      expiresAt: args.expiresAt,
    })
  },
})

/**
 * Delete expired tiles (called by cleanup job).
 */
export const deleteExpiredTiles = mutation({
  args: {
    farmId: v.id('farms'),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) => q.eq('farmId', args.farmId))
      .collect()

    let deletedCount = 0
    for (const tile of tiles) {
      if (tile.expiresAt && tile.expiresAt < now) {
        await ctx.db.delete(tile._id)
        deletedCount++
      }
    }

    return { deletedCount }
  },
})

/**
 * Refresh the R2 URL for a specific tile.
 * Used when presigned URLs expire and need regeneration.
 * Called by the refresh_tile_urls.py script.
 */
export const refreshTileUrl = mutation({
  args: {
    farmExternalId: v.string(),
    captureDate: v.string(),
    tileType: v.union(
      v.literal('rgb'),
      v.literal('ndvi'),
      v.literal('ndvi_heatmap'),
      v.literal('evi'),
      v.literal('ndwi')
    ),
    r2Url: v.string(),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmExternalId))
      .first()

    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q) =>
          q.eq('legacyExternalId', args.farmExternalId)
        )
        .first()
    }

    if (!farm) {
      throw new Error(`Farm not found: ${args.farmExternalId}`)
    }

    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) =>
        q.eq('farmId', farm._id).eq('captureDate', args.captureDate)
      )
      .filter((q) => q.eq(q.field('tileType'), args.tileType))
      .collect()

    const tile = tiles[0]
    if (!tile) {
      throw new Error(
        `Tile not found: ${args.farmExternalId}/${args.captureDate}/${args.tileType}`
      )
    }

    const patch: Record<string, string | undefined> = { r2Url: args.r2Url }
    if (args.expiresAt !== undefined) {
      patch.expiresAt = args.expiresAt
    }

    await ctx.db.patch(tile._id, patch)
    return tile._id
  },
})

/**
 * Refresh all tile URLs for a farm using a public URL base.
 * Constructs new URLs from the r2Key and the provided base URL.
 */
export const refreshAllTileUrls = mutation({
  args: {
    farmExternalId: v.string(),
    publicUrlBase: v.string(),
  },
  handler: async (ctx, args) => {
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmExternalId))
      .first()

    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q) =>
          q.eq('legacyExternalId', args.farmExternalId)
        )
        .first()
    }

    if (!farm) {
      throw new Error(`Farm not found: ${args.farmExternalId}`)
    }

    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) => q.eq('farmId', farm._id))
      .collect()

    const base = args.publicUrlBase.replace(/\/+$/, '')
    let updated = 0

    for (const tile of tiles) {
      const newUrl = `${base}/${tile.r2Key}`
      await ctx.db.patch(tile._id, { r2Url: newUrl })
      updated++
    }

    return { updated }
  },
})

/**
 * Get storage usage for a farm.
 */
export const getStorageUsage = query({
  args: {
    farmId: v.id('farms'),
  },
  handler: async (ctx, args) => {
    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q) => q.eq('farmId', args.farmId))
      .collect()

    const totalBytes = tiles.reduce((sum, t) => sum + t.fileSizeBytes, 0)
    const tileCount = tiles.length

    // Group by type
    const byType: Record<string, { count: number; bytes: number }> = {}
    for (const tile of tiles) {
      if (!byType[tile.tileType]) {
        byType[tile.tileType] = { count: 0, bytes: 0 }
      }
      byType[tile.tileType].count++
      byType[tile.tileType].bytes += tile.fileSizeBytes
    }

    return {
      totalBytes,
      totalMB: Math.round((totalBytes / 1024 / 1024) * 100) / 100,
      tileCount,
      byType,
    }
  },
})
