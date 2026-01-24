export function DecisionScaleDiagram() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
        <h3 className="text-lg font-semibold text-slate-300 mb-6 text-center">
          Decision Complexity vs. Herd Size
        </h3>

        {/* Chart area */}
        <div className="relative h-64">
          {/* Y-axis label */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-500 whitespace-nowrap">
            Decision Complexity
          </div>

          {/* Chart grid */}
          <div className="ml-8 h-full relative border-l border-b border-slate-700">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-t border-slate-800/50 w-full" />
              ))}
            </div>

            {/* Exponential curve (SVG) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <path
                d="M 5 95 Q 30 90, 50 70 Q 70 45, 85 15 L 95 5"
                fill="none"
                stroke="url(#curveGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Threshold line */}
              <line
                x1="0"
                y1="35"
                x2="100"
                y2="35"
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            </svg>

            {/* Threshold label */}
            <div className="absolute right-2 top-[30%] text-xs text-amber-400">
              Human capacity
            </div>

            {/* Zone labels */}
            <div className="absolute left-4 bottom-4 text-xs text-emerald-400">
              Manageable
            </div>
            <div className="absolute right-4 top-4 text-xs text-red-400">
              Execution collapse
            </div>
          </div>

          {/* X-axis label */}
          <div className="text-center text-xs text-slate-500 mt-2 ml-8">
            Herd Size / Paddock Count
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          The biology can go further. Execution collapses first.
        </p>
      </div>
    </div>
  )
}
