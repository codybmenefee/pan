import { memo, useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThresholdSliderProps {
  label: string
  description?: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  className?: string
  defaultValue?: number
  onReset?: () => void
}

export const ThresholdSlider = memo(function ThresholdSlider({
  label,
  description,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  formatValue,
  className,
  defaultValue,
  onReset,
}: ThresholdSliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toString()
  const defaultDisplayValue = defaultValue !== undefined
    ? (formatValue ? formatValue(defaultValue) : defaultValue.toString())
    : null
  const sliderValue = useMemo(() => [value], [value])

  // Check if value differs from default (with tolerance for floating point)
  const isDifferentFromDefault = defaultValue !== undefined &&
    Math.abs(value - defaultValue) > step / 2

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="text-sm font-medium">{label}</label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDifferentFromDefault && defaultDisplayValue && (
            <span className="text-xs text-muted-foreground">
              (default: {defaultDisplayValue}{unit ? ` ${unit}` : ''})
            </span>
          )}
          {isDifferentFromDefault && onReset && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onReset}
              title="Reset to default"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          <span className="text-sm font-mono font-medium">
            {displayValue} {unit}
          </span>
        </div>
      </div>
      <Slider
        value={sliderValue}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  )
})
