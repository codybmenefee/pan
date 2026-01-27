import { createContext, useContext } from 'react'

export interface TutorialState {
  isActive: boolean
  currentStep: number
  totalSteps: number
  hasCompleted: boolean
}

export interface TutorialContextValue extends TutorialState {
  startTutorial: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  skipTutorial: () => void
  completeTutorial: () => void
  resetTutorial: () => void
}

export const TutorialContext = createContext<TutorialContextValue | null>(null)

export function useTutorial(): TutorialContextValue {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}

const STORAGE_KEY = 'grazing-tutorial-completed'

export function getTutorialCompleted(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setTutorialCompleted(completed: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, String(completed))
}
