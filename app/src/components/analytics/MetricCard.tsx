import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: number | string
  trendDirection?: 'up' | 'down' | 'stable'
  trendLabel?: string
  tooltip?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  trend,
  trendDirection,
  trendLabel,
  tooltip,
  className,
}: MetricCardProps) {
  const TrendIcon = trendDirection === 'up' 
    ? TrendingUp 
    : trendDirection === 'down' 
    ? TrendingDown 
    : Minus

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-muted-foreground">{title}</p>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-64" side="top">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-2xl font-semibold mt-1">{value}</p>
        {(trend !== undefined || trendDirection) && (
          <div className={cn(
            'flex items-center gap-1 mt-1 text-xs',
            trendDirection === 'up' && 'text-olive',
            trendDirection === 'down' && 'text-terracotta',
            trendDirection === 'stable' && 'text-muted-foreground',
          )}>
            <TrendIcon className="h-3 w-3" />
            {trend !== undefined && (
              <span>
                {typeof trend === 'number'
                  ? `${trend >= 0 ? '+' : ''}${trend}%`
                  : trend}
              </span>
            )}
            {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
