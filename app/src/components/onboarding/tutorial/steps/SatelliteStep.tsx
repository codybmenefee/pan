import { Satellite } from 'lucide-react'
import { ScreenshotFrame } from '../ScreenshotFrame'

export function SatelliteStep() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Visual - screenshot or fallback */}
      <ScreenshotFrame
        src="/tutorial/map-ndvi.png"
        alt="Map showing NDVI vegetation health overlay"
        className="w-full"
      />

      {/* Content */}
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm text-blue-700 dark:text-blue-300">
          <Satellite className="h-4 w-4" />
          Updated every few days
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Satellite-Powered Insights
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          We use satellite imagery to measure vegetation health using NDVI
          (Normalized Difference Vegetation Index). See your pastures from
          space with colors showing grass density and health.
        </p>
      </div>

      {/* Color scale legend */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded bg-red-400" />
          <span className="text-xs text-muted-foreground">Bare</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded bg-yellow-400" />
          <span className="text-xs text-muted-foreground">Sparse</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded bg-green-500" />
          <span className="text-xs text-muted-foreground">Dense</span>
        </div>
      </div>
    </div>
  )
}
