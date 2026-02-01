import { Satellite, TrendingUp, Plus } from 'lucide-react'

export function PastureHealthStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-white">
      {/* Header with backdrop */}
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Satellite className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-medium text-blue-400 uppercase tracking-wider">
            Pasture Health
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Satellite data as a starting point
        </h1>

        <p className="text-base text-white/70">
          NDVI measures photosynthetic activity - a proxy for grass productivity.
        </p>
      </div>

      {/* Main content */}
      <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        {/* How it works */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-xs text-white/50 mb-1">Satellite measures</div>
            <div className="text-sm font-medium text-blue-400">Photosynthesis</div>
          </div>
          <div className="text-white/30">&rarr;</div>
          <div className="text-center">
            <div className="text-xs text-white/50 mb-1">We infer</div>
            <div className="text-sm font-medium text-green-400">Grass productivity</div>
          </div>
          <div className="text-white/30">&rarr;</div>
          <div className="text-center">
            <div className="text-xs text-white/50 mb-1">AI recommends</div>
            <div className="text-sm font-medium text-amber-400">Optimal grazing</div>
          </div>
        </div>

        {/* NDVI gradient */}
        <div className="mb-4">
          <div className="h-4 rounded-lg overflow-hidden mb-1"
            style={{ background: 'linear-gradient(to right, #7f1d1d, #dc2626, #f97316, #eab308, #84cc16, #22c55e, #15803d)' }}
          />
          <div className="flex justify-between text-[10px] text-white/40">
            <span>Low activity</span>
            <span>High activity</span>
          </div>
        </div>

        {/* Improving over time */}
        <div className="border-t border-white/10 pt-4 grid md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2 text-left">
            <TrendingUp className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm text-white/80">Learns from your decisions</div>
              <div className="text-xs text-white/50">Recommendations improve as we understand your farm</div>
            </div>
          </div>
          <div className="flex items-start gap-2 text-left">
            <Plus className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm text-white/80">More data sources coming</div>
              <div className="text-xs text-white/50">Soil sensors, weather, and livestock tracking</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
