import { action } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { api } from './_generated/api'
import { DEFAULT_FARM_EXTERNAL_ID } from './seedData'
import { createLogger } from './lib/logger'
// NOTE: runGrazingAgent is legacy/internal - only used by agentGateway
// All external calls should route through api.grazingAgentGateway.agentGateway

const log = createLogger('intelligenceActions')

type PlanGenerationData = {
  existingPlanId: Id<'plans'> | null
  observations: any[] | null
  grazingEvents: any[] | null
  settings: any | null
  farm: any | null
  mostRecentGrazingEvent: any | null
  pastures: any[] | null
}

export const generateDailyPlan = action({
  args: {
    farmExternalId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<'plans'> | null> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const today = new Date().toISOString().split('T')[0]

    // Get user identity from auth context, or use provided userId (for dev mode)
    const identity = await ctx.auth.getUserIdentity()
    const userId = args.userId || identity?.subject || identity?.tokenIdentifier || 'anonymous'

    log.debug('generateDailyPlan START', { farmExternalId, today, userId })

    const data = await ctx.runQuery(api.intelligence.getPlanGenerationData as any, {
      farmExternalId,
      date: today,
    }) as PlanGenerationData

    if (data.existingPlanId) {
      log.debug('Plan already exists', { planId: data.existingPlanId.toString() })
      return data.existingPlanId
    }

    // Check if we have basic data to work with
    if (!data.pastures || data.pastures.length === 0) {
      log.debug('No pastures found for farm', { farmExternalId })
      return null
    }

    log.debug('Plan generation data fetched', {
      pasturesCount: data.pastures.length,
      hasFarm: !!data.farm,
      hasSettings: !!data.settings,
      observationsCount: data.observations?.length || 0,
      grazingEventsCount: data.grazingEvents?.length || 0,
    })

    // Check if farm exists in the data
    if (!data.farm) {
      log.error('Farm not found in planGenerationData', { farmExternalId })
      return null
    }

    log.debug('Preparing context for gateway', {
      farmId: data.farm._id.toString(),
      farmExternalId,
    })

    log.debug('Calling agent gateway')
    // Call agent gateway with event-specific context to avoid duplicate queries
    // Note: userId is passed as parameter; can be obtained from Convex auth when fully integrated
    const gatewayResult = await ctx.runAction(api.grazingAgentGateway.agentGateway, {
      trigger: 'morning_brief',
      farmId: data.farm._id,
      farmExternalId: farmExternalId,
      userId,
      additionalContext: {
        planGenerationData: data,
        farmName: data.farm.name || farmExternalId,
      },
    })

    log.debug('Gateway result received', {
      success: gatewayResult.success,
      planId: gatewayResult.planId,
    })

    if (!gatewayResult.success) {
      log.error('Agent gateway failed', { error: gatewayResult.error })
      return null
    }

    if (!gatewayResult.planId) {
      log.debug('Agent gateway did not create a plan')
      return null
    }

    log.debug('generateDailyPlan END - Plan created', { planId: gatewayResult.planId })
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

        // Skip farms without pastures
        if (!data.pastures || data.pastures.length === 0) {
          log.debug('No pastures found for farm', { farmExternalId: farm.externalId })
          results.push({ farmId: farm.externalId, success: true })
          continue
        }

        // Use agent gateway for plan generation (per architecture plan)
        // Gateway handles context assembly and delegates to runGrazingAgent internally
        // Pass event-specific context to avoid duplicate queries
        log.debug('Calling gateway for farm', { farmExternalId: farm.externalId })
        const gatewayResult = await ctx.runAction(api.grazingAgentGateway.agentGateway, {
          trigger: 'morning_brief',
          farmId: farm._id,
          farmExternalId: farm.externalId,
          userId: 'cron-scheduler', // Batch job - no user context
          additionalContext: {
            planGenerationData: data,
            farmName: data.farm?.name || farm.externalId,
          },
        })
        log.debug('Gateway result for farm', {
          farmExternalId: farm.externalId,
          success: gatewayResult.success,
          planId: gatewayResult.planId,
        })

        if (!gatewayResult.success) {
          log.error('Agent gateway failed', { farmExternalId: farm.externalId, error: gatewayResult.error })
          results.push({ farmId: farm.externalId, success: false, error: gatewayResult.error })
        } else if (!gatewayResult.planId) {
          log.debug('Agent gateway did not create plan', { farmExternalId: farm.externalId })
          results.push({ farmId: farm.externalId, success: true })
        } else {
          results.push({
            farmId: farm.externalId,
            success: true,
            planId: gatewayResult.planId as Id<'plans'> | undefined
          })
        }
      } catch (error: any) {
        log.error('Failed to generate plan for farm', { farmExternalId: farm.externalId, error: error.message })
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
