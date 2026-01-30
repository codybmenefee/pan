import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { defaultSettings } from '@/data/mock/settings'
import type { FarmSettings, MapPreferences } from '@/lib/types'
import { mapFarmSettingsDoc, type FarmSettingsDoc } from './mappers'
import { useFarmContext } from '@/lib/farm'

interface UseFarmSettingsResult {
  farmId: string | null
  settings: FarmSettings
  isLoading: boolean
  saveSettings: (settings: FarmSettings) => Promise<void>
  resetSettings: () => Promise<void>
  updateMapPreference: <K extends keyof MapPreferences>(key: K, value: MapPreferences[K]) => Promise<void>
}

export function useFarmSettings(): UseFarmSettingsResult {
  const { activeFarmId: farmId, isLoading: isFarmLoading } = useFarmContext()
  const settingsDoc = useQuery(
    api.settings.getSettings,
    farmId ? { farmId } : 'skip'
  ) as FarmSettingsDoc | null | undefined
  const updateSettings = useMutation(api.settings.updateSettings)
  const updateMapPref = useMutation(api.settings.updateMapPreference)
  const resetSettingsMutation = useMutation(api.settings.resetSettings)

  const isLoading = isFarmLoading || (!!farmId && settingsDoc === undefined)
  const settings = settingsDoc ? mapFarmSettingsDoc(settingsDoc) : defaultSettings

  const saveSettings = async (nextSettings: FarmSettings) => {
    if (!farmId) {
      throw new Error('Farm ID is unavailable.')
    }
    await updateSettings({ farmId, settings: nextSettings })
  }

  const resetSettings = async () => {
    if (!farmId) {
      throw new Error('Farm ID is unavailable.')
    }
    await resetSettingsMutation({ farmId })
  }

  const updateMapPreference = async <K extends keyof MapPreferences>(key: K, value: MapPreferences[K]) => {
    if (!farmId) {
      throw new Error('Farm ID is unavailable.')
    }
    // Type assertion: callers always pass booleans, never undefined
    await updateMapPref({ farmId, key, value: value as boolean })
  }

  return {
    farmId,
    settings,
    isLoading,
    saveSettings,
    resetSettings,
    updateMapPreference,
  }
}
