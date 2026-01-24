import { Satellite, Cloud, MapPin, FileText, Brain, RefreshCw } from 'lucide-react'

export function SystemArchitectureDiagram() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-4">
        {/* Layer 1: Farm Data Hub */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-lg font-semibold text-slate-100">Farm Data Hub</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Satellite className="h-4 w-4 text-emerald-400" />
              <span>Satellite imagery</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Cloud className="h-4 w-4 text-emerald-400" />
              <span>Weather data</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>GPS tracking</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Farmer notes</span>
            </div>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <div className="w-px h-6 bg-gradient-to-b from-slate-700 to-slate-600" />
        </div>

        {/* Layer 2: Decision Engine */}
        <div className="bg-slate-900/80 border border-teal-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <h3 className="text-lg font-semibold text-slate-100">Decision Engine</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Brain className="h-5 w-5 text-teal-400" />
            <span>Scores paddocks, generates daily grazing plans with confidence levels</span>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <div className="w-px h-6 bg-gradient-to-b from-slate-600 to-slate-500" />
        </div>

        {/* Layer 3: Learning System */}
        <div className="bg-slate-900/80 border border-amber-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="text-lg font-semibold text-slate-100">Learning System</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <RefreshCw className="h-5 w-5 text-amber-400" />
            <span>Improves from farmer feedback, tracks outcomes, adapts to your land</span>
          </div>
        </div>
      </div>

      <p className="text-center text-lg text-slate-300 mt-8 font-medium">
        Decisions are the product. Not dashboards.
      </p>
    </div>
  )
}
