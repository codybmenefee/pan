import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface AgentRulesPanelProps {
  principles: {
    minDaysPerSection?: number
    maxDaysPerSection?: number
    minNdviThreshold?: number
    preferHighNdviAreas?: boolean
    requireAdjacentSections?: boolean
    allowSectionOverlapPct?: number
    customRules?: string[]
  } | null
  onSave: (rules: {
    minDaysPerSection?: number
    maxDaysPerSection?: number
    minNdviThreshold?: number
    preferHighNdviAreas?: boolean
    requireAdjacentSections?: boolean
    allowSectionOverlapPct?: number
    customRules?: string[]
  }) => Promise<void>
}

export function AgentRulesPanel({ principles, onSave }: AgentRulesPanelProps) {
  const [minDaysPerSection, setMinDaysPerSection] = useState(String(principles?.minDaysPerSection ?? 1))
  const [maxDaysPerSection, setMaxDaysPerSection] = useState(String(principles?.maxDaysPerSection ?? 7))
  const [minNdviThreshold, setMinNdviThreshold] = useState(String(principles?.minNdviThreshold ?? 0.35))
  const [allowSectionOverlapPct, setAllowSectionOverlapPct] = useState(String(principles?.allowSectionOverlapPct ?? 5))
  const [preferHighNdviAreas, setPreferHighNdviAreas] = useState(principles?.preferHighNdviAreas ?? true)
  const [requireAdjacentSections, setRequireAdjacentSections] = useState(principles?.requireAdjacentSections ?? true)
  const [customRulesText, setCustomRulesText] = useState((principles?.customRules ?? []).join('\n'))
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = useMemo(() => {
    const normalizedCurrent = JSON.stringify({
      minDaysPerSection,
      maxDaysPerSection,
      minNdviThreshold,
      allowSectionOverlapPct,
      preferHighNdviAreas,
      requireAdjacentSections,
      customRulesText,
    })
    const normalizedInitial = JSON.stringify({
      minDaysPerSection: String(principles?.minDaysPerSection ?? 1),
      maxDaysPerSection: String(principles?.maxDaysPerSection ?? 7),
      minNdviThreshold: String(principles?.minNdviThreshold ?? 0.35),
      allowSectionOverlapPct: String(principles?.allowSectionOverlapPct ?? 5),
      preferHighNdviAreas: principles?.preferHighNdviAreas ?? true,
      requireAdjacentSections: principles?.requireAdjacentSections ?? true,
      customRulesText: (principles?.customRules ?? []).join('\n'),
    })
    return normalizedCurrent !== normalizedInitial
  }, [
    minDaysPerSection,
    maxDaysPerSection,
    minNdviThreshold,
    allowSectionOverlapPct,
    preferHighNdviAreas,
    requireAdjacentSections,
    customRulesText,
    principles,
  ])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        minDaysPerSection: Number(minDaysPerSection),
        maxDaysPerSection: Number(maxDaysPerSection),
        minNdviThreshold: Number(minNdviThreshold),
        preferHighNdviAreas,
        requireAdjacentSections,
        allowSectionOverlapPct: Number(allowSectionOverlapPct),
        customRules: customRulesText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Min Days/Section</label>
            <Input value={minDaysPerSection} onChange={(e) => setMinDaysPerSection(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Max Days/Section</label>
            <Input value={maxDaysPerSection} onChange={(e) => setMaxDaysPerSection(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Min NDVI</label>
            <Input value={minNdviThreshold} onChange={(e) => setMinNdviThreshold(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Overlap %</label>
            <Input value={allowSectionOverlapPct} onChange={(e) => setAllowSectionOverlapPct(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between rounded border-2 border-border px-3 py-2">
            <span className="text-sm">Prefer high NDVI areas</span>
            <Switch checked={preferHighNdviAreas} onCheckedChange={setPreferHighNdviAreas} />
          </div>
          <div className="flex items-center justify-between rounded border-2 border-border px-3 py-2">
            <span className="text-sm">Require adjacent sections</span>
            <Switch checked={requireAdjacentSections} onCheckedChange={setRequireAdjacentSections} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Custom Rules (one per line)</label>
          <Textarea rows={6} value={customRulesText} onChange={(e) => setCustomRulesText(e.target.value)} />
        </div>

        <div className="flex justify-end">
          <Button size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>
            {isSaving ? 'Saving...' : 'Save Rules'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
