import { MapPin, Fence, Leaf } from 'lucide-react'

export function MeetFarmStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      <div className="flex items-center justify-center gap-2 mb-2">
        <MapPin className="h-5 w-5 text-olive" />
        <h2 className="text-sm font-bold text-olive uppercase tracking-wider">
          Meet the Farm
        </h2>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">
        Welcome to "The Other Side" Farm
      </h1>

      <p className="text-base text-muted-foreground mb-6">
        8 pastures in various stages of recovery
      </p>

      {/* Farm visualization */}
      <div className="max-w-lg mx-auto mb-6">
        <svg viewBox="0 0 340 130" className="w-full h-28">
          {[
            { x: 10, y: 10, w: 75, h: 35, status: 'ready', name: 'P1' },
            { x: 95, y: 10, w: 80, h: 40, status: 'ready', name: 'P2' },
            { x: 185, y: 10, w: 65, h: 35, status: 'almost', name: 'P3' },
            { x: 260, y: 10, w: 70, h: 38, status: 'almost', name: 'P4' },
            { x: 15, y: 55, w: 70, h: 35, status: 'recovering', name: 'P5' },
            { x: 95, y: 60, w: 75, h: 38, status: 'recovering', name: 'P6' },
            { x: 180, y: 55, w: 65, h: 40, status: 'grazed', name: 'P7' },
            { x: 255, y: 58, w: 70, h: 38, status: 'grazed', name: 'P8' },
          ].map((p, i) => {
            const colors = {
              ready: { fill: '#4a6a2e', stroke: '#5a7a38', text: '#f2f6ee' },
              almost: { fill: '#c0d0a8', stroke: '#4a6a2e', text: '#1a1e18' },
              recovering: { fill: '#d4a574', stroke: '#a83a32', text: '#1a1e18' },
              grazed: { fill: '#a83a32', stroke: '#8a2a22', text: '#f6f8f4' },
            }
            const c = colors[p.status as keyof typeof colors]
            return (
              <g key={i}>
                <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="0" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
                <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 3} textAnchor="middle" fill={c.text} fontSize="10" fontWeight="bold">{p.name}</text>
              </g>
            )
          })}
          {/* Legend */}
          <g transform="translate(20, 105)">
            <rect x="0" y="0" width="10" height="10" fill="#4a6a2e" stroke="#5a7a38" strokeWidth="1" /><text x="14" y="8" fill="#647060" fontSize="8">Ready</text>
            <rect x="70" y="0" width="10" height="10" fill="#c0d0a8" stroke="#4a6a2e" strokeWidth="1" /><text x="84" y="8" fill="#647060" fontSize="8">Almost</text>
            <rect x="150" y="0" width="10" height="10" fill="#d4a574" stroke="#a83a32" strokeWidth="1" /><text x="164" y="8" fill="#647060" fontSize="8">Recovering</text>
            <rect x="250" y="0" width="10" height="10" fill="#a83a32" stroke="#8a2a22" strokeWidth="1" /><text x="264" y="8" fill="#647060" fontSize="8">Grazed</text>
          </g>
        </svg>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-3 gap-3 pt-5 border-t-2 border-border max-w-xs mx-auto">
        <div className="text-center">
          <Fence className="h-4 w-4 text-olive mx-auto mb-1" />
          <div className="text-lg font-bold">8</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Pastures</div>
        </div>
        <div className="text-center">
          <Leaf className="h-4 w-4 text-olive mx-auto mb-1" />
          <div className="text-lg font-bold">142</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Hectares</div>
        </div>
        <div className="text-center">
          <MapPin className="h-4 w-4 text-terracotta mx-auto mb-1" />
          <div className="text-lg font-bold">TN</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Columbia</div>
        </div>
      </div>
    </div>
  )
}
