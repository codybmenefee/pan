import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import type { ActionCtx } from './_generated/server'
import { api, internal } from './_generated/api'
import { createLogger } from './lib/logger'
import { presignR2Url } from './lib/s3Signer'
import type { Id } from './_generated/dataModel'

const log = createLogger('http')

const http = httpRouter()

// Webhook payload types for organization-based billing
interface OrgSubscriptionData {
  id: string
  organization_id: string
  customer_id: string
  plan_id: string
  status: 'active' | 'past_due' | 'canceled' | 'trialing'
  current_period_end: string
  metadata?: Record<string, string>
}

// Clerk Commerce subscription item (each plan in the subscription)
interface ClerkSubscriptionItem {
  id: string
  plan: {
    id: string
    name: string
    slug: string
    amount: number
    currency: string
    is_recurring: boolean
  }
  status: 'active' | 'ended' | 'past_due' | 'canceled' | 'incomplete' | 'upcoming' | 'trialing'
  period_start: number
  period_end: number | null
}

// Clerk Commerce payer info
interface ClerkPayer {
  id: string
  user_id: string
  organization_id?: string
  email: string
  first_name?: string
  last_name?: string
}

// Webhook payload types for user-based billing (Clerk Commerce)
interface UserSubscriptionData {
  id: string
  status: 'active' | 'past_due' | 'canceled' | 'ended' | 'incomplete'
  items: ClerkSubscriptionItem[]
  payer: ClerkPayer
  payer_id: string
  payment_source_id?: string
  latest_payment_id?: string
  created_at: number
  updated_at: number
  // Legacy fields (may not be present in new Clerk Commerce)
  userId?: string
  user_id?: string
  customerId?: string
  customer_id?: string
  planId?: string
  plan_id?: string
  currentPeriodEnd?: string
  current_period_end?: string
}

interface InvoiceData {
  id: string
  subscription_id: string
  organization_id?: string
  user_id?: string
  customer_id: string
  status: 'paid' | 'failed' | 'pending'
  amount: number
}

type WebhookPayload =
  | { type: 'subscription.created' | 'subscription.updated' | 'subscription.deleted'; data: OrgSubscriptionData | UserSubscriptionData }
  | { type: 'invoice.paid' | 'invoice.payment_failed'; data: InvoiceData }
  | { type: string; data: unknown }

// Helper to determine if subscription data is user-based or org-based
function isUserSubscription(data: OrgSubscriptionData | UserSubscriptionData): data is UserSubscriptionData {
  const userData = data as UserSubscriptionData
  // Clerk Commerce uses payer.user_id
  if (userData.payer?.user_id) return true
  // Legacy format
  return !!(userData.user_id || userData.userId)
}

// Helper to normalize user subscription data from Clerk Commerce format
function normalizeUserSubscription(data: UserSubscriptionData) {
  // Defensive: ensure items is an array
  const items = Array.isArray(data.items) ? data.items : []

  // Find the active plan item - check for multiple active-like statuses
  const activeItem = items.find(item =>
    item?.status === 'active' ||
    item?.status === 'trialing'
  )

  // Get user ID from payer (Clerk Commerce) or legacy fields
  const userId = data.payer?.user_id || data.userId || data.user_id || ''

  // Get plan slug from active item - defensive null checks
  const planSlug = activeItem?.plan?.slug || data.planId || data.plan_id || ''

  // Get period end from active item - handle both ms and seconds timestamps
  let periodEnd: string
  if (activeItem?.period_end) {
    // Clerk Commerce sends timestamps in seconds, not milliseconds
    const timestamp = activeItem.period_end > 1e12
      ? activeItem.period_end  // Already milliseconds
      : activeItem.period_end * 1000  // Convert seconds to milliseconds
    periodEnd = new Date(timestamp).toISOString()
  } else {
    periodEnd = data.currentPeriodEnd || data.current_period_end || new Date().toISOString()
  }

  // Determine status - use active item status or overall subscription status
  let status: 'active' | 'past_due' | 'canceled' = 'active'
  if (activeItem) {
    if (activeItem.status === 'past_due') status = 'past_due'
    if (activeItem.status === 'canceled' || activeItem.status === 'ended') status = 'canceled'
  } else if (data.status) {
    if (data.status === 'past_due') status = 'past_due'
    if (data.status === 'canceled' || data.status === 'ended') status = 'canceled'
  }

  return {
    id: data.id,
    userId,
    customerId: data.payer_id || data.customerId || data.customer_id || '',
    planId: planSlug,
    status,
    currentPeriodEnd: periodEnd,
    hasActivePlan: !!activeItem,
  }
}

