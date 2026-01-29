import { Move, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface PaddockPositionStepProps {
  onComplete: () => void
}

export function PaddockPositionStep({ onComplete }: PaddockPositionStepProps) {
  return (
    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-30">
      <Card className="shadow-xl border-2 border-green-500/50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Move className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Position Your Paddock</span>
            {' · '}Drag to move, drag corners to resize
          </div>
          <Button onClick={onComplete} className="shrink-0 gap-1.5" size="sm">
            <Check className="h-3.5 w-3.5" />
            Done
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
