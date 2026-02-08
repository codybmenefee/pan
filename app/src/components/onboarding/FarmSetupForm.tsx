import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { Loader2 } from 'lucide-react'

interface FarmData {
  name: string
  location: string
}

interface FarmSetupFormProps {
  onComplete: (data: FarmData) => Promise<void>
  onBack: () => void
  initialData?: FarmData
  isSubmitting?: boolean
  error?: string | null
}

export function FarmSetupForm({
  onComplete,
  onBack,
  initialData,
  isSubmitting = false,
  error,
}: FarmSetupFormProps) {
  const [formData, setFormData] = useState<FarmData>(initialData || {
    name: '',
    location: '',
  })

  const isValid = formData.name.trim() && formData.location.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid && !isSubmitting) {
      onComplete(formData)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Tell us about your farm</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Farm Name
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Clearview Farm"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Location
            </label>
            <AddressAutocomplete
              id="location"
              value={formData.location}
              onChange={(value) => setFormData({ ...formData, location: value })}
              placeholder="e.g., 943 Riverview Ln, Columbia, TN 38401"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Enter your farm address to center the map on your location
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
