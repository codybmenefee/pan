import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { useAgentRunDeepDive } from '@/lib/convex/useAgentDashboard'
import type { AgentRun, AgentRunStep, AgentRunStepType } from '@/lib/types'
import type { Id } from '../../../convex/_generated/dataModel'
import type { VariantProps } from 'class-variance-authority'

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>
type StepFilter = 'all' | AgentRunStepType

const STEP_FILTERS: StepFilter[] = ['all', 'prompt', 'tool_call', 'tool_result', 'decision', 'error', 'info']

function statusVariant(status: AgentRun['status']): BadgeVariant {
  if (status === 'succeeded') return 'cli-solid'
  if (status === 'failed') return 'destructive'
  if (status === 'blocked') return 'secondary'
  return 'outline'
}

function stepVariant(stepType: AgentRunStep['stepType']): BadgeVariant {
  if (stepType === 'error') return 'destructive'
  if (stepType === 'decision') return 'cli-solid'
  if (stepType === 'tool_call' || stepType === 'tool_result') return 'secondary'
  return 'outline'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function formatValue(value: unknown): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function stepTone(stepType: AgentRunStepType) {
  if (stepType === 'decision') return 'border-l-4 border-l-olive bg-olive-light'
  if (stepType === 'error') return 'border-l-4 border-l-destructive bg-destructive/5'
  if (stepType === 'tool_call' || stepType === 'tool_result') return 'border-l-4 border-l-cobalt bg-muted/20'
  if (stepType === 'prompt') return 'border-l-4 border-l-cobalt bg-cobalt/5'
  return 'border-l-4 border-l-terracotta bg-terracotta/5'
}

function RunMetadataCard({
  run,
  stepCount,
}: {
  run: AgentRun
  stepCount: number
}) {
  return (
    <Card className="bg-gradient-to-r from-background to-olive-light hover:translate-x-0 hover:translate-y-0">
      <CardHeader className="px-3 pb-1">
        <CardTitle className="text-sm font-semibold">Run Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-1">
        <div className="grid gap-2 text-xs md:grid-cols-4 xl:grid-cols-8">
          <p><span className="text-muted-foreground">Started:</span> {new Date(run.startedAt).toLocaleString()}</p>
          <p><span className="text-muted-foreground">Completed:</span> {run.completedAt ? new Date(run.completedAt).toLocaleString() : '-'}</p>
          <p><span className="text-muted-foreground">Latency:</span> {run.latencyMs ? `${run.latencyMs}ms` : '-'}</p>
          <p><span className="text-muted-foreground">Tool Calls:</span> {run.toolCallCount ?? 0}</p>
          <p><span className="text-muted-foreground">Step Count:</span> {stepCount}</p>
          <p><span className="text-muted-foreground">Provider:</span> {run.provider || '-'}</p>
          <p><span className="text-muted-foreground">Model:</span> {run.model || '-'}</p>
          <p><span className="text-muted-foreground">Plan:</span> {run.outputPlanId ?? '-'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryOnlyCard({ run }: { run: AgentRun }) {
  return (
    <Card className="border-2 border-terracotta/40 hover:translate-x-0 hover:translate-y-0">
      <CardHeader className="px-3 pb-1">
        <CardTitle className="text-sm font-semibold">Summary-Only Run</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-1 space-y-2 text-sm">
        <p className="text-muted-foreground">
          This run predates deep-dive instrumentation, so only summary fields are available.
        </p>
        <div className="grid gap-1 text-xs md:grid-cols-2">
          <p><span className="text-muted-foreground">Tool Summary:</span> {run.toolSummary?.join(', ') || '-'}</p>
          <p><span className="text-muted-foreground">Tool Call Count:</span> {run.toolCallCount ?? 0}</p>
          <p><span className="text-muted-foreground">Error:</span> {run.errorMessage || '-'}</p>
          <p><span className="text-muted-foreground">Output Plan:</span> {run.outputPlanId || '-'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export const Route = createFileRoute('/app/agent/$runId')({
  component: AgentRunDeepDiveRoute,
})

function AgentRunDeepDiveRoute() {
  const { runId } = Route.useParams()
  const { deepDive, isLoading } = useAgentRunDeepDive(runId as Id<'agentRuns'>)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [stepFilter, setStepFilter] = useState<StepFilter>('all')

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner message="Loading run deep dive..." />
      </div>
    )
  }

  if (!deepDive) {
    return (
      <div className="h-full overflow-auto p-4">
        <ErrorState
          title="Run Not Found"
          message="The selected run could not be loaded or you do not have access to it."
        />
      </div>
    )
  }

  const { run, steps, hasDeepDive } = deepDive
  const initialPromptStep = steps.find((step) => step.stepType === 'prompt')
  const initialPromptInput = asRecord(initialPromptStep?.input)
  const systemPrompt = typeof initialPromptInput?.systemPrompt === 'string'
    ? initialPromptInput.systemPrompt
    : null
  const textPrompt = typeof initialPromptInput?.textPrompt === 'string'
    ? initialPromptInput.textPrompt
    : null

  const filteredSteps = stepFilter === 'all'
    ? steps
    : steps.filter((step) => step.stepType === stepFilter)

  const selectedStep = filteredSteps.find((step) => step._id === selectedStepId) ?? filteredSteps[0] ?? null

  const stepCounts: Record<AgentRunStepType, number> = {
    prompt: 0,
    tool_call: 0,
    tool_result: 0,
    decision: 0,
    error: 0,
    info: 0,
  }
  for (const step of steps) stepCounts[step.stepType] += 1

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background to-olive-light">
      <div className="mx-auto max-w-[1600px] space-y-4 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/app/agent">
                <ArrowLeft className="h-4 w-4" />
                Back to Monitor
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold md:text-2xl">Agent Run Deep Dive</h1>
              <p className="text-xs text-muted-foreground md:text-sm">
                Inspector mode: compact step navigation with full input/output detail.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
            <Badge variant="outline">{run.trigger}</Badge>
            <Badge variant="outline">{run.profileId}</Badge>
          </div>
        </div>

        <RunMetadataCard run={run} stepCount={steps.length} />

        {!hasDeepDive ? (
          <SummaryOnlyCard run={run} />
        ) : (
          <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="xl:sticky xl:top-3 xl:self-start hover:translate-x-0 hover:translate-y-0">
              <CardHeader className="px-3 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">Inspector</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {filteredSteps.length}/{steps.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2 space-y-2">
                <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
                  {STEP_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStepFilter(filter)}
                      className={[
                        'rounded border px-2 py-1 text-left text-[11px] transition-colors',
                        stepFilter === filter
                          ? 'border-olive bg-olive-light text-foreground'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/30',
                      ].join(' ')}
                    >
                      {filter === 'all' ? 'all' : filter}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                  <p>decisions: {stepCounts.decision}</p>
                  <p>errors: {stepCounts.error}</p>
                </div>

                <div className="max-h-[calc(100vh-300px)] space-y-1.5 overflow-auto pr-1">
                  {filteredSteps.map((step) => {
                    const active = selectedStep?._id === step._id
                    return (
                      <button
                        key={step._id}
                        type="button"
                        onClick={() => setSelectedStepId(step._id)}
                        className={[
                          'w-full rounded border p-2 text-left transition-colors',
                          stepTone(step.stepType),
                          active ? 'ring-1 ring-olive' : 'hover:bg-muted/30',
                        ].join(' ')}
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline">#{step.stepIndex}</Badge>
                          <Badge variant={stepVariant(step.stepType)}>{step.stepType}</Badge>
                        </div>
                        <p className="text-xs font-medium">{step.title}</p>
                        {step.toolName ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">tool: {step.toolName}</p>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Card className="hover:translate-x-0 hover:translate-y-0">
                <CardHeader className="px-3 pb-1">
                  <CardTitle className="text-sm font-semibold">
                    {selectedStep ? `Step #${selectedStep.stepIndex}` : 'Step Detail'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  {!selectedStep ? (
                    <p className="text-sm text-muted-foreground">No steps match this filter.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={stepVariant(selectedStep.stepType)}>{selectedStep.stepType}</Badge>
                        {selectedStep.toolName ? <Badge variant="outline">{selectedStep.toolName}</Badge> : null}
                        <p className="text-sm font-medium">{selectedStep.title}</p>
                      </div>

                      {selectedStep.justification ? (
                        <p className="rounded border border-cobalt/30 bg-cobalt/5 p-2 text-xs text-muted-foreground">
                          {selectedStep.justification}
                        </p>
                      ) : null}

                      <div className="grid gap-3 lg:grid-cols-2">
                        {selectedStep.input !== undefined ? (
                          <div className="space-y-1">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Input</p>
                            <pre className="max-h-[24rem] overflow-auto rounded border bg-muted/30 p-2 text-[11px] whitespace-pre-wrap">
                              {formatValue(selectedStep.input)}
                            </pre>
                          </div>
                        ) : null}

                        {selectedStep.output !== undefined ? (
                          <div className="space-y-1">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Output</p>
                            <pre className="max-h-[24rem] overflow-auto rounded border bg-muted/30 p-2 text-[11px] whitespace-pre-wrap">
                              {formatValue(selectedStep.output)}
                            </pre>
                          </div>
                        ) : null}
                      </div>

                      {selectedStep.error ? (
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-wide text-destructive">Error</p>
                          <pre className="max-h-48 overflow-auto rounded border border-destructive/40 bg-destructive/5 p-2 text-[11px] whitespace-pre-wrap">
                            {selectedStep.error}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:translate-x-0 hover:translate-y-0">
                <CardHeader className="px-3 pb-1">
                  <CardTitle className="text-sm font-semibold">Prompt Context</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2 space-y-2">
                  {initialPromptStep ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        From step #{initialPromptStep.stepIndex}: {initialPromptStep.title}
                      </p>
                      <div className="grid gap-2 lg:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">System Prompt</p>
                          <pre className="max-h-48 overflow-auto rounded border bg-muted/30 p-2 text-[11px] whitespace-pre-wrap">
                            {systemPrompt || 'No system prompt payload was captured for this step.'}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">User Prompt</p>
                          <pre className="max-h-48 overflow-auto rounded border bg-muted/30 p-2 text-[11px] whitespace-pre-wrap">
                            {textPrompt || formatValue(initialPromptStep.input)}
                          </pre>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No prompt step was captured for this run.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
