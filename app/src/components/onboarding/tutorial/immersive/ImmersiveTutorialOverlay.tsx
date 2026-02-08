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

const stepMeta = [
  { title: '-- intro', component: <HookStep key="hook" /> },
  { title: '-- the-gap', component: <GapStep key="gap" /> },
  { title: '-- evolution', component: <EvolutionStep key="evolution" /> },
  { title: '-- bottleneck', component: <BottleneckStep key="bottleneck" /> },
  { title: '-- unlock', component: <UnlockStep key="unlock" /> },
  { title: '-- morning-brief', component: <MorningBriefStep key="morning-brief" /> },
  { title: '-- pasture-health', component: <PastureHealthStep key="pasture-health" /> },
  { title: '-- decision', component: <DecisionStep key="decision" /> },
  { title: '-- tracking', component: <TrackingStep key="tracking" /> },
  { title: '-- meet-farm', component: <MeetFarmStep key="meet-farm" /> },
  { title: '-- your-turn', component: <YourTurnStep key="your-turn" /> },
]

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

  return (
    <>
      {/* Background overlay */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: `rgba(26, 30, 24, ${overlayOpacity})` }}
      />

      {/* Content container */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center px-6 pb-32 pt-12 overflow-y-auto">
        {/* Step content with transition */}
        <div className="relative w-full max-w-4xl my-auto">
          {stepMeta.map((step, index) => (
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
              {/* Browser-style card */}
              <div className="border-3 border-dark shadow-[6px_6px_0_var(--olive)]" style={{ borderWidth: '3px' }}>
                {/* Title bar */}
                <div className="flex items-center gap-1.5 px-3.5 py-2 border-b-2 border-dark bg-dark">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#d45a5a' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#d4a84a' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#5aaa5a' }} />
                  <span className="text-xs text-white/60 ml-2 font-mono">openpasture {step.title}</span>
                </div>
                {/* Content body */}
                <div className="bg-cream p-6 md:p-8">
                  {step.component}
                </div>
              </div>
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
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[63] text-center text-[10px] text-dark/30">
          Dev: arrow keys navigate | 0-9 jump | S skip | E end
        </div>
      )}
    </>
  )
}
