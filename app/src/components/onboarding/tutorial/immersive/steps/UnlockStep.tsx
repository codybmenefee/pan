import { Satellite, Cpu, MessageSquare } from 'lucide-react'

export function UnlockStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-white">
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Satellite className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-medium text-blue-400 uppercase tracking-wider">
            The Unlock
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Satellite today. Sensors + farmer inputs tomorrow.
        </h1>
      </div>

      {/* Compact flow diagram */}
      <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl p-4 border border-white/10 max-w-lg mx-auto mb-4">
        <svg viewBox="0 0 420 100" className="w-full h-24">
          {/* Satellite */}
          <g transform="translate(40, 25)">
            <rect x="-12" y="-4" width="24" height="16" rx="2" fill="#3b82f6" />
            <rect x="-28" y="0" width="16" height="8" rx="1" fill="#60a5fa" />
            <rect x="12" y="0" width="16" height="8" rx="1" fill="#60a5fa" />
            <path d="M 0 16 L 0 40" stroke="#60a5fa" strokeWidth="2" strokeDasharray="3,3" />
          </g>
          <text x="40" y="80" textAnchor="middle" fill="white" fontSize="9" opacity="0.6">Satellite</text>

          {/* Arrow */}
          <path d="M 80 50 L 130 50" stroke="#4ade80" strokeWidth="2" markerEnd="url(#arr)" />

          {/* AI */}
          <g transform="translate(170, 30)">
            <rect x="-25" y="-8" width="50" height="40" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
            <circle cx="-8" cy="5" r="3" fill="#a5b4fc" />
            <circle cx="8" cy="5" r="3" fill="#a5b4fc" />
            <circle cx="0" cy="16" r="3" fill="#a5b4fc" />
            <line x1="-8" y1="5" x2="0" y2="16" stroke="#a5b4fc" />
            <line x1="8" y1="5" x2="0" y2="16" stroke="#a5b4fc" />
          </g>
          <text x="170" y="80" textAnchor="middle" fill="white" fontSize="9" opacity="0.6">AI Analysis</text>

          {/* Arrow */}
          <path d="M 210 50 L 260 50" stroke="#4ade80" strokeWidth="2" markerEnd="url(#arr)" />

          {/* Recommendation */}
          <g transform="translate(310, 25)">
            <rect x="-35" y="0" width="70" height="45" rx="4" fill="#18181b" stroke="#4ade80" strokeWidth="2" />
            <text x="0" y="16" textAnchor="middle" fill="#4ade80" fontSize="8" fontWeight="bold">TODAY</text>
            <text x="0" y="28" textAnchor="middle" fill="white" fontSize="9">Graze P4</text>
            <text x="0" y="40" textAnchor="middle" fill="white" fontSize="7" opacity="0.6">East Ridge</text>
          </g>

          {/* Farmer */}
          <g transform="translate(390, 45)">
            <circle cx="0" cy="-8" r="8" fill="#f59e0b" />
            <path d="M -10 15 L 0 3 L 10 15" fill="#f59e0b" />
          </g>

          <defs>
            <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#4ade80" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Compact feature cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-blue-500/30">
          <Satellite className="h-6 w-6 text-blue-400 mx-auto mb-2" />
          <h3 className="font-medium text-sm mb-1">Satellite Data</h3>
          <p className="text-xs text-white/60">10m NDVI every 5 days</p>
        </div>
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-purple-500/30">
          <Cpu className="h-6 w-6 text-purple-400 mx-auto mb-2" />
          <h3 className="font-medium text-sm mb-1">AI Analysis</h3>
          <p className="text-xs text-white/60">Weighs all factors</p>
        </div>
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-green-500/30">
          <MessageSquare className="h-6 w-6 text-green-400 mx-auto mb-2" />
          <h3 className="font-medium text-sm mb-1">You Decide</h3>
          <p className="text-xs text-white/60">System learns from you</p>
        </div>
      </div>
    </div>
  )
}
