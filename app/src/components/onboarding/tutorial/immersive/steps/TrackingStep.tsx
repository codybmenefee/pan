import { History, TrendingUp, BarChart3 } from 'lucide-react'

export function TrackingStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      <div className="flex items-center justify-center gap-2 mb-2">
        <History className="h-5 w-5 text-cobalt" />
        <h2 className="text-sm font-bold text-cobalt uppercase tracking-wider">
          Tracking
        </h2>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">
        History, patterns, analytics
      </h1>

      <p className="text-base text-muted-foreground mb-6">
        Every decision is logged. Watch your pasture health improve.
      </p>

      {/* Analytics cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Grazing history */}
        <div className="bg-white border-2 border-border p-3">
          <div className="flex items-center gap-1.5 text-terracotta mb-2 justify-center">
            <History className="h-4 w-4" />
            <span className="font-bold text-xs uppercase tracking-wider">Log</span>
          </div>
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-1.5 h-1.5 bg-terracotta" />
              <span className="text-muted-foreground w-10">Today</span>
              <span className="text-dark/70 font-bold">P4</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-1.5 h-1.5 bg-olive" />
              <span className="text-muted-foreground w-10">Jan 19</span>
              <span className="text-dark/70 font-bold">P4</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-1.5 h-1.5 bg-olive" />
              <span className="text-muted-foreground w-10">Jan 18</span>
              <span className="text-dark/70 font-bold">P7</span>
            </div>
          </div>
        </div>

        {/* NDVI trend */}
        <div className="bg-white border-2 border-border p-3">
          <div className="flex items-center gap-1.5 text-olive mb-2 justify-center">
            <TrendingUp className="h-4 w-4" />
            <span className="font-bold text-xs uppercase tracking-wider">Trend</span>
          </div>
          <svg viewBox="0 0 100 50" className="w-full h-12">
            <path d="M 5 40 Q 25 38, 40 32 T 70 22 T 95 15" stroke="#4a6a2e" strokeWidth="2" fill="none" />
            <circle cx="5" cy="40" r="2" fill="#4a6a2e" />
            <circle cx="40" cy="32" r="2" fill="#4a6a2e" />
            <circle cx="70" cy="22" r="2" fill="#4a6a2e" />
            <circle cx="95" cy="15" r="2" fill="#4a6a2e" />
          </svg>
          <div className="text-[10px] text-muted-foreground">Farm NDVI improving</div>
        </div>

        {/* Stats */}
        <div className="bg-white border-2 border-border p-3">
          <div className="flex items-center gap-1.5 text-cobalt mb-2 justify-center">
            <BarChart3 className="h-4 w-4" />
            <span className="font-bold text-xs uppercase tracking-wider">Stats</span>
          </div>
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-muted-foreground">Approval</span>
                <span className="text-olive font-bold">82%</span>
              </div>
              <div className="h-1.5 bg-olive-light overflow-hidden border border-olive/20">
                <div className="h-full bg-olive" style={{ width: '82%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-muted-foreground">Rest Days</span>
                <span className="text-cobalt font-bold">23</span>
              </div>
              <div className="h-1.5 bg-cobalt/10 overflow-hidden border border-cobalt/20">
                <div className="h-full bg-cobalt" style={{ width: '77%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
