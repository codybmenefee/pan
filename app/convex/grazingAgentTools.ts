import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { DEFAULT_FARM_EXTERNAL_ID } from './seedData'
import area from '@turf/area'
import difference from '@turf/difference'
import intersect from '@turf/intersect'
import { featureCollection } from '@turf/helpers'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { HECTARES_PER_SQUARE_METER } from './lib/areaConstants'
import { getFeatureCentroid } from './lib/geoCompat'
import { createLogger } from './lib/logger'
import {
  calculateSectionSize,
  computeUngrazedRemaining,
  validateAgentSection,
  createRectangleSection,
  getPaddockContext,
  DEFAULT_SECTION_PCT,
  DEFAULT_MIN_SECTION_PCT,
  DEFAULT_PASTURE_YIELD_KG_PER_HA,
  type StartingCorner,
} from './lib/sectionSizing'
import { DEFAULT_GRAZING_PRINCIPLES, mergeGrazingPrinciples } from './lib/grazingPrinciples'
// NOTE: Braintrust logging is done at the action level (grazingAgentDirect.ts)
// Mutations cannot use Node.js APIs, so we don't import Braintrust here

const log = createLogger('grazingAgentTools')

/**
 * Helper to look up a farm by external ID
 */
async function findFarmByExternalId(ctx: any, farmExternalId: string) {
  return await ctx.db
    .query('farms')
    .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
    .first()
}

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
        return Number.isFinite(sqMeters)
          ? Math.round(sqMeters * HECTARES_PER_SQUARE_METER * 10) / 10
          : 0
      } catch {
        return 0
      }
    }

    return paddocks
      .map((paddock: any) => {
        const paddockObservations = observations.filter(
          (o: any) => o.paddockExternalId === paddock.externalId
        )

        // Sort observations by date descending
        paddockObservations.sort(
          (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        const latestObservation = paddockObservations[0] ?? null

        // Find latest reliable observation (meeting quality threshold)
        const reliableObservation =
          paddockObservations.find((o: any) => o.isValid && o.cloudFreePct >= minCloudFreePct) ??
          null

        // Determine if current data is reliable
        const isCurrentReliable =
          latestObservation &&
          latestObservation.cloudFreePct >= minCloudFreePct &&
          latestObservation.isValid

        // Use reliable observation for NDVI if current is unreliable
        const observationToUse = isCurrentReliable
          ? latestObservation
          : (reliableObservation ?? latestObservation)

        // Calculate days since reliable observation
        const daysSinceReliable = reliableObservation
          ? Math.floor(
              (Date.now() - new Date(reliableObservation.date).getTime()) / (1000 * 60 * 60 * 24)
            )
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

        const mostRecentEvent =
          paddockGrazingEvents.length > 0
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
            restDays = Math.max(
              0,
              Math.floor((obsDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
            )
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
      })
      .sort((a: any, b: any) => b.ndviMean - a.ndviMean)
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

    const mostRecentGrazingEvent =
      grazingEvents.length > 0
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

    const latestObservation =
      paddockObservations.length > 0
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
        return Number.isFinite(sqMeters)
          ? Math.round(sqMeters * HECTARES_PER_SQUARE_METER * 10) / 10
          : 0
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
    const mostRecentPaddockEvent =
      paddockGrazingEvents.length > 0
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
        restDays = Math.max(
          0,
          Math.floor((obsDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        )
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
      latestObservation: latestObservation
        ? {
            date: latestObservation.date,
            ndviMean: latestObservation.ndviMean,
            ndviStd: latestObservation.ndviStd,
            cloudFreePct: latestObservation.cloudFreePct,
          }
        : null,
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
        minNDVIThreshold: 0.4,
        minRestPeriod: 21,
        defaultSectionPct: 0.2,
      }
    }

    return {
      minNDVIThreshold: settings.minNDVIThreshold,
      minRestPeriod: settings.minRestPeriod,
      defaultSectionPct: 0.2,
    }
  },
})

/**
 * Get livestock context for agent section sizing
 * Returns livestock counts, AU calculations, and computed section size recommendation
 */
export const getLivestockContextForAgent = query({
  args: {
    farmExternalId: v.string(),
    paddockAreaHa: v.number(),
  },
  handler: async (ctx, args) => {
    const { farmExternalId, paddockAreaHa } = args

    // Get farm by external ID
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
      .first()

    if (!farm) {
      return {
        hasLivestockData: false,
        cows: 0,
        calves: 0,
        sheep: 0,
        lambs: 0,
        totalAnimalUnits: 0,
        dailyDMPerAU: 12,
        pastureYieldKgPerHa: DEFAULT_PASTURE_YIELD_KG_PER_HA,
        rotationFrequency: 1,
        sectionSizeResult: {
          targetSectionHa: paddockAreaHa * (DEFAULT_SECTION_PCT / 100),
          targetSectionPct: DEFAULT_SECTION_PCT,
          dailyHectaresNeeded: paddockAreaHa * (DEFAULT_SECTION_PCT / 100),
          reasoning: `No farm data. Using default ${DEFAULT_SECTION_PCT}% of paddock.`,
          isMinimumEnforced: false,
        },
      }
    }

    // Get farm settings
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .first()

    const livestockSettings = settings?.livestockSettings
    const rotationFrequency = settings?.rotationFrequency ?? 1
    const minSectionPct = settings?.minSectionPct ?? DEFAULT_MIN_SECTION_PCT

    // Get AU factors from settings or use defaults
    const cowAU = livestockSettings?.cowAU ?? 1.0
    const calfAU = livestockSettings?.calfAU ?? 0.5
    const sheepAU = livestockSettings?.sheepAU ?? 0.2
    const lambAU = livestockSettings?.lambAU ?? 0.1
    const dailyDMPerAU = livestockSettings?.dailyDMPerAU ?? 12
    const pastureYieldKgPerHa =
      livestockSettings?.pastureYieldKgPerHa ?? DEFAULT_PASTURE_YIELD_KG_PER_HA

    // Get livestock entries
    const entries = await ctx.db
      .query('livestock')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()

    // Aggregate livestock counts
    let cows = 0
    let calves = 0
    let sheep = 0
    let lambs = 0

    for (const entry of entries) {
      if (entry.animalType === 'cow') {
        cows = entry.adultCount
        calves = entry.offspringCount
      } else if (entry.animalType === 'sheep') {
        sheep = entry.adultCount
        lambs = entry.offspringCount
      }
    }

    const hasLivestockData = cows > 0 || sheep > 0

    // Calculate total animal units
    const totalAnimalUnits = cows * cowAU + calves * calfAU + sheep * sheepAU + lambs * lambAU

    // Calculate section size using the utility
    const sectionSizeResult = calculateSectionSize({
      totalAnimalUnits,
      dailyDMPerAU,
      pastureYieldKgPerHa,
      rotationFrequency,
      paddockAreaHa,
      minSectionPct,
    })

    return {
      hasLivestockData,
      cows,
      calves,
      sheep,
      lambs,
      totalAnimalUnits: Math.round(totalAnimalUnits * 10) / 10,
      dailyDMPerAU,
      pastureYieldKgPerHa,
      rotationFrequency,
      sectionSizeResult,
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
    // Progressive grazing fields
    progressionQuadrant: v.optional(
      v.union(v.literal('NW'), v.literal('NE'), v.literal('SW'), v.literal('SE'))
    ),
    adjacentToPrevious: v.optional(v.boolean()),
    skippedArea: v.optional(
      v.object({
        centroid: v.array(v.number()),
        approximateAreaHa: v.number(),
        reason: v.string(),
        ndviValue: v.number(),
      })
    ),
    // Skip overlap validation (used when creating legacy plans from forecast system)
    skipOverlapValidation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // NOTE: Braintrust logging is done at the action level (grazingAgentDirect.ts)
    // This mutation is called from actions, so tool execution is logged there

    log.debug('createPlanWithSection START', {
      farmExternalId: args.farmExternalId,
      targetPaddockId: args.targetPaddockId,
      hasSectionGeometry: !!args.sectionGeometry,
      sectionAreaHectares: args.sectionAreaHectares,
      confidence: args.confidence,
      today,
    })

    // CRITICAL: Animals must eat somewhere - sectionGeometry is required
    if (!args.sectionGeometry) {
      throw new Error(
        'sectionGeometry is REQUIRED. Animals must graze somewhere every day. The agent must always create a section, even if conditions are not ideal. Please ensure the agent creates a section geometry in the target paddock.'
      )
    }

    const extractConfidenceFromJustification = (
      justification: string
    ): { confidence?: number; justification: string } => {
      // Common failure mode: the model appends something like:
      // </sectionJustification>\n<parameter name="confidence">0.55
      const match = justification.match(
        /<parameter\s+name=["']confidence["']>\s*([0-9]*\.?[0-9]+)/i
      )
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

      // Validate and normalize section geometry
      // Ensure coordinates are properly structured as a closed ring
      let sectionGeometry = args.sectionGeometry as Polygon
      if (!sectionGeometry.coordinates || !sectionGeometry.coordinates[0]) {
        throw new Error('Invalid section geometry: missing coordinates')
      }

      // Ensure the polygon ring is closed (first point = last point)
      const ring = sectionGeometry.coordinates[0]
      if (ring.length < 4) {
        throw new Error(
          `Invalid section geometry: polygon ring has only ${ring.length} points (need at least 4)`
        )
      }
      const firstPoint = ring[0]
      const lastPoint = ring[ring.length - 1]
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        log.debug('Closing unclosed polygon ring', {
          first: firstPoint,
          last: lastPoint,
        })
        // Close the ring by adding the first point at the end
        sectionGeometry = {
          type: 'Polygon',
          coordinates: [[...ring, firstPoint]],
        }
      }

      // Normalize section geometry to Feature<Polygon>
      const sectionFeature: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: sectionGeometry,
      }

      // Normalize paddock geometry to Feature<Polygon>
      // Paddock geometry is stored as Feature<Polygon>, but let's handle both cases
      const rawPaddockGeom = paddock.geometry as any
      let paddockGeometry: Polygon
      if (rawPaddockGeom.type === 'Feature') {
        paddockGeometry = rawPaddockGeom.geometry as Polygon
      } else if (rawPaddockGeom.type === 'Polygon') {
        paddockGeometry = rawPaddockGeom as Polygon
      } else {
        log.warn('Unexpected paddock geometry structure', { type: rawPaddockGeom.type })
        paddockGeometry = (rawPaddockGeom.geometry || rawPaddockGeom) as Polygon
      }

      // Ensure paddock polygon ring is closed
      if (paddockGeometry.coordinates && paddockGeometry.coordinates[0]) {
        const paddockRing = paddockGeometry.coordinates[0]
        const firstPt = paddockRing[0]
        const lastPt = paddockRing[paddockRing.length - 1]
        if (firstPt[0] !== lastPt[0] || firstPt[1] !== lastPt[1]) {
          log.debug('Closing unclosed paddock polygon ring')
          paddockGeometry = {
            type: 'Polygon',
            coordinates: [[...paddockRing, firstPt]],
          }
        }
      }

      const paddockFeature: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: paddockGeometry,
      }

      log.debug('Geometry structures after normalization', {
        sectionType: sectionGeometry.type,
        sectionCoordsRings: sectionGeometry.coordinates?.length,
        sectionFirstRingLength: sectionGeometry.coordinates?.[0]?.length,
        paddockType: paddockGeometry.type,
        paddockCoordsRings: paddockGeometry.coordinates?.length,
        paddockFirstRingLength: paddockGeometry.coordinates?.[0]?.length,
      })

      // Log section and paddock bounds for debugging
      const sectionBbox = (() => {
        try {
          const coords = args.sectionGeometry.coordinates?.[0] || []
          if (coords.length === 0) return null
          let minLng = Infinity,
            maxLng = -Infinity,
            minLat = Infinity,
            maxLat = -Infinity
          for (const [lng, lat] of coords) {
            minLng = Math.min(minLng, lng)
            maxLng = Math.max(maxLng, lng)
            minLat = Math.min(minLat, lat)
            maxLat = Math.max(maxLat, lat)
          }
          return { minLng, maxLng, minLat, maxLat }
        } catch {
          return null
        }
      })()

      const paddockBbox = (() => {
        try {
          const geom = paddockFeature.geometry || paddockFeature
          const coords = geom.coordinates?.[0] || []
          if (coords.length === 0) return null
          let minLng = Infinity,
            maxLng = -Infinity,
            minLat = Infinity,
            maxLat = -Infinity
          for (const [lng, lat] of coords) {
            minLng = Math.min(minLng, lng)
            maxLng = Math.max(maxLng, lng)
            minLat = Math.min(minLat, lat)
            maxLat = Math.max(maxLat, lat)
          }
          return { minLng, maxLng, minLat, maxLat }
        } catch {
          return null
        }
      })()

      log.debug('Section validation - comparing bounds', {
        sectionBbox,
        paddockBbox,
        sectionCoords: args.sectionGeometry.coordinates?.[0]?.slice(0, 3), // First 3 coords
      })

      // Pre-check: Do bounding boxes even overlap?
      const bboxOverlaps =
        sectionBbox &&
        paddockBbox &&
        sectionBbox.minLng <= paddockBbox.maxLng &&
        sectionBbox.maxLng >= paddockBbox.minLng &&
        sectionBbox.minLat <= paddockBbox.maxLat &&
        sectionBbox.maxLat >= paddockBbox.minLat

      log.debug('Bbox overlap check', {
        bboxOverlaps,
        sectionBbox,
        paddockBbox,
      })

      // Log the actual features being passed to intersect
      log.debug('Features for intersection', {
        sectionFeatureType: sectionFeature.type,
        sectionGeomType: sectionFeature.geometry?.type,
        sectionCoordsLength: sectionFeature.geometry?.coordinates?.[0]?.length,
        paddockFeatureType: paddockFeature.type,
        paddockGeomType: paddockFeature.geometry?.type,
        paddockCoordsLength: paddockFeature.geometry?.coordinates?.[0]?.length,
      })

      // Validate: Section must be within paddock bounds
      // Check by intersecting section with paddock - if intersection area equals section area, it's fully within
      // Note: turf v7 intersect takes a FeatureCollection
      let intersection: Feature<Polygon | MultiPolygon> | null = null
      try {
        intersection = intersect(featureCollection([sectionFeature, paddockFeature]))
        log.debug('Intersection result', {
          hasIntersection: !!intersection,
          intersectionType: intersection?.geometry?.type,
        })
      } catch (intersectError: any) {
        log.error('Intersect function threw error', { error: intersectError.message })
        // If intersect fails but bboxes overlap, try to continue with the section as-is
        if (bboxOverlaps) {
          log.warn('Bboxes overlap but intersect failed - using section as-is with warning')
          intersection = sectionFeature as Feature<Polygon | MultiPolygon>
        }
      }

      if (!intersection) {
        if (bboxOverlaps) {
          // Bboxes overlap but intersect failed - likely a turf geometry structure issue
          // Since bboxes overlap, the section is at least partially within paddock bounds
          // Use the section as-is but clamp coordinates to paddock bounds
          log.warn(
            'Bboxes overlap but intersect returned null - clamping section to paddock bounds',
            {
              sectionBbox,
              paddockBbox,
            }
          )

          // Clamp section coordinates to paddock bounds
          if (sectionBbox && paddockBbox) {
            const clampedCoords = sectionGeometry.coordinates[0].map((coord) => {
              const lng = coord[0]
              const lat = coord[1]
              return [
                Math.max(paddockBbox.minLng, Math.min(paddockBbox.maxLng, lng)),
                Math.max(paddockBbox.minLat, Math.min(paddockBbox.maxLat, lat)),
              ]
            })
            // Ensure closed ring
            if (
              clampedCoords[0][0] !== clampedCoords[clampedCoords.length - 1][0] ||
              clampedCoords[0][1] !== clampedCoords[clampedCoords.length - 1][1]
            ) {
              clampedCoords.push([...clampedCoords[0]])
            }
            sectionGeometry = {
              type: 'Polygon',
              coordinates: [clampedCoords],
            }
            // Update sectionFeature with clamped geometry
            sectionFeature.geometry = sectionGeometry
            log.debug('Clamped section geometry to paddock bounds')
          }
          // Continue with the clamped section
        } else {
          // Bboxes don't overlap - section is genuinely outside paddock
          log.error('Section completely outside paddock - bboxes do not overlap', {
            sectionBbox,
            paddockBbox,
            sectionGeometry: JSON.stringify(args.sectionGeometry).slice(0, 500),
          })
          throw new Error(
            `Section geometry is completely outside paddock ${args.targetPaddockId} boundaries. Bounding boxes do NOT overlap. Section bounds: lng [${sectionBbox?.minLng.toFixed(5)}, ${sectionBbox?.maxLng.toFixed(5)}], lat [${sectionBbox?.minLat.toFixed(5)}, ${sectionBbox?.maxLat.toFixed(5)}]. Paddock bounds: lng [${paddockBbox?.minLng.toFixed(5)}, ${paddockBbox?.maxLng.toFixed(5)}], lat [${paddockBbox?.minLat.toFixed(5)}, ${paddockBbox?.maxLat.toFixed(5)}]`
          )
        }
      }

      // If intersection exists, check area ratio and clip if needed
      // If intersection is null but bboxes overlap, we've already clamped the section above
      if (intersection) {
        const sectionArea = area(sectionFeature)
        const intersectionArea = area(intersection as Feature<Polygon>)
        const areaRatio = intersectionArea / sectionArea

        // If section extends outside paddock, clip it to paddock boundary
        // This handles LLM imprecision in coordinate generation
        if (areaRatio < 0.99) {
          const intersectionFeature = intersection as Feature<Polygon>
          const intersectionGeometry = intersectionFeature?.geometry

          if (
            intersectionGeometry &&
            intersectionGeometry.coordinates &&
            intersectionGeometry.coordinates.length > 0
          ) {
            // Use the intersection geometry as the clipped section
            finalSectionGeometry = intersectionGeometry as Polygon
            log.debug(
              `Clipped section geometry: ${Math.round(areaRatio * 100)}% was within paddock, using intersection`,
              { geometryType: intersectionGeometry.type }
            )
          } else {
            throw new Error(
              `Section geometry extends outside paddock ${args.targetPaddockId} boundaries (${Math.round(areaRatio * 100)}% within paddock) and cannot be clipped - intersection has no valid geometry`
            )
          }
        }
      } else {
        // No intersection but we clamped above - use the clamped sectionGeometry
        finalSectionGeometry = sectionGeometry
        log.debug('Using clamped section geometry (intersection was null but bboxes overlapped)')
      }

      // Helper function to pick largest polygon from MultiPolygon
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

      // Validate: Section must not overlap with previous sections
      // Skip validation when creating legacy plans from forecast system (sections are pre-validated)
      if (!args.skipOverlapValidation) {
        // Fetch previous sections directly (can't call query from mutation)
        const allPlans = await ctx.db
          .query('plans')
          .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
          .collect()

        const previousSections = allPlans
          .filter(
            (plan: any) =>
              plan.sectionGeometry &&
              plan.primaryPaddockExternalId === args.targetPaddockId &&
              plan.date !== today &&
              plan.status !== 'rejected'
          )
          .map((plan: any) => ({
            date: plan.date,
            geometry: plan.sectionGeometry,
          }))

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
              const differenceGeometry = differenceResult?.geometry as
                | Polygon
                | MultiPolygon
                | undefined
              const largestPolygon = differenceGeometry
                ? pickLargestPolygon(differenceGeometry)
                : null

              if (!largestPolygon) {
                throw new Error(
                  `Section geometry overlaps with previous section from ${prevSection.date} (${Math.round(overlapPercent)}% overlap) and could not be adjusted`
                )
              }

              const adjustedArea = area({
                type: 'Feature',
                properties: {},
                geometry: largestPolygon,
              })

              if (!Number.isFinite(adjustedArea) || adjustedArea === 0) {
                throw new Error(
                  `Section geometry overlaps with previous section from ${prevSection.date} (${Math.round(overlapPercent)}% overlap) and produced an invalid adjusted section`
                )
              }

              adjustedSectionGeometry = largestPolygon
              overlapAdjusted = true
            } else if (overlapPercent > 0) {
              // Log allowed overlap for debugging
              log.debug(
                `Allowing ${overlapPercent.toFixed(1)}% overlap (within ${ALLOWED_OVERLAP_PERCENT}% tolerance)`
              )
            }
          }
        }

        finalSectionGeometry = adjustedSectionGeometry

        log.debug('Section validation passed', {
          withinPaddock: true,
          noOverlaps: true,
          previousSectionsCount: previousSections.length,
          overlapAdjusted,
        })
      } else {
        log.debug('Skipped overlap validation (skipOverlapValidation=true)')
      }
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

      // Build progression context if we have an active rotation
      if (args.progressionQuadrant) {
        const activeRotation = await ctx.db
          .query('paddockRotations')
          .withIndex('by_active', (q: any) =>
            q
              .eq('farmExternalId', args.farmExternalId)
              .eq('paddockExternalId', args.targetPaddockId)
              .eq('status', 'active')
          )
          .first()

        if (activeRotation) {
          const rotationSections = await ctx.db
            .query('sectionGrazingEvents')
            .withIndex('by_rotation', (q: any) => q.eq('rotationId', activeRotation._id))
            .collect()

          patchData.progressionContext = {
            rotationId: activeRotation._id,
            sequenceNumber: rotationSections.length + 1,
            progressionQuadrant: args.progressionQuadrant,
            wasUngrazedAreaReturn: false, // TODO: detect if returning to ungrazed area
          }
        }
      }

      await ctx.db.patch(todayPlan._id, patchData)

      // Record skipped area if reported
      if (args.skippedArea) {
        const activeRotationForSkip = await ctx.db
          .query('paddockRotations')
          .withIndex('by_active', (q: any) =>
            q
              .eq('farmExternalId', args.farmExternalId)
              .eq('paddockExternalId', args.targetPaddockId)
              .eq('status', 'active')
          )
          .first()

        if (activeRotationForSkip) {
          const ungrazedAreas = activeRotationForSkip.ungrazedAreas ?? []
          ungrazedAreas.push({
            approximateCentroid: args.skippedArea.centroid,
            approximateAreaHa: args.skippedArea.approximateAreaHa,
            reason: args.skippedArea.reason,
            ndviAtSkip: args.skippedArea.ndviValue,
          })

          await ctx.db.patch(activeRotationForSkip._id, {
            ungrazedAreas,
            updatedAt: now,
          })

          log.debug('Recorded skipped area (patch)', {
            rotationId: activeRotationForSkip._id.toString(),
            centroid: args.skippedArea.centroid,
            reason: args.skippedArea.reason,
          })
        }
      }

      log.debug('Plan patched successfully', { planId: todayPlan._id.toString() })
      return todayPlan._id
    }

    log.debug('Creating NEW plan', {
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

    // Build progression context if we have an active rotation
    if (args.progressionQuadrant) {
      const activeRotation = await ctx.db
        .query('paddockRotations')
        .withIndex('by_active', (q: any) =>
          q
            .eq('farmExternalId', args.farmExternalId)
            .eq('paddockExternalId', args.targetPaddockId)
            .eq('status', 'active')
        )
        .first()

      if (activeRotation) {
        const rotationSections = await ctx.db
          .query('sectionGrazingEvents')
          .withIndex('by_rotation', (q: any) => q.eq('rotationId', activeRotation._id))
          .collect()

        insertData.progressionContext = {
          rotationId: activeRotation._id,
          sequenceNumber: rotationSections.length + 1,
          progressionQuadrant: args.progressionQuadrant,
          wasUngrazedAreaReturn: false,
        }
      }
    }

    const newPlanId = await ctx.db.insert('plans', insertData)

    // Record skipped area if reported
    if (args.skippedArea) {
      const activeRotation = await ctx.db
        .query('paddockRotations')
        .withIndex('by_active', (q: any) =>
          q
            .eq('farmExternalId', args.farmExternalId)
            .eq('paddockExternalId', args.targetPaddockId)
            .eq('status', 'active')
        )
        .first()

      if (activeRotation) {
        const ungrazedAreas = activeRotation.ungrazedAreas ?? []
        ungrazedAreas.push({
          approximateCentroid: args.skippedArea.centroid,
          approximateAreaHa: args.skippedArea.approximateAreaHa,
          reason: args.skippedArea.reason,
          ndviAtSkip: args.skippedArea.ndviValue,
        })

        await ctx.db.patch(activeRotation._id, {
          ungrazedAreas,
          updatedAt: now,
        })

        log.debug('Recorded skipped area', {
          rotationId: activeRotation._id.toString(),
          centroid: args.skippedArea.centroid,
          reason: args.skippedArea.reason,
        })
      }
    }

    log.debug('Plan created successfully', {
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

// ============================================================================
// PROGRESSIVE GRAZING - Rotation Management
// ============================================================================

/**
 * Get the currently active rotation for a paddock
 */
export const getActiveRotation = query({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('paddockRotations')
      .withIndex('by_active', (q: any) =>
        q
          .eq('farmExternalId', args.farmExternalId)
          .eq('paddockExternalId', args.paddockExternalId)
          .eq('status', 'active')
      )
      .first()
  },
})

/**
 * Get all sections grazed in a rotation
 */
export const getRotationSections = query({
  args: { rotationId: v.id('paddockRotations') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sectionGrazingEvents')
      .withIndex('by_rotation', (q: any) => q.eq('rotationId', args.rotationId))
      .collect()
  },
})

/**
 * Get the most recent completed rotation for a paddock (for ungrazed areas)
 */
export const getPreviousRotation = query({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const rotations = await ctx.db
      .query('paddockRotations')
      .withIndex('by_paddock', (q: any) =>
        q.eq('farmExternalId', args.farmExternalId).eq('paddockExternalId', args.paddockExternalId)
      )
      .collect()

    // Sort by startDate descending and find most recent completed/interrupted
    const sorted = rotations
      .filter((r: any) => r.status !== 'active')
      .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    return sorted[0] ?? null
  },
})

/**
 * Initialize a new rotation for a paddock
 */
export const initializeRotation = mutation({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
    entryNdviMean: v.number(),
    startingCorner: v.optional(
      v.union(v.literal('NW'), v.literal('NE'), v.literal('SW'), v.literal('SE'))
    ),
    progressionDirection: v.optional(v.union(v.literal('horizontal'), v.literal('vertical'))),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    // Mark any existing active rotation for this paddock as interrupted
    const existingActive = await ctx.db
      .query('paddockRotations')
      .withIndex('by_active', (q: any) =>
        q
          .eq('farmExternalId', args.farmExternalId)
          .eq('paddockExternalId', args.paddockExternalId)
          .eq('status', 'active')
      )
      .first()

    if (existingActive) {
      const daysInRotation = Math.floor(
        (new Date(today).getTime() - new Date(existingActive.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
      await ctx.db.patch(existingActive._id, {
        status: 'interrupted',
        endDate: today,
        daysInRotation,
        updatedAt: now,
      })
      log.debug('Marked existing rotation as interrupted', {
        rotationId: existingActive._id.toString(),
        daysInRotation,
      })
    }

    // Check for previous rotation's ungrazed areas
    const previousRotation = await ctx.db
      .query('paddockRotations')
      .withIndex('by_paddock', (q: any) =>
        q.eq('farmExternalId', args.farmExternalId).eq('paddockExternalId', args.paddockExternalId)
      )
      .order('desc')
      .first()

    // Get farm settings for default progression settings
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .first()

    const progressionSettings = settings?.progressionSettings
    const defaultCorner =
      args.startingCorner ??
      (progressionSettings?.defaultStartCorner !== 'auto'
        ? progressionSettings?.defaultStartCorner
        : undefined) ??
      'NW'
    const defaultDirection =
      args.progressionDirection ??
      (progressionSettings?.defaultDirection !== 'auto'
        ? progressionSettings?.defaultDirection
        : undefined) ??
      'horizontal'

    const rotationId = await ctx.db.insert('paddockRotations', {
      farmExternalId: args.farmExternalId,
      paddockExternalId: args.paddockExternalId,
      status: 'active',
      startDate: today,
      entryNdviMean: args.entryNdviMean,
      startingCorner: defaultCorner as 'NW' | 'NE' | 'SW' | 'SE',
      progressionDirection: defaultDirection as 'horizontal' | 'vertical',
      totalSectionsGrazed: 0,
      totalAreaGrazedHa: 0,
      grazedPercentage: 0,
      // Carry forward ungrazed areas from last rotation
      ungrazedAreas: previousRotation?.ungrazedAreas,
      createdAt: now,
      updatedAt: now,
    })

    log.debug('Initialized new rotation', {
      rotationId: rotationId.toString(),
      paddockExternalId: args.paddockExternalId,
      startingCorner: defaultCorner,
      progressionDirection: defaultDirection,
      hasCarriedUngrazedAreas: !!previousRotation?.ungrazedAreas?.length,
    })

    return rotationId
  },
})

/**
 * Record a section that has been grazed
 */
export const recordSectionGrazed = mutation({
  args: {
    rotationId: v.id('paddockRotations'),
    planId: v.id('plans'),
    sectionGeometry: v.any(),
    sectionAreaHa: v.number(),
    centroid: v.array(v.number()),
    sectionNdviMean: v.number(),
    progressionQuadrant: v.string(),
    adjacentToPrevious: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    const rotation = await ctx.db.get(args.rotationId)
    if (!rotation) throw new Error('Rotation not found')

    const previousSections = await ctx.db
      .query('sectionGrazingEvents')
      .withIndex('by_rotation', (q: any) => q.eq('rotationId', args.rotationId))
      .collect()

    const sequenceNumber = previousSections.length + 1
    const cumulativeAreaGrazedHa = rotation.totalAreaGrazedHa + args.sectionAreaHa

    // Get paddock for percentage calc
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', rotation.farmExternalId))
      .first()

    let paddockArea = 1
    if (farm) {
      const paddock = await ctx.db
        .query('paddocks')
        .withIndex('by_farm_externalId', (q: any) =>
          q.eq('farmId', farm._id).eq('externalId', rotation.paddockExternalId)
        )
        .first()
      if (paddock) {
        paddockArea = paddock.area || 1
      }
    }

    const cumulativeGrazedPct = Math.min(100, (cumulativeAreaGrazedHa / paddockArea) * 100)

    // Record section event
    const sectionEventId = await ctx.db.insert('sectionGrazingEvents', {
      farmExternalId: rotation.farmExternalId,
      paddockExternalId: rotation.paddockExternalId,
      rotationId: args.rotationId,
      planId: args.planId,
      date: today,
      sequenceNumber,
      sectionGeometry: args.sectionGeometry,
      sectionAreaHa: args.sectionAreaHa,
      centroid: args.centroid,
      sectionNdviMean: args.sectionNdviMean,
      progressionQuadrant: args.progressionQuadrant,
      adjacentToPrevious: args.adjacentToPrevious,
      cumulativeAreaGrazedHa,
      cumulativeGrazedPct,
      createdAt: now,
    })

    // Update rotation totals
    await ctx.db.patch(args.rotationId, {
      totalSectionsGrazed: sequenceNumber,
      totalAreaGrazedHa: cumulativeAreaGrazedHa,
      grazedPercentage: cumulativeGrazedPct,
      updatedAt: now,
    })

    log.debug('Recorded section grazed', {
      sectionEventId: sectionEventId.toString(),
      sequenceNumber,
      cumulativeAreaGrazedHa,
      cumulativeGrazedPct,
      progressionQuadrant: args.progressionQuadrant,
    })

    return sectionEventId
  },
})

/**
 * Record an area that was skipped due to poor NDVI
 */
export const recordUngrazedArea = mutation({
  args: {
    rotationId: v.id('paddockRotations'),
    centroid: v.array(v.number()),
    approximateAreaHa: v.number(),
    reason: v.string(),
    ndviAtSkip: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    const rotation = await ctx.db.get(args.rotationId)
    if (!rotation) throw new Error('Rotation not found')

    const ungrazedAreas = rotation.ungrazedAreas ?? []
    ungrazedAreas.push({
      approximateCentroid: args.centroid,
      approximateAreaHa: args.approximateAreaHa,
      reason: args.reason,
      ndviAtSkip: args.ndviAtSkip,
    })

    await ctx.db.patch(args.rotationId, {
      ungrazedAreas,
      updatedAt: now,
    })

    log.debug('Recorded ungrazed area', {
      rotationId: args.rotationId.toString(),
      centroid: args.centroid,
      approximateAreaHa: args.approximateAreaHa,
      reason: args.reason,
    })
  },
})

/**
 * Complete a rotation (mark as completed)
 */
export const completeRotation = mutation({
  args: {
    rotationId: v.id('paddockRotations'),
    exitNdviMean: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    const rotation = await ctx.db.get(args.rotationId)
    if (!rotation) throw new Error('Rotation not found')

    const daysInRotation = Math.floor(
      (new Date(today).getTime() - new Date(rotation.startDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    await ctx.db.patch(args.rotationId, {
      status: 'completed',
      endDate: today,
      exitNdviMean: args.exitNdviMean,
      daysInRotation,
      updatedAt: now,
    })

    log.debug('Completed rotation', {
      rotationId: args.rotationId.toString(),
      daysInRotation,
      exitNdviMean: args.exitNdviMean,
      totalSectionsGrazed: rotation.totalSectionsGrazed,
      grazedPercentage: rotation.grazedPercentage,
    })
  },
})

// ============================================================================
// EXISTING FUNCTIONS
// ============================================================================

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
        return Number.isFinite(sqMeters)
          ? Math.round(sqMeters * HECTARES_PER_SQUARE_METER * 10) / 10
          : 0
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

/**
 * Compute the ungrazed geometry for a paddock in the current rotation.
 * Returns paddock geometry MINUS all grazed sections = remaining ungrazed area.
 * Used for visual reasoning validation and section placement.
 */
export const computeUngrazedGeometry = query({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    ungrazedGeometry: Polygon | MultiPolygon | null
    ungrazedAreaHa: number
    paddockAreaHa: number
    grazedPercentage: number
    grazedSections: Array<{
      date: string
      geometry: Polygon
      areaHa: number
      dayNumber: number
    }>
  }> => {
    const { farmExternalId, paddockExternalId } = args

    // Get farm
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', farmExternalId))
      .first()

    if (!farm) {
      return {
        ungrazedGeometry: null,
        ungrazedAreaHa: 0,
        paddockAreaHa: 0,
        grazedPercentage: 0,
        grazedSections: [],
      }
    }

    // Get paddock
    const paddock = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q: any) =>
        q.eq('farmId', farm._id).eq('externalId', paddockExternalId)
      )
      .first()

    if (!paddock || !paddock.geometry) {
      return {
        ungrazedGeometry: null,
        ungrazedAreaHa: 0,
        paddockAreaHa: 0,
        grazedPercentage: 0,
        grazedSections: [],
      }
    }

    const paddockFeature = paddock.geometry as Feature<Polygon>
    const paddockAreaSqM = area(paddockFeature)
    const paddockAreaHa = paddockAreaSqM * HECTARES_PER_SQUARE_METER

    // Get active rotation for this paddock
    const activeRotation = await ctx.db
      .query('paddockRotations')
      .withIndex('by_active', (q: any) =>
        q
          .eq('farmExternalId', farmExternalId)
          .eq('paddockExternalId', paddockExternalId)
          .eq('status', 'active')
      )
      .first()

    // Get grazed sections from current rotation
    let grazedSections: Array<{
      date: string
      geometry: Polygon
      areaHa: number
      dayNumber: number
    }> = []

    if (activeRotation) {
      const sectionEvents = await ctx.db
        .query('sectionGrazingEvents')
        .withIndex('by_rotation', (q: any) => q.eq('rotationId', activeRotation._id))
        .collect()

      grazedSections = sectionEvents
        .filter((s: any) => s.sectionGeometry)
        .map((s: any) => ({
          date: s.date,
          geometry: s.sectionGeometry as Polygon,
          areaHa: s.sectionAreaHa || 0,
          dayNumber: s.sequenceNumber || 1,
        }))
        .sort((a: any, b: any) => a.dayNumber - b.dayNumber)
    } else {
      // Fall back to approved plans if no active rotation
      const today = new Date().toISOString().split('T')[0]
      const plans = await ctx.db
        .query('plans')
        .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
        .collect()

      const approvedPlans = plans
        .filter(
          (p: any) =>
            p.primaryPaddockExternalId === paddockExternalId &&
            p.sectionGeometry &&
            p.date !== today &&
            (p.status === 'approved' || p.status === 'pending')
        )
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

      grazedSections = approvedPlans.map((p: any, index: number) => ({
        date: p.date,
        geometry: p.sectionGeometry as Polygon,
        areaHa: p.sectionAreaHectares || 0,
        dayNumber: index + 1,
      }))
    }

    // If no grazed sections, return full paddock as ungrazed
    if (grazedSections.length === 0) {
      return {
        ungrazedGeometry: paddockFeature.geometry,
        ungrazedAreaHa: paddockAreaHa,
        paddockAreaHa,
        grazedPercentage: 0,
        grazedSections: [],
      }
    }

    // Sequentially subtract each grazed section from paddock geometry.
    let remainingFeature: Feature<Polygon | MultiPolygon> | null = paddockFeature

    for (const section of grazedSections) {
      if (!remainingFeature) {
        break
      }

      const sectionFeature: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: section.geometry,
      }

      const diff = difference(featureCollection([remainingFeature, sectionFeature]))
      if (diff && diff.geometry) {
        remainingFeature = diff as Feature<Polygon | MultiPolygon>
      } else {
        remainingFeature = null
      }
    }

    let ungrazedGeometry: Polygon | MultiPolygon | null = null
    let ungrazedAreaHa = 0

    if (remainingFeature?.geometry) {
      ungrazedGeometry = remainingFeature.geometry as Polygon | MultiPolygon
      const ungrazedAreaSqM = area(remainingFeature)
      ungrazedAreaHa = ungrazedAreaSqM * HECTARES_PER_SQUARE_METER
    }

    const grazedPercentage = Math.round(((paddockAreaHa - ungrazedAreaHa) / paddockAreaHa) * 100)

    log.debug('computeUngrazedGeometry result', {
      paddockExternalId,
      paddockAreaHa: paddockAreaHa.toFixed(2),
      ungrazedAreaHa: ungrazedAreaHa.toFixed(2),
      grazedPercentage,
      grazedSectionsCount: grazedSections.length,
    })

    return {
      ungrazedGeometry,
      ungrazedAreaHa: Math.round(ungrazedAreaHa * 100) / 100,
      paddockAreaHa: Math.round(paddockAreaHa * 100) / 100,
      grazedPercentage,
      grazedSections,
    }
  },
})

/**
 * Get grazing principles for a farm (merged with global defaults)
 */
export const getGrazingPrinciples = query({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const farmPrinciples = await ctx.db
      .query('grazingPrinciples')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .first()

    if (!farmPrinciples) {
      return {
        ...DEFAULT_GRAZING_PRINCIPLES,
        customRules: [] as string[],
      }
    }

    const merged = mergeGrazingPrinciples({
      minDaysPerSection: farmPrinciples.minDaysPerSection,
      maxDaysPerSection: farmPrinciples.maxDaysPerSection,
      minNdviThreshold: farmPrinciples.minNdviThreshold,
      preferHighNdviAreas: farmPrinciples.preferHighNdviAreas,
      requireAdjacentSections: farmPrinciples.requireAdjacentSections,
      allowSectionOverlapPct: farmPrinciples.allowSectionOverlapPct,
    })

    return {
      ...merged,
      customRules: farmPrinciples.customRules ?? [],
    }
  },
})

/**
 * Create a daily brief with MOVE or STAY decision (legacy - use createDailyPlan instead)
 */
export const createDailyBrief = mutation({
  args: {
    farmExternalId: v.string(),
    date: v.string(),
    decision: v.union(v.literal('MOVE'), v.literal('STAY')),
    paddockExternalId: v.string(),
    sectionGeometry: v.optional(v.any()),
    sectionAreaHa: v.optional(v.number()),
    sectionCentroid: v.optional(v.array(v.number())),
    daysInCurrentSection: v.number(),
    estimatedForageRemaining: v.optional(v.number()),
    currentNdvi: v.optional(v.number()),
    reasoning: v.array(v.string()),
    confidence: v.number(),
    forecastId: v.optional(v.id('paddockForecasts')),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Check for existing brief today
    const existingBrief = await ctx.db
      .query('dailyBriefs')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q: any) => q.eq(q.field('date'), args.date))
      .first()

    if (existingBrief) {
      // Update existing brief
      await ctx.db.patch(existingBrief._id, {
        decision: args.decision,
        paddockExternalId: args.paddockExternalId,
        sectionGeometry: args.sectionGeometry,
        sectionAreaHa: args.sectionAreaHa,
        sectionCentroid: args.sectionCentroid,
        daysInCurrentSection: args.daysInCurrentSection,
        estimatedForageRemaining: args.estimatedForageRemaining,
        currentNdvi: args.currentNdvi,
        reasoning: args.reasoning,
        confidence: args.confidence,
        forecastId: args.forecastId,
      })

      log.debug('Updated existing daily brief', {
        briefId: existingBrief._id.toString(),
        decision: args.decision,
        daysInCurrentSection: args.daysInCurrentSection,
      })

      return existingBrief._id
    }

    // Create new brief
    const briefId = await ctx.db.insert('dailyBriefs', {
      farmExternalId: args.farmExternalId,
      date: args.date,
      decision: args.decision,
      paddockExternalId: args.paddockExternalId,
      sectionGeometry: args.sectionGeometry,
      sectionAreaHa: args.sectionAreaHa,
      sectionCentroid: args.sectionCentroid,
      daysInCurrentSection: args.daysInCurrentSection,
      estimatedForageRemaining: args.estimatedForageRemaining,
      currentNdvi: args.currentNdvi,
      reasoning: args.reasoning,
      confidence: args.confidence,
      status: 'pending',
      forecastId: args.forecastId,
      createdAt: now,
    })

    log.debug('Created daily brief', {
      briefId: briefId.toString(),
      decision: args.decision,
      paddockExternalId: args.paddockExternalId,
      daysInCurrentSection: args.daysInCurrentSection,
    })

    return briefId
  },
})

