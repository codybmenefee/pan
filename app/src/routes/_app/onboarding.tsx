import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useOrganizationList } from '@clerk/clerk-react'
import { useAction, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  OnboardingContainer,
  WelcomeStep,
  FarmSetupForm,
} from '@/components/onboarding'
import { useAppAuth } from '@/lib/auth'

export const Route = createFileRoute('/_app/onboarding')({
  component: OnboardingPage,
})

const steps = ['Welcome', 'Farm Setup']

interface FarmData {
  name: string
  location: string
  area: string
}

function OnboardingPage() {
  const { isDevAuth, organizationId } = useAppAuth()

  if (isDevAuth) {
    return <DevOnboarding organizationId={organizationId} />
  }

  return <ClerkOnboarding />
}

// Dev mode onboarding - doesn't use Clerk hooks
function DevOnboarding({ organizationId }: { organizationId: string | null }) {
  const navigate = useNavigate()
  const geocodeAddress = useAction(api.geocoding.geocodeAddress)
  const setupFarm = useMutation(api.organizations.setupFarmFromOnboarding)

  const [currentStep, setCurrentStep] = useState(0)
  const [farmData, setFarmData] = useState<FarmData>({
    name: '',
    location: '',
    area: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const handleFarmSetup = async (data: FarmData) => {
    setFarmData(data)
    setError(null)
    setIsSubmitting(true)

    if (!organizationId) {
      setError('No organization found in dev mode.')
      setIsSubmitting(false)
      return
    }

    try {
      const geocodeResult = await geocodeAddress({ address: data.location.trim() })

      if (!geocodeResult.success || !geocodeResult.coordinates) {
        setError(geocodeResult.error ?? 'Failed to find address location.')
        setIsSubmitting(false)
        return
      }

      const paddockSize = data.area ? Math.min(parseFloat(data.area), 50) : 10
      await setupFarm({
        orgId: organizationId,
        name: data.name.trim(),
        location: data.location.trim(),
        coordinates: geocodeResult.coordinates,
        totalArea: paddockSize,
      })

      navigate({ to: '/', search: { onboarded: 'true', editBoundary: 'true' } })
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during setup')
      setIsSubmitting(false)
    }
  }

  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <WelcomeStep onNext={handleNext} />
      </div>
    )
  }

  return (
    <OnboardingContainer steps={steps.slice(1)} currentStep={currentStep - 1}>
      <FarmSetupForm
        onComplete={handleFarmSetup}
        onBack={handleBack}
        initialData={farmData}
        isSubmitting={isSubmitting}
        error={error}
      />
    </OnboardingContainer>
  )
}

// Production mode onboarding - uses Clerk hooks
// Only rendered when ClerkProvider is available (isDevAuth === false)
function ClerkOnboarding() {
  const { createOrganization, setActive } = useOrganizationList()

  const navigate = useNavigate()
  const geocodeAddress = useAction(api.geocoding.geocodeAddress)
  const createFarmFromOrg = useMutation(api.organizations.createFarmFromOrg)

  const [currentStep, setCurrentStep] = useState(0)
  const [farmData, setFarmData] = useState<FarmData>({
    name: '',
    location: '',
    area: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const handleFarmSetup = async (data: FarmData) => {
    setFarmData(data)
    setError(null)
    setIsSubmitting(true)

    try {
      // Step 1: Geocode the address
      const geocodeResult = await geocodeAddress({ address: data.location.trim() })

      if (!geocodeResult.success || !geocodeResult.coordinates) {
        setError(geocodeResult.error ?? 'Failed to find address location.')
        setIsSubmitting(false)
        return
      }

      // Step 2: Create new Clerk organization
      if (!createOrganization) {
        setError('Organization creation not available. Please refresh and try again.')
        setIsSubmitting(false)
        return
      }

      const org = await createOrganization({ name: data.name.trim() })

      // Step 3: Create the farm in Convex (blank farm with paddockCount: 0)
      await createFarmFromOrg({
        clerkOrgId: org.id,
        name: data.name.trim(),
        location: geocodeResult.formattedAddress ?? data.location.trim(),
        coordinates: geocodeResult.coordinates,
      })

      // Step 4: Set the new organization as active
      if (setActive) {
        await setActive({ organization: org.id })
      }

      // Step 5: Navigate to map with boundary drawing flow
      navigate({ to: '/', search: { onboarded: 'true', editBoundary: 'true' } })
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during setup')
      setIsSubmitting(false)
    }
  }

  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <WelcomeStep onNext={handleNext} />
      </div>
    )
  }

  return (
    <OnboardingContainer steps={steps.slice(1)} currentStep={currentStep - 1}>
      <FarmSetupForm
        onComplete={handleFarmSetup}
        onBack={handleBack}
        initialData={farmData}
        isSubmitting={isSubmitting}
        error={error}
      />
    </OnboardingContainer>
  )
}
