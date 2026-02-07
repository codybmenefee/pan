import { Brain, Footprints, HelpCircle, Clock, Route, Zap } from 'lucide-react'

export function BottleneckStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-white">
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-medium text-amber-400 uppercase tracking-wider">
            The Bottleneck
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Two barriers limit how much land you can manage
        </h1>
      </div>

      {/* Two bottlenecks side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Decision fatigue */}
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-amber-400" />
            <span className="font-medium text-amber-400">Decision Fatigue</span>
          </div>

          <p className="text-sm text-white/70 mb-3">
            Tracking pasture status across your farm
          </p>

          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <HelpCircle className="h-3.5 w-3.5 text-amber-400/70" />
              <span>"Which pasture is ready?"</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Clock className="h-3.5 w-3.5 text-amber-400/70" />
              <span>"How many rest days has P4 had?"</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 text-center">
            <span className="text-xs text-amber-400/80">OpenPasture solves this today</span>
          </div>
        </div>

        {/* Labor fatigue */}
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Footprints className="h-5 w-5 text-blue-400" />
            <span className="font-medium text-blue-400">Labor Fatigue</span>
          </div>

          <p className="text-sm text-white/70 mb-3">
            Physically moving animals between pastures
          </p>

          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Route className="h-3.5 w-3.5 text-blue-400/70" />
              <span>"Moving herd 3x per week"</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Clock className="h-3.5 w-3.5 text-blue-400/70" />
              <span>"Hours spent on rotation"</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 text-center">
            <span className="text-xs text-blue-400/80">Geo-collars coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
