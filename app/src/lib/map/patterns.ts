/**
 * Creates a diagonal stripe pattern for use with MapLibre fill-pattern.
 * Returns ImageData that can be added to the map via map.addImage().
 */
export function createDiagonalStripePattern(options: {
  stripeColor: string
  backgroundColor: string
  stripeWidth: number
  spacing: number
  size?: number
}): ImageData {
  const { stripeColor, backgroundColor, stripeWidth, spacing, size = 32 } = options

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Fill background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, size, size)

  // Draw diagonal stripes (45 degrees, bottom-left to top-right)
  ctx.strokeStyle = stripeColor
  ctx.lineWidth = stripeWidth
  ctx.lineCap = 'square'

  // Calculate the pattern repeat distance
  const step = stripeWidth + spacing

  // Draw diagonal lines - need to cover the full diagonal of the tile
  // Start from negative to ensure coverage when tiled
  for (let i = -size; i < size * 2; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, size)
    ctx.lineTo(i + size, 0)
    ctx.stroke()
  }

  return ctx.getImageData(0, 0, size, size)
}

/**
 * Creates the no-graze zone stripe pattern with red stripes on a light red background.
 * @deprecated Use createNoGrazeStripePatternByType instead for type-specific colors
 */
export function createNoGrazeStripePattern(): ImageData {
  return createDiagonalStripePattern({
    stripeColor: '#dc2626', // Red-600
    backgroundColor: 'rgba(239, 68, 68, 0.15)', // Red-500 at 15% opacity
    stripeWidth: 3,
    spacing: 6,
    size: 32,
  })
}

/**
 * Type-specific color configurations for no-graze zones.
 */
const noGrazeZoneTypeColors: Record<string, { stripe: string; background: string }> = {
  environmental: { stripe: '#16a34a', background: 'rgba(34, 197, 94, 0.15)' }, // Green
  hazard: { stripe: '#ea580c', background: 'rgba(249, 115, 22, 0.15)' }, // Orange
  infrastructure: { stripe: '#6b7280', background: 'rgba(107, 114, 128, 0.15)' }, // Gray
  protected: { stripe: '#9333ea', background: 'rgba(168, 85, 247, 0.15)' }, // Purple
  other: { stripe: '#dc2626', background: 'rgba(239, 68, 68, 0.15)' }, // Red (default)
}

/**
 * Creates a no-graze zone stripe pattern based on the zone type.
 * @param type The no-graze zone type (environmental, hazard, infrastructure, protected, other)
 */
export function createNoGrazeStripePatternByType(type: string): ImageData {
  const colors = noGrazeZoneTypeColors[type] ?? noGrazeZoneTypeColors.other
  return createDiagonalStripePattern({
    stripeColor: colors.stripe,
    backgroundColor: colors.background,
    stripeWidth: 3,
    spacing: 6,
    size: 32,
  })
}

/**
 * Get all no-graze zone types for pattern registration.
 */
export function getNoGrazeZoneTypes(): string[] {
  return Object.keys(noGrazeZoneTypeColors)
}
