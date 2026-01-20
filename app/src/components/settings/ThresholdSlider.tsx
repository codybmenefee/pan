import { memo, useMemo } from 'react'
import { Slider } from '@/components/ui/slider'
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
}: ThresholdSliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toString()
  const sliderValue = useMemo(() => [value], [value])

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{label}</label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <span className="text-sm font-mono font-medium">
          {displayValue} {unit}
        </span>
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
