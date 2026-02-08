import { Satellite, Cpu, MessageSquare } from 'lucide-react'

export function UnlockStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Satellite className="h-5 w-5 text-cobalt" />
        <h2 className="text-sm font-bold text-cobalt uppercase tracking-wider">
          The Unlock
        </h2>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-6">
        Satellite today. Sensors + farmer inputs tomorrow.
      </h1>

      {/* Compact flow diagram */}
      <div className="max-w-lg mx-auto mb-6">
        <svg viewBox="0 0 420 100" className="w-full h-24">
          {/* Satellite */}
          <g transform="translate(40, 25)">
            <rect x="-12" y="-4" width="24" height="16" rx="0" fill="#0047AB" />
            <rect x="-28" y="0" width="16" height="8" rx="0" fill="#4a7abf" />
            <rect x="12" y="0" width="16" height="8" rx="0" fill="#4a7abf" />
            <path d="M 0 16 L 0 40" stroke="#4a7abf" strokeWidth="2" strokeDasharray="3,3" />
          </g>
          <text x="40" y="80" textAnchor="middle" fill="#647060" fontSize="9">Satellite</text>

          {/* Arrow */}
          <path d="M 80 50 L 130 50" stroke="#4a6a2e" strokeWidth="2" markerEnd="url(#arrOC)" />

          {/* AI */}
          <g transform="translate(170, 30)">
            <rect x="-25" y="-8" width="50" height="40" rx="0" fill="#f2f6ee" stroke="#4a6a2e" strokeWidth="2" />
            <circle cx="-8" cy="5" r="3" fill="#4a6a2e" />
            <circle cx="8" cy="5" r="3" fill="#4a6a2e" />
            <circle cx="0" cy="16" r="3" fill="#4a6a2e" />
            <line x1="-8" y1="5" x2="0" y2="16" stroke="#4a6a2e" />
            <line x1="8" y1="5" x2="0" y2="16" stroke="#4a6a2e" />
          </g>
          <text x="170" y="80" textAnchor="middle" fill="#647060" fontSize="9">AI Analysis</text>

          {/* Arrow */}
          <path d="M 210 50 L 260 50" stroke="#4a6a2e" strokeWidth="2" markerEnd="url(#arrOC)" />

          {/* Recommendation */}
          <g transform="translate(310, 25)">
            <rect x="-35" y="0" width="70" height="45" rx="0" fill="#ffffff" stroke="#4a6a2e" strokeWidth="2" />
            <text x="0" y="16" textAnchor="middle" fill="#4a6a2e" fontSize="8" fontWeight="bold">TODAY</text>
            <text x="0" y="28" textAnchor="middle" fill="#1a1e18" fontSize="9">Graze P4</text>
            <text x="0" y="40" textAnchor="middle" fill="#647060" fontSize="7">East Ridge</text>
          </g>

          <defs>
            <marker id="arrOC" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#4a6a2e" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Compact feature cards */}
      <div className="grid grid-cols-3 gap-3 pt-5 border-t-2 border-border">
        <div className="text-center">
          <Satellite className="h-6 w-6 text-cobalt mx-auto mb-2" />
          <h3 className="font-bold text-sm mb-1">Satellite Data</h3>
          <p className="text-xs text-muted-foreground">10m every 5 days</p>
          <p className="text-xs text-cobalt font-bold mt-1">Daily 3m coming soon</p>
        </div>
        <div className="text-center">
          <Cpu className="h-6 w-6 text-olive mx-auto mb-2" />
          <h3 className="font-bold text-sm mb-1">AI Analysis</h3>
          <p className="text-xs text-muted-foreground">Weighs all factors</p>
        </div>
        <div className="text-center">
          <MessageSquare className="h-6 w-6 text-terracotta mx-auto mb-2" />
          <h3 className="font-bold text-sm mb-1">You Decide</h3>
          <p className="text-xs text-muted-foreground">System learns from you</p>
        </div>
      </div>
    </div>
  )
}
