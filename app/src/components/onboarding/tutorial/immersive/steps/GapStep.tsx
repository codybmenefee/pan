import { AlertTriangle, TrendingDown } from 'lucide-react'

export function GapStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-white">
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-medium text-amber-400 uppercase tracking-wider">
            The Gap
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Continuous grazing wastes potential
        </h1>
      </div>

      {/* Single wide card showing the problem */}
      <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        {/* Pasture degradation visualization */}
        <div className="flex items-center justify-center gap-8 mb-4">
          {/* Before state - healthy */}
          <div className="text-center">
            <div className="text-xs text-white/50 mb-2">Year 1</div>
            <div className="w-24 h-16 rounded-lg overflow-hidden border border-white/20">
              <div className="w-full h-full bg-gradient-to-b from-green-500 to-green-700" />
            </div>
            <div className="text-xs text-green-400 mt-1">Healthy</div>
          </div>

          {/* Arrow */}
          <TrendingDown className="h-8 w-8 text-red-400" />

          {/* After state - degraded */}
          <div className="text-center">
            <div className="text-xs text-white/50 mb-2">Year 5</div>
            <div className="w-24 h-16 rounded-lg overflow-hidden border border-white/20">
              <div className="w-full h-full relative">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-700 to-amber-900" />
                <div className="absolute top-1 left-1 w-4 h-3 rounded-sm bg-green-600/60" />
                <div className="absolute bottom-2 right-2 w-5 h-4 rounded-sm bg-green-600/40" />
                <div className="absolute top-3 right-4 w-3 h-3 rounded-full bg-amber-950" />
                <div className="absolute bottom-4 left-3 w-4 h-3 rounded-full bg-amber-950" />
              </div>
            </div>
            <div className="text-xs text-red-400 mt-1">Degraded</div>
          </div>
        </div>

        {/* Impact stats in a row */}
        <div className="flex justify-center gap-6 pt-3 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">-40%</div>
            <div className="text-xs text-white/50">carrying capacity</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">+60%</div>
            <div className="text-xs text-white/50">feed costs</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">5yr</div>
            <div className="text-xs text-white/50">to recover</div>
          </div>
        </div>
      </div>
    </div>
  )
}
