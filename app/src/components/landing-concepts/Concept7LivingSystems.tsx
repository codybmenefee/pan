import { ArrowRight, Sprout, Droplets, Sun, Wind } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Concept7LivingSystems() {
  const [growthProgress, setGrowthProgress] = useState(0)
  const [activePhase, setActivePhase] = useState(0)

  useEffect(() => {
    const growthInterval = setInterval(() => {
      setGrowthProgress((prev) => (prev >= 100 ? 0 : prev + 0.5))
    }, 50)

    const phaseInterval = setInterval(() => {
      setActivePhase((prev) => (prev + 1) % 3)
    }, 3000)

    return () => {
      clearInterval(growthInterval)
      clearInterval(phaseInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7e9] to-[#e8f5d8] text-[#2d4a2b]">
      <link
        href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=Comfortaa:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-rounded { font-family: 'Quicksand', sans-serif; }
        .font-display { font-family: 'Comfortaa', cursive; }

        .organic-blob {
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          animation: morph 8s ease-in-out infinite;
        }

        @keyframes morph {
          0%, 100% {
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          }
          25% {
            border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%;
          }
          50% {
            border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%;
          }
          75% {
            border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%;
          }
        }

        .pulse-grow {
          animation: pulseGrow 3s ease-in-out infinite;
        }

        @keyframes pulseGrow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        .float-gentle {
          animation: floatGentle 4s ease-in-out infinite;
        }

        @keyframes floatGentle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .grow-in {
          animation: growIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom center;
          opacity: 0;
          transform: scale(0.3);
        }

        @keyframes growIn {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }

        .flow-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: flowPath 3s ease-in-out forwards;
        }

        @keyframes flowPath {
          to {
            stroke-dashoffset: 0;
          }
        }

        .leaf-pattern {
          background-image: radial-gradient(circle at 20% 50%, rgba(106, 168, 79, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(139, 195, 74, 0.1) 0%, transparent 50%);
        }
      `}</style>

      {/* Header - Organic Flow */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-[#6aa84f]/20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6aa84f] to-[#8bc34a] organic-blob pulse-grow" />
              <Sprout className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="font-display text-2xl font-semibold text-[#2d4a2b]">OpenPasture</span>
          </div>

          <nav className="hidden md:flex gap-8 font-rounded text-sm font-medium">
            <a href="#grow" className="hover:text-[#6aa84f] transition-colors">
              How We Grow
            </a>
            <a href="#systems" className="hover:text-[#6aa84f] transition-colors">
              Living Systems
            </a>
            <a href="#join" className="hover:text-[#6aa84f] transition-colors">
              Join the Cycle
            </a>
          </nav>
        </div>
      </header>

      {/* Hero - Radial Growth */}
      <section className="relative px-6 py-32 overflow-hidden">
        {/* Organic Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#6aa84f]/10 organic-blob" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-[#8bc34a]/10 organic-blob" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-2 border-[#6aa84f]/20 rounded-full pulse-grow" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-[#6aa84f]/30 mb-8 grow-in">
            <div className="w-2 h-2 bg-[#6aa84f] rounded-full pulse-grow" />
            <span className="font-rounded text-sm font-medium text-[#2d4a2b]">
              Growing Intelligence for Living Land
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-[#2d4a2b] mb-8 grow-in delay-1">
            Graze in Harmony
            <br />
            <span className="bg-gradient-to-r from-[#6aa84f] to-[#8bc34a] bg-clip-text text-transparent">
              with Living Systems
            </span>
          </h1>

          <p className="font-rounded text-xl md:text-2xl text-[#2d4a2b]/70 max-w-3xl mx-auto leading-relaxed font-light mb-10 grow-in delay-2">
            Like plants responding to sunlight, OpenPasture responds to your land's signals.
            Satellite sensing reveals the invisible rhythms of vegetation growth, moisture cycles,
            and recovery patterns.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center grow-in delay-3">
            <button className="px-8 py-4 bg-gradient-to-r from-[#6aa84f] to-[#8bc34a] text-white font-rounded font-semibold rounded-full hover:shadow-lg hover:shadow-[#6aa84f]/30 transition-all hover:scale-105 flex items-center justify-center gap-2 group">
              Grow with Us
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border-2 border-[#6aa84f] text-[#6aa84f] font-rounded font-semibold rounded-full hover:bg-[#6aa84f]/10 transition-all">
              Explore the System
            </button>
          </div>

          {/* Growth Progress Visualization */}
          <div className="mt-20 max-w-3xl mx-auto grow-in delay-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-[#6aa84f]/30">
              <div className="flex items-center justify-between mb-4">
                <span className="font-rounded text-sm text-[#2d4a2b]/70">Vegetation Growth Cycle</span>
                <span className="font-display text-sm font-semibold text-[#6aa84f]">
                  {growthProgress.toFixed(0)}%
                </span>
              </div>

              <div className="h-3 bg-[#2d4a2b]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6aa84f] to-[#8bc34a] rounded-full transition-all duration-300"
                  style={{ width: `${growthProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { icon: Sun, label: 'Photosynthesis', value: 'Active' },
                  { icon: Droplets, label: 'Moisture', value: 'Optimal' },
                  { icon: Wind, label: 'Recovery', value: '14 days' },
                ].map((metric, idx) => {
                  const Icon = metric.icon
                  return (
                    <div key={idx} className="text-center">
                      <Icon className="w-6 h-6 mx-auto mb-2 text-[#6aa84f]" />
                      <div className="font-rounded text-xs text-[#2d4a2b]/60">{metric.label}</div>
                      <div className="font-display text-sm font-semibold text-[#2d4a2b]">
                        {metric.value}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Circular Flow */}
      <section id="systems" className="px-6 py-32 leaf-pattern">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-[#2d4a2b]">
              The Living Cycle
            </h2>
            <p className="font-rounded text-xl text-[#2d4a2b]/70 max-w-2xl mx-auto">
              Three interconnected phases, like nature's own feedback loops
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                phase: 'Sense',
                icon: Sun,
                title: 'Absorb Signals',
                description:
                  'Satellites capture multispectral light reflected from your pastures. We measure chlorophyll (NDVI), biomass (EVI), and moisture (NDWI)—the vital signs of living grass.',
                color: 'from-[#ffd54f] to-[#ffb74d]',
                bgColor: 'bg-[#fff9e6]',
              },
              {
                phase: 'Process',
                icon: Sprout,
                title: 'Understand Growth',
                description:
                  'AI analyzes time-series patterns like plant growth itself—tracking recovery curves, seasonal rhythms, and stress indicators. The system learns what healthy regeneration looks like on your land.',
                color: 'from-[#6aa84f] to-[#8bc34a]',
                bgColor: 'bg-[#f1f8ec]',
              },
              {
                phase: 'Guide',
                icon: Droplets,
                title: 'Flow with Land',
                description:
                  "Each morning, receive guidance that flows from your land's actual state. Like water finding the best path, recommendations adapt to current conditions while respecting recovery cycles.",
                color: 'from-[#4fc3f7] to-[#29b6f6]',
                bgColor: 'bg-[#e8f6fc]',
              },
            ].map((phase, idx) => {
              const Icon = phase.icon
              const isActive = activePhase === idx

              return (
                <div
                  key={idx}
                  className={`${phase.bgColor} rounded-3xl p-8 border-2 transition-all ${
                    isActive ? 'border-[#6aa84f] shadow-xl scale-105' : 'border-transparent'
                  }`}
                >
                  <div className="relative mb-6">
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${phase.color} rounded-full flex items-center justify-center mx-auto organic-blob ${isActive ? 'pulse-grow' : ''}`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-[#6aa84f] flex items-center justify-center">
                      <span className="font-display text-xs font-bold text-[#6aa84f]">
                        {idx + 1}
                      </span>
                    </div>
                  </div>

                  <div className="font-rounded text-xs uppercase tracking-wider text-[#6aa84f] mb-2 text-center">
                    {phase.phase}
                  </div>

                  <h3 className="font-display text-2xl font-bold mb-4 text-center text-[#2d4a2b]">
                    {phase.title}
                  </h3>

                  <p className="font-rounded text-[#2d4a2b]/70 leading-relaxed text-center">
                    {phase.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits - Organic Cards */}
      <section className="px-6 py-32 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4 text-[#2d4a2b]">
              Grow Better Together
            </h2>
            <p className="font-rounded text-lg text-[#2d4a2b]/70">
              Benefits that bloom from satellite-scale observation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'See the Whole Ecosystem',
                description:
                  'Vegetation health across every pasture, visible at a glance. Track which areas are thriving, which need rest, and how recovery unfolds over time.',
                gradient: 'from-[#6aa84f] to-[#8bc34a]',
              },
              {
                title: 'Natural Decision Rhythms',
                description:
                  "Daily guidance that respects your land's biological pace. Not minute-by-minute alerts—just morning recommendations aligned with grass growth cycles.",
                gradient: 'from-[#8bc34a] to-[#aed581]',
              },
              {
                title: 'Adaptive Intelligence',
                description:
                  'The system learns from your feedback and land patterns. Like a perennial returning each season, it grows more attuned to your operation over time.',
                gradient: 'from-[#4fc3f7] to-[#29b6f6]',
              },
              {
                title: 'Rooted in Your Control',
                description:
                  "You're the steward of your land. Recommendations are offered like advice from a knowledgeable neighbor—helpful, transparent, and always yours to accept or adjust.",
                gradient: 'from-[#ffd54f] to-[#ffb74d]',
              },
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="group bg-gradient-to-br from-[#f0f7e9] to-white rounded-3xl p-8 border border-[#6aa84f]/20 hover:border-[#6aa84f] hover:shadow-xl transition-all float-gentle"
                style={{ animationDelay: `${idx * 0.2}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${benefit.gradient} rounded-2xl mb-6 organic-blob group-hover:pulse-grow`} />
                <h3 className="font-display text-2xl font-bold mb-4 text-[#2d4a2b]">
                  {benefit.title}
                </h3>
                <p className="font-rounded text-[#2d4a2b]/70 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Organic Invitation */}
      <section id="join" className="relative px-6 py-32 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6aa84f] to-[#8bc34a]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white organic-blob" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white organic-blob" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-8">
            <Sprout className="w-4 h-4" />
            <span className="font-rounded text-sm font-medium">Join the Living System</span>
          </div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Start Growing with
            <br />
            Satellite Intelligence
          </h2>

          <p className="font-rounded text-xl md:text-2xl opacity-95 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Early access for regenerative operations. Experience daily guidance that flows from your
            land's living signals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-5 bg-white text-[#6aa84f] font-rounded font-bold rounded-full hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 group">
              Request Beta Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 border-2 border-white text-white font-rounded font-bold rounded-full hover:bg-white/10 transition-all">
              Explore Documentation
            </button>
          </div>

          <div className="mt-16 font-rounded text-sm opacity-80">
            Priority for farms with established rotational grazing systems
          </div>
        </div>
      </section>

      {/* Footer - Organic */}
      <footer className="bg-[#2d4a2b] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6aa84f] to-[#8bc34a] organic-blob">
                  <Sprout className="w-5 h-5 text-white mx-auto mt-2.5" />
                </div>
                <span className="font-display text-2xl font-semibold">OpenPasture</span>
              </div>
              <p className="font-rounded text-white/70 leading-relaxed max-w-sm">
                Growing the intelligence layer for regenerative grazing. Sensing, understanding,
                and guiding in harmony with living land.
              </p>
            </div>

            <div>
              <h4 className="font-display font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 font-rounded text-sm text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Living Systems
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Join Beta
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 font-rounded text-sm text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Apache 2.0
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 font-rounded text-sm text-white/50">
            <div>© 2024 OpenPasture. Open source, organically grown.</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#6aa84f] rounded-full pulse-grow" />
              <span>Building in harmony with nature</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
