import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Migration script to link existing farms to Clerk organizations.
 *
 * Migration Steps:
 * 1. Create Clerk organizations for existing farms via Clerk API (external)
 * 2. Run linkFarmToClerkOrg for each farm with the new Clerk org ID
 * 3. Add users to appropriate organizations in Clerk (external)
 * 4. Run migrateUsersToOrg for each user to update references
 *
 * After migration:
 * - Farm.externalId contains Clerk org ID (org_xxx)
 * - Farm.legacyExternalId contains old farm-1 style ID
 * - Users access farms through Clerk organization membership
 */

/**
 * Link an existing farm to a Clerk organization.
 * Call this after creating the corresponding org in Clerk.
 */
export const linkFarmToClerkOrg = internalMutation({
  args: {
    legacyFarmId: v.string(),  // e.g., "farm-1"
    clerkOrgId: v.string(),     // e.g., "org_2abc123..."
    clerkOrgSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Find the farm by its current externalId
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.legacyFarmId))
      .first()

    if (!farm) {
      return { success: false, error: `Farm not found: ${args.legacyFarmId}` }
    }

    // Update the farm with new Clerk org ID
    await ctx.db.patch(farm._id, {
      externalId: args.clerkOrgId,
      legacyExternalId: args.legacyFarmId,
      clerkOrgSlug: args.clerkOrgSlug,
      updatedAt: now,
    })

    // Update related records that reference this farm
    await updateFarmReferences(ctx, args.legacyFarmId, args.clerkOrgId)

    return { success: true, farmId: farm._id }
  },
})

/**
 * Helper to update all references from legacy farm ID to new Clerk org ID.
 */
async function updateFarmReferences(
  ctx: any,
  legacyFarmId: string,
  clerkOrgId: string
) {
  const now = new Date().toISOString()

  // Update farmSettings
  const settings = await ctx.db
    .query('farmSettings')
    .withIndex('by_farm', (q: any) => q.eq('farmExternalId', legacyFarmId))
    .first()

  if (settings) {
    await ctx.db.patch(settings._id, {
      farmExternalId: clerkOrgId,
      updatedAt: now,
    })
  }

  // Update observations
  const observations = await ctx.db
    .query('observations')
    .withIndex('by_farm', (q: any) => q.eq('farmExternalId', legacyFarmId))
    .collect()

  for (const obs of observations) {
    await ctx.db.patch(obs._id, {
      farmExternalId: clerkOrgId,
    })
  }

  // Update grazingEvents
  const events = await ctx.db
    .query('grazingEvents')
    .withIndex('by_farm', (q: any) => q.eq('farmExternalId', legacyFarmId))
    .collect()

  for (const event of events) {
    await ctx.db.patch(event._id, {
      farmExternalId: clerkOrgId,
    })
  }

  // Update plans
  const plans = await ctx.db
    .query('plans')
    .withIndex('by_farm', (q: any) => q.eq('farmExternalId', legacyFarmId))
    .collect()

  for (const plan of plans) {
    await ctx.db.patch(plan._id, {
      farmExternalId: clerkOrgId,
      updatedAt: now,
    })
  }
}

/**
 * Migrate a user to use Clerk organization for farm access.
 * Call this after adding the user to the appropriate Clerk organization.
 */
export const migrateUserToOrg = internalMutation({
  args: {
    userExternalId: v.string(),  // Clerk user ID
    clerkOrgId: v.string(),       // Clerk org ID they now belong to
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.userExternalId))
      .first()

    if (!user) {
      return { success: false, error: `User not found: ${args.userExternalId}` }
    }

    // Update user to use new org ID
    await ctx.db.patch(user._id, {
      activeFarmExternalId: args.clerkOrgId,
      // Keep farmExternalId for backward compatibility during transition
      updatedAt: now,
    })

    return { success: true, userId: user._id }
  },
})

/**
 * Rollback a farm migration if needed.
 * Restores the legacy external ID as the primary ID.
 */
export const rollbackFarmMigration = internalMutation({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Find farm by Clerk org ID
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.clerkOrgId))
      .first()

    if (!farm || !farm.legacyExternalId) {
      return { success: false, error: 'Farm not found or no legacy ID to restore' }
    }

    const legacyId = farm.legacyExternalId

    // Restore legacy ID as primary
    await ctx.db.patch(farm._id, {
      externalId: legacyId,
      legacyExternalId: undefined,
      clerkOrgSlug: undefined,
      updatedAt: now,
    })

    // Rollback related records
    await updateFarmReferences(ctx, args.clerkOrgId, legacyId)

    return { success: true, restoredId: legacyId }
  },
})

/**
 * Get migration status for all farms.
 * Useful for tracking migration progress.
 */
export const getMigrationStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const farms = await ctx.db.query('farms').collect()

    return farms.map((farm: any) => ({
      id: farm._id,
      currentExternalId: farm.externalId,
      legacyExternalId: farm.legacyExternalId,
      clerkOrgSlug: farm.clerkOrgSlug,
      isMigrated: farm.externalId?.startsWith('org_') || false,
      name: farm.name,
    }))
  },
})
