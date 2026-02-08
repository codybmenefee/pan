import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentRunMonitor } from './AgentRunMonitor'
import { AgentBehaviorPanel } from './AgentBehaviorPanel'
import { AgentRulesPanel } from './AgentRulesPanel'
import { AgentMemoryPanel } from './AgentMemoryPanel'
import { AgentPromptPanel } from './AgentPromptPanel'
import { AgentDryRunPanel } from './AgentDryRunPanel'
import type { AgentBehaviorConfig, AgentMemory, AgentProfileId, AgentRun, AgentTriggerType } from '@/lib/types'

interface AgentDashboardShellProps {
  profileId: AgentProfileId
  behaviorConfig: AgentBehaviorConfig
  promptOverrideEnabled: boolean
  promptOverrideText?: string
  promptOverrideVersion: number
  rules: {
    minDaysPerSection?: number
    maxDaysPerSection?: number
    minNdviThreshold?: number
    preferHighNdviAreas?: boolean
    requireAdjacentSections?: boolean
    allowSectionOverlapPct?: number
    customRules?: string[]
  } | null
  runs: AgentRun[]
  memories: AgentMemory[]
  archivedMemories: AgentMemory[]
  recentFarmerObservations: Array<{
    _id: string
    level: 'farm' | 'paddock' | 'zone'
    targetId: string
    content: string
    tags?: string[]
    createdAt: string
  }>
  onSaveBehavior: (profileId: AgentProfileId, behaviorConfig: AgentBehaviorConfig) => Promise<void>
  onSaveRules: (rules: {
    minDaysPerSection?: number
    maxDaysPerSection?: number
    minNdviThreshold?: number
    preferHighNdviAreas?: boolean
    requireAdjacentSections?: boolean
    allowSectionOverlapPct?: number
    customRules?: string[]
  }) => Promise<void>
  onCreateMemory: (input: {
    scope: 'farm' | 'paddock'
    targetId?: string
    title: string
    content: string
    tags?: string[]
    priority: number
  }) => Promise<void>
  onArchiveMemory: (memoryId: string) => Promise<void>
  onUnarchiveMemory: (memoryId: string) => Promise<void>
  onUpdateMemory: (input: {
    memoryId: string
    title?: string
    content?: string
    tags?: string[]
    priority?: number
    status?: 'active' | 'archived'
  }) => Promise<void>
  onPromoteMemory: (observationId: string, title: string, priority: number) => Promise<void>
  onSavePromptOverride: (enabled: boolean, text: string) => Promise<void>
  onDryRun: (trigger: AgentTriggerType, profileOverride?: AgentProfileId) => Promise<unknown>
}

export function AgentDashboardShell(props: AgentDashboardShellProps) {
  return (
    <Tabs defaultValue="monitor" className="space-y-4">
      <TabsList className="h-10 p-1 gap-1">
        <TabsTrigger value="monitor">Monitor</TabsTrigger>
        <TabsTrigger value="behavior">Behavior</TabsTrigger>
        <TabsTrigger value="rules">Rules</TabsTrigger>
        <TabsTrigger value="memory">Memory</TabsTrigger>
        <TabsTrigger value="prompt">Prompt</TabsTrigger>
        <TabsTrigger value="test">Test</TabsTrigger>
      </TabsList>

      <TabsContent value="monitor" className="mt-0">
        <AgentRunMonitor runs={props.runs} />
      </TabsContent>

      <TabsContent value="behavior" className="mt-0">
        <AgentBehaviorPanel
          profileId={props.profileId}
          behaviorConfig={props.behaviorConfig}
          onSave={props.onSaveBehavior}
        />
      </TabsContent>

      <TabsContent value="rules" className="mt-0">
        <AgentRulesPanel principles={props.rules} onSave={props.onSaveRules} />
      </TabsContent>

      <TabsContent value="memory" className="mt-0">
        <AgentMemoryPanel
          memories={props.memories}
          archivedMemories={props.archivedMemories}
          recentFarmerObservations={props.recentFarmerObservations}
          onCreate={props.onCreateMemory}
          onArchive={props.onArchiveMemory}
          onUnarchive={props.onUnarchiveMemory}
          onUpdate={props.onUpdateMemory}
          onPromote={props.onPromoteMemory}
        />
      </TabsContent>

      <TabsContent value="prompt" className="mt-0">
        <AgentPromptPanel
          enabled={props.promptOverrideEnabled}
          text={props.promptOverrideText}
          version={props.promptOverrideVersion}
          onSave={props.onSavePromptOverride}
        />
      </TabsContent>

      <TabsContent value="test" className="mt-0">
        <AgentDryRunPanel defaultProfile={props.profileId} onRun={props.onDryRun} />
      </TabsContent>
    </Tabs>
  )
}
