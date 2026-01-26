import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LayerTogglesProps {
  layers: {
    ndviHeat: boolean
    paddocks: boolean
    labels: boolean
    sections: boolean
    rgbSatellite?: boolean
  }
  onToggle: (layer: keyof Omit<LayerTogglesProps['layers'], 'rgbSatellite'>) => void
  onToggleRGB?: (enabled: boolean) => void
  showEditToggle?: boolean
}

export function LayerToggles({
  layers,
  onToggle,
  onToggleRGB,
}: LayerTogglesProps) {
  const buttons = [
    { key: 'ndviHeat' as const, label: 'NDVI Heat' },
    { key: 'paddocks' as const, label: 'Paddocks' },
    { key: 'sections' as const, label: 'Sections' },
    { key: 'labels' as const, label: 'Labels' },
  ]

  return (
    <div className="flex gap-0.5 rounded-lg border border-border bg-background/95 backdrop-blur p-0.5">
      {buttons.map((btn) => (
        <Button
          key={btn.key}
          variant="ghost"
          size="sm"
          onClick={() => onToggle(btn.key)}
          className={cn(
            'h-5 px-1.5 text-[10px]',
            layers[btn.key] && 'bg-accent'
          )}
        >
          {btn.label}
        </Button>
      ))}
      {onToggleRGB && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleRGB(!layers.rgbSatellite)}
          className={cn(
            'h-5 px-1.5 text-[10px]',
            layers.rgbSatellite && 'bg-accent'
          )}
        >
          RGB Imagery
        </Button>
      )}
    </div>
  )
}
