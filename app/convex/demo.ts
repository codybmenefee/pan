import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server'
import { v } from 'convex/values'
import type { Feature, Polygon } from 'geojson'
import bbox from '@turf/bbox'
import area from '@turf/area'
import intersect from '@turf/intersect'
import { featureCollection, polygon } from '@turf/helpers'
import { pastureGeometries, ROTATION_CONFIG, samplePastures } from './seedData'
import { HECTARES_PER_SQUARE_METER } from './lib/areaConstants'

// Source farm to copy data from (dev user's farm)
const SOURCE_FARM_EXTERNAL_ID = 'farm-1'

// ============================================================================
// Types
// ============================================================================

interface PastureData {
  externalId: string
  name: string
  geometry: Feature<Polygon>
  area: number
}

interface RotationDay {
  date: string
  pastureId: string
  stripIndex: number
  isNewPasture: boolean
  totalStripsInPasture: number
}

interface PastureStateUpdate {
  externalId: string
  ndvi: number
  restDays: number
  status: 'grazed' | 'recovering' | 'almost_ready' | 'ready'
  lastGrazed: string | null
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a date string for N days relative to a base date in YYYY-MM-DD format.
 */
function getDateString(baseDate: Date, daysOffset: number): string {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString().split('T')[0]
}

/**
 * Calculate area in hectares from a geometry.
 */
function calculateAreaHectares(geometry: Feature<Polygon>): number {
  try {
    const sqMeters = area(geometry)
    return Number.isFinite(sqMeters) ? Math.round((sqMeters * HECTARES_PER_SQUARE_METER) * 10) / 10 : 0
  } catch {
    return 0
  }
}

/**
 * Generate N equal strips (paddocks) within a pasture geometry.
 * Strips are oriented along the longer axis of the pasture's bounding box.
 */
function generatePastureStrips(
  pastureGeometry: Feature<Polygon>,
  numStrips: number = ROTATION_CONFIG.DEFAULT_STRIPS_PER_PASTURE
): Polygon[] {
  // Get bounding box [minLng, minLat, maxLng, maxLat]
  const [minLng, minLat, maxLng, maxLat] = bbox(pastureGeometry)

  const width = maxLng - minLng   // longitude span
  const height = maxLat - minLat  // latitude span

  // Determine orientation: strips run perpendicular to the shorter axis
  // For typical pastures that are wider than tall, we create horizontal strips (north to south)
  // For pastures taller than wide, we create vertical strips (west to east)
  const isHorizontalStrips = height >= width

  const strips: Polygon[] = []

  for (let i = 0; i < numStrips; i++) {
    let stripPolygon: Polygon

    if (isHorizontalStrips) {
      // Horizontal strips (divide by latitude, strips go north to south)
      const stripHeight = height / numStrips
      const stripNorth = maxLat - (i * stripHeight)
      const stripSouth = stripNorth - stripHeight

      stripPolygon = {
        type: 'Polygon',
        coordinates: [[
          [minLng, stripNorth],
          [maxLng, stripNorth],
          [maxLng, stripSouth],
          [minLng, stripSouth],
          [minLng, stripNorth],
        ]],
      }
    } else {
      // Vertical strips (divide by longitude, strips go west to east)
      const stripWidth = width / numStrips
      const stripWest = minLng + (i * stripWidth)
      const stripEast = stripWest + stripWidth

      stripPolygon = {
        type: 'Polygon',
        coordinates: [[
          [stripWest, maxLat],
          [stripEast, maxLat],
          [stripEast, minLat],
          [stripWest, minLat],
          [stripWest, maxLat],
        ]],
      }
    }

    // Clip strip to pasture boundary
    const stripFeature: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: stripPolygon,
    }

    const clipped = intersect(featureCollection([stripFeature, pastureGeometry]))

    if (clipped && clipped.geometry.type === 'Polygon') {
      strips.push(clipped.geometry as Polygon)
    } else if (clipped && clipped.geometry.type === 'MultiPolygon') {
      // If clipping produces multiple polygons, take the largest one
      let bestArea = 0
      let bestPolygon: Polygon | null = null

      for (const coords of clipped.geometry.coordinates) {
        const candidate = polygon(coords)
        const candidateArea = area(candidate)
        if (candidateArea > bestArea) {
          bestArea = candidateArea
          bestPolygon = { type: 'Polygon', coordinates: coords }
        }
      }

      if (bestPolygon) {
        strips.push(bestPolygon)
      }
    }
  }

