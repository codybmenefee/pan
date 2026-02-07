import { ArrowRight, TrendingUp, Layers, BarChart3, Check, Maximize2 } from 'lucide-react'

export function Concept23SplitScreenBrutalism() {
  return (
    <div className="min-h-screen bg-white text-black">
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Inconsolata:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-sans { font-family: 'Barlow', sans-serif; }
        .font-mono { font-family: 'Inconsolata', monospace; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .split-card {
          background: white;
          border: 3px solid black;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
        }

        .split-card:hover {
          transform: translate(-3px, -3px);
          box-shadow: 5px 5px 0 black;
        }

        .split-card-alt {
          clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px);
        }

        .green-accent { color: #00ff41; }
        .green-accent-bg { background: #00ff41; }

        .diagonal-split {
          clip-path: polygon(0 0, 60% 0, 55% 100%, 0 100%);
        }

        .diagonal-split-right {
          clip-path: polygon(60% 0, 100% 0, 100% 100%, 55% 100%);
        }

        .slash-pattern {
          background-image:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 30px,
              rgba(0, 0, 0, 0.03) 30px,
              rgba(0, 0, 0, 0.03) 32px
            );
        }

        .cut-corner {
          clip-path: polygon(0 40px, 40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%);
        }

        .angle-badge {
          background: black;
          color: white;
          font-family: 'Barlow', sans-serif;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 8px 20px;
          font-weight: 700;
          clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
        }

        .hero-number {
          font-feature-settings: 'tnum', 'lnum';
          letter-spacing: -0.05em;
        }

        @keyframes slideAngle {
          from {
            opacity: 0;
            transform: translate(-30px, 30px);
          }
          to {
            opacity: 1;
            transform: translate(0, 0);
          }
        }

        .slide-angle {
          animation: slideAngle 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }

        .corner-accent {
          position: absolute;
          width: 0;
          height: 0;
          border-style: solid;
        }

        .corner-tl {
          top: 0;
          left: 0;
          border-width: 30px 30px 0 0;
          border-color: #00ff41 transparent transparent transparent;
        }

        .corner-br {
          bottom: 0;
          right: 0;
          border-width: 0 0 30px 30px;
          border-color: transparent transparent #00ff41 transparent;
        }
      `}</style>

      {/* Header */}
      <header className="border-b-3 border-black font-sans bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black flex items-center justify-center cut-corner relative">
              <Maximize2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              <div className="corner-accent corner-tl" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight">OPENPASTURE</div>
              <div className="text-[9px] font-mono tracking-[0.25em] green-accent">/ SPLIT VISION</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-base font-bold uppercase">
            <a href="#system" className="hover:green-accent transition-colors">
              System
            </a>
            <a href="#data" className="hover:green-accent transition-colors">
              Data
            </a>
            <a href="#access" className="hover:green-accent transition-colors">
              Access
            </a>
            <button className="px-8 py-3 bg-black text-white border-3 border-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_#000000] cut-corner">
              Launch
            </button>
          </nav>
        </div>
      </header>

      {/* Hero - Split Screen */}
      <section className="px-6 py-0 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 min-h-[80vh]">
          {/* Left Side - Black */}
          <div className="bg-black text-white p-16 lg:p-20 flex flex-col justify-center lg:diagonal-split relative">
            <div className="max-w-xl space-y-10">
              <div className="angle-badge inline-block slide-angle">
                Dual Perspective System
              </div>

              <h1 className="font-sans text-7xl md:text-8xl font-black leading-[0.85] tracking-tight slide-angle delay-1">
                SATELLITE
                <br />
                <span className="green-accent">VISION</span>
              </h1>

              <p className="font-mono text-base leading-relaxed slide-angle delay-2">
                Sentinel-2 multispectral platform. 13-band orbital analysis.
                Daily grazing intelligence with full transparency.
              </p>

              <button className="px-12 py-5 green-accent-bg text-black border-3 border-white font-sans font-black transition-all shadow-[5px_5px_0_#00ff41] hover:shadow-[2px_2px_0_#00ff41] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center gap-3 group uppercase slide-angle delay-3">
                Initialize
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Right Side - White */}
          <div className="bg-white text-black p-16 lg:p-20 flex flex-col justify-center lg:diagonal-split-right slash-pattern relative">
            <div className="max-w-xl space-y-8">
              <div className="space-y-6">
                {[
                  { value: '10M', label: 'RESOLUTION' },
                  { value: '5D', label: 'REFRESH' },
                  { value: '91%', label: 'PRECISION' },
                ].map((metric, idx) => (
                  <div key={idx} className="split-card p-8 border-black">
                    <div className="font-sans hero-number text-6xl font-black mb-2">{metric.value}</div>
                    <div className="font-sans text-xs font-bold uppercase tracking-widest opacity-60">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Grid */}
      <section id="system" className="px-6 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24">
            <div className="inline-block mb-6">
              <h2 className="font-sans text-7xl md:text-8xl font-black uppercase">
                System / Grid
              </h2>
              <div className="w-full h-2 bg-black mt-2" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                num: '01',
                title: 'Spectral Engine',
                description:
                  'NDVI / EVI / NDWI indices. 13-band processing. 5-day cycle.',
              },
              {
                icon: BarChart3,
                num: '02',
                title: 'Time Analysis',
                description:
                  'Recovery tracking. Pattern recognition. Seasonal correlation.',
              },
              {
                icon: Layers,
                num: '03',
                title: 'Decision Core',
                description:
                  'Daily directives. Confidence scores. Transparent logic.',
              },
              {
                icon: Check,
                num: '04',
                title: 'Override Mode',
                description:
                  'Manual control. Feedback integration. System learning.',
              },
              {
                icon: TrendingUp,
                num: '05',
                title: 'Data Archive',
                description:
                  'Complete history. Pattern library. Export protocol.',
              },
              {
                icon: BarChart3,
                num: '06',
                title: 'API Gateway',
                description:
                  'System integration. Data pipeline. External sync.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="split-card-alt p-10 bg-white border-black relative">
                  <div className="corner-accent corner-br" />
                  <div className="flex items-start justify-between mb-6">
                    <Icon className="w-12 h-12" strokeWidth={2} />
                    <span className="font-mono text-xs opacity-40">{feature.num}</span>
                  </div>
                  <h3 className="font-sans text-2xl font-black mb-4 uppercase">{feature.title}</h3>
                  <p className="font-mono text-sm leading-relaxed opacity-70">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Data Split */}
      <section id="data" className="px-6 py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="mb-10">
                <h2 className="font-sans text-7xl font-black uppercase leading-[0.9]">
                  Orbital
                  <br />
                  <span className="green-accent">Intel</span>
                </h2>
                <div className="w-24 h-2 green-accent-bg mt-6" />
              </div>
              <p className="font-mono text-sm mb-12 leading-relaxed">
                Multispectral sensors capture vegetation health, moisture stress,
                biomass density. Ground truth from 500km altitude.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'NDVI', metric: '0.00–1.00' },
                  { label: 'EVI', metric: '0.00–1.00' },
                  { label: 'NDWI', metric: '-1.00–1.00' },
                ].map((index, idx) => (
                  <div key={idx} className="border-3 border-white p-6 cut-corner">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xl font-bold green-accent">{index.label}</span>
                      <span className="font-mono text-xs opacity-60">{index.metric}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="border-3 border-white p-16 cut-corner bg-black relative">
                <div className="corner-accent corner-tl" style={{ borderColor: '#00ff41 transparent transparent transparent' }} />
                <div className="corner-accent corner-br" style={{ borderColor: 'transparent transparent #00ff41 transparent' }} />

                <div className="aspect-square flex flex-col items-center justify-center text-center border-3 border-white p-14">
                  <div className="angle-badge mb-12 bg-white text-black">LIVE DATA</div>
                  <BarChart3 className="w-32 h-32 mb-10 green-accent" strokeWidth={2} />
                  <div className="font-sans hero-number text-[140px] font-black green-accent leading-none mb-6">0.82</div>
                  <div className="font-sans text-sm font-bold uppercase tracking-wider mb-3">
                    NDVI Current
                  </div>
                  <div className="font-mono text-xs opacity-60 uppercase tracking-widest">Zone 7 • 2h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Section */}
      <section id="access" className="px-6 py-32 bg-white slash-pattern">
        <div className="max-w-6xl mx-auto">
          <div className="mb-24 text-center">
            <h2 className="font-sans text-7xl md:text-8xl font-black uppercase mb-6">Deploy / Access</h2>
            <div className="w-32 h-2 bg-black mx-auto" />
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
                description: 'Multi-site ops',
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
                className={`split-card${idx === 0 ? '-alt' : ''} p-14 bg-white border-black relative ${plan.highlighted ? 'border-[4px]' : ''}`}
              >
                {plan.highlighted && <div className="corner-accent corner-br" />}
                <h3 className="font-sans text-4xl font-black mb-3 uppercase">{plan.name}</h3>
                <p className="font-mono text-xs mb-12 opacity-60 uppercase tracking-wider">{plan.description}</p>

                <div className="mb-14">
                  <span className="font-sans hero-number text-9xl font-black">{plan.price}</span>
                  {plan.period && (
                    <span className="font-mono text-2xl opacity-60">{plan.period}</span>
                  )}
                </div>

                <button
                  className={`w-full py-6 border-3 border-black font-sans font-black mb-12 transition-all uppercase ${
                    plan.highlighted
                      ? 'bg-black text-white shadow-[6px_6px_0_#000000] hover:shadow-[3px_3px_0_#000000] hover:translate-x-0.5 hover:translate-y-0.5'
                      : 'bg-white text-black shadow-[6px_6px_0_#000000] hover:shadow-[3px_3px_0_#000000] hover:translate-x-0.5 hover:translate-y-0.5'
                  }`}
                >
                  {plan.highlighted ? 'Deploy Pro' : 'Deploy Base'}
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center gap-4 font-mono text-sm uppercase tracking-wide">
                      <div className="w-7 h-7 border-3 border-black bg-black flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" strokeWidth={4} />
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

      {/* CTA - Angled */}
      <section className="px-6 py-0 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 min-h-[60vh]">
          <div className="bg-white text-black p-16 lg:p-20 flex flex-col justify-center lg:diagonal-split slash-pattern">
            <div className="max-w-xl">
              <h2 className="font-sans text-6xl md:text-7xl font-black uppercase leading-[0.9] mb-8">
                Ready to
                <br />
                Deploy?
              </h2>
              <p className="font-mono text-base mb-10 leading-relaxed">
                Join operations using satellite intelligence for adaptive grazing.
                Zero setup. Instant activation.
              </p>
            </div>
          </div>

          <div className="bg-black text-white p-16 lg:p-20 flex flex-col justify-center lg:diagonal-split-right relative">
            <div className="max-w-xl">
              <button className="px-14 py-6 green-accent-bg text-black border-3 border-white font-sans font-black transition-all shadow-[6px_6px_0_#00ff41] hover:shadow-[3px_3px_0_#00ff41] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center gap-3 group uppercase mb-6">
                Launch System
                <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </button>
              <button className="px-14 py-6 border-3 border-white text-white font-sans font-black transition-all shadow-[6px_6px_0_rgba(255,255,255,0.3)] hover:shadow-[3px_3px_0_rgba(255,255,255,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 uppercase">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-3 border-black py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-black flex items-center justify-center cut-corner">
                  <Maximize2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-sans text-2xl font-black">OPENPASTURE</span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider opacity-60">
                Satellite Intelligence System
              </p>
            </div>

            {[
              { title: 'System', links: ['Platform', 'Data', 'API', 'Docs'] },
              { title: 'Company', links: ['About', 'Contact', 'Careers'] },
              { title: 'Legal', links: ['Terms', 'Privacy', 'License'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-black mb-5 text-xs uppercase tracking-widest">{section.title}</h4>
                <ul className="space-y-3 font-mono text-xs uppercase tracking-wider opacity-60">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:opacity-100 hover:green-accent transition-all">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t-3 border-black font-mono text-xs text-center uppercase tracking-widest opacity-60">
            © 2024 OpenPasture • Apache 2.0
          </div>
        </div>
      </footer>
    </div>
  )
}
