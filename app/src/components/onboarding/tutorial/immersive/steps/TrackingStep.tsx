import { History, TrendingUp, BarChart3 } from 'lucide-react'

export function TrackingStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-white">
      {/* Header with backdrop */}
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <History className="h-5 w-5 text-purple-400" />
          <h2 className="text-sm font-medium text-purple-400 uppercase tracking-wider">
            Tracking
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          History, patterns, analytics
        </h1>

        <p className="text-base text-white/70">
          Every decision is logged. Watch your pasture health improve.
        </p>
      </div>

      {/* Analytics cards with solid backgrounds */}
      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
        {/* Grazing history */}
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-1.5 text-purple-400 mb-2 justify-center">
            <History className="h-4 w-4" />
            <span className="font-medium text-xs">Log</span>
          </div>
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-white/50 w-10">Today</span>
              <span className="text-white/70">P4</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-white/50 w-10">Jan 19</span>
              <span className="text-white/70">P4</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-white/50 w-10">Jan 18</span>
              <span className="text-white/70">P7</span>
            </div>
          </div>
        </div>

        {/* NDVI trend */}
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-1.5 text-green-400 mb-2 justify-center">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium text-xs">Trend</span>
          </div>
          <svg viewBox="0 0 100 50" className="w-full h-12">
            <path d="M 5 40 Q 25 38, 40 32 T 70 22 T 95 15" stroke="#22c55e" strokeWidth="2" fill="none" />
            <circle cx="5" cy="40" r="2" fill="#22c55e" />
            <circle cx="40" cy="32" r="2" fill="#22c55e" />
            <circle cx="70" cy="22" r="2" fill="#22c55e" />
            <circle cx="95" cy="15" r="2" fill="#22c55e" />
          </svg>
          <div className="text-[10px] text-white/50">Farm NDVI improving</div>
        </div>

        {/* Stats */}
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-1.5 text-blue-400 mb-2 justify-center">
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium text-xs">Stats</span>
          </div>
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-white/50">Approval</span>
                <span className="text-green-400">82%</span>
              </div>
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-white/50">Rest Days</span>
                <span className="text-blue-400">23</span>
              </div>
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '77%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
