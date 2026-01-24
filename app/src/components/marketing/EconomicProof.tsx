export function EconomicProof() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-10 md:p-14">
            <div className="text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
                The Economics Are Clear
              </h2>

              <div className="space-y-2">
                <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  $1,000+
                </p>
                <p className="text-xl text-slate-400">
                  more per acre, per year
                </p>
              </div>

              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Through healthier soil, longer grazing seasons, and fewer inputs
              </p>

              {/* Comparison bars */}
              <div className="pt-8 space-y-6 max-w-xl mx-auto">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Continuous Grazing</span>
                    <span className="text-red-400">Baseline</span>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[30%] bg-gradient-to-r from-red-500/60 to-red-600/60 rounded-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Manual Rotational</span>
                    <span className="text-amber-400">+$400/acre</span>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[55%] bg-gradient-to-r from-amber-500/60 to-amber-600/60 rounded-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">AI-Optimized Rotational</span>
                    <span className="text-emerald-400">+$1,000+/acre</span>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[90%] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 pt-4">
                Based on research comparing grazing management intensity and profitability
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
