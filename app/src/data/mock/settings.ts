import type { FarmSettings } from '@/lib/types'

export const defaultSettings: FarmSettings = {
  minNDVIThreshold: 0.40,
  minRestPeriod: 21,
  cloudCoverTolerance: 50,
  rotationFrequency: 1,
  dailyBriefTime: '06:00',
  emailNotifications: true,
  pushNotifications: false,
  virtualFenceProvider: '',
  apiKey: '',
  agentProfileId: 'balanced',
  mapPreferences: { showRGBSatellite: false, showNDVIHeatmap: false },
  areaUnit: 'hectares',
}