// Map Clerk plan IDs to our tier names
const PLAN_TO_TIER: Record<string, 'free' | 'starter' | 'professional' | 'enterprise'> = {
  'plan_free': 'free',
  'plan_starter': 'starter',
  'plan_professional': 'professional',
  'plan_enterprise': 'enterprise',
}

function hasAgentDashboardEntitlement(planId: string | undefined): boolean {
  if (!planId) return false
  const normalized = planId.toLowerCase()
  return (
    normalized.includes('producer') ||
    normalized.includes('commercial') ||
    normalized.includes('professional') ||
    normalized.includes('enterprise') ||
    normalized.includes('agent_dashboard') ||
    normalized.includes('agent_monitor')
  )
}

/**
 * Clerk Billing Webhook Handler
 *
 * Handles subscription lifecycle events from Clerk Billing:
 * - subscription.created
 * - subscription.updated
 * - subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 */
http.route({
  path: '/webhooks/clerk-billing',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // Verify webhook signature
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing webhook headers', { status: 400 })
    }

    // In production, verify the signature using Clerk's webhook secret

    let payload: WebhookPayload
    try {
      payload = await request.json()
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    log(`Received Clerk billing webhook: ${payload.type}`)
    log(`Payload: ${JSON.stringify(payload, null, 2)}`)

    try {
      switch (payload.type) {
        case 'subscription.created':
        case 'subscription.updated': {
          const data = payload.data as OrgSubscriptionData | UserSubscriptionData
          if (isUserSubscription(data)) {
            await handleUserSubscriptionUpdate(ctx, data)
          } else {
            await handleSubscriptionUpdate(ctx, data)
          }
          break
        }

        case 'subscription.deleted': {
          const data = payload.data as OrgSubscriptionData | UserSubscriptionData
          if (isUserSubscription(data)) {
            await handleUserSubscriptionDeleted(ctx, data)
          } else {
            await handleSubscriptionDeleted(ctx, data)
          }
          break
        }

        case 'invoice.paid': {
          const data = payload.data as InvoiceData
          handleInvoicePaid(data)
          break
        }

        case 'invoice.payment_failed': {
          const data = payload.data as InvoiceData
          await handlePaymentFailed(ctx, data)
          break
        }

        default:
          log(`Unhandled webhook type: ${payload.type}`)
      }

      return new Response('OK', { status: 200 })
    } catch (error) {
      log.error('Webhook handler error', { error: String(error) })
      return new Response('Internal error', { status: 500 })
    }
  }),
})

type WebhookContext = Pick<ActionCtx, 'runMutation'>

/**
 * Handle user-based subscription updates (Early Access paywall)
 */
