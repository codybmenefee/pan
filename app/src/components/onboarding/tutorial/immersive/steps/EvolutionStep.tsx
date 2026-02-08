import { Check, RefreshCw } from 'lucide-react'

export function EvolutionStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      <div className="flex items-center justify-center gap-2 mb-2">
        <RefreshCw className="h-5 w-5 text-olive" />
        <h2 className="text-sm font-bold text-olive uppercase tracking-wider">
          The Evolution
        </h2>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-6">
        Rotational grazing = better land efficiency
      </h1>

      {/* Large pasture divided into paddocks */}
      <div className="max-w-lg mx-auto mb-6">
        <div className="border-2 border-olive overflow-hidden">
          <div className="grid grid-cols-4 grid-rows-2">
            {[
              { id: '1', color: 'bg-terracotta/20', label: 'Grazing' },
              { id: '2', color: 'bg-terracotta/10', label: '' },
              { id: '3', color: 'bg-terracotta/5', label: '' },
              { id: '4', color: 'bg-olive-light', label: '' },
              { id: '5', color: 'bg-olive-muted/40', label: '' },
              { id: '6', color: 'bg-olive-muted/60', label: '' },
              { id: '7', color: 'bg-olive-muted/80', label: 'Ready' },
              { id: '8', color: 'bg-olive-muted', label: '' },
            ].map((paddock, i) => (
              <div
                key={paddock.id}
                className={`${paddock.color} h-14 flex items-center justify-center relative ${
                  i % 4 !== 3 ? 'border-r border-dashed border-olive/30' : ''
                } ${i < 4 ? 'border-b border-dashed border-olive/30' : ''}`}
              >
                <span className="text-[10px] text-dark/60 font-bold">{paddock.id}</span>
                {paddock.label && (
                  <span className="absolute bottom-1 text-[8px] text-dark/80 font-bold uppercase tracking-wider">
                    {paddock.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow showing rotation */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Rotate through paddocks</span>
          <span className="text-olive font-bold">1 &rarr; 2 &rarr; 3 &rarr; ... &rarr; 8 &rarr; 1</span>
        </div>
      </div>

      {/* Compact benefits */}
      <div className="grid grid-cols-3 gap-3 pt-5 border-t-2 border-border">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-olive mb-1">
            <Check className="h-4 w-4" />
            <span className="font-bold text-sm">Rest Period</span>
          </div>
          <p className="text-xs text-muted-foreground">Grass recovers between grazing</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-olive mb-1">
            <Check className="h-4 w-4" />
            <span className="font-bold text-sm">Even Use</span>
          </div>
          <p className="text-xs text-muted-foreground">All forage consumed efficiently</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-olive mb-1">
            <Check className="h-4 w-4" />
            <span className="font-bold text-sm">Soil Health</span>
          </div>
          <p className="text-xs text-muted-foreground">Natural fertilization</p>
        </div>
      </div>
    </div>
  )
}
