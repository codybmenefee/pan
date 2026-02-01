import { Check, RefreshCw } from 'lucide-react'

export function EvolutionStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-white">
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <RefreshCw className="h-5 w-5 text-green-400" />
          <h2 className="text-sm font-medium text-green-400 uppercase tracking-wider">
            The Evolution
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Rotational grazing = better land efficiency
        </h1>
      </div>

      {/* Compact rotation diagram */}
      <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl p-5 border border-white/10 max-w-lg mx-auto mb-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'P1', status: 'active', progress: 15 },
            { id: 'P2', status: 'recovering', progress: 40 },
            { id: 'P3', status: 'recovering', progress: 55 },
            { id: 'P4', status: 'recovering', progress: 70 },
            { id: 'P5', status: 'ready', progress: 100 },
            { id: 'P6', status: 'ready', progress: 100 },
            { id: 'P7', status: 'ready', progress: 100 },
            { id: 'P8', status: 'ready', progress: 100 },
          ].map((paddock) => {
            const isActive = paddock.status === 'active'
            const isRecovering = paddock.status === 'recovering'
            const bgColor = isActive ? 'bg-green-800' : isRecovering ? 'bg-zinc-700' : 'bg-green-900'
            const borderColor = isActive ? 'border-green-400' : 'border-zinc-600'
            const barColor = isActive ? 'bg-red-500' : isRecovering ? 'bg-amber-500' : 'bg-green-500'

            return (
              <div
                key={paddock.id}
                className={`${bgColor} ${borderColor} border rounded-md p-2`}
              >
                <div className="text-xs text-white/80 text-center mb-1">{paddock.id}</div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full`}
                    style={{ width: `${paddock.progress}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-white/50">Grazing now</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-white/50">Recovering</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-white/50">Ready</span>
          </div>
        </div>
      </div>

      {/* Compact benefits */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-center gap-1.5 text-green-400 mb-1">
            <Check className="h-4 w-4" />
            <span className="font-medium text-sm">Rest Period</span>
          </div>
          <p className="text-xs text-white/60">Grass recovers between grazing</p>
        </div>
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-center gap-1.5 text-green-400 mb-1">
            <Check className="h-4 w-4" />
            <span className="font-medium text-sm">Even Use</span>
          </div>
          <p className="text-xs text-white/60">All forage consumed efficiently</p>
        </div>
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-center gap-1.5 text-green-400 mb-1">
            <Check className="h-4 w-4" />
            <span className="font-medium text-sm">Soil Health</span>
          </div>
          <p className="text-xs text-white/60">Natural fertilization</p>
        </div>
      </div>
    </div>
  )
}
