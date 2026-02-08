import { AlertTriangle, TrendingDown } from 'lucide-react'

export function GapStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      <div className="flex items-center justify-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-terracotta" />
        <h2 className="text-sm font-bold text-terracotta uppercase tracking-wider">
          The Gap
        </h2>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-6">
        Continuous grazing wastes potential
      </h1>

      {/* Pasture degradation visualization */}
      <div className="flex items-center justify-center gap-8 mb-6">
        {/* Before state - healthy */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-2">Year 1</div>
          <div className="w-24 h-16 overflow-hidden border-2 border-olive">
            <div className="w-full h-full bg-gradient-to-b from-[#5a7a38] to-[#4a6a2e]" />
          </div>
          <div className="text-xs text-olive font-bold mt-1">Healthy</div>
        </div>

        {/* Arrow */}
        <TrendingDown className="h-8 w-8 text-terracotta" />

        {/* After state - degraded */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-2">Year 5</div>
          <div className="w-24 h-16 overflow-hidden border-2 border-terracotta">
            <div className="w-full h-full relative">
              <div className="absolute inset-0 bg-gradient-to-b from-olive-muted to-olive-muted" />
              <div className="absolute top-1 left-1 w-4 h-3 bg-olive-muted/60" />
              <div className="absolute bottom-2 right-2 w-5 h-4 bg-olive-muted/40" />
              <div className="absolute top-3 right-4 w-3 h-3 bg-terracotta" />
              <div className="absolute bottom-4 left-3 w-4 h-3 bg-terracotta" />
            </div>
          </div>
          <div className="text-xs text-terracotta font-bold mt-1">Degraded</div>
        </div>
      </div>

      {/* Impact stats in a row */}
      <div className="flex justify-center gap-6 pt-5 border-t-2 border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-terracotta">-40%</div>
          <div className="text-xs text-muted-foreground">carrying capacity</div>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center">
          <div className="text-2xl font-bold text-terracotta-muted">+60%</div>
          <div className="text-xs text-muted-foreground">feed costs</div>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center">
          <div className="text-2xl font-bold text-cobalt">5yr</div>
          <div className="text-xs text-muted-foreground">to recover</div>
        </div>
      </div>
    </div>
  )
}
