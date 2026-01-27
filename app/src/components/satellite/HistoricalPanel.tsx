import { useState, useCallback, useEffect } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { Satellite, Layers } from 'lucide-react'
import { FloatingPanel } from '../ui/floating-panel'
import { Button } from '../ui/button'
import { HistoricalDatePicker } from './HistoricalDatePicker'
import { NDVIHeatmapLayer, NDVIColorLegend } from '../map/NDVIHeatmapLayer'
import { RasterTileLayer } from '../map/RasterTileLayer'
import { useSatelliteTile } from '../../lib/hooks/useSatelliteTiles'
import { useSubscription } from '../../lib/hooks/useSubscription'
import { FEATURES } from '../../lib/featureFlags'
import { cn } from '@/lib/utils'

type LayerType = 'rgb' | 'ndvi'

interface HistoricalPanelProps {
  farmId: string
  map: MapLibreMap | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Floating panel for historical satellite date selection.
 * Simpler modal interface compared to full-screen HistoricalSatelliteView.
 */
export function HistoricalPanel({
  farmId,
  map,
  open,
  onOpenChange,
}: HistoricalPanelProps) {
  const { hasFeature } = useSubscription(farmId)
  const canAccessRawImagery = hasFeature(FEATURES.RAW_IMAGERY)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<LayerType>('ndvi')

  // Get RGB tile for date-specific imagery (paid tiers only)
  const { tile: rgbTile } = useSatelliteTile(
    farmId,
    selectedDate ?? undefined,
    'rgb'
  )

  // Get tile for current selection (for index layers)
  const { tile } = useSatelliteTile(
    farmId,
    selectedDate ?? undefined,
    activeLayer
  )

  // Clear selection when panel closes
  useEffect(() => {
    if (!open) {
      setSelectedDate(null)
    }
  }, [open])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <FloatingPanel
        open={open}
        onOpenChange={onOpenChange}
        title="Historical Satellite"
        subtitle={selectedDate ? formatDisplayDate(selectedDate) : 'Select a date'}
        headerActions={
          selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(null)}
              className="h-5 text-[10px] px-1.5"
            >
              Clear
            </Button>
          )
        }
        defaultWidth={280}
        defaultHeight={380}
        minWidth={260}
        maxWidth={320}
        minHeight={300}
        maxHeight={500}
        initialPosition={{ x: 44, y: 100 }}
      >
        <div className="p-2 space-y-2">
          {/* Date Picker */}
          <HistoricalDatePicker
            farmId={farmId}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />

          {/* Layer toggle (only if date selected) */}
          {selectedDate && (
            <div className="pt-1 border-t">
              <div className="flex items-center gap-1 mb-1.5">
                <Layers className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Layer</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveLayer('ndvi')}
                  className={cn(
                    'flex-1 px-2 py-1 text-xs rounded-md transition-colors',
                    activeLayer === 'ndvi'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  NDVI
                </button>
                {canAccessRawImagery && (
                  <button
                    onClick={() => setActiveLayer('rgb')}
                    className={cn(
                      'flex-1 px-2 py-1 text-xs rounded-md transition-colors',
                      activeLayer === 'rgb'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    RGB
                  </button>
                )}
              </div>
            </div>
          )}

          {/* NDVI Legend (compact) */}
          {selectedDate && activeLayer === 'ndvi' && (
            <NDVIColorLegend className="!p-2 !mt-1" />
          )}

          {/* Tile info */}
          {selectedDate && tile && (
            <div className="text-[10px] text-muted-foreground pt-1 border-t">
              {tile.provider} ({tile.resolutionMeters}m)
            </div>
          )}
        </div>
      </FloatingPanel>

      {/* Map layers - rendered outside panel but controlled by panel state */}
      {open && selectedDate && (
        <>
          {/* RGB raster layer for date-specific imagery (paid tiers with R2 tiles) */}
          {rgbTile && activeLayer === 'rgb' && (
            <RasterTileLayer
              map={map}
              tileUrl={rgbTile.r2Url}
              bounds={rgbTile.bounds}
              visible={true}
              opacity={0.8}
              layerId="historical-rgb"
              beforeLayerId="paddocks-fill"
            />
          )}

          {/* NDVI raster heatmap layer - satellite data only */}
          <NDVIHeatmapLayer
            map={map}
            farmId={farmId}
            captureDate={selectedDate}
            visible={activeLayer === 'ndvi' && !!tile}
            opacity={0.7}
          />
        </>
      )}
    </>
  )
}

/**
 * Button to open the historical panel.
 */
export function HistoricalPanelButton({
  onClick,
  active = false,
  className = '',
}: {
  onClick: () => void
  active?: boolean
  className?: string
}) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn('gap-1 h-7 text-xs shadow-lg', !active && 'bg-white', className)}
    >
      <Satellite className="h-3.5 w-3.5" />
      Historical
    </Button>
  )
}
