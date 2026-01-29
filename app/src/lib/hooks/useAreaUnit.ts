import { useFarmSettings } from '@/lib/convex/useFarmSettings'
import {
  type AreaUnit,
  DEFAULT_AREA_UNIT,
  convertFromHectares,
  convertToHectares,
  formatArea,
  getUnitLabel,
  getUnitNamePlural,
} from '@/lib/areaUnits'

/**
 * Hook for accessing area unit preferences and conversion utilities.
 * Uses the farm's configured area unit preference from settings.
 */
export function useAreaUnit() {
  const { settings } = useFarmSettings()
  const unit: AreaUnit = settings?.areaUnit ?? DEFAULT_AREA_UNIT

  return {
    /** The user's preferred area unit */
    unit,
    /** Convert from hectares to preferred unit */
    convert: (hectares: number) => convertFromHectares(hectares, unit),
    /** Convert from preferred unit to hectares (for saving) */
    toHectares: (value: number) => convertToHectares(value, unit),
    /** Format an area (in hectares) for display with unit label */
    format: (hectares: number, decimals?: number) => formatArea(hectares, unit, decimals),
    /** Short unit label ("ha" or "ac") */
    label: getUnitLabel(unit),
    /** Full unit name ("hectares" or "acres") */
    unitName: getUnitNamePlural(unit),
  }
}
