import { Sun, Leaf, Calendar, Brain } from 'lucide-react'

export function MorningBriefStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Sun className="h-5 w-5 text-terracotta" />
        <h2 className="text-sm font-bold text-terracotta uppercase tracking-wider">
          Morning Brief
        </h2>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">
        One decision, every morning
      </h1>

      <p className="text-base text-muted-foreground mb-6">
        AI analyzes your farm and recommends which pasture to graze today.
      </p>

      {/* What the daily plan provides */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="w-10 h-10 bg-olive-light border-2 border-olive/30 flex items-center justify-center mx-auto mb-2">
            <Leaf className="h-5 w-5 text-olive" />
          </div>
        <div className="text-sm font-bold mb-1">Best Pasture</div>
        <div className="text-xs text-muted-foreground">Based on NDVI satellite data</div>
      </div>

      <div className="text-center">
        <div className="w-10 h-10 bg-cobalt/10 border-2 border-cobalt/30 flex items-center justify-center mx-auto mb-2">
          <Calendar className="h-5 w-5 text-cobalt" />
        </div>
        <div className="text-sm font-bold mb-1">Rest Periods</div>
        <div className="text-xs text-muted-foreground">Tracks days since last grazed</div>
      </div>

      <div className="text-center">
        <div className="w-10 h-10 bg-terracotta/10 border-2 border-terracotta/30 flex items-center justify-center mx-auto mb-2">
          <Brain className="h-5 w-5 text-terracotta" />
        </div>
        <div className="text-sm font-bold mb-1">Clear Reasoning</div>
        <div className="text-xs text-muted-foreground">Explains why it chose this pasture</div>
      </div>
    </div>

      {/* Example recommendation */}
      <div className="border-t-2 border-border pt-5">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Example Recommendation</div>
        <div className="bg-white border-2 border-olive/40 p-3 max-w-xs mx-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold">East Ridge</span>
            <span className="text-[10px] bg-olive text-white px-1.5 py-0.5 font-bold uppercase tracking-wider">88% match</span>
          </div>
          <div className="text-xs text-muted-foreground">Highest NDVI + 24 days rest</div>
        </div>
      </div>
    </div>
  )
}
