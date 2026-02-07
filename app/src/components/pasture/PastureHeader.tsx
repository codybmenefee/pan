import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'
import type { Pasture } from '@/lib/types'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface PastureHeaderProps {
  pasture: Pasture
  onEdit?: () => void
}

const statusLabels: Record<Pasture['status'], string> = {
  ready: 'Ready to Graze',
  almost_ready: 'Almost Ready',
  recovering: 'Recovering',
  grazed: 'Recently Grazed',
}

const statusColors: Record<Pasture['status'], string> = {
  ready: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  almost_ready: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  recovering: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  grazed: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
}

export function PastureHeader({ pasture, onEdit }: PastureHeaderProps) {
  const { convert, unitName } = useAreaUnit()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/map">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to map</span>
          </Link>
        </Button>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{pasture.name}</h1>
            <Badge
              variant="outline"
              className={statusColors[pasture.status]}
            >
              {statusLabels[pasture.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {convert(pasture.area).toFixed(1)} {unitName}
          </p>
        </div>
      </div>

      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit Name
        </Button>
      )}
    </div>
  )
}
