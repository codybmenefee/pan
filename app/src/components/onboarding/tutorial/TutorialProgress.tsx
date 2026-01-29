import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TutorialProgressProps {
  currentStep: number
  totalSteps: number
  onPrev: () => void
  onNext: () => void
  onSkip: () => void
  onComplete: () => void
  className?: string
}

export function TutorialProgress({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSkip,
  onComplete,
  className,
}: TutorialProgressProps) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className={cn('flex items-center justify-between pt-6', className)}>
      {/* Skip link */}
      <button
        type="button"
        onClick={onSkip}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip tutorial
      </button>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-2 w-2 rounded-full transition-all duration-200',
              index === currentStep
                ? 'bg-primary w-6'
                : index < currentStep
                  ? 'bg-primary/60'
                  : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        {!isFirstStep && (
          <Button variant="ghost" size="sm" onClick={onPrev}>
            Back
          </Button>
        )}
        {isLastStep ? (
          <Button size="sm" onClick={onComplete}>
            Get Started
          </Button>
        ) : (
          <Button size="sm" onClick={onNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
