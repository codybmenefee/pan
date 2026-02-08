import { Layers, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type SatelliteLayer = 'ndvi' | 'rgb' | null

interface LayerSelectorProps {
  satelliteLayer: SatelliteLayer
  onSatelliteLayerChange: (value: SatelliteLayer) => void
  layers: {
    pastures: boolean
    paddocks: boolean
    labels: boolean
  }
  onToggleLayer: (layer: 'pastures' | 'paddocks' | 'labels') => void
}

export function LayerSelector({
  satelliteLayer,
  onSatelliteLayerChange,
  layers,
  onToggleLayer,
}: LayerSelectorProps) {
  const label = satelliteLayer === 'ndvi' ? 'NDVI' : satelliteLayer === 'rgb' ? 'RGB' : 'Layers'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 bg-dark text-cream shadow-[2px_2px_0_var(--olive)] border-2 border-dark hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--olive)] transition-all">
          <Layers className="h-3.5 w-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
          <ChevronDown className="h-3 w-3 text-cream/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[100px]">
        {/* Satellite layers - mutually exclusive */}
        <DropdownMenuCheckboxItem
          className="text-xs py-1"
          checked={satelliteLayer === 'ndvi'}
          onCheckedChange={(checked) => onSatelliteLayerChange(checked ? 'ndvi' : null)}
          onSelect={(e) => e.preventDefault()}
        >
          NDVI
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="text-xs py-1"
          checked={satelliteLayer === 'rgb'}
          onCheckedChange={(checked) => onSatelliteLayerChange(checked ? 'rgb' : null)}
          onSelect={(e) => e.preventDefault()}
        >
          RGB
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        {/* Visibility layers - multi-select */}
        <DropdownMenuCheckboxItem
          className="text-xs py-1"
          checked={layers.pastures}
          onCheckedChange={() => onToggleLayer('pastures')}
          onSelect={(e) => e.preventDefault()}
        >
          Pastures
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="text-xs py-1"
          checked={layers.paddocks}
          onCheckedChange={() => onToggleLayer('paddocks')}
          onSelect={(e) => e.preventDefault()}
        >
          Paddocks
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="text-xs py-1"
          checked={layers.labels}
          onCheckedChange={() => onToggleLayer('labels')}
          onSelect={(e) => e.preventDefault()}
        >
          Labels
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
