import { useState, useCallback, useEffect } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { HistoricalDatePicker, HistoricalDateList } from './HistoricalDatePicker'
import { NDVIHeatmapLayer, NDVIColorLegend, getNDVIColor } from '../map/NDVIHeatmapLayer'
import { NDVIPaddockOverlay } from '../map/NDVIPaddockOverlay'
import { RasterTileLayer } from '../map/RasterTileLayer'
import { FeatureGate } from '../ui/FeatureGate'
import { useSubscription } from '../../lib/hooks/useSubscription'
import { useSatelliteTile, useObservationsByDate } from '../../lib/hooks/useSatelliteTiles'
import { FEATURES } from '../../lib/featureFlags'

type LayerType = 'rgb' | 'ndvi' | 'evi' | 'ndwi'

interface HistoricalSatelliteViewProps {
  /**
   * Farm ID to display satellite data for (external ID)
   */
  farmId: string

  /**
   * MapLibre map instance
   */
  map: MapLibreMap | null

  /**
   * Whether the view is visible/active
   */
  isOpen: boolean

  /**
   * Callback to close the view
   */
  onClose: () => void

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Full-screen historical satellite viewer with date picker and layer controls.
 * Supports side-by-side comparison mode for paid tiers.
 */
export function HistoricalSatelliteView({
  farmId,
  map,
  isOpen,
  onClose,
  className = '',
}: HistoricalSatelliteViewProps) {
  const { hasFeature } = useSubscription(farmId)
  const canAccessRawImagery = hasFeature(FEATURES.RAW_IMAGERY)

  // State
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<LayerType>('ndvi')
  const [layerOpacity, setLayerOpacity] = useState(0.7)
  const [showDatePicker, setShowDatePicker] = useState(true)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [comparisonDate, setComparisonDate] = useState<string | null>(null)
  const [showNdviOverlay, setShowNdviOverlay] = useState(true) // NDVI overlay toggle for RGB mode

  // Get RGB tile for date-specific imagery (paid tiers only)
  const { tile: rgbTile, isLoading: rgbTileLoading } = useSatelliteTile(
    farmId,
    selectedDate ?? undefined,
    'rgb'
  )

  // Get tile for current selection (for index layers)
  const { tile, isLoading: tileLoading } = useSatelliteTile(
    farmId,
    selectedDate ?? undefined,
    activeLayer
  )

  // Get observation data for selected date (for all tiers)
  const { observations, isLoading: observationsLoading } = useObservationsByDate(
    farmId,
    selectedDate
  )

  const isLoading = tileLoading || observationsLoading || rgbTileLoading

  // Layer toggle handler
  const handleLayerChange = useCallback((layer: LayerType) => {
    setActiveLayer(layer)
  }, [])

  // Enable satellite basemap when view opens, restore when it closes
  useEffect(() => {
    if (!map) return

    const satelliteLayer = map.getLayer('satellite-tiles')
    const osmLayer = map.getLayer('osm-tiles')

    if (!satelliteLayer || !osmLayer) return

    if (isOpen) {
      // Show satellite basemap
      map.setLayoutProperty('satellite-tiles', 'visibility', 'visible')
      map.setLayoutProperty('osm-tiles', 'visibility', 'none')
    } else {
      // Restore to OSM when closed
      map.setLayoutProperty('satellite-tiles', 'visibility', 'none')
      map.setLayoutProperty('osm-tiles', 'visibility', 'visible')
    }
  }, [map, isOpen])

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex flex-col pointer-events-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 pointer-events-auto">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Historical Satellite View</h2>
          {selectedDate && (
            <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
              {formatDisplayDate(selectedDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Comparison mode toggle (paid tiers only) */}
          {canAccessRawImagery && (
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                comparisonMode
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Compare Dates
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col pointer-events-auto">
          {/* Date picker toggle */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-300"
            >
              <span>Select Date</span>
              <svg
                className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Date picker */}
          {showDatePicker && (
            <div className="p-4 border-b border-gray-700 overflow-y-auto max-h-96">
              <HistoricalDatePicker
                farmId={farmId}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                className="bg-gray-700 border-gray-600 text-white [&_*]:text-gray-300"
              />
            </div>
          )}

          {/* Quick date list */}
          {!showDatePicker && (
            <div className="flex-1 overflow-y-auto p-4">
              <HistoricalDateList
                farmId={farmId}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                maxItems={20}
                className="[&_button]:bg-gray-700 [&_button]:text-gray-300 [&_button:hover]:bg-gray-600"
              />
            </div>
          )}

          {/* Layer controls */}
          <div className="p-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Layers</h3>
            <div className="space-y-2">
              {/* RGB layer (paid only) */}
              <FeatureGate
                farmId={farmId}
                feature={FEATURES.RAW_IMAGERY}
                fallback={
                  <LayerButton
                    label="RGB Imagery"
                    active={false}
                    disabled
                    onClick={() => {}}
                    badge="Starter+"
                  />
                }
              >
                <LayerButton
                  label="RGB Imagery"
                  active={activeLayer === 'rgb'}
                  onClick={() => handleLayerChange('rgb')}
                />
              </FeatureGate>

              {/* NDVI layer (free) */}
              <LayerButton
                label="NDVI (Vegetation)"
                active={activeLayer === 'ndvi'}
                onClick={() => handleLayerChange('ndvi')}
              />

              {/* EVI layer (paid) */}
              <FeatureGate
                farmId={farmId}
                feature={FEATURES.EVI_INDEX}
                fallback={
                  <LayerButton
                    label="EVI (Enhanced)"
                    active={false}
                    disabled
                    onClick={() => {}}
                    badge="Starter+"
                  />
                }
              >
                <LayerButton
                  label="EVI (Enhanced)"
                  active={activeLayer === 'evi'}
                  onClick={() => handleLayerChange('evi')}
                />
              </FeatureGate>

              {/* NDWI layer (paid) */}
              <FeatureGate
                farmId={farmId}
                feature={FEATURES.NDWI_INDEX}
                fallback={
                  <LayerButton
                    label="NDWI (Moisture)"
                    active={false}
                    disabled
                    onClick={() => {}}
                    badge="Starter+"
                  />
                }
              >
                <LayerButton
                  label="NDWI (Moisture)"
                  active={activeLayer === 'ndwi'}
                  onClick={() => handleLayerChange('ndwi')}
                />
              </FeatureGate>
            </div>

            {/* Opacity slider */}
            <div className="mt-4">
              <label className="text-xs text-gray-500">Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                value={layerOpacity * 100}
                onChange={(e) => setLayerOpacity(Number(e.target.value) / 100)}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-1"
              />
            </div>

            {/* NDVI overlay toggle (only in RGB mode) */}
            {activeLayer === 'rgb' && (
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNdviOverlay}
                    onChange={(e) => setShowNdviOverlay(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-sm text-gray-300">Show NDVI Overlay</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Color paddocks by vegetation index
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-700">
            {activeLayer === 'ndvi' && (
              <NDVIColorLegend className="bg-gray-700 [&_*]:text-gray-300" />
            )}
            {activeLayer === 'evi' && <EVIColorLegend />}
            {activeLayer === 'ndwi' && <NDWIColorLegend />}
          </div>

          {/* Tile info */}
          {(tile || rgbTile) && (
            <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
              <p>Provider: {(activeLayer === 'rgb' ? rgbTile : tile)?.provider}</p>
              <p>Resolution: {(activeLayer === 'rgb' ? rgbTile : tile)?.resolutionMeters}m</p>
              <p>Cloud cover: {(activeLayer === 'rgb' ? rgbTile : tile)?.cloudCoverPct.toFixed(1)}%</p>
            </div>
          )}
        </div>

        {/* Map area */}
        <div className="flex-1 relative">
          {/* The map is passed from parent - we just render layers on it */}

          {/* RGB raster layer for date-specific imagery (paid tiers with R2 tiles) */}
          {rgbTile && activeLayer === 'rgb' && (
            <RasterTileLayer
              map={map}
              tileUrl={rgbTile.r2Url}
              bounds={rgbTile.bounds}
              visible={true}
              opacity={layerOpacity}
              layerId="rgb-imagery"
              beforeLayerId="paddocks-fill"
            />
          )}

          {/* NDVI raster heatmap layer for paid tiers */}
          <NDVIHeatmapLayer
            map={map}
            farmId={farmId}
            captureDate={selectedDate}
            visible={activeLayer === 'ndvi' && !!tile}
            opacity={layerOpacity}
          />

          {/* Paddock overlay for observation-based NDVI (all tiers) */}
          {/* When in RGB mode, this acts as an optional overlay */}
          <NDVIPaddockOverlay
            map={map}
            observations={observations}
            visible={
              (activeLayer === 'ndvi' && observations.length > 0) ||
              (activeLayer === 'rgb' && showNdviOverlay && observations.length > 0)
            }
            opacity={activeLayer === 'rgb' ? 0.6 : layerOpacity}
          />

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-auto">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
            </div>
          )}

          {/* No date selected prompt */}
          {!selectedDate && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-lg">Select a date from the sidebar</p>
                <p className="text-sm text-gray-400 mt-1">
                  to view historical satellite imagery
                </p>
              </div>
            </div>
          )}

          {/* Observation data panel when date is selected */}
          {selectedDate && observations.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 max-w-lg pointer-events-auto">
              <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="text-sm font-medium text-white">
                    Paddock NDVI Values - {formatDisplayDate(selectedDate)}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {observations.length} paddock{observations.length !== 1 ? 's' : ''} observed
                  </p>
                </div>
                <div className="p-3 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {observations
                      .sort((a, b) => b.ndviMean - a.ndviMean)
                      .map((obs) => (
                        <div
                          key={obs.paddockExternalId}
                          className="flex items-center gap-2 px-2 py-1.5 bg-gray-700/50 rounded"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getNDVIColor(obs.ndviMean) }}
                          />
                          <span className="text-xs text-gray-300 truncate flex-1">
                            {obs.paddockExternalId.replace(/^paddock-/, 'Paddock ')}
                          </span>
                          <span className="text-xs font-mono text-white">
                            {obs.ndviMean.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="px-3 py-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Provider: {observations[0]?.sourceProvider || 'Unknown'}
                  </span>
                  <span>
                    Resolution: {observations[0]?.resolutionMeters || '?'}m
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* No observations message */}
          {selectedDate && !isLoading && observations.length === 0 && (
            <div className="absolute bottom-4 left-4 pointer-events-auto">
              <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 px-4 py-3">
                <p className="text-sm text-gray-400">
                  No observation data found for {formatDisplayDate(selectedDate)}
                </p>
              </div>
            </div>
          )}

          {/* Comparison mode split view */}
          {comparisonMode && selectedDate && (
            <div className="absolute top-4 right-4 w-64 pointer-events-auto">
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <h4 className="text-sm font-medium text-white mb-2">Compare with:</h4>
                <HistoricalDateList
                  farmId={farmId}
                  selectedDate={comparisonDate}
                  onDateSelect={setComparisonDate}
                  maxItems={5}
                  className="[&_button]:bg-gray-700 [&_button]:text-gray-300 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper components

function LayerButton({
  label,
  active,
  disabled = false,
  onClick,
  badge,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? 'bg-green-600 text-white'
          : disabled
            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      <span>{label}</span>
      {badge && (
        <span className="text-xs bg-gray-600 px-1.5 py-0.5 rounded">{badge}</span>
      )}
    </button>
  )
}

function EVIColorLegend() {
  return (
    <div className="bg-gray-700 rounded-lg p-3">
      <h4 className="text-xs font-medium text-gray-300 mb-2">EVI (Enhanced Vegetation)</h4>
      <div className="flex items-center gap-1">
        <div className="flex-1 h-3 rounded bg-gradient-to-r from-amber-700 via-yellow-500 to-green-600" />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  )
}

function NDWIColorLegend() {
  return (
    <div className="bg-gray-700 rounded-lg p-3">
      <h4 className="text-xs font-medium text-gray-300 mb-2">NDWI (Water/Moisture)</h4>
      <div className="flex items-center gap-1">
        <div className="flex-1 h-3 rounded bg-gradient-to-r from-amber-600 via-white to-blue-600" />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>Dry</span>
        <span>Wet</span>
      </div>
    </div>
  )
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Button to open the historical satellite view.
 */
export function HistoricalSatelliteButton({
  onClick,
  className = '',
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700 ${className}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      Historical Satellite
    </button>
  )
}