/**
 * Approve a daily brief and execute the decision (legacy - use approveDailyPlan instead)
 */
export const approveDailyBrief = mutation({
  args: {
    briefId: v.id('dailyBriefs'),
    approvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    const brief = await ctx.db.get(args.briefId)
    if (!brief) {
      throw new Error('Daily brief not found')
    }

    // Update brief status
    await ctx.db.patch(args.briefId, {
      status: 'approved',
      approvedAt: now,
      approvedBy: args.approvedBy,
    })

    // If linked to a forecast, update it
    if (brief.forecastId) {
      const forecast = await ctx.db.get(brief.forecastId)
      if (forecast) {
        const activeSection = forecast.forecastedSections[forecast.activeSectionIndex]

        if (brief.decision === 'MOVE' && activeSection) {
          // Record the completed section in history
          const grazingHistory = [...forecast.grazingHistory]
          grazingHistory.push({
            sectionIndex: forecast.activeSectionIndex,
            geometry: activeSection.geometry,
            areaHa: activeSection.areaHa,
            startedDate: forecast.updatedAt.split('T')[0],
            endedDate: today,
            actualDays: forecast.daysInActiveSection,
          })

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

          log.debug('Approved MOVE - updated paddock forecast', {
            forecastId: forecast._id.toString(),
            previousSection: forecast.activeSectionIndex,
            newSection: nextIndex,
          })
        } else if (brief.decision === 'STAY') {
          // Just increment days in section
          await ctx.db.patch(forecast._id, {
            daysInActiveSection: forecast.daysInActiveSection + 1,
            updatedAt: now,
          })

          log.debug('Approved STAY - incremented days in forecast section', {
            forecastId: forecast._id.toString(),
            daysInSection: forecast.daysInActiveSection + 1,
          })
        }
      }
    }

    return args.briefId
  },
})

