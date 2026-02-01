import { ChevronLeft } from 'lucide-react'
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
              'w-2 h-2 rounded-full transition-all duration-300',
              index === currentStep
                ? 'w-6 bg-white'
                : index < currentStep
                  ? 'bg-white/60'
                  : 'bg-white/30'
            )}
          />
        ))}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className={cn(
            'text-white/70 hover:text-white hover:bg-white/10',
            phase === 'complete' && 'invisible'
          )}
        >
          Skip
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrev}
            disabled={isFirstStep}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            onClick={isLastStep ? onComplete : onNext}
            className={cn(
              'min-w-[100px]',
              isLastStep
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white text-gray-900 hover:bg-white/90'
            )}
          >
            {isLastStep ? "Let's Go" : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
