import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * One-time migration to delete a bad farmSettings record.
 * Run with: npx convex run migrations/deleteBadFarmSettings:deleteRecord
 */
export const deleteRecord = mutation({
  args: {
    id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const targetId = args.id ?? 'jd74sat4yn4renddpj72gscmrn804qdy'

    // Delete the record directly by ID
    await ctx.db.delete(targetId as any)

    return { deleted: targetId }
  },
})