async function handleUserSubscriptionUpdate(
  ctx: WebhookContext,
  data: UserSubscriptionData
) {
  let normalized
  try {
    normalized = normalizeUserSubscription(data)
  } catch (error) {
    log.error('Failed to normalize subscription data', {
      error: String(error),
      rawData: JSON.stringify(data),
    })
    throw new Error(`Subscription normalization failed: ${error}`)
  }

  log(`Processing user subscription: userId=${normalized.userId}, planId=${normalized.planId}, status=${normalized.status}, hasActivePlan=${normalized.hasActivePlan}`)

  if (!normalized.userId) {
    log.error('User subscription missing userId', { data: JSON.stringify(data) })
    throw new Error('User subscription missing userId')
  }

  // Only sync if there's an active plan (early_access)
  // This handles the case where user has multiple items (free ended, early_access active)
  if (normalized.hasActivePlan) {
    await ctx.runMutation(api.users.syncUserSubscription, {
      userExternalId: normalized.userId,
      subscriptionId: normalized.id,
      planId: normalized.planId,
      status: normalized.status,
      currentPeriodEnd: normalized.currentPeriodEnd,
      agentDashboardEnabled: hasAgentDashboardEntitlement(normalized.planId),
    })

    log(`User subscription synced for ${normalized.userId}: ${normalized.planId} (${normalized.status})`)
  } else {
    // No active plan - cancel subscription
    log(`No active plan found for ${normalized.userId}, marking as canceled`)
    await ctx.runMutation(api.users.cancelUserSubscription, {
      userExternalId: normalized.userId,
    })
  }
}

/**
 * Handle user-based subscription deletion (Early Access paywall)
 */
async function handleUserSubscriptionDeleted(
  ctx: WebhookContext,
  data: UserSubscriptionData
) {
  const normalized = normalizeUserSubscription(data)

  if (!normalized.userId) {
    log.error('User subscription delete missing userId', { data: JSON.stringify(data) })
    throw new Error('User subscription delete missing userId')
  }

  await ctx.runMutation(api.users.cancelUserSubscription, {
    userExternalId: normalized.userId,
  })

  log(`User subscription canceled for ${normalized.userId}`)
}

async function handleSubscriptionUpdate(
  ctx: WebhookContext,
  data: OrgSubscriptionData
) {
  // Find the farm by Clerk org ID
  const farm = await ctx.runMutation(internal.internal.getFarmByClerkOrgId, {
    clerkOrgId: data.organization_id,
  })

  if (!farm) {
    log.error(`Farm not found for org: ${data.organization_id}`)
    return
  }

  // Map plan ID to tier
  const tier = PLAN_TO_TIER[data.plan_id] ?? 'free'

  // Map status
  const status = data.status === 'trialing' ? 'active' : data.status

  // Sync to Convex
  await ctx.runMutation(api.subscriptions.syncFromClerk, {
    farmId: farm._id,
    clerkSubscriptionId: data.id,
    stripeCustomerId: data.customer_id,
    tier,
    status: status as 'active' | 'past_due' | 'canceled',
    currentPeriodEnd: data.current_period_end,
  })

  log(`Subscription synced for farm ${farm._id}: ${tier} (${status})`)
}

async function handleSubscriptionDeleted(
  ctx: WebhookContext,
  data: OrgSubscriptionData
) {
  const farm = await ctx.runMutation(internal.internal.getFarmByClerkOrgId, {
    clerkOrgId: data.organization_id,
  })

  if (!farm) {
    log.error(`Farm not found for org: ${data.organization_id}`)
    return
  }

  await ctx.runMutation(api.subscriptions.cancelSubscription, {
    farmId: farm._id,
  })

  log(`Subscription canceled for farm ${farm._id}`)
}

function handleInvoicePaid(data: InvoiceData) {
  // Invoice paid - subscription should already be updated
  log(`Invoice paid: ${data.id} for org ${data.organization_id}`)
}

async function handlePaymentFailed(
  ctx: WebhookContext,
  data: InvoiceData
) {
  // Handle org-based payment failure
  if (data.organization_id) {
    const farm = await ctx.runMutation(internal.internal.getFarmByClerkOrgId, {
      clerkOrgId: data.organization_id,
    })

    if (farm) {
      // The subscription.updated webhook should handle this,
      // but we log it for monitoring
      log(`Payment failed for farm ${farm._id}`)
    }
  }
  // Handle user-based payment failure
  else if (data.user_id) {
    log(`Payment failed for user ${data.user_id}`)
    // The subscription.updated webhook should handle marking as past_due
  }
}

/**
 * Health check endpoint
 */
