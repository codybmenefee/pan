import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { DEFAULT_FARM_EXTERNAL_ID } from './seedData'


export const getTodayPlan = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const today = new Date().toISOString().split('T')[0]

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    return plans.find((p: any) => p.date === today) || null
  },
})


export const getObservationsForFarm = query({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('observations')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()
  },
})


export const getGrazingEventsForFarm = query({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()
  },
})


export const getMostRecentGrazingEvent = query({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()
    
    if (events.length === 0) {
      return null
    }
    
    return events.reduce((latest: any, event: any) => {
      if (!latest || new Date(event.date) > new Date(latest.date)) {
        return event
      }
      return latest
    }, null)
  },
})


export const getPaddocksForFarm = query({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', args.farmExternalId))
      .first()
    
    if (!farm) {
      return []
    }
    
    return await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()
  },
})


export const getSettingsForFarm = query({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .first()
  },
})


export const getFarmByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', args.externalId))
      .first()
  },
})


export const getAllFarms = query({
  handler: async (ctx) => {
    return await ctx.db.query('farms').collect()
  },
})


export const getPlanById = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.planId)
  },
})


export const getPlanHistory = query({
  args: { farmExternalId: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    return plans
      .filter((p: any) => new Date(p.date) >= cutoffDate)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },
})


export const approvePlan = mutation({
  args: { planId: v.id('plans'), userId: v.string() },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    await ctx.db.patch(args.planId, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: args.userId,
      updatedAt: new Date().toISOString(),
    })

    return args.planId
  },
})


export const submitFeedback = mutation({
  args: { planId: v.id('plans'), feedback: v.string() },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    await ctx.db.patch(args.planId, {
      status: 'modified',
      feedback: args.feedback,
      updatedAt: new Date().toISOString(),
    })

    return args.planId
  },
})


export const getPlanGenerationData = query({
  args: { farmExternalId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const existingPlan = await ctx.db
      .query('plans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    const todayPlan = existingPlan.find((p: any) => p.date === args.date)
    if (todayPlan) {
      return { existingPlanId: todayPlan._id, observations: null, grazingEvents: null, settings: null, farm: null, mostRecentGrazingEvent: null, paddocks: null }
    }

    const [observations, grazingEvents, settings, farm, mostRecentGrazingEvent, paddocks] = await Promise.all([
      ctx.db.query('observations').withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId)).collect(),
      ctx.db.query('grazingEvents').withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId)).collect(),
      ctx.db.query('farmSettings').withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId)).first(),
      ctx.db.query('farms').withIndex('by_externalId', (q: any) => q.eq('externalId', args.farmExternalId)).first(),
      (async () => {
        const events = await ctx.db.query('grazingEvents').withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId)).collect()
        if (events.length === 0) return null
        return events.reduce((latest: any, event: any) => {
          if (!latest || new Date(event.date) > new Date(latest.date)) {
            return event
          }
          return latest
        }, null)
      })(),
      (async () => {
        const farmRecord = await ctx.db.query('farms').withIndex('by_externalId', (q: any) => q.eq('externalId', args.farmExternalId)).first()
        if (!farmRecord) return []
        return await ctx.db.query('paddocks').withIndex('by_farm', (q: any) => q.eq('farmId', farmRecord._id)).collect()
      })(),
    ])

    return { existingPlanId: null, observations, grazingEvents, settings, farm, mostRecentGrazingEvent, paddocks }
  },
})


export const createPlanFromRecommendation = mutation({
  args: {
    farmExternalId: v.string(),
    date: v.string(),
    targetPaddockId: v.string(),
    confidence: v.number(),
    reasoning: v.array(v.string()),
    sectionGeometry: v.optional(v.any()),
    sectionAreaHectares: v.optional(v.number()),
    sectionCentroid: v.optional(v.array(v.number())),
    sectionAvgNdvi: v.optional(v.number()),
    fallback: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    return await ctx.db.insert('plans', {
      farmExternalId: args.farmExternalId,
      date: args.date,
      primaryPaddockExternalId: args.targetPaddockId,
      alternativePaddockExternalIds: [],
      confidenceScore: args.confidence,
      reasoning: args.reasoning,
      status: 'pending',
      approvedAt: undefined,
      approvedBy: undefined,
      feedback: undefined,
      sectionGeometry: args.sectionGeometry,
      sectionAreaHectares: args.sectionAreaHectares || 0,
      sectionCentroid: args.sectionCentroid,
      sectionAvgNdvi: args.sectionAvgNdvi,
      createdAt: now,
      updatedAt: now,
    })
  },
})


