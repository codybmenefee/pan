
export function HookStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      {/* Compact grass illustration */}
      <div className="relative h-20 mb-4 overflow-hidden">
        <svg viewBox="0 0 400 70" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
          {[...Array(16)].map((_, i) => (
            <path
              key={i}
              d={`M${25 + i * 22} 70 Q${20 + i * 22} 40 ${25 + i * 22 + (i % 3 - 1) * 4} 15`}
              stroke="url(#grassGradientOC)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: '3s' }}
            />
          ))}
          <defs>
            <linearGradient id="grassGradientOC" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#4a6a2e" />
              <stop offset="100%" stopColor="#5a7a38" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main heading */}
      <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
        Grass-fed can win.
      </h1>

      <p className="text-xl md:text-2xl text-muted-foreground mb-6">
        Here's how.
      </p>

      {/* Stats teaser */}
      <div className="flex justify-center gap-6 text-sm text-muted-foreground border-t-2 border-border pt-5">
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-olive">30%</span>
          <span className="text-xs">more forage</span>
        </div>
        <div className="w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-olive">50%</span>
          <span className="text-xs">less labor</span>
        </div>
        <div className="w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-terracotta">1</span>
          <span className="text-xs">daily decision</span>
        </div>
      </div>
    </div>
  )
}
