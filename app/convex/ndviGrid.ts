/**
 * NDVI Grid Generation
 *
 * Generates a 10x10 text grid from GeoTIFF NDVI raster data for a paddock.
 * Used by the grazing agent to visualize NDVI distribution and make
 * heat-map-guided section drawing decisions.
 */

"use node"

import { action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'
import bbox from '@turf/bbox'
import type { Feature, Polygon } from 'geojson'
import { createLogger } from './lib/logger'

// Import geotiff - using external packages config in convex.json
import * as geotiffModule from 'geotiff'

const log = createLogger('ndviGrid')

const GRID_SIZE = 10

interface NDVIGridResult {
  gridText: string
  gridValues: number[][]
  bounds: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
  paddockId: string
  captureDate: string
  hasData: boolean
  error?: string
}

/**
 * Generate a 10x10 NDVI grid for a paddock from GeoTIFF raster data.
 *
 * The grid shows NDVI values sampled at regular intervals across the paddock,
 * allowing the agent to identify high-NDVI areas for section targeting.
 */
export const generateNDVIGrid = action({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
    captureDate: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<NDVIGridResult> => {
    log('[generateNDVIGrid] START:', {
      farmExternalId: args.farmExternalId,
      paddockExternalId: args.paddockExternalId,
      captureDate: args.captureDate,
    })

    // 1. Get paddock geometry to determine bounds
    const paddockData = await ctx.runQuery(api.paddocks.getPaddockByExternalId, {
      farmExternalId: args.farmExternalId,
      paddockExternalId: args.paddockExternalId,
    })

    if (!paddockData || !paddockData.geometry) {
      log.error('[generateNDVIGrid] Paddock not found or has no geometry')
      return {
        gridText: 'Error: Paddock not found',
        gridValues: [],
        bounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 },
        paddockId: args.paddockExternalId,
        captureDate: '',
        hasData: false,
        error: 'Paddock not found or has no geometry',
      }
    }

    // Extract polygon coordinates from paddock geometry
    const paddockGeometry = paddockData.geometry as Feature<Polygon>
    const [minLng, minLat, maxLng, maxLat] = bbox(paddockGeometry)

    log('[generateNDVIGrid] Paddock bounds:', {
      minLat,
      maxLat,
      minLng,
      maxLng,
    })

    // 2. Get the latest NDVI tile for this farm
    const farm = await ctx.runQuery(api.farms.getByExternalId, {
      externalId: args.farmExternalId,
    })

    if (!farm) {
      log.error('[generateNDVIGrid] Farm not found')
      return {
        gridText: 'Error: Farm not found',
        gridValues: [],
        bounds: { minLat, maxLat, minLng, maxLng },
        paddockId: args.paddockExternalId,
        captureDate: '',
        hasData: false,
        error: 'Farm not found',
      }
    }

    // Get available NDVI tiles (sorted by date descending)
    const availableDates = await ctx.runQuery(api.satelliteTiles.getAvailableDatesByExternalId, {
      farmExternalId: args.farmExternalId,
      tileType: 'ndvi',
    })

    if (!availableDates || availableDates.length === 0) {
      log('[generateNDVIGrid] No NDVI tiles available')
      return createFallbackGrid(args.paddockExternalId, minLat, maxLat, minLng, maxLng, 'No NDVI tiles available')
    }

    // Use provided date or most recent
    const targetDate = args.captureDate || availableDates[0].date
    log('[generateNDVIGrid] Using capture date', { date: targetDate })

    // Get the NDVI tile
    const tile = await ctx.runQuery(api.satelliteTiles.getTileByExternalId, {
      farmExternalId: args.farmExternalId,
      captureDate: targetDate,
      tileType: 'ndvi',
    })

    if (!tile || !tile.r2Url) {
      log('[generateNDVIGrid] No NDVI tile found for date', { date: targetDate })
      return createFallbackGrid(args.paddockExternalId, minLat, maxLat, minLng, maxLng, `No NDVI tile for ${targetDate}`)
    }

    log('[generateNDVIGrid] Fetching GeoTIFF from R2:', {
      r2Key: tile.r2Key,
      tileBounds: tile.bounds,
    })

    // 3. Fetch and parse the GeoTIFF
    try {
      const { fromArrayBuffer } = geotiffModule

      // Fetch the GeoTIFF data
      const response = await fetch(tile.r2Url)
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoTIFF: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const tiff = await fromArrayBuffer(arrayBuffer)
      const image = await tiff.getImage()
      const rasters = await image.readRasters()
      const rasterData = rasters[0] as Float32Array | Int16Array | Uint8Array

      // Get raster metadata
      const width = image.getWidth()
      const height = image.getHeight()

      // Use tile.bounds (lat/lng) for coordinate transformation instead of
      // GeoTIFF internal coordinates (which are in projected meters like UTM)
      const tileBounds = tile.bounds
      const tileMinLng = tileBounds.west
      const tileMaxLng = tileBounds.east
      const tileMinLat = tileBounds.south
      const tileMaxLat = tileBounds.north

      log('[generateNDVIGrid] GeoTIFF metadata:', {
        width,
        height,
        tileBounds,
        rasterLength: rasterData.length,
      })

      // 4. Sample the raster at grid points
      const gridValues: number[][] = []
      const latStep = (maxLat - minLat) / GRID_SIZE
      const lngStep = (maxLng - minLng) / GRID_SIZE

      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const rowValues: number[] = []
        const lat = minLat + (row + 0.5) * latStep // Center of cell

        for (let col = 0; col < GRID_SIZE; col++) {
          const lng = minLng + (col + 0.5) * lngStep // Center of cell

          // Convert lat/lng to pixel coordinates using tile bounds
          const pixelX = Math.floor(((lng - tileMinLng) / (tileMaxLng - tileMinLng)) * width)
          const pixelY = Math.floor(((tileMaxLat - lat) / (tileMaxLat - tileMinLat)) * height)

          // Check if pixel is within raster bounds
          if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
            const pixelIndex = pixelY * width + pixelX
            let ndviValue = rasterData[pixelIndex]

            // Handle different data formats (some are scaled, some are raw -1 to 1)
            if (typeof ndviValue === 'number' && Number.isFinite(ndviValue)) {
              // If value is in 0-255 range, scale to 0-1 (assuming 255 = max NDVI)
              if (ndviValue > 1) {
                ndviValue = ndviValue / 255
              }
              // Clamp to valid NDVI range
              ndviValue = Math.max(-1, Math.min(1, ndviValue))
              rowValues.push(Math.round(ndviValue * 100) / 100)
            } else {
              rowValues.push(0)
            }
          } else {
            // Outside raster bounds
            rowValues.push(0)
          }
        }
        gridValues.push(rowValues)
      }

      // 5. Generate text representation
      const gridText = formatGridAsText(gridValues, minLat, maxLat, minLng, maxLng)

      log('[generateNDVIGrid] SUCCESS - Grid generated')

      return {
        gridText,
        gridValues,
        bounds: { minLat, maxLat, minLng, maxLng },
        paddockId: args.paddockExternalId,
        captureDate: targetDate,
        hasData: true,
      }
    } catch (error: any) {
      log.error('[generateNDVIGrid] Error parsing GeoTIFF:', error)
      return createFallbackGrid(
        args.paddockExternalId,
        minLat,
        maxLat,
        minLng,
        maxLng,
        `GeoTIFF parse error: ${error.message}`
      )
    }
  },
})

