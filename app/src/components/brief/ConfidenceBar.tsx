import { cn } from '@/lib/utils'

interface ConfidenceBarProps {
  value: number
  className?: string
}

export function ConfidenceBar({ value, className }: ConfidenceBarProps) {
  const getColor = () => {
    if (value >= 75) return 'bg-green-500'
    if (value >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className={cn('h-2 w-full bg-muted', className)}>
      <div
        className={cn('h-full transition-all', getColor())}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
