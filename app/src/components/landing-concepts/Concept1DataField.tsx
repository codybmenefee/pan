import { ArrowRight, Satellite, Loader2, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Concept1DataField() {
  const [ndviValue, setNdviValue] = useState(0.72)
  const [activeMetric, setActiveMetric] = useState<'ndvi' | 'evi' | 'ndwi'>('ndvi')

  useEffect(() => {
    const interval = setInterval(() => {
      setNdviValue((prev) => {
        const delta = (Math.random() - 0.5) * 0.02
        return Math.max(0, Math.min(1, prev + delta))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#2a2520] text-[#e8dcc8] font-mono">
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .data-grid {
          background-image:
            linear-gradient(rgba(232, 220, 200, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232, 220, 200, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .glitch {
          animation: glitch 3s infinite;
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          33% { transform: translate(-1px, 1px); }
          66% { transform: translate(1px, -1px); }
        }
      `}</style>

      {/* Header - Technical Grid */}
      <header className="border-b border-[#e8dcc8]/20 bg-[#1f1a16] data-grid">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#7a9b3d] flex items-center justify-center">
              <Satellite className="w-5 h-5 text-[#1f1a16]" />
            </div>
            <span className="font-bold text-lg tracking-wider" style={{ fontFamily: 'Space Mono' }}>
              OPENPASTURE
            </span>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="opacity-50">SYSTEM_STATUS: ONLINE</span>
            <span className="opacity-50">LAT: 45.5231° LONG: -122.6765°</span>
          </div>
        </div>
      </header>

      {/* Hero - Data First */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="space-y-8">
            <div className="inline-block px-3 py-1 bg-[#7a9b3d]/20 border border-[#7a9b3d] text-[#7a9b3d] text-xs">
              SENTINEL-2 IMAGERY × AI DECISION ENGINE
            </div>

            <h1
              className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
              style={{ fontFamily: 'Space Mono' }}
            >
              SATELLITE DATA.
              <br />
              <span className="text-[#7a9b3d]">FIELD DECISIONS.</span>
              <br />
              ZERO GUESSWORK.
            </h1>

            <p className="text-lg text-[#e8dcc8]/70 leading-relaxed max-w-xl">
              Every morning, OpenPasture processes multispectral satellite imagery of your farm and
              delivers a single recommendation: which pasture to graze today, with confidence score
              and reasoning included.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="px-6 py-3 bg-[#7a9b3d] text-[#1f1a16] font-bold hover:bg-[#8db145] transition-colors flex items-center justify-center gap-2 group">
                ACCESS DEMO SYSTEM
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-6 py-3 border border-[#e8dcc8]/30 hover:bg-[#e8dcc8]/5 transition-colors">
                VIEW ARCHITECTURE
              </button>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#e8dcc8]/20">
              <div>
                <div className="text-2xl font-bold text-[#7a9b3d]">10m</div>
                <div className="text-xs opacity-50">RESOLUTION</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#7a9b3d]">5d</div>
                <div className="text-xs opacity-50">REVISIT TIME</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#7a9b3d]">13</div>
                <div className="text-xs opacity-50">SPECTRAL BANDS</div>
              </div>
            </div>
          </div>

          {/* Right: Live Data Visualization */}
          <div className="space-y-4">
            {/* Metric Selector */}
            <div className="flex gap-2 mb-4">
              {(['ndvi', 'evi', 'ndwi'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`px-4 py-2 text-xs font-bold transition-colors ${
                    activeMetric === metric
                      ? 'bg-[#7a9b3d] text-[#1f1a16]'
                      : 'bg-[#1f1a16] text-[#e8dcc8]/50 hover:text-[#e8dcc8]'
                  }`}
                >
                  {metric.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Main Display */}
            <div className="bg-[#1f1a16] border border-[#e8dcc8]/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs opacity-50">VEGETATION INDEX</span>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-[#7a9b3d]" />
                  <span className="text-xs text-[#7a9b3d]">LIVE</span>
                </div>
              </div>

              {/* Large NDVI Value */}
              <div className="text-7xl font-bold text-[#7a9b3d] mb-2 glitch">
                {ndviValue.toFixed(3)}
              </div>

              <div className="text-sm mb-6 opacity-70">
                PASTURE_07 | SENTINEL-2 L2A | 2024-02-06T18:32:14Z
              </div>

              {/* Bar Chart */}
              <div className="space-y-2">
                {[
                  { label: 'PASTURE_01', value: 0.45 },
                  { label: 'PASTURE_02', value: 0.62 },
                  { label: 'PASTURE_03', value: 0.38 },
                  { label: 'PASTURE_04', value: 0.71 },
                  { label: 'PASTURE_05', value: 0.55 },
                  { label: 'PASTURE_06', value: 0.49 },
                  { label: 'PASTURE_07', value: ndviValue },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs w-24 opacity-50">{item.label}</span>
                    <div className="flex-1 h-6 bg-[#2a2520] relative">
                      <div
                        className="h-full bg-[#7a9b3d] transition-all duration-500"
                        style={{ width: `${item.value * 100}%` }}
                      />
                    </div>
                    <span className="text-xs w-12 text-right">{item.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation Output */}
            <div className="bg-[#7a9b3d]/10 border border-[#7a9b3d] p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-[#7a9b3d] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm mb-1">RECOMMENDATION: PASTURE_07</div>
                  <div className="text-xs opacity-70 leading-relaxed">
                    Vegetation index shows optimal recovery. 14-day rest period complete. Soil
                    moisture adequate (NDWI: 0.32). Confidence: 87%.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[#e8dcc8]/20">
        <div className="grid md:grid-cols-3 gap-px bg-[#e8dcc8]/20">
          {[
            {
              title: 'MULTISPECTRAL ANALYSIS',
              description:
                'Process NIR, Red, Blue, and SWIR bands from Sentinel-2. Extract vegetation health, moisture stress, and forage availability indicators.',
              metric: 'NDVI | EVI | NDWI',
            },
            {
              title: 'DAILY RECOMMENDATIONS',
              description:
                'AI analyzes time-series trends, recovery periods, and current conditions to suggest optimal grazing location with confidence scoring.',
              metric: 'CONFIDENCE: 85%+',
            },
            {
              title: 'PLAIN-LANGUAGE OUTPUT',
              description:
                'Technical data translated into clear grazing instructions. Override or approve with natural feedback. You stay in control.',
              metric: 'USER_CONTROL: TRUE',
            },
          ].map((feature, idx) => (
            <div key={idx} className="bg-[#1f1a16] p-8 group hover:bg-[#252018] transition-colors">
              <div className="text-xs text-[#7a9b3d] mb-4 font-bold">{`[${String(idx + 1).padStart(2, '0')}]`}</div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Space Mono' }}>
                {feature.title}
              </h3>
              <p className="text-sm text-[#e8dcc8]/70 mb-6 leading-relaxed">{feature.description}</p>
              <div className="text-xs text-[#7a9b3d] font-bold opacity-50 group-hover:opacity-100 transition-opacity">
                {feature.metric}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Specs */}
      <section className="bg-[#1f1a16] border-t border-[#e8dcc8]/20">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-12" style={{ fontFamily: 'Space Mono' }}>
            TECHNICAL SPECIFICATIONS
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-sm font-bold mb-4 text-[#7a9b3d]">DATA SOURCE</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between border-b border-[#e8dcc8]/10 pb-2">
                  <span className="opacity-70">Satellite Platform</span>
                  <span>Sentinel-2 MSI</span>
                </li>
                <li className="flex justify-between border-b border-[#e8dcc8]/10 pb-2">
                  <span className="opacity-70">Spatial Resolution</span>
                  <span>10m–20m</span>
                </li>
                <li className="flex justify-between border-b border-[#e8dcc8]/10 pb-2">
                  <span className="opacity-70">Temporal Resolution</span>
                  <span>5 days (2-satellite constellation)</span>
                </li>
                <li className="flex justify-between border-b border-[#e8dcc8]/10 pb-2">
                  <span className="opacity-70">Processing Level</span>
                  <span>L2A (Surface Reflectance)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-4 text-[#7a9b3d]">DECISION ENGINE</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between border-b border-[#e8dcc8]/10 pb-2">
                  <span className="opacity-70">Recommendation Cadence</span>
                  <span>Daily (morning briefing)</span>
                </li>
                <li className="flex justify-between border-b border-[#e8dcc8]/10 pb-2">
                  <span className="opacity-70">Input Signals</span>
                  <span>NDVI, EVI, NDWI, time-series trends</span>
                </li>
                <li className="flex justify-between border-b border-[#e8dcc8]/10 pb-2">
                  <span className="opacity-70">Confidence Scoring</span>
                  <span>0–100% with reasoning</span>
                </li>
                <li className="flex justify-between border-b border-[#e8dcc8]/10 pb-2">
                  <span className="opacity-70">User Override</span>
                  <span>Natural language feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#e8dcc8]/20 data-grid">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Space Mono' }}>
            READY TO OPERATIONALIZE YOUR GRAZING DECISIONS?
          </h2>
          <p className="text-lg opacity-70 mb-8 max-w-2xl mx-auto">
            Join the beta program and get early access to satellite-driven grazing intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-[#7a9b3d] text-[#1f1a16] font-bold hover:bg-[#8db145] transition-colors flex items-center justify-center gap-2 group">
              REQUEST BETA ACCESS
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border border-[#e8dcc8]/30 hover:bg-[#e8dcc8]/5 transition-colors">
              VIEW DOCUMENTATION
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8dcc8]/20 bg-[#1f1a16]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
            <div>© 2024 OPENPASTURE — APACHE 2.0 LICENSE</div>
            <div className="flex gap-6">
              <a href="#" className="hover:opacity-100 transition-opacity">
                DOCUMENTATION
              </a>
              <a href="#" className="hover:opacity-100 transition-opacity">
                GITHUB
              </a>
              <a href="#" className="hover:opacity-100 transition-opacity">
                API REFERENCE
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
