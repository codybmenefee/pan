import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface AgentPromptPanelProps {
  enabled: boolean
  text?: string
  version: number
  onSave: (enabled: boolean, text: string) => Promise<void>
}

export function AgentPromptPanel({ enabled, text, version, onSave }: AgentPromptPanelProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [promptText, setPromptText] = useState(text ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = useMemo(
    () => isEnabled !== enabled || promptText !== (text ?? ''),
    [isEnabled, enabled, promptText, text]
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(isEnabled, promptText)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Prompt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded border-2 border-border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Enable Raw Prompt Override</p>
            <p className="text-xs text-muted-foreground">
              Version {version}. Structured rules and approval policy still take precedence.
            </p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>

        <Textarea
          rows={10}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Add supplemental prompt instructions for this farm."
        />

        <div className="flex justify-end">
          <Button size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>
            {isSaving ? 'Saving...' : 'Save Prompt'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