  return strips
}

/**
 * Get number of strips for a pasture based on its area.
 * Larger pastures get more strips.
 */
function getStripsForPasture(pastureArea: number): number {
  if (pastureArea >= 5) return 4
  if (pastureArea >= 3) return 3
  return 3
}

/**
 * Generate a realistic rotation sequence over a given number of days.
 * Rotates through pastures, spending 3-4 days in each (one strip per day).
 */
function generateRotationSequence(
  pastures: PastureData[],
  demoDate: Date,
  historyDays: number
): RotationDay[] {
  const sequence: RotationDay[] = []

  // Track when each pasture was last grazed (for rest period)
  const lastGrazedDay: Record<string, number> = {}

  // Start historyDays ago
  let currentDayOffset = -historyDays

  // Pre-seed some pastures as having been grazed long ago (before our window)
  // This creates variety in rest periods
  const pastureIds = pastures.map(p => p.externalId)
  pastureIds.forEach((id, index) => {
    // Stagger initial grazing dates: some 30+ days ago, some 20+ days ago
    lastGrazedDay[id] = -historyDays - 20 - (index * 5)
  })

  // Current pasture index and strip within that pasture
  let currentPastureIndex = 0
  let currentStripIndex = 0
  let daysInCurrentPasture = 0

  // Find a good starting pasture (one that's been rested long enough)
  const findNextPasture = (fromIndex: number): number => {
    // Try to find a pasture that has rested at least MIN_REST_PERIOD
    for (let offset = 1; offset <= pastures.length; offset++) {
      const candidateIndex = (fromIndex + offset) % pastures.length
      const pastureId = pastures[candidateIndex].externalId
      const daysSinceGrazed = currentDayOffset - (lastGrazedDay[pastureId] ?? -100)

      if (daysSinceGrazed >= ROTATION_CONFIG.MIN_REST_PERIOD) {
        return candidateIndex
      }
    }

    // If no pasture has rested enough, pick the one with longest rest
    let bestIndex = (fromIndex + 1) % pastures.length
    let longestRest = 0

    for (let i = 0; i < pastures.length; i++) {
      if (i === fromIndex) continue
      const daysSinceGrazed = currentDayOffset - (lastGrazedDay[pastures[i].externalId] ?? -100)
      if (daysSinceGrazed > longestRest) {
        longestRest = daysSinceGrazed
        bestIndex = i
      }
    }

    return bestIndex
  }

  // Start with a pasture that has good rest
  currentPastureIndex = findNextPasture(-1)
  let currentPasture = pastures[currentPastureIndex]
  let currentStripsTotal = getStripsForPasture(currentPasture.area)

  while (currentDayOffset <= 0) {
    const dateStr = getDateString(demoDate, currentDayOffset)
    const isNewPasture = daysInCurrentPasture === 0

    sequence.push({
      date: dateStr,
      pastureId: currentPasture.externalId,
      stripIndex: currentStripIndex,
      isNewPasture,
      totalStripsInPasture: currentStripsTotal,
    })

    // Update state
    currentStripIndex++
    daysInCurrentPasture++
    currentDayOffset++

    // Check if we should move to next pasture
    // Move when: we've done all strips OR we've hit MAX_DAYS_IN_PASTURE
    const shouldMovePasture =
      currentStripIndex >= currentStripsTotal ||
      daysInCurrentPasture >= ROTATION_CONFIG.MAX_DAYS_IN_PASTURE

    if (shouldMovePasture && currentDayOffset <= 0) {
      // Record when this pasture was last grazed
      lastGrazedDay[currentPasture.externalId] = currentDayOffset - 1

      // Find next pasture
      currentPastureIndex = findNextPasture(currentPastureIndex)
      currentPasture = pastures[currentPastureIndex]
      currentStripsTotal = getStripsForPasture(currentPasture.area)
      currentStripIndex = 0
      daysInCurrentPasture = 0
    }
  }

  return sequence
}

