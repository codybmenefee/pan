export function EconomicProof() {
  return (
    <section className="py-12 bg-[#1a2429]" aria-labelledby="economic-proof-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-[#111719] to-[#111719]/50 border border-[#075056]/30 rounded-xl p-6 md:p-8">
            <div className="text-center space-y-5">
              <h2
                id="economic-proof-heading"
                className="text-2xl md:text-3xl font-bold text-[#FDF6E3] text-balance"
              >
                This Is How Pastured Livestock Wins
              </h2>

              <div className="space-y-1">
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#075056] to-[#FF5B04] bg-clip-text text-transparent">
                  $1,000+
                </p>
                <p className="text-base text-[#D3DBDD]">more per acre, per year</p>
              </div>

              <p className="text-sm text-[#D3DBDD] max-w-xl mx-auto">
                Through healthier soil, longer grazing seasons, and fewer inputs
              </p>

              {/* Comparison bars */}
              <div className="pt-4 space-y-4 max-w-md mx-auto" role="img" aria-label="Comparison of grazing methods showing continuous grazing at baseline, manual rotational at +$400/acre, and AI-optimized rotational at +$1,000+/acre">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#D3DBDD]">Continuous Grazing (Industrial)</span>
                    <span className="text-red-400">Baseline</span>
                  </div>
                  <div className="h-3 bg-[#1a2429] rounded-full overflow-hidden">
                    <div
                      className="h-full w-[30%] bg-gradient-to-r from-red-500/60 to-red-600/60 rounded-full transition-all duration-500"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#D3DBDD]">Manual Rotational</span>
                    <span className="text-[#F4D47C]">+$400/acre</span>
                  </div>
                  <div className="h-3 bg-[#1a2429] rounded-full overflow-hidden">
                    <div
                      className="h-full w-[55%] bg-gradient-to-r from-[#F4D47C]/60 to-[#F4D47C]/80 rounded-full transition-all duration-500"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#D3DBDD]">AI-Optimized Rotational</span>
                    <span className="text-[#FF5B04]">+$1,000+/acre</span>
                  </div>
                  <div className="h-3 bg-[#1a2429] rounded-full overflow-hidden">
                    <div
                      className="h-full w-[90%] bg-gradient-to-r from-[#075056] to-[#FF5B04] rounded-full transition-all duration-500"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#D3DBDD]/70 pt-2">
                Based on research comparing grazing management intensity and profitability
              </p>

              <p className="text-sm text-[#FF5B04]/80 font-medium">
                This is why we exist: to make the optimized tier accessible to every operation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
