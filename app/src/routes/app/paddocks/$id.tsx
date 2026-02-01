import { createFileRoute } from '@tanstack/react-router'
import { getObservationsForPaddock, getLatestObservation, calculateNdviTrend } from '@/data/mock/observations'
import { getGrazingHistoryForPaddock, getPaddockStaysForPaddock } from '@/data/mock/grazingHistory'
import { 
  PaddockHeader, 
  PaddockMapDetail, 
  NDVIChart, 
  GrazingHistoryTable,
  ObservationTable,
  SectionHistory,
} from '@/components/paddock'
import { ErrorState } from '@/components/ui/error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, Timer, Grid3X3 } from 'lucide-react'
import { useGeometry } from '@/lib/geometry'

export const Route = createFileRoute('/app/paddocks/$id')({
  component: PaddockDetailPage,
})

function PaddockDetailPage() {
  const { id } = Route.useParams()
  const { getPaddockById } = useGeometry()
  
  const paddock = getPaddockById(id)
  
  if (!paddock) {
    return (
      <div className="p-6">
        <ErrorState
          title="Paddock Not Found"
          message={`No paddock exists with ID "${id}". It may have been removed or the link is incorrect.`}
        />
      </div>
    )
  }

  const observations = getObservationsForPaddock(id)
  const latestObservation = getLatestObservation(id)
  const ndviTrend = calculateNdviTrend(id)
  const grazingHistory = getGrazingHistoryForPaddock(id)
  const paddockStays = getPaddockStaysForPaddock(id)
  
  // Calculate average sections per stay
  const avgSectionsPerStay = paddockStays.length > 0
    ? paddockStays.reduce((sum, stay) => sum + stay.sections.length, 0) / paddockStays.length
    : 0

  return (
    <div className="p-6 space-y-6">
      <PaddockHeader paddock={paddock} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Map and quick stats */}
        <div className="space-y-6">
          <PaddockMapDetail paddock={paddock} />
          
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
                <span className="font-medium">{paddock.restDays} days</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Droplets className="h-4 w-4" />
                  <span>Water Access</span>
                </div>
                <span className="font-medium">{paddock.waterAccess}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Grazed</span>
                <span className="font-medium">{paddock.lastGrazed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Rotations</span>
                <span className="font-medium">{paddockStays.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Grid3X3 className="h-4 w-4" />
                  <span>Avg Sections/Rotation</span>
                </div>
                <span className="font-medium">{avgSectionsPerStay.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Section History */}
          <SectionHistory stays={paddockStays} />
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
