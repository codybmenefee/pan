import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getWeekLabels, type ExtendedRotationEntry } from '@/data/mock/analytics'
import { Link } from '@tanstack/react-router'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RotationHeatmapProps {
  data: ExtendedRotationEntry[]
  title?: string
  showSectionCounts?: boolean
}

export function RotationHeatmap({ 
  data, 
  title = 'Paddock Rotation Heatmap',
  showSectionCounts = true,
}: RotationHeatmapProps) {
  const weekLabels = getWeekLabels()

  // Get color intensity based on section count
  const getSectionColor = (count: number): string => {
    if (count === 0) return 'bg-muted'
    if (count <= 2) return 'bg-green-300 dark:bg-green-800'
    if (count <= 4) return 'bg-green-500 dark:bg-green-600'
    if (count <= 6) return 'bg-green-600 dark:bg-green-500'
    return 'bg-green-700 dark:bg-green-400'
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
                <th className="text-left font-medium py-2 pr-4">Paddock</th>
                {weekLabels.map((label, i) => (
                  <th key={i} className="text-center font-medium py-2 px-2 min-w-[50px]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.paddockId} className="border-t border-border">
                  <td className="py-2 pr-4">
                    <Link
                      to="/app/paddocks/$id"
                      params={{ id: row.paddockId }}
                      className="hover:underline"
                    >
                      {row.paddockName}
                    </Link>
                  </td>
                  {row.weeklyData.map((grazed, i) => {
                    const sectionCount = row.sectionCounts?.[i] || 0
                    
                    return (
                      <td key={i} className="text-center py-2 px-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                'mx-auto h-6 w-6 rounded flex items-center justify-center transition-colors',
                                showSectionCounts 
                                  ? getSectionColor(sectionCount)
                                  : grazed ? 'bg-green-500 dark:bg-green-600' : 'bg-muted'
                              )}>
                                {showSectionCounts && sectionCount > 0 && (
                                  <span className="text-[10px] font-semibold text-white dark:text-gray-900">
                                    {sectionCount}
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {grazed 
                                ? `${sectionCount} section${sectionCount !== 1 ? 's' : ''} grazed`
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
          {showSectionCounts ? (
            <>
              <span className="font-medium">Sections per week:</span>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-muted" />
                <span>0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-green-300 dark:bg-green-800" />
                <span>1-2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-green-500 dark:bg-green-600" />
                <span>3-4</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-green-600 dark:bg-green-500" />
                <span>5-6</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-green-700 dark:bg-green-400" />
                <span>7+</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-green-500" />
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
