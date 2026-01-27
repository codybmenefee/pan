import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface GeoFenceData {
  usesVirtualFence: boolean
  provider: string
  customProvider: string
}

interface GeoFenceStepProps {
  onNext: (data: GeoFenceData) => void
  onBack: () => void
  onSkip: () => void
  initialData?: GeoFenceData
}

const providers = [
  { value: 'halter', label: 'Halter' },
  { value: 'vence', label: 'Vence' },
  { value: 'nofence', label: 'Nofence' },
  { value: 'other', label: 'Other' },
]

export function GeoFenceStep({
  onNext,
  onBack,
  onSkip,
  initialData,
}: GeoFenceStepProps) {
  const [formData, setFormData] = useState<GeoFenceData>(
    initialData || {
      usesVirtualFence: false,
      provider: '',
      customProvider: '',
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext(formData)
  }

  const handleUsesVirtualFenceChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      usesVirtualFence: checked,
      // Clear provider if switching off
      provider: checked ? prev.provider : '',
      customProvider: checked ? prev.customProvider : '',
    }))
  }

  const handleProviderChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      provider: value,
      // Clear custom provider if not "other"
      customProvider: value === 'other' ? prev.customProvider : '',
    }))
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Virtual fencing</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Virtual fencing systems use GPS collars to create flexible
              boundaries. If you use one, we can help coordinate grazing
              recommendations with your fence system.
            </p>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">
                  Do you use a virtual fence system?
                </label>
                <p className="text-xs text-muted-foreground">
                  e.g., Halter, Vence, Nofence
                </p>
              </div>
              <Switch
                checked={formData.usesVirtualFence}
                onCheckedChange={handleUsesVirtualFenceChange}
              />
            </div>
          </div>

          {formData.usesVirtualFence && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Which provider do you use?
                </label>
                <Select
                  value={formData.provider || 'none'}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.provider === 'other' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider name</label>
                  <Input
                    value={formData.customProvider}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customProvider: e.target.value,
                      }))
                    }
                    placeholder="Enter provider name"
                  />
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            You can configure this later in Settings under Virtual Fence
            Integration.
          </p>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
              <Button type="submit">Continue</Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
