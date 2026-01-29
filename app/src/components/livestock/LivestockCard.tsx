import { useState } from 'react'
import { Beef, Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LivestockDrawer } from './LivestockDrawer'
import { useLivestock } from '@/lib/convex/useLivestock'
import { formatAU, formatDailyConsumption } from '@/lib/animalUnits'

export function LivestockCard() {
  const { summary, isLoading } = useLivestock()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Beef className="h-4 w-4" />
            Livestock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasLivestock = summary && (summary.cows > 0 || summary.sheep > 0 || summary.calves > 0 || summary.lambs > 0)

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Beef className="h-4 w-4" />
              Livestock
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setDrawerOpen(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasLivestock ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              <p>No livestock configured</p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-1"
                onClick={() => setDrawerOpen(true)}
              >
                Add livestock
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Cattle */}
              {(summary.cows > 0 || summary.calves > 0) && (
                <div className="flex items-center justify-between text-sm">
                  <span>Cattle</span>
                  <span className="text-muted-foreground">
                    {summary.cows > 0 && `${summary.cows} cows`}
                    {summary.cows > 0 && summary.calves > 0 && ', '}
                    {summary.calves > 0 && `${summary.calves} calves`}
                  </span>
                </div>
              )}

              {/* Sheep */}
              {(summary.sheep > 0 || summary.lambs > 0) && (
                <div className="flex items-center justify-between text-sm">
                  <span>Sheep</span>
                  <span className="text-muted-foreground">
                    {summary.sheep > 0 && `${summary.sheep} ewes`}
                    {summary.sheep > 0 && summary.lambs > 0 && ', '}
                    {summary.lambs > 0 && `${summary.lambs} lambs`}
                  </span>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-2 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {formatAU(summary.totalAnimalUnits)} AU
                </span>
                <span className="text-muted-foreground">
                  {formatDailyConsumption(summary.dailyConsumptionKg)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LivestockDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
