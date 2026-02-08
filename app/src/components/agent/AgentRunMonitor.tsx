import { Badge, badgeVariants } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link, useNavigate } from '@tanstack/react-router'
import type { AgentRun } from '@/lib/types'
import type { VariantProps } from 'class-variance-authority'

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

function statusVariant(status: AgentRun['status']): BadgeVariant {
  if (status === 'succeeded') return 'cli-solid'
  if (status === 'failed') return 'destructive'
  if (status === 'blocked') return 'secondary'
  return 'outline'
}

export function AgentRunMonitor({ runs }: { runs: AgentRun[] }) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Trigger</th>
                  <th className="py-2 pr-2">Profile</th>
                  <th className="py-2 pr-2">Latency</th>
                  <th className="py-2 pr-2">Tools</th>
                  <th className="py-2 pr-2">Outcome</th>
                  <th className="py-2">Started</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run._id}
                    className="border-b border-border/60 cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate({ to: '/app/agent/$runId', params: { runId: run._id } })}
                  >
                    <td className="py-2 pr-2">
                      <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                    </td>
                    <td className="py-2 pr-2">{run.trigger}</td>
                    <td className="py-2 pr-2">{run.profileId}</td>
                    <td className="py-2 pr-2">{run.latencyMs ? `${run.latencyMs}ms` : '-'}</td>
                    <td className="py-2 pr-2">{run.toolCallCount ?? 0}</td>
                    <td className="py-2 pr-2 truncate max-w-[220px]">
                      {run.errorMessage || (run.outputPlanId ? `Plan ${String(run.outputPlanId).slice(0, 8)}` : run.status)}
                    </td>
                    <td className="py-2">{new Date(run.startedAt).toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <Link
                        to="/app/agent/$runId"
                        params={{ runId: run._id }}
                        className="text-xs underline underline-offset-2 text-cobalt hover:text-cobalt/80"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Deep Dive
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
