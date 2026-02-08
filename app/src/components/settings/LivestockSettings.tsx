import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { RotateCcw } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { CompactSlider } from './CompactSlider'
import { useFarmContext } from '@/lib/farm'
import { DEFAULT_LIVESTOCK_SETTINGS } from '@/lib/animalUnits'
import type { LivestockSettings as LivestockSettingsType } from '@/lib/types'
import { toast } from 'sonner'

export function LivestockSettings() {
  const { activeFarmId } = useFarmContext()

  const settingsData = useQuery(
    api.settings.getLivestockSettings,
    activeFarmId ? { farmId: activeFarmId } : 'skip'
  )

  const updateSettings = useMutation(api.settings.updateLivestockSettings)

  const [settings, setSettings] = useState<LivestockSettingsType>(DEFAULT_LIVESTOCK_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData as LivestockSettingsType)
      setHasChanges(false)
    }
  }, [settingsData])

  const handleChange = (key: keyof LivestockSettingsType, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!activeFarmId) return
    setSaving(true)
    try {
      await updateSettings({
        farmId: activeFarmId,
        livestockSettings: settings,
      })
      setHasChanges(false)
      toast.success('Livestock settings saved')
    } catch (error) {
      console.error('Failed to save livestock settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(DEFAULT_LIVESTOCK_SETTINGS)
    setHasChanges(true)
  }

  const isModified =
    settings.cowAU !== DEFAULT_LIVESTOCK_SETTINGS.cowAU ||
    settings.calfAU !== DEFAULT_LIVESTOCK_SETTINGS.calfAU ||
    settings.sheepAU !== DEFAULT_LIVESTOCK_SETTINGS.sheepAU ||
    settings.lambAU !== DEFAULT_LIVESTOCK_SETTINGS.lambAU ||
    settings.dailyDMPerAU !== DEFAULT_LIVESTOCK_SETTINGS.dailyDMPerAU ||
    (settings.pastureYieldKgPerHa ?? 2500) !== (DEFAULT_LIVESTOCK_SETTINGS.pastureYieldKgPerHa ?? 2500)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure AU factors and consumption rates for grazing calculations
        </p>
        {isModified && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset all
          </Button>
        )}
      </div>

      {/* Animal Unit Factors */}
      <div>
        <h4 className="text-sm font-medium mb-2">Animal Unit Factors</h4>
        <div className="space-y-1">
          <CompactSlider
            label="Cow AU"
            description="Mature breeding cow. Standard reference is 1.0 AU"
            value={settings.cowAU}
            min={0.5}
            max={1.5}
            step={0.1}
            unit="AU"
            formatValue={(v) => v.toFixed(1)}
            onChange={(v) => handleChange('cowAU', v)}
          />

          <CompactSlider
            label="Calf AU"
            description="Nursing or weaned calf"
            value={settings.calfAU}
            min={0.2}
            max={0.8}
            step={0.1}
            unit="AU"
            formatValue={(v) => v.toFixed(1)}
            onChange={(v) => handleChange('calfAU', v)}
          />

          <CompactSlider
            label="Sheep AU"
            description="Mature breeding ewe"
            value={settings.sheepAU}
            min={0.1}
            max={0.4}
            step={0.05}
            unit="AU"
            formatValue={(v) => v.toFixed(2)}
            onChange={(v) => handleChange('sheepAU', v)}
          />

          <CompactSlider
            label="Lamb AU"
            description="Nursing or weaned lamb"
            value={settings.lambAU}
            min={0.05}
            max={0.2}
            step={0.01}
            unit="AU"
            formatValue={(v) => v.toFixed(2)}
            onChange={(v) => handleChange('lambAU', v)}
          />
        </div>
      </div>

      {/* Daily Consumption */}
      <div>
        <h4 className="text-sm font-medium mb-2">Daily Consumption</h4>
        <CompactSlider
          label="Dry Matter/AU"
          description="Daily forage consumption per animal unit"
          value={settings.dailyDMPerAU}
          min={8}
          max={16}
          step={0.5}
          unit="kg"
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => handleChange('dailyDMPerAU', v)}
        />
      </div>

      {/* Pasture Yield */}
      <div>
        <h4 className="text-sm font-medium mb-2">Pasture Yield</h4>
        <CompactSlider
          label="Pasture Yield"
          description="Available dry matter per hectare for section sizing"
          value={settings.pastureYieldKgPerHa ?? 2500}
          min={1500}
          max={5000}
          step={100}
          unit="kg/ha"
          formatValue={(v) => v.toFixed(0)}
          onChange={(v) => handleChange('pastureYieldKgPerHa', v)}
        />
      </div>

      {/* Save button for livestock (kept separate as it uses Convex mutation) */}
      <div className="flex justify-end pt-2">
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? 'Saving...' : 'Save Livestock Settings'}
        </Button>
      </div>
    </div>
  )
}
