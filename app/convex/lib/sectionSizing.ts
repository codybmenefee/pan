/**
 * Section size calculation for livestock grazing requirements
 *
 * Formula: Section Size (ha) = (Total AU x Daily DM per AU / Pasture Yield per ha) x Rotation Frequency
 *
 * The actual section geometry is now drawn by the LLM agent, not pre-generated algorithmically.
 * This module provides:
 * - Target section size calculation based on livestock
 * - Helpers for the agent to understand paddock context (corners, ungrazed area)
 * - Validation utilities (polygon intersection, difference)
 */

import bbox from '@turf/bbox'
import area from '@turf/area'
import intersect from '@turf/intersect'
import difference from '@turf/difference'
import { featureCollection, polygon as turfPolygon } from '@turf/helpers'
import type { Feature, Polygon, Position, MultiPolygon } from 'geojson'
import { createBboxPolygon, getFeatureCentroid } from './geoCompat'

const HECTARES_PER_SQUARE_METER = 0.0001

export type StartingCorner = 'NW' | 'NE' | 'SW' | 'SE'

// ============================================================================
// SECTION SIZE CALCULATION
// ============================================================================

export interface SectionSizeParams {
  totalAnimalUnits: number
  dailyDMPerAU: number
  pastureYieldKgPerHa: number
  rotationFrequency: number
  paddockAreaHa: number
  minSectionPct?: number
}

export interface SectionSizeResult {
  targetSectionHa: number
  targetSectionPct: number
  dailyHectaresNeeded: number
  reasoning: string
  isMinimumEnforced: boolean
}

export const DEFAULT_SECTION_PCT = 20
export const DEFAULT_MIN_SECTION_PCT = 5
export const DEFAULT_PASTURE_YIELD_KG_PER_HA = 2500

/**
 * Calculate optimal section size based on livestock forage requirements
 */
export function calculateSectionSize(params: SectionSizeParams): SectionSizeResult {
  const {
    totalAnimalUnits,
    dailyDMPerAU,
    pastureYieldKgPerHa,
    rotationFrequency,
    paddockAreaHa,
    minSectionPct = DEFAULT_MIN_SECTION_PCT,
  } = params

  // Edge case: no livestock data or zero AU
  if (!totalAnimalUnits || totalAnimalUnits <= 0) {
    const defaultHa = paddockAreaHa * (DEFAULT_SECTION_PCT / 100)
    return {
      targetSectionHa: defaultHa,
      targetSectionPct: DEFAULT_SECTION_PCT,
      dailyHectaresNeeded: defaultHa / Math.max(1, rotationFrequency),
      reasoning: `No livestock data available. Using default ${DEFAULT_SECTION_PCT}% of paddock.`,
      isMinimumEnforced: false,
    }
  }

  // Calculate daily forage demand
  const dailyDemandKg = totalAnimalUnits * dailyDMPerAU

  // Calculate daily hectares needed
  const dailyHectaresNeeded = dailyDemandKg / pastureYieldKgPerHa

  // Calculate target section size for rotation period
  const rawTargetSectionHa = dailyHectaresNeeded * rotationFrequency

  // Calculate as percentage of paddock
  const rawTargetSectionPct = (rawTargetSectionHa / paddockAreaHa) * 100

  // Apply bounds: minimum percentage and cap at 100%
  const minHa = paddockAreaHa * (minSectionPct / 100)
  const isMinimumEnforced = rawTargetSectionHa < minHa
  const isCapped = rawTargetSectionPct > 100

  const effectiveSectionHa = isCapped ? paddockAreaHa : Math.max(minHa, rawTargetSectionHa)

  const effectiveSectionPct = isCapped ? 100 : Math.max(minSectionPct, rawTargetSectionPct)

  // Build reasoning string
  let reasoning = `${totalAnimalUnits.toFixed(1)} AU x ${dailyDMPerAU} kg/day = ${dailyDemandKg.toFixed(0)} kg/day demand. `
  reasoning += `${dailyDemandKg.toFixed(0)} kg / ${pastureYieldKgPerHa} kg/ha = ${dailyHectaresNeeded.toFixed(2)} ha/day. `
  reasoning += `${dailyHectaresNeeded.toFixed(2)} ha/day x ${rotationFrequency} day(s) = ${rawTargetSectionHa.toFixed(2)} ha target.`

  if (isMinimumEnforced) {
    reasoning += ` Enforced minimum ${minSectionPct}% (${minHa.toFixed(2)} ha).`
  } else if (isCapped) {
    reasoning += ` Capped at 100% (full paddock).`
  }

  return {
    targetSectionHa: Math.round(effectiveSectionHa * 100) / 100,
    targetSectionPct: Math.round(effectiveSectionPct * 10) / 10,
    dailyHectaresNeeded: Math.round(dailyHectaresNeeded * 100) / 100,
    reasoning,
    isMinimumEnforced,
  }
}

