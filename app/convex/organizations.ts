import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'

/**
 * Get farms by Clerk organization IDs.
 * Used to populate the farm selector with available farms.
 */
export const getFarmsByOrgIds = query({
  args: { orgIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    if (args.orgIds.length === 0) {
      return []
    }

    const farms = await Promise.all(
      args.orgIds.map(async (orgId) => {
        // First try to find by externalId (new Clerk org ID)
        let farm = await ctx.db
          .query('farms')
          .withIndex('by_externalId', (q) => q.eq('externalId', orgId))
          .first()

        // If not found, try legacy ID mapping
        if (!farm) {
          farm = await ctx.db
            .query('farms')
            .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', orgId))
            .first()
        }

        return farm
      })
    )

    // Filter out nulls
    return farms.filter((farm): farm is NonNullable<typeof farm> => farm !== null)
  },
})

/**
 * Create a farm when a Clerk organization is created.
 */
export const createFarmFromOrg = mutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    location: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Check if farm already exists
    const existingFarm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.clerkOrgId))
      .first()

    if (existingFarm) {
      return { farmId: existingFarm._id, created: false }
    }

    // Use provided coordinates or default to [0, 0]
    const coords = args.coordinates && args.coordinates.length === 2
      ? args.coordinates
      : [0, 0]

    // Create a new farm with provided or default values
    const farmId = await ctx.db.insert('farms', {
      externalId: args.clerkOrgId,
      clerkOrgSlug: args.slug,
      name: args.name,
      location: args.location ?? 'Not specified',
      totalArea: 0,
      paddockCount: 0,
      coordinates: coords,
      geometry: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[[coords[0], coords[1]], [coords[0], coords[1] + 0.01], [coords[0] + 0.01, coords[1] + 0.01], [coords[0] + 0.01, coords[1]], [coords[0], coords[1]]]],
        },
      },
      createdAt: now,
      updatedAt: now,
    })

    return { farmId, created: true }
  },
})

/**
 * Update user's active farm preference.
 * This is used when switching between farms in the UI.
 */
export const setActiveFarm = mutation({
  args: {
    userExternalId: v.string(),
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.userExternalId))
      .first()

    if (!user) {
      throw new Error(`User not found: ${args.userExternalId}`)
    }

    await ctx.db.patch(user._id, {
      activeFarmExternalId: args.farmExternalId,
      updatedAt: now,
    })

    return { success: true }
  },
})

/**
 * Delete a farm and all associated data.
 * Called after deleting the Clerk organization.
 */
export const deleteFarm = mutation({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    // Find the farm
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmExternalId))
      .first()

    if (!farm) {
      // Farm may not exist yet if org was just created
      return { deleted: false, reason: 'not_found' }
    }

    // Delete all paddocks
    const paddocks = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    for (const paddock of paddocks) {
      await ctx.db.delete(paddock._id)
    }

    // Delete all observations
    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    for (const obs of observations) {
      await ctx.db.delete(obs._id)
    }

    // Delete all grazing events
    const grazingEvents = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    for (const event of grazingEvents) {
      await ctx.db.delete(event._id)
    }

    // Delete all plans
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    for (const plan of plans) {
      await ctx.db.delete(plan._id)
    }

    // Delete farm settings
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .first()

    if (settings) {
      await ctx.db.delete(settings._id)
    }

    // Delete farmer observations
    const farmerObs = await ctx.db
      .query('farmerObservations')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    for (const obs of farmerObs) {
      await ctx.db.delete(obs._id)
    }

    // Finally delete the farm
    await ctx.db.delete(farm._id)

    return { deleted: true }
  },
})

/**
 * Setup a farm during onboarding.
 * Creates or updates the farm record with full details.
 */
export const setupFarmFromOnboarding = mutation({
  args: {
    orgId: v.string(),
    name: v.string(),
    location: v.string(),
    coordinates: v.array(v.number()),
    totalArea: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const [lng, lat] = args.coordinates

    // Create a simple bounding box geometry around the center point
    // This will be refined as paddocks are added
    const sizeMeters = Math.sqrt(args.totalArea * 10000)
    const latDelta = sizeMeters / 111000 / 2
    const lngDelta = sizeMeters / (111000 * Math.cos(lat * Math.PI / 180)) / 2

    const geometry = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [lng - lngDelta, lat - latDelta],
          [lng + lngDelta, lat - latDelta],
          [lng + lngDelta, lat + latDelta],
          [lng - lngDelta, lat + latDelta],
          [lng - lngDelta, lat - latDelta],
        ]],
      },
    }

    // Check if farm already exists
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.orgId))
      .first()

    // Also check legacy ID
    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', args.orgId))
        .first()
    }

    if (farm) {
      // Update existing farm with onboarding data
      await ctx.db.patch(farm._id, {
        name: args.name,
        location: args.location,
        coordinates: args.coordinates,
        totalArea: args.totalArea,
        geometry,
        updatedAt: now,
      })
      return { farmId: farm._id, created: false }
    }

    // Create new farm
    const farmId = await ctx.db.insert('farms', {
      externalId: args.orgId,
      name: args.name,
      location: args.location,
      totalArea: args.totalArea,
      paddockCount: 0,
      coordinates: args.coordinates,
      geometry,
      createdAt: now,
      updatedAt: now,
    })

    return { farmId, created: true }
  },
})

/**
 * Get farms that match either Clerk org IDs or legacy farm IDs.
 * This helps during the migration period where we support both ID formats.
 */
export const getFarmByIdOrLegacy = query({
  args: { farmId: v.string() },
  handler: async (ctx, args) => {
    // First try to find by externalId (could be Clerk org ID or legacy ID)
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmId))
      .first()

    // If not found, try legacy ID mapping
    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', args.farmId))
        .first()
    }

    return farm
  },
})
