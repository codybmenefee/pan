import { useState } from 'react'
import { Check, Edit, Clock, ChevronDown, ChevronRight, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'
import { FeedbackEditDialog } from './FeedbackEditDialog'

export interface PlanData {
  _id: string
  date: string
  primaryPaddockExternalId?: string
  sectionAreaHectares?: number
  confidenceScore: number
  status: 'pending' | 'approved' | 'modified' | 'rejected' | 'executed'
  feedback?: string
  reasoning: string[]
}

export interface PaddockModification {
  _id: string
  planId: string
  rationale?: string
  quickReasons?: string[]
  originalAreaHectares: number
  modifiedAreaHectares: number
}

interface HistoryEventCardProps {
  plan: PlanData
  pastureName: string
  modification?: PaddockModification
  isLast?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const statusConfig = {
  approved: {
    icon: Check,
    color: 'bg-green-500',
    badge: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    label: 'Approved',
  },
  modified: {
    icon: Edit,
    color: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    label: 'Modified',
  },
  pending: {
    icon: Clock,
    color: 'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    label: 'Pending',
  },
  rejected: {
    icon: Clock,
    color: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    label: 'Rejected',
  },
  executed: {
    icon: Check,
    color: 'bg-purple-500',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    label: 'Executed',
  },
}

export function HistoryEventCard({
  plan,
  pastureName,
  modification,
  isLast,
  isExpanded,
  onToggleExpand
}: HistoryEventCardProps) {
  const { format } = useAreaUnit()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const config = statusConfig[plan.status]
  const StatusIcon = config.icon

  // Determine if we have structured feedback from modification record
  const hasModificationFeedback = modification &&
    ((modification.quickReasons && modification.quickReasons.length > 0) || modification.rationale)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const hasReasoning = plan.reasoning && plan.reasoning.length > 0

  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5 bg-border" />
      )}

      {/* Timeline dot */}
      <div className={cn(
        'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
        config.color
      )}>
        <StatusIcon className="h-4 w-4 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{formatDate(plan.date)}</p>
            <p className="text-base font-semibold mt-0.5">{pastureName}</p>
          </div>
          <Badge variant="outline" className={cn('flex-shrink-0', config.badge)}>
            {config.label}
          </Badge>
        </div>

        {/* Details row */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {plan.sectionAreaHectares !== undefined && plan.sectionAreaHectares > 0 && (
            <span>{format(plan.sectionAreaHectares)} paddock</span>
          )}
          <span>{Math.round(plan.confidenceScore)}% confidence</span>
        </div>

        {/* Structured feedback for modified plans with paddock modification data */}
        {plan.status === 'modified' && modification && (
          <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Your feedback</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit feedback</span>
              </Button>
            </div>
            {hasModificationFeedback ? (
              <div className="mt-2 space-y-2">
                {modification.quickReasons && modification.quickReasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {modification.quickReasons.map((reason) => (
                      <Badge
                        key={reason}
                        variant="secondary"
                        className="text-xs"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                )}
                {modification.rationale && (
                  <p className="text-sm text-muted-foreground italic">
                    "{modification.rationale}"
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                No feedback provided yet.{' '}
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="text-primary hover:underline"
                >
                  Add feedback
                </button>
              </p>
            )}
          </div>
        )}

        {/* Legacy feedback for older modified plans without structured data */}
        {plan.status === 'modified' && !modification && plan.feedback && (
          <div className="mt-2 rounded-md bg-muted p-2 text-sm">
            <span className="text-xs font-medium text-muted-foreground block mb-1">Feedback</span>
            <span>{plan.feedback}</span>
          </div>
        )}

        {/* Expandable AI reasoning */}
        {hasReasoning && (
          <button
            onClick={onToggleExpand}
            className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>AI Reasoning</span>
          </button>
        )}

        {isExpanded && hasReasoning && (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground pl-5">
            {plan.reasoning.map((reason, idx) => (
              <li key={idx} className="list-disc">{reason}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit feedback dialog */}
      {modification && (
        <FeedbackEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          modificationId={modification._id}
          initialRationale={modification.rationale}
          initialQuickReasons={modification.quickReasons}
        />
      )}
    </div>
  )
}
