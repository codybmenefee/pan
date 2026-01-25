import { useEffect, useRef } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { ObservationData } from '../../lib/hooks/useSatelliteTiles'
import { getNDVIColor } from './NDVIHeatmapLayer'

interface NDVIPaddockOverlayProps {
  map: MapLibreMap | null
  observations: ObservationData[]
  visible: boolean
  opacity?: number
  layerId?: string
}

/**
 * Overlays paddock polygons with NDVI colors based on observation data.
 * Uses the existing paddocks-source and creates a new fill layer on top.
 */
export function NDVIPaddockOverlay({
  map,
  observations,
  visible,
  opacity = 0.7,
  layerId = 'ndvi-paddock-overlay',
}: NDVIPaddockOverlayProps) {
  const layerAdded = useRef(false)
  const prevObservationsRef = useRef<string>('')

  useEffect(() => {
    if (!map) return

    // Check if paddocks source exists
    const paddocksSource = map.getSource('paddocks')
    if (!paddocksSource) {
      console.log('[NDVIPaddockOverlay] paddocks source not found, skipping')
      return
    }

    // Remove existing layer if needed
    if (layerAdded.current && map.getLayer(layerId)) {
      map.removeLayer(layerId)
      layerAdded.current = false
    }

    // Don't add if not visible or no observations
    if (!visible || observations.length === 0) {
      return
    }

    // Build a color mapping: paddock ID -> NDVI color
    const colorMap: Record<string, string> = {}
    for (const obs of observations) {
      colorMap[obs.paddockExternalId] = getNDVIColor(obs.ndviMean)
    }

    // Build MapLibre match expression for fill color
    // ['match', ['get', 'id'], paddockId1, color1, paddockId2, color2, ..., defaultColor]
    const matchExpression: (string | string[])[] = ['match', ['get', 'id']]
    for (const [paddockId, color] of Object.entries(colorMap)) {
      matchExpression.push(paddockId, color)
    }
    matchExpression.push('transparent') // default for paddocks without observations

    // Add the NDVI overlay layer
    map.addLayer(
      {
        id: layerId,
        type: 'fill',
        source: 'paddocks',
        paint: {
          'fill-color': matchExpression as unknown as string,
          'fill-opacity': opacity,
        },
      },
      'paddocks-outline' // Insert below the outline layer
    )
    layerAdded.current = true

    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
        layerAdded.current = false
      }
    }
  }, [map, observations, visible, opacity, layerId])

  // Update visibility
  useEffect(() => {
    if (!map || !map.getLayer(layerId)) return
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }, [map, visible, layerId])

  // Update opacity
  useEffect(() => {
    if (!map || !map.getLayer(layerId)) return
    map.setPaintProperty(layerId, 'fill-opacity', opacity)
  }, [map, opacity, layerId])

  // Update colors when observations change
  useEffect(() => {
    if (!map || !map.getLayer(layerId) || observations.length === 0) return

    // Serialize to check for actual changes
    const obsKey = observations.map(o => `${o.paddockExternalId}:${o.ndviMean}`).join(',')
    if (obsKey === prevObservationsRef.current) return
    prevObservationsRef.current = obsKey

    // Build updated color map
    const matchExpression: (string | string[])[] = ['match', ['get', 'id']]
    for (const obs of observations) {
      matchExpression.push(obs.paddockExternalId, getNDVIColor(obs.ndviMean))
    }
    matchExpression.push('transparent')

    map.setPaintProperty(layerId, 'fill-color', matchExpression as unknown as string)
  }, [map, observations, layerId])

  return null
}
