/**
 * Area unit conversion utilities.
 * Internal storage is always in hectares; conversion happens at display layer.
 */

export type AreaUnit = 'hectares' | 'acres'

export const ACRES_PER_HECTARE = 2.47105
export const HECTARES_PER_SQUARE_METER = 1 / 10000
export const DEFAULT_AREA_UNIT: AreaUnit = 'hectares'

/**
 * Convert from hectares to the specified unit.
 */
export function convertFromHectares(hectares: number, unit: AreaUnit): number {
  if (unit === 'acres') {
    return hectares * ACRES_PER_HECTARE
  }
  return hectares
}

/**
 * Convert from the specified unit to hectares.
 */
export function convertToHectares(value: number, unit: AreaUnit): number {
  if (unit === 'acres') {
    return value / ACRES_PER_HECTARE
  }
  return value
}

/**
 * Format an area value (stored in hectares) for display in the user's preferred unit.
 * @param hectares - Area in hectares
 * @param unit - Display unit
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with unit label (e.g., "25.5 ha" or "63.0 ac")
 */
export function formatArea(hectares: number, unit: AreaUnit, decimals: number = 1): string {
  const value = convertFromHectares(hectares, unit)
  const label = getUnitLabel(unit)
  return `${value.toFixed(decimals)} ${label}`
}

/**
 * Get the short unit label.
 */
export function getUnitLabel(unit: AreaUnit): string {
  return unit === 'acres' ? 'ac' : 'ha'
}

/**
 * Get the full unit name (plural).
 */
export function getUnitNamePlural(unit: AreaUnit): string {
  return unit === 'acres' ? 'acres' : 'hectares'
}
