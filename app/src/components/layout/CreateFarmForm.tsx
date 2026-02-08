import { useState } from 'react'
import { useOrganizationList } from '@clerk/clerk-react'
import { useAction, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, MapPin, AlertTriangle } from 'lucide-react'

interface CreateFarmFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateFarmForm({ onSuccess, onCancel }: CreateFarmFormProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approximateWarning, setApproximateWarning] = useState<string | null>(null)

  const { createOrganization, setActive } = useOrganizationList()
  const geocodeAddress = useAction(api.geocoding.geocodeAddress)
  const createFarmFromOrg = useMutation(api.organizations.createFarmFromOrg)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setApproximateWarning(null)

    if (!name.trim()) {
      setError('Farm name is required')
      return
    }

    if (!address.trim()) {
      setError('Address is required')
      return
    }

    if (!createOrganization) {
      setError('Organization creation not available')
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Geocode the address
      const geocodeResult = await geocodeAddress({ address: address.trim() })

      if (!geocodeResult.success) {
        setError(geocodeResult.error ?? 'Failed to find address')
        setIsSubmitting(false)
        return
      }

      // Show warning if location is approximate but continue
      if (geocodeResult.isApproximate) {
        setApproximateWarning(
          `Exact address not found. Map will center on: ${geocodeResult.formattedAddress}`
        )
      }

      // Step 2: Create the Clerk organization
      const org = await createOrganization({ name: name.trim() })

      // Step 3: Create the farm in Convex with coordinates
      await createFarmFromOrg({
        clerkOrgId: org.id,
        name: name.trim(),
        location: geocodeResult.formattedAddress ?? address.trim(),
        coordinates: geocodeResult.coordinates,
      })

      // Step 4: Set the new org as active (triggers map navigation)
      if (setActive) {
        await setActive({ organization: org.id })
      }

      onSuccess?.()
    } catch (err) {
      console.error('Failed to create farm:', err)
      setError(err instanceof Error ? err.message : 'Failed to create farm')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="farm-name" className="text-sm font-medium">
          Farm Name
        </label>
        <Input
          id="farm-name"
          type="text"
          placeholder="e.g., Hillcrest Station"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="farm-address" className="text-sm font-medium">
          Address
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="farm-address"
            type="text"
            placeholder="e.g., 123 Rural Road, Nashville, TN"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isSubmitting}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter a street address, city, or region to center the map on your farm location.
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {approximateWarning && !error && (
        <div className="text-sm text-terracotta bg-terracotta/10 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{approximateWarning}</span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            'Create Farm'
          )}
        </Button>
      </div>
    </form>
  )
}