/**
 * Get today's daily brief for a farm
 */
export const getTodayBrief = query({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0]

    return await ctx.db
      .query('dailyBriefs')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q: any) => q.eq(q.field('date'), today))
      .first()
  },
})

// ============================================================================
// PADDOCK FORECAST + DAILY PLAN SYSTEM
// New architecture: pre-generated forecasts with daily concrete recommendations
// ============================================================================

/**
 * Get or create a paddock forecast for a paddock rotation.
 * Creates an empty forecast that the agent will fill in with sections.
 * The agent draws sections autonomously using drawSection tool.
 */
export const getOrCreateForecast = mutation({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const { farmExternalId, paddockExternalId } = args
    const now = new Date().toISOString()

    // Check for existing active forecast
    const existingForecast = await ctx.db
      .query('paddockForecasts')
      .withIndex('by_active', (q: any) =>
        q
          .eq('farmExternalId', farmExternalId)
          .eq('paddockExternalId', paddockExternalId)
          .eq('status', 'active')
      )
      .first()

    if (existingForecast) {
      log.debug('Found existing paddock forecast', {
        forecastId: existingForecast._id.toString(),
        activeSectionIndex: existingForecast.activeSectionIndex,
        totalSections: existingForecast.forecastedSections.length,
      })
      return existingForecast
    }

    // Get farm and paddock data
    const farm = await findFarmByExternalId(ctx, farmExternalId)
    if (!farm) {
      throw new Error(`Farm not found: ${farmExternalId}`)
    }

    const paddock = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q: any) =>
        q.eq('farmId', farm._id).eq('externalId', paddockExternalId)
      )
      .first()

    if (!paddock) {
      const allPaddocks = await ctx.db
        .query('paddocks')
        .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
        .collect()
      const paddockIds = allPaddocks.map((p: any) => p.externalId).join(', ')
      throw new Error(
        `Paddock not found: ${paddockExternalId}. ` +
          `Farm ${farmExternalId} has ${allPaddocks.length} paddocks: [${paddockIds}]`
      )
    }

    // Get farm settings
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .first()

    const progressionSettings = settings?.progressionSettings
    const livestockSettings = settings?.livestockSettings
    const rotationFrequency = settings?.rotationFrequency ?? 1

    // Get livestock for section sizing
    const livestockEntries = await ctx.db
      .query('livestock')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()

    // Calculate total AU
    const cowAU = livestockSettings?.cowAU ?? 1.0
    const calfAU = livestockSettings?.calfAU ?? 0.5
    const sheepAU = livestockSettings?.sheepAU ?? 0.2
    const lambAU = livestockSettings?.lambAU ?? 0.1
    const dailyDMPerAU = livestockSettings?.dailyDMPerAU ?? 12
    const pastureYieldKgPerHa =
      livestockSettings?.pastureYieldKgPerHa ?? DEFAULT_PASTURE_YIELD_KG_PER_HA

    let totalAU = 0
    for (const entry of livestockEntries) {
      if (entry.animalType === 'cow') {
        totalAU += entry.adultCount * cowAU + entry.offspringCount * calfAU
      } else if (entry.animalType === 'sheep') {
        totalAU += entry.adultCount * sheepAU + entry.offspringCount * lambAU
      }
    }

    // Calculate section size
    const paddockArea = paddock.area || 1
    const sectionSizeResult = calculateSectionSize({
      totalAnimalUnits: totalAU,
      dailyDMPerAU,
      pastureYieldKgPerHa,
      rotationFrequency,
      paddockAreaHa: paddockArea,
      minSectionPct: settings?.minSectionPct ?? DEFAULT_MIN_SECTION_PCT,
    })

    // Determine progression settings
    const startingCorner: StartingCorner =
      progressionSettings?.defaultStartCorner !== 'auto'
        ? ((progressionSettings?.defaultStartCorner as StartingCorner) ?? 'NW')
        : 'NW'

    const progressionDirection =
      progressionSettings?.defaultDirection !== 'auto'
        ? (progressionSettings?.defaultDirection ?? 'horizontal')
        : 'horizontal'

    // Estimate total sections needed
    const estimatedSections = Math.ceil(paddockArea / sectionSizeResult.targetSectionHa)
    const estimatedTotalDays = estimatedSections * rotationFrequency

    // Create the forecast with empty sections - agent will draw them
    const forecastId = await ctx.db.insert('paddockForecasts', {
      farmExternalId,
      paddockExternalId,
      status: 'active',
      startingCorner,
      progressionDirection,
      targetSectionHa: sectionSizeResult.targetSectionHa,
      targetSectionPct: sectionSizeResult.targetSectionPct,
      forecastedSections: [], // Agent will fill this in via drawSection
      estimatedTotalDays,
      activeSectionIndex: 0,
      daysInActiveSection: 1,
      grazingHistory: [],
      createdAt: now,
      createdBy: 'agent', // Agent creates these forecasts
      updatedAt: now,
    })

    log.debug('Created new empty paddock forecast', {
      forecastId: forecastId.toString(),
      paddockExternalId,
      targetSectionHa: sectionSizeResult.targetSectionHa,
      estimatedSections,
      estimatedTotalDays,
      startingCorner,
      progressionDirection,
    })

    return await ctx.db.get(forecastId)
  },
})

