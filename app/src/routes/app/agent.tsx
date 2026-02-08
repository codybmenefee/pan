import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Lock, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { AgentDashboardShell } from '@/components/agent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useAgentDashboard } from '@/lib/convex/useAgentDashboard'

export const Route = createFileRoute('/app/agent')({
  component: AgentRoute,
})

function AgentRoute() {
  const dashboard = useAgentDashboard()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isDeepDiveRoute = pathname.startsWith('/app/agent/')

  if (!dashboard.canAccess) {
    return (
      <div className="h-full overflow-auto">
        <div className="p-6 max-w-4xl">
          <Card className="border-2 border-terracotta/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-terracotta" />
                Agent Command Center Locked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This is a power-user feature. Upgrade or request access to manage behaviors, memory, and prompt controls.
              </p>
              <Button asChild size="sm">
                <Link to="/app/upgrade">View Plans</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isDeepDiveRoute) {
    return <Outlet />
  }

  if (dashboard.isLoading || !dashboard.dashboardState) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner message="Loading agent dashboard..." />
      </div>
    )
  }

  const config = dashboard.dashboardState.config
  const principles = dashboard.dashboardState.principles
  const recentFarmerObservations = dashboard.dashboardState.recentFarmerObservations ?? []

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Agent Command Center</h1>
            <p className="text-sm text-muted-foreground">
              Monitor runs, tune behavior, edit memory, and test dry runs with safe guardrails.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded border-2 border-cobalt/30 px-3 py-2 text-xs text-muted-foreground">
            <Wrench className="h-3.5 w-3.5 text-cobalt" />
            Power User
          </div>
        </div>

        <AgentDashboardShell
          profileId={config.profileId}
          behaviorConfig={config.behaviorConfig}
          promptOverrideEnabled={config.promptOverrideEnabled}
          promptOverrideText={config.promptOverrideText}
          promptOverrideVersion={config.promptOverrideVersion}
          rules={principles}
          runs={dashboard.runs}
          memories={dashboard.memories}
          archivedMemories={dashboard.archivedMemories}
          recentFarmerObservations={recentFarmerObservations}
          onSaveBehavior={async (profileId, behaviorConfig) => {
            await dashboard.saveBehavior(profileId, behaviorConfig)
            toast.success('Behavior updated')
          }}
          onSaveRules={async (rules) => {
            await dashboard.saveRules(rules)
            toast.success('Rules updated')
          }}
          onCreateMemory={async (memory) => {
            await dashboard.createMemory(memory)
            toast.success('Memory added')
          }}
          onArchiveMemory={async (memoryId) => {
            await dashboard.archiveMemory(memoryId)
            toast.success('Memory archived')
          }}
          onUnarchiveMemory={async (memoryId) => {
            await dashboard.unarchiveMemory(memoryId)
            toast.success('Memory restored')
          }}
          onUpdateMemory={async (memory) => {
            await dashboard.updateMemory(memory)
            toast.success('Memory updated')
          }}
          onPromoteMemory={async (observationId, title, priority) => {
            await dashboard.promoteObservation(observationId, title, priority)
            toast.success('Observation promoted to memory')
          }}
          onSavePromptOverride={async (enabled, text) => {
            await dashboard.savePromptOverride(enabled, text)
            toast.success('Prompt settings updated')
          }}
          onDryRun={async (trigger, profileOverride) => {
            const result = await dashboard.runDryRun(trigger, profileOverride)
            toast.success('Dry run completed')
            return result
          }}
        />
      </div>
    </div>
  )
}
