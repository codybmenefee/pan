import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { TutorialContext, getTutorialCompleted, setTutorialCompleted } from './useTutorial'

const TOTAL_STEPS = 5

interface TutorialProviderProps {
  children: ReactNode
  autoStart?: boolean
}

export function TutorialProvider({ children, autoStart = false }: TutorialProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompleted, setHasCompleted] = useState(() => getTutorialCompleted())

  // Auto-start tutorial if requested and not completed
  useEffect(() => {
    if (autoStart && !hasCompleted) {
      setIsActive(true)
    }
  }, [autoStart, hasCompleted])

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