/**
 * Format grid values as human-readable text for the LLM prompt
 */
function formatGridAsText(
  gridValues: number[][],
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): string {
  const lines: string[] = []

  // Header row
  const colHeaders = Array.from({ length: GRID_SIZE }, (_, i) => `Col${i}`.padStart(6))
  lines.push('      ' + colHeaders.join(' '))

  // Grid rows (top to bottom, so Row9 first for visual consistency)
  for (let i = 0; i < gridValues.length; i++) {
    const rowLabel = `Row${GRID_SIZE - 1 - i}`.padEnd(6)
    const values = gridValues[i].map(v => v.toFixed(2).padStart(6))
    lines.push(rowLabel + values.join(' '))
  }

  // Coordinate reference
  lines.push('')
  lines.push('Grid Coordinates:')
  lines.push(`- Row0 lat: ${minLat.toFixed(4)}, Row${GRID_SIZE - 1} lat: ${maxLat.toFixed(4)}`)
  lines.push(`- Col0 lng: ${minLng.toFixed(4)}, Col${GRID_SIZE - 1} lng: ${maxLng.toFixed(4)}`)
  lines.push('')
  lines.push('NDVI Key: 0.60-0.80+ = healthy (TARGET), 0.40-0.60 = moderate, <0.40 = sparse (AVOID)')

  return lines.join('\n')
}

