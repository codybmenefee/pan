import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { useTutorial } from './useTutorial'
import { TutorialProgress } from './TutorialProgress'
import { PhilosophyStep } from './steps/PhilosophyStep'
import { SatelliteStep } from './steps/SatelliteStep'
import { StatusStep } from './steps/StatusStep'
import { BriefStep } from './steps/BriefStep'
import { PaddocksStep } from './steps/PaddocksStep'
import { cn } from '@/lib/utils'

const isDevMode = import.meta.env.VITE_DEV_AUTH === 'true'

interface TutorialOverlayProps {
  onComplete?: () => void
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const {
    isActive,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    goToStep,
  } = useTutorial()

  const handleComplete = () => {
    completeTutorial()
    onComplete?.()
  }

  const handleSkip = () => {
    skipTutorial()
    onComplete?.()
  }

  // Dev mode keyboard shortcuts
  useEffect(() => {
    if (!isDevMode || !isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys to navigate
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (currentStep < totalSteps - 1) nextStep()
        else handleComplete()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevStep()
      }
      // Number keys 1-5 to jump to step
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        goToStep(parseInt(e.key) - 1)
      }
      // 'S' to skip entirely
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        handleSkip()
      }
      // 'E' to jump to end (last step)
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        goToStep(totalSteps - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, currentStep, totalSteps, nextStep, prevStep, goToStep, handleComplete, handleSkip])

  const steps = [
    <PhilosophyStep key="philosophy" />,
    <SatelliteStep key="satellite" />,
    <StatusStep key="status" />,
    <BriefStep key="brief" />,
    <PaddocksStep key="paddocks" isActive={currentStep === 4} />,
  ]

  return (
    <Dialog open={isActive} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent
        className="sm:max-w-[560px] p-8 gap-0"
        showCloseButton={false}
      >
        {/* Step content with transition */}
        <div className="relative min-h-[420px]">
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                'transition-all duration-200',
                index === currentStep
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 absolute inset-0 pointer-events-none',
                index < currentStep ? '-translate-y-4' : 'translate-y-4'
              )}
            >
              {step}
            </div>
          ))}
        </div>

        {/* Progress and navigation */}
        <TutorialProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrev={prevStep}
          onNext={nextStep}
          onSkip={handleSkip}
          onComplete={handleComplete}
        />

        {/* Dev mode shortcuts hint */}
        {isDevMode && (
          <div className="mt-3 text-center text-[10px] text-muted-foreground/50">
            Dev: ←→ navigate • 1-5 jump • S skip • E end
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
