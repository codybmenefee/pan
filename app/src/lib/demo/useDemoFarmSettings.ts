/**
 * Demo-aware farm settings hook.
 *
 * - VITE_DEV_AUTH=true (Developer): Settings read/write from Convex
 * - Otherwise (Public Demo): Settings override stored in localStorage
 */

import { useState, useCallback, useMemo } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { defaultSettings } from '@/data/mock/settings'
import type { FarmSettings, MapPreferences } from '@/lib/types'
import { mapFarmSettingsDoc, type FarmSettingsDoc } from '@/lib/convex/mappers'
import { useFarmContext } from '@/lib/farm'
import { useDemoAuth } from '@/lib/auth/DemoAuthProvider'
import { isDemoDevMode } from './isDemoDevMode'
import { getDemoSettings, setDemoSettings } from './demoLocalStorage'

interface UseDemoFarmSettingsResult {
  farmId: string | null
  settings: FarmSettings
  isLoading: boolean
  saveSettings: (settings: FarmSettings) => Promise<void>
  resetSettings: () => Promise<void>
  updateMapPreference: <K extends keyof MapPreferences>(key: K, value: MapPreferences[K]) => Promise<void>
}

export function useDemoFarmSettings(): UseDemoFarmSettingsResult {
  const { activeFarmId: farmId, isLoading: isFarmLoading } = useFarmContext()
  const { demoSessionId } = useDemoAuth()

  // Force re-render when localStorage changes
  const [localStorageVersion, setLocalStorageVersion] = useState(0)

  // Convex query for base settings
  const settingsDoc = useQuery(
    api.settings.getSettings,
    farmId ? { farmId } : 'skip'
  ) as FarmSettingsDoc | null | undefined

  // Convex mutations (only used in dev mode)
  const updateSettings = useMutation(api.settings.updateSettings)
  const updateMapPref = useMutation(api.settings.updateMapPreference)
  const resetSettingsMutation = useMutation(api.settings.resetSettings)

  const isLoading = isFarmLoading || (!!farmId && settingsDoc === undefined)

  // Get base settings from Convex
  const baseSettings = settingsDoc ? mapFarmSettingsDoc(settingsDoc) : defaultSettings

  // Merge with localStorage override for public demo mode
  const settings = useMemo(() => {
    if (isDemoDevMode || !demoSessionId) {
      return baseSettings
    }
    // Force dependency on localStorageVersion for re-render
    void localStorageVersion
    const override = getDemoSettings(demoSessionId)
    if (override) {
      return override
    }
    return baseSettings
  }, [baseSettings, demoSessionId, localStorageVersion])

  // Helper to trigger re-render after localStorage update
  const triggerLocalStorageUpdate = useCallback(() => {
    setLocalStorageVersion((v) => v + 1)
  }, [])

  const saveSettings = useCallback(
    async (nextSettings: FarmSettings) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }

      if (isDemoDevMode) {
        // Developer mode: save to Convex
        await updateSettings({ farmId, settings: nextSettings })
      } else if (demoSessionId) {
        // Public demo mode: save to localStorage
        setDemoSettings(demoSessionId, nextSettings)
        triggerLocalStorageUpdate()
      }
    },
    [farmId, demoSessionId, updateSettings, triggerLocalStorageUpdate]
  )

  const resetSettings = useCallback(async () => {
    if (!farmId) {
      throw new Error('Farm ID is unavailable.')
    }

    if (isDemoDevMode) {
      // Developer mode: reset in Convex
      await resetSettingsMutation({ farmId })
    } else if (demoSessionId) {
      // Public demo mode: clear localStorage override (reverts to Convex base)
      setDemoSettings(demoSessionId, null)
      triggerLocalStorageUpdate()
    }
  }, [farmId, demoSessionId, resetSettingsMutation, triggerLocalStorageUpdate])

  const updateMapPreference = useCallback(
    async <K extends keyof MapPreferences>(key: K, value: MapPreferences[K]) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }

      if (isDemoDevMode) {
        // Developer mode: save to Convex
        await updateMapPref({ farmId, key, value: value as boolean })
      } else if (demoSessionId) {
        // Public demo mode: update localStorage
        const currentSettings = settings
        const updatedSettings: FarmSettings = {
          ...currentSettings,
          mapPreferences: {
            showRGBSatellite: currentSettings.mapPreferences?.showRGBSatellite ?? false,
            ...currentSettings.mapPreferences,
            [key]: value,
          },
        }
        setDemoSettings(demoSessionId, updatedSettings)
        triggerLocalStorageUpdate()
      }
    },
    [farmId, demoSessionId, settings, updateMapPref, triggerLocalStorageUpdate]
  )

  return {
    farmId,
    settings,
    isLoading,
    saveSettings,
    resetSettings,
    updateMapPreference,
  }
}
