import { useMemo } from 'react'
import { useGeometry } from '@/lib/geometry'
import type { Pasture, Paddock, PaddockAlternative } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PastureMiniMapProps {
  currentPastureId?: string
  targetPastureId?: string
  highlightedPastureId?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  showLabels?: boolean
  className?: string
  // Paddock-specific props
  paddock?: Paddock
  previousPaddocks?: Paddock[]
  // Paddock alternatives
  paddockAlternatives?: PaddockAlternative[]
  selectedAlternativeId?: string
}

const statusColors: Record<Pasture['status'], string> = {
  ready: '#22c55e',
  almost_ready: '#f59e0b',
  recovering: '#6b7280',
  grazed: '#ef4444',
}

const statusColorsLight: Record<Pasture['status'], string> = {
  ready: '#86efac',
  almost_ready: '#fcd34d',
  recovering: '#d1d5db',
  grazed: '#fca5a5',
}

export function PastureMiniMap({
  currentPastureId,
  targetPastureId,
  highlightedPastureId,
  size = 'md',
  showLabels = false,
  className,
  paddock,
  previousPaddocks = [],
  paddockAlternatives = [],
  selectedAlternativeId,
}: PastureMiniMapProps) {
  const { pastures, getPastureById } = useGeometry()

  // Check if we're in paddock view mode (focus on single pasture)
  const paddockViewMode = paddock && currentPastureId === targetPastureId
  const focusPasture = paddockViewMode ? getPastureById(currentPastureId!) : null

  // Calculate bounds and normalize coordinates
  // When in paddock view mode, focus only on the current pasture
  const { normalizedPastures, viewBox, pastureCenters, normalizeFn, focusPasturePath, svgWidth, svgHeight } = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    if (paddockViewMode && focusPasture) {
      // Focus bounds on just the current pasture - paddocks may overflow but that's ok
      const coords = (focusPasture.geometry.geometry as GeoJSON.Polygon).coordinates[0]
      coords.forEach(([lng, lat]) => {
        minX = Math.min(minX, lng)
        maxX = Math.max(maxX, lng)
        minY = Math.min(minY, lat)
        maxY = Math.max(maxY, lat)
      })
    } else {
      // Find bounds from all pasture coordinates
      pastures.forEach(p => {
        const coords = (p.geometry.geometry as GeoJSON.Polygon).coordinates[0]
        coords.forEach(([lng, lat]) => {
          minX = Math.min(minX, lng)
          maxX = Math.max(maxX, lng)
          minY = Math.min(minY, lat)
          maxY = Math.max(maxY, lat)
        })
      })
    }

    const width = maxX - minX
    const height = maxY - minY
    const padding = 0.02 // Minimal padding for full bleed
    const paddedWidth = width * (1 + padding * 2)
    const paddedHeight = height * (1 + padding * 2)

    // Calculate aspect ratio for viewBox (use actual content proportions)
    const aspectRatio = paddedWidth / paddedHeight
    const svgWidth = 100
    const svgHeight = 100 / aspectRatio

    // Normalize to SVG coordinates (flip Y for proper orientation)
    const normalize = (lng: number, lat: number): [number, number] => {
      const x = ((lng - minX + width * padding) / paddedWidth) * svgWidth
      const y = ((maxY - lat + height * padding) / paddedHeight) * svgHeight
      return [x, y]
    }

    const centers: Record<string, [number, number]> = {}

    const normalized = pastures.map(p => {
      const coords = (p.geometry.geometry as GeoJSON.Polygon).coordinates[0]
      const normalizedCoords = coords.map(([lng, lat]) => normalize(lng, lat))

      // Calculate center
      const centerX = normalizedCoords.reduce((sum, [x]) => sum + x, 0) / normalizedCoords.length
      const centerY = normalizedCoords.reduce((sum, [, y]) => sum + y, 0) / normalizedCoords.length
      centers[p.id] = [centerX, centerY]

      return {
        ...p,
        svgPath: `M ${normalizedCoords.map(([x, y]) => `${x},${y}`).join(' L ')} Z`,
      }
    })

    // Generate focus pasture path separately for paddock view
    let focusPath = ''
    if (paddockViewMode && focusPasture) {
      const coords = (focusPasture.geometry.geometry as GeoJSON.Polygon).coordinates[0]
      const normalizedCoords = coords.map(([lng, lat]) => normalize(lng, lat))
      focusPath = `M ${normalizedCoords.map(([x, y]) => `${x},${y}`).join(' L ')} Z`
    }

    return {
      normalizedPastures: normalized,
      viewBox: `0 0 ${svgWidth} ${svgHeight}`,
      pastureCenters: centers,
      normalizeFn: normalize,
      focusPasturePath: focusPath,
      svgWidth,
      svgHeight,
    }
  }, [paddockViewMode, focusPasture])

  // Normalize paddock geometry to SVG path
  const normalizePaddock = useMemo(() => {
    return (pdk: Paddock): string => {
      const coords = pdk.geometry.geometry.coordinates[0]
      const normalizedCoords = coords.map(([lng, lat]) => normalizeFn(lng, lat))
      return `M ${normalizedCoords.map(([x, y]) => `${x},${y}`).join(' L ')} Z`
    }
  }, [normalizeFn])

  // Normalize alternative paddock geometry to SVG path
  const normalizeAlternative = useMemo(() => {
    return (alt: PaddockAlternative): string => {
      const coords = alt.geometry.geometry.coordinates[0]
      const normalizedCoords = coords.map(([lng, lat]) => normalizeFn(lng, lat))
      return `M ${normalizedCoords.map(([x, y]) => `${x},${y}`).join(' L ')} Z`
    }
  }, [normalizeFn])

  // Calculate center of a paddock for labeling
  const getPaddockCenter = useMemo(() => {
    return (pdk: Paddock): [number, number] => {
      const coords = pdk.geometry.geometry.coordinates[0]
      const normalizedCoords = coords.map(([lng, lat]) => normalizeFn(lng, lat))
      const centerX = normalizedCoords.reduce((sum, [x]) => sum + x, 0) / normalizedCoords.length
      const centerY = normalizedCoords.reduce((sum, [, y]) => sum + y, 0) / normalizedCoords.length
      return [centerX, centerY]
    }
  }, [normalizeFn])

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
    full: 'w-full aspect-[3/2]',
  }

  const currentPasture = currentPastureId ? getPastureById(currentPastureId) : undefined
  const targetPasture = targetPastureId ? getPastureById(targetPastureId) : undefined

  // Arrow path calculation (only for pasture transitions)
  const arrowPath = useMemo(() => {
    if (!currentPastureId || !targetPastureId || currentPastureId === targetPastureId) return null
    const from = pastureCenters[currentPastureId]
    const to = pastureCenters[targetPastureId]
    if (!from || !to) return null

    // Calculate direction and shorten the line
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const len = Math.sqrt(dx * dx + dy * dy)
    const unitX = dx / len
    const unitY = dy / len

    // Start 8% from current center, end 12% from target center
    const startX = from[0] + unitX * 8
    const startY = from[1] + unitY * 8
    const endX = to[0] - unitX * 10
    const endY = to[1] - unitY * 10

    return { startX, startY, endX, endY, unitX, unitY }
  }, [currentPastureId, targetPastureId, pastureCenters])

  // Get yesterday's paddock (most recent in previousPaddocks)
  const yesterdayPaddock = previousPaddocks.length > 0
    ? previousPaddocks[previousPaddocks.length - 1]
    : null
  const olderPaddocks = previousPaddocks.slice(0, -1)

  return (
    <div className={cn('relative border border-border rounded-md overflow-hidden', sizeClasses[size], className)}>
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Full background fill */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#f5f5f5" className="dark:fill-zinc-800" />
        {/* Define markers, filters, and clip path */}
        <defs>
          {/* Clip path to contain content within viewBox */}
          <clipPath id="viewbox-clip">
            <rect x="0" y="0" width={svgWidth} height={svgHeight} />
          </clipPath>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="6"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
          </marker>
          <marker
            id="arrowhead-dark"
            markerWidth="8"
            markerHeight="6"
            refX="6"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#4ade80" />
          </marker>
          {/* Glow filter for target */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Hatching pattern for current paddock */}
          <pattern id="paddock-hatch" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#22c55e" strokeWidth="1" />
          </pattern>
          {/* Pattern for yesterday's paddock */}
          <pattern id="yesterday-hatch" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#f59e0b" strokeWidth="0.8" opacity="0.7" />
          </pattern>
          {/* Pattern for older grazed paddocks */}
          <pattern id="grazed-hatch" patternUnits="userSpaceOnUse" width="3" height="3">
            <path d="M-1,1 l2,-2 M0,3 l3,-3 M2,4 l2,-2" stroke="#6b7280" strokeWidth="0.5" opacity="0.5" />
          </pattern>
          {/* Pattern for alternative paddocks */}
          <pattern id="alt-hatch" patternUnits="userSpaceOnUse" width="5" height="5">
            <path d="M0,5 l5,-5 M-2,2 l4,-4 M3,7 l4,-4" stroke="#3b82f6" strokeWidth="0.8" opacity="0.5" />
          </pattern>
        </defs>

        {/* Paddock View Mode: Focus on just the current pasture */}
        {paddockViewMode && focusPasture ? (
          <g clipPath="url(#viewbox-clip)">
            {/* Pasture outline (background) */}
            <path
              d={focusPasturePath}
              fill="#f5f5f5"
              stroke="#d4d4d4"
              strokeWidth="1"
              className="dark:fill-zinc-800 dark:stroke-zinc-600"
            />

            {/* Ungrazed area indicator (remaining pasture) */}
            <path
              d={focusPasturePath}
              fill="none"
              stroke="#a3a3a3"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              className="dark:stroke-zinc-500"
            />

            {/* Older grazed paddocks (before yesterday) */}
            {olderPaddocks.map((prevPaddock, index) => (
              <path
                key={prevPaddock.id || `older-${index}`}
                d={normalizePaddock(prevPaddock)}
                fill="#9ca3af"
                fillOpacity="0.3"
                stroke="#6b7280"
                strokeWidth="0.5"
                className="transition-all duration-300"
              />
            ))}

            {/* Yesterday's paddock - highlighted distinctly */}
            {yesterdayPaddock && (
              <g>
                <path
                  d={normalizePaddock(yesterdayPaddock)}
                  fill="#f59e0b"
                  fillOpacity="0.35"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  className="transition-all duration-300"
                />
                <path
                  d={normalizePaddock(yesterdayPaddock)}
                  fill="url(#yesterday-hatch)"
                  fillOpacity="0.4"
                  stroke="none"
                />
              </g>
            )}

            {/* Alternative paddocks (shown when expanded) */}
            {paddockAlternatives.map((alt) => (
              <g key={alt.id} className={selectedAlternativeId === alt.id ? "" : "opacity-60"}>
                <path
                  d={normalizeAlternative(alt)}
                  fill={selectedAlternativeId === alt.id ? "#3b82f6" : "#93c5fd"}
                  fillOpacity={selectedAlternativeId === alt.id ? 0.5 : 0.25}
                  stroke={selectedAlternativeId === alt.id ? "#3b82f6" : "#60a5fa"}
                  strokeWidth={selectedAlternativeId === alt.id ? 1.5 : 1}
                  strokeDasharray={selectedAlternativeId === alt.id ? "none" : "3,2"}
                  className="transition-all duration-300"
                />
                {selectedAlternativeId === alt.id && (
                  <path
                    d={normalizeAlternative(alt)}
                    fill="url(#alt-hatch)"
                    fillOpacity="0.3"
                    stroke="none"
                  />
                )}
              </g>
            ))}

            {/* Today's paddock - prominently highlighted (only if no alternative selected) */}
            {paddock && !selectedAlternativeId && (
              <g className="animate-pulse">
                <path
                  d={normalizePaddock(paddock)}
                  fill="#22c55e"
                  fillOpacity="0.5"
                  stroke="#22c55e"
                  strokeWidth="2"
                  filter="url(#glow)"
                  className="transition-all duration-300"
                />
                <path
                  d={normalizePaddock(paddock)}
                  fill="url(#paddock-hatch)"
                  fillOpacity="0.3"
                  stroke="none"
                />
              </g>
            )}

            {/* Movement arrow from yesterday to today */}
            {yesterdayPaddock && paddock && (() => {
              const [fromX, fromY] = getPaddockCenter(yesterdayPaddock)
              const [toX, toY] = getPaddockCenter(paddock)
              const dx = toX - fromX
              const dy = toY - fromY
              const len = Math.sqrt(dx * dx + dy * dy)
              if (len < 5) return null // Too close, skip arrow
              const unitX = dx / len
              const unitY = dy / len
              return (
                <g className="animate-pulse">
                  <line
                    x1={fromX + unitX * 5}
                    y1={fromY + unitY * 5}
                    x2={toX - unitX * 5}
                    y2={toY - unitY * 5}
                    stroke="#22c55e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                    opacity="0.8"
                  />
                </g>
              )
            })()}

          </g>
        ) : (
          <>
            {/* Full Farm View: Render all pastures */}
            {normalizedPastures.map(p => {
              const isTarget = p.id === targetPastureId
              const isCurrent = p.id === currentPastureId
              const isHighlighted = p.id === highlightedPastureId

              return (
                <g key={p.id}>
                  <path
                    d={p.svgPath}
                    fill={isTarget ? statusColors[p.status] : statusColorsLight[p.status]}
                    stroke={isTarget || isCurrent || isHighlighted ? '#fff' : statusColors[p.status]}
                    strokeWidth={isTarget || isCurrent ? 1.5 : 0.5}
                    opacity={isTarget || isCurrent ? 1 : 0.7}
                    filter={isTarget ? 'url(#glow)' : undefined}
                    className="transition-all duration-300"
                  />
                  {/* Labels */}
                  {showLabels && (
                    <text
                      x={pastureCenters[p.id][0]}
                      y={pastureCenters[p.id][1]}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground text-[4px] font-medium pointer-events-none"
                    >
                      {p.name.split(' ')[0]}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Movement arrow (only for pasture transitions) */}
            {arrowPath && (
              <g className="animate-pulse">
                <line
                  x1={arrowPath.startX}
                  y1={arrowPath.startY}
                  x2={arrowPath.endX}
                  y2={arrowPath.endY}
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead)"
                  className="stroke-olive"
                />
              </g>
            )}

            {/* Current position marker (livestock icon) */}
            {currentPastureId && pastureCenters[currentPastureId] && (
              <g transform={`translate(${pastureCenters[currentPastureId][0]}, ${pastureCenters[currentPastureId][1]})`}>
                <circle r="5" fill="#1f2937" stroke="#fff" strokeWidth="1" className="dark:fill-zinc-800" />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[6px] fill-white select-none"
                  style={{ fontSize: '6px' }}
                >
                  H
                </text>
              </g>
            )}

            {/* Target marker (only for pasture transitions) */}
            {targetPastureId && currentPastureId !== targetPastureId && pastureCenters[targetPastureId] && (
              <g transform={`translate(${pastureCenters[targetPastureId][0]}, ${pastureCenters[targetPastureId][1]})`}>
                <circle r="4" fill="none" stroke="#22c55e" strokeWidth="1.5" className="animate-ping opacity-75" />
                <circle r="3" fill="#22c55e" stroke="#fff" strokeWidth="0.5" />
              </g>
            )}
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-3 text-[10px] text-muted-foreground">
        {paddockViewMode ? (
          <>
            {!selectedAlternativeId && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-olive/50 border border-olive" />
                Today
              </span>
            )}
            {selectedAlternativeId && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-cobalt/50 border border-cobalt" />
                Selected
              </span>
            )}
            {yesterdayPaddock && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-terracotta/35 border border-terracotta" />
                Yesterday
              </span>
            )}
            {paddockAlternatives.length > 0 && !selectedAlternativeId && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-cobalt-muted/25 border border-cobalt-muted border-dashed" />
                Options
              </span>
            )}
          </>
        ) : (
          <>
            {currentPasture && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-zinc-700 dark:bg-zinc-600" />
                Now
              </span>
            )}
            {targetPasture && currentPastureId !== targetPastureId && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-olive" />
                Next
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
