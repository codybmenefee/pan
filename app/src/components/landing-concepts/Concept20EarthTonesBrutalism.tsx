import { ArrowRight, TrendingUp, Layers, BarChart3, Check, Sprout } from 'lucide-react'

export function Concept20EarthTonesBrutalism() {
  return (
    <div className="min-h-screen bg-[#f5f1ed] text-[#2d2416]">
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Courier+Prime:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-sans { font-family: 'Archivo', sans-serif; }
        .font-mono { font-family: 'Courier Prime', monospace; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .earth-card {
          background: #fefdfb;
          border: 2px solid #8b6f47;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .earth-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(139, 111, 71, 0.05), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .earth-card:hover::before {
          opacity: 1;
        }

        .earth-card:hover {
          transform: translate(-4px, -4px);
          box-shadow: 6px 6px 0 #8b6f47;
        }

        .earth-brown { color: #8b6f47; }
        .earth-brown-bg { background: #8b6f47; }
        .earth-terra { color: #c17c5c; }
        .earth-terra-bg { background: #c17c5c; }
        .earth-soil { color: #6b5444; }

        .soil-texture {
          background-image:
            linear-gradient(rgba(139, 111, 71, 0.08) 2px, transparent 2px),
            linear-gradient(90deg, rgba(139, 111, 71, 0.08) 2px, transparent 2px);
          background-size: 60px 60px;
          background-position: -2px -2px;
        }

        .terracotta-badge {
          background: #c17c5c;
          color: #fefdfb;
          font-family: 'Courier Prime', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 6px 14px;
          font-weight: 700;
          border: 2px solid #8b6f47;
        }

        .hero-number {
          font-feature-settings: 'tnum', 'lnum';
          letter-spacing: -0.04em;
        }

        @keyframes growIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .grow-in {
          animation: growIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fefdfb] border-b-2 border-[#8b6f47] font-sans">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 earth-terra-bg border-2 border-[#8b6f47] flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">OpenPasture</div>
              <div className="text-[9px] font-mono earth-brown uppercase tracking-widest">Land Intelligence</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
            <a href="#platform" className="earth-soil hover:earth-brown transition-colors">
              Platform
            </a>
            <a href="#wisdom" className="earth-soil hover:earth-brown transition-colors">
              Wisdom
            </a>
            <a href="#pricing" className="earth-soil hover:earth-brown transition-colors">
              Pricing
            </a>
            <button className="px-6 py-2.5 earth-brown-bg text-white border-2 border-[#8b6f47] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0_#8b6f47] font-bold">
              Begin
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-36 relative overflow-hidden">
        <div className="absolute inset-0 soil-texture opacity-40" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-6xl space-y-12">
            <div className="terracotta-badge inline-block grow-in">
              Rooted in Science
            </div>

            <h1 className="font-sans text-[clamp(4rem,9vw,8.5rem)] font-black leading-[0.88] tracking-tight grow-in delay-1">
              Read the land
              <br />
              <span className="earth-terra italic">from above</span>
            </h1>

            <p className="font-mono text-xl md:text-2xl earth-soil max-w-4xl leading-relaxed grow-in delay-2">
              Generations of ranchers read the land by walking it. Now Sentinel-2 satellites
              give you the whole picture—vegetation health, recovery patterns, grazing readiness—
              updated every 5 days.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-8 grow-in delay-3">
              <button className="px-11 py-5 earth-brown-bg text-white border-2 border-[#8b6f47] font-sans font-bold transition-all shadow-[5px_5px_0_#8b6f47] hover:shadow-[2px_2px_0_#8b6f47] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 group">
                Start free trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </button>
              <button className="px-11 py-5 border-2 border-[#8b6f47] bg-[#fefdfb] earth-brown font-sans font-bold transition-all shadow-[5px_5px_0_#8b6f47] hover:shadow-[2px_2px_0_#8b6f47] hover:translate-x-0.5 hover:translate-y-0.5">
                See how it works
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="mt-28 grid md:grid-cols-3 gap-6 max-w-6xl">
            {[
              { value: '10m', label: 'Ground resolution', sublabel: 'Per pixel accuracy' },
              { value: '5 days', label: 'Update cycle', sublabel: 'Fresh data rhythm' },
              { value: '91%', label: 'Confidence avg', sublabel: 'System precision' },
            ].map((metric, idx) => (
              <div key={idx} className="earth-card p-10">
                <div className="font-mono hero-number text-7xl font-bold earth-brown mb-4">{metric.value}</div>
                <div className="font-sans text-sm font-bold earth-soil uppercase tracking-wide mb-2">
                  {metric.label}
                </div>
                <div className="font-mono text-xs text-gray-600">{metric.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section id="platform" className="px-6 py-36 bg-[#fefdfb]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24">
            <h2 className="font-sans text-6xl md:text-7xl font-black mb-6 earth-brown">
              Built for ranchers
            </h2>
            <p className="font-mono text-xl earth-soil max-w-2xl">
              Tools that respect traditional knowledge while adding modern precision
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'Vegetation Health',
                description:
                  'NDVI, EVI, NDWI indices track plant vigor and biomass density across every pasture.',
              },
              {
                icon: BarChart3,
                title: 'Recovery Tracking',
                description:
                  "See how each pasture recovers after grazing. Learn your land's natural rhythms.",
              },
              {
                icon: Layers,
                title: 'Daily Guidance',
                description:
                  'Morning recommendations on which pasture to graze, backed by confidence scores.',
              },
              {
                icon: Check,
                title: 'Your Final Say',
                description:
                  'Override any recommendation. Your experience matters—the system learns from it.',
              },
              {
                icon: TrendingUp,
                title: 'Historical Record',
                description:
                  'Build institutional knowledge. Track patterns across seasons and years.',
              },
              {
                icon: BarChart3,
                title: 'Data Export',
                description:
                  'Your data, your way. Export or integrate with existing farm systems.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="earth-card p-9">
                  <div className="w-14 h-14 earth-terra-bg border-2 border-[#8b6f47] flex items-center justify-center mb-7">
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-sans text-xl font-bold mb-4 earth-soil">{feature.title}</h3>
                  <p className="font-mono text-sm leading-relaxed text-gray-700">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Wisdom Section */}
      <section id="wisdom" className="px-6 py-36 soil-texture relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-sans text-6xl md:text-7xl font-black mb-10 earth-brown leading-[0.95]">
                The land tells us everything
              </h2>
              <p className="font-mono text-lg mb-12 leading-relaxed earth-soil">
                Satellite sensors see what our eyes can't—early stress signals, moisture patterns,
                biomass distribution. Ancient ranching wisdom meets space-age precision.
              </p>

              <div className="space-y-5">
                {[
                  {
                    label: 'NDVI',
                    value: 'Plant health & chlorophyll',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'EVI',
                    value: 'Biomass in dense stands',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'NDWI',
                    value: 'Water stress & drought',
                    metric: '-1.00–1.00',
                  },
                ].map((index, idx) => (
                  <div key={idx} className="earth-card p-7 bg-[#fefdfb]">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="font-mono text-lg font-bold earth-brown">{index.label}</span>
                      <span className="font-mono text-xs text-gray-600">{index.metric}</span>
                    </div>
                    <p className="font-mono text-sm earth-soil">{index.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="earth-card p-14 bg-[#fefdfb]">
              <div className="aspect-square flex flex-col items-center justify-center text-center border-2 border-[#8b6f47] p-14 bg-gradient-to-br from-[#f5f1ed] to-[#fefdfb]">
                <div className="terracotta-badge mb-10">Current Reading</div>
                <BarChart3 className="w-28 h-28 earth-brown mb-8" strokeWidth={2} />
                <div className="font-mono hero-number text-[110px] font-bold earth-brown leading-none mb-4">0.82</div>
                <div className="font-sans text-sm font-bold earth-soil uppercase tracking-wide mb-2">
                  NDVI • Pasture 7
                </div>
                <div className="font-mono text-xs text-gray-600">Updated 2 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-36 bg-[#fefdfb]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-24 text-center">
            <h2 className="font-sans text-6xl md:text-7xl font-black mb-6 earth-brown">Honest pricing</h2>
            <p className="font-mono text-xl earth-soil">
              Start free, scale as your operation grows
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: 'Homestead',
                price: 'Free',
                description: 'Single ranch operation',
                features: [
                  '1 ranch location',
                  'Daily recommendations',
                  'Core vegetation indices',
                  'Email support',
                ],
              },
              {
                name: 'Ranch',
                price: '$79',
                period: '/month',
                description: 'Professional operation',
                features: [
                  '5 ranch locations',
                  'Advanced analytics',
                  'Historical data export',
                  'API access',
                  'Priority support',
                ],
                highlighted: true,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`earth-card p-12 bg-[#fefdfb] ${plan.highlighted ? 'border-[3px]' : ''}`}
              >
                <h3 className="font-sans text-3xl font-bold mb-2 earth-brown">{plan.name}</h3>
                <p className="font-mono text-sm text-gray-600 mb-10">{plan.description}</p>

                <div className="mb-12">
                  <span className="font-mono hero-number text-8xl font-bold earth-brown">{plan.price}</span>
                  {plan.period && (
                    <span className="font-mono text-2xl text-gray-600">{plan.period}</span>
                  )}
                </div>

                <button
                  className={`w-full py-5 border-2 border-[#8b6f47] font-sans font-bold mb-12 transition-all ${
                    plan.highlighted
                      ? 'earth-brown-bg text-white shadow-[5px_5px_0_#8b6f47] hover:shadow-[2px_2px_0_#8b6f47] hover:translate-x-0.5 hover:translate-y-0.5'
                      : 'bg-[#fefdfb] earth-brown shadow-[5px_5px_0_#8b6f47] hover:shadow-[2px_2px_0_#8b6f47] hover:translate-x-0.5 hover:translate-y-0.5'
                  }`}
                >
                  {plan.highlighted ? 'Start trial' : 'Get started'}
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center gap-3 font-mono text-sm">
                      <div className="w-6 h-6 earth-terra-bg border-2 border-[#8b6f47] flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
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
      <section className="px-6 py-40 earth-brown-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 soil-texture opacity-20" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="font-sans text-6xl md:text-7xl lg:text-8xl font-black mb-12 leading-tight">
            Ready to read your land?
          </h2>
          <p className="font-mono text-xl text-[#f5f1ed] mb-16 max-w-3xl mx-auto leading-relaxed">
            Join ranchers using satellite intelligence to make better grazing decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-12 py-6 bg-white earth-brown border-2 border-[#8b6f47] font-sans font-bold transition-all shadow-[6px_6px_0_rgba(255,255,255,0.3)] hover:shadow-[3px_3px_0_rgba(255,255,255,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 group">
              Start free trial
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
            <button className="px-12 py-6 border-2 border-white text-white font-sans font-bold transition-all shadow-[6px_6px_0_rgba(255,255,255,0.2)] hover:shadow-[3px_3px_0_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5">
              Schedule demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#fefdfb] border-t-2 border-[#8b6f47] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-11 h-11 earth-terra-bg border-2 border-[#8b6f47] flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-sans text-lg font-bold">OpenPasture</span>
              </div>
              <p className="font-mono text-xs earth-soil">
                Land intelligence from orbit
              </p>
            </div>

            {[
              { title: 'Platform', links: ['Features', 'Pricing', 'API', 'Demo'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Resources', links: ['Docs', 'Support', 'Privacy', 'Terms'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-bold mb-5 text-xs uppercase tracking-wider earth-brown">{section.title}</h4>
                <ul className="space-y-3 font-mono text-xs text-gray-600">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:earth-brown transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t-2 border-[#8b6f47] font-mono text-xs text-center earth-soil uppercase tracking-wider">
            © 2024 OpenPasture • Apache 2.0 Licensed
          </div>
        </div>
      </footer>
    </div>
  )
}
