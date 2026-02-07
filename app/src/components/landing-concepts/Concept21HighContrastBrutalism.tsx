import { ArrowRight, TrendingUp, Layers, BarChart3, Check, Zap } from 'lucide-react'

export function Concept21HighContrastBrutalism() {
  return (
    <div className="min-h-screen bg-black text-white">
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-sans { font-family: 'Bebas Neue', sans-serif; }
        .font-mono { font-family: 'Roboto Mono', monospace; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .impact-card {
          background: black;
          border: 4px solid #ffff00;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .impact-card:hover {
          transform: translate(-5px, -5px);
          box-shadow: 8px 8px 0 #ffff00;
          border-color: #ffff00;
          background: #ffff00;
          color: black;
        }

        .yellow { color: #ffff00; }
        .yellow-bg { background: #ffff00; }

        .warning-stripes {
          background-image:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(255, 255, 0, 0.08) 20px,
              rgba(255, 255, 0, 0.08) 40px
            );
        }

        .impact-badge {
          background: #ffff00;
          color: black;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 0.1em;
          padding: 8px 20px;
          font-weight: 400;
          border: 4px solid #ffff00;
        }

        .hero-number {
          font-feature-settings: 'tnum', 'lnum';
          letter-spacing: -0.02em;
        }

        @keyframes blink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
        }

        .blink {
          animation: blink 1.5s step-end infinite;
        }

        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .slide-right {
          animation: slideRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }
      `}</style>

      {/* Header */}
      <header className="border-b-4 border-yellow font-sans bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 yellow-bg flex items-center justify-center border-4 border-yellow">
              <Zap className="w-8 h-8 text-black" strokeWidth={3} />
            </div>
            <div>
              <div className="text-3xl tracking-wider">OPENPASTURE</div>
              <div className="text-xs font-mono yellow tracking-[0.3em]">SATELLITE OPS</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-lg tracking-wider">
            <a href="#system" className="hover:yellow transition-colors">
              SYSTEM
            </a>
            <a href="#intel" className="hover:yellow transition-colors">
              INTEL
            </a>
            <a href="#deploy" className="hover:yellow transition-colors">
              DEPLOY
            </a>
            <button className="px-8 py-3 yellow-bg text-black border-4 border-yellow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[5px_5px_0_#ffff00] font-sans text-lg">
              ACTIVATE
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-40 warning-stripes relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-6xl space-y-14">
            <div className="impact-badge inline-block slide-right">
              MAXIMUM PRECISION MODE
            </div>

            <h1 className="font-sans text-[clamp(5rem,12vw,11rem)] leading-[0.85] tracking-tight slide-right delay-1">
              SATELLITE
              <br />
              <span className="yellow">INTELLIGENCE</span>
              <br />
              ACTIVATED
            </h1>

            <p className="font-mono text-xl md:text-2xl max-w-4xl leading-relaxed font-bold slide-right delay-2">
              [SENTINEL-2] ORBITAL SENSORS • [MULTISPECTRAL] 13-BAND ANALYSIS •
              [DAILY] GRAZING DIRECTIVES • [91%] CONFIDENCE RATING
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-10 slide-right delay-3">
              <button className="px-14 py-6 yellow-bg text-black border-4 border-yellow font-sans text-xl transition-all shadow-[8px_8px_0_#ffff00] hover:shadow-[4px_4px_0_#ffff00] hover:translate-x-1 hover:translate-y-1 flex items-center justify-center gap-3 group">
                DEPLOY NOW
                <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </button>
              <button className="px-14 py-6 border-4 border-yellow bg-black text-yellow font-sans text-xl transition-all shadow-[8px_8px_0_#ffff00] hover:shadow-[4px_4px_0_#ffff00] hover:translate-x-1 hover:translate-y-1">
                VIEW SPECS
              </button>
            </div>
          </div>

          {/* Alert indicator */}
          <div className="absolute top-10 right-10 flex items-center gap-3">
            <div className="w-5 h-5 yellow-bg blink" />
            <span className="font-mono text-sm yellow">SYSTEM ACTIVE</span>
          </div>

          {/* Metrics Grid */}
          <div className="mt-36 grid md:grid-cols-3 gap-8 max-w-6xl">
            {[
              { value: '10M', label: 'RESOLUTION', sublabel: 'SPATIAL ACCURACY' },
              { value: '5D', label: 'CADENCE', sublabel: 'UPDATE CYCLE' },
              { value: '91%', label: 'PRECISION', sublabel: 'CONFIDENCE AVG' },
            ].map((metric, idx) => (
              <div key={idx} className="impact-card p-12 group">
                <div className="font-sans hero-number text-8xl yellow group-hover:text-black mb-5">{metric.value}</div>
                <div className="font-sans text-sm yellow group-hover:text-black tracking-wider mb-2">
                  {metric.label}
                </div>
                <div className="font-mono text-[10px] opacity-60 group-hover:opacity-100 group-hover:text-black tracking-widest">{metric.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Grid */}
      <section id="system" className="px-6 py-40 bg-black border-t-4 border-yellow">
        <div className="max-w-7xl mx-auto">
          <div className="mb-32">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-3 h-3 yellow-bg blink" />
              <h2 className="font-sans text-8xl md:text-9xl yellow tracking-tight">
                SYSTEM MODULES
              </h2>
            </div>
            <div className="w-32 h-1 yellow-bg" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'SPECTRAL ENGINE',
                description:
                  'NDVI • EVI • NDWI INDICES / 13-BAND PROCESSING / 5-DAY REFRESH RATE',
              },
              {
                icon: BarChart3,
                title: 'TIME ANALYSIS',
                description:
                  'RECOVERY TRACKING / PATTERN RECOGNITION / SEASONAL CORRELATION',
              },
              {
                icon: Layers,
                title: 'DECISION CORE',
                description:
                  'DAILY DIRECTIVES / CONFIDENCE SCORES / REASONING CHAIN',
              },
              {
                icon: Check,
                title: 'OVERRIDE MODE',
                description:
                  'MANUAL CONTROL / FEEDBACK LOOP / SYSTEM LEARNING',
              },
              {
                icon: TrendingUp,
                title: 'DATA VAULT',
                description:
                  'COMPLETE HISTORY / PATTERN LIBRARY / EXPORT PROTOCOL',
              },
              {
                icon: BarChart3,
                title: 'API GATEWAY',
                description:
                  'SYSTEM INTEGRATION / DATA PIPELINE / EXTERNAL SYNC',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="impact-card p-10 group">
                  <div className="w-20 h-20 border-4 border-yellow yellow-bg group-hover:bg-black flex items-center justify-center mb-8 transition-all">
                    <Icon className="w-10 h-10 text-black group-hover:text-yellow transition-colors" strokeWidth={3} />
                  </div>
                  <h3 className="font-sans text-2xl yellow group-hover:text-black mb-5 tracking-wider">{feature.title}</h3>
                  <p className="font-mono text-xs leading-relaxed opacity-80 group-hover:opacity-100 group-hover:text-black tracking-wide">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Intel Display */}
      <section id="intel" className="px-6 py-40 warning-stripes border-t-4 border-yellow">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-3 h-3 yellow-bg blink" />
                <h2 className="font-sans text-7xl md:text-8xl yellow leading-[0.9] tracking-tight">
                  ORBITAL
                  <br />
                  INTEL
                </h2>
              </div>
              <div className="w-28 h-1 yellow-bg mb-12" />
              <p className="font-mono text-base mb-14 leading-relaxed font-bold">
                [MULTISPECTRAL SENSORS] VEGETATION HEALTH MONITORING •
                [MOISTURE STRESS] EARLY WARNING DETECTION •
                [BIOMASS DENSITY] DISTRIBUTION MAPPING •
                [500KM ALTITUDE] CONTINUOUS OBSERVATION
              </p>

              <div className="space-y-6">
                {[
                  {
                    label: 'NDVI',
                    value: 'CHLOROPHYLL DENSITY INDEX',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'EVI',
                    value: 'ENHANCED VEGETATION INDEX',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'NDWI',
                    value: 'WATER STRESS INDICATOR',
                    metric: '-1.00–1.00',
                  },
                ].map((index, idx) => (
                  <div key={idx} className="impact-card p-8 group">
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="font-sans text-2xl yellow group-hover:text-black">{index.label}</span>
                      <span className="font-mono text-xs opacity-60 group-hover:opacity-100 group-hover:text-black">{index.metric}</span>
                    </div>
                    <p className="font-mono text-xs group-hover:text-black tracking-wide">{index.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="impact-card p-16 group">
              <div className="aspect-square flex flex-col items-center justify-center text-center border-4 border-yellow yellow-bg p-16">
                <div className="flex items-center gap-3 mb-12">
                  <div className="w-3 h-3 bg-black blink" />
                  <div className="font-sans text-sm text-black tracking-widest">LIVE FEED</div>
                </div>
                <BarChart3 className="w-32 h-32 mb-10 text-black" strokeWidth={2.5} />
                <div className="font-sans hero-number text-[140px] font-bold text-black leading-none mb-5">0.82</div>
                <div className="font-sans text-sm text-black tracking-wider mb-3">
                  NDVI CURRENT
                </div>
                <div className="font-mono text-[10px] text-black opacity-60 tracking-widest">PASTURE 7 • 2H AGO</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deploy Section */}
      <section id="deploy" className="px-6 py-40 bg-black border-t-4 border-yellow">
        <div className="max-w-6xl mx-auto">
          <div className="mb-32 text-center">
            <div className="flex items-center gap-4 justify-center mb-10">
              <div className="w-3 h-3 yellow-bg blink" />
              <h2 className="font-sans text-8xl md:text-9xl yellow tracking-tight">DEPLOY</h2>
            </div>
            <div className="w-32 h-1 yellow-bg mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {[
              {
                name: 'BASE',
                price: 'FREE',
                description: 'SINGLE OPERATION',
                features: [
                  '1 LOCATION',
                  'DAILY DIRECTIVES',
                  'CORE INDICES',
                  'EMAIL SUPPORT',
                ],
              },
              {
                name: 'PRO',
                price: '$79',
                period: '/MO',
                description: 'MULTI-SITE OPS',
                features: [
                  '5 LOCATIONS',
                  'ADVANCED ANALYTICS',
                  'DATA EXPORT',
                  'API ACCESS',
                  'PRIORITY SUPPORT',
                ],
                highlighted: true,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`impact-card p-14 ${plan.highlighted ? 'border-[6px]' : ''}`}
              >
                <h3 className="font-sans text-4xl yellow mb-3 tracking-wider">{plan.name}</h3>
                <p className="font-mono text-[10px] mb-14 opacity-60 tracking-widest">{plan.description}</p>

                <div className="mb-16">
                  <span className="font-sans hero-number text-9xl yellow">{plan.price}</span>
                  {plan.period && (
                    <span className="font-mono text-2xl opacity-60">{plan.period}</span>
                  )}
                </div>

                <button
                  className={`w-full py-6 border-4 border-yellow font-sans text-xl mb-14 transition-all tracking-wider ${
                    plan.highlighted
                      ? 'yellow-bg text-black shadow-[8px_8px_0_#ffff00] hover:shadow-[4px_4px_0_#ffff00] hover:translate-x-1 hover:translate-y-1'
                      : 'bg-black text-yellow shadow-[8px_8px_0_#ffff00] hover:shadow-[4px_4px_0_#ffff00] hover:translate-x-1 hover:translate-y-1'
                  }`}
                >
                  {plan.highlighted ? 'ACTIVATE PRO' : 'ACTIVATE BASE'}
                </button>

                <ul className="space-y-5">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center gap-4 font-mono text-xs tracking-widest">
                      <div className="w-7 h-7 border-4 border-yellow yellow-bg flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-black" strokeWidth={4} />
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

      {/* CTA */}
      <section className="px-6 py-48 yellow-bg text-black border-t-4 border-black relative overflow-hidden">
        <div className="absolute inset-0 warning-stripes opacity-20" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="flex items-center gap-4 justify-center mb-12">
            <div className="w-4 h-4 bg-black blink" />
            <h2 className="font-sans text-8xl md:text-9xl leading-tight tracking-tight">
              READY TO
              <br />
              ACTIVATE?
            </h2>
          </div>

          <p className="font-mono text-lg mb-20 max-w-3xl mx-auto leading-relaxed font-bold">
            [SATELLITE INTELLIGENCE] ADAPTIVE GRAZING OPERATIONS •
            [PRECISION GUIDANCE] DATA-DRIVEN DECISIONS •
            [ZERO SETUP] INSTANT DEPLOYMENT
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center">
            <button className="px-16 py-7 bg-black text-yellow border-4 border-black font-sans text-2xl transition-all shadow-[10px_10px_0_#000000] hover:shadow-[5px_5px_0_#000000] hover:translate-x-1 hover:translate-y-1 flex items-center justify-center gap-3 group">
              DEPLOY NOW
              <ArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t-4 border-yellow py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 yellow-bg flex items-center justify-center border-4 border-yellow">
                  <Zap className="w-8 h-8 text-black" strokeWidth={3} />
                </div>
                <span className="font-sans text-2xl tracking-wider">OPENPASTURE</span>
              </div>
              <p className="font-mono text-[10px] yellow tracking-widest">
                SATELLITE INTELLIGENCE
              </p>
            </div>

            {[
              { title: 'SYSTEM', links: ['PLATFORM', 'DATA', 'API', 'DOCS'] },
              { title: 'COMPANY', links: ['ABOUT', 'CONTACT', 'CAREERS'] },
              { title: 'LEGAL', links: ['TERMS', 'PRIVACY', 'LICENSE'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans mb-5 text-sm yellow tracking-widest">{section.title}</h4>
                <ul className="space-y-3 font-mono text-xs tracking-widest opacity-60">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:yellow hover:opacity-100 transition-all">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t-4 border-yellow font-mono text-xs text-center yellow tracking-widest">
            © 2024 OPENPASTURE • APACHE 2.0
          </div>
        </div>
      </footer>
    </div>
  )
}
