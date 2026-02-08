export type GrassQuality = 'prime' | 'ready' | 'recovering' | 'resting'

export function getGrassQuality(ndvi: number): GrassQuality {
  if (ndvi >= 0.6) return 'prime'
  if (ndvi >= 0.45) return 'ready'
  if (ndvi >= 0.3) return 'recovering'
  return 'resting'
}

export function getGrassQualityLabel(quality: GrassQuality): string {
  const labels: Record<GrassQuality, string> = {
    prime: 'Prime',
    ready: 'Ready',
    recovering: 'Recovering',
    resting: 'Resting',
  }
  return labels[quality]
}

export function getGrassQualityColor(quality: GrassQuality): string {
  const colors: Record<GrassQuality, string> = {
    prime: 'text-olive',
    ready: 'text-olive',
    recovering: 'text-terracotta',
    resting: 'text-gray-400',
  }
  return colors[quality]
}

export function getGrassQualityBgColor(quality: GrassQuality): string {
  const colors: Record<GrassQuality, string> = {
    prime: 'bg-olive/10',
    ready: 'bg-olive/5',
    recovering: 'bg-terracotta/5',
    resting: 'bg-gray-100',
  }
  return colors[quality]
}

export function getGrassQualityBorderColor(quality: GrassQuality): string {
  const colors: Record<GrassQuality, string> = {
    prime: 'border-olive',
    ready: 'border-olive/70',
    recovering: 'border-terracotta/70',
    resting: 'border-gray-300',
  }
  return colors[quality]
}
