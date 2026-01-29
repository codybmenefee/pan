import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'
import type { Paddock } from '@/lib/types'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'

interface PaddockHeaderProps {
  paddock: Paddock
  onEdit?: () => void
}

const statusLabels: Record<Paddock['status'], string> = {
  ready: 'Ready to Graze',
  almost_ready: 'Almost Ready',
  recovering: 'Recovering',
  grazed: 'Recently Grazed',
}

const statusColors: Record<Paddock['status'], string> = {
  ready: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  almost_ready: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  recovering: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  grazed: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
}

export function PaddockHeader({ paddock, onEdit }: PaddockHeaderProps) {
  const { convert, unitName } = useAreaUnit()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/map">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to map</span>
          </Link>
        </Button>
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{paddock.name}</h1>
            <Badge 
              variant="outline" 
              className={statusColors[paddock.status]}
            >
              {statusLabels[paddock.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {convert(paddock.area).toFixed(1)} {unitName}
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
