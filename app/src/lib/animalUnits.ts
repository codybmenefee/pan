import type { LivestockSettings, LivestockSummary } from './types'

/**
 * Default livestock settings used when farm hasn't customized values
 */
export const DEFAULT_LIVESTOCK_SETTINGS: LivestockSettings = {
  cowAU: 1.0,
  calfAU: 0.5,
  sheepAU: 0.2,
  lambAU: 0.1,
  dailyDMPerAU: 12, // kg dry matter per AU per day
}

/**
 * Calculate total animal units from livestock counts
 */
export function calculateAnimalUnits(
  cows: number,
  calves: number,
  sheep: number,
  lambs: number,
  settings: LivestockSettings = DEFAULT_LIVESTOCK_SETTINGS
): number {
  const total =
    cows * settings.cowAU +
    calves * settings.calfAU +
    sheep * settings.sheepAU +
    lambs * settings.lambAU

  return Math.round(total * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate daily dry matter consumption in kg
 */
export function calculateDailyConsumption(
  totalAnimalUnits: number,
  settings: LivestockSettings = DEFAULT_LIVESTOCK_SETTINGS
): number {
  return Math.round(totalAnimalUnits * settings.dailyDMPerAU)
}

/**
 * Calculate AU contribution for offspring (calves/lambs)
 */
export function calculateOffspringAU(
  count: number,
  animalType: 'cow' | 'sheep',
  settings: LivestockSettings = DEFAULT_LIVESTOCK_SETTINGS
): number {
  const factor = animalType === 'cow' ? settings.calfAU : settings.lambAU
  return Math.round(count * factor * 10) / 10
}

/**
 * Format AU value for display
 */
export function formatAU(au: number): string {
  return au.toFixed(1)
}

/**
 * Format daily consumption for display
 */
export function formatDailyConsumption(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} t/day`
  }
  return `${kg} kg/day`
}

/**
 * Get a human-readable summary of livestock for display
 */
export function getLivestockDisplaySummary(summary: LivestockSummary): string {
  const parts: string[] = []

  if (summary.cows > 0) {
    parts.push(`${summary.cows} cow${summary.cows !== 1 ? 's' : ''}`)
  }
  if (summary.sheep > 0) {
    parts.push(`${summary.sheep} sheep`)
  }
  if (summary.calves > 0) {
    parts.push(`${summary.calves} calv${summary.calves !== 1 ? 'es' : ''}`)
  }
  if (summary.lambs > 0) {
    parts.push(`${summary.lambs} lamb${summary.lambs !== 1 ? 's' : ''}`)
  }

  return parts.length > 0 ? parts.join(', ') : 'No livestock'
}