// ============================================================================
// PADDOCK CONTEXT FOR AGENT
// ============================================================================

export interface PaddockCorners {
  NW: [number, number]
  NE: [number, number]
  SW: [number, number]
  SE: [number, number]
}

export interface PaddockContext {
  boundary: Position[]
  corners: PaddockCorners
  totalAreaHa: number
  aspectRatio: number
  bounds: {
    minLng: number
    maxLng: number
    minLat: number
    maxLat: number
  }
}

/**
 * Extract paddock context for the agent's spatial reasoning
 */
export function getPaddockContext(paddockGeometry: Feature<Polygon>): PaddockContext {
  const [minLng, minLat, maxLng, maxLat] = bbox(paddockGeometry)
  const lngRange = maxLng - minLng
  const latRange = maxLat - minLat

  // Convert lat/lng range to approximate meters for aspect ratio
  // At mid-latitudes, 1 degree lat ~ 111km, 1 degree lng ~ 85km
  const midLat = (minLat + maxLat) / 2
  const metersPerDegLng = 111320 * Math.cos((midLat * Math.PI) / 180)
  const metersPerDegLat = 111320

  const widthMeters = lngRange * metersPerDegLng
  const heightMeters = latRange * metersPerDegLat
  const aspectRatio = widthMeters / heightMeters

  const totalAreaSqM = area(paddockGeometry)
  const totalAreaHa = totalAreaSqM * HECTARES_PER_SQUARE_METER

  return {
    boundary: paddockGeometry.geometry.coordinates[0],
    corners: {
      NW: [minLng, maxLat],
      NE: [maxLng, maxLat],
      SW: [minLng, minLat],
      SE: [maxLng, minLat],
    },
    totalAreaHa: Math.round(totalAreaHa * 100) / 100,
    aspectRatio: Math.round(aspectRatio * 100) / 100,
    bounds: { minLng, maxLng, minLat, maxLat },
  }
}

// ============================================================================
// AGENT-DRAWN SECTION VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  clippedGeometry?: Polygon
  areaHa: number
  overlapPct: number
}

/**
 * Validate an agent-drawn section polygon
 *
 * Hard failures (valid=false):
 * - Section extends beyond paddock boundary (will attempt to clip)
 * - Major overlap with grazed sections (>20%)
 * - Section doesn't touch paddock boundary OR previous grazed area (disconnected)
 *
 * Soft warnings:
 * - Section significantly smaller/larger than target (>50% deviation)
 * - Unusual aspect ratio (>4:1)
 * - Complex geometry (>8 vertices)
 */
