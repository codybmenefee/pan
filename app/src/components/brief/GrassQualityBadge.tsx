import { Leaf, Check, Clock, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type GrassQuality,
  getGrassQualityLabel,
  getGrassQualityColor,
  getGrassQualityBgColor,
  getGrassQualityBorderColor,
} from '@/lib/grassQuality'

interface GrassQualityBadgeProps {
  quality: GrassQuality
  className?: string
}

const qualityIcons: Record<GrassQuality, typeof Leaf> = {
  prime: Leaf,
  ready: Check,
  recovering: Clock,
  resting: Pause,
}

export function GrassQualityBadge({ quality, className }: GrassQualityBadgeProps) {
  const Icon = qualityIcons[quality]
  const label = getGrassQualityLabel(quality)
  const textColor = getGrassQualityColor(quality)
  const bgColor = getGrassQualityBgColor(quality)
  const borderColor = getGrassQualityBorderColor(quality)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 border-2 text-[10px] font-bold uppercase tracking-wider',
        bgColor,
        borderColor,
        textColor,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </div>
  )
}
