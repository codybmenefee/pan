export function DecisionScaleDiagram() {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="border-2 border-border p-4 shadow-hard-sm">
        <h3 className="text-sm font-semibold mb-3 text-center">
          Decision Complexity vs. Herd Size
        </h3>

        {/* Chart area */}
        <div className="relative h-40 ml-4">
          {/* Y-axis label */}
          <div className="absolute -left-9 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground whitespace-nowrap origin-center">
            Decision Complexity
          </div>

          {/* Chart grid */}
          <div className="ml-2 h-full relative border-l border-b border-border">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-t border-border/50 w-full" />
              ))}
            </div>

            {/* Exponential curve (SVG) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4a6a2e" />
                  <stop offset="100%" stopColor="#a83a32" />
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
                stroke="#0047AB"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            </svg>

            {/* Threshold label */}
            <div className="absolute right-1 top-[25%] text-[10px] text-cobalt">
              Human capacity
            </div>

            {/* Zone labels */}
            <div className="absolute left-5 bottom-8 text-[10px] text-olive bg-white px-1.5 py-0.5 border border-border">
              Manageable
            </div>
            <div className="absolute right-[21%] top-2 text-[10px] text-terracotta bg-white px-1.5 py-0.5 border border-border">
              Execution collapse
            </div>
          </div>

          {/* X-axis label */}
          <div className="text-center text-[10px] text-muted-foreground mt-2 ml-2">
            Herd Size / Paddock Count
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          The biology can go further. Execution collapses first.
        </p>
      </div>
    </div>
  )
}
