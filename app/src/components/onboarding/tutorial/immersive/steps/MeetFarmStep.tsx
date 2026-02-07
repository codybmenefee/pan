import { MapPin, Fence, Leaf } from 'lucide-react'

export function MeetFarmStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-white">
      {/* Header with backdrop */}
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-green-400" />
          <h2 className="text-sm font-medium text-green-400 uppercase tracking-wider">
            Meet the Farm
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome to "The Other Side" Farm
        </h1>

        <p className="text-base text-white/70">
          8 pastures in various stages of recovery
        </p>
      </div>

      {/* Farm visualization with solid background */}
      <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl p-4 border border-white/10 max-w-lg mx-auto mb-4">
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
              ready: { fill: '#166534', stroke: '#22c55e', text: '#4ade80' },
              almost: { fill: '#854d0e', stroke: '#eab308', text: '#facc15' },
              recovering: { fill: '#9a3412', stroke: '#f97316', text: '#fb923c' },
              grazed: { fill: '#991b1b', stroke: '#ef4444', text: '#f87171' },
            }
            const c = colors[p.status as keyof typeof colors]
            return (
              <g key={i}>
                <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="3" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" opacity="0.85" />
                <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 3} textAnchor="middle" fill={c.text} fontSize="10" fontWeight="bold">{p.name}</text>
              </g>
            )
          })}
          {/* Legend */}
          <g transform="translate(20, 105)">
            <circle cx="5" cy="5" r="4" fill="#22c55e" /><text x="14" y="8" fill="white" fontSize="8" opacity="0.7">Ready</text>
            <circle cx="75" cy="5" r="4" fill="#eab308" /><text x="84" y="8" fill="white" fontSize="8" opacity="0.7">Almost</text>
            <circle cx="155" cy="5" r="4" fill="#f97316" /><text x="164" y="8" fill="white" fontSize="8" opacity="0.7">Recovering</text>
            <circle cx="255" cy="5" r="4" fill="#ef4444" /><text x="264" y="8" fill="white" fontSize="8" opacity="0.7">Grazed</text>
          </g>
        </svg>
      </div>

      {/* Compact stats with solid background */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-2 border border-white/10 text-center">
          <Fence className="h-4 w-4 text-white/40 mx-auto mb-1" />
          <div className="text-lg font-bold">8</div>
          <div className="text-[10px] text-white/50">Pastures</div>
        </div>
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-2 border border-white/10 text-center">
          <Leaf className="h-4 w-4 text-white/40 mx-auto mb-1" />
          <div className="text-lg font-bold">142</div>
          <div className="text-[10px] text-white/50">Hectares</div>
        </div>
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-2 border border-white/10 text-center">
          <MapPin className="h-4 w-4 text-white/40 mx-auto mb-1" />
          <div className="text-lg font-bold">TN</div>
          <div className="text-[10px] text-white/50">Columbia</div>
        </div>
      </div>
    </div>
  )
}
