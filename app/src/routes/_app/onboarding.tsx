import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Feature, Polygon } from 'geojson'
import {
  OnboardingContainer,
  WelcomeStep,
  FarmSetupForm,
} from '@/components/onboarding'
import { useGeometry } from '@/lib/geometry'

export const Route = createFileRoute('/_app/onboarding')({
  component: OnboardingPage,
})

const steps = ['Welcome', 'Farm Setup']

interface FarmData {
  name: string
  location: string
  area: string
}

/**
 * Create a square paddock geometry centered on the given coordinates.
 * @param center - [longitude, latitude]
 * @param sizeHectares - Size of the paddock in hectares (default: 10)
 */
function createDefaultPaddockGeometry(
  center: [number, number],
  sizeHectares: number = 10
): Feature<Polygon> {
  const sizeMeters = Math.sqrt(sizeHectares * 10000)
  const [lng, lat] = center
  const latDelta = sizeMeters / 111000 / 2
  const lngDelta = sizeMeters / (111000 * Math.cos(lat * Math.PI / 180)) / 2

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lng - lngDelta, lat - latDelta],
        [lng + lngDelta, lat - latDelta],
        [lng + lngDelta, lat + latDelta],
        [lng - lngDelta, lat + latDelta],
        [lng - lngDelta, lat - latDelta],
      ]],
    },
  }
}

function OnboardingPage() {
  const navigate = useNavigate()
  const { addPaddock, saveChanges } = useGeometry()
  const geocodeAddress = useAction(api.geocoding.geocodeAddress)

  const [currentStep, setCurrentStep] = useState(0)
  const [farmData, setFarmData] = useState<FarmData>({
    name: '',
    location: '',
    area: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleFarmSetup = async (data: FarmData) => {
    setFarmData(data)
    setError(null)
    setIsSubmitting(true)

    try {
      // Step 1: Geocode the address
      const geocodeResult = await geocodeAddress({ address: data.location.trim() })

      if (!geocodeResult.success || !geocodeResult.coordinates) {
        setError(geocodeResult.error ?? 'Failed to find address location. Please try a different address.')
        setIsSubmitting(false)
        return
      }

      // Step 2: Create a default paddock at the geocoded location
      const paddockSize = data.area ? Math.min(parseFloat(data.area), 50) : 10
      const paddockGeometry = createDefaultPaddockGeometry(
        geocodeResult.coordinates,
        paddockSize
      )

      addPaddock(paddockGeometry, {
        name: `${data.name || 'Main'} Paddock`,
        status: 'recovering',
        ndvi: 0.35,
        restDays: 0,
        waterAccess: 'None',
      })

      // Step 3: Save the changes
      await saveChanges()

      // Step 4: Navigate to main map with onboarded flag
      navigate({ to: '/', search: { onboarded: 'true' } })
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during setup')
      setIsSubmitting(false)
    }
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
          onComplete={handleFarmSetup}
          onBack={handleBack}
          initialData={farmData}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </OnboardingContainer>
  )
}