export function validateAgentSection(
  sectionCoordinates: Position[],
  paddockGeometry: Feature<Polygon>,
  grazedSections: Polygon[],
  targetSectionHa: number
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Ensure section is a closed ring
  let coords = [...sectionCoordinates]
  if (coords.length < 4) {
    return {
      valid: false,
      errors: ['Section must have at least 4 coordinates (including closing point)'],
      warnings: [],
      areaHa: 0,
      overlapPct: 0,
    }
  }

  // Close the ring if needed
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([...first])
  }

  // Create section polygon
  let sectionPolygon: Polygon = {
    type: 'Polygon',
    coordinates: [coords],
  }

  const sectionFeature: Feature<Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: sectionPolygon,
  }

  // Check 1: Section within paddock bounds
  const clipped = intersect(featureCollection([sectionFeature, paddockGeometry]))

  if (!clipped) {
    return {
      valid: false,
      errors: ['Section is completely outside paddock boundary'],
      warnings: [],
      areaHa: 0,
      overlapPct: 0,
    }
  }

  const sectionAreaSqM = area(sectionFeature)
  const clippedAreaSqM = area(clipped)
  const withinRatio = clippedAreaSqM / sectionAreaSqM

  let finalGeometry: Polygon
  if (withinRatio < 0.99) {
    // Section extends outside paddock - use clipped version
    if (clipped.geometry.type === 'Polygon') {
      finalGeometry = clipped.geometry as Polygon
      warnings.push(
        `Section extended outside paddock (${Math.round((1 - withinRatio) * 100)}% clipped)`
      )
    } else if (clipped.geometry.type === 'MultiPolygon') {
      // Pick largest polygon from MultiPolygon
      const multi = clipped.geometry as MultiPolygon
      let largestArea = 0
      let largestPoly: Position[][] = multi.coordinates[0]
      for (const polyCoords of multi.coordinates) {
        const polyFeature = turfPolygon(polyCoords)
        const polyArea = area(polyFeature)
        if (polyArea > largestArea) {
          largestArea = polyArea
          largestPoly = polyCoords
        }
      }
      finalGeometry = { type: 'Polygon', coordinates: largestPoly }
      warnings.push(`Section extended outside paddock and was fragmented - using largest piece`)
    } else {
      return {
        valid: false,
        errors: ['Section geometry invalid after clipping to paddock'],
        warnings: [],
        areaHa: 0,
        overlapPct: 0,
      }
    }
  } else {
    finalGeometry = sectionPolygon
  }

  const finalAreaSqM = area({ type: 'Feature', properties: {}, geometry: finalGeometry })
  const finalAreaHa = finalAreaSqM * HECTARES_PER_SQUARE_METER

  // Check 2: Overlap with grazed sections
  let totalOverlapSqM = 0
  const finalFeature: Feature<Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: finalGeometry,
  }

  for (const grazed of grazedSections) {
    const grazedFeature: Feature<Polygon> = { type: 'Feature', properties: {}, geometry: grazed }
    const overlap = intersect(featureCollection([finalFeature, grazedFeature]))
    if (overlap) {
      totalOverlapSqM += area(overlap)
    }
  }

  const overlapPct = finalAreaSqM > 0 ? (totalOverlapSqM / finalAreaSqM) * 100 : 0

  if (overlapPct > 20) {
    errors.push(`Section overlaps ${Math.round(overlapPct)}% with already-grazed areas (max 20%)`)
  } else if (overlapPct > 5) {
    warnings.push(`Section has ${Math.round(overlapPct)}% overlap with grazed areas`)
  }

  // Check 3: Section connectivity (touches boundary or previous grazed area)
  let isConnected = false

  // Helper: check if two polygons touch/intersect using intersect()
  // intersect() returns non-null if there's any overlap
  const polygonsTouch = (a: Feature<Polygon>, b: Feature<Polygon>): boolean => {
    try {
      const intersection = intersect(featureCollection([a, b]))
      return intersection !== null
    } catch {
      return false
    }
  }

  // Check if touches paddock boundary
  if (polygonsTouch(finalFeature, paddockGeometry)) {
    isConnected = true
  }

  // Check if touches any grazed section
  if (!isConnected && grazedSections.length > 0) {
    for (const grazed of grazedSections) {
      const grazedFeature: Feature<Polygon> = { type: 'Feature', properties: {}, geometry: grazed }
      if (polygonsTouch(finalFeature, grazedFeature)) {
        isConnected = true
        break
      }
    }
  }

  // For first section, must touch paddock boundary
  if (!isConnected && grazedSections.length === 0) {
    errors.push('First section must touch the paddock boundary')
  } else if (!isConnected) {
    errors.push('Section is disconnected - must touch paddock boundary or previously grazed area')
  }

  // Soft warning: Size deviation
  const sizeDeviation = Math.abs(finalAreaHa - targetSectionHa) / targetSectionHa
  if (sizeDeviation > 0.5) {
    warnings.push(
      `Section size (${finalAreaHa.toFixed(2)} ha) deviates ${Math.round(sizeDeviation * 100)}% from target (${targetSectionHa.toFixed(2)} ha)`
    )
  }

  // Soft warning: Complex geometry
  const vertexCount = finalGeometry.coordinates[0].length - 1 // Subtract closing point
  if (vertexCount > 8) {
    warnings.push(`Section has ${vertexCount} vertices (recommend <= 8 for practical fencing)`)
  }

  // Soft warning: Aspect ratio
  const sectionBbox = bbox({ type: 'Feature', properties: {}, geometry: finalGeometry })
  const [sMinLng, sMinLat, sMaxLng, sMaxLat] = sectionBbox
  const sectionWidth = sMaxLng - sMinLng
  const sectionHeight = sMaxLat - sMinLat
  const sectionAspect =
    Math.max(sectionWidth, sectionHeight) / Math.min(sectionWidth, sectionHeight)
  if (sectionAspect > 4) {
    warnings.push(
      `Section has unusual aspect ratio (${sectionAspect.toFixed(1)}:1) - may be hard to fence`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    clippedGeometry: finalGeometry,
    areaHa: Math.round(finalAreaHa * 100) / 100,
    overlapPct: Math.round(overlapPct * 10) / 10,
  }
}

