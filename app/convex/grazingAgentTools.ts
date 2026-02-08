import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { DEFAULT_FARM_EXTERNAL_ID } from './seedData'
import area from '@turf/area'
import difference from '@turf/difference'
import intersect from '@turf/intersect'
import { featureCollection } from '@turf/helpers'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { HECTARES_PER_SQUARE_METER } from './lib/areaConstants'
import { createLogger } from './lib/logger'
// NOTE: Braintrust logging is done at the action level (grazingAgentDirect.ts)
// Mutations cannot use Node.js APIs, so we don't import Braintrust here

const log = createLogger('grazingAgentTools')

interface PastureData {
  externalId: string
  name: string
  area: number
  ndviMean: number
  ndviStd: number
  ndviTrend: string
  restDays: number
  daysGrazed: number
  totalPlanned: number
  geometry: any
  latestObservation: {
    date: string
    ndviMean: number
    ndviStd: number
    cloudFreePct: number
  } | null
}

interface PaddockWithJustification {
  id: string
  date: string
  geometry: any
  area: number
  justification: string
}

interface PastureSummary {
  externalId: string
  name: string
  area: number
  ndviMean: number
  restDays: number
  lastGrazed: string | null
  status: string
  geometry: any
  dataQualityWarning: string | null
}

export const getAllPasturesWithObservations = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<PastureSummary[]> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
      .first()

    if (!farm) {
      return []
    }

    const pastures = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()

    if (pastures.length === 0) {
      return []
    }

    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    const grazingEvents = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    // Get farm settings for cloudCoverTolerance
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .first()

    // cloudCoverTolerance is stored as percentage (0-100), convert to 0-1
    const minCloudFreePct = (settings?.cloudCoverTolerance ?? 50) / 100

    const calculateAreaHectares = (geometry: any): number => {
      try {
        const sqMeters = area(geometry)
        return Number.isFinite(sqMeters) ? Math.round((sqMeters * HECTARES_PER_SQUARE_METER) * 10) / 10 : 0
      } catch {
        return 0
      }
    }

    return pastures.map((pasture: any) => {
      const pastureObservations = observations.filter(
        (o: any) => o.paddockExternalId === pasture.externalId
      )

      // Sort observations by date descending
      pastureObservations.sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      const latestObservation = pastureObservations[0] ?? null

      // Find latest reliable observation (meeting quality threshold)
      const reliableObservation = pastureObservations.find(
        (o: any) => o.isValid && o.cloudFreePct >= minCloudFreePct
      ) ?? null

      // Determine if current data is reliable
      const isCurrentReliable = latestObservation &&
        latestObservation.cloudFreePct >= minCloudFreePct &&
        latestObservation.isValid

      // Use reliable observation for NDVI if current is unreliable
      const observationToUse = isCurrentReliable ? latestObservation : (reliableObservation ?? latestObservation)

      // Calculate days since reliable observation
      const daysSinceReliable = reliableObservation
        ? Math.floor((Date.now() - new Date(reliableObservation.date).getTime()) / (1000 * 60 * 60 * 24))
        : null

      // Generate data quality warning if using fallback data
      let dataQualityWarning: string | null = null
      if (!isCurrentReliable && reliableObservation) {
        dataQualityWarning = `Using ${daysSinceReliable}-day-old data (recent imagery cloudy)`
      } else if (!isCurrentReliable && !reliableObservation && latestObservation) {
        const cloudPct = Math.round((1 - latestObservation.cloudFreePct) * 100)
        dataQualityWarning = `Latest observation has ${cloudPct}% cloud cover - no reliable historical data`
      }

      const pastureGrazingEvents = grazingEvents.filter(
        (e: any) => e.paddockExternalId === pasture.externalId
      )

      const mostRecentEvent = pastureGrazingEvents.length > 0
        ? pastureGrazingEvents.reduce((latest: any, event: any) => {
            if (!latest || new Date(event.date) > new Date(latest.date)) {
              return event
            }
            return latest
          }, null)
        : null

      let restDays = 0
      if (mostRecentEvent?.date && observationToUse?.date) {
        try {
          const lastDate = new Date(mostRecentEvent.date)
          const obsDate = new Date(observationToUse.date)
          restDays = Math.max(0, Math.floor((obsDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
        } catch {
          restDays = 0
        }
      }

      const ndviMean = observationToUse?.ndviMean ?? pasture.ndvi ?? 0

      let status = 'recovering'
      if (ndviMean >= 0.4 && restDays >= 21) {
        status = 'ready'
      } else if (ndviMean >= 0.4 && restDays >= 14) {
        status = 'almost_ready'
      } else if (restDays < 7) {
        status = 'grazed'
      }

      return {
        externalId: pasture.externalId,
        name: pasture.name,
        area: pasture.area || calculateAreaHectares(pasture.geometry),
        ndviMean,
        restDays,
        lastGrazed: mostRecentEvent?.date || null,
        status,
        geometry: pasture.geometry,
        dataQualityWarning,
      }
    }).sort((a: any, b: any) => b.ndviMean - a.ndviMean)
  },
})

