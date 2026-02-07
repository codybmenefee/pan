import { CheckCircle, Clock } from 'lucide-react'
import { ScreenshotFrame } from '../ScreenshotFrame'

export function StatusStep() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Visual - screenshot or fallback */}
      <ScreenshotFrame
        src="/tutorial/pasture-status.png"
        alt="Pasture cards showing status badges"
        className="w-full"
      />

      {/* Content */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Know When to Move
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Each pasture gets a status based on vegetation health and rest days.
          We track recovery so you always know which pastures are ready for
          grazing.
        </p>
      </div>

      {/* Status badges explanation */}
      <div className="flex flex-wrap justify-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 px-3 py-2">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div className="text-left">
            <div className="text-sm font-medium text-green-700 dark:text-green-300">Ready</div>
            <div className="text-xs text-green-600/80 dark:text-green-400/80">NDVI 0.4+ &bull; 21+ days rest</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-3 py-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <div className="text-left">
            <div className="text-sm font-medium text-amber-700 dark:text-amber-300">Recovering</div>
            <div className="text-xs text-amber-600/80 dark:text-amber-400/80">Needs more rest time</div>
          </div>
        </div>
      </div>
    </div>
  )
}
