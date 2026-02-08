import { Satellite, Cloud, MapPin, FileText, Brain, RefreshCw } from 'lucide-react'

export function SystemArchitectureDiagram() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-2">
        {/* Layer 1: Farm Data Hub */}
        <div className="border-2 border-olive/30 p-3 bg-olive-light">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-olive" />
            <h3 className="text-sm font-semibold">Farm Data Hub</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Satellite className="h-3 w-3 text-olive" />
              <span>Satellite imagery</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cloud className="h-3 w-3 text-olive" />
              <span>Weather data</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-olive" />
              <span>Paddock boundaries</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3 w-3 text-olive" />
              <span>Farmer notes</span>
            </div>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <div className="w-px h-3 bg-olive/50" />
        </div>

        {/* Layer 2: Decision Engine */}
        <div className="border-2 border-terracotta/30 p-3 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-terracotta" />
            <h3 className="text-sm font-semibold">Decision Engine</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Brain className="h-3 w-3 text-terracotta" />
            <span>Scores paddocks, generates daily grazing plans with confidence levels</span>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <div className="w-px h-3 bg-terracotta/30" />
        </div>

        {/* Layer 3: Learning System */}
        <div className="border-2 border-cobalt/30 p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cobalt" />
              <h3 className="text-sm font-semibold">Learning System</h3>
            </div>
            <span className="text-[9px] text-cobalt uppercase tracking-wider">Feedback Loop</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2">
            <RefreshCw className="h-3 w-3 text-cobalt mt-0.5 flex-shrink-0" />
            <span>Every farmer correction becomes training data -- teaching the AI what experienced farmers actually choose</span>
          </div>
          <div className="bg-olive-light p-2 mt-2 border border-border">
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-cobalt/50" />
                Farm state snapshot
              </span>
              <span className="text-cobalt">+</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-olive" />
                Farmer's choice
              </span>
              <span className="text-cobalt">=</span>
              <span className="flex items-center gap-1 font-medium">
                Training example
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm mt-4 font-medium">
        Decisions are the product. Not dashboards.
      </p>
    </div>
  )
}
