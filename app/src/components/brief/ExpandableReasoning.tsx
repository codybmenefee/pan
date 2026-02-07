import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandableReasoningProps {
  summary: string
  details?: string[]
  className?: string
}

export function ExpandableReasoning({ summary, details = [], className }: ExpandableReasoningProps) {
  const [expanded, setExpanded] = useState(false)

  const hasDetails = details.length > 0

  return (
    <div className={cn('border-t border-border', className)}>
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          'flex items-center justify-between w-full py-2 px-3 text-left',
          hasDetails && 'hover:bg-muted/30 transition-colors'
        )}
        disabled={!hasDetails}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">Why this pasture?</p>
          <p className="text-xs text-muted-foreground truncate">{summary}</p>
        </div>
        {hasDetails && (
          <div className="shrink-0 ml-2 text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        )}
      </button>

      {expanded && hasDetails && (
        <div className="px-3 pb-3">
          <ul className="space-y-1">
            {details.map((detail, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-muted-foreground/50 shrink-0">-</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