export const getPastureData = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<PastureData | null> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
      .first()

    if (!farm) {
      return null
    }

    const pastures = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()

    if (pastures.length === 0) {
      return null
    }

    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    const grazingEvents = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    const mostRecentGrazingEvent = grazingEvents.length > 0
      ? grazingEvents.reduce((latest: any, event: any) => {
          if (!latest || new Date(event.date) > new Date(latest.date)) {
            return event
          }
          return latest
        }, null)
      : null

    const activePastureId = mostRecentGrazingEvent?.paddockExternalId || pastures[0]?.externalId

    const activePasture = pastures.find((p: any) => p.externalId === activePastureId)

    if (!activePasture) {
      return null
    }

    const pastureObservations = observations.filter(
      (o: any) => o.paddockExternalId === activePastureId
    )

    const latestObservation = pastureObservations.length > 0
      ? pastureObservations.reduce((latest: any, obs: any) => {
          if (!latest || new Date(obs.date) > new Date(latest.date)) {
            return obs
          }
          return latest
        }, null)
      : null

    const pastureGrazingEvents = grazingEvents.filter(
      (e: any) => e.paddockExternalId === activePastureId
    )

    const daysGrazed = pastureGrazingEvents.length

    const calculateAreaHectares = (geometry: any): number => {
      try {
        const sqMeters = area(geometry)
        return Number.isFinite(sqMeters) ? Math.round((sqMeters * HECTARES_PER_SQUARE_METER) * 10) / 10 : 0
      } catch {
        return 0
      }
    }

    let ndviTrend = 'stable'
    if (pastureObservations.length >= 2) {
      const sorted = [...pastureObservations].sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      const prev = sorted[sorted.length - 2]?.ndviMean || 0
      const curr = sorted[sorted.length - 1]?.ndviMean || 0
      const diff = curr - prev
      if (diff > 0.02) ndviTrend = 'increasing'
      else if (diff < -0.02) ndviTrend = 'decreasing'
    }

    // Get the most recent grazing event for THIS specific pasture
    const mostRecentPastureEvent = pastureGrazingEvents.length > 0
      ? pastureGrazingEvents.reduce((latest: any, event: any) => {
          if (!latest || new Date(event.date) > new Date(latest.date)) {
            return event
          }
          return latest
        }, null)
      : null

    const lastGrazed = mostRecentPastureEvent?.date
    let restDays = 0
    if (lastGrazed && latestObservation) {
      try {
        const lastDate = new Date(lastGrazed)
        const obsDate = new Date(latestObservation.date)
        restDays = Math.max(0, Math.floor((obsDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
      } catch {
        restDays = 0
      }
    }

    return {
      externalId: activePasture.externalId,
      name: activePasture.name,
      area: activePasture.area || calculateAreaHectares(activePasture.geometry),
      ndviMean: activePasture.ndvi || (latestObservation?.ndviMean ?? 0.45),
      ndviStd: latestObservation?.ndviStd ?? 0.08,
      ndviTrend,
      restDays,
      daysGrazed,
      totalPlanned: 4,
      geometry: activePasture.geometry,
      latestObservation: latestObservation ? {
        date: latestObservation.date,
        ndviMean: latestObservation.ndviMean,
        ndviStd: latestObservation.ndviStd,
        cloudFreePct: latestObservation.cloudFreePct,
      } : null,
    }
  },
})

