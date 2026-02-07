import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

// Priority levels for job queue processing
const PRIORITY = {
  BOUNDARY_UPDATE: 1,  // Highest priority - user changed boundary
  MANUAL: 2,           // User manually triggered
  SCHEDULED: 3,        // Daily scheduled check found new imagery
} as const

/**
 * Get the active (pending or processing) satellite fetch job for a farm.
 * Used to display the processing banner.
 */
export const getActiveJob = query({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for pending jobs
    const pendingJobs = await ctx.db
      .query('satelliteFetchJobs')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect()

    if (pendingJobs.length > 0) {
      return pendingJobs[0]
    }

    // Check for processing jobs
    const processingJobs = await ctx.db
      .query('satelliteFetchJobs')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q) => q.eq(q.field('status'), 'processing'))
      .collect()

    if (processingJobs.length > 0) {
      return processingJobs[0]
    }

    return null
  },
})

/**
 * Create a satellite fetch job triggered by boundary update.
 */
export const createForBoundaryUpdate = mutation({
  args: {
    farmExternalId: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('satelliteFetchJobs', {
      farmExternalId: args.farmExternalId,
      status: 'pending',
      provider: args.provider ?? 'sentinel2',
      triggeredBy: 'boundary_update',
      priority: PRIORITY.BOUNDARY_UPDATE,
      startedAt: new Date().toISOString(),
    })

    return id
  },
})

/**
 * Create a satellite fetch job when onboarding completes.
 * Prevents duplicates by checking for existing pending/processing jobs.
 */
export const createForOnboardingComplete = mutation({
  args: {
    farmExternalId: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for existing pending jobs
    const pendingJobs = await ctx.db
      .query('satelliteFetchJobs')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect()

    // Check for existing processing jobs
    const processingJobs = await ctx.db
      .query('satelliteFetchJobs')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q) => q.eq(q.field('status'), 'processing'))
      .collect()

    // Return existing job if one already exists
    if (pendingJobs.length > 0 || processingJobs.length > 0) {
      return (pendingJobs[0] ?? processingJobs[0])._id
    }

    // Create new job with highest priority
    return await ctx.db.insert('satelliteFetchJobs', {
      farmExternalId: args.farmExternalId,
      status: 'pending',
      provider: args.provider ?? 'sentinel2',
      triggeredBy: 'boundary_update',
      priority: PRIORITY.BOUNDARY_UPDATE,
      startedAt: new Date().toISOString(),
    })
  },
})

/**
 * Create a satellite fetch job for manual refresh.
 */
export const createForManualRefresh = mutation({
  args: {
    farmExternalId: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('satelliteFetchJobs', {
      farmExternalId: args.farmExternalId,
      status: 'pending',
      provider: args.provider ?? 'sentinel2',
      triggeredBy: 'manual',
      priority: PRIORITY.MANUAL,
      startedAt: new Date().toISOString(),
    })

    return id
  },
})

/**
 * Mark a job as processing.
 */
export const markAsProcessing = mutation({
  args: {
    jobId: v.id('satelliteFetchJobs'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: 'processing',
    })
  },
})

/**
 * Complete a job (success or failure) and create notification for Sentinel-2.
 */
export const completeJob = mutation({
  args: {
    jobId: v.id('satelliteFetchJobs'),
    success: v.boolean(),
    captureDate: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) {
      throw new Error('Job not found')
    }

    // Prevent duplicate notifications - job already completed
    if (job.status === 'completed' || job.status === 'failed') {
      return
    }

    // Update job status
    await ctx.db.patch(args.jobId, {
      status: args.success ? 'completed' : 'failed',
      completedAt: new Date().toISOString(),
      errorMessage: args.errorMessage,
    })

    // Only create notification for Sentinel-2 (free tier)
    // Planet Labs completions are silent to avoid notification spam
    if (job.provider === 'sentinel2') {
      if (args.success) {
        await ctx.runMutation(api.notifications.create, {
          farmExternalId: job.farmExternalId,
          type: 'satellite_ready',
          title: 'Satellite imagery ready',
          message: args.captureDate
            ? `New Sentinel-2 imagery from ${args.captureDate} is now available.`
            : 'New Sentinel-2 imagery is now available.',
          metadata: {
            provider: 'sentinel2',
            captureDate: args.captureDate,
          },
        })
      } else {
        // Build metadata with actionable fields for boundary overlap failures
        const metadata: {
          provider: string
          failureReason?: string
          actionUrl?: string
          actionLabel?: string
        } = {
          provider: 'sentinel2',
        }

        if (args.failureReason === 'boundary_overlap') {
          metadata.failureReason = args.failureReason
          metadata.actionUrl = '/?editBoundary=true'
          metadata.actionLabel = 'Edit Boundary'
        }

        await ctx.runMutation(api.notifications.create, {
          farmExternalId: job.farmExternalId,
          type: 'satellite_failed',
          title: 'Satellite imagery unavailable',
          message: args.failureReason === 'boundary_overlap'
            ? 'Pastures don\'t overlap with farm boundary. Please update your farm boundary to receive satellite data.'
            : args.errorMessage ?? 'Failed to fetch satellite imagery. We\'ll retry later.',
          metadata,
        })
      }
    }
  },
})

