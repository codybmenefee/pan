import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { TutorialContext, getTutorialCompleted, setTutorialCompleted } from './useTutorial'

const TOTAL_STEPS = 5

interface TutorialProviderProps {
  children: ReactNode
  autoStart?: boolean
  /** Force start tutorial every time, ignoring completion status (for demo mode) */
  forceStart?: boolean
}

export function TutorialProvider({ children, autoStart = false, forceStart = false }: TutorialProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompleted, setHasCompleted] = useState(() => getTutorialCompleted())
  const hasForceStarted = useRef(false)

  // Force start or auto-start tutorial
  useEffect(() => {
    if (forceStart && !hasForceStarted.current) {
      hasForceStarted.current = true
      setCurrentStep(0)
      setIsActive(true)
    } else if (autoStart && !hasCompleted) {
      setIsActive(true)
    }
  }, [autoStart, forceStart, hasCompleted])

  const startTutorial = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step)
    }
  }, [])

  const skipTutorial = useCallback(() => {
    setIsActive(false)
    setHasCompleted(true)
    setTutorialCompleted(true)
  }, [])

  const completeTutorial = useCallback(() => {
    setIsActive(false)
    setHasCompleted(true)
    setTutorialCompleted(true)
  }, [])

  const resetTutorial = useCallback(() => {
    setHasCompleted(false)
    setTutorialCompleted(false)
    setCurrentStep(0)
  }, [])

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: TOTAL_STEPS,
        hasCompleted,
        startTutorial,
        nextStep,
        prevStep,
        goToStep,
        skipTutorial,
        completeTutorial,
        resetTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}