/**
 * Get the active forecast for a paddock
 */
export const getActiveForecast = query({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('paddockForecasts')
      .withIndex('by_active', (q: any) =>
        q
          .eq('farmExternalId', args.farmExternalId)
          .eq('paddockExternalId', args.paddockExternalId)
          .eq('status', 'active')
      )
      .first()
  },
})

/**
 * Delete an active forecast to allow regeneration with new algorithm
 * Used for testing/development when section generation logic changes
 */
export const deleteForecast = mutation({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const forecast = await ctx.db
      .query('paddockForecasts')
      .withIndex('by_active', (q: any) =>
        q
          .eq('farmExternalId', args.farmExternalId)
          .eq('paddockExternalId', args.paddockExternalId)
          .eq('status', 'active')
      )
      .first()

    if (!forecast) {
      return { deleted: false, message: 'No active forecast found' }
    }

    await ctx.db.delete(forecast._id)
    return {
      deleted: true,
      message: `Deleted forecast with ${forecast.forecastedSections.length} sections`,
      forecastId: forecast._id.toString(),
    }
  },
})

/**
 * Create a daily plan - today's concrete grazing recommendation
 */
export const createDailyPlan = mutation({
  args: {
    farmExternalId: v.string(),
    date: v.string(),
    forecastId: v.id('paddockForecasts'),
    paddockExternalId: v.string(),
    recommendedSectionIndex: v.number(),
    sectionGeometry: v.any(),
    sectionAreaHa: v.number(),
    sectionCentroid: v.array(v.number()),
    daysInSection: v.number(),
    estimatedForageRemaining: v.optional(v.number()),
    currentNdvi: v.optional(v.number()),
    reasoning: v.array(v.string()),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    // Check for existing plan today
    const existingPlan = await ctx.db
      .query('dailyPlans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q: any) => q.eq(q.field('date'), args.date))
      .first()

    if (existingPlan) {
      // Update existing plan
      await ctx.db.patch(existingPlan._id, {
        forecastId: args.forecastId,
        paddockExternalId: args.paddockExternalId,
        recommendedSectionIndex: args.recommendedSectionIndex,
        sectionGeometry: args.sectionGeometry,
        sectionAreaHa: args.sectionAreaHa,
        sectionCentroid: args.sectionCentroid,
        daysInSection: args.daysInSection,
        estimatedForageRemaining: args.estimatedForageRemaining,
        currentNdvi: args.currentNdvi,
        reasoning: args.reasoning,
        confidence: args.confidence,
      })

      log.debug('Updated existing daily plan', {
        planId: existingPlan._id.toString(),
        recommendedSectionIndex: args.recommendedSectionIndex,
        daysInSection: args.daysInSection,
      })

      return existingPlan._id
    }

    // Create new plan
    const planId = await ctx.db.insert('dailyPlans', {
      farmExternalId: args.farmExternalId,
      date: args.date,
      forecastId: args.forecastId,
      paddockExternalId: args.paddockExternalId,
      recommendedSectionIndex: args.recommendedSectionIndex,
      sectionGeometry: args.sectionGeometry,
      sectionAreaHa: args.sectionAreaHa,
      sectionCentroid: args.sectionCentroid,
      daysInSection: args.daysInSection,
      estimatedForageRemaining: args.estimatedForageRemaining,
      currentNdvi: args.currentNdvi,
      reasoning: args.reasoning,
      confidence: args.confidence,
      status: 'pending',
      createdAt: now,
    })

    log.debug('Created daily plan', {
      planId: planId.toString(),
      paddockExternalId: args.paddockExternalId,
      recommendedSectionIndex: args.recommendedSectionIndex,
      daysInSection: args.daysInSection,
    })

    return planId
  },
})

/**
 * Approve a daily plan and update the forecast progress
 */
export const approveDailyPlan = mutation({
  args: {
    planId: v.id('dailyPlans'),
    approvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    const plan = await ctx.db.get(args.planId)
    if (!plan) {
      throw new Error('Daily plan not found')
    }

    // Update plan status
    await ctx.db.patch(args.planId, {
      status: 'approved',
      approvedAt: now,
      approvedBy: args.approvedBy,
    })

    // Update the forecast progress
    const forecast = await ctx.db.get(plan.forecastId)
    if (!forecast) {
      throw new Error('Forecast not found')
    }

    const activeSection = forecast.forecastedSections[forecast.activeSectionIndex]
    const isMovingToNextSection = plan.recommendedSectionIndex > forecast.activeSectionIndex

    if (isMovingToNextSection) {
      // Record the completed section in history
      const grazingHistory = [...forecast.grazingHistory]
      grazingHistory.push({
        sectionIndex: forecast.activeSectionIndex,
        geometry: activeSection.geometry,
        areaHa: activeSection.areaHa,
        startedDate: forecast.updatedAt.split('T')[0],
        endedDate: today,
        actualDays: forecast.daysInActiveSection,
      })

      // Move to the new section
      await ctx.db.patch(forecast._id, {
        activeSectionIndex: plan.recommendedSectionIndex,
        daysInActiveSection: 1,
        grazingHistory,
        updatedAt: now,
      })

      log.debug('Approved daily plan - moved to next section', {
        forecastId: forecast._id.toString(),
        previousSection: forecast.activeSectionIndex,
        newSection: plan.recommendedSectionIndex,
      })
    } else {
      // Staying in current section - increment days
      await ctx.db.patch(forecast._id, {
        daysInActiveSection: forecast.daysInActiveSection + 1,
        updatedAt: now,
      })

      log.debug('Approved daily plan - staying in section', {
        forecastId: forecast._id.toString(),
        sectionIndex: forecast.activeSectionIndex,
        daysInSection: forecast.daysInActiveSection + 1,
      })
    }

    return args.planId
  },
})

/**
 * Get today's daily plan for a farm
 */
export const getTodayPlan = query({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0]

    return await ctx.db
      .query('dailyPlans')
      .withIndex('by_farm_date', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .filter((q: any) => q.eq(q.field('date'), today))
      .first()
  },
})

