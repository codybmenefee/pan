import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompactSlider } from './CompactSlider'
import { defaultSettings } from '@/data/mock/settings'
import type { FarmSettings } from '@/lib/types'

interface ThresholdSettingsProps {
  settings: FarmSettings
  onChange: (settings: FarmSettings) => void
}

export function ThresholdSettings({ settings, onChange }: ThresholdSettingsProps) {
  const updateSetting = <K extends keyof FarmSettings>(
    key: K,
    value: FarmSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  const resetAllThresholds = () => {
    onChange({
      ...settings,
      minNDVIThreshold: defaultSettings.minNDVIThreshold,
      minRestPeriod: defaultSettings.minRestPeriod,
      cloudCoverTolerance: defaultSettings.cloudCoverTolerance,
    })
  }

  const hasChanges =
    settings.minNDVIThreshold !== defaultSettings.minNDVIThreshold ||
    settings.minRestPeriod !== defaultSettings.minRestPeriod ||
    settings.cloudCoverTolerance !== defaultSettings.cloudCoverTolerance

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure thresholds for grazing recommendations
        </p>
        {hasChanges && (
          <Button variant="ghost" size="sm" onClick={resetAllThresholds}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset all
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <CompactSlider
          label="Min NDVI"
          description="Paddocks below this vegetation index won't be recommended for grazing"
          value={settings.minNDVIThreshold}
          min={0.2}
          max={0.6}
          step={0.05}
          unit=""
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => updateSetting('minNDVIThreshold', v)}
        />

        <CompactSlider
          label="Rest Period"
          description="Minimum days since last grazing before recommending a paddock"
          value={settings.minRestPeriod}
          min={7}
          max={42}
          step={1}
          unit="days"
          onChange={(v) => updateSetting('minRestPeriod', v)}
        />

        <CompactSlider
          label="Cloud Tolerance"
          description="Maximum cloud cover percentage for usable satellite data"
          value={settings.cloudCoverTolerance}
          min={20}
          max={80}
          step={5}
          unit="%"
          onChange={(v) => updateSetting('cloudCoverTolerance', v)}
        />
      </div>
    </div>
  )
}
