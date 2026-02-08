import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AgentBehaviorConfig, AgentProfileId } from '@/lib/types'

interface AgentBehaviorPanelProps {
  profileId: AgentProfileId
  behaviorConfig: AgentBehaviorConfig
  onSave: (profileId: AgentProfileId, behaviorConfig: AgentBehaviorConfig) => Promise<void>
}

export function AgentBehaviorPanel({ profileId, behaviorConfig, onSave }: AgentBehaviorPanelProps) {
  const [profile, setProfile] = useState<AgentProfileId>(profileId)
  const [behavior, setBehavior] = useState<AgentBehaviorConfig>(behaviorConfig)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = useMemo(
    () => JSON.stringify({ profile, behavior }) !== JSON.stringify({ profile: profileId, behavior: behaviorConfig }),
    [profile, behavior, profileId, behaviorConfig]
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(profile, behavior)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Behavior</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Default Profile</label>
            <Select value={profile} onValueChange={(value) => setProfile(value as AgentProfileId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Risk Posture</label>
            <Select
              value={behavior.riskPosture}
              onValueChange={(value) => setBehavior((prev) => ({ ...prev, riskPosture: value as AgentBehaviorConfig['riskPosture'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Explanation Style</label>
            <Select
              value={behavior.explanationStyle}
              onValueChange={(value) => setBehavior((prev) => ({ ...prev, explanationStyle: value as AgentBehaviorConfig['explanationStyle'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Forage Sensitivity</span>
              <span className="text-muted-foreground">{behavior.forageSensitivity}</span>
            </div>
            <Slider
              value={[behavior.forageSensitivity]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setBehavior((prev) => ({ ...prev, forageSensitivity: value[0] ?? prev.forageSensitivity }))}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Movement Bias</span>
              <span className="text-muted-foreground">{behavior.movementBias}</span>
            </div>
            <Slider
              value={[behavior.movementBias]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setBehavior((prev) => ({ ...prev, movementBias: value[0] ?? prev.movementBias }))}
            />
          </div>
          <div className="flex items-center justify-between rounded border-2 border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Use Weather Signals</p>
              <p className="text-xs text-muted-foreground">Incorporate weather context into recommendations.</p>
            </div>
            <Switch
              checked={behavior.enableWeatherSignals}
              onCheckedChange={(checked) => setBehavior((prev) => ({ ...prev, enableWeatherSignals: checked }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>
            {isSaving ? 'Saving...' : 'Save Behavior'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
