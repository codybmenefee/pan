import type { Feature, Polygon, Position } from 'geojson'
import type { Paddock, Pasture, PaddockAlternative } from './types'
import { calculateAreaHectares } from './geometry/geometryUtils'

/**
 * Paddock Generator
 *
 * Generates procedural, plausible-looking paddock polygons within pasture boundaries.
 * These paddocks represent daily grazing allocations - oblong strips that the AI
 * would strategically draw based on NDVI, prior coverage, and herd size.
 *
 * This is mock generation for the prototype - real implementation would use
 * satellite data and optimization algorithms.
 */

interface PaddockParams {
  pasture: Pasture
  dayIndex: number // 0-based day within the pasture stay
  totalDays: number // Total planned days in this pasture
  targetAreaHectares?: number // Optional override for paddock size
  seed?: number // For reproducible generation
}

/**
 * Simple seeded random number generator for reproducible paddocks
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * Get the bounding box of a polygon
 */
function getBounds(polygon: Feature<Polygon>): {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
} {
  const coords = polygon.geometry.coordinates[0]
  let minLng = Infinity, maxLng = -Infinity
  let minLat = Infinity, maxLat = -Infinity

  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }

  return { minLng, maxLng, minLat, maxLat }
}

/**
 * Generate a strip-shaped paddock within a pasture
 * Paddocks are positioned based on day index to simulate progression across the pasture
 */
export function generatePaddock(params: PaddockParams): Paddock {
  const { pasture, dayIndex, totalDays, targetAreaHectares, seed } = params
  const random = seededRandom(seed ?? dayIndex * 1000 + pasture.id.charCodeAt(1))

  const bounds = getBounds(pasture.geometry)
  const width = bounds.maxLng - bounds.minLng
  const height = bounds.maxLat - bounds.minLat

  // Calculate paddock size as fraction of pasture
  const desiredArea = targetAreaHectares ?? pasture.area / totalDays
  const areaFraction = desiredArea / pasture.area

  // Determine strip direction - alternate between horizontal and diagonal strips
  const isHorizontal = dayIndex % 2 === 0

  // Calculate strip dimensions
  // For oblong strips, width is about 3x the height
  const stripAspectRatio = 2.5 + random() * 1.5 // 2.5 to 4

  // Position the paddock based on day index to show progression
  const progressFraction = dayIndex / Math.max(totalDays - 1, 1)

  let paddockCoords: Position[]

  if (isHorizontal) {
    // Horizontal strip moving north to south
    const stripHeight = height * Math.sqrt(areaFraction / stripAspectRatio)
    const stripWidth = width * 0.8 + (random() * 0.15 * width) // 80-95% of pasture width

    // Position based on progress through pasture
    const yOffset = progressFraction * (height - stripHeight)
    const xOffset = (width - stripWidth) / 2 + (random() - 0.5) * width * 0.1

    const startLng = bounds.minLng + xOffset
    const startLat = bounds.maxLat - yOffset

    // Create slightly irregular strip shape
    const irregularity = 0.0001 * (random() - 0.5)

    paddockCoords = [
      [startLng, startLat],
      [startLng + stripWidth * 0.3, startLat + irregularity],
      [startLng + stripWidth * 0.7, startLat - irregularity],
      [startLng + stripWidth, startLat + irregularity * 0.5],
      [startLng + stripWidth, startLat - stripHeight],
      [startLng + stripWidth * 0.6, startLat - stripHeight - irregularity],
      [startLng + stripWidth * 0.3, startLat - stripHeight + irregularity],
      [startLng, startLat - stripHeight],
      [startLng, startLat], // Close the polygon
    ]
  } else {
    // Diagonal/angled strip
    const stripSize = Math.sqrt(areaFraction) * Math.max(width, height)

    // Position based on progress, alternating corners
    const cornerIndex = Math.floor(progressFraction * 2)
    const angle = (Math.PI / 6) + (random() * Math.PI / 6) // 30-60 degree angle

    let centerLng: number, centerLat: number

    if (cornerIndex === 0) {
      // Start from northwest, move southeast
      centerLng = bounds.minLng + width * (0.2 + progressFraction * 0.6)
      centerLat = bounds.maxLat - height * (0.2 + progressFraction * 0.3)
    } else {
      // Start from northeast, move southwest
      centerLng = bounds.maxLng - width * (0.2 + (progressFraction - 0.5) * 0.6)
      centerLat = bounds.maxLat - height * (0.5 + (progressFraction - 0.5) * 0.3)
    }

    const halfWidth = stripSize * 0.6
    const halfHeight = stripSize * 0.25

    // Create rotated rectangle
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const corners: Position[] = [
      [-halfWidth, -halfHeight],
      [halfWidth, -halfHeight],
      [halfWidth, halfHeight],
      [-halfWidth, halfHeight],
    ]

    paddockCoords = corners.map(([x, y]) => [
      centerLng + (x * cos - y * sin),
      centerLat + (x * sin + y * cos),
    ])
    paddockCoords.push(paddockCoords[0]) // Close polygon
  }

  const paddockGeometry: Feature<Polygon> = {
    type: 'Feature',
    properties: {
      paddockDay: dayIndex + 1,
      pastureId: pasture.id,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [paddockCoords],
    },
  }

  // Generate reasoning for this paddock placement
  const actualArea = calculateAreaHectares(paddockGeometry)
  const reasoning = generatePaddockReasoning(dayIndex, totalDays, actualArea, pasture)

  return {
    id: `paddock-${pasture.id}-day${dayIndex + 1}`,
    pastureId: pasture.id,
    date: '', // Will be set by caller
    geometry: paddockGeometry,
    targetArea: actualArea,
    reasoning,
  }
}

