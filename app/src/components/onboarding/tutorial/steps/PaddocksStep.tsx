import { useEffect, useRef } from 'react'
import { Sparkles, Target } from 'lucide-react'
import confetti from 'canvas-confetti'
import { ScreenshotFrame } from '../ScreenshotFrame'

interface PaddocksStepProps {
  isActive?: boolean
}

export function PaddocksStep({ isActive = false }: PaddocksStepProps) {
  const hasTriggeredConfetti = useRef(false)

  useEffect(() => {
    if (isActive && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true

      // Fire confetti with a slight delay for dramatic effect
      const timer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#16a34a', '#4ade80', '#86efac'],
        })
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isActive])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Visual - screenshot */}
      <ScreenshotFrame
        src="/tutorial/paddock-highlight.png"
        alt="Map with paddock polygon highlighted"
        className="w-full"
      />

      {/* Content */}
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-50 dark:bg-purple-900/20 px-3 py-1 text-sm text-purple-700 dark:text-purple-300">
          <Target className="h-4 w-4" />
          Precision grazing
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Precision Grazing
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          AI draws paddock polygons covering ~20% of each pasture, rotating
          through to maximize recovery time. This precision approach keeps your
          pastures thriving.
        </p>
      </div>

      {/* Ready message */}
      <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-5 py-3 shadow-sm">
        <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
        <span className="font-medium text-green-700 dark:text-green-300">
          You're ready to start!
        </span>
      </div>
    </div>
  )
}
