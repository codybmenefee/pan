import { Sun, Leaf, Calendar, Brain } from 'lucide-react'

export function MorningBriefStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-white">
      {/* Header with backdrop */}
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sun className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-medium text-amber-400 uppercase tracking-wider">
            Morning Brief
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          One decision, every morning
        </h1>

        <p className="text-base text-white/70">
          AI analyzes your farm and recommends which pasture to graze today.
        </p>
      </div>

      {/* What the daily plan provides */}
      <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
              <Leaf className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-sm font-medium text-white mb-1">Best Pasture</div>
            <div className="text-xs text-white/50">Based on NDVI satellite data</div>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-sm font-medium text-white mb-1">Rest Periods</div>
            <div className="text-xs text-white/50">Tracks days since last grazed</div>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-sm font-medium text-white mb-1">Clear Reasoning</div>
            <div className="text-xs text-white/50">Explains why it chose this pasture</div>
          </div>
        </div>

        {/* Example recommendation */}
        <div className="border-t border-white/10 pt-4">
          <div className="text-xs text-white/40 uppercase mb-2">Example Recommendation</div>
          <div className="bg-green-900/30 rounded-lg p-3 border border-green-700/50 max-w-xs mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-white">East Ridge</span>
              <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded">88% match</span>
            </div>
            <div className="text-xs text-white/60">Highest NDVI + 24 days rest</div>
          </div>
        </div>
      </div>
    </div>
  )
}
