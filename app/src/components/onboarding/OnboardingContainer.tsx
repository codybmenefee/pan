import type { ReactNode } from 'react'

interface OnboardingContainerProps {
  steps: string[]
  currentStep: number
  children: ReactNode
}

export function OnboardingContainer({
  steps: _steps,
  currentStep: _currentStep,
  children
}: OnboardingContainerProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  )
}
