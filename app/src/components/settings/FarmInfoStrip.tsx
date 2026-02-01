import { useNavigate } from '@tanstack/react-router'
import { MapPin, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFarm } from '@/lib/convex/useFarm'
import { useFarmBoundary } from '@/lib/hooks/useFarmBoundary'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

export function FarmInfoStrip() {
  const navigate = useNavigate()
  const { farm } = useFarm()
  const { hasBoundary, boundaryArea } = useFarmBoundary()
  const { format } = useAreaUnit()

  const handleEditBoundary = () => {
    navigate({ to: '/app', search: { editBoundary: 'true' } })
  }

  if (!farm) return null

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg text-sm">
      <div className="flex items-center gap-4 flex-wrap">
        <span>
          <strong>{farm.name}</strong>
          {farm.location && <span className="text-muted-foreground"> • {farm.location}</span>}
        </span>
        {farm.totalArea && (
          <span className="text-muted-foreground">{format(farm.totalArea)}</span>
        )}
        <span className={`flex items-center gap-1 ${hasBoundary ? 'text-green-400' : 'text-amber-400'}`}>
          <MapPin className="h-3 w-3" />
          {hasBoundary ? (
            <span>Boundary set{boundaryArea ? ` (${format(boundaryArea)})` : ''}</span>
          ) : (
            <span>No boundary</span>
          )}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={handleEditBoundary}>
        <Pencil className="h-3 w-3 mr-1" />
        {hasBoundary ? 'Edit' : 'Draw'}
      </Button>
    </div>
  )
}
