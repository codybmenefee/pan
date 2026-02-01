import { useEffect } from 'react'
import { useTutorial } from '../useTutorial'
import { useBriefPanel } from '@/lib/brief'
import { useRevealState } from './useRevealState'
import { ImmersiveTutorialProgress } from './ImmersiveTutorialProgress'
import { HookStep } from './steps/HookStep'
import { GapStep } from './steps/GapStep'
import { EvolutionStep } from './steps/EvolutionStep'
import { BottleneckStep } from './steps/BottleneckStep'
import { UnlockStep } from './steps/UnlockStep'
import { MeetFarmStep } from './steps/MeetFarmStep'
import { MorningBriefStep } from './steps/MorningBriefStep'
import { PastureHealthStep } from './steps/PastureHealthStep'
import { DecisionStep } from './steps/DecisionStep'
import { TrackingStep } from './steps/TrackingStep'
import { YourTurnStep } from './steps/YourTurnStep'
import { cn } from '@/lib/utils'

const isDevMode = import.meta.env.VITE_DEV_AUTH === 'true'

export function ImmersiveTutorialOverlay() {
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
  const { setBriefOpen } = useBriefPanel()
  const { phase, overlayOpacity } = useRevealState(currentStep)

  const handleComplete = () => {
    completeTutorial()
    setTimeout(() => setBriefOpen(true), 500)
  }

  const handleSkip = () => {
    skipTutorial()
    setTimeout(() => setBriefOpen(true), 300)
  }

  // Dev mode keyboard shortcuts
  useEffect(() => {
    if (!isDevMode || !isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (currentStep < totalSteps - 1) nextStep()
        else handleComplete()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevStep()
      }
      // Number keys 0-9 to jump to steps
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        const step = parseInt(e.key)
        if (step < totalSteps) goToStep(step)
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
  }, [isActive, currentStep, totalSteps, nextStep, prevStep, goToStep])

  if (!isActive) return null

  const steps = [
    <HookStep key="hook" />,
    <GapStep key="gap" />,
    <EvolutionStep key="evolution" />,
    <BottleneckStep key="bottleneck" />,
    <UnlockStep key="unlock" />,
    <MeetFarmStep key="meet-farm" />,
    <MorningBriefStep key="morning-brief" />,
    <PastureHealthStep key="pasture-health" />,
    <DecisionStep key="decision" />,
    <TrackingStep key="tracking" />,
    <YourTurnStep key="your-turn" />,
  ]

  return (
    <>
      {/* Background overlay - fades based on phase */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />

      {/* Content container - pb-32 to avoid overlapping with navigation */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center px-8 pb-32 pt-16 overflow-y-auto">
        {/* Step content with transition */}
        <div className="relative w-full max-w-3xl my-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                'transition-all duration-300',
                index === currentStep
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 absolute inset-0 pointer-events-none',
                index < currentStep ? '-translate-y-8' : 'translate-y-8'
              )}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation controls */}
      <ImmersiveTutorialProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        phase={phase}
        onPrev={prevStep}
        onNext={nextStep}
        onSkip={handleSkip}
        onComplete={handleComplete}
      />

      {/* Dev mode shortcuts hint */}
      {isDevMode && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[63] text-center text-[10px] text-white/30">
          Dev: arrow keys navigate | 0-9 jump | S skip | E end
        </div>
      )}
    </>
  )
}
