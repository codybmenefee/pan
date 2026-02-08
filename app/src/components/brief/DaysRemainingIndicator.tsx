import { cn } from '@/lib/utils'

interface DaysRemainingIndicatorProps {
  daysRemaining: number
  className?: string
}

export function DaysRemainingIndicator({ daysRemaining, className }: DaysRemainingIndicatorProps) {
  const isLastDay = daysRemaining === 0
  const isUrgent = daysRemaining === 1

  const text = isLastDay
    ? 'Last day'
    : daysRemaining === 1
      ? 'Move tomorrow'
      : `Move in ${daysRemaining} days`

  return (
    <span
      className={cn(
        'text-xs',
        isLastDay && 'text-terracotta font-medium',
        isUrgent && 'text-terracotta font-medium',
        !isLastDay && !isUrgent && 'text-muted-foreground',
        className
      )}
    >
      {text}
    </span>
  )
}
