import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface LoadingStep {
  id: string
  label: string
  status: 'pending' | 'loading' | 'complete'
}

interface ProgressLoaderProps {
  steps: LoadingStep[]
  className?: string
}

export function ProgressLoader({ 
  steps, 
  className 
}: ProgressLoaderProps) {
  const completedCount = steps.filter(s => s.status === 'complete').length
  const progress = (completedCount / steps.length) * 100

  return (
    <div className={cn('flex flex-col items-center justify-center gap-6', className)}>
      <div className="w-full max-w-xs space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {completedCount} of {steps.length} steps complete
        </p>
      </div>

      <ul className="space-y-2 text-sm">
        {steps.map((step) => (
          <li 
            key={step.id}
            className={cn(
              'flex items-center gap-2',
              step.status === 'complete' && 'text-muted-foreground',
              step.status === 'loading' && 'text-foreground font-medium',
              step.status === 'pending' && 'text-muted-foreground/60'
            )}
          >
            {step.status === 'complete' ? (
              <Check className="h-4 w-4 text-olive" />
            ) : step.status === 'loading' ? (
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-muted-foreground/40" />
            )}
            {step.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
