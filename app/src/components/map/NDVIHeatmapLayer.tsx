import { useEffect, useRef } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useSatelliteTile } from '../../lib/hooks/useSatelliteTiles'
import { useSubscription } from '../../lib/hooks/useSubscription'
import { FEATURES } from '../../lib/featureFlags'

// NDVI color ramp values
// Brown (low/bare) -> Yellow (sparse) -> Light Green (moderate) -> Dark Green (healthy)
const NDVI_COLOR_RAMP = [
  { value: -0.2, color: '#8B4513' }, // Brown (bare soil/water)
  { value: 0.0, color: '#D2691E' },  // Sienna
  { value: 0.2, color: '#DAA520' },  // Goldenrod
  { value: 0.3, color: '#FFD700' },  // Yellow
  { value: 0.4, color: '#9ACD32' },  // Yellow-green
  { value: 0.5, color: '#7CFC00' },  // Light green
  { value: 0.6, color: '#32CD32' },  // Lime green
  { value: 0.7, color: '#228B22' },  // Forest green
  { value: 0.8, color: '#006400' },  // Dark green
]

interface NDVIHeatmapLayerProps {
  /**
   * MapLibre map instance
   */
  map: MapLibreMap | null

  /**
   * Farm ID for loading tiles (external ID)
   */
  farmId: string

  /**
   * Capture date to display
   */
  captureDate: string | null

  /**
   * Whether the layer is visible
   */
  visible: boolean

  /**
   * Opacity of the layer (0-1)
   */
  opacity?: number

  /**
   * Layer ID for MapLibre
   */
  layerId?: string
}

/**
 * MapLibre raster layer for NDVI heatmap tiles.
 *
 * For paid tiers: Loads GeoTIFF tile from R2
 * For free tiers: Generates client-side heatmap from paddock indices
 */
export function NDVIHeatmapLayer({
  map,
  farmId,
  captureDate,
  visible,
  opacity = 0.7,
  layerId = 'ndvi-heatmap',
}: NDVIHeatmapLayerProps) {
  const { hasFeature } = useSubscription(farmId)
  const canAccessRawTiles = hasFeature(FEATURES.RAW_IMAGERY)

  const { tile } = useSatelliteTile(
    canAccessRawTiles ? farmId : undefined,
    captureDate ?? undefined,
    'ndvi_heatmap'
  )

  const sourceAdded = useRef(false)
  const layerAdded = useRef(false)

  // Add/update raster source and layer
  useEffect(() => {
    if (!map || !captureDate) return

    const sourceId = `${layerId}-source`

    // Remove existing layer and source if needed
    if (layerAdded.current && map.getLayer(layerId)) {
      map.removeLayer(layerId)
      layerAdded.current = false
    }
    if (sourceAdded.current && map.getSource(sourceId)) {
      map.removeSource(sourceId)
      sourceAdded.current = false
    }

    // Only add if we have a tile URL and it's visible
    if (!visible || !tile?.r2Url) return

    // Add image source (single georeferenced image, already colorized)
    map.addSource(sourceId, {
      type: 'image',
      url: tile.r2Url,
      coordinates: [
        [tile.bounds.west, tile.bounds.north], // top-left
        [tile.bounds.east, tile.bounds.north], // top-right
        [tile.bounds.east, tile.bounds.south], // bottom-right
        [tile.bounds.west, tile.bounds.south], // bottom-left
      ],
    })
    sourceAdded.current = true

    // Add raster layer to display the image
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': opacity,
        'raster-resampling': 'linear',
        'raster-fade-duration': 0,
      },
    })
    layerAdded.current = true

    return () => {
      // Cleanup on unmount
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    }
  }, [map, tile, captureDate, visible, opacity, layerId])

  // Update visibility
  useEffect(() => {
    if (!map || !map.getLayer(layerId)) return
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }, [map, visible, layerId])

  // Update opacity
  useEffect(() => {
    if (!map || !map.getLayer(layerId)) return
    map.setPaintProperty(layerId, 'raster-opacity', opacity)
  }, [map, opacity, layerId])

  // No visual component - just manages map layer
  return null
}

/**
 * Color legend component for NDVI heatmap.
 */
export function NDVIColorLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-3 ${className}`}>
      <h4 className="text-xs font-medium text-muted mb-2">NDVI (Vegetation Health)</h4>
      <div className="flex items-center gap-1">
        {NDVI_COLOR_RAMP.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: item.color }}
              title={`NDVI: ${item.value}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  )
}

/**
 * Generate NDVI color for a given value.
 */
export function getNDVIColor(value: number): string {
  if (value <= NDVI_COLOR_RAMP[0].value) {
    return NDVI_COLOR_RAMP[0].color
  }

  for (let i = 1; i < NDVI_COLOR_RAMP.length; i++) {
    if (value <= NDVI_COLOR_RAMP[i].value) {
      const prev = NDVI_COLOR_RAMP[i - 1]
      const curr = NDVI_COLOR_RAMP[i]
      const t = (value - prev.value) / (curr.value - prev.value)
      return interpolateColor(prev.color, curr.color, t)
    }
  }

  return NDVI_COLOR_RAMP[NDVI_COLOR_RAMP.length - 1].color
}

/**
 * Interpolate between two hex colors.
 */
function interpolateColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16)
  const g1 = parseInt(color1.slice(3, 5), 16)
  const b1 = parseInt(color1.slice(5, 7), 16)

  const r2 = parseInt(color2.slice(1, 3), 16)
  const g2 = parseInt(color2.slice(3, 5), 16)
  const b2 = parseInt(color2.slice(5, 7), 16)

  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Controls for NDVI heatmap layer.
 */
export function NDVIHeatmapControls({
  visible,
  onVisibilityChange,
  opacity,
  onOpacityChange,
  className = '',
}: {
  visible: boolean
  onVisibilityChange: (visible: boolean) => void
  opacity: number
  onOpacityChange: (opacity: number) => void
  className?: string
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">NDVI Heatmap</label>
        <button
          onClick={() => onVisibilityChange(!visible)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            visible ? 'bg-olive' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              visible ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {visible && (
        <div>
          <label className="text-xs text-gray-500">Opacity</label>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity * 100}
            onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
    </div>
  )
}