/**
 * Evaluate the forecast context for the agent to make a daily plan recommendation
 */
export const evaluateForecastContext = query({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const { farmExternalId, paddockExternalId } = args

    // Get farm settings
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .first()

    // Get grazing principles
    const principles = await ctx.db
      .query('grazingPrinciples')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farmExternalId))
      .first()

    const merged = mergeGrazingPrinciples({
      minDaysPerSection: principles?.minDaysPerSection,
      maxDaysPerSection: principles?.maxDaysPerSection,
      minNdviThreshold: principles?.minNdviThreshold ?? settings?.minNDVIThreshold,
    })

    // Get active forecast
    const forecast = await ctx.db
      .query('paddockForecasts')
      .withIndex('by_active', (q: any) =>
        q
          .eq('farmExternalId', farmExternalId)
          .eq('paddockExternalId', paddockExternalId)
          .eq('status', 'active')
      )
      .first()

    if (!forecast) {
      return {
        hasActiveForecast: false,
        shouldMoveToNextSection: true,
        reasoning: ['No active forecast - need to create one'],
        activeSectionIndex: 0,
        daysInActiveSection: 0,
      }
    }

    const activeSection = forecast.forecastedSections[forecast.activeSectionIndex]
    if (!activeSection) {
      // We've completed all sections
      return {
        hasActiveForecast: true,
        shouldMoveToNextSection: false,
        reasoning: ['All sections in forecast have been completed'],
        activeSectionIndex: forecast.activeSectionIndex,
        daysInActiveSection: forecast.daysInActiveSection,
        forecastComplete: true,
      }
    }

    // Get farm for livestock
    const farm = await findFarmByExternalId(ctx, farmExternalId)

    // Get livestock for forage calculation
    let totalAU = 0
    if (farm) {
      const livestockEntries = await ctx.db
        .query('livestock')
        .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
        .collect()

      const livestockSettings = settings?.livestockSettings
      const cowAU = livestockSettings?.cowAU ?? 1.0
      const calfAU = livestockSettings?.calfAU ?? 0.5
      const sheepAU = livestockSettings?.sheepAU ?? 0.2
      const lambAU = livestockSettings?.lambAU ?? 0.1

      for (const entry of livestockEntries) {
        if (entry.animalType === 'cow') {
          totalAU += entry.adultCount * cowAU + entry.offspringCount * calfAU
        } else if (entry.animalType === 'sheep') {
          totalAU += entry.adultCount * sheepAU + entry.offspringCount * lambAU
        }
      }
    }

    // Estimate forage remaining
    const dailyDMPerAU = settings?.livestockSettings?.dailyDMPerAU ?? 12
    const pastureYieldKgPerHa =
      settings?.livestockSettings?.pastureYieldKgPerHa ?? DEFAULT_PASTURE_YIELD_KG_PER_HA
    const initialForageKg = activeSection.areaHa * pastureYieldKgPerHa
    const consumedForageKg = totalAU * dailyDMPerAU * forecast.daysInActiveSection
    const remainingForageKg = Math.max(0, initialForageKg - consumedForageKg)
    const remainingForagePct = initialForageKg > 0 ? (remainingForageKg / initialForageKg) * 100 : 0

    // Get current NDVI
    const latestObs = await ctx.db
      .query('observations')
      .withIndex('by_paddock_date', (q: any) => q.eq('paddockExternalId', paddockExternalId))
      .order('desc')
      .first()

    const currentNdvi = latestObs?.ndviMean ?? 0.5

    // Build reasoning hints for agent (not a decision - agent decides)
    const reasoning: string[] = []

    // Timing hints
    if (forecast.daysInActiveSection < merged.minDaysPerSection) {
      reasoning.push(
        `Day ${forecast.daysInActiveSection} of minimum ${merged.minDaysPerSection} - consider staying unless forage depleted`
      )
    } else if (forecast.daysInActiveSection >= merged.maxDaysPerSection) {
      reasoning.push(`Reached maximum ${merged.maxDaysPerSection} days - consider moving`)
    } else {
      reasoning.push(
        `Day ${forecast.daysInActiveSection} meets minimum ${merged.minDaysPerSection} days`
      )
    }

    // Forage hints
    if (remainingForagePct < 20) {
      reasoning.push(`Forage low (~${Math.round(remainingForagePct)}% remaining) - consider moving`)
    } else if (remainingForagePct < 40) {
      reasoning.push(`Forage moderate (~${Math.round(remainingForagePct)}% remaining)`)
    } else {
      reasoning.push(`Forage adequate (~${Math.round(remainingForagePct)}% remaining)`)
    }

    // NDVI hints
    if (currentNdvi < merged.minNdviThreshold * 0.8) {
      reasoning.push(`Section NDVI (${currentNdvi.toFixed(2)}) dropped below threshold`)
    }

    // Calculate progress through forecast
    const completedSections = forecast.grazingHistory.length
    const totalSections = forecast.forecastedSections.length
    const progressPct =
      totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0

    return {
      hasActiveForecast: true,
      forecastId: forecast._id,
      reasoning, // Hints for agent, not a decision
      activeSectionIndex: forecast.activeSectionIndex,
      daysInActiveSection: forecast.daysInActiveSection,
      estimatedForageRemainingPct: Math.round(remainingForagePct),
      currentNdvi,
      activeSection,
      nextSection: forecast.forecastedSections[forecast.activeSectionIndex + 1] ?? null,
      forecastProgress: {
        completedSections,
        totalSections,
        progressPct,
        estimatedDaysRemaining:
          forecast.estimatedTotalDays - completedSections * (settings?.rotationFrequency ?? 1),
      },
      // Provide context for agent's autonomous decision
      minDaysPerSection: merged.minDaysPerSection,
      maxDaysPerSection: merged.maxDaysPerSection,
      minNdviThreshold: merged.minNdviThreshold,
    }
  },
})

