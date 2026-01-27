import { memo, useMemo } from 'react'
import { Info } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface CompactSliderProps {
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

export const CompactSlider = memo(function CompactSlider({
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
}: CompactSliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toString()
  const sliderValue = useMemo(() => [value], [value])

  return (
    <div className={cn('flex items-center gap-3 py-1.5', className)}>
      <div className="flex items-center gap-1.5 w-40 shrink-0">
        <span className="text-sm">{label}</span>
        {description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>{description}</p>
              <p className="text-muted-foreground mt-1">
                Range: {min}–{max} {unit}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-sm font-mono w-16 text-right tabular-nums">
        {displayValue}
        {unit && ` ${unit}`}
      </span>
      <Slider
        value={sliderValue}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
      />
    </div>
  )
})
