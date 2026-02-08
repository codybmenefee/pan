import { ChevronLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TutorialPhase } from './useRevealState'

interface ImmersiveTutorialProgressProps {
  currentStep: number
  totalSteps: number
  phase: TutorialPhase
  onPrev: () => void
  onNext: () => void
  onSkip: () => void
  onComplete: () => void
}

export function ImmersiveTutorialProgress({
  currentStep,
  totalSteps,
  phase,
  onPrev,
  onNext,
  onSkip,
  onComplete,
}: ImmersiveTutorialProgressProps) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[62] flex flex-col items-center gap-4">
      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-2 transition-all duration-300',
              index === currentStep
                ? 'w-6 bg-dark'
                : index < currentStep
                  ? 'w-2 bg-olive'
                  : 'w-2 bg-border'
            )}
          />
        ))}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSkip}
          className={cn(
            'text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1',
            phase === 'complete' && 'invisible'
          )}
        >
          Skip
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrev}
            disabled={isFirstStep}
            className="border-2 border-border text-foreground hover:bg-olive-light disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            onClick={isLastStep ? onComplete : onNext}
            className={cn(
              'min-w-[100px] border-2 border-dark font-bold uppercase tracking-wider text-xs shadow-[3px_3px_0_var(--dark)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--dark)] transition-all',
              isLastStep
                ? 'bg-olive hover:bg-olive-bright text-white'
                : 'bg-white text-dark hover:bg-olive-light'
            )}
          >
            {isLastStep ? (
              <>
                Let's Go
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </>
            ) : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
