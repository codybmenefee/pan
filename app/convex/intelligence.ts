import { query, mutation, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { DEFAULT_FARM_EXTERNAL_ID } from './seedData'
import { HECTARES_PER_SQUARE_METER } from './lib/areaConstants'
import { createLogger } from './lib/logger'

const log = createLogger('intelligence')


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


export const getPasturesForFarm = query({
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

    const now = new Date().toISOString()
    const today = now.split('T')[0]

    await ctx.db.patch(args.planId, {
      status: 'approved',
      approvedAt: now,
      approvedBy: args.userId,
      updatedAt: now,
    })

    // Record section grazing event for progressive grazing tracking
    if (plan.sectionGeometry && plan.primaryPaddockExternalId) {
      // Schedule the internal mutation to record the section
      await ctx.scheduler.runAfter(0, internal.intelligence.recordApprovedSection, {
        planId: args.planId,
        farmExternalId: plan.farmExternalId,
        paddockExternalId: plan.primaryPaddockExternalId,
        sectionGeometry: plan.sectionGeometry,
        sectionAreaHa: plan.sectionAreaHectares ?? 0,
        sectionNdviMean: plan.sectionAvgNdvi ?? 0,
        progressionContext: plan.progressionContext,
      })
    }

    // Update the associated paddockForecasts record to progress sections
    // This fixes the bug where the agent always recommends section 0
    const dailyBrief = await ctx.db
      .query('dailyBriefs')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', plan.farmExternalId))
      .filter((q: any) => q.eq(q.field('date'), plan.date))
      .first()

    if (dailyBrief?.forecastId) {
      const forecast = await ctx.db.get(dailyBrief.forecastId)
      if (forecast && forecast.status === 'active') {
        const isMove = dailyBrief.decision === 'MOVE'
        const currentSection = forecast.forecastedSections[forecast.activeSectionIndex]

        if (isMove && currentSection) {
          // Record section in history
          const grazingHistory = [...forecast.grazingHistory, {
            sectionIndex: forecast.activeSectionIndex,
            geometry: currentSection.geometry,
            areaHa: currentSection.areaHa,
            startedDate: dailyBrief.date,
            endedDate: today,
            actualDays: forecast.daysInActiveSection,
          }]

          // Move to next section
          const nextIndex = Math.min(
            forecast.activeSectionIndex + 1,
            forecast.forecastedSections.length - 1
          )

          await ctx.db.patch(forecast._id, {
            activeSectionIndex: nextIndex,
            daysInActiveSection: 1,
            grazingHistory,
            updatedAt: now,
          })

          log.debug('Forecast progressed to next section', {
            forecastId: forecast._id.toString(),
            previousSection: forecast.activeSectionIndex,
            nextSection: nextIndex,
            historyLength: grazingHistory.length,
          })
        } else {
          // STAY - increment days in section
          await ctx.db.patch(forecast._id, {
            daysInActiveSection: forecast.daysInActiveSection + 1,
            updatedAt: now,
          })

          log.debug('Forecast staying in current section', {
            forecastId: forecast._id.toString(),
            sectionIndex: forecast.activeSectionIndex,
            daysInSection: forecast.daysInActiveSection + 1,
          })
        }
      }
    }

    return args.planId
  },
})

/**
 * Internal mutation to record approved section for progressive grazing.
 * Called after plan approval to update rotation tracking.
 */
