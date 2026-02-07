import { ArrowRight, TrendingUp, Layers, BarChart3, Check, Target } from 'lucide-react'

export function Concept19MonochromeBrutalism() {
  return (
    <div className="min-h-screen bg-white text-black">
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-sans { font-family: 'Space Grotesk', monospace, sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .brutal-card {
          background: white;
          border: 3px solid black;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .brutal-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: black;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }

        .brutal-card:hover {
          transform: translate(-3px, -3px);
          box-shadow: 6px 6px 0 black;
        }

        .brutal-card:hover::after {
          opacity: 0.02;
        }

        .red-accent { color: #ff0000; }
        .red-accent-bg { background: #ff0000; }

        .grid-pattern {
          background-image:
            linear-gradient(black 3px, transparent 3px),
            linear-gradient(90deg, black 3px, transparent 3px);
          background-size: 80px 80px;
          background-position: -3px -3px;
          opacity: 0.05;
        }

        .data-badge {
          background: black;
          color: white;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 6px 16px;
          font-weight: 700;
          border: 3px solid black;
        }

        .hero-number {
          font-feature-settings: 'tnum', 'lnum';
          letter-spacing: -0.05em;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .slide-in {
          animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
      `}</style>

      {/* Header */}
      <header className="border-b-3 border-black font-sans bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <Target className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">OpenPasture</div>
              <div className="text-[9px] font-mono tracking-widest">INTELLIGENCE</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-sm font-bold uppercase tracking-wider">
            <a href="#system" className="hover:text-red-600 transition-colors">
              System
            </a>
            <a href="#data" className="hover:text-red-600 transition-colors">
              Data
            </a>
            <a href="#access" className="hover:text-red-600 transition-colors">
              Access
            </a>
            <button className="px-6 py-3 bg-black text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0_#000000]">
              Deploy
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-40 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-6xl space-y-12">
            <div className="data-badge inline-block slide-in">
              Satellite Surveillance System
            </div>

            <h1 className="font-sans text-[clamp(4rem,10vw,9rem)] font-bold leading-[0.85] tracking-tighter slide-in delay-1">
              PURE DATA.
              <br />
              <span className="red-accent">ZERO NOISE.</span>
            </h1>

            <p className="font-sans text-2xl md:text-3xl max-w-4xl leading-tight font-medium slide-in delay-2">
              Sentinel-2 orbital platform delivers raw multispectral intelligence.
              Daily grazing directives with full transparency. No interpretation. Just facts.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-8 slide-in delay-3">
              <button className="px-12 py-6 bg-black text-white font-sans font-bold transition-all shadow-[6px_6px_0_#000000] hover:shadow-[3px_3px_0_#000000] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-3 group uppercase tracking-wider">
                Start Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </button>
              <button className="px-12 py-6 border-3 border-black bg-white text-black font-sans font-bold transition-all shadow-[6px_6px_0_#000000] hover:shadow-[3px_3px_0_#000000] hover:translate-x-0.5 hover:translate-y-0.5 uppercase tracking-wider">
                View System
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="mt-32 grid md:grid-cols-3 gap-6 max-w-6xl">
            {[
              { value: '10M', label: 'Resolution', sublabel: 'Spatial accuracy' },
              { value: '5D', label: 'Frequency', sublabel: 'Update cycle' },
              { value: '91%', label: 'Precision', sublabel: 'System confidence' },
            ].map((metric, idx) => (
              <div key={idx} className="brutal-card p-10 bg-white">
                <div className="font-mono hero-number text-7xl font-bold mb-4">{metric.value}</div>
                <div className="font-sans text-xs font-bold uppercase tracking-widest mb-2">
                  {metric.label}
                </div>
                <div className="font-mono text-[10px] opacity-60 uppercase tracking-wider">{metric.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Grid */}
      <section id="system" className="px-6 py-40 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-28">
            <h2 className="font-sans text-7xl md:text-8xl font-bold mb-8 uppercase">
              System Components
            </h2>
            <div className="w-24 h-2 red-accent-bg" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'Spectral Analysis',
                description:
                  'NDVI, EVI, NDWI indices. 13-band multispectral processing. 5-day update cycle.',
              },
              {
                icon: BarChart3,
                title: 'Time-Series Engine',
                description:
                  'Recovery pattern tracking. Seasonal trend analysis. Historical correlation.',
              },
              {
                icon: Layers,
                title: 'Decision Output',
                description:
                  'Daily grazing directives. Confidence scoring. Transparent reasoning chain.',
              },
              {
                icon: Check,
                title: 'Override Protocol',
                description:
                  'Manual control retention. Feedback integration. System learning loop.',
              },
              {
                icon: TrendingUp,
                title: 'Archive Access',
                description:
                  'Complete data history. Pattern identification. Export capability.',
              },
              {
                icon: BarChart3,
                title: 'API Interface',
                description:
                  'System integration. Data pipeline. Farm management sync.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="border-3 border-white p-10 bg-black hover:bg-white hover:text-black transition-all duration-300 group">
                  <div className="w-16 h-16 border-3 border-white group-hover:border-black group-hover:bg-black flex items-center justify-center mb-8 transition-all">
                    <Icon className="w-8 h-8 group-hover:text-white" strokeWidth={3} />
                  </div>
                  <h3 className="font-sans text-xl font-bold mb-4 uppercase tracking-wide">{feature.title}</h3>
                  <p className="font-mono text-sm leading-relaxed opacity-80">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Data Display */}
      <section id="data" className="px-6 py-40 bg-white relative">
        <div className="absolute inset-0 grid-pattern" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-sans text-7xl font-bold mb-10 uppercase leading-[0.9]">
                Orbital
                <br />
                Intelligence
              </h2>
              <div className="w-24 h-2 red-accent-bg mb-10" />
              <p className="font-mono text-lg mb-12 leading-relaxed">
                Multispectral sensors measure vegetation health, moisture stress, biomass density.
                Ground truth from 500km altitude. Updated every 5 days.
              </p>

              <div className="space-y-5">
                {[
                  {
                    label: 'NDVI',
                    value: 'Chlorophyll density index',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'EVI',
                    value: 'Enhanced vegetation index',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'NDWI',
                    value: 'Water stress indicator',
                    metric: '-1.00–1.00',
                  },
                ].map((index, idx) => (
                  <div key={idx} className="brutal-card p-6 bg-white">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="font-mono text-xl font-bold">{index.label}</span>
                      <span className="font-mono text-xs opacity-60">{index.metric}</span>
                    </div>
                    <p className="font-mono text-sm">{index.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="brutal-card p-16 bg-white">
              <div className="aspect-square flex flex-col items-center justify-center text-center border-3 border-black p-12">
                <div className="data-badge mb-10">LIVE FEED</div>
                <BarChart3 className="w-28 h-28 mb-8" strokeWidth={3} />
                <div className="font-mono hero-number text-[120px] font-bold leading-none mb-4">0.82</div>
                <div className="font-sans text-xs font-bold uppercase tracking-widest mb-3">
                  NDVI Current
                </div>
                <div className="font-mono text-[10px] opacity-60 uppercase">Pasture 7 • 2h</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Section */}
      <section id="access" className="px-6 py-40 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-28 text-center">
            <h2 className="font-sans text-7xl md:text-8xl font-bold mb-10 uppercase">Deploy System</h2>
            <div className="w-24 h-2 red-accent-bg mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: 'Base',
                price: 'Free',
                description: 'Single operation',
                features: [
                  '1 location',
                  'Daily directives',
                  'Core indices',
                  'Email support',
                ],
              },
              {
                name: 'Pro',
                price: '$79',
                period: '/mo',
                description: 'Multi-site operation',
                features: [
                  '5 locations',
                  'Advanced analytics',
                  'Data export',
                  'API access',
                  'Priority support',
                ],
                highlighted: true,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`border-3 border-white p-14 ${plan.highlighted ? 'bg-white text-black' : 'bg-black'}`}
              >
                <h3 className="font-sans text-3xl font-bold mb-3 uppercase tracking-wide">{plan.name}</h3>
                <p className="font-mono text-xs mb-12 opacity-60 uppercase tracking-wider">{plan.description}</p>

                <div className="mb-14">
                  <span className="font-mono hero-number text-8xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="font-mono text-2xl opacity-60">{plan.period}</span>
                  )}
                </div>

                <button
                  className={`w-full py-5 border-3 font-sans font-bold mb-12 transition-all uppercase tracking-wider ${
                    plan.highlighted
                      ? 'border-black bg-black text-white shadow-[6px_6px_0_#000000] hover:shadow-[3px_3px_0_#000000] hover:translate-x-0.5 hover:translate-y-0.5'
                      : 'border-white bg-white text-black shadow-[6px_6px_0_#ffffff] hover:shadow-[3px_3px_0_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5'
                  }`}
                >
                  {plan.highlighted ? 'Deploy Pro' : 'Deploy Base'}
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center gap-4 font-mono text-sm uppercase tracking-wider">
                      <div className={`w-6 h-6 border-3 flex items-center justify-center flex-shrink-0 ${plan.highlighted ? 'border-black bg-black' : 'border-white bg-white'}`}>
                        <Check className={`w-4 h-4 ${plan.highlighted ? 'text-white' : 'text-black'}`} strokeWidth={4} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-3 border-black py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" strokeWidth={3} />
                </div>
                <span className="font-sans text-xl font-bold">OpenPasture</span>
              </div>
              <p className="font-mono text-xs uppercase tracking-wider">
                Satellite Intelligence System
              </p>
            </div>

            {[
              { title: 'System', links: ['Platform', 'Data', 'API', 'Docs'] },
              { title: 'Company', links: ['About', 'Contact', 'Careers'] },
              { title: 'Legal', links: ['Terms', 'Privacy', 'License'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-bold mb-5 text-xs uppercase tracking-widest">{section.title}</h4>
                <ul className="space-y-3 font-mono text-xs uppercase tracking-wider opacity-60">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:opacity-100 transition-opacity">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t-3 border-black font-mono text-xs text-center uppercase tracking-widest">
            © 2024 OpenPasture • Apache 2.0
          </div>
        </div>
      </footer>
    </div>
  )
}