/**
 * Calculate pasture states based on generated grazing history.
 */
function simulatePastureStates(
  rotationSequence: RotationDay[],
  demoDate: Date,
  pastures: PastureData[]
): PastureStateUpdate[] {
  const demoDateStr = getDateString(demoDate, 0)

  // Find last grazing date for each pasture
  const lastGrazedMap: Record<string, string> = {}

  for (const day of rotationSequence) {
    // Only count executed days (not today's pending plan)
    if (day.date < demoDateStr) {
      lastGrazedMap[day.pastureId] = day.date
    }
  }

  const updates: PastureStateUpdate[] = []

  for (const pasture of pastures) {
    const lastGrazed = lastGrazedMap[pasture.externalId] ?? null

    let restDays = 30  // Default if never grazed in our window
    if (lastGrazed) {
      const lastDate = new Date(lastGrazed)
      restDays = Math.floor((demoDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Calculate NDVI based on rest days (recovery model)
    // NDVI drops to MIN after grazing, recovers at ~0.025/day, caps at MAX
    let ndvi = ROTATION_CONFIG.MIN_NDVI_AFTER_GRAZING +
      (restDays * ROTATION_CONFIG.NDVI_RECOVERY_RATE_PER_DAY)
    ndvi = Math.min(ndvi, ROTATION_CONFIG.MAX_NDVI_RECOVERED)
    ndvi = Math.round(ndvi * 100) / 100  // Round to 2 decimals

    // Determine status based on NDVI and rest days
    let status: PastureStateUpdate['status']
    if (restDays < 7) {
      status = 'grazed'
    } else if (ndvi >= 0.45 && restDays >= 21) {
      status = 'ready'
    } else if (ndvi >= 0.40 && restDays >= 14) {
      status = 'almost_ready'
    } else {
      status = 'recovering'
    }

    updates.push({
      externalId: pasture.externalId,
      ndvi,
      restDays,
      status,
      lastGrazed,
    })
  }

  return updates
}

/**
 * Generate historical demo data for a demo farm.
 * Creates ~14 days of realistic rotation history across all pastures.
 */
async function generateHistoricalDemoData(
  ctx: any,
  demoFarmId: string,
  demoDate: string,
  historyDays: number = 14
): Promise<{ plansCreated: number; pastureStates: PastureStateUpdate[] }> {
  const demoDt = new Date(demoDate + 'T12:00:00Z')
  const now = new Date().toISOString()

  console.log('[generateHistoricalDemoData] Starting', { demoFarmId, demoDate, historyDays })

  // Get pasture data from our geometries
  const pastures: PastureData[] = Object.entries(pastureGeometries).map(([externalId, geometry]) => {
    const pastureInfo = samplePastures.find(p => p.externalId === externalId)
    return {
      externalId,
      name: pastureInfo?.name ?? externalId,
      geometry,
      area: calculateAreaHectares(geometry),
    }
  })

  console.log('[generateHistoricalDemoData] Pastures available:', pastures.map(p => ({ id: p.externalId, name: p.name, area: p.area })))

  // Generate rotation sequence
  const rotationSequence = generateRotationSequence(pastures, demoDt, historyDays)

  console.log('[generateHistoricalDemoData] Rotation sequence:', rotationSequence.map(r => ({ date: r.date, pasture: r.pastureId, strip: r.stripIndex })))

  // Pre-generate all strips for each pasture
  const pastureStrips: Record<string, Polygon[]> = {}
  for (const pasture of pastures) {
    const numStrips = getStripsForPasture(pasture.area)
    pastureStrips[pasture.externalId] = generatePastureStrips(pasture.geometry, numStrips)
  }

  // Create plans for each day in the rotation
  let plansCreated = 0
  const todayStr = getDateString(demoDt, 0)

  for (const day of rotationSequence) {
    const isToday = day.date === todayStr
    const status = isToday ? 'pending' : 'executed'

    const pasture = pastures.find(p => p.externalId === day.pastureId)
    const strips = pastureStrips[day.pastureId]
    const stripGeometry = strips?.[day.stripIndex] ?? strips?.[0]

    if (!stripGeometry) {
      console.warn(`No strip geometry for pasture ${day.pastureId}, strip ${day.stripIndex}`)
      continue
    }

    const stripFeature: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: stripGeometry,
    }
    const stripArea = calculateAreaHectares(stripFeature)

    // Calculate cumulative grazed percentage for this pasture rotation
    const pastureGrazedPercentage = Math.round(
      ((day.stripIndex + 1) / day.totalStripsInPasture) * 100
    )

    // Generate contextual reasoning
    const dayInPasture = day.stripIndex + 1
    const reasoning = day.isNewPasture
      ? [
          `Starting rotation in ${pasture?.name ?? day.pastureId}`,
          'Good NDVI values after adequate rest period',
          `Day 1 of ${day.totalStripsInPasture}-day rotation`,
        ]
      : [
          `Day ${dayInPasture} of ${pasture?.name ?? day.pastureId} rotation`,
          'Continuing progressive strip grazing pattern',
          'Adjacent to previous paddock for efficient livestock movement',
        ]

    await ctx.db.insert('plans', {
      farmExternalId: demoFarmId,
      date: day.date,
      primaryPaddockExternalId: day.pastureId,
      alternativePaddockExternalIds: [],
      confidenceScore: 80 + Math.floor(Math.random() * 10), // 80-89
      reasoning,
      status,
      sectionGeometry: stripGeometry,
      sectionAreaHectares: stripArea,
      sectionJustification: day.isNewPasture
        ? `Starting ${day.totalStripsInPasture}-strip rotation in ${pasture?.name ?? day.pastureId}`
        : `Strip ${dayInPasture}/${day.totalStripsInPasture} - progressive grazing pattern`,
      paddockGrazedPercentage: pastureGrazedPercentage,
      createdAt: now,
      updatedAt: now,
    })

    // Create corresponding grazing event for historical days
    if (!isToday) {
      await ctx.db.insert('grazingEvents', {
        farmExternalId: demoFarmId,
        paddockExternalId: day.pastureId,
        date: day.date,
        durationDays: 1,
        notes: day.isNewPasture
          ? `Started rotation in ${pasture?.name ?? day.pastureId}`
          : `Day ${dayInPasture} in ${pasture?.name ?? day.pastureId}`,
        createdAt: now,
      })
    }

    plansCreated++
  }

  // Calculate final pasture states
  const pastureStates = simulatePastureStates(rotationSequence, demoDt, pastures)

  return { plansCreated, pastureStates }
}

// ============================================================================
// Farm Data Copy (base data without plans)
// ============================================================================

/**
 * Helper to copy base data from the source farm to a demo farm.
 * Copies all farm data EXCEPT plans and grazing events (those are generated).
 */
async function copyFarmBaseData(
  ctx: any,
  sourceFarmExternalId: string,
  demoFarmId: string,
  demoUserId: string
) {
  const now = new Date().toISOString()

  // Get the source farm
  let sourceFarm = await ctx.db
    .query('farms')
    .withIndex('by_externalId', (q: any) => q.eq('externalId', sourceFarmExternalId))
    .first()

  // Also check legacyExternalId for migration support
  if (!sourceFarm) {
    sourceFarm = await ctx.db
      .query('farms')
      .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', sourceFarmExternalId))
      .first()
  }

  if (!sourceFarm) {
    throw new Error(`Source farm not found: ${sourceFarmExternalId}`)
  }

  // Create the demo farm (copy farm data)
  const farmId = await ctx.db.insert('farms', {
    externalId: demoFarmId,
    name: `Demo - ${sourceFarm.name}`,
    location: sourceFarm.location,
    totalArea: sourceFarm.totalArea,
    paddockCount: sourceFarm.paddockCount,
    coordinates: sourceFarm.coordinates,
    geometry: sourceFarm.geometry,
    isDemoFarm: true,
    demoCreatedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  // Copy pastures
  const sourcePastures = await ctx.db
    .query('paddocks')
    .withIndex('by_farm', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  const pastureIdMap = new Map<string, string>() // old _id -> new _id
  for (const pasture of sourcePastures) {
    const newPastureId = await ctx.db.insert('paddocks', {
      farmId,
      externalId: pasture.externalId,
      name: pasture.name,
      status: pasture.status,
      ndvi: pasture.ndvi,
      restDays: pasture.restDays,
      area: pasture.area,
      waterAccess: pasture.waterAccess,
      lastGrazed: pasture.lastGrazed,
      geometry: pasture.geometry,
      overrideMinNDVIThreshold: pasture.overrideMinNDVIThreshold,
      overrideMinRestPeriodDays: pasture.overrideMinRestPeriodDays,
      createdAt: now,
      updatedAt: now,
    })
    pastureIdMap.set(pasture._id, newPastureId)
  }

  // Copy observations (use demo farm external ID)
  const sourceObservations = await ctx.db
    .query('observations')
    .withIndex('by_farm', (q: any) => q.eq('farmExternalId', sourceFarmExternalId))
    .collect()

  for (const obs of sourceObservations) {
    await ctx.db.insert('observations', {
      farmExternalId: demoFarmId,
      paddockExternalId: obs.paddockExternalId,
      date: obs.date,
      ndviMean: obs.ndviMean,
      ndviMin: obs.ndviMin,
      ndviMax: obs.ndviMax,
      ndviStd: obs.ndviStd,
      eviMean: obs.eviMean,
      ndwiMean: obs.ndwiMean,
      cloudFreePct: obs.cloudFreePct,
      pixelCount: obs.pixelCount,
      isValid: obs.isValid,
      sourceProvider: obs.sourceProvider,
      resolutionMeters: obs.resolutionMeters,
      createdAt: obs.createdAt,
    })
  }

  // NOTE: We do NOT copy grazing events or plans - those are generated

  // Copy farm settings (with professional tier for demo)
  const sourceSettings = await ctx.db
    .query('farmSettings')
    .withIndex('by_farm', (q: any) => q.eq('farmExternalId', sourceFarmExternalId))
    .first()

  if (sourceSettings) {
    await ctx.db.insert('farmSettings', {
      farmExternalId: demoFarmId,
      subscriptionTier: 'premium', // Demo users get premium features
      minNDVIThreshold: sourceSettings.minNDVIThreshold,
      minRestPeriod: sourceSettings.minRestPeriod,
      cloudCoverTolerance: sourceSettings.cloudCoverTolerance,
      dailyBriefTime: sourceSettings.dailyBriefTime,
      emailNotifications: sourceSettings.emailNotifications,
      pushNotifications: sourceSettings.pushNotifications,
      virtualFenceProvider: sourceSettings.virtualFenceProvider,
      apiKey: sourceSettings.apiKey,
      mapPreferences: sourceSettings.mapPreferences,
      livestockSettings: sourceSettings.livestockSettings,
      areaUnit: sourceSettings.areaUnit,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Copy no-graze zones
  const sourceNoGrazeZones = await ctx.db
    .query('noGrazeZones')
    .withIndex('by_farm', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  for (const zone of sourceNoGrazeZones) {
    await ctx.db.insert('noGrazeZones', {
      farmId,
      name: zone.name,
      type: zone.type,
      area: zone.area,
      description: zone.description,
      geometry: zone.geometry,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Copy water sources
  const sourceWaterSources = await ctx.db
    .query('waterSources')
    .withIndex('by_farm', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  for (const source of sourceWaterSources) {
    await ctx.db.insert('waterSources', {
      farmId,
      name: source.name,
      type: source.type,
      geometryType: source.geometryType,
      geometry: source.geometry,
      area: source.area,
      description: source.description,
      status: source.status,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Copy livestock
  const sourceLivestock = await ctx.db
    .query('livestock')
    .withIndex('by_farm', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  for (const animal of sourceLivestock) {
    await ctx.db.insert('livestock', {
      farmId,
      animalType: animal.animalType,
      adultCount: animal.adultCount,
      offspringCount: animal.offspringCount,
      notes: animal.notes,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Copy satellite image tiles (reference same R2 URLs - they're read-only)
  const sourceTiles = await ctx.db
    .query('satelliteImageTiles')
    .withIndex('by_farm_date', (q: any) => q.eq('farmId', sourceFarm._id))
    .collect()

  for (const tile of sourceTiles) {
    await ctx.db.insert('satelliteImageTiles', {
      farmId,
      captureDate: tile.captureDate,
      provider: tile.provider,
      tileType: tile.tileType,
      r2Key: tile.r2Key,
      r2Url: tile.r2Url,
      bounds: tile.bounds,
      cloudCoverPct: tile.cloudCoverPct,
      resolutionMeters: tile.resolutionMeters,
      fileSizeBytes: tile.fileSizeBytes,
      createdAt: tile.createdAt,
      expiresAt: tile.expiresAt,
    })
  }

  // Create demo user
  await ctx.db.insert('users', {
    externalId: demoUserId,
    farmExternalId: demoFarmId,
    name: 'Demo User',
    createdAt: now,
    updatedAt: now,
  })

  return {
    farmId,
    pastureCount: sourcePastures.length,
    observationCount: sourceObservations.length,
    tileCount: sourceTiles.length,
  }
}

/**
 * Update pasture states in the database based on simulation results.
 */
async function updatePastureStates(
  ctx: any,
  farmId: any,
  pastureStates: PastureStateUpdate[]
) {
  const now = new Date().toISOString()

  for (const state of pastureStates) {
    const pasture = await ctx.db
      .query('paddocks')
      .withIndex('by_farm_externalId', (q: any) =>
        q.eq('farmId', farmId).eq('externalId', state.externalId)
      )
      .first()

    if (pasture) {
      // Build patch object - only include lastGrazed if it has a value
      // (schema requires string, not nullable)
      const patchData: Record<string, unknown> = {
        ndvi: state.ndvi,
        restDays: state.restDays,
        status: state.status,
        updatedAt: now,
      }

      if (state.lastGrazed) {
        // Format as human-readable date like 'Jan 2' to match existing data
        const date = new Date(state.lastGrazed)
        patchData.lastGrazed = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      }

      await ctx.db.patch(pasture._id, patchData)
    }
  }
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Seed a demo farm by copying base data from the dev user's farm
 * and generating fresh historical rotation data.
 */
export const seedDemoFarm = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const demoFarmId = `demo-farm-${args.sessionId}`
    const demoUserId = `demo-user-${args.sessionId}`

    // Check if demo farm already exists
    const existingFarm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', demoFarmId))
      .first()

    if (existingFarm) {
      return {
        farmId: existingFarm._id,
        farmExternalId: demoFarmId,
        alreadySeeded: true,
      }
    }

    // Copy base data from the source farm (excludes plans and events)
    const result = await copyFarmBaseData(ctx, SOURCE_FARM_EXTERNAL_ID, demoFarmId, demoUserId)

    // Generate historical demo data
    const today = new Date().toISOString().split('T')[0]
    const { plansCreated, pastureStates } = await generateHistoricalDemoData(
      ctx,
      demoFarmId,
      today,
      14 // 14 days of history
    )

    // Update pasture states based on generated history
    await updatePastureStates(ctx, result.farmId, pastureStates)

    return {
      farmId: result.farmId,
      farmExternalId: demoFarmId,
      pastureCount: result.pastureCount,
      plansCreated,
      alreadySeeded: false,
    }
  },
})

/**
 * Regenerate demo history for an existing demo farm.
 * Deletes existing plans/events and generates fresh data.
 */
export const regenerateDemoHistory = mutation({
  args: {
    farmExternalId: v.string(),
    demoDate: v.optional(v.string()),  // YYYY-MM-DD, defaults to today
    historyDays: v.optional(v.number()), // defaults to 14
  },
  handler: async (ctx, args) => {
    const demoDate = args.demoDate ?? new Date().toISOString().split('T')[0]
    const historyDays = args.historyDays ?? 14

    console.log('[regenerateDemoHistory] Called with:', { farmExternalId: args.farmExternalId, demoDate, historyDays })

    // Get the farm
    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q: any) => q.eq('externalId', args.farmExternalId))
      .first()

    if (!farm) {
      throw new Error(`Farm not found: ${args.farmExternalId}`)
    }

    console.log('[regenerateDemoHistory] Found farm:', { farmId: farm._id, name: farm.name })

    // Delete existing plans
    const existingPlans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    console.log('[regenerateDemoHistory] Deleting existing plans:', existingPlans.length)

    for (const plan of existingPlans) {
      await ctx.db.delete(plan._id)
    }

    // Delete existing grazing events
    const existingEvents = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    for (const event of existingEvents) {
      await ctx.db.delete(event._id)
    }

    // Generate fresh historical data
    const { plansCreated, pastureStates } = await generateHistoricalDemoData(
      ctx,
      args.farmExternalId,
      demoDate,
      historyDays
    )

    // Update pasture states
    await updatePastureStates(ctx, farm._id, pastureStates)

    console.log('[regenerateDemoHistory] Complete:', { plansCreated, pastureStatesUpdated: pastureStates.length })

    return {
      plansCreated,
      eventsCreated: plansCreated - 1, // All except today's pending plan
      pastureStatesUpdated: pastureStates.length,
      demoDate,
      historyDays,
    }
  },
})

/**
 * Helper to delete all demo farm data.
 */
async function deleteDemoFarmData(ctx: any, demoFarmId: string, demoUserId: string) {
  // Find the farm
  const farm = await ctx.db
    .query('farms')
    .withIndex('by_externalId', (q: any) => q.eq('externalId', demoFarmId))
    .first()

  if (farm) {
    // Delete pastures
    const pastures = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const p of pastures) {
      await ctx.db.delete(p._id)
    }

    // Delete grazing events
    const events = await ctx.db
      .query('grazingEvents')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', demoFarmId))
      .collect()
    for (const e of events) {
      await ctx.db.delete(e._id)
    }

    // Delete observations
    const observations = await ctx.db
      .query('observations')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', demoFarmId))
      .collect()
    for (const o of observations) {
      await ctx.db.delete(o._id)
    }

    // Delete plans
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', demoFarmId))
      .collect()
    for (const p of plans) {
      await ctx.db.delete(p._id)
    }

    // Delete farm settings
    const settings = await ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', demoFarmId))
      .first()
    if (settings) {
      await ctx.db.delete(settings._id)
    }

    // Delete no-graze zones
    const noGrazeZones = await ctx.db
      .query('noGrazeZones')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const z of noGrazeZones) {
      await ctx.db.delete(z._id)
    }

    // Delete water sources
    const waterSources = await ctx.db
      .query('waterSources')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const w of waterSources) {
      await ctx.db.delete(w._id)
    }

    // Delete livestock
    const livestock = await ctx.db
      .query('livestock')
      .withIndex('by_farm', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const l of livestock) {
      await ctx.db.delete(l._id)
    }

    // Delete satellite tiles
    const tiles = await ctx.db
      .query('satelliteImageTiles')
      .withIndex('by_farm_date', (q: any) => q.eq('farmId', farm._id))
      .collect()
    for (const t of tiles) {
      await ctx.db.delete(t._id)
    }

    // Delete the farm
    await ctx.db.delete(farm._id)
  }

  // Delete user
  const user = await ctx.db
    .query('users')
    .withIndex('by_externalId', (q: any) => q.eq('externalId', demoUserId))
    .first()
  if (user) {
    await ctx.db.delete(user._id)
  }
}

/**
 * Reset a demo farm by deleting all data and re-copying from source.
 */
export const resetDemoFarm = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const demoFarmId = `demo-farm-${args.sessionId}`
    const demoUserId = `demo-user-${args.sessionId}`

    // Delete existing demo data
    await deleteDemoFarmData(ctx, demoFarmId, demoUserId)

    // Copy base data from source farm
    const result = await copyFarmBaseData(ctx, SOURCE_FARM_EXTERNAL_ID, demoFarmId, demoUserId)

    // Generate fresh historical data
    const today = new Date().toISOString().split('T')[0]
    const { plansCreated, pastureStates } = await generateHistoricalDemoData(
      ctx,
      demoFarmId,
      today,
      14
    )

    // Update pasture states
    await updatePastureStates(ctx, result.farmId, pastureStates)

    return {
      farmId: result.farmId,
      farmExternalId: demoFarmId,
      pastureCount: result.pastureCount,
      plansCreated,
      reset: true,
    }
  },
})

/**
 * Clean up demo farms older than 24 hours.
 * Called by a scheduled cron job.
 */
export const cleanupOldDemoFarms = mutation({
  handler: async (ctx) => {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Find all demo farms older than 24 hours
    const demoFarms = await ctx.db
      .query('farms')
      .withIndex('by_isDemoFarm', (q: any) => q.eq('isDemoFarm', true))
      .collect()

    let deletedCount = 0
    for (const farm of demoFarms) {
      if (farm.demoCreatedAt && farm.demoCreatedAt < cutoffTime) {
        const demoUserId = farm.externalId.replace('demo-farm-', 'demo-user-')
        await deleteDemoFarmData(ctx, farm.externalId, demoUserId)
        deletedCount++
      }
    }

    return { deletedCount }
  },
})

/**
 * Force delete ALL demo farms (for dev sync).
 * Use when you need to refresh demo farms with updated source data.
 */
export const forceCleanupAllDemoFarms = mutation({
  handler: async (ctx) => {
    const demoFarms = await ctx.db
      .query('farms')
      .withIndex('by_isDemoFarm', (q: any) => q.eq('isDemoFarm', true))
      .collect()

    let deletedCount = 0
    for (const farm of demoFarms) {
      const demoUserId = farm.externalId.replace('demo-farm-', 'demo-user-')
      await deleteDemoFarmData(ctx, farm.externalId, demoUserId)
      deletedCount++
    }

    return { deletedCount }
  },
})

// ============================================================================
// Queries
// ============================================================================

/**
 * Check if a demo farm exists for a given session ID.
 */
export const getDemoFarm = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const demoFarmId = `demo-farm-${args.sessionId}`
    return await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', demoFarmId))
      .first()
  },
})

/**
 * Debug: List all historical plans for a farm.
 */
export const debugListHistoricalPlans = query({
  args: {
    farmExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query('plans')
      .withIndex('by_farm', (q: any) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    return plans
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p: any) => ({
        date: p.date,
        pasture: p.primaryPaddockExternalId,
        status: p.status,
        hasPaddock: !!p.sectionGeometry,
        areaHa: p.sectionAreaHectares,
        grazedPct: p.paddockGrazedPercentage,
      }))
  },
})

/**
 * Debug: List all demo farms and their plans.
 */
export const debugListDemoFarmsWithPlans = query({
  handler: async (ctx) => {
    const demoFarms = await ctx.db
      .query('farms')
      .withIndex('by_isDemoFarm', (q: any) => q.eq('isDemoFarm', true))
      .collect()

    const results = []
    for (const farm of demoFarms) {
      const plans = await ctx.db
        .query('plans')
        .withIndex('by_farm', (q: any) => q.eq('farmExternalId', farm.externalId))
        .collect()

      results.push({
        farmId: farm.externalId,
        planCount: plans.length,
        plans: plans.map((p: any) => ({
          date: p.date,
          primaryPaddockExternalId: p.primaryPaddockExternalId,
          hasSectionGeometry: !!p.sectionGeometry,
          sectionAreaHectares: p.sectionAreaHectares,
        })),
      })
    }
    return results
  },
})
