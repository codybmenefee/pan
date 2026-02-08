import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable'
  value?: string
  className?: string
}

export function TrendIndicator({ trend, value, className }: TrendIndicatorProps) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-sm',
      trend === 'up' && 'text-olive',
      trend === 'down' && 'text-terracotta',
      trend === 'stable' && 'text-muted-foreground',
      className
    )}>
      <Icon className="h-4 w-4" />
      {value && <span>{value}</span>}
    </span>
  )
}

export function getTrendFromValue(value: number): 'up' | 'down' | 'stable' {
  if (value > 0.005) return 'up'
  if (value < -0.005) return 'down'
  return 'stable'
}
