import { createFileRoute } from '@tanstack/react-router'
import { getObservationsForPasture, getLatestObservation, calculateNdviTrend } from '@/data/mock/observations'
import { getGrazingHistoryForPasture, getPastureStaysForPasture } from '@/data/mock/grazingHistory'
import {
  PastureHeader,
  PastureMapDetail,
  NDVIChart,
  GrazingHistoryTable,
  ObservationTable,
  PaddockHistory,
} from '@/components/pasture'
import { ErrorState } from '@/components/ui/error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, Timer, Grid3X3 } from 'lucide-react'
import { useGeometry } from '@/lib/geometry'

export const Route = createFileRoute('/app/pastures/$id')({
  component: PastureDetailPage,
})

function PastureDetailPage() {
  const { id } = Route.useParams()
  const { getPastureById } = useGeometry()

  const pasture = getPastureById(id)

  if (!pasture) {
    return (
      <div className="p-6">
        <ErrorState
          title="Pasture Not Found"
          message={`No pasture exists with ID "${id}". It may have been removed or the link is incorrect.`}
        />
      </div>
    )
  }

  const observations = getObservationsForPasture(id)
  const latestObservation = getLatestObservation(id)
  const ndviTrend = calculateNdviTrend(id)
  const grazingHistory = getGrazingHistoryForPasture(id)
  const pastureStays = getPastureStaysForPasture(id)

  // Calculate average paddocks per stay
  const avgPaddocksPerStay = pastureStays.length > 0
    ? pastureStays.reduce((sum, stay) => sum + stay.paddocks.length, 0) / pastureStays.length
    : 0

  return (
    <div className="p-6 space-y-6">
      <PastureHeader pasture={pasture} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Map and quick stats */}
        <div className="space-y-6">
          <PastureMapDetail pasture={pasture} />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>Rest Period</span>
                </div>
                <span className="font-medium">{pasture.restDays} days</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Droplets className="h-4 w-4" />
                  <span>Water Access</span>
                </div>
                <span className="font-medium">{pasture.waterAccess}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Grazed</span>
                <span className="font-medium">{pasture.lastGrazed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Rotations</span>
                <span className="font-medium">{pastureStays.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Grid3X3 className="h-4 w-4" />
                  <span>Avg Paddocks/Rotation</span>
                </div>
                <span className="font-medium">{avgPaddocksPerStay.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Paddock History */}
          <PaddockHistory stays={pastureStays} />
        </div>

        {/* Right column - Charts and tables */}
        <div className="lg:col-span-2 space-y-6">
          <NDVIChart observations={observations} />

          {latestObservation && (
            <ObservationTable
              observation={latestObservation}
              ndviTrend={ndviTrend}
              cloudCoverage={100 - latestObservation.cloudFreePct}
            />
          )}

          <GrazingHistoryTable events={grazingHistory} />
        </div>
      </div>
    </div>
  )
}
