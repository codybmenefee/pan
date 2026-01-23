/**
 * Agent Gateway - Primary Entry Point for Agent Invocations
 *
 * This is the ONLY public entry point for agent operations.
 * All agent calls should route through this gateway.
 *
 * The gateway:
 * - Fetches farm context and assembles data
 * - Routes to appropriate agent implementation (currently uses runGrazingAgent internally)
 * - Handles trigger-specific logic (morning_brief, observation_refresh, plan_execution)
 * - Provides unified error handling and response format
 * - TODO: Add Braintrust logging for observability
 *
 * Usage:
 *   await ctx.runAction(api.grazingAgentGateway.agentGateway, {
 *     trigger: 'morning_brief',
 *     farmId: farm._id,
 *     farmExternalId: 'farm-1',
 *     userId: 'user-123',
 *   })
 *
 * NOTE: runGrazingAgent in grazingAgentDirect.ts is legacy/internal implementation.
 * It should only be called by this gateway, not directly.
 */

import { query, mutation, action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'
import type { ActionCtx } from './_generated/server'
// Internal: Legacy agent implementation - only used by this gateway
import { runGrazingAgent } from './grazingAgentDirect'

/**
 * Type definition for morning_brief trigger additional context
 * This allows passing event-specific data to avoid duplicate queries
 */
type MorningBriefContext = {
  planGenerationData: {
    existingPlanId: any | null
    observations: any[] | null
    grazingEvents: any[] | null
    settings: any | null
    farm: any | null
    mostRecentGrazingEvent: any | null
    paddocks: any[] | null
  }
  farmName: string
}

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
 * PRIMARY ENTRY POINT: Agent Gateway Action
 * 
 * This is the public API for all agent operations.
 * All external code should call this, not runGrazingAgent directly.
 * 
 * For plan generation (morning_brief trigger), this gateway:
 * 1. Fetches farm context via getFarmContext query
 * 2. Gets plan generation data to determine active paddock
 * 3. Delegates to runGrazingAgent (internal/legacy implementation)
 * 4. Returns standardized result format
 * 
 * TODO: Add Braintrust logging for observability
 * TODO: Use trigger-specific prompts from lib/agent/triggers.ts
 * TODO: Migrate runGrazingAgent logic fully into gateway for better control
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
    additionalContext: v.optional(v.object({
      planGenerationData: v.any(), // PlanGenerationData type
      farmName: v.string(),
    })),
  },
  handler: async (ctx: ActionCtx, args): Promise<{
    success: boolean
    trigger: 'morning_brief' | 'observation_refresh' | 'plan_execution'
    planId?: string
    error?: string
    message: string
  }> => {
    console.log('[agentGateway] START:', {
      trigger: args.trigger,
      farmId: args.farmId.toString(),
      farmExternalId: args.farmExternalId,
      userId: args.userId,
      hasAdditionalContext: !!args.additionalContext,
      contextKeys: args.additionalContext ? Object.keys(args.additionalContext) : [],
    })

    // For morning_brief trigger, generate a daily plan
    if (args.trigger === 'morning_brief') {
      const today = new Date().toISOString().split('T')[0]
      
      // Use provided context or fetch plan generation data
      const hasProvidedContext = !!args.additionalContext?.planGenerationData
      console.log('[agentGateway] Data source decision:', {
        hasProvidedContext,
        willFetch: !hasProvidedContext,
        optimization: hasProvidedContext ? 'Using provided context (query saved)' : 'Fetching data (no context provided)',
      })

      const planData = hasProvidedContext
        ? args.additionalContext!.planGenerationData
        : await ctx.runQuery(api.intelligence.getPlanGenerationData as any, {
            farmExternalId: args.farmExternalId,
            date: today,
          }) as any

      console.log('[agentGateway] Plan data available:', {
        source: hasProvidedContext ? 'provided context' : 'fetched',
        hasExistingPlan: !!planData.existingPlanId,
        existingPlanId: planData.existingPlanId?.toString(),
        paddocksCount: planData.paddocks?.length || 0,
        hasFarm: !!planData.farm,
        hasSettings: !!planData.settings,
        hasObservations: !!planData.observations,
        hasGrazingEvents: !!planData.grazingEvents,
      })

      if (planData.existingPlanId) {
        console.log('[agentGateway] Plan already exists, returning early:', {
          existingPlanId: planData.existingPlanId.toString(),
        })
        return {
          success: true,
          trigger: args.trigger,
          planId: planData.existingPlanId.toString(),
          message: 'Plan already exists for today',
        }
      }

      if (!planData.paddocks || planData.paddocks.length === 0) {
        console.log('[agentGateway] No paddocks found, returning error')
        return {
          success: false,
          trigger: args.trigger,
          error: 'No paddocks found for farm',
          message: 'Cannot generate plan: farm has no paddocks',
        }
      }

      const activePaddockId = planData.mostRecentGrazingEvent?.paddockExternalId || 
        (planData.paddocks && planData.paddocks.length > 0 ? planData.paddocks[0].externalId : null)

      const settings = planData.settings || {
        minNDVIThreshold: 0.40,
        minRestPeriod: 21,
      }

      // Use farmName from context or fetch minimal data
      const farmNameFromContext = args.additionalContext?.farmName
      const farmName = farmNameFromContext || (planData.farm?.name || args.farmExternalId)

      console.log('[agentGateway] Prepared agent inputs:', {
        farmExternalId: args.farmExternalId,
        farmName,
        farmNameSource: farmNameFromContext ? 'provided context' : (planData.farm?.name ? 'planData.farm' : 'fallback to externalId'),
        activePaddockId,
        activePaddockSource: planData.mostRecentGrazingEvent?.paddockExternalId ? 'mostRecentGrazingEvent' : 'first paddock',
        settings,
        today,
        usingProvidedContext: !!args.additionalContext?.planGenerationData,
        optimizationSummary: {
          planGenerationDataQuery: hasProvidedContext ? 'SKIPPED (using context)' : 'EXECUTED',
          getFarmContextQuery: 'SKIPPED (using farmName from context)',
        },
      })

      console.log('[agentGateway] Delegating to runGrazingAgent...')

      // Call the grazing agent through the gateway
      const result = await runGrazingAgent(
        ctx,
        args.farmExternalId,
        farmName,
        activePaddockId,
        settings
      )

      console.log('[agentGateway] runGrazingAgent result received:', {
        success: result.success,
        planCreated: result.planCreated,
        planId: result.planId?.toString(),
        hasPlanId: !!result.planId,
        error: result.error,
      })

      if (!result.success) {
        console.error('[agentGateway] Agent execution failed:', {
          error: result.error || 'Agent execution failed',
        })
        return {
          success: false,
          trigger: args.trigger,
          error: result.error || 'Agent execution failed',
          message: 'Failed to generate plan',
        }
      }

      if (!result.planCreated) {
        console.warn('[agentGateway] Agent did not create a plan:', {
          success: result.success,
          planCreated: result.planCreated,
          planId: result.planId?.toString(),
        })
        return {
          success: false,
          trigger: args.trigger,
          error: 'Agent did not create a plan',
          message: 'Plan generation completed but no plan was created',
        }
      }

      // Use planId from result instead of re-fetching (optimization: no getTodayPlan query)
      const finalPlanId = result.planId?.toString()
      console.log('[agentGateway] END - Success:', {
        planId: finalPlanId,
        optimization: 'Using planId from runGrazingAgent result (getTodayPlan query SKIPPED)',
        queryOptimizations: {
          getPlanGenerationData: hasProvidedContext ? 'SKIPPED (using context)' : 'EXECUTED',
          getFarmContext: 'SKIPPED (using farmName from context)',
          getTodayPlan: 'SKIPPED (using planId from result)',
        },
      })

      return {
        success: true,
        trigger: args.trigger,
        planId: finalPlanId,
        message: 'Plan generated successfully',
      }
    }

    // For other triggers, return context (to be implemented)
    console.log('[agentGateway] Other trigger (not morning_brief):', {
      trigger: args.trigger,
      note: 'Not yet fully implemented',
    })
    return {
      success: true,
      trigger: args.trigger,
      message: `Trigger ${args.trigger} not yet fully implemented - returning context only`,
    }
  },
})
