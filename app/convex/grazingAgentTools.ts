import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { DEFAULT_FARM_EXTERNAL_ID } from './seedData'
import area from '@turf/area'
import difference from '@turf/difference'
import intersect from '@turf/intersect'
import { featureCollection } from '@turf/helpers'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
// NOTE: Braintrust logging is done at the action level (grazingAgentDirect.ts)
// Mutations cannot use Node.js APIs, so we don't import Braintrust here

const HECTARES_PER_SQUARE_METER = 1 / 10000

interface PaddockData {
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

interface SectionWithJustification {
  id: string
  date: string
  geometry: any
  area: number
  justification: string
}

interface PaddockSummary {
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

export const getAllPaddocksWithObservations = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<PaddockSummary[]> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID

    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
      .first()

    if (!farm) {
      return []
    }

    const paddocks = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()

    if (paddocks.length === 0) {
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

    return paddocks.map((paddock: any) => {
      const paddockObservations = observations.filter(
        (o: any) => o.paddockExternalId === paddock.externalId
      )

      // Sort observations by date descending
      paddockObservations.sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      const latestObservation = paddockObservations[0] ?? null

      // Find latest reliable observation (meeting quality threshold)
      const reliableObservation = paddockObservations.find(
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

      const paddockGrazingEvents = grazingEvents.filter(
        (e: any) => e.paddockExternalId === paddock.externalId
      )

      const mostRecentEvent = paddockGrazingEvents.length > 0
        ? paddockGrazingEvents.reduce((latest: any, event: any) => {
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

      const ndviMean = observationToUse?.ndviMean ?? paddock.ndvi ?? 0

      let status = 'recovering'
      if (ndviMean >= 0.4 && restDays >= 21) {
        status = 'ready'
      } else if (ndviMean >= 0.4 && restDays >= 14) {
        status = 'almost_ready'
      } else if (restDays < 7) {
        status = 'grazed'
      }

      return {
        externalId: paddock.externalId,
        name: paddock.name,
        area: paddock.area || calculateAreaHectares(paddock.geometry),
        ndviMean,
        restDays,
        lastGrazed: mostRecentEvent?.date || null,
        status,
        geometry: paddock.geometry,
        dataQualityWarning,
      }
    }).sort((a: any, b: any) => b.ndviMean - a.ndviMean)
  },
})

export const getPaddockData = query({
  args: { farmExternalId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<PaddockData | null> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
      .first()

    if (!farm) {
      return null
    }

    const paddocks = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()

    if (paddocks.length === 0) {
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

    const activePaddockId = mostRecentGrazingEvent?.paddockExternalId || paddocks[0]?.externalId

    const activePaddock = paddocks.find((p: any) => p.externalId === activePaddockId)

    if (!activePaddock) {
      return null
    }

    const paddockObservations = observations.filter(
      (o: any) => o.paddockExternalId === activePaddockId
    )
    
    const latestObservation = paddockObservations.length > 0
      ? paddockObservations.reduce((latest: any, obs: any) => {
          if (!latest || new Date(obs.date) > new Date(latest.date)) {
            return obs
          }
          return latest
        }, null)
      : null

    const paddockGrazingEvents = grazingEvents.filter(
      (e: any) => e.paddockExternalId === activePaddockId
    )

    const daysGrazed = paddockGrazingEvents.length

    const calculateAreaHectares = (geometry: any): number => {
      try {
        const sqMeters = area(geometry)
        return Number.isFinite(sqMeters) ? Math.round((sqMeters * HECTARES_PER_SQUARE_METER) * 10) / 10 : 0
      } catch {
        return 0
      }
    }

    let ndviTrend = 'stable'
    if (paddockObservations.length >= 2) {
      const sorted = [...paddockObservations].sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      const prev = sorted[sorted.length - 2]?.ndviMean || 0
      const curr = sorted[sorted.length - 1]?.ndviMean || 0
      const diff = curr - prev
      if (diff > 0.02) ndviTrend = 'increasing'
      else if (diff < -0.02) ndviTrend = 'decreasing'
    }

    // Get the most recent grazing event for THIS specific paddock
    const mostRecentPaddockEvent = paddockGrazingEvents.length > 0
      ? paddockGrazingEvents.reduce((latest: any, event: any) => {
          if (!latest || new Date(event.date) > new Date(latest.date)) {
            return event
          }
          return latest
        }, null)
      : null

    const lastGrazed = mostRecentPaddockEvent?.date
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
      externalId: activePaddock.externalId,
      name: activePaddock.name,
      area: activePaddock.area || calculateAreaHectares(activePaddock.geometry),
      ndviMean: activePaddock.ndvi || (latestObservation?.ndviMean ?? 0.45),
      ndviStd: latestObservation?.ndviStd ?? 0.08,
      ndviTrend,
      restDays,
      daysGrazed,
      totalPlanned: 4,
      geometry: activePaddock.geometry,
      latestObservation: latestObservation ? {
        date: latestObservation.date,
        ndviMean: latestObservation.ndviMean,
        ndviStd: latestObservation.ndviStd,
        cloudFreePct: latestObservation.cloudFreePct,
      } : null,
    }
  },
})

export const getPreviousSections = query({
  args: { farmExternalId: v.optional(v.string()), paddockId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<SectionWithJustification[]> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    const today = new Date().toISOString().split('T')[0]
    
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    const targetPaddockId = args.paddockId

    const sectionsWithJustification: SectionWithJustification[] = []

    for (const plan of plans) {
      // Only include sections from previous days (exclude today to avoid overlap with current plan being generated)
      // Also exclude rejected plans as they weren't executed
      if (
        plan.sectionGeometry && 
        plan.primaryPaddockExternalId === targetPaddockId &&
        plan.date !== today &&
        plan.status !== 'rejected'
      ) {
        sectionsWithJustification.push({
          id: plan._id.toString(),
          date: plan.date,
          geometry: plan.sectionGeometry,
          area: plan.sectionAreaHectares || 0,
          justification: plan.sectionJustification || 'No justification provided',
        })
      }
    }

    return sectionsWithJustification.sort(
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
        defaultSectionPct: 0.20,
      }
    }

    return {
      minNDVIThreshold: settings.minNDVIThreshold,
      minRestPeriod: settings.minRestPeriod,
      defaultSectionPct: 0.20,
    }
  },
})

export const createPlanWithSection = mutation({
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
    
    console.log('[createPlanWithSection] START:', {
        farmExternalId: args.farmExternalId,
        targetPaddockId: args.targetPaddockId,
        hasSectionGeometry: !!args.sectionGeometry,
        sectionAreaHectares: args.sectionAreaHectares,
        confidence: args.confidence,
        today,
      })
      
    // CRITICAL: Animals must eat somewhere - sectionGeometry is required
    if (!args.sectionGeometry) {
      throw new Error('sectionGeometry is REQUIRED. Animals must graze somewhere every day. The agent must always create a section, even if conditions are not ideal. Please ensure the agent creates a section geometry in the target paddock.')
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
    const sectionJustification = extracted.justification

    // Validate and clip section geometry if provided
    let finalSectionGeometry = args.sectionGeometry
    if (args.sectionGeometry) {
      // Get paddock to validate section is within bounds
      const farm = await ctx.db
        .query('farms')
        .withIndex('by_externalId', (q: any) => q.eq('externalId', args.farmExternalId))
        .first()

      if (!farm) {
        throw new Error(`Farm not found: ${args.farmExternalId}`)
      }

      const paddock = await ctx.db
        .query('paddocks')
        .withIndex('by_farm_externalId', (q: any) => 
          q.eq('farmId', farm._id).eq('externalId', args.targetPaddockId)
        )
        .first()

      if (!paddock) {
        throw new Error(`Paddock not found: ${args.targetPaddockId}`)
      }

      // Convert section geometry to Feature<Polygon>
      const sectionFeature: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: args.sectionGeometry,
      }

      // Convert paddock geometry to Feature<Polygon> (it's stored as Feature)
      const paddockFeature = paddock.geometry as Feature<Polygon>

      // Validate: Section must be within paddock bounds
      // Check by intersecting section with paddock - if intersection area equals section area, it's fully within
      const intersection = intersect(featureCollection([sectionFeature, paddockFeature]))
      
      // #region debug log
      fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentTools.ts:455',message:'Section validation start',data:{targetPaddockId:args.targetPaddockId,hasIntersection:!!intersection,sectionGeometryType:args.sectionGeometry?.type,paddockGeometryType:paddock.geometry?.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      if (!intersection) {
        // #region debug log
        fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentTools.ts:457',message:'Section completely outside paddock',data:{targetPaddockId:args.targetPaddockId,sectionCoords:JSON.stringify(args.sectionGeometry?.coordinates?.[0]).substring(0,200),paddockCoords:JSON.stringify((paddock.geometry as Feature<Polygon>)?.geometry?.coordinates?.[0]||[]).substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        throw new Error(`Section geometry is completely outside paddock ${args.targetPaddockId} boundaries`)
      }

      const sectionArea = area(sectionFeature)
      const intersectionArea = area(intersection as Feature<Polygon>)
      const areaRatio = intersectionArea / sectionArea

      // #region debug log
      fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentTools.ts:465',message:'Section containment check',data:{targetPaddockId:args.targetPaddockId,sectionArea,intersectionArea,areaRatio,areaRatioPercent:Math.round(areaRatio*100),requiredPercent:99},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // If section extends outside paddock, clip it to paddock boundary
      // This handles LLM imprecision in coordinate generation
      if (areaRatio < 0.99) {
        // #region debug log
        fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentTools.ts:470',message:'Section extends outside - clipping to paddock',data:{targetPaddockId:args.targetPaddockId,areaRatio,areaRatioPercent:Math.round(areaRatio*100),originalArea:sectionArea,intersectionType:intersection?.type,intersectionGeometryType:intersection?.geometry?.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // Use intersection as the clipped geometry
        // intersection is guaranteed to exist here (we checked at line 462)
        // Since we can calculate intersectionArea, the intersection must have valid geometry
        const intersectionFeature = intersection as Feature<Polygon>
        const intersectionGeometry = intersectionFeature?.geometry
        
        if (intersectionGeometry && intersectionGeometry.coordinates && intersectionGeometry.coordinates.length > 0) {
          // Use the intersection geometry as the clipped section
          // Cast to Polygon since we know it's the intersection of two polygons
          finalSectionGeometry = intersectionGeometry as Polygon
          const clippedArea = area(intersectionFeature)
          
          // #region debug log
          fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentTools.ts:477',message:'Section clipped successfully',data:{targetPaddockId:args.targetPaddockId,originalArea:sectionArea,clippedArea,areaReduction:((sectionArea-clippedArea)/sectionArea*100).toFixed(1)+'%',geometryType:intersectionGeometry.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          
          console.log(`[createPlanWithSection] Clipped section geometry: ${Math.round(areaRatio * 100)}% was within paddock, using intersection (type: ${intersectionGeometry.type})`)
        } else {
          // #region debug log
          fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentTools.ts:482',message:'Cannot clip - invalid intersection geometry',data:{targetPaddockId:args.targetPaddockId,areaRatio,intersectionType:intersection?.type,intersectionGeometryType:(intersection as any)?.geometry?.type,hasIntersection:!!intersection,hasGeometry:!!(intersection as any)?.geometry,intersectionKeys:intersection ? Object.keys(intersection) : [],intersectionString:JSON.stringify(intersection).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          throw new Error(`Section geometry extends outside paddock ${args.targetPaddockId} boundaries (${Math.round(areaRatio * 100)}% within paddock) and cannot be clipped - intersection has no valid geometry`)
        }
      }

      // Validate: Section must not overlap with previous sections
      // Fetch previous sections directly (can't call query from mutation)
      const allPlans = await ctx.db
        .query('plans')
        .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
        .collect()

      const previousSections = allPlans
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

      let adjustedSectionGeometry = finalSectionGeometry as Polygon
      let overlapAdjusted = false

      for (const prevSection of previousSections) {
        const currentFeature: Feature<Polygon> = {
          type: 'Feature',
          properties: {},
          geometry: adjustedSectionGeometry,
        }
        const prevFeature: Feature<Polygon> = {
          type: 'Feature',
          properties: {},
          geometry: prevSection.geometry,
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
              throw new Error(`Section geometry overlaps with previous section from ${prevSection.date} (${Math.round(overlapPercent)}% overlap) and could not be adjusted`)
            }

            const adjustedArea = area({
              type: 'Feature',
              properties: {},
              geometry: largestPolygon,
            })

            if (!Number.isFinite(adjustedArea) || adjustedArea === 0) {
              throw new Error(`Section geometry overlaps with previous section from ${prevSection.date} (${Math.round(overlapPercent)}% overlap) and produced an invalid adjusted section`)
            }

            adjustedSectionGeometry = largestPolygon
            overlapAdjusted = true
          } else if (overlapPercent > 0) {
            // Log allowed overlap for debugging
            console.log(`[createPlanWithSection] Allowing ${overlapPercent.toFixed(1)}% overlap (within ${ALLOWED_OVERLAP_PERCENT}% tolerance)`)
          }
        }
      }