/**
 * Create a fallback grid when GeoTIFF data is unavailable.
 * Uses aggregate paddock NDVI value distributed uniformly.
 */
function createFallbackGrid(
  paddockId: string,
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  reason: string
): NDVIGridResult {
  log('[generateNDVIGrid] Creating fallback grid', { reason })

  // Create a uniform grid with placeholder values
  const fallbackValue = 0.45 // Default moderate NDVI
  const gridValues: number[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(fallbackValue))

  const gridText = `Note: NDVI grid unavailable (${reason}). Using uniform estimate.

${formatGridAsText(gridValues, minLat, maxLat, minLng, maxLng)}`

  return {
    gridText,
    gridValues,
    bounds: { minLat, maxLat, minLng, maxLng },
    paddockId,
    captureDate: '',
    hasData: false,
    error: reason,
  }
}

/**
 * Calculate NDVI statistics for a section polygon within the paddock.
 * Used to validate that agent-drawn sections target high-NDVI areas.
 */
export const calculateSectionNDVI = action({
  args: {
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
    sectionGeometry: v.object({
      type: v.literal('Polygon'),
      coordinates: v.array(v.array(v.array(v.number()))),
    }),
    captureDate: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    mean: number
    min: number
    max: number
    threshold: number
    meetsThreshold: boolean
    sampleCount: number
    error?: string
  }> => {
    log('[calculateSectionNDVI] START:', {
      farmExternalId: args.farmExternalId,
      paddockExternalId: args.paddockExternalId,
      captureDate: args.captureDate,
    })

    // Get farm settings for threshold
    const settings = await ctx.runQuery(api.grazingAgentTools.getFarmSettings, {
      farmExternalId: args.farmExternalId,
    })
    const threshold = settings?.minNDVIThreshold || 0.40

    // Get section bounds
    const sectionFeature: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: args.sectionGeometry,
    }
    const [minLng, minLat, maxLng, maxLat] = bbox(sectionFeature)

    // Get the NDVI tile
    const availableDates = await ctx.runQuery(api.satelliteTiles.getAvailableDatesByExternalId, {
      farmExternalId: args.farmExternalId,
      tileType: 'ndvi',
    })

    if (!availableDates || availableDates.length === 0) {
      log('[calculateSectionNDVI] No NDVI tiles available, using paddock NDVI')
      // Fallback to paddock aggregate NDVI
      const paddockData = await ctx.runQuery(api.paddocks.getPaddockByExternalId, {
        farmExternalId: args.farmExternalId,
        paddockExternalId: args.paddockExternalId,
      })
      const fallbackNdvi = paddockData?.ndvi || 0.45
      return {
        mean: fallbackNdvi,
        min: fallbackNdvi,
        max: fallbackNdvi,
        threshold,
        meetsThreshold: fallbackNdvi >= threshold,
        sampleCount: 0,
        error: 'No NDVI raster available, using paddock aggregate',
      }
    }

    const targetDate = args.captureDate || availableDates[0].date
    const tile = await ctx.runQuery(api.satelliteTiles.getTileByExternalId, {
      farmExternalId: args.farmExternalId,
      captureDate: targetDate,
      tileType: 'ndvi',
    })

    if (!tile || !tile.r2Url) {
      const paddockData = await ctx.runQuery(api.paddocks.getPaddockByExternalId, {
        farmExternalId: args.farmExternalId,
        paddockExternalId: args.paddockExternalId,
      })
      const fallbackNdvi = paddockData?.ndvi || 0.45
      return {
        mean: fallbackNdvi,
        min: fallbackNdvi,
        max: fallbackNdvi,
        threshold,
        meetsThreshold: fallbackNdvi >= threshold,
        sampleCount: 0,
        error: 'No NDVI tile for date, using paddock aggregate',
      }
    }

    try {
      const { fromArrayBuffer } = geotiffModule

      // Fetch the GeoTIFF
      const response = await fetch(tile.r2Url)
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoTIFF: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const tiff = await fromArrayBuffer(arrayBuffer)
      const image = await tiff.getImage()
      const rasters = await image.readRasters()
      const rasterData = rasters[0] as Float32Array | Int16Array | Uint8Array

      const width = image.getWidth()
      const height = image.getHeight()

      // Use tile.bounds (lat/lng) for coordinate transformation
      const tileBounds = tile.bounds
      const tileMinLng = tileBounds.west
      const tileMaxLng = tileBounds.east
      const tileMinLat = tileBounds.south
      const tileMaxLat = tileBounds.north

      // Sample NDVI values within the section bounds
      // Use a 5x5 grid within the section for statistics
      const SAMPLE_SIZE = 5
      const ndviValues: number[] = []
      const latStep = (maxLat - minLat) / SAMPLE_SIZE
      const lngStep = (maxLng - minLng) / SAMPLE_SIZE

      for (let row = 0; row < SAMPLE_SIZE; row++) {
        const lat = minLat + (row + 0.5) * latStep

        for (let col = 0; col < SAMPLE_SIZE; col++) {
          const lng = minLng + (col + 0.5) * lngStep

          // Convert lat/lng to pixel coordinates using tile bounds
          const pixelX = Math.floor(((lng - tileMinLng) / (tileMaxLng - tileMinLng)) * width)
          const pixelY = Math.floor(((tileMaxLat - lat) / (tileMaxLat - tileMinLat)) * height)

          if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
            const pixelIndex = pixelY * width + pixelX
            let ndviValue = rasterData[pixelIndex]

            if (typeof ndviValue === 'number' && Number.isFinite(ndviValue)) {
              // If value is in 0-255 range, scale to 0-1
              if (ndviValue > 1) {
                ndviValue = ndviValue / 255
              }
              ndviValue = Math.max(-1, Math.min(1, ndviValue))
              ndviValues.push(ndviValue)
            }
          }
        }
      }

      if (ndviValues.length === 0) {
        return {
          mean: 0.45,
          min: 0.45,
          max: 0.45,
          threshold,
          meetsThreshold: false,
          sampleCount: 0,
          error: 'No valid NDVI samples within section',
        }
      }

      const mean = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length
      const min = Math.min(...ndviValues)
      const max = Math.max(...ndviValues)

      log('[calculateSectionNDVI] SUCCESS:', {
        mean: mean.toFixed(3),
        min: min.toFixed(3),
        max: max.toFixed(3),
        threshold,
        meetsThreshold: mean >= threshold,
        sampleCount: ndviValues.length,
      })

      return {
        mean: Math.round(mean * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        threshold,
        meetsThreshold: mean >= threshold,
        sampleCount: ndviValues.length,
      }
    } catch (error: any) {
      log.error('[calculateSectionNDVI] Error:', error)
      return {
        mean: 0.45,
        min: 0.45,
        max: 0.45,
        threshold,
        meetsThreshold: false,
        sampleCount: 0,
        error: error.message,
      }
    }
  },
})
