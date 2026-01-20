"use node";

import { action } from './_generated/server'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'
import { api } from './_generated/api'
import { DEFAULT_FARM_EXTERNAL_ID } from './seedData'

type PlanGenerationData = {
  existingPlanId: Id<'plans'> | null
  observations: any[] | null
  grazingEvents: any[] | null
  settings: any | null
  farm: any | null
}

type PlanRecommendation = {
  targetPaddockId: string
  confidence: number
  reasoning: string[]
  sectionGeometry: any
  sectionAreaHectares: number
  sectionCentroid: number[] | undefined
  sectionAvgNdvi: number | undefined
}

async function runPythonAgent(convexData: any): Promise<PlanRecommendation> {
  const { execSync } = require('child_process')
  const path = require('path')

  const scriptPath = path.join(process.cwd(), '..', 'src', 'intelligence', 'agent.py')
  const contextJson = JSON.stringify(convexData).replace(/'/g, "\\'")

  const result = execSync(
    `python3 -c "
import sys
sys.path.insert(0, '${path.dirname(scriptPath)}')
from agent import generate_daily_plan
import json
ctx = json.loads('${contextJson}')
result = generate_daily_plan(ctx)
print(json.dumps(result))
" 2>&1`,
    { encoding: 'utf-8', timeout: 120000 }
  )

  return JSON.parse(result)
}

export const generateDailyPlan = action({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<Id<'plans'>> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const today = new Date().toISOString().split('T')[0]

    const data = await ctx.runQuery(api.intelligence.getPlanGenerationData as any, {
      farmExternalId,
      date: today,
    }) as PlanGenerationData

    if (data.existingPlanId) {
      return data.existingPlanId
    }

    const convexData = {
      farm: data.farm || { externalId: farmExternalId, name: 'Unknown Farm' },
      observations: (data.observations || []).map((o: any) => ({
        paddockExternalId: o.paddockExternalId,
        ndviMean: o.ndviMean,
        ndviStd: o.ndviStd,
        date: o.date,
        area: 42.5,
      })),
      grazingEvents: (data.grazingEvents || []).map((e: any) => ({
        paddockExternalId: e.paddockExternalId,
        date: e.date,
      })),
      settings: data.settings || {
        minNDVIThreshold: 0.40,
        minRestPeriod: 21,
      },
    }

    try {
      const recommendation = await runPythonAgent(convexData)

      const planId = await ctx.runMutation(api.intelligence.createPlanFromRecommendation as any, {
        farmExternalId,
        date: today,
        targetPaddockId: recommendation.targetPaddockId,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning,
        sectionGeometry: recommendation.sectionGeometry,
        sectionAreaHectares: recommendation.sectionAreaHectares || 0,
        sectionCentroid: recommendation.sectionCentroid,
        sectionAvgNdvi: recommendation.sectionAvgNdvi,
        fallback: false,
      })

      return planId
    } catch (error: any) {
      console.error('Failed to generate plan:', error.message)

      const planId = await ctx.runMutation(api.intelligence.createFallbackPlan as any, {
        farmExternalId,
        date: today,
      })

      return planId
    }
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

        let planId: Id<'plans'>
        if (data.existingPlanId) {
          planId = data.existingPlanId
        } else {
          const convexData = {
            farm: data.farm || { externalId: farm.externalId, name: 'Unknown Farm' },
            observations: (data.observations || []).map((o: any) => ({
              paddockExternalId: o.paddockExternalId,
              ndviMean: o.ndviMean,
              ndviStd: o.ndviStd,
              date: o.date,
              area: 42.5,
            })),
            grazingEvents: (data.grazingEvents || []).map((e: any) => ({
              paddockExternalId: e.paddockExternalId,
              date: e.date,
            })),
            settings: data.settings || {
              minNDVIThreshold: 0.40,
              minRestPeriod: 21,
            },
          }

          try {
            const recommendation = await runPythonAgent(convexData)

            planId = await ctx.runMutation(api.intelligence.createPlanFromRecommendation as any, {
              farmExternalId: farm.externalId,
              date: today,
              targetPaddockId: recommendation.targetPaddockId,
              confidence: recommendation.confidence,
              reasoning: recommendation.reasoning,
              sectionGeometry: recommendation.sectionGeometry,
              sectionAreaHectares: recommendation.sectionAreaHectares || 0,
              sectionCentroid: recommendation.sectionCentroid,
              sectionAvgNdvi: recommendation.sectionAvgNdvi,
              fallback: false,
            })
          } catch (error: any) {
            console.error('Failed to generate plan:', error.message)

            planId = await ctx.runMutation(api.intelligence.createFallbackPlan as any, {
              farmExternalId: farm.externalId,
              date: today,
            })
          }
        }

        results.push({ farmId: farm.externalId, success: true, planId })
      } catch (error: any) {
        results.push({ farmId: farm.externalId, success: false, error: error.message })
      }
    }

    return results
  },
})
