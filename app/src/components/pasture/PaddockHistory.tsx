import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PastureStay } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface PaddockHistoryProps {
  stays: PastureStay[]
  title?: string
}

export function PaddockHistory({ stays, title = 'Rotation History' }: PaddockHistoryProps) {
  const { format } = useAreaUnit()

  if (stays.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No rotation history for this pasture yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stays.map((stay) => {
          const isOngoing = !stay.exitDate
          const duration = stay.exitDate
            ? Math.ceil((new Date(stay.exitDate).getTime() - new Date(stay.entryDate).getTime()) / (1000 * 60 * 60 * 24))
            : stay.paddocks.length

          return (
            <div
              key={stay.id}
              className={cn(
                'border-l-2 pl-4 py-2',
                isOngoing ? 'border-olive' : 'border-muted-foreground/30'
              )}
            >
              {/* Stay header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium">
                    {formatDate(stay.entryDate)}
                    {stay.exitDate && ` - ${formatDate(stay.exitDate)}`}
                  </span>
                  {isOngoing && (
                    <span className="ml-2 text-xs bg-olive/20 text-olive px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {duration} day{duration !== 1 ? 's' : ''} - {format(stay.totalArea)}
                </span>
              </div>

              {/* Paddock timeline */}
              <div className="flex gap-1 mt-2">
                {stay.paddocks.map((paddock, paddockIndex) => {
                  const isCurrentPaddock = isOngoing && paddockIndex === stay.paddocks.length - 1
                  return (
                    <div
                      key={paddock.id}
                      className={cn(
                        'flex-1 h-2 rounded-sm transition-all',
                        isCurrentPaddock
                          ? 'bg-olive animate-pulse'
                          : 'bg-muted-foreground/40'
                      )}
                      title={`Day ${paddockIndex + 1}: ${format(paddock.targetArea)}`}
                    />
                  )
                })}
                {/* Show remaining days if ongoing */}
                {isOngoing && Array.from({ length: 4 - stay.paddocks.length }).map((_, i) => (
                  <div
                    key={`planned-${i}`}
                    className="flex-1 h-2 rounded-sm border border-dashed border-muted-foreground/30"
                    title="Planned"
                  />
                ))}
              </div>

              {/* Paddock details */}
              <div className="mt-2 text-xs text-muted-foreground">
                {stay.paddocks.length} paddock{stay.paddocks.length !== 1 ? 's' : ''} grazed
                {stay.paddocks.length > 0 && (
                  <span className="ml-2">
                    (avg {format(stay.totalArea / stay.paddocks.length)}/paddock)
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
