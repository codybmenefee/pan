/**
 * Convex functions for the agent gateway.
 *
 * Provides queries and mutations for the agent gateway to:
 * - Fetch context data for agent prompts
 * - Execute agent actions (create plans, update settings)
 * - Support agent tool implementations
 */

import { query, mutation, action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'
import type { ActionCtx } from './_generated/server'

/**
 * Get complete farm context for agent prompts.
 */
export const getFarmContext = query({
  args: {
    farmId: v.id('farms'),
  },
  handler: async (ctx, args) => {
    const farm = await ctx.db.get(args.farmId)
    if (!farm) {
      throw new Error(`Farm not found: ${args.farmId}`)
    }

    const [settings, paddocks, observations, farmerObservations, plans] =
      await Promise.all([
        ctx.db
          .query('farmSettings')
          .withIndex('by_farm', (q) => q.eq('farmExternalId', farm.externalId))
          .first(),
        ctx.db
          .query('paddocks')
          .withIndex('by_farm', (q) => q.eq('farmId', args.farmId))
          .collect(),
        ctx.db
          .query('observations')
          .withIndex('by_farm', (q) => q.eq('farmExternalId', farm.externalId))
          .collect(),
        ctx.db
          .query('farmerObservations')
          .withIndex('by_farm', (q) => q.eq('farmId', args.farmId))
          .order('desc')
          .take(5),
        ctx.db
          .query('plans')
          .withIndex('by_farm', (q) => q.eq('farmExternalId', farm.externalId))
          .order('desc')
          .take(5),
      ])

    return {
      farm,
      settings,
      paddocks,
      observations,
      farmerObservations,
      plans,
    }
  },
})

/**
 * Get recent plans for a farm.
 */
export const getRecentPlans = query({
  args: {
    farmExternalId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .order('desc')
      .take(limit)
    return plans
  },
})

/**
 * HTTP action for agent gateway.
 * This can be called from external systems or via HTTP.
 */
export const agentGateway = action({
  args: {
    trigger: v.union(
      v.literal('morning_brief'),
      v.literal('observation_refresh'),
      v.literal('plan_execution')
    ),
    farmId: v.id('farms'),
    farmExternalId: v.string(),
    userId: v.string(),
    additionalContext: v.optional(v.any()),
  },
  handler: async (ctx: ActionCtx, args): Promise<{
    success: boolean
    trigger: 'morning_brief' | 'observation_refresh' | 'plan_execution'
    context: {
      farm: any
      settings: any
      paddocks: any[]
      observations: any[]
      farmerObservations: any[]
      plans: any[]
    }
    message: string
  }> => {
    // Fetch farm context
    const context = await ctx.runQuery(api.grazingAgentGateway.getFarmContext, {
      farmId: args.farmId,
    })

    // For now, return the context
    // In a full implementation, this would:
    // 1. Assemble prompt using triggers
    // 2. Call Anthropic API with tools
    // 3. Log to Braintrust
    // 4. Execute tool calls
    // 5. Return agent response

    return {
      success: true,
      trigger: args.trigger,
      context,
      message: 'Agent gateway endpoint ready (full implementation pending)',
    }
  },
})
