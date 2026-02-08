import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LowConfidenceWarningProps {
  cloudCover: number
  cloudCoverThreshold: number
  lastClearImage: string
  confidence: number
  onProceed?: () => void
  onWait?: () => void
  className?: string
}

export function LowConfidenceWarning({
  cloudCover,
  cloudCoverThreshold,
  lastClearImage,
  confidence,
  onProceed,
  onWait,
  className,
}: LowConfidenceWarningProps) {
  return (
    <Card className={cn('border-terracotta-muted/50 bg-terracotta/10', className)}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <AlertTriangle className="h-6 w-6 text-terracotta flex-shrink-0 mt-0.5" />

          <div className="flex-1">
            <h3 className="font-semibold text-terracotta mb-2">
              Limited Data Available
            </h3>

            <p className="text-sm text-terracotta/90 mb-3">
              Today's recommendation is based on partial data:
            </p>

            <ul className="text-sm text-terracotta/80 space-y-1 mb-4">
              <li>Cloud cover: {cloudCover}% (threshold: {cloudCoverThreshold}%)</li>
              <li>Last clear image: {lastClearImage}</li>
              <li>Confidence: {confidence}%</li>
            </ul>

            <p className="text-sm text-terracotta/90 mb-4">
              Recommendation may be less reliable than usual. Consider local conditions before approving.
            </p>

            <div className="flex gap-3">
              {onProceed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-terracotta text-terracotta hover:bg-terracotta/20"
                  onClick={onProceed}
                >
                  Proceed Anyway
                </Button>
              )}
              {onWait && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-terracotta hover:bg-terracotta/20"
                  onClick={onWait}
                >
                  Wait for Better Data
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
