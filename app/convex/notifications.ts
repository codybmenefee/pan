import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'

/**
 * Get notifications for a farm with pagination.
 */
export const getForFarm = query({
  args: {
    farmExternalId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    // Sort by createdAt descending (newest first)
    notifications.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return notifications.slice(0, limit)
  },
})

/**
 * Get count of unread notifications for a farm.
 */
export const getUnreadCount = query({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q) => q.eq(q.field('isRead'), false))
      .collect()

    return notifications.length
  },
})

/**
 * Mark a single notification as read.
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
    })
  },
})

/**
 * Mark all notifications as read for a farm.
 */
export const markAllAsRead = mutation({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q) => q.eq(q.field('isRead'), false))
      .collect()

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      })
    }

    return { updated: notifications.length }
  },
})

/**
 * Create a new notification.
 */
export const create = mutation({
  args: {
    farmExternalId: v.string(),
    type: v.union(
      v.literal('satellite_ready'),
      v.literal('satellite_failed'),
      v.literal('system')
    ),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.object({
      provider: v.optional(v.string()),
      captureDate: v.optional(v.string()),
      // Actionable notification fields
      actionUrl: v.optional(v.string()),
      actionLabel: v.optional(v.string()),
      failureReason: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('notifications', {
      farmExternalId: args.farmExternalId,
      type: args.type,
      title: args.title,
      message: args.message,
      metadata: args.metadata,
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    return id
  },
})