// ============================================================================
// AUTONOMOUS AGENT SECTION DRAWING TOOLS
// The agent draws sections like a farmer would - direct polygon placement
// ============================================================================

/**
 * Draw a section for the forecast.
 * Agent provides polygon coordinates directly or uses rectangle helper.
 * Validates: inside paddock, no major overlaps, reasonable connectivity.
 */
export const drawSection = mutation({
  args: {
    forecastId: v.id('paddockForecasts'),
    // Option 1: Direct polygon coordinates [[lng, lat], ...]
    coordinates: v.optional(v.array(v.array(v.number()))),
    // Option 2: Rectangle helper
    rectangle: v.optional(
      v.object({
        corner: v.union(v.literal('NW'), v.literal('NE'), v.literal('SW'), v.literal('SE')),
        widthPct: v.number(),
        heightPct: v.number(),
      })
    ),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    const forecast = await ctx.db.get(args.forecastId)
    if (!forecast) {
      throw new Error('Forecast not found')
    }

    // Get paddock geometry
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', forecast.farmExternalId))
      .first()

    if (!farm) {
      throw new Error('Farm not found')
    }

    const paddock = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q: any) =>
        q.eq('farmId', farm._id).eq('externalId', forecast.paddockExternalId)
      )
      .first()

    if (!paddock) {
      throw new Error('Paddock not found')
    }

    const paddockFeature = paddock.geometry as Feature<Polygon>

    // Get grazed sections for validation
    const grazedSections: Polygon[] = forecast.grazingHistory.map((entry) => entry.geometry)

    let sectionCoords: number[][]

    // Option 2: Rectangle helper
    if (args.rectangle) {
      const result = createRectangleSection({
        paddockGeometry: paddockFeature,
        corner: args.rectangle.corner,
        widthPct: args.rectangle.widthPct,
        heightPct: args.rectangle.heightPct,
      })

      // Store result and return early since rectangle is pre-validated
      const sectionIndex = forecast.forecastedSections.length
      const newSection = {
        index: sectionIndex,
        geometry: result.geometry,
        centroid: result.centroid,
        areaHa: result.areaHa,
        quadrant: args.rectangle.corner,
        estimatedDays: 1, // Will be updated based on actual usage
      }

      await ctx.db.patch(args.forecastId, {
        forecastedSections: [...forecast.forecastedSections, newSection],
        createdBy: 'agent',
        updatedAt: now,
      })

      log.info('Drew rectangle section', {
        forecastId: args.forecastId,
        sectionIndex,
        corner: args.rectangle.corner,
        widthPct: args.rectangle.widthPct,
        heightPct: args.rectangle.heightPct,
        areaHa: result.areaHa,
      })

      return {
        success: true,
        sectionIndex,
        geometry: result.geometry,
        centroid: result.centroid,
        areaHa: result.areaHa,
        warnings: [],
      }
    }

    // Option 1: Direct coordinates
    if (!args.coordinates || args.coordinates.length < 3) {
      throw new Error('Must provide either coordinates (at least 3 points) or rectangle helper')
    }

    sectionCoords = args.coordinates

    // Validate the section
    const validation = validateAgentSection(
      sectionCoords,
      paddockFeature,
      grazedSections,
      forecast.targetSectionHa
    )

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      }
    }

    // Use the (possibly clipped) geometry
    const finalGeometry = validation.clippedGeometry!

    // Calculate centroid
    const sectionCentroid = getFeatureCentroid({
      type: 'Feature',
      properties: {},
      geometry: finalGeometry,
    })

    // Determine quadrant
    const paddockContext = getPaddockContext(paddockFeature)
    const centerLng = (paddockContext.bounds.minLng + paddockContext.bounds.maxLng) / 2
    const centerLat = (paddockContext.bounds.minLat + paddockContext.bounds.maxLat) / 2
    const isNorth = sectionCentroid[1] > centerLat
    const isWest = sectionCentroid[0] < centerLng
    const quadrant = `${isNorth ? 'N' : 'S'}${isWest ? 'W' : 'E'}`

    // Add section to forecast
    const sectionIndex = forecast.forecastedSections.length
    const newSection = {
      index: sectionIndex,
      geometry: finalGeometry,
      centroid: sectionCentroid,
      areaHa: validation.areaHa,
      quadrant,
      estimatedDays: 1,
    }

    await ctx.db.patch(args.forecastId, {
      forecastedSections: [...forecast.forecastedSections, newSection],
      createdBy: 'agent',
      updatedAt: now,
    })

    log.info('Drew section from coordinates', {
      forecastId: args.forecastId,
      sectionIndex,
      areaHa: validation.areaHa,
      quadrant,
      warnings: validation.warnings,
    })

    return {
      success: true,
      sectionIndex,
      geometry: finalGeometry,
      centroid: sectionCentroid,
      areaHa: validation.areaHa,
      warnings: validation.warnings,
    }
  },
})

