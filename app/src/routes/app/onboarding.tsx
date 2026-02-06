import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useOrganizationList } from '@clerk/clerk-react'
import { useAction, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  OnboardingContainer,
  WelcomeStep,
  FarmSetupForm,
  LivestockStep,
  GeoFenceStep,
} from '@/components/onboarding'
import type { LivestockData, GeoFenceData } from '@/components/onboarding'
import { useAppAuth } from '@/lib/auth'
import { useAnalytics } from '@/lib/analytics'

export const Route = createFileRoute('/app/onboarding')({
  component: OnboardingPage,
})

const steps = ['Welcome', 'Farm Setup', 'Livestock', 'Virtual Fence']
const isDevMode = import.meta.env.VITE_DEV_AUTH === 'true'

interface FarmData {
  name: string
  location: string
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
  const { trackOnboardingCompleted } = useAnalytics()
  const geocodeAddress = useAction(api.geocoding.geocodeAddress)
  const setupFarm = useMutation(api.organizations.setupFarmFromOnboarding)
  const upsertLivestock = useMutation(api.livestock.upsertLivestock)
  const updateSettings = useMutation(api.settings.updateFarmSettings)

  const [currentStep, setCurrentStep] = useState(0)
  const [farmData, setFarmData] = useState<FarmData>({
    name: '',
    location: '',
  })
  const [livestockData, setLivestockData] = useState<LivestockData>({
    cows: 0,
    calves: 0,
    sheep: 0,
    lambs: 0,
  })
  const [geoFenceData, setGeoFenceData] = useState<GeoFenceData>({
    usesVirtualFence: false,
    provider: '',
    customProvider: '',
  })
  const [createdFarmId, setCreatedFarmId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    // Set flag when advancing from Welcome to Farm Setup to prevent early redirect
    if (currentStep === 0) {
      sessionStorage.setItem('onboardingInProgress', 'true')
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const handleDevSkip = () => {
    sessionStorage.removeItem('onboardingInProgress')
    navigate({ to: '/app' })
  }

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

      // Default pasture size of 10 hectares - users will adjust on the map
      await setupFarm({
        orgId: organizationId,
        name: data.name.trim(),
        location: data.location.trim(),
        coordinates: geocodeResult.coordinates,
        totalArea: 10,
      })

      // Set area unit to acres since geocoding is US-only
      await updateSettings({
        farmId: organizationId,
        settings: { areaUnit: 'acres' },
      })

      // Store the org ID as the farm ID for later mutations
      // (livestock and settings use external ID, not internal Convex ID)
      setCreatedFarmId(organizationId)
      setIsSubmitting(false)
      handleNext()
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during setup')
      setIsSubmitting(false)
    }
  }

  const handleLivestockNext = (data: LivestockData) => {
    setLivestockData(data)
    handleNext()
  }

  const handleLivestockSkip = () => {
    handleNext()
  }

  const handleGeoFenceNext = async (data: GeoFenceData) => {
    setGeoFenceData(data)
    await finishOnboarding(livestockData, data)
  }

  const handleGeoFenceSkip = async () => {
    await finishOnboarding(livestockData, geoFenceData)
  }

  const finishOnboarding = async (
    livestock: LivestockData,
    geoFence: GeoFenceData
  ) => {
    // Clear the onboarding-in-progress flag before navigation
    sessionStorage.removeItem('onboardingInProgress')

    const hasLivestock = livestock.cows > 0 || livestock.calves > 0 || livestock.sheep > 0 || livestock.lambs > 0
    trackOnboardingCompleted({
      farmName: farmData.name || undefined,
      livestockConfigured: hasLivestock,
    })

    if (!createdFarmId) {
      // If no farm was created yet, just navigate to map setup
      navigate({ to: '/app', search: { showWelcome: 'true', onboarded: 'true' } })
      return
    }

    try {
      // Save livestock if any values are set
      if (livestock.cows > 0 || livestock.calves > 0) {
        await upsertLivestock({
          farmId: createdFarmId,
          animalType: 'cow',
          adultCount: livestock.cows,
          offspringCount: livestock.calves,
        })
      }
      if (livestock.sheep > 0 || livestock.lambs > 0) {
        await upsertLivestock({
          farmId: createdFarmId,
          animalType: 'sheep',
          adultCount: livestock.sheep,
          offspringCount: livestock.lambs,
        })
      }

      // Save virtual fence provider if selected
      if (geoFence.usesVirtualFence && geoFence.provider) {
        const provider =
          geoFence.provider === 'other'
            ? geoFence.customProvider
            : geoFence.provider
        await updateSettings({
          farmId: createdFarmId,
          settings: { virtualFenceProvider: provider },
        })
      }

      // Navigate to map setup - tutorial will be triggered after animal location step
      navigate({ to: '/app', search: { showWelcome: 'true', onboarded: 'true' } })
    } catch (err) {
      console.error('Error saving onboarding data:', err)
      // Continue to map setup even if saving fails
      navigate({ to: '/app', search: { showWelcome: 'true', onboarded: 'true' } })
    }
  }

  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <WelcomeStep onNext={handleNext} />
        {isDevMode && (
          <button
            onClick={handleDevSkip}
            className="mt-6 text-xs text-muted-foreground/50 hover:text-muted-foreground"
          >
            Skip to app (dev)
          </button>
        )}
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FarmSetupForm
            onComplete={handleFarmSetup}
            onBack={handleBack}
            initialData={farmData}
            isSubmitting={isSubmitting}
            error={error}
          />
        )
      case 2:
        return (
          <LivestockStep
            onNext={handleLivestockNext}
            onBack={handleBack}
            onSkip={handleLivestockSkip}
            initialData={livestockData}
          />
        )
      case 3:
        return (
          <GeoFenceStep
            onNext={handleGeoFenceNext}
            onBack={handleBack}
            onSkip={handleGeoFenceSkip}
            initialData={geoFenceData}
          />
        )
      default:
        return null
    }
  }

  return (
    <OnboardingContainer steps={steps.slice(1)} currentStep={currentStep - 1}>
      {renderStep()}
      {isDevMode && (
        <div className="mt-4 flex gap-4 justify-center">
          <button
            onClick={handleDevSkip}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground"
          >
            Skip to app (dev)
          </button>
        </div>
      )}
    </OnboardingContainer>
  )
}