export const createFallbackPlan = mutation({
  args: {
    farmExternalId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    return await ctx.db.insert('plans', {
      farmExternalId: args.farmExternalId,
      date: args.date,
      primaryPaddockExternalId: 'p1',
      alternativePaddockExternalIds: [],
      confidenceScore: 0.5,
      reasoning: ['Plan generation failed, using fallback'],
      status: 'pending',
      approvedAt: undefined,
      approvedBy: undefined,
      feedback: undefined,
      sectionGeometry: undefined,
      sectionAreaHectares: 0,
      sectionCentroid: undefined,
      sectionAvgNdvi: undefined,
      createdAt: now,
      updatedAt: now,
    })
  },
})


export const listAllPlansForFarm = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const farmExternalId = args.farmExternalId ?? 'farm-1'

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    return plans.map((p: any) => ({
      id: p._id.toString(),
      date: p.date,
      status: p.status,
      confidenceScore: p.confidenceScore,
      primaryPaddock: p.primaryPaddockExternalId,
    }))
  },
})


export const deleteTodayPlan = mutation({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const today = new Date().toISOString().split('T')[0]

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    const todayPlan = plans.find((p: any) => p.date === today)
    if (todayPlan) {
      await ctx.db.delete(todayPlan._id)
      return { deleted: true, planId: todayPlan._id }
    }

    return { deleted: false, planId: null }
  },
})


export const forceDeleteTodayPlan = mutation({
  args: { planId: v.string() },
  handler: async (ctx, args) => {
    try {
      await ctx.db.delete(args.planId as any)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },
})


export const deleteAllFallbackPlans = mutation({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    const fallbackReasoning = 'Plan generation failed, using fallback'
    let deletedCount = 0

    for (const plan of plans) {
      if (plan.reasoning && plan.reasoning.includes(fallbackReasoning)) {
        await ctx.db.delete(plan._id)
        deletedCount++
      }
    }

    return { deleted: deletedCount }
  },
})


export const getAllSections = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{
    id: string
    paddockId: string
    date: string
    geometry: any
    targetArea: number
    reasoning: string[]
  }[]> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    console.log('[getAllSections] START - farmExternalId:', farmExternalId)
    const startTime = Date.now()

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    console.log('[getAllSections] Found', plans.length, 'total plans for farm')

    const sections = []
    let plansWithSections = 0
    let plansWithoutSections = 0

    for (const plan of plans) {
      const hasSection = !!plan.sectionGeometry
      console.log('[getAllSections] Plan:', plan._id, {
        date: plan.date,
        paddockId: plan.primaryPaddockExternalId,
        hasSectionGeometry: hasSection,
        status: plan.status,
        sectionArea: plan.sectionAreaHectares,
      })
      
      if (hasSection) {
        plansWithSections++
        sections.push({
          id: plan._id.toString(),
          paddockId: plan.primaryPaddockExternalId ?? '',
          date: plan.date,
          geometry: plan.sectionGeometry,
          targetArea: plan.sectionAreaHectares ?? 0,
          reasoning: plan.reasoning ?? [],
        })
      } else {
        plansWithoutSections++
      }
    }

    const sorted = sections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const duration = Date.now() - startTime
    
    console.log('[getAllSections] END - Returning', sorted.length, 'sections', {
      plansWithSections,
      plansWithoutSections,
      duration: `${duration}ms`,
      sectionDates: sorted.map(s => s.date),
      sectionPaddocks: sorted.map(s => s.paddockId),
    })

    return sorted
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
