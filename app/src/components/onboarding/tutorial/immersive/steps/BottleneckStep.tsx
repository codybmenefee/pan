import { Brain, Footprints, HelpCircle, Clock, Route, Zap } from 'lucide-react'

export function BottleneckStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Zap className="h-5 w-5 text-terracotta" />
        <h2 className="text-sm font-bold text-terracotta uppercase tracking-wider">
          The Bottleneck
        </h2>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-6">
        Two barriers limit how much land you can manage
      </h1>

      {/* Two bottlenecks side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Decision fatigue */}
        <div className="bg-white border-2 border-terracotta/30 p-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-terracotta" />
            <span className="font-bold text-terracotta">Decision Fatigue</span>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            Tracking pasture status across your farm
          </p>

          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5 text-terracotta/70" />
              <span>"Which pasture is ready?"</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-terracotta/70" />
              <span>"How many rest days has P4 had?"</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t-2 border-border text-center">
            <span className="text-xs text-olive font-bold uppercase tracking-wider">OpenPasture solves this today</span>
          </div>
        </div>

        {/* Labor fatigue */}
        <div className="bg-white border-2 border-cobalt/30 p-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Footprints className="h-5 w-5 text-cobalt" />
            <span className="font-bold text-cobalt">Labor Fatigue</span>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            Physically moving animals between pastures
          </p>

          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Route className="h-3.5 w-3.5 text-cobalt/70" />
              <span>"Moving herd 3x per week"</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-cobalt/70" />
              <span>"Hours spent on rotation"</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t-2 border-border text-center">
            <span className="text-xs text-cobalt font-bold uppercase tracking-wider">Geo-collars coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
