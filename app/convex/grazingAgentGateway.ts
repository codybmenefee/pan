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
 * - Braintrust logging for observability
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

"use node"

import { action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'
import type { ActionCtx } from './_generated/server'
// Internal: Legacy agent implementation - only used by this gateway
import { runGrazingAgent } from './grazingAgentDirect'
import { getLogger, flushLogs } from '../lib/braintrust'
import { sanitizeForBraintrust } from '../lib/braintrustSanitize'
import { initOTelOnce, getTracer, flushOTel } from '../lib/otel'

// Note: initOTelOnce is called in handler since it's async

// Helper to flush all telemetry before returning
async function flushAllTelemetry(): Promise<void> {
  console.log('[agentGateway] Flushing all telemetry...')
  await Promise.all([
    flushLogs(),
    flushOTel(),
  ])
  console.log('[agentGateway] All telemetry flushed')
}

/**
 * Type definition for morning_brief trigger additional context
 * This allows passing event-specific data to avoid duplicate queries
 */
export type MorningBriefContext = {
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
 * Future enhancements:
 * - Use trigger-specific prompts from lib/agent/triggers.ts
 * - Migrate runGrazingAgent logic into gateway for better control
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
    // Initialize OTel (async, runs once per cold start)
    await initOTelOnce()

    const logger = getLogger()
    const tracer = getTracer()

    console.log('[agentGateway] Telemetry status:', {
      hasLogger: !!logger,
      loggerType: typeof logger,
      hasTracer: !!tracer,
      tracerType: typeof tracer,
    })

    // Use try/finally to ensure telemetry is flushed before returning
    try {
      return await logger.traced(async (rootSpan: any) => {
        console.log('[agentGateway] Inside logger.traced, rootSpan:', {
          hasRootSpan: !!rootSpan,
          rootSpanType: typeof rootSpan,
          rootSpanMethods: rootSpan ? Object.keys(rootSpan) : 'null',
        })

        // Log gateway invocation (sanitize to remove Convex internal fields)
        rootSpan.log({
          input: sanitizeForBraintrust({
            trigger: args.trigger,
            farmId: String(args.farmId), // Convert Convex ID to string
            farmExternalId: args.farmExternalId,
            userId: args.userId,
          }),
          metadata: sanitizeForBraintrust({
            hasAdditionalContext: !!args.additionalContext,
          }),
        })

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

      // Sanitize settings to remove Convex internal fields before passing to agent
      const rawSettings = planData.settings || {
        minNDVIThreshold: 0.40,
        minRestPeriod: 21,
      }
      const settings = {
        minNDVIThreshold: rawSettings.minNDVIThreshold ?? 0.40,
        minRestPeriod: rawSettings.minRestPeriod ?? 21,
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

      // Initialize Braintrust logger
      // Note: wrapAnthropic doesn't support @ai-sdk/anthropic, so we'll log LLM calls manually
      const logger = getLogger()

      // Call the grazing agent through the gateway with Braintrust logging
      console.log('[agentGateway] Calling runGrazingAgent with tracer:', {
        hasTracer: !!tracer,
        tracerType: typeof tracer,
      })

      const result = await runGrazingAgent(
        ctx,
        args.farmExternalId,
        farmName,
        activePaddockId,
        settings,
        logger,
        null, // wrappedAnthropic not supported with @ai-sdk/anthropic
        tracer // OTel tracer for experimental_telemetry
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
        
        const errorResult = {
          success: false,
          trigger: args.trigger,
          error: result.error || 'Agent execution failed',
          message: 'Failed to generate plan',
        }
        
        rootSpan.log({
          output: sanitizeForBraintrust(errorResult),
        })
        
        return errorResult
      }

      if (!result.planCreated) {
        console.warn('[agentGateway] Agent did not create a plan:', {
          success: result.success,
          planCreated: result.planCreated,
          planId: result.planId?.toString(),
        })
        
        const noPlanResult = {
          success: false,
          trigger: args.trigger,
          error: 'Agent did not create a plan',
          message: 'Plan generation completed but no plan was created',
        }
        
        rootSpan.log({
          output: sanitizeForBraintrust(noPlanResult),
        })
        
        return noPlanResult
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

      const successResult = {
        success: true,
        trigger: args.trigger,
        planId: finalPlanId ? String(finalPlanId) : undefined, // Convert Convex ID to string
        message: 'Plan generated successfully',
      }

      rootSpan.log({
        output: sanitizeForBraintrust(successResult),
      })

      return successResult
    }

    // For other triggers, return context (to be implemented)
    console.log('[agentGateway] Other trigger (not morning_brief):', {
      trigger: args.trigger,
      note: 'Not yet fully implemented',
    })
    
    const otherTriggerResult = {
      success: true,
      trigger: args.trigger,
      message: `Trigger ${args.trigger} not yet fully implemented - returning context only`,
    }

    rootSpan.log({
      output: sanitizeForBraintrust(otherTriggerResult),
    })

    return otherTriggerResult
      }, { name: 'Agent Gateway', metadata: { trigger: args.trigger, farmExternalId: args.farmExternalId, userId: args.userId } })
    } finally {
      // Always flush telemetry before the action completes
      await flushAllTelemetry()
    }
  },
})
