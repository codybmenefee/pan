/**
 * Paddock Visualization Generator
 *
 * Generates SVG/PNG visualizations of paddock state for the grazing agent.
 * Shows: paddock boundary, grazed sections with day labels, optional NDVI coloring.
 *
 * Simplified from the original - no forecast overlays or complex numbering.
 */

import bbox from '@turf/bbox'
import type { Feature, Polygon, Position } from 'geojson'
import { getFeatureCentroid } from './geoCompat'
import { createLogger } from './logger'

const log = createLogger('paddockVisualization')

// Dynamic require for sharp (native module)
function dynamicRequire(moduleName: string): any {
  return new Function('moduleName', 'return require(moduleName)')(moduleName)
}

export interface VisualizationOptions {
  width?: number
  height?: number
  showNdviColors?: boolean
  showDayLabels?: boolean
  showCoordinateLabels?: boolean
  showScaleBar?: boolean
  showNorthArrow?: boolean
}

export interface GrazedSection {
  geometry: Polygon
  dayNumber: number
  date: string
}

/**
 * Generate SVG visualization of paddock with grazed/ungrazed areas
 */
export function generatePaddockSVG(
  paddockGeometry: Feature<Polygon>,
  grazedSections: GrazedSection[],
  ndviGrid?: number[][],
  options: VisualizationOptions = {}
): string {
  const {
    width = 512,
    height = 512,
    showNdviColors = true,
    showDayLabels = true,
    showCoordinateLabels = true,
    showScaleBar = true,
    showNorthArrow = true,
  } = options

  // Calculate bounding box with padding
  const [minLng, minLat, maxLng, maxLat] = bbox(paddockGeometry)
  const padding = 0.1
  const lngRange = maxLng - minLng
  const latRange = maxLat - minLat
  const paddedMinLng = minLng - lngRange * padding
  const paddedMaxLng = maxLng + lngRange * padding
  const paddedMinLat = minLat - latRange * padding
  const paddedMaxLat = maxLat + latRange * padding
  const paddedLngRange = paddedMaxLng - paddedMinLng
  const paddedLatRange = paddedMaxLat - paddedMinLat

  // Transform geo coords to SVG coords
  const toSVG = (lng: number, lat: number): { x: number; y: number } => ({
    x: ((lng - paddedMinLng) / paddedLngRange) * width,
    y: height - ((lat - paddedMinLat) / paddedLatRange) * height,
  })

  // Convert polygon coordinates to SVG path
  const coordsToPath = (coords: Position[]): string => {
    return (
      coords
        .map((coord, i) => {
          const { x, y } = toSVG(coord[0], coord[1])
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
        })
        .join(' ') + ' Z'
    )
  }

  const elements: string[] = []

  // Definitions for patterns
  elements.push(`<defs>
    <pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8">
      <path d="M0,0 l8,8 M-2,6 l4,4 M6,-2 l4,4" stroke="#666" stroke-width="1" fill="none"/>
    </pattern>
    <pattern id="grazedFill" patternUnits="userSpaceOnUse" width="8" height="8">
      <rect width="8" height="8" fill="#B0B0B0"/>
      <path d="M0,0 l8,8 M-2,6 l4,4 M6,-2 l4,4" stroke="#888" stroke-width="1" fill="none"/>
    </pattern>
  </defs>`)

  // Background
  elements.push(`<rect width="${width}" height="${height}" fill="#F5F5F5"/>`)

  // NDVI colored ungrazed area (if grid provided)
  if (showNdviColors && ndviGrid && ndviGrid.length > 0) {
    const gridRows = ndviGrid.length
    const gridCols = ndviGrid[0].length
    const cellWidth = lngRange / gridCols
    const cellHeight = latRange / gridRows

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const ndviValue = ndviGrid[row][col]
        const color = ndviToColor(ndviValue)

        const cellMinLng = minLng + col * cellWidth
        const cellMaxLat = maxLat - row * cellHeight
        const cellMaxLng = cellMinLng + cellWidth
        const cellMinLat = cellMaxLat - cellHeight

        const topLeft = toSVG(cellMinLng, cellMaxLat)
        const bottomRight = toSVG(cellMaxLng, cellMinLat)

        elements.push(
          `<rect x="${topLeft.x.toFixed(2)}" y="${topLeft.y.toFixed(2)}" ` +
            `width="${(bottomRight.x - topLeft.x).toFixed(2)}" ` +
            `height="${(bottomRight.y - topLeft.y).toFixed(2)}" ` +
            `fill="${color}" opacity="0.6"/>`
        )
      }
    }
  } else {
    // Simple green fill for ungrazed paddock area
    const paddockCoords = paddockGeometry.geometry.coordinates[0]
    elements.push(`<path d="${coordsToPath(paddockCoords)}" fill="#90EE90" stroke="none"/>`)
  }

  // Paddock boundary outline
  const paddockCoords = paddockGeometry.geometry.coordinates[0]
  elements.push(
    `<path d="${coordsToPath(paddockCoords)}" fill="none" stroke="#228B22" stroke-width="3"/>`
  )

  // Grazed sections with hatched fill
  for (const section of grazedSections) {
    const sectionCoords = section.geometry.coordinates[0]
    const path = coordsToPath(sectionCoords)

    elements.push(`<path d="${path}" fill="url(#grazedFill)" stroke="#666" stroke-width="1.5"/>`)

    if (showDayLabels) {
      const sectionFeature: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: section.geometry,
      }
      const [centerLng, centerLat] = getFeatureCentroid(sectionFeature)
      const { x, y } = toSVG(centerLng, centerLat)

      elements.push(
        `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" ` +
          `font-family="Arial, sans-serif" font-size="14" font-weight="bold" ` +
          `text-anchor="middle" dominant-baseline="middle" fill="#333">` +
          `Day ${section.dayNumber}</text>`
      )
    }
  }

  // Coordinate labels at corners
  if (showCoordinateLabels) {
    const labelFontSize = 10
    const labelPadding = 5

    const nwPos = toSVG(minLng, maxLat)
    elements.push(
      `<text x="${nwPos.x.toFixed(2)}" y="${(nwPos.y - labelPadding).toFixed(2)}" ` +
        `font-family="monospace" font-size="${labelFontSize}" fill="#333">` +
        `NW: ${minLng.toFixed(4)}, ${maxLat.toFixed(4)}</text>`
    )

    const nePos = toSVG(maxLng, maxLat)
    elements.push(
      `<text x="${nePos.x.toFixed(2)}" y="${(nePos.y - labelPadding).toFixed(2)}" ` +
        `font-family="monospace" font-size="${labelFontSize}" text-anchor="end" fill="#333">` +
        `NE: ${maxLng.toFixed(4)}, ${maxLat.toFixed(4)}</text>`
    )

    const swPos = toSVG(minLng, minLat)
    elements.push(
      `<text x="${swPos.x.toFixed(2)}" y="${(swPos.y + labelPadding + labelFontSize).toFixed(2)}" ` +
        `font-family="monospace" font-size="${labelFontSize}" fill="#333">` +
        `SW: ${minLng.toFixed(4)}, ${minLat.toFixed(4)}</text>`
    )

    const sePos = toSVG(maxLng, minLat)
    elements.push(
      `<text x="${sePos.x.toFixed(2)}" y="${(sePos.y + labelPadding + labelFontSize).toFixed(2)}" ` +
        `font-family="monospace" font-size="${labelFontSize}" text-anchor="end" fill="#333">` +
        `SE: ${maxLng.toFixed(4)}, ${minLat.toFixed(4)}</text>`
    )
  }

  // Scale bar
  if (showScaleBar) {
    const scaleBarY = height - 20
    const scaleBarX = 20

    const midLat = (minLat + maxLat) / 2
    const metersPerDegLng = 111320 * Math.cos((midLat * Math.PI) / 180)
    const pixelsPerMeter = width / (paddedLngRange * metersPerDegLng)

    let scaleMeters = 100
    if (pixelsPerMeter * 100 > 150) scaleMeters = 50
    else if (pixelsPerMeter * 100 < 30) scaleMeters = 500
    else if (pixelsPerMeter * 100 < 60) scaleMeters = 200

    const scaleBarWidth = scaleMeters * pixelsPerMeter

    elements.push(
      `<rect x="${scaleBarX}" y="${scaleBarY}" width="${scaleBarWidth.toFixed(2)}" height="4" fill="#333"/>`,
      `<text x="${scaleBarX + scaleBarWidth / 2}" y="${scaleBarY - 5}" ` +
        `font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#333">` +
        `${scaleMeters}m</text>`
    )
  }

  // North arrow
  if (showNorthArrow) {
    const arrowX = width - 30
    const arrowY = 40
    elements.push(
      `<polygon points="${arrowX},${arrowY - 20} ${arrowX - 8},${arrowY} ${arrowX},${arrowY - 5} ${arrowX + 8},${arrowY}" fill="#333"/>`,
      `<text x="${arrowX}" y="${arrowY + 15}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#333">N</text>`
    )
  }

  // Legend
  const legendX = 20
  const legendY = 20
  elements.push(
    `<rect x="${legendX}" y="${legendY}" width="15" height="15" fill="#90EE90" stroke="#228B22" stroke-width="1"/>`,
    `<text x="${legendX + 20}" y="${legendY + 12}" font-family="Arial, sans-serif" font-size="10" fill="#333">Ungrazed</text>`,
    `<rect x="${legendX}" y="${legendY + 20}" width="15" height="15" fill="url(#grazedFill)" stroke="#666" stroke-width="1"/>`,
    `<text x="${legendX + 20}" y="${legendY + 32}" font-family="Arial, sans-serif" font-size="10" fill="#333">Grazed</text>`,
    `<line x1="${legendX}" y1="${legendY + 47}" x2="${legendX + 15}" y2="${legendY + 47}" stroke="#228B22" stroke-width="3"/>`,
    `<text x="${legendX + 20}" y="${legendY + 52}" font-family="Arial, sans-serif" font-size="10" fill="#333">Boundary</text>`
  )

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${elements.join('\n')}
</svg>`

  log('Generated paddock SVG', {
    width,
    height,
    grazedSectionsCount: grazedSections.length,
    hasNdviGrid: !!ndviGrid,
  })

  return svg
}

/**
 * Convert NDVI value to color
 * High NDVI (0.6-1.0) = Green (target)
 * Medium NDVI (0.4-0.6) = Yellow
 * Low NDVI (<0.4) = Red (avoid)
 */
function ndviToColor(ndvi: number): string {
  const value = Math.max(0, Math.min(1, ndvi))

  if (value >= 0.6) {
    const intensity = Math.round(100 + ((value - 0.6) * 155) / 0.4)
    return `rgb(${Math.round(intensity * 0.3)}, ${intensity}, ${Math.round(intensity * 0.3)})`
  } else if (value >= 0.4) {
    const t = (value - 0.4) / 0.2
    const r = 255
    const g = Math.round(180 + t * 75)
    const b = Math.round(50 * (1 - t))
    return `rgb(${r}, ${g}, ${b})`
  } else {
    const intensity = Math.round(150 + (value * 105) / 0.4)
    return `rgb(${intensity}, ${Math.round(intensity * 0.4)}, ${Math.round(intensity * 0.3)})`
  }
}

/**
 * Convert SVG to PNG base64 using sharp
 */
export async function svgToPngBase64(svg: string): Promise<string> {
  try {
    const sharp = dynamicRequire('sharp')

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer()

    return pngBuffer.toString('base64')
  } catch (error: any) {
    log.error('Failed to convert SVG to PNG', { error: error.message })
    throw new Error(`SVG to PNG conversion failed: ${error.message}`)
  }
}

/**
 * Generate a complete paddock visualization as PNG base64
 */
export async function generatePaddockVisualization(
  paddockGeometry: Feature<Polygon>,
  grazedSections: GrazedSection[],
  ndviGrid?: number[][],
  options?: VisualizationOptions
): Promise<{
  pngBase64: string
  svg: string
  bounds: {
    minLng: number
    maxLng: number
    minLat: number
    maxLat: number
  }
}> {
  const svg = generatePaddockSVG(paddockGeometry, grazedSections, ndviGrid, options)
  const pngBase64 = await svgToPngBase64(svg)

  const [minLng, minLat, maxLng, maxLat] = bbox(paddockGeometry)

  return {
    pngBase64,
    svg,
    bounds: { minLng, maxLng, minLat, maxLat },
  }
}