export const recordApprovedSection = internalMutation({
  args: {
    planId: v.id('plans'),
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
    sectionGeometry: v.any(),
    sectionAreaHa: v.number(),
    sectionNdviMean: v.number(),
    progressionContext: v.optional(v.object({
      rotationId: v.id('paddockRotations'),
      sequenceNumber: v.number(),
      progressionQuadrant: v.string(),
      wasUngrazedAreaReturn: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    // Calculate section centroid (simple average of polygon vertices)
    let sectionCentroid: number[] = [0, 0]
    try {
      const coords = args.sectionGeometry?.coordinates?.[0]
      if (coords && coords.length > 0) {
        let sumLng = 0
        let sumLat = 0
        // Exclude the last point if it's the same as the first (closed polygon)
        const points = coords.length > 1 &&
          coords[0][0] === coords[coords.length - 1][0] &&
          coords[0][1] === coords[coords.length - 1][1]
          ? coords.slice(0, -1)
          : coords
        for (const point of points) {
          sumLng += point[0]
          sumLat += point[1]
        }
        sectionCentroid = [sumLng / points.length, sumLat / points.length]
      }
    } catch {
      // If centroid calculation fails, use first coordinate
      const coords = args.sectionGeometry?.coordinates?.[0]?.[0]
      if (coords) {
        sectionCentroid = coords
      }
    }

    // Get or create active rotation
    let rotationId = args.progressionContext?.rotationId

    if (!rotationId) {
      // Check for existing active rotation
      const activeRotation = await ctx.db
        .query('paddockRotations')
        .withIndex('by_active', (q: any) =>
          q.eq('farmExternalId', args.farmExternalId)
           .eq('paddockExternalId', args.paddockExternalId)
           .eq('status', 'active')
        )
        .first()

      if (activeRotation) {
        rotationId = activeRotation._id
      } else {
        // Create new rotation
        // Get farm settings for default progression settings
        const settings = await ctx.db
          .query('farmSettings')
          .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
          .first()

        const progressionSettings = settings?.progressionSettings
        const defaultCorner = progressionSettings?.defaultStartCorner !== 'auto'
          ? progressionSettings?.defaultStartCorner
          : 'NW'
        const defaultDirection = progressionSettings?.defaultDirection !== 'auto'
          ? progressionSettings?.defaultDirection
          : 'horizontal'

        // Check for previous rotation's ungrazed areas
        const previousRotation = await ctx.db
          .query('paddockRotations')
          .withIndex('by_paddock', (q: any) =>
            q.eq('farmExternalId', args.farmExternalId)
             .eq('paddockExternalId', args.paddockExternalId)
          )
          .order('desc')
          .first()

        rotationId = await ctx.db.insert('paddockRotations', {
          farmExternalId: args.farmExternalId,
          paddockExternalId: args.paddockExternalId,
          status: 'active',
          startDate: today,
          entryNdviMean: args.sectionNdviMean,
          startingCorner: (defaultCorner as 'NW' | 'NE' | 'SW' | 'SE') ?? 'NW',
          progressionDirection: (defaultDirection as 'horizontal' | 'vertical') ?? 'horizontal',
          totalSectionsGrazed: 0,
          totalAreaGrazedHa: 0,
          grazedPercentage: 0,
          ungrazedAreas: previousRotation?.ungrazedAreas,
          createdAt: now,
          updatedAt: now,
        })

        log.debug('Created new rotation on plan approval', {
          rotationId: rotationId.toString(),
          paddockExternalId: args.paddockExternalId,
        })
      }
    }

    // Get rotation to update
    const rotation = await ctx.db.get(rotationId)
    if (!rotation) {
      log.error('Rotation not found', { rotationId: rotationId.toString() })
      return
    }

    // Get previous sections to calculate sequence number
    const previousSections = await ctx.db
      .query('sectionGrazingEvents')
      .withIndex('by_rotation', (q: any) => q.eq('rotationId', rotationId))
      .collect()

    const sequenceNumber = previousSections.length + 1
    const cumulativeAreaGrazedHa = rotation.totalAreaGrazedHa + args.sectionAreaHa

    // Get paddock area for percentage calculation
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', args.farmExternalId))
      .first()

    let paddockArea = 1
    if (farm) {
      const paddock = await ctx.db
        .query('paddocks')
        .withIndex('by_farm_externalId', (q: any) =>
          q.eq('farmId', farm._id).eq('externalId', args.paddockExternalId)
        )
        .first()
      if (paddock) {
        paddockArea = paddock.area || 1
      }
    }

    const cumulativeGrazedPct = Math.min(100, (cumulativeAreaGrazedHa / paddockArea) * 100)

    // Record section event
    await ctx.db.insert('sectionGrazingEvents', {
      farmExternalId: args.farmExternalId,
      paddockExternalId: args.paddockExternalId,
      rotationId,
      planId: args.planId,
      date: today,
      sequenceNumber,
      sectionGeometry: args.sectionGeometry,
      sectionAreaHa: args.sectionAreaHa,
      centroid: sectionCentroid,
      sectionNdviMean: args.sectionNdviMean,
      progressionQuadrant: args.progressionContext?.progressionQuadrant,
      adjacentToPrevious: sequenceNumber > 1, // Assume adjacent if not first section
      cumulativeAreaGrazedHa,
      cumulativeGrazedPct,
      createdAt: now,
    })

    // Update rotation totals
    await ctx.db.patch(rotationId, {
      totalSectionsGrazed: sequenceNumber,
      totalAreaGrazedHa: cumulativeAreaGrazedHa,
      grazedPercentage: cumulativeGrazedPct,
      updatedAt: now,
    })

    // Check if rotation should be marked as complete (>90% grazed)
    if (cumulativeGrazedPct >= 90) {
      await ctx.db.patch(rotationId, {
        status: 'completed',
        endDate: today,
        exitNdviMean: args.sectionNdviMean,
        daysInRotation: Math.floor(
          (new Date(today).getTime() - new Date(rotation.startDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
        updatedAt: now,
      })

      log.debug('Rotation completed (>90% grazed)', {
        rotationId: rotationId.toString(),
        cumulativeGrazedPct,
      })
    }

    log.debug('Recorded section grazing event', {
      planId: args.planId.toString(),
      rotationId: rotationId.toString(),
      sequenceNumber,
      cumulativeGrazedPct,
    })
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
      return { existingPlanId: todayPlan._id, observations: null, grazingEvents: null, settings: null, farm: null, mostRecentGrazingEvent: null, pastures: null }
    }

    const [observations, grazingEvents, settings, farm, mostRecentGrazingEvent, pastures] = await Promise.all([
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

    return { existingPlanId: null, observations, grazingEvents, settings, farm, mostRecentGrazingEvent, pastures }
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
      primaryPasture: p.primaryPaddockExternalId,
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

// Debug: Clear all grazing events for a farm (useful for resetting test data)
export const clearGrazingEvents = mutation({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    const events = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    for (const event of events) {
      await ctx.db.delete(event._id)
    }

    return { deleted: events.length }
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


export const getAllPaddocks = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{
    id: string
    pastureId: string
    date: string
    geometry: any
    targetArea: number
    reasoning: string[]
  }[]> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    log.debug('getAllPaddocks START', { farmExternalId })
    const startTime = Date.now()

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    log.debug('getAllPaddocks found plans', { count: plans.length })

    const paddocks = []
    let plansWithPaddocks = 0
    let plansWithoutPaddocks = 0

    for (const plan of plans) {
      const hasPaddock = !!plan.sectionGeometry
      log.debug('getAllPaddocks plan', {
        planId: plan._id.toString(),
        date: plan.date,
        pastureId: plan.primaryPaddockExternalId,
        hasPaddockGeometry: hasPaddock,
        status: plan.status,
        paddockArea: plan.sectionAreaHectares,
      })

      if (hasPaddock) {
        plansWithPaddocks++
        paddocks.push({
          id: plan._id.toString(),
          pastureId: plan.primaryPaddockExternalId ?? '',
          date: plan.date,
          geometry: plan.sectionGeometry,
          targetArea: plan.sectionAreaHectares ?? 0,
          reasoning: plan.reasoning ?? [],
        })
      } else {
        plansWithoutPaddocks++
      }
    }

    const sorted = paddocks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const duration = Date.now() - startTime

    log.debug('getAllPaddocks END', {
      paddocksCount: sorted.length,
      plansWithPaddocks,
      plansWithoutPaddocks,
      duration: `${duration}ms`,
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

    const [settings, pastures, observations, farmerObservations, plans] =
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
      pastures,
      observations,
      farmerObservations,
      plans,
    }
  },
})


/**
 * Update the paddock geometry of a plan.
 * This is called when the user edits paddock vertices on the map.
 */
export const updatePlanPaddockGeometry = mutation({
  args: {
    planId: v.id('plans'),
    sectionGeometry: v.object({
      type: v.literal('Polygon'),
      coordinates: v.array(v.array(v.array(v.number()))),
    }),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    // Calculate area in hectares using the same formula as other parts of the codebase
    let sectionAreaHectares = 0
    try {
      // Simple polygon area calculation using the shoelace formula
      const coords = args.sectionGeometry.coordinates[0]
      if (coords && coords.length > 2) {
        // Convert to approximate meters (rough estimate at mid-latitudes)
        // For more accuracy, we'd need turf.js, but this is sufficient for display purposes
        const centerLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length
        const latScale = 111320 // meters per degree latitude
        const lngScale = 111320 * Math.cos(centerLat * Math.PI / 180) // meters per degree longitude

        let area = 0
        for (let i = 0; i < coords.length - 1; i++) {
          const x1 = coords[i][0] * lngScale
          const y1 = coords[i][1] * latScale
          const x2 = coords[i + 1][0] * lngScale
          const y2 = coords[i + 1][1] * latScale
          area += x1 * y2 - x2 * y1
        }
        area = Math.abs(area) / 2
        sectionAreaHectares = Math.round(area * HECTARES_PER_SQUARE_METER * 10) / 10
      }
    } catch (e) {
      log.error('Error calculating area in updatePlanPaddockGeometry', { error: String(e) })
    }

    await ctx.db.patch(args.planId, {
      sectionGeometry: args.sectionGeometry,
      sectionAreaHectares,
      status: 'modified',
      updatedAt: new Date().toISOString(),
    })

    log.debug('Updated plan paddock geometry', {
      planId: args.planId.toString(),
      sectionAreaHectares,
      status: 'modified',
    })

    return args.planId
  },
})

/**
 * Delete old plans (paddocks) older than a specified date.
 */
export const deleteOldPlans = mutation({
  args: {
    farmExternalId: v.string(),
    beforeDate: v.string(), // YYYY-MM-DD format - delete plans older than this date
  },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    let deleted = 0
    for (const plan of plans) {
      if (plan.date < args.beforeDate) {
        await ctx.db.delete(plan._id)
        deleted++
        log.debug('Deleted old plan', { planId: plan._id.toString(), date: plan.date })
      }
    }

    log.debug('deleteOldPlans completed', { deleted, beforeDate: args.beforeDate })
    return { deleted }
  },
})

/**
 * Backdate all paddocks by moving their dates back by one day.
 * Useful for demo/testing to simulate passage of time.
 */
export const backdatePaddocks = mutation({
  args: {
    farmExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    let updated = 0
    for (const plan of plans) {
      if (plan.sectionGeometry) {
        // Parse date and subtract one day
        const currentDate = new Date(plan.date)
        currentDate.setDate(currentDate.getDate() - 1)
        const newDate = currentDate.toISOString().split('T')[0]

        await ctx.db.patch(plan._id, { date: newDate })
        updated++
        log.debug('Backdated paddock', { planId: plan._id.toString(), oldDate: plan.date, newDate })
      }
    }

    log.debug('backdatePaddocks completed', { updated, farmExternalId })
    return { updated }
  },
})

/**
 * Update a single paddock's date. Dev tool for testing historical patterns.
 */
export const updatePaddockDate = mutation({
  args: {
    planId: v.id('plans'),
    date: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId)
    if (!plan) throw new Error('Plan not found')

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.')
    }

    await ctx.db.patch(args.planId, { date: args.date })
    return args.planId
  },
})

/**
 * Get rest period distribution for analytics.
 * Computes gaps between consecutive grazing events per pasture.
 */
export const getRestPeriodDistribution = query({
  args: {
    farmExternalId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    // Get all grazing events for the farm
    const grazingEvents = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    // Filter to relevant time period
    const relevantEvents = grazingEvents.filter(e => new Date(e.date) >= cutoff)

    if (relevantEvents.length < 2) {
      return {
        buckets: [
          { label: '0-7 days', count: 0, isTarget: false },
          { label: '7-14 days', count: 0, isTarget: false },
          { label: '14-21 days', count: 0, isTarget: false },
          { label: '21-30 days', count: 0, isTarget: true },
          { label: '30-45 days', count: 0, isTarget: true },
          { label: '45+ days', count: 0, isTarget: false },
        ],
        avgRestPeriod: 0,
        totalEvents: relevantEvents.length,
      }
    }

    // Group events by pasture
    const eventsByPasture = new Map<string, typeof relevantEvents>()
    for (const event of relevantEvents) {
      const existing = eventsByPasture.get(event.paddockExternalId) || []
      existing.push(event)
      eventsByPasture.set(event.paddockExternalId, existing)
    }

    // Calculate rest periods (gaps between consecutive grazing events per pasture)
    const restPeriods: number[] = []

    for (const [, pastureEvents] of eventsByPasture) {
      // Sort by date ascending
      const sorted = pastureEvents.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Calculate gaps between consecutive events
      for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i - 1].date)
        const currDate = new Date(sorted[i].date)
        const gapDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        if (gapDays > 0) {
          restPeriods.push(gapDays)
        }
      }
    }

    // Bucket the rest periods
    const buckets = [
      { label: '0-7 days', min: 0, max: 7, count: 0, isTarget: false },
      { label: '7-14 days', min: 7, max: 14, count: 0, isTarget: false },
      { label: '14-21 days', min: 14, max: 21, count: 0, isTarget: false },
      { label: '21-30 days', min: 21, max: 30, count: 0, isTarget: true },
      { label: '30-45 days', min: 30, max: 45, count: 0, isTarget: true },
      { label: '45+ days', min: 45, max: Infinity, count: 0, isTarget: false },
    ]

    for (const period of restPeriods) {
      for (const bucket of buckets) {
        if (period >= bucket.min && period < bucket.max) {
          bucket.count++
          break
        }
      }
    }

    // Calculate average
    const avgRestPeriod = restPeriods.length > 0
      ? Math.round(restPeriods.reduce((a, b) => a + b, 0) / restPeriods.length)
      : 0

    return {
      buckets: buckets.map(({ label, count, isTarget }) => ({ label, count, isTarget })),
      avgRestPeriod,
      totalEvents: relevantEvents.length,
    }
  },
})

/**
 * Record a paddock modification with rationale for AI training.
 * Called when user modifies today's AI-suggested paddock and provides feedback.
 */
export const recordPaddockModification = mutation({
  args: {
    planId: v.id('plans'),
    originalGeometry: v.object({
      type: v.literal('Polygon'),
      coordinates: v.array(v.array(v.array(v.number()))),
    }),
    modifiedGeometry: v.object({
      type: v.literal('Polygon'),
      coordinates: v.array(v.array(v.array(v.number()))),
    }),
    originalAreaHectares: v.number(),
    modifiedAreaHectares: v.number(),
    rationale: v.optional(v.string()),
    quickReasons: v.optional(v.array(v.string())),
    modifiedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    await ctx.db.insert('sectionModifications', {
      planId: args.planId,
      farmExternalId: plan.farmExternalId,
      paddockExternalId: plan.primaryPaddockExternalId ?? '',
      originalGeometry: args.originalGeometry,
      modifiedGeometry: args.modifiedGeometry,
      originalAreaHectares: args.originalAreaHectares,
      modifiedAreaHectares: args.modifiedAreaHectares,
      rationale: args.rationale,
      quickReasons: args.quickReasons,
      modifiedAt: new Date().toISOString(),
      modifiedBy: args.modifiedBy,
    })

    log.debug('Recorded paddock modification', {
      planId: args.planId.toString(),
      originalArea: args.originalAreaHectares,
      modifiedArea: args.modifiedAreaHectares,
      hasRationale: !!args.rationale,
      quickReasonsCount: args.quickReasons?.length ?? 0,
    })

    return { success: true }
  },
})

/**
 * Get paddock modifications for multiple plans.
 * Used by the History page to display feedback for modified plans.
 */
export const getPaddockModificationsByPlanIds = query({
  args: { planIds: v.array(v.id('plans')) },
  handler: async (ctx, args) => {
    const modifications = []
    for (const planId of args.planIds) {
      const mod = await ctx.db
        .query('sectionModifications')
        .withIndex('by_plan', (q: any) => q.eq('planId', planId))
        .first()
      if (mod) modifications.push(mod)
    }
    return modifications
  },
})

/**
 * Update feedback on an existing paddock modification.
 * Allows farmers to edit their rationale/quick reasons after the fact.
 */
export const updatePaddockModificationFeedback = mutation({
  args: {
    modificationId: v.id('sectionModifications'),
    rationale: v.optional(v.string()),
    quickReasons: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const modification = await ctx.db.get(args.modificationId)
    if (!modification) {
      throw new Error('Paddock modification not found')
    }

    await ctx.db.patch(args.modificationId, {
      rationale: args.rationale,
      quickReasons: args.quickReasons,
    })

    log.debug('Updated paddock modification feedback', {
      modificationId: args.modificationId.toString(),
      hasRationale: !!args.rationale,
      quickReasonsCount: args.quickReasons?.length ?? 0,
    })

    return { success: true }
  },
})

/**
 * Get plan approval statistics for AI partnership insights.
 */
export const getPlanApprovalStats = query({
  args: {
    farmExternalId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    // Get all plans for the farm
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    // Filter to relevant time period
    const relevantPlans = plans.filter(p => new Date(p.date) >= cutoff)

    const total = relevantPlans.length
    const approved = relevantPlans.filter(p => p.status === 'approved').length
    const modified = relevantPlans.filter(p => p.status === 'modified').length
    const rejected = relevantPlans.filter(p => p.status === 'rejected').length
    const pending = relevantPlans.filter(p => p.status === 'pending').length

    // Approval rate = approved / (total - pending) to exclude unreviewed plans
    const reviewed = total - pending
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0

    // Calculate weekly trend (last 4 weeks)
    const weeklyTrend: { week: string; approved: number; modified: number; rejected: number }[] = []
    const now = new Date()

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() - i * 7)

      const weekPlans = relevantPlans.filter(p => {
        const planDate = new Date(p.date)
        return planDate >= weekStart && planDate < weekEnd
      })

      weeklyTrend.push({
        week: weekStart.toISOString().split('T')[0],
        approved: weekPlans.filter(p => p.status === 'approved').length,
        modified: weekPlans.filter(p => p.status === 'modified').length,
        rejected: weekPlans.filter(p => p.status === 'rejected').length,
      })
    }

    return {
      totals: {
        total,
        approved,
        modified,
        rejected,
        pending,
        approvalRate,
      },
      weeklyTrend,
    }
  },
})


// Utility mutation for testing - update plan date
export const updatePlanDate = mutation({
  args: {
    planId: v.id("plans"),
    newDate: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.planId, {
      date: args.newDate,
      updatedAt: new Date().toISOString(),
    })
    return { success: true }
  },
})

// Dev utility: Reset all paddock grazing data for a farm
// Clears forecasts, sections, rotations, and daily briefs - returns paddocks to clean state
export const resetAllPaddockGrazingData = mutation({
  args: {
    farmExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    const results = {
      paddockForecasts: 0,
      sectionGrazingEvents: 0,
      paddockRotations: 0,
      dailyPlans: 0,
      dailyBriefs: 0,
      plans: 0,
      grazingEvents: 0,
    }

    // Delete paddockForecasts
    const forecasts = await ctx.db
      .query('paddockForecasts')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()
    for (const forecast of forecasts) {
      await ctx.db.delete(forecast._id)
      results.paddockForecasts++
    }

    // Delete sectionGrazingEvents
    const sectionEvents = await ctx.db
      .query('sectionGrazingEvents')
      .filter((q: any) => q.eq(q.field('farmExternalId'), farmExternalId))
      .collect()
    for (const event of sectionEvents) {
      await ctx.db.delete(event._id)
      results.sectionGrazingEvents++
    }

    // Delete paddockRotations
    const rotations = await ctx.db
      .query('paddockRotations')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()
    for (const rotation of rotations) {
      await ctx.db.delete(rotation._id)
      results.paddockRotations++
    }

    // Delete dailyPlans
    const dailyPlans = await ctx.db
      .query('dailyPlans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()
    for (const plan of dailyPlans) {
      await ctx.db.delete(plan._id)
      results.dailyPlans++
    }

    // Delete dailyBriefs
    const dailyBriefs = await ctx.db
      .query('dailyBriefs')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()
    for (const brief of dailyBriefs) {
      await ctx.db.delete(brief._id)
      results.dailyBriefs++
    }

    // Delete plans (legacy)
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()
    for (const plan of plans) {
      await ctx.db.delete(plan._id)
      results.plans++
    }

    // Delete grazingEvents
    const grazingEvents = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()
    for (const event of grazingEvents) {
      await ctx.db.delete(event._id)
      results.grazingEvents++
    }

    log.debug('Reset all paddock grazing data', {
      farmExternalId,
      ...results,
    })

    return results
  },
})

// Dev utility: Shift all plan dates back by one day for a paddock
// This allows testing progressive section generation by making "today's" plan become "yesterday's"
export const shiftPlanDatesBack = mutation({
  args: {
    farmExternalId: v.optional(v.string()),
    paddockExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const now = new Date().toISOString()

    // Get all plans for this farm
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    // Filter by paddock if specified
    const targetPlans = args.paddockExternalId
      ? plans.filter((p: any) => p.primaryPaddockExternalId === args.paddockExternalId)
      : plans

    let updatedCount = 0
    for (const plan of targetPlans) {
      // Shift date back by one day
      const currentDate = new Date(plan.date)
      currentDate.setDate(currentDate.getDate() - 1)
      const newDate = currentDate.toISOString().split('T')[0]

      await ctx.db.patch(plan._id, {
        date: newDate,
        updatedAt: now,
      })
      updatedCount++
    }

    log.debug('Shifted plan dates back', {
      farmExternalId,
      paddockExternalId: args.paddockExternalId,
      plansUpdated: updatedCount,
    })

    return { success: true, plansUpdated: updatedCount }
  },
})