/**
 * Generate reasoning text for why this paddock was chosen
 */
function generatePaddockReasoning(
  dayIndex: number,
  totalDays: number,
  targetArea: number,
  pasture: Pasture
): string[] {
  const reasons: string[] = []

  if (dayIndex === 0) {
    reasons.push(`Starting rotation in ${pasture.name} - highest NDVI zone selected`)
    reasons.push(`Target area of ${targetArea.toFixed(1)} hectares matches herd daily consumption`)
  } else if (dayIndex === totalDays - 1) {
    reasons.push(`Final paddock of ${pasture.name} rotation`)
    reasons.push('Completing coverage of remaining ungrazed area')
  } else {
    reasons.push(`Day ${dayIndex + 1} of ${totalDays} in ${pasture.name}`)
    reasons.push(`Paddock positioned to allow previous areas to begin recovery`)
  }

  // Add water access reasoning
  if (pasture.waterAccess) {
    reasons.push(`Paddock maintains access to ${pasture.waterAccess.toLowerCase()}`)
  }

  return reasons
}

/**
 * Generate a sequence of paddocks for an entire pasture stay
 */
export function generatePastureStayPaddocks(
  pasture: Pasture,
  totalDays: number,
  startDate: Date = new Date()
): Paddock[] {
  const paddocks: Paddock[] = []

  for (let day = 0; day < totalDays; day++) {
    const paddockDate = new Date(startDate)
    paddockDate.setDate(paddockDate.getDate() + day)

    const paddock = generatePaddock({
      pasture,
      dayIndex: day,
      totalDays,
      seed: pasture.id.charCodeAt(1) * 1000 + day,
    })

    paddock.date = paddockDate.toISOString().split('T')[0]
    paddocks.push(paddock)
  }

  return paddocks
}

/**
 * Calculate optimal number of days to spend in a pasture based on area and herd size
 */
export function calculatePastureDays(
  pastureArea: number,
  dailyConsumptionHectares: number = 3.5
): number {
  return Math.max(2, Math.ceil(pastureArea / dailyConsumptionHectares))
}

/**
 * Generate alternative paddock options within the same pasture
 * These represent different polygon placements the AI could suggest
 */
export function generatePaddockAlternatives(
  pasture: Pasture,
  dayIndex: number,
  totalDays: number,
  count: number = 2
): PaddockAlternative[] {
  const alternatives: PaddockAlternative[] = []
  const bounds = getBounds(pasture.geometry)
  const width = bounds.maxLng - bounds.minLng
  const height = bounds.maxLat - bounds.minLat

  for (let i = 0; i < count; i++) {
    // Use different seed to generate varied alternatives
    const altSeed = (dayIndex + 1) * 1000 + pasture.id.charCodeAt(1) + (i + 1) * 100
    const random = seededRandom(altSeed)

    // Calculate area similar to main paddock
    const desiredArea = pasture.area / totalDays
    const areaFraction = desiredArea / pasture.area

    // Alternative placement strategies
    let paddockCoords: Position[]
    let reasoning: string
    let confidenceDeduction: number

    if (i === 0) {
      // Alternative 1: Eastern portion - different position, same approach
      const stripHeight = height * Math.sqrt(areaFraction / 3)
      const stripWidth = width * 0.7

      const xOffset = width * 0.25 // Shift east
      const yOffset = dayIndex / Math.max(totalDays - 1, 1) * (height - stripHeight)

      const startLng = bounds.minLng + xOffset
      const startLat = bounds.maxLat - yOffset

      paddockCoords = [
        [startLng, startLat],
        [startLng + stripWidth, startLat],
        [startLng + stripWidth, startLat - stripHeight],
        [startLng, startLat - stripHeight],
        [startLng, startLat],
      ]

      reasoning = 'Eastern paddock - closer to water access'
      confidenceDeduction = 12 + Math.floor(random() * 8)
    } else {
      // Alternative 2: Smaller, more concentrated paddock
      const smallerArea = desiredArea * 0.85
      const smallerFraction = smallerArea / pasture.area
      const stripHeight = height * Math.sqrt(smallerFraction / 2)
      const stripWidth = width * 0.5

      const xOffset = random() * (width - stripWidth)
      const yOffset = (dayIndex / Math.max(totalDays - 1, 1)) * (height - stripHeight)

      const startLng = bounds.minLng + xOffset
      const startLat = bounds.maxLat - yOffset

      paddockCoords = [
        [startLng, startLat],
        [startLng + stripWidth, startLat + 0.0001],
        [startLng + stripWidth, startLat - stripHeight],
        [startLng + stripWidth * 0.5, startLat - stripHeight - 0.00005],
        [startLng, startLat - stripHeight],
        [startLng, startLat],
      ]

      reasoning = 'Smaller paddock - higher grass density zone'
      confidenceDeduction = 18 + Math.floor(random() * 10)
    }

    const geometry: Feature<Polygon> = {
      type: 'Feature',
      properties: {
        alternativeIndex: i + 1,
        pastureId: pasture.id,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [paddockCoords],
      },
    }
    const actualArea = calculateAreaHectares(geometry)

    // Confidence is relative to the primary recommendation
    // Primary is always highest, alternatives are lower
    const baseConfidence = 87 // Assumed primary confidence
    const confidence = Math.max(45, baseConfidence - confidenceDeduction)

    alternatives.push({
      id: `alt-${pasture.id}-day${dayIndex + 1}-opt${i + 1}`,
      geometry,
      targetArea: actualArea,
      confidence,
      reasoning,
    })
  }

  return alternatives
}
