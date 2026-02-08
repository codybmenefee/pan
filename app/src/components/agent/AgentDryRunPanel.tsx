import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AgentProfileId, AgentTriggerType } from '@/lib/types'

type DryRunOutput = {
  promptPreview: string
  renderedDraft?: string
  draftPlan?: {
    action: 'MOVE' | 'STAY'
    sectionIndex: number
    reasoning: string[]
    confidence: 'high' | 'medium' | 'low'
  }
  triggerDetails?: string[]
}

type DryRunResult = {
  success?: boolean
  message?: string
  error?: string
  dryRunOutput?: DryRunOutput
}

interface AgentDryRunPanelProps {
  defaultProfile: AgentProfileId
  onRun: (trigger: AgentTriggerType, profileOverride?: AgentProfileId) => Promise<unknown>
}

export function AgentDryRunPanel({ defaultProfile, onRun }: AgentDryRunPanelProps) {
  const [trigger, setTrigger] = useState<AgentTriggerType>('morning_brief')
  const [profileOverride, setProfileOverride] = useState<AgentProfileId>(defaultProfile)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<DryRunResult | null>(null)

  const asDryRunResult = (value: unknown): DryRunResult => {
    if (!value || typeof value !== 'object') return {}
    return value as DryRunResult
  }

  const handleRun = async () => {
    setIsRunning(true)
    try {
      const output = await onRun(trigger, profileOverride)
      setResult(asDryRunResult(output))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Trigger</label>
            <Select value={trigger} onValueChange={(value) => setTrigger(value as AgentTriggerType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning_brief">morning_brief</SelectItem>
                <SelectItem value="observation_refresh">observation_refresh</SelectItem>
                <SelectItem value="plan_execution">plan_execution</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Profile Override</label>
            <Select value={profileOverride} onValueChange={(value) => setProfileOverride(value as AgentProfileId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">conservative</SelectItem>
                <SelectItem value="balanced">balanced</SelectItem>
                <SelectItem value="aggressive">aggressive</SelectItem>
                <SelectItem value="custom">custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={handleRun} disabled={isRunning}>
            {isRunning ? 'Running dry run...' : 'Run Dry Run'}
          </Button>
        </div>

        {result && (
          <div className="rounded border-2 border-border bg-muted/30 p-3 space-y-1">
            <p className="text-sm font-medium">Run Status</p>
            <p className="text-sm">{result.message || result.error || 'Dry run complete'}</p>
          </div>
        )}

        {result?.dryRunOutput?.draftPlan && (
          <div className="rounded border-2 border-border bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-medium">Draft Plan</p>
            <p className="text-sm">
              Action: {result.dryRunOutput.draftPlan.action} | Section: {result.dryRunOutput.draftPlan.sectionIndex} | Confidence: {result.dryRunOutput.draftPlan.confidence}
            </p>
            {result.dryRunOutput.draftPlan.reasoning.length > 0 ? (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {result.dryRunOutput.draftPlan.reasoning.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {result?.dryRunOutput?.triggerDetails?.length ? (
          <div className="rounded border-2 border-border bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-medium">Trigger Details</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {result.dryRunOutput.triggerDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {result?.dryRunOutput?.renderedDraft ? (
          <div className="rounded border-2 border-border bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-medium">Rendered Draft Output</p>
            <pre className="max-h-72 overflow-auto text-xs whitespace-pre-wrap">{result.dryRunOutput.renderedDraft}</pre>
          </div>
        ) : null}

        {result?.dryRunOutput && (
          <div className="rounded border-2 border-border bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-medium">Prompt Preview</p>
            <pre className="max-h-72 overflow-auto text-xs whitespace-pre-wrap">{result.dryRunOutput.promptPreview}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
