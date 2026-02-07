import { ArrowRight, Zap, Cpu, Radio, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Concept3IntelligenceLayer() {
  const [scanProgress, setScanProgress] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanProgress((prev) => (prev >= 100 ? 0 : prev + 1))
    }, 50)

    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3)
    }, 4000)

    return () => {
      clearInterval(scanInterval)
      clearInterval(featureInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden">
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-display { font-family: 'Orbitron', sans-serif; }
        .font-body { font-family: 'Rajdhani', sans-serif; }

        .holographic-border {
          background: linear-gradient(90deg, #00ff87, #60efff, #00ff87);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .glow-green {
          box-shadow: 0 0 20px rgba(0, 255, 135, 0.3), 0 0 40px rgba(0, 255, 135, 0.1);
        }

        .glow-cyan {
          box-shadow: 0 0 20px rgba(96, 239, 255, 0.3), 0 0 40px rgba(96, 239, 255, 0.1);
        }

        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ff87, transparent);
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }

        .grid-bg {
          background-image:
            linear-gradient(rgba(0, 255, 135, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 135, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .diagonal-cut {
          clip-path: polygon(0 0, 100% 5%, 100% 100%, 0 95%);
        }

        .slide-in-right {
          animation: slideInRight 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#00ff87]/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00ff87] to-[#60efff] glow-green" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#00ff87] to-[#60efff] animate-pulse opacity-50" />
              </div>
              <div>
                <div className="font-display text-xl font-bold tracking-wider">OPENPASTURE</div>
                <div className="font-body text-xs text-[#00ff87] uppercase">Intelligence Layer</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 font-body text-sm font-medium">
              <a href="#platform" className="hover:text-[#00ff87] transition-colors">
                PLATFORM
              </a>
              <a href="#technology" className="hover:text-[#00ff87] transition-colors">
                TECHNOLOGY
              </a>
              <a href="#access" className="hover:text-[#00ff87] transition-colors">
                ACCESS
              </a>
              <button className="px-5 py-2 bg-gradient-to-r from-[#00ff87] to-[#60efff] text-[#0a0e1a] font-bold hover:shadow-lg hover:shadow-[#00ff87]/50 transition-all">
                DEPLOY
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero - Diagonal Asymmetric */}
      <section className="relative min-h-screen flex items-center pt-20 grid-bg">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#00ff87] opacity-5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#60efff] opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left: Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#00ff87]/30 bg-[#00ff87]/5 holographic-border slide-in-right">
              <Zap className="w-4 h-4 text-[#00ff87]" />
              <span className="font-body text-sm font-medium text-[#00ff87] uppercase tracking-wider">
                Satellite × AI × Decision Science
              </span>
            </div>

            <h1 className="font-display text-5xl lg:text-7xl font-black leading-none slide-in-right delay-1">
              PRECISION
              <br />
              <span className="text-[#00ff87]">GRAZING</span>
              <br />
              <span className="bg-gradient-to-r from-[#00ff87] to-[#60efff] bg-clip-text text-transparent">
                INTELLIGENCE
              </span>
            </h1>

            <p className="font-body text-xl text-gray-300 leading-relaxed max-w-xl slide-in-right delay-2">
              Deploy satellite-derived land intelligence for your adaptive grazing operation.
              Real-time NDVI analysis. AI-powered recommendations. Zero guesswork.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 slide-in-right delay-3">
              <button className="px-8 py-4 bg-gradient-to-r from-[#00ff87] to-[#60efff] text-[#0a0e1a] font-body font-bold text-lg hover:scale-105 transition-transform glow-green flex items-center justify-center gap-2 group">
                INITIALIZE SYSTEM
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 border-2 border-[#00ff87] text-[#00ff87] font-body font-bold text-lg hover:bg-[#00ff87]/10 transition-colors flex items-center justify-center gap-2">
                <Radio className="w-5 h-5" />
                VIEW ARCHITECTURE
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 pt-8 slide-in-right delay-4">
              <div className="border border-[#00ff87]/30 bg-[#00ff87]/5 p-4">
                <div className="font-display text-3xl font-bold text-[#00ff87]">10m</div>
                <div className="font-body text-xs text-gray-400 uppercase tracking-wide">
                  Resolution
                </div>
              </div>
              <div className="border border-[#60efff]/30 bg-[#60efff]/5 p-4">
                <div className="font-display text-3xl font-bold text-[#60efff]">5d</div>
                <div className="font-body text-xs text-gray-400 uppercase tracking-wide">
                  Revisit
                </div>
              </div>
              <div className="border border-[#00ff87]/30 bg-[#00ff87]/5 p-4">
                <div className="font-display text-3xl font-bold text-[#00ff87]">24/7</div>
                <div className="font-body text-xs text-gray-400 uppercase tracking-wide">
                  Analysis
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Display */}
          <div className="relative">
            {/* Main Terminal */}
            <div className="border border-[#00ff87]/30 bg-[#0a0e1a]/80 backdrop-blur-sm glow-green relative overflow-hidden">
              <div className="scan-line" />

              {/* Terminal Header */}
              <div className="border-b border-[#00ff87]/30 bg-[#00ff87]/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#00ff87]" />
                  <span className="font-body text-sm font-medium">DECISION_ENGINE_V2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
                  <span className="font-body text-xs text-gray-400">ACTIVE</span>
                </div>
              </div>

              {/* Terminal Content */}
              <div className="p-6 font-mono text-sm space-y-3">
                <div className="flex gap-2">
                  <span className="text-[#00ff87]">$</span>
                  <span className="text-gray-300">analyze --farm-id=RANCH_047</span>
                </div>
                <div className="text-[#60efff]">&gt; Initializing satellite query...</div>
                <div className="text-gray-400">&gt; Sentinel-2 L2A | Scene: 20240206</div>
                <div className="text-gray-400">&gt; Computing NDVI, EVI, NDWI...</div>

                {/* Progress Bar */}
                <div className="py-2">
                  <div className="h-2 bg-[#00ff87]/20 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00ff87] to-[#60efff] holographic-border transition-all duration-100"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Processing... {scanProgress}%
                  </div>
                </div>

                <div className="text-[#00ff87] pt-2">&gt; RECOMMENDATION GENERATED</div>
                <div className="bg-[#00ff87]/10 border border-[#00ff87]/30 p-4 mt-2">
                  <div className="font-body font-bold text-base mb-2 text-[#00ff87]">
                    PASTURE_07 | CONFIDENCE: 91%
                  </div>
                  <div className="text-sm text-gray-300 leading-relaxed">
                    Vegetation index optimal (NDVI: 0.82). 14-day recovery complete. Soil moisture
                    adequate. Recommended grazing window: 3-5 days.
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Data Cards */}
            <div className="absolute -right-4 top-20 w-48 border border-[#60efff]/30 bg-[#0a0e1a]/90 backdrop-blur-sm p-4 glow-cyan">
              <div className="font-body text-xs text-gray-400 uppercase mb-1">NDVI Status</div>
              <div className="font-display text-2xl font-bold text-[#60efff]">0.82</div>
              <div className="text-xs text-gray-500 mt-1">▲ 12% vs 7d ago</div>
            </div>

            <div className="absolute -left-4 bottom-20 w-48 border border-[#00ff87]/30 bg-[#0a0e1a]/90 backdrop-blur-sm p-4 glow-green">
              <div className="font-body text-xs text-gray-400 uppercase mb-1">Rest Period</div>
              <div className="font-display text-2xl font-bold text-[#00ff87]">14d</div>
              <div className="text-xs text-gray-500 mt-1">Target: 12-16 days</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Modular Grid */}
      <section id="platform" className="py-32 px-6 relative">
        <div className="absolute inset-0 diagonal-cut bg-gradient-to-b from-[#00ff87]/5 to-transparent" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 border border-[#00ff87]/30 bg-[#00ff87]/5 mb-6">
              <span className="font-body text-sm font-medium text-[#00ff87] uppercase tracking-wider">
                Core Capabilities
              </span>
            </div>
            <h2 className="font-display text-5xl font-black mb-6">
              <span className="text-[#00ff87]">DECISION</span> ARCHITECTURE
            </h2>
            <p className="font-body text-xl text-gray-400 max-w-3xl mx-auto">
              Three-layer intelligence system: Sensing, Analysis, Execution
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'MULTISPECTRAL SENSING',
                description:
                  'Extract vegetation health (NDVI/EVI), moisture stress (NDWI), and biomass indicators from Sentinel-2 imagery. 10m resolution, 5-day cadence.',
                color: '#00ff87',
              },
              {
                icon: Cpu,
                title: 'AI DECISION ENGINE',
                description:
                  'Time-series analysis of pasture recovery trends. Confidence-scored recommendations with plain-language reasoning. Transparent, explainable logic.',
                color: '#60efff',
              },
              {
                icon: Radio,
                title: 'FLEXIBLE EXECUTION',
                description:
                  'Manual guidance or virtual fencing integration. Override recommendations with natural feedback. You stay in control of every decision.',
                color: '#00ff87',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="group border border-[#00ff87]/20 bg-[#0a0e1a]/50 backdrop-blur-sm p-8 hover:border-[#00ff87]/50 hover:bg-[#00ff87]/5 transition-all relative overflow-hidden"
                  onMouseEnter={() => setActiveFeature(idx)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00ff87]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div
                    className="w-12 h-12 border-2 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                    style={{ borderColor: feature.color }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>

                  <h3
                    className="font-display text-xl font-bold mb-4"
                    style={{ color: activeFeature === idx ? feature.color : 'white' }}
                  >
                    {feature.title}
                  </h3>

                  <p className="font-body text-gray-400 leading-relaxed">{feature.description}</p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-body font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: feature.color }}>
                    Learn more
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="technology" className="py-32 px-6 bg-gradient-to-b from-transparent to-[#00ff87]/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl font-black text-center mb-16">
            TECHNOLOGY <span className="text-[#00ff87]">STACK</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Sentinel-2 MSI', value: 'Data Source' },
              { label: '13-Band Multispectral', value: 'Sensor Type' },
              { label: '10m–20m GSD', value: 'Resolution' },
              { label: 'L2A Surface Reflectance', value: 'Product Level' },
              { label: 'NDVI / EVI / NDWI', value: 'Indices' },
              { label: 'Time-Series Analysis', value: 'Processing' },
              { label: 'Confidence Scoring', value: 'Output' },
              { label: 'Natural Language', value: 'Interface' },
            ].map((spec, idx) => (
              <div
                key={idx}
                className="border border-[#00ff87]/20 bg-[#0a0e1a]/50 p-6 hover:border-[#00ff87]/50 transition-colors"
              >
                <div className="font-body text-sm text-gray-500 uppercase mb-2">{spec.value}</div>
                <div className="font-display font-bold text-lg text-[#00ff87]">{spec.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="access" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00ff87]/10 to-[#60efff]/10" />
        <div className="absolute inset-0 grid-bg" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-2 border border-[#00ff87]/30 bg-[#00ff87]/5 mb-8 holographic-border">
            <span className="font-body text-sm font-medium text-[#00ff87] uppercase tracking-wider">
              Beta Access Available
            </span>
          </div>

          <h2 className="font-display text-5xl md:text-6xl font-black mb-8 leading-tight">
            DEPLOY YOUR
            <br />
            <span className="bg-gradient-to-r from-[#00ff87] to-[#60efff] bg-clip-text text-transparent">
              INTELLIGENCE LAYER
            </span>
          </h2>

          <p className="font-body text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Limited early access for adaptive grazing operations. Priority deployment for farms with
            established rotational systems.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-5 bg-gradient-to-r from-[#00ff87] to-[#60efff] text-[#0a0e1a] font-body font-bold text-lg hover:scale-105 transition-transform glow-green flex items-center justify-center gap-2 group">
              REQUEST ACCESS
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 border-2 border-[#00ff87] text-[#00ff87] font-body font-bold text-lg hover:bg-[#00ff87]/10 transition-colors">
              SYSTEM DOCUMENTATION
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#00ff87]/20 bg-[#0a0e1a]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00ff87] to-[#60efff]" />
              <div>
                <div className="font-display text-lg font-bold">OPENPASTURE</div>
                <div className="font-body text-xs text-gray-500">Intelligence Layer</div>
              </div>
            </div>

            <div className="flex gap-8 font-body text-sm text-gray-400">
              <a href="#" className="hover:text-[#00ff87] transition-colors">
                DOCUMENTATION
              </a>
              <a href="#" className="hover:text-[#00ff87] transition-colors">
                GITHUB
              </a>
              <a href="#" className="hover:text-[#00ff87] transition-colors">
                API REFERENCE
              </a>
              <a href="#" className="hover:text-[#00ff87] transition-colors">
                APACHE 2.0
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#00ff87]/10 text-center font-body text-sm text-gray-500">
            Building the intelligence layer for regenerative grazing.
          </div>
        </div>
      </footer>
    </div>
  )
}