export const getPreviousPaddocks = query({
  args: { farmExternalId: v.optional(v.string()), paddockId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<PaddockWithJustification[]> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const today = new Date().toISOString().split('T')[0]

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    const targetPastureId = args.paddockId

    const paddocksWithJustification: PaddockWithJustification[] = []

    for (const plan of plans) {
      // Only include paddocks from previous days (exclude today to avoid overlap with current plan being generated)
      // Also exclude rejected plans as they weren't executed
      if (
        plan.sectionGeometry &&
        plan.primaryPaddockExternalId === targetPastureId &&
        plan.date !== today &&
        plan.status !== 'rejected'
      ) {
        paddocksWithJustification.push({
          id: plan._id.toString(),
          date: plan.date,
          geometry: plan.sectionGeometry,
          area: plan.sectionAreaHectares || 0,
          justification: plan.sectionJustification || 'No justification provided',
        })
      }
    }

    return paddocksWithJustification.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  },
})

export const getFarmSettings = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .first()

    if (!settings) {
      return {
        minNDVIThreshold: 0.40,
        minRestPeriod: 21,
        defaultPaddockPct: 0.20,
      }
    }

    return {
      minNDVIThreshold: settings.minNDVIThreshold,
      minRestPeriod: settings.minRestPeriod,
      defaultPaddockPct: 0.20,
    }
  },
})

