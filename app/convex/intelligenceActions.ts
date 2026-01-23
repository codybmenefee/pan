import { action } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { api } from './_generated/api'
import { DEFAULT_FARM_EXTERNAL_ID } from './seedData'
// NOTE: runGrazingAgent is legacy/internal - only used by agentGateway
// All external calls should route through api.grazingAgentGateway.agentGateway

type PlanGenerationData = {
  existingPlanId: Id<'plans'> | null
  observations: any[] | null
  grazingEvents: any[] | null
  settings: any | null
  farm: any | null
  mostRecentGrazingEvent: any | null
  paddocks: any[] | null
}

export const generateDailyPlan = action({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<Id<'plans'> | null> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const today = new Date().toISOString().split('T')[0]

    console.log('[generateDailyPlan] START:', { 
      farmExternalId, 
      today,
      note: 'This function will fetch planGenerationData and pass it to gateway to avoid duplicate queries',
    })

    const data = await ctx.runQuery(api.intelligence.getPlanGenerationData as any, {
      farmExternalId,
      date: today,
    }) as PlanGenerationData

    if (data.existingPlanId) {
      console.log('[generateDailyPlan] Plan already exists:', data.existingPlanId.toString())
      return data.existingPlanId
    }

    // Check if we have basic data to work with
    if (!data.paddocks || data.paddocks.length === 0) {
      console.log('[generateDailyPlan] No paddocks found for farm:', farmExternalId)
      return null
    }

    console.log('[generateDailyPlan] Plan generation data fetched:', {
      paddocksCount: data.paddocks.length,
      hasFarm: !!data.farm,
      farmId: data.farm?._id?.toString(),
      farmName: data.farm?.name,
      hasSettings: !!data.settings,
      hasObservations: !!data.observations,
      observationsCount: data.observations?.length || 0,
      hasGrazingEvents: !!data.grazingEvents,
      grazingEventsCount: data.grazingEvents?.length || 0,
      mostRecentGrazingEvent: data.mostRecentGrazingEvent ? {
        paddockId: data.mostRecentGrazingEvent.paddockExternalId,
        date: data.mostRecentGrazingEvent.date,
      } : null,
      settings: data.settings,
    })

    // Check if farm exists in the data
    if (!data.farm) {
      console.error('[generateDailyPlan] Farm not found in planGenerationData:', farmExternalId)
      return null
    }

    console.log('[generateDailyPlan] Preparing context for gateway:', {
      farmId: data.farm._id.toString(),
      farmExternalId,
      farmName: data.farm.name || farmExternalId,
      contextDataKeys: {
        hasPlanGenerationData: true,
        hasFarm: !!data.farm,
        hasPaddocks: !!data.paddocks,
        hasSettings: !!data.settings,
        hasObservations: !!data.observations,
        hasGrazingEvents: !!data.grazingEvents,
      },
    })

    console.log('[generateDailyPlan] Calling agent gateway with context (optimization: passing data to avoid duplicate queries)...')
    // Call agent gateway with event-specific context to avoid duplicate queries
    // TODO: Get userId from auth context when available
    const gatewayResult = await ctx.runAction(api.grazingAgentGateway.agentGateway, {
      trigger: 'morning_brief',
      farmId: data.farm._id,
      farmExternalId: farmExternalId,
      userId: 'system', // TODO: Get from auth context
      additionalContext: {
        planGenerationData: data,
        farmName: data.farm.name || farmExternalId,
      },
    })

    console.log('[generateDailyPlan] Gateway result received:', {
      success: gatewayResult.success,
      planId: gatewayResult.planId,
      error: gatewayResult.error,
      message: gatewayResult.message,
      trigger: gatewayResult.trigger,
    })

    if (!gatewayResult.success) {
      console.error('[generateDailyPlan] Agent gateway failed:', gatewayResult.error)
      return null
    }

    if (!gatewayResult.planId) {
      console.log('[generateDailyPlan] Agent gateway did not create a plan')
      return null
    }

    console.log('[generateDailyPlan] END - Plan created:', gatewayResult.planId)
    return gatewayResult.planId as Id<'plans'>
  },
})

export const runDailyBriefGeneration = action({
  handler: async (ctx): Promise<Array<{ farmId: string; success: boolean; planId?: Id<'plans'>; error?: string }>> => {
    const farms = await ctx.runQuery(api.intelligence.getAllFarms as any) as any[]

    const results: Array<{ farmId: string; success: boolean; planId?: Id<'plans'>; error?: string }> = []

    for (const farm of farms) {
      try {
        const today = new Date().toISOString().split('T')[0]

        const data = await ctx.runQuery(api.intelligence.getPlanGenerationData as any, {
          farmExternalId: farm.externalId,
          date: today,
        }) as PlanGenerationData

        if (data.existingPlanId) {
          results.push({ farmId: farm.externalId, success: true, planId: data.existingPlanId })
          continue
        }

        // Skip farms without paddocks
        if (!data.paddocks || data.paddocks.length === 0) {
          console.log("No paddocks found for farm:", farm.externalId)
          results.push({ farmId: farm.externalId, success: true })
          continue
        }

        // Use agent gateway for plan generation (per architecture plan)
        // Gateway handles context assembly and delegates to runGrazingAgent internally
        // Pass event-specific context to avoid duplicate queries
        console.log(`[runDailyBriefGeneration] Calling gateway for farm ${farm.externalId} with context (optimization: passing data to avoid duplicate queries)`)
        const gatewayResult = await ctx.runAction(api.grazingAgentGateway.agentGateway, {
          trigger: 'morning_brief',
          farmId: farm._id,
          farmExternalId: farm.externalId,
          userId: 'system', // TODO: Get from auth context
          additionalContext: {
            planGenerationData: data,
            farmName: data.farm?.name || farm.externalId,
          },
        })
        console.log(`[runDailyBriefGeneration] Gateway result for farm ${farm.externalId}:`, {
          success: gatewayResult.success,
          planId: gatewayResult.planId,
          error: gatewayResult.error,
        })

        if (!gatewayResult.success) {
          console.error(`Agent gateway failed for farm ${farm.externalId}:`, gatewayResult.error)
          results.push({ farmId: farm.externalId, success: false, error: gatewayResult.error })
        } else if (!gatewayResult.planId) {
          console.log(`Agent gateway did not create plan for farm ${farm.externalId}`)
          results.push({ farmId: farm.externalId, success: true })
        } else {
          results.push({ 
            farmId: farm.externalId, 
            success: true, 
            planId: gatewayResult.planId as Id<'plans'> | undefined 
          })
        }
      } catch (error: any) {
        console.error(`Failed to generate plan for farm ${farm.externalId}:`, error.message)
        results.push({ farmId: farm.externalId, success: false, error: error.message })
      }
    }

    return results
  },
})


export const cleanupFallbackPlans = action({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{ deleted: number }> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    
    const result = await ctx.runMutation(api.intelligence.deleteAllFallbackPlans, {
      farmExternalId,
    })
    
    return result as { deleted: number }
  },
})