/**
 * Get paddock context for agent's spatial reasoning.
 * Returns boundary coordinates, corners, and computed context.
 */
export const getPaddockContextForAgent = query({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const farm = await findFarmByExternalId(ctx, args.farmExternalId)
    if (!farm) {
      throw new Error('Farm not found')
    }

    const paddock = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q: any) =>
        q.eq('farmId', farm._id).eq('externalId', args.paddockExternalId)
      )
      .first()

    if (!paddock) {
      throw new Error('Paddock not found')
    }

    const paddockFeature = paddock.geometry as Feature<Polygon>
    const context = getPaddockContext(paddockFeature)

    return {
      boundary: context.boundary,
      corners: context.corners,
      totalAreaHa: context.totalAreaHa,
      aspectRatio: context.aspectRatio,
      bounds: context.bounds,
    }
  },
})

/**
 * Get the remaining ungrazed area.
 * Agent calls this to understand what's left to graze.
 */
export const getUngrazedRemaining = query({
  args: {
    forecastId: v.id('paddockForecasts'),
  },
  handler: async (ctx, args) => {
    const forecast = await ctx.db.get(args.forecastId)
    if (!forecast) {
      throw new Error('Forecast not found')
    }

    // Get paddock geometry
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', forecast.farmExternalId))
      .first()

    if (!farm) {
      throw new Error('Farm not found')
    }

    const paddock = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q: any) =>
        q.eq('farmId', farm._id).eq('externalId', forecast.paddockExternalId)
      )
      .first()

    if (!paddock) {
      throw new Error('Paddock not found')
    }

    const paddockFeature = paddock.geometry as Feature<Polygon>

    // Get all grazed sections from history
    const grazedSections: Polygon[] = forecast.grazingHistory.map((entry) => entry.geometry)

    // Compute remaining area
    const result = computeUngrazedRemaining({
      paddockGeometry: paddockFeature,
      grazedSections,
    })

    log.info('Computed ungrazed remaining area', {
      forecastId: args.forecastId,
      grazedSectionsCount: grazedSections.length,
      remainingAreaHa: result.areaHa,
      remainingPct: result.percentOfPaddock,
      shape: result.shape,
      approximateLocation: result.approximateLocation,
    })

    return {
      geometry: result.geometry,
      centroid: result.centroid,
      areaHa: result.areaHa,
      percentOfPaddock: result.percentOfPaddock,
      shape: result.shape,
      approximateLocation: result.approximateLocation,
    }
  },
})

/**
 * Clear all sections from a forecast to allow re-drawing.
 * Used when agent wants to start fresh.
 */
export const clearForecastSections = mutation({
  args: {
    forecastId: v.id('paddockForecasts'),
  },
  handler: async (ctx, args) => {
    const forecast = await ctx.db.get(args.forecastId)
    if (!forecast) {
      throw new Error('Forecast not found')
    }

    await ctx.db.patch(args.forecastId, {
      forecastedSections: [],
      activeSectionIndex: 0,
      daysInActiveSection: 1,
      grazingHistory: [],
      createdBy: 'agent',
      updatedAt: new Date().toISOString(),
    })

    log.info('Cleared forecast sections', {
      forecastId: args.forecastId,
      previousSectionsCount: forecast.forecastedSections.length,
    })

    return { success: true }
  },
})
