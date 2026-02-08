import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getWeekLabels, type ExtendedRotationEntry } from '@/data/mock/analytics'
import { Link } from '@tanstack/react-router'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RotationHeatmapProps {
  data: ExtendedRotationEntry[]
  title?: string
  showPaddockCounts?: boolean
}

export function RotationHeatmap({
  data,
  title = 'Pasture Rotation Heatmap',
  showPaddockCounts = true,
}: RotationHeatmapProps) {
  const weekLabels = getWeekLabels()

  // Get color intensity based on paddock count
  const getPaddockColor = (count: number): string => {
    if (count === 0) return 'bg-muted'
    if (count <= 2) return 'bg-olive/30'
    if (count <= 4) return 'bg-olive/50'
    if (count <= 6) return 'bg-olive/70'
    return 'bg-olive'
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-medium py-2 pr-4">Pasture</th>
                {weekLabels.map((label, i) => (
                  <th key={i} className="text-center font-medium py-2 px-2 min-w-[50px]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.pastureId} className="border-t border-border">
                  <td className="py-2 pr-4">
                    <Link
                      to="/app/pastures/$id"
                      params={{ id: row.pastureId }}
                      className="hover:underline"
                    >
                      {row.pastureName}
                    </Link>
                  </td>
                  {row.weeklyData.map((grazed, i) => {
                    const paddockCount = row.paddockCounts?.[i] || 0

                    return (
                      <td key={i} className="text-center py-2 px-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                'mx-auto h-6 w-6 rounded flex items-center justify-center transition-colors',
                                showPaddockCounts
                                  ? getPaddockColor(paddockCount)
                                  : grazed ? 'bg-olive' : 'bg-muted'
                              )}>
                                {showPaddockCounts && paddockCount > 0 && (
                                  <span className="text-[10px] font-semibold text-white">
                                    {paddockCount}
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {grazed
                                ? `${paddockCount} paddock${paddockCount !== 1 ? 's' : ''} grazed`
                                : 'Resting'
                              }
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          {showPaddockCounts ? (
            <>
              <span className="font-medium">Paddocks per week:</span>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-muted" />
                <span>0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-olive/30" />
                <span>1-2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-olive/50" />
                <span>3-4</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-olive/70" />
                <span>5-6</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-olive" />
                <span>7+</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-olive" />
                <span>Grazed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-muted" />
                <span>Resting</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
