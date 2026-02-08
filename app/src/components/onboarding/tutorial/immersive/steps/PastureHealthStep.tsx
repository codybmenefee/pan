import { Satellite, TrendingUp, Plus } from 'lucide-react'

export function PastureHealthStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Satellite className="h-5 w-5 text-cobalt" />
        <h2 className="text-sm font-bold text-cobalt uppercase tracking-wider">
          Pasture Health
        </h2>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">
        Satellite data as a starting point
      </h1>

      <p className="text-base text-muted-foreground mb-6">
        NDVI measures photosynthetic activity - a proxy for grass productivity.
      </p>

      {/* How it works */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Satellite measures</div>
          <div className="text-sm font-bold text-cobalt">Photosynthesis</div>
        </div>
        <div className="text-dark/30 font-bold">&rarr;</div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">We infer</div>
          <div className="text-sm font-bold text-olive">Grass productivity</div>
        </div>
        <div className="text-dark/30 font-bold">&rarr;</div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">AI recommends</div>
          <div className="text-sm font-bold text-terracotta">Optimal grazing</div>
        </div>
      </div>

      {/* NDVI gradient */}
      <div className="mb-6">
        <div className="h-4 overflow-hidden border border-border"
          style={{ background: 'linear-gradient(to right, #a83a32, #c06a62, #d4a574, #c0d0a8, #7a9a4e, #5a7a38, #4a6a2e)' }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Low activity</span>
          <span>High activity</span>
        </div>
      </div>

      {/* Improving over time */}
      <div className="grid md:grid-cols-2 gap-3 pt-5 border-t-2 border-border">
        <div className="flex items-start gap-2 text-left">
          <TrendingUp className="h-4 w-4 text-olive mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-bold">Learns from your decisions</div>
            <div className="text-xs text-muted-foreground">Recommendations improve as we understand your farm</div>
          </div>
        </div>
        <div className="flex items-start gap-2 text-left">
          <Plus className="h-4 w-4 text-cobalt mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-bold">More data sources coming</div>
            <div className="text-xs text-muted-foreground">Soil sensors, weather, and livestock tracking</div>
          </div>
        </div>
      </div>
    </div>
  )
}
