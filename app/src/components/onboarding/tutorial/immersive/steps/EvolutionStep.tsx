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

      {/* Large pasture divided into paddocks */}
      <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl p-5 border border-white/10 max-w-lg mx-auto mb-4">
        {/* Single pasture with internal divisions */}
        <div className="border-2 border-amber-700 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 grid-rows-2">
            {[
              { id: '1', color: 'bg-red-900/80', label: 'Grazing' },
              { id: '2', color: 'bg-amber-900/60', label: '' },
              { id: '3', color: 'bg-amber-800/50', label: '' },
              { id: '4', color: 'bg-yellow-900/40', label: '' },
              { id: '5', color: 'bg-green-900/70', label: '' },
              { id: '6', color: 'bg-green-800/80', label: '' },
              { id: '7', color: 'bg-green-700/80', label: 'Ready' },
              { id: '8', color: 'bg-green-600/80', label: '' },
            ].map((paddock, i) => (
              <div
                key={paddock.id}
                className={`${paddock.color} h-14 flex items-center justify-center relative ${
                  i % 4 !== 3 ? 'border-r border-dashed border-amber-700/50' : ''
                } ${i < 4 ? 'border-b border-dashed border-amber-700/50' : ''}`}
              >
                <span className="text-[10px] text-white/60">{paddock.id}</span>
                {paddock.label && (
                  <span className="absolute bottom-1 text-[8px] text-white/80 font-medium">
                    {paddock.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow showing rotation */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-white/50">
          <span>Rotate through paddocks</span>
          <span className="text-green-400">1 → 2 → 3 → ... → 8 → 1</span>
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