      finalSectionGeometry = adjustedSectionGeometry

      console.log('[createPlanWithSection] Section validation passed:', {
        withinPaddock: true,
        noOverlaps: true,
        previousSectionsCount: previousSections.length,
        overlapAdjusted,
      })
    }

    const existingPlan = await ctx.db
      .query('plans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    const todayPlan = existingPlan.find((p: any) => p.date === today)

    if (todayPlan) {
      console.log('[createPlanWithSection] Patching existing plan:', {
        planId: todayPlan._id.toString(),
        date: todayPlan.date,
        currentStatus: todayPlan.status,
        hasSectionGeometry: !!args.sectionGeometry,
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
      // Use finalSectionGeometry (may be clipped version)
      if (finalSectionGeometry) {
        patchData.sectionGeometry = finalSectionGeometry
      }
      if (args.sectionCentroid) {
        patchData.sectionCentroid = args.sectionCentroid
      }
      if (args.sectionAvgNdvi !== undefined && args.sectionAvgNdvi !== null) {
        patchData.sectionAvgNdvi = args.sectionAvgNdvi
      }
      if (sectionJustification) {
        patchData.sectionJustification = sectionJustification
      }
      if (args.paddockGrazedPercentage !== undefined && args.paddockGrazedPercentage !== null) {
        patchData.paddockGrazedPercentage = args.paddockGrazedPercentage
      }
      
      await ctx.db.patch(todayPlan._id, patchData)
      console.log('[createPlanWithSection] Plan patched successfully:', todayPlan._id.toString())
      return todayPlan._id
    }

    console.log('[createPlanWithSection] Creating NEW plan:', {
      hasSectionGeometry: !!args.sectionGeometry,
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
    // Use finalSectionGeometry (may be clipped version)
    if (finalSectionGeometry) {
      insertData.sectionGeometry = finalSectionGeometry
    }
    if (args.sectionCentroid) {
      insertData.sectionCentroid = args.sectionCentroid
    }
    if (args.sectionAvgNdvi !== undefined && args.sectionAvgNdvi !== null) {
      insertData.sectionAvgNdvi = args.sectionAvgNdvi
    }
    if (sectionJustification) {
      insertData.sectionJustification = sectionJustification
    }
    if (args.paddockGrazedPercentage !== undefined && args.paddockGrazedPercentage !== null) {
      insertData.paddockGrazedPercentage = args.paddockGrazedPercentage
    }
    
    const newPlanId = await ctx.db.insert('plans', insertData)
    console.log('[createPlanWithSection] Plan created successfully:', {
      planId: newPlanId.toString(),
      date: today,
      hasSectionGeometry: !!args.sectionGeometry,
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

export const calculatePaddockGrazedPercentage = query({
  args: { farmExternalId: v.optional(v.string()), paddockId: v.string() },
  handler: async (ctx, args): Promise<number> => {
    const farmExternalId = args.farmExternalId ?? DEFAULT_FARM_EXTERNAL_ID
    
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
      .first()

    if (!farm) return 0

    const paddock = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q: any) => 
        q.eq('farmId', farm._id).eq('externalId', args.paddockId)
      )
      .first()

    if (!paddock) return 0

    const calculateAreaHectares = (geometry: any): number => {
      try {
        const sqMeters = area(geometry)
        return Number.isFinite(sqMeters) ? Math.round((sqMeters * HECTARES_PER_SQUARE_METER) * 10) / 10 : 0
      } catch {
        return 0
      }
    }

    const paddockArea = paddock.area || calculateAreaHectares(paddock.geometry)
    if (paddockArea === 0) return 0

    const today = new Date().toISOString().split('T')[0]
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .collect()

    let totalGrazedArea = 0
    for (const plan of plans) {
      // Only count sections from previous days (exclude today's plan which may be regenerated)
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

    return Math.round((totalGrazedArea / paddockArea) * 100)
  },
})
