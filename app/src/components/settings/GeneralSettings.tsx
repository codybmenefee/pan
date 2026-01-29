import { useState } from 'react'
import { Eye, EyeOff, Pencil, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FarmSettings, AreaUnit } from '@/lib/types'

interface GeneralSettingsProps {
  settings: FarmSettings
  onChange: (settings: FarmSettings) => void
}

const providers = [
  { value: 'halter', label: 'Halter' },
  { value: 'vence', label: 'Vence' },
  { value: 'nofence', label: 'Nofence' },
  { value: 'other', label: 'Other' },
]

export function GeneralSettings({ settings, onChange }: GeneralSettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [isEditingKey, setIsEditingKey] = useState(false)
  const [tempKey, setTempKey] = useState(settings.apiKey || '')

  const updateSetting = <K extends keyof FarmSettings>(
    key: K,
    value: FarmSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  const maskedKey = settings.apiKey
    ? `${'*'.repeat(Math.min(settings.apiKey.length, 8))}${settings.apiKey.slice(-4)}`
    : 'Not configured'

  const handleSaveKey = () => {
    updateSetting('apiKey', tempKey)
    setIsEditingKey(false)
  }

  const handleCancelEdit = () => {
    setTempKey(settings.apiKey || '')
    setIsEditingKey(false)
  }

  return (
    <div className="space-y-6">
      {/* Preferences Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Area Units</label>
          <Select
            value={settings.areaUnit ?? 'hectares'}
            onValueChange={(value) => updateSetting('areaUnit', value as AreaUnit)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hectares">Hectares (ha)</SelectItem>
              <SelectItem value="acres">Acres (ac)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Daily Brief Time</label>
          <Input
            type="time"
            value={settings.dailyBriefTime}
            onChange={(e) => updateSetting('dailyBriefTime', e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Notifications Row */}
      <div>
        <h4 className="text-sm font-medium mb-3">Notifications</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <label className="text-sm font-medium">Email Alerts</label>
              <p className="text-xs text-muted-foreground">Daily briefs via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(v) => updateSetting('emailNotifications', v)}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <label className="text-sm font-medium">Push Alerts</label>
              <p className="text-xs text-muted-foreground">Device notifications</p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(v) => updateSetting('pushNotifications', v)}
            />
          </div>
        </div>
      </div>

      {/* Virtual Fence Integration */}
      <div>
        <h4 className="text-sm font-medium mb-3">Virtual Fence</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Provider</label>
            <Select
              value={settings.virtualFenceProvider || 'none'}
              onValueChange={(v) => updateSetting('virtualFenceProvider', v === 'none' ? '' : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {settings.virtualFenceProvider && (
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">API Key</label>
              {isEditingKey ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="Enter API key"
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveKey}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={showApiKey ? (settings.apiKey || '') : maskedKey}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setTempKey(settings.apiKey || '')
                      setIsEditingKey(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
