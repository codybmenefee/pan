import { useEffect, useRef } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { createLogger } from '@/lib/logger'

const log = createLogger('rasterTile')

interface RasterTileLayerProps {
  /**
   * MapLibre map instance
   */
  map: MapLibreMap | null

  /**
   * URL to the image tile (R2 signed URL to PNG or other image)
   */
  tileUrl: string | null

  /**
   * Bounding box for the tile in WGS84 coordinates
   */
  bounds: {
    west: number
    south: number
    east: number
    north: number
  } | null

  /**
   * Whether the layer is visible
   */
  visible?: boolean

  /**
   * Layer opacity (0-1)
   */
  opacity?: number

  /**
   * Unique ID for the layer (allows multiple instances)
   */
  layerId?: string

  /**
   * Layer to insert this layer before (for z-ordering)
   */
  beforeLayerId?: string
}

/**
 * Renders a georeferenced image tile on a MapLibre map.
 * Uses the `image` source type for displaying a single bounded image.
 *
 * Note: This component expects PNG or JPEG images, not GeoTIFF files.
 * MapLibre cannot directly render GeoTIFF files.
 */
export function RasterTileLayer({
  map,
  tileUrl,
  bounds,
  visible = true,
  opacity = 1,
  layerId = 'date-imagery',
  beforeLayerId = 'paddocks-fill',
}: RasterTileLayerProps) {
  const sourceId = `${layerId}-source`
  const layerIdRef = useRef(`${layerId}-layer`)
  const prevUrlRef = useRef<string | null>(null)

  // Add/update the image source and layer
  useEffect(() => {
    if (!map || !tileUrl || !bounds) return

    const currentLayerId = layerIdRef.current

    // Convert bounds to coordinates array for image source
    // MapLibre image source expects: [[topLeft], [topRight], [bottomRight], [bottomLeft]]
    // Each point is [longitude, latitude]
    const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
      [bounds.west, bounds.north], // top-left
      [bounds.east, bounds.north], // top-right
      [bounds.east, bounds.south], // bottom-right
      [bounds.west, bounds.south], // bottom-left
    ]

    // Remove existing source and layer if URL changed
    if (prevUrlRef.current !== tileUrl) {
      if (map.getLayer(currentLayerId)) {
        map.removeLayer(currentLayerId)
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    }

    // Add new source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'image',
        url: tileUrl,
        coordinates: coordinates,
      })
    }

    // Add new layer if it doesn't exist
    if (!map.getLayer(currentLayerId)) {
      const before = map.getLayer(beforeLayerId) ? beforeLayerId : undefined
      map.addLayer(
        {
          id: currentLayerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': visible ? opacity : 0,
            'raster-fade-duration': 200,
          },
        },
        before
      )
    }

    prevUrlRef.current = tileUrl

    // Cleanup on unmount
    return () => {
      // Check if map is still valid before cleanup
      try {
        if (!map || !map.getStyle()) return
        if (map.getLayer(currentLayerId)) {
          map.removeLayer(currentLayerId)
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId)
        }
      } catch (error) {
        log.debug('Layer cleanup skipped - map may be destroyed', { error: String(error) })
      }
    }
  }, [map, tileUrl, bounds, sourceId, beforeLayerId])

  // Update visibility and opacity
  useEffect(() => {
    if (!map) return

    const currentLayerId = layerIdRef.current

    if (map.getLayer(currentLayerId)) {
      map.setPaintProperty(currentLayerId, 'raster-opacity', visible ? opacity : 0)
    }
  }, [map, visible, opacity])

  // This component doesn't render anything itself
  return null
}

/**
 * Hook to manage a raster tile layer imperatively.
 * Useful when you need more control over the layer lifecycle.
 */
export function useRasterTileLayer(
  map: MapLibreMap | null,
  layerId: string = 'date-imagery'
) {
  const sourceId = `${layerId}-source`
  const layerIdFull = `${layerId}-layer`

  const addTile = (
    tileUrl: string,
    bounds: { west: number; south: number; east: number; north: number },
    beforeLayerId?: string
  ) => {
    if (!map) return

    // Remove existing if present
    if (map.getLayer(layerIdFull)) {
      map.removeLayer(layerIdFull)
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId)
    }

    // Convert bounds to coordinates array for image source
    const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
      [bounds.west, bounds.north], // top-left
      [bounds.east, bounds.north], // top-right
      [bounds.east, bounds.south], // bottom-right
      [bounds.west, bounds.south], // bottom-left
    ]

    // Add image source
    map.addSource(sourceId, {
      type: 'image',
      url: tileUrl,
      coordinates: coordinates,
    })

    // Add layer
    const before = beforeLayerId && map.getLayer(beforeLayerId) ? beforeLayerId : undefined
    map.addLayer(
      {
        id: layerIdFull,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': 1,
          'raster-fade-duration': 200,
        },
      },
      before
    )
  }

  const removeTile = () => {
    if (!map) return

    if (map.getLayer(layerIdFull)) {
      map.removeLayer(layerIdFull)
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId)
    }
  }

  const setOpacity = (opacity: number) => {
    if (!map) return

    if (map.getLayer(layerIdFull)) {
      map.setPaintProperty(layerIdFull, 'raster-opacity', opacity)
    }
  }

  const setVisible = (visible: boolean) => {
    if (!map) return

    if (map.getLayer(layerIdFull)) {
      map.setLayoutProperty(layerIdFull, 'visibility', visible ? 'visible' : 'none')
    }
  }

  return {
    addTile,
    removeTile,
    setOpacity,
    setVisible,
  }
}
