import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        
        return (
          <div key={step} className="flex items-center">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
              isCompleted && 'bg-olive text-white',
              isCurrent && 'bg-primary text-primary-foreground',
              !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
            )}>
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={cn(
                'mx-2 h-0.5 w-8 sm:w-12',
                index < currentStep ? 'bg-olive' : 'bg-muted'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
