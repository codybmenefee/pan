import { Leaf } from 'lucide-react'

export function HookStep() {
  return (
    <div className="max-w-2xl mx-auto text-center text-white">
      <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-6">
        {/* Compact grass illustration */}
        <div className="relative h-20 mb-4 overflow-hidden">
          <svg viewBox="0 0 400 70" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
            {[...Array(16)].map((_, i) => (
              <path
                key={i}
                d={`M${25 + i * 22} 70 Q${20 + i * 22} 40 ${25 + i * 22 + (i % 3 - 1) * 4} 15`}
                stroke="url(#grassGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
                style={{ animationDelay: `${i * 0.1}s`, animationDuration: '3s' }}
              />
            ))}
            <defs>
              <linearGradient id="grassGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#166534" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Main heading */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Leaf className="h-8 w-8 text-green-400" />
          <h1 className="text-4xl md:text-5xl font-bold">
            Grass-fed can win.
          </h1>
          <Leaf className="h-8 w-8 text-green-400 scale-x-[-1]" />
        </div>

        <p className="text-xl md:text-2xl text-white/80 mb-6">
          Here's how.
        </p>

        {/* Stats teaser */}
        <div className="flex justify-center gap-6 text-sm text-white/50">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-green-400">30%</span>
            <span className="text-xs">more forage</span>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-green-400">50%</span>
            <span className="text-xs">less labor</span>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-green-400">1</span>
            <span className="text-xs">daily decision</span>
          </div>
        </div>
      </div>
    </div>
  )
}
