import { cn } from '@/lib/utils'
import { ArrowRight, CirclePause } from 'lucide-react'
import type { BriefDecision } from '@/lib/types'

interface DecisionBadgeProps {
  decision: BriefDecision
  className?: string
}

export function DecisionBadge({ decision, className }: DecisionBadgeProps) {
  const isMove = decision === 'MOVE'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        isMove
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        className
      )}
    >
      {isMove ? (
        <>
          <ArrowRight className="h-3 w-3" />
          MOVE
        </>
      ) : (
        <>
          <CirclePause className="h-3 w-3" />
          STAY
        </>
      )}
    </span>
  )
}
