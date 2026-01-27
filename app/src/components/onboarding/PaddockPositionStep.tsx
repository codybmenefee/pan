import { Move, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PaddockPositionStepProps {
  onComplete: () => void
}

export function PaddockPositionStep({ onComplete }: PaddockPositionStepProps) {
  return (
    <div className="absolute top-4 right-4 z-30 w-80">
      <Card className="shadow-xl border-2 border-green-500/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Move className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            </div>
            Position Your Paddock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Drag and resize the paddock to match your grazing area.
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-medium">1.</span>
              <span>
                <strong>Move:</strong> Drag inside the paddock
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-medium">2.</span>
              <span>
                <strong>Resize:</strong> Drag the corner handles
              </span>
            </div>
          </div>

          <Button onClick={onComplete} className="w-full gap-2" size="sm">
            <Check className="h-4 w-4" />
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
