import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { 
  OnboardingContainer,
  WelcomeStep,
  FarmSetupForm,
  PaddockDrawingTool,
  OnboardingComplete 
} from '@/components/onboarding'
import { useGeometry } from '@/lib/geometry'

export const Route = createFileRoute('/_app/onboarding')({
  component: OnboardingPage,
})

const steps = ['Welcome', 'Farm Setup', 'Paddocks', 'Complete']

interface FarmData {
  name: string
  location: string
  area: string
}

function OnboardingPage() {
  const { paddocks } = useGeometry()
  const [currentStep, setCurrentStep] = useState(0)
  const [farmData, setFarmData] = useState<FarmData>({
    name: '',
    location: '',
    area: '',
  })

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleFarmSetup = (data: FarmData) => {
    setFarmData(data)
    handleNext()
  }

  // Welcome step doesn't show in the step indicator
  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <WelcomeStep onNext={handleNext} />
      </div>
    )
  }

  return (
    <OnboardingContainer steps={steps.slice(1)} currentStep={currentStep - 1}>
      {currentStep === 1 && (
        <FarmSetupForm 
          onNext={handleFarmSetup}
          onBack={handleBack}
          initialData={farmData}
        />
      )}
      
      {currentStep === 2 && (
        <PaddockDrawingTool 
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      
      {currentStep === 3 && (
        <OnboardingComplete
          farmName={farmData.name || 'Clearview Farm'}
          location={farmData.location || '943 Riverview Ln, Columbia, TN 38401'}
          area={farmData.area || '450'}
          paddockCount={paddocks.length}
        />
      )}
    </OnboardingContainer>
  )
}
