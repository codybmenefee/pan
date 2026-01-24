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

    // Create a new farm with default values
    // In a real implementation, you'd want to collect more info from the user
    const farmId = await ctx.db.insert('farms', {
      externalId: args.clerkOrgId,
      clerkOrgSlug: args.slug,
      name: args.name,
      location: 'Not specified',
      totalArea: 0,
      paddockCount: 0,
      coordinates: [0, 0], // Default coordinates
      geometry: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
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