/**
 * Complete a job by farm external ID (for webhook use).
 * Finds the most recent pending/processing job and completes it.
 */
export const completeJobByFarm = mutation({
  args: {
    farmExternalId: v.string(),
    provider: v.string(),
    success: v.boolean(),
    captureDate: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find active job for this farm
    const pendingJobs = await ctx.db
      .query('satelliteFetchJobs')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect()

    const processingJobs = await ctx.db
      .query('satelliteFetchJobs')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q) => q.eq(q.field('status'), 'processing'))
      .collect()

    const activeJobs = [...pendingJobs, ...processingJobs]

    if (activeJobs.length === 0) {
      // No active job - this might be a scheduled pipeline run
      // Just create the notification directly for Sentinel-2
      if (args.provider === 'sentinel2') {
        if (args.success) {
          await ctx.runMutation(api.notifications.create, {
            farmExternalId: args.farmExternalId,
            type: 'satellite_ready',
            title: 'Satellite imagery ready',
            message: args.captureDate
              ? `New Sentinel-2 imagery from ${args.captureDate} is now available.`
              : 'New Sentinel-2 imagery is now available.',
            metadata: {
              provider: 'sentinel2',
              captureDate: args.captureDate,
            },
          })
        } else {
          // Build metadata with actionable fields for boundary overlap failures
          const metadata: {
            provider: string
            failureReason?: string
            actionUrl?: string
            actionLabel?: string
          } = {
            provider: 'sentinel2',
          }

          if (args.failureReason === 'boundary_overlap') {
            metadata.failureReason = args.failureReason
            metadata.actionUrl = '/?editBoundary=true'
            metadata.actionLabel = 'Edit Boundary'
          }

          await ctx.runMutation(api.notifications.create, {
            farmExternalId: args.farmExternalId,
            type: 'satellite_failed',
            title: 'Satellite imagery unavailable',
            message: args.failureReason === 'boundary_overlap'
              ? 'Pastures don\'t overlap with farm boundary. Please update your farm boundary to receive satellite data.'
              : args.errorMessage ?? 'Failed to fetch satellite imagery. We\'ll retry later.',
            metadata,
          })
        }
      }
      return
    }

    // Complete the most recent active job
    const job = activeJobs.sort((a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )[0]

    await ctx.runMutation(api.satelliteFetchJobs.completeJob, {
      jobId: job._id,
      success: args.success,
      captureDate: args.captureDate,
      errorMessage: args.errorMessage,
      failureReason: args.failureReason,
    })
  },
})

/**
 * Get pending jobs for pipeline to poll.
 * Returns jobs ordered by priority (1=highest) then by creation time (oldest first).
 */
export const getPendingJobs = query({
  args: {
    limit: v.optional(v.number()),
    triggeredBy: v.optional(v.union(
      v.literal('boundary_update'),
      v.literal('scheduled'),
      v.literal('manual')
    )),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10

    // Get all pending jobs
    let jobs = await ctx.db
      .query('satelliteFetchJobs')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect()

    // Filter by triggeredBy if specified
    if (args.triggeredBy) {
      jobs = jobs.filter((j) => j.triggeredBy === args.triggeredBy)
    }

    // Sort by priority (ascending) then by startedAt (ascending - oldest first)
    jobs.sort((a, b) => {
      const priorityA = a.priority ?? 999
      const priorityB = b.priority ?? 999
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    })

    // Return limited results
    return jobs.slice(0, limit)
  },
})

/**
 * Atomically claim a job for processing.
 * Returns the job if successfully claimed, null if already claimed by another worker.
 */
export const claimJob = mutation({
  args: {
    jobId: v.id('satelliteFetchJobs'),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)

    if (!job) {
      return null
    }

    // Only claim if still pending (prevents race conditions)
    if (job.status !== 'pending') {
      return null
    }

    // Mark as processing
    await ctx.db.patch(args.jobId, {
      status: 'processing',
    })

    // Return the claimed job
    return await ctx.db.get(args.jobId)
  },
})

/**
 * Create a satellite fetch job when daily check finds new imagery.
 */
export const createForScheduledCheck = mutation({
  args: {
    farmExternalId: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if there's already a pending job for this farm
    const existingJobs = await ctx.db
      .query('satelliteFetchJobs')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect()

    if (existingJobs.length > 0) {
      // Already has a pending job, don't create duplicate
      return existingJobs[0]._id
    }

    const id = await ctx.db.insert('satelliteFetchJobs', {
      farmExternalId: args.farmExternalId,
      status: 'pending',
      provider: args.provider ?? 'sentinel2',
      triggeredBy: 'scheduled',
      priority: PRIORITY.SCHEDULED,
      startedAt: new Date().toISOString(),
    })

    return id
  },
})

/**
 * Get a job by ID (for pipeline polling).
 */
export const getJob = query({
  args: {
    jobId: v.id('satelliteFetchJobs'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId)
  },
})

