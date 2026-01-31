import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const bugCategory = v.union(
  v.literal('ui_visual'),
  v.literal('functionality'),
  v.literal('performance'),
  v.literal('data'),
  v.literal('map'),
  v.literal('satellite'),
  v.literal('ai_recommendations'),
  v.literal('other')
)

const bugSeverity = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
  v.literal('critical')
)

const bugContext = v.object({
  url: v.string(),
  userAgent: v.string(),
  screenSize: v.optional(v.string()),
  timestamp: v.string(),
})

/**
 * Insert a bug report into the database
 */
export const insertBugReport = mutation({
  args: {
    userExternalId: v.optional(v.string()),
    farmExternalId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    category: bugCategory,
    severity: bugSeverity,
    stepsToReproduce: v.optional(v.string()),
    context: bugContext,
    githubIssueUrl: v.optional(v.string()),
    githubIssueNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    return await ctx.db.insert('bugReports', {
      userExternalId: args.userExternalId,
      farmExternalId: args.farmExternalId,
      title: args.title,
      description: args.description,
      category: args.category,
      severity: args.severity,
      stepsToReproduce: args.stepsToReproduce,
      context: args.context,
      githubIssueUrl: args.githubIssueUrl,
      githubIssueNumber: args.githubIssueNumber,
      createdAt: now,
      updatedAt: now,
    })
  },
})

/**
 * List bug reports for a user
 */
export const listByUser = query({
  args: {
    userExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query('bugReports')
      .withIndex('by_user', (q) => q.eq('userExternalId', args.userExternalId))
      .order('desc')
      .collect()
    return reports
  },
})