// Production mode onboarding - uses Clerk hooks
// Only rendered when ClerkProvider is available (isDevAuth === false)
function ClerkOnboarding() {
  const { createOrganization, setActive } = useOrganizationList()

  const navigate = useNavigate()
  const { trackOnboardingCompleted } = useAnalytics()
  const geocodeAddress = useAction(api.geocoding.geocodeAddress)
  const createFarmFromOrg = useMutation(api.organizations.createFarmFromOrg)
  const upsertLivestock = useMutation(api.livestock.upsertLivestock)
  const updateSettings = useMutation(api.settings.updateFarmSettings)

  const [currentStep, setCurrentStep] = useState(0)
  const [farmData, setFarmData] = useState<FarmData>({
    name: '',
    location: '',
  })
  const [livestockData, setLivestockData] = useState<LivestockData>({
    cows: 0,
    calves: 0,
    sheep: 0,
    lambs: 0,
  })
  const [geoFenceData, setGeoFenceData] = useState<GeoFenceData>({
    usesVirtualFence: false,
    provider: '',
    customProvider: '',
  })
  const [createdFarmId, setCreatedFarmId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    // Set flag when advancing from Welcome to Farm Setup to prevent early redirect
    if (currentStep === 0) {
      sessionStorage.setItem('onboardingInProgress', 'true')
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }
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

      // Step 3: Create the farm in Convex (blank farm with pastureCount: 0)
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

      // Step 5: Set area unit to acres since geocoding is US-only
      await updateSettings({
        farmId: org.id,
        settings: { areaUnit: 'acres' },
      })

      // Store the org ID as the farm ID for later mutations
      // (livestock and settings use external ID, not internal Convex ID)
      setCreatedFarmId(org.id)
      setIsSubmitting(false)
      handleNext()
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during setup')
      setIsSubmitting(false)
    }
  }

  const handleLivestockNext = (data: LivestockData) => {
    setLivestockData(data)
    handleNext()
  }

  const handleLivestockSkip = () => {
    handleNext()
  }

  const handleGeoFenceNext = async (data: GeoFenceData) => {
    setGeoFenceData(data)
    await finishOnboarding(livestockData, data)
  }

  const handleGeoFenceSkip = async () => {
    await finishOnboarding(livestockData, geoFenceData)
  }

  const finishOnboarding = async (
    livestock: LivestockData,
    geoFence: GeoFenceData
  ) => {
    // Clear the onboarding-in-progress flag before navigation
    sessionStorage.removeItem('onboardingInProgress')

    const hasLivestock = livestock.cows > 0 || livestock.calves > 0 || livestock.sheep > 0 || livestock.lambs > 0
    trackOnboardingCompleted({
      farmName: farmData.name || undefined,
      livestockConfigured: hasLivestock,
    })

    if (!createdFarmId) {
      // If no farm was created yet, just navigate to map setup
      navigate({ to: '/app', search: { showWelcome: 'true', onboarded: 'true' } })
      return
    }

    try {
      // Save livestock if any values are set
      if (livestock.cows > 0 || livestock.calves > 0) {
        await upsertLivestock({
          farmId: createdFarmId,
          animalType: 'cow',
          adultCount: livestock.cows,
          offspringCount: livestock.calves,
        })
      }
      if (livestock.sheep > 0 || livestock.lambs > 0) {
        await upsertLivestock({
          farmId: createdFarmId,
          animalType: 'sheep',
          adultCount: livestock.sheep,
          offspringCount: livestock.lambs,
        })
      }

      // Save virtual fence provider if selected
      if (geoFence.usesVirtualFence && geoFence.provider) {
        const provider =
          geoFence.provider === 'other'
            ? geoFence.customProvider
            : geoFence.provider
        await updateSettings({
          farmId: createdFarmId,
          settings: { virtualFenceProvider: provider },
        })
      }

      // Navigate to map setup - tutorial will be triggered after animal location step
      navigate({ to: '/app', search: { showWelcome: 'true', onboarded: 'true' } })
    } catch (err) {
      console.error('Error saving onboarding data:', err)
      // Continue to map setup even if saving fails
      navigate({ to: '/app', search: { showWelcome: 'true', onboarded: 'true' } })
    }
  }

  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <WelcomeStep onNext={handleNext} />
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FarmSetupForm
            onComplete={handleFarmSetup}
            onBack={handleBack}
            initialData={farmData}
            isSubmitting={isSubmitting}
            error={error}
          />
        )
      case 2:
        return (
          <LivestockStep
            onNext={handleLivestockNext}
            onBack={handleBack}
            onSkip={handleLivestockSkip}
            initialData={livestockData}
          />
        )
      case 3:
        return (
          <GeoFenceStep
            onNext={handleGeoFenceNext}
            onBack={handleBack}
            onSkip={handleGeoFenceSkip}
            initialData={geoFenceData}
          />
        )
      default:
        return null
    }
  }

  return (
    <OnboardingContainer steps={steps.slice(1)} currentStep={currentStep - 1}>
      {renderStep()}
    </OnboardingContainer>
  )
}