http.route({
  path: '/health',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

/**
 * Satellite Tile Server
 *
 * Serves satellite tiles by database ID, generating fresh presigned R2 URLs
 * on demand. This eliminates expiration issues with stored presigned URLs.
 *
 * Usage: GET /tiles/serve?id=<satelliteImageTile document _id>
 */
http.route({
  path: '/tiles/serve',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url)
    const tileId = url.searchParams.get('id')

    if (!tileId) {
      return new Response('Missing id parameter', {
        status: 400,
        headers: corsHeaders(),
      })
    }

    try {
      // Look up tile by ID
      let tile
      try {
        tile = await ctx.runQuery(internal.satelliteTiles.getTileById, {
          id: tileId as Id<'satelliteImageTiles'>,
        })
      } catch {
        return new Response('Invalid tile ID', {
          status: 400,
          headers: corsHeaders(),
        })
      }

      if (!tile) {
        return new Response('Tile not found', {
          status: 404,
          headers: corsHeaders(),
        })
      }

      // Read R2 credentials from env
      const accountId = process.env.R2_ACCOUNT_ID
      const accessKeyId = process.env.R2_ACCESS_KEY
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
      const bucket = process.env.R2_BUCKET_NAME

      if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
        log.error('Missing R2 credentials in environment variables')
        return new Response('Server configuration error', {
          status: 500,
          headers: corsHeaders(),
        })
      }

      // Generate fresh presigned URL
      const presignedUrl = await presignR2Url({
        accountId,
        accessKeyId,
        secretAccessKey,
        bucket,
        key: tile.r2Key,
      })

      // Fetch the image from R2
      const r2Response = await fetch(presignedUrl)

      if (!r2Response.ok) {
        log.error('R2 fetch failed', {
          status: r2Response.status,
          key: tile.r2Key,
        })
        return new Response('Failed to fetch tile from storage', {
          status: 502,
          headers: corsHeaders(),
        })
      }

      const imageData = await r2Response.arrayBuffer()
      const contentType = r2Response.headers.get('content-type') || 'image/png'

      return new Response(imageData, {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      })
    } catch (error) {
      log.error('Tile serve error', { error: String(error), tileId })
      return new Response('Internal error', {
        status: 500,
        headers: corsHeaders(),
      })
    }
  }),
})

// Handle CORS preflight for tile serve
http.route({
  path: '/tiles/serve',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }),
})

/**
 * Satellite Tile Proxy (Legacy)
 *
 * Proxies satellite tile images from R2 with proper CORS headers.
 * This is needed because R2 presigned URLs don't include CORS headers.
 *
 * Usage: GET /tiles/proxy?url=<r2_presigned_url>
 */
http.route({
  path: '/tiles/proxy',
  method: 'GET',
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url)
    const tileUrl = url.searchParams.get('url')

    if (!tileUrl) {
      return new Response('Missing url parameter', {
        status: 400,
        headers: corsHeaders(),
      })
    }

    try {
      // Fetch the image from R2
      const response = await fetch(tileUrl)

      if (!response.ok) {
        return new Response(`Failed to fetch tile: ${response.status}`, {
          status: response.status,
          headers: corsHeaders(),
        })
      }

      // Get the image data
      const imageData = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/png'

      // Return with CORS headers
      return new Response(imageData, {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        },
      })
    } catch (error) {
      log.error('Tile proxy error', { error: String(error) })
      return new Response('Failed to fetch tile', {
        status: 500,
        headers: corsHeaders(),
      })
    }
  }),
})

// Handle CORS preflight for tile proxy
http.route({
  path: '/tiles/proxy',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }),
})

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

/**
 * Satellite Pipeline Completion Webhook
 *
 * Called by the Python pipeline when satellite processing completes.
 * Creates notifications for Sentinel-2 (free tier) only.
 * Planet Labs jobs complete silently to avoid notification spam.
 */
interface SatelliteCompletePayload {
  farmExternalId: string
  success: boolean
  provider: 'sentinel2' | 'planet'
  captureDate?: string
  errorMessage?: string
  failureReason?: string  // e.g., 'boundary_overlap'
}