// ============================================================================
// UNGRAZED AREA COMPUTATION
// ============================================================================

export interface UngrazedAreaParams {
  paddockGeometry: Feature<Polygon>
  grazedSections: Polygon[]
}

export interface UngrazedAreaResult {
  geometry: Polygon | null
  areaHa: number
  percentOfPaddock: number
  shape: 'compact' | 'fragmented' | 'strip' | 'none'
  centroid: [number, number] | null
  approximateLocation: string
}

/**
 * Compute the remaining ungrazed area
 */
export function computeUngrazedRemaining(params: UngrazedAreaParams): UngrazedAreaResult {
  const { paddockGeometry, grazedSections } = params

  const paddockAreaSqM = area(paddockGeometry)
  const paddockAreaHa = paddockAreaSqM * HECTARES_PER_SQUARE_METER
  const paddockContext = getPaddockContext(paddockGeometry)

  // If no grazed sections, return entire paddock
  if (grazedSections.length === 0) {
    const paddockCentroid = getFeatureCentroid(paddockGeometry)
    return {
      geometry: paddockGeometry.geometry,
      areaHa: Math.round(paddockAreaHa * 100) / 100,
      percentOfPaddock: 100,
      shape: 'compact',
      centroid: paddockCentroid,
      approximateLocation: 'entire paddock',
    }
  }

  // Sequentially subtract grazed sections from paddock geometry.
  let remainingFeature: Feature<Polygon | MultiPolygon> | null = {
    type: 'Feature',
    properties: {},
    geometry: paddockGeometry.geometry,
  }

  for (const section of grazedSections) {
    if (!remainingFeature) {
      break
    }

    const sectionFeature: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: section,
    }

    const diff = difference(featureCollection([remainingFeature, sectionFeature]))
    if (diff && diff.geometry) {
      remainingFeature = diff as Feature<Polygon | MultiPolygon>
    } else {
      remainingFeature = null
      break
    }
  }

  if (!remainingFeature) {
    return {
      geometry: null,
      areaHa: 0,
      percentOfPaddock: 0,
      shape: 'none',
      centroid: null,
      approximateLocation: 'fully grazed',
    }
  }

  // Handle result geometry
  let remainingGeometry: Polygon
  let shape: 'compact' | 'fragmented' | 'strip' = 'compact'

  if (remainingFeature.geometry.type === 'MultiPolygon') {
    shape = 'fragmented'
    // Take largest polygon
    let largestArea = 0
    let largestPoly: Position[][] = remainingFeature.geometry.coordinates[0]

    for (const poly of remainingFeature.geometry.coordinates) {
      const polyFeature = turfPolygon(poly)
      const polyArea = area(polyFeature)
      if (polyArea > largestArea) {
        largestArea = polyArea
        largestPoly = poly
      }
    }

    remainingGeometry = { type: 'Polygon', coordinates: largestPoly }
  } else {
    remainingGeometry = remainingFeature.geometry as Polygon
  }

  const remainingAreaSqM = area({ type: 'Feature', properties: {}, geometry: remainingGeometry })
  const remainingAreaHa = remainingAreaSqM * HECTARES_PER_SQUARE_METER
  const percentOfPaddock = (remainingAreaHa / paddockAreaHa) * 100

  // Analyze shape using aspect ratio
  const [minLng, minLat, maxLng, maxLat] = bbox({
    type: 'Feature',
    properties: {},
    geometry: remainingGeometry,
  })
  const lngRange = maxLng - minLng
  const latRange = maxLat - minLat
  const aspectRatio = Math.max(lngRange, latRange) / Math.min(lngRange, latRange)

  if (shape !== 'fragmented') {
    if (aspectRatio > 4) {
      shape = 'strip'
    }
  }

  const centroidCoords = getFeatureCentroid({
    type: 'Feature',
    properties: {},
    geometry: remainingGeometry,
  })

  // Determine approximate location
  const { bounds } = paddockContext
  const centerLng = (bounds.minLng + bounds.maxLng) / 2
  const centerLat = (bounds.minLat + bounds.maxLat) / 2
  const isNorth = centroidCoords[1] > centerLat
  const isWest = centroidCoords[0] < centerLng

  let approximateLocation: string
  if (percentOfPaddock > 60) {
    approximateLocation = 'most of paddock'
  } else if (percentOfPaddock > 30) {
    approximateLocation = `${isNorth ? 'northern' : 'southern'} ${isWest ? 'western' : 'eastern'} portion`
  } else {
    approximateLocation = `${isNorth ? 'N' : 'S'}${isWest ? 'W' : 'E'} corner`
  }

  return {
    geometry: remainingGeometry,
    areaHa: Math.round(remainingAreaHa * 100) / 100,
    percentOfPaddock: Math.round(percentOfPaddock * 10) / 10,
    shape,
    centroid: centroidCoords,
    approximateLocation,
  }
}

