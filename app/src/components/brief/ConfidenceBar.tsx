import { cn } from '@/lib/utils'

interface ConfidenceBarProps {
  value: number
  className?: string
}

export function ConfidenceBar({ value, className }: ConfidenceBarProps) {
  const getColor = () => {
    if (value >= 75) return 'bg-olive'
    if (value >= 50) return 'bg-terracotta'
    return 'bg-terracotta'
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