export const createPlanWithPaddock = mutation({
  args: {
    farmExternalId: v.string(),
    targetPaddockId: v.string(),
    sectionGeometry: v.optional(v.any()),
    sectionAreaHectares: v.optional(v.number()),
    sectionCentroid: v.optional(v.array(v.number())),
    sectionAvgNdvi: v.optional(v.number()),
    sectionJustification: v.string(),
    paddockGrazedPercentage: v.optional(v.number()),
    // LLM tool calls occasionally omit this field or embed it in sectionJustification.
    // Keep this optional and recover it in the handler to avoid hard failures.
    confidence: v.optional(v.number()),
    reasoning: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // NOTE: Braintrust logging is done at the action level (grazingAgentDirect.ts)
    // This mutation is called from actions, so tool execution is logged there

    log.debug('createPlanWithPaddock START', {
        farmExternalId: args.farmExternalId,
        targetPaddockId: args.targetPaddockId,
        hasPaddockGeometry: !!args.sectionGeometry,
        sectionAreaHectares: args.sectionAreaHectares,
        confidence: args.confidence,
        today,
      })

    // CRITICAL: Animals must eat somewhere - paddock geometry (daily strip) is required
    if (!args.sectionGeometry) {
      throw new Error('sectionGeometry is REQUIRED. Animals must graze somewhere every day. The agent must always create a paddock, even if conditions are not ideal. Please ensure the agent creates a paddock geometry in the target pasture.')
    }

    const extractConfidenceFromJustification = (
      justification: string
    ): { confidence?: number; justification: string } => {
      // Common failure mode: the model appends something like:
      // </sectionJustification>\n<parameter name="confidence">0.55
      const match = justification.match(/<parameter\s+name=["']confidence["']>\s*([0-9]*\.?[0-9]+)/i)
      if (!match) {
        return { justification }
      }

      const extracted = Number.parseFloat(match[1] ?? '')
      const cleaned = justification
        .replace(/<\/sectionJustification>/gi, '')
        .replace(/<parameter\s+name=["']confidence["'][\s\S]*$/i, '')
        .trim()

      return {
        confidence: Number.isFinite(extracted) ? extracted : undefined,
        justification: cleaned,
      }
    }

    const normalizeConfidenceScore = (value: number | undefined): number => {
      // App currently treats confidence as a 0-100 score (e.g. LOW_CONFIDENCE_THRESHOLD = 70).
      // The agent often produces 0-1 floats; convert to percent when appropriate.
      if (value === undefined || !Number.isFinite(value)) return 50
      if (value >= 0 && value <= 1) return Math.round(value * 100)
      return value
    }

    const extracted = extractConfidenceFromJustification(args.sectionJustification)
    const confidenceScore = normalizeConfidenceScore(args.confidence ?? extracted.confidence)
    const paddockJustification = extracted.justification

    // Validate and clip paddock geometry if provided
    let finalPaddockGeometry = args.sectionGeometry
    if (args.sectionGeometry) {
      // Get pasture to validate paddock is within bounds
      const farm = await ctx.db
        .query('farms')
        .withIndex('by_externalId', (q: any) => q.eq('externalId', args.farmExternalId))
        .first()

      if (!farm) {
        throw new Error(`Farm not found: ${args.farmExternalId}`)
      }

      const pasture = await ctx.db
        .query('paddocks')
        .withIndex('by_farm_externalId', (q: any) =>
          q.eq('farmId', farm._id).eq('externalId', args.targetPaddockId)
        )
        .first()

      if (!pasture) {
        throw new Error(`Pasture not found: ${args.targetPaddockId}`)
      }

      // Convert paddock geometry (daily strip) to Feature<Polygon>
      const paddockFeature: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: args.sectionGeometry,
      }

      // Convert pasture geometry to Feature<Polygon> (it's stored as Feature)
      const pastureFeature = pasture.geometry as Feature<Polygon>

      // Validate: Paddock must be within pasture bounds
      // Check by intersecting paddock with pasture - if intersection area equals paddock area, it's fully within
      const intersection = intersect(featureCollection([paddockFeature, pastureFeature]))

      if (!intersection) {
        throw new Error(`Paddock geometry is completely outside pasture ${args.targetPaddockId} boundaries`)
      }

      const paddockArea = area(paddockFeature)
      const intersectionArea = area(intersection as Feature<Polygon>)
      const areaRatio = intersectionArea / paddockArea

      // If paddock extends outside pasture, clip it to pasture boundary
      // This handles LLM imprecision in coordinate generation
      if (areaRatio < 0.99) {

        // Use intersection as the clipped geometry
        // intersection is guaranteed to exist here (we checked above)
        // Since we can calculate intersectionArea, the intersection must have valid geometry
        const intersectionFeature = intersection as Feature<Polygon>
        const intersectionGeometry = intersectionFeature?.geometry

        if (intersectionGeometry && intersectionGeometry.coordinates && intersectionGeometry.coordinates.length > 0) {
          // Use the intersection geometry as the clipped paddock
          // Cast to Polygon since we know it's the intersection of two polygons
          finalPaddockGeometry = intersectionGeometry as Polygon

          log.debug(`Clipped paddock geometry: ${Math.round(areaRatio * 100)}% was within pasture, using intersection`, { geometryType: intersectionGeometry.type })
        } else {
          throw new Error(`Paddock geometry extends outside pasture ${args.targetPaddockId} boundaries (${Math.round(areaRatio * 100)}% within pasture) and cannot be clipped - intersection has no valid geometry`)
        }
      }

      // Validate: Paddock must not overlap with previous paddocks
      // Fetch previous paddocks directly (can't call query from mutation)
      const allPlans = await ctx.db
        .query('plans')
        .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
        .collect()

      const previousPaddocks = allPlans
        .filter((plan: any) =>
          plan.sectionGeometry &&
          plan.primaryPaddockExternalId === args.targetPaddockId &&
          plan.date !== today &&
          plan.status !== 'rejected'
        )
        .map((plan: any) => ({
          date: plan.date,
          geometry: plan.sectionGeometry,
        }))

      const pickLargestPolygon = (geometry: Polygon | MultiPolygon): Polygon | null => {
        if (geometry.type === 'Polygon') {
          return geometry
        }
        if (!geometry.coordinates || geometry.coordinates.length === 0) {
          return null
        }
        let best: Polygon | null = null
        let bestArea = 0
        for (const coords of geometry.coordinates) {
          const candidate: Polygon = { type: 'Polygon', coordinates: coords }
          const candidateArea = area({
            type: 'Feature',
            properties: {},
            geometry: candidate,
          })
          if (candidateArea > bestArea) {
            bestArea = candidateArea
            best = candidate
          }
        }
        return best
      }

      let adjustedPaddockGeometry = finalPaddockGeometry as Polygon
      let overlapAdjusted = false

      for (const prevPaddock of previousPaddocks) {
        const currentFeature: Feature<Polygon> = {
          type: 'Feature',
          properties: {},
          geometry: adjustedPaddockGeometry,
        }
        const prevFeature: Feature<Polygon> = {
          type: 'Feature',
          properties: {},
          geometry: prevPaddock.geometry,
        }

        const overlap = intersect(featureCollection([currentFeature, prevFeature]))
        if (overlap) {
          const overlapArea = area(overlap as Feature<Polygon>)
          const currentArea = area(currentFeature)
          const overlapPercent = (overlapArea / currentArea) * 100

          // Allow small overlaps due to LLM coordinate imprecision (<= 5%)
          const ALLOWED_OVERLAP_PERCENT = 5
          if (overlapPercent > ALLOWED_OVERLAP_PERCENT) {
            const differenceResult = difference(featureCollection([currentFeature, prevFeature]))
            const differenceGeometry = differenceResult?.geometry as Polygon | MultiPolygon | undefined
            const largestPolygon = differenceGeometry ? pickLargestPolygon(differenceGeometry) : null

            if (!largestPolygon) {
              throw new Error(`Paddock geometry overlaps with previous paddock from ${prevPaddock.date} (${Math.round(overlapPercent)}% overlap) and could not be adjusted`)
            }

            const adjustedArea = area({
              type: 'Feature',
              properties: {},
              geometry: largestPolygon,
            })

            if (!Number.isFinite(adjustedArea) || adjustedArea === 0) {
              throw new Error(`Paddock geometry overlaps with previous paddock from ${prevPaddock.date} (${Math.round(overlapPercent)}% overlap) and produced an invalid adjusted paddock`)
            }

            adjustedPaddockGeometry = largestPolygon
            overlapAdjusted = true
          } else if (overlapPercent > 0) {
            // Log allowed overlap for debugging
            log.debug(`Allowing ${overlapPercent.toFixed(1)}% overlap (within ${ALLOWED_OVERLAP_PERCENT}% tolerance)`)
          }
        }
      }

      finalPaddockGeometry = adjustedPaddockGeometry

      log.debug('Paddock validation passed', {
        withinPasture: true,
        noOverlaps: true,
        previousPaddocksCount: previousPaddocks.length,
        overlapAdjusted,
      })
    }

    const existingPlan = await ctx.db
      .query('plans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    const todayPlan = existingPlan.find((p: any) => p.date === today)

    if (todayPlan) {
      log.debug('Patching existing plan', {
        planId: todayPlan._id.toString(),
        date: todayPlan.date,
        currentStatus: todayPlan.status,
        hasPaddockGeometry: !!args.sectionGeometry,
        targetPaddockId: args.targetPaddockId,
        confidenceScore,
      })

      // Build patch object, only including optional fields when they have values
      const patchData: any = {
        primaryPaddockExternalId: args.targetPaddockId,
        confidenceScore,
        reasoning: args.reasoning,
        sectionAreaHectares: args.sectionAreaHectares || 0,
        updatedAt: now,
      }

      // Only include sectionGeometry if it's defined (not null/undefined)
      // Use finalPaddockGeometry (may be clipped version)
      if (finalPaddockGeometry) {
        patchData.sectionGeometry = finalPaddockGeometry
      }
      if (args.sectionCentroid) {
        patchData.sectionCentroid = args.sectionCentroid
      }
      if (args.sectionAvgNdvi !== undefined && args.sectionAvgNdvi !== null) {
        patchData.sectionAvgNdvi = args.sectionAvgNdvi
      }
      if (paddockJustification) {
        patchData.sectionJustification = paddockJustification
      }
      if (args.paddockGrazedPercentage !== undefined && args.paddockGrazedPercentage !== null) {
        patchData.paddockGrazedPercentage = args.paddockGrazedPercentage
      }

      await ctx.db.patch(todayPlan._id, patchData)
      log.debug('Plan patched successfully', { planId: todayPlan._id.toString() })
      return todayPlan._id
    }

    log.debug('Creating NEW plan', {
      hasPaddockGeometry: !!args.sectionGeometry,
      targetPaddockId: args.targetPaddockId,
      confidenceScore,
      sectionAreaHectares: args.sectionAreaHectares,
    })

    // Build insert object, only including optional fields when they have values
    const insertData: any = {
      farmExternalId: args.farmExternalId,
      date: today,
      primaryPaddockExternalId: args.targetPaddockId,
      alternativePaddockExternalIds: [],
      confidenceScore,
      reasoning: args.reasoning,
      status: 'pending',
      sectionAreaHectares: args.sectionAreaHectares || 0,
      createdAt: now,
      updatedAt: now,
    }

    // Only include optional fields if they have values (not null/undefined)
    // Use finalPaddockGeometry (may be clipped version)
    if (finalPaddockGeometry) {
      insertData.sectionGeometry = finalPaddockGeometry
    }
    if (args.sectionCentroid) {
      insertData.sectionCentroid = args.sectionCentroid
    }
    if (args.sectionAvgNdvi !== undefined && args.sectionAvgNdvi !== null) {
      insertData.sectionAvgNdvi = args.sectionAvgNdvi
    }
    if (paddockJustification) {
      insertData.sectionJustification = paddockJustification
    }
    if (args.paddockGrazedPercentage !== undefined && args.paddockGrazedPercentage !== null) {
      insertData.paddockGrazedPercentage = args.paddockGrazedPercentage
    }

    const newPlanId = await ctx.db.insert('plans', insertData)
    log.debug('Plan created successfully', {
      planId: newPlanId.toString(),
      date: today,
      hasPaddockGeometry: !!args.sectionGeometry,
      targetPaddockId: args.targetPaddockId,
    })
    return newPlanId
  },
})

export const finalizePlan = mutation({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<string | null> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const today = new Date().toISOString().split('T')[0]

    // NOTE: Braintrust logging is done at the action level (grazingAgentDirect.ts)
    // This mutation is called from actions, so tool execution is logged there

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    const todayPlan = plans.find((p: any) => p.date === today)

    if (!todayPlan) {
      return null
    }

    await ctx.db.patch(todayPlan._id, {
      status: 'pending',
      updatedAt: new Date().toISOString(),
    })

    return todayPlan._id.toString()
  },
})

export const calculatePastureGrazedPercentage = query({
  args: { farmExternalId: v.optional(v.string()), paddockId: v.string() },
  handler: async (ctx, args): Promise<number> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
      .first()

    if (!farm) return 0

    const pasture = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q: any) =>
        q.eq('farmId', farm._id).eq('externalId', args.paddockId)
      )
      .first()

    if (!pasture) return 0

    const calculateAreaHectares = (geometry: any): number => {
      try {
        const sqMeters = area(geometry)
        return Number.isFinite(sqMeters) ? Math.round((sqMeters * HECTARES_PER_SQUARE_METER) * 10) / 10 : 0
      } catch {
        return 0
      }
    }

    const pastureArea = pasture.area || calculateAreaHectares(pasture.geometry)
    if (pastureArea === 0) return 0

    const today = new Date().toISOString().split('T')[0]
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    let totalGrazedArea = 0
    for (const plan of plans) {
      // Only count paddocks from previous days (exclude today's plan which may be regenerated)
      // Also exclude rejected plans as they weren't executed
      if (
        plan.primaryPaddockExternalId === args.paddockId &&
        plan.sectionGeometry &&
        plan.date !== today &&
        plan.status !== 'rejected'
      ) {
        totalGrazedArea += plan.sectionAreaHectares || calculateAreaHectares(plan.sectionGeometry)
      }
    }

    return Math.round((totalGrazedArea / pastureArea) * 100)
  },
})