// ============================================================================
// HELPER: CREATE RECTANGLE SECTION
// For agent's rectangular section helper
// ============================================================================

export interface RectangleSectionParams {
  paddockGeometry: Feature<Polygon>
  corner: StartingCorner
  widthPct: number // 0-100
  heightPct: number // 0-100
}

/**
 * Create a rectangular section anchored at a corner
 * This is a helper for the agent when it wants simple rectangular sections
 */
export function createRectangleSection(params: RectangleSectionParams): {
  geometry: Polygon
  centroid: [number, number]
  areaHa: number
} {
  const { paddockGeometry, corner, widthPct, heightPct } = params

  const [minLng, minLat, maxLng, maxLat] = bbox(paddockGeometry)
  const lngRange = maxLng - minLng
  const latRange = maxLat - minLat

  // Clamp percentages
  const wPct = Math.max(5, Math.min(100, widthPct)) / 100
  const hPct = Math.max(5, Math.min(100, heightPct)) / 100

  let sectionBounds: [number, number, number, number]

  switch (corner) {
    case 'NW':
      sectionBounds = [minLng, maxLat - latRange * hPct, minLng + lngRange * wPct, maxLat]
      break
    case 'NE':
      sectionBounds = [maxLng - lngRange * wPct, maxLat - latRange * hPct, maxLng, maxLat]
      break
    case 'SW':
      sectionBounds = [minLng, minLat, minLng + lngRange * wPct, minLat + latRange * hPct]
      break
    case 'SE':
      sectionBounds = [maxLng - lngRange * wPct, minLat, maxLng, minLat + latRange * hPct]
      break
  }

  // Create rectangle and clip to paddock
  const sectionRect = createBboxPolygon(sectionBounds)
  const clipped = intersect(featureCollection([sectionRect, paddockGeometry]))

  let finalGeometry: Polygon
  if (clipped && clipped.geometry.type === 'Polygon') {
    finalGeometry = clipped.geometry as Polygon
  } else if (clipped && clipped.geometry.type === 'MultiPolygon') {
    // Take largest piece
    const multi = clipped.geometry as MultiPolygon
    let largestArea = 0
    let largestPoly: Position[][] = multi.coordinates[0]
    for (const polyCoords of multi.coordinates) {
      const polyFeature = turfPolygon(polyCoords)
      const polyArea = area(polyFeature)
      if (polyArea > largestArea) {
        largestArea = polyArea
        largestPoly = polyCoords
      }
    }
    finalGeometry = { type: 'Polygon', coordinates: largestPoly }
  } else {
    finalGeometry = sectionRect.geometry as Polygon
  }

  const sectionCentroid = getFeatureCentroid({
    type: 'Feature',
    properties: {},
    geometry: finalGeometry,
  })
  const sectionAreaSqM = area({ type: 'Feature', properties: {}, geometry: finalGeometry })
  const sectionAreaHa = sectionAreaSqM * HECTARES_PER_SQUARE_METER

  return {
    geometry: finalGeometry,
    centroid: sectionCentroid,
    areaHa: Math.round(sectionAreaHa * 100) / 100,
  }
}

// ============================================================================
// RE-EXPORTS FOR BACKWARDS COMPATIBILITY
// These are kept minimal - just what's needed by existing code
// ============================================================================

export type { Polygon, Feature, Position } from 'geojson'
