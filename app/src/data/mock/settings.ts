import type { FarmSettings } from '@/lib/types'

export const defaultSettings: FarmSettings = {
  minNDVIThreshold: 0.40,
  minRestPeriod: 21,
  cloudCoverTolerance: 50,
  dailyBriefTime: '06:00',
  emailNotifications: true,
  pushNotifications: false,
  virtualFenceProvider: '',
  apiKey: '',
  mapPreferences: { showRGBSatellite: false, showNDVIHeatmap: false },
  areaUnit: 'hectares',
}