http.route({
  path: '/webhooks/satellite-complete',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    let payload: SatelliteCompletePayload
    try {
      payload = await request.json()
    } catch {
      return new Response('Invalid JSON', {
        status: 400,
        headers: corsHeaders(),
      })
    }

    // Validate required fields
    if (!payload.farmExternalId || typeof payload.success !== 'boolean' || !payload.provider) {
      return new Response('Missing required fields: farmExternalId, success, provider', {
        status: 400,
        headers: corsHeaders(),
      })
    }

    // Validate provider
    if (payload.provider !== 'sentinel2' && payload.provider !== 'planet') {
      return new Response('Invalid provider. Must be "sentinel2" or "planet"', {
        status: 400,
        headers: corsHeaders(),
      })
    }

    log(`Received satellite-complete webhook for farm ${payload.farmExternalId}`)
    log(`  Provider: ${payload.provider}, Success: ${payload.success}`)

    try {
      // Complete the job and create notification (for Sentinel-2 only)
      await ctx.runMutation(api.satelliteFetchJobs.completeJobByFarm, {
        farmExternalId: payload.farmExternalId,
        provider: payload.provider,
        success: payload.success,
        captureDate: payload.captureDate,
        errorMessage: payload.errorMessage,
        failureReason: payload.failureReason,
      })

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      log.error('Satellite webhook error', { error: String(error) })
      return new Response('Internal error', {
        status: 500,
        headers: corsHeaders(),
      })
    }
  }),
})

// Handle CORS preflight for satellite webhook
http.route({
  path: '/webhooks/satellite-complete',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }),
})

/**
 * Manual Pipeline Trigger Webhook
 *
 * Allows manual triggering of satellite fetch jobs for testing.
 * Creates a job that will be picked up by the next scheduler run.
 */
interface TriggerPipelinePayload {
  farmExternalId: string
  provider?: 'sentinel2' | 'planet'
  triggeredBy?: 'boundary_update' | 'scheduled' | 'manual'
}

http.route({
  path: '/webhooks/trigger-pipeline',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    let payload: TriggerPipelinePayload
    try {
      payload = await request.json()
    } catch {
      return new Response('Invalid JSON', {
        status: 400,
        headers: corsHeaders(),
      })
    }

    // Validate required fields
    if (!payload.farmExternalId) {
      return new Response('Missing required field: farmExternalId', {
        status: 400,
        headers: corsHeaders(),
      })
    }

    const provider = payload.provider ?? 'sentinel2'
    const triggeredBy = payload.triggeredBy ?? 'manual'

    log(`Received trigger-pipeline webhook for farm ${payload.farmExternalId}`)
    log(`  Provider: ${provider}, TriggeredBy: ${triggeredBy}`)

    try {
      let jobId: string

      // Create job based on trigger type
      switch (triggeredBy) {
        case 'boundary_update':
          jobId = await ctx.runMutation(api.satelliteFetchJobs.createForBoundaryUpdate, {
            farmExternalId: payload.farmExternalId,
            provider,
          })
          break
        case 'scheduled':
          jobId = await ctx.runMutation(api.satelliteFetchJobs.createForScheduledCheck, {
            farmExternalId: payload.farmExternalId,
            provider,
          })
          break
        case 'manual':
        default:
          jobId = await ctx.runMutation(api.satelliteFetchJobs.createForManualRefresh, {
            farmExternalId: payload.farmExternalId,
            provider,
          })
          break
      }

      return new Response(JSON.stringify({
        status: 'ok',
        jobId,
        message: `Created ${triggeredBy} job for farm ${payload.farmExternalId}`,
      }), {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      log.error('Trigger pipeline webhook error', { error: String(error) })
      return new Response('Internal error', {
        status: 500,
        headers: corsHeaders(),
      })
    }
  }),
})

// Handle CORS preflight for trigger-pipeline webhook
http.route({
  path: '/webhooks/trigger-pipeline',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }),
})

export default http
