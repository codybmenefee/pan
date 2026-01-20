import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'
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
      return { existingPlanId: todayPlan._id, observations: null, grazingEvents: null, settings: null, farm: null }
    }

    const [observations, grazingEvents, settings, farm] = await Promise.all([
      ctx.db.query('observations').withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId)).collect(),
      ctx.db.query('grazingEvents').withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId)).collect(),
      ctx.db.query('farmSettings').withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId)).first(),
      ctx.db.query('farms').withIndex('by_externalId', (q: any) => q.eq('externalId', args.farmExternalId)).first(),
    ])

    return { existingPlanId: null, observations, grazingEvents, settings, farm }
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
