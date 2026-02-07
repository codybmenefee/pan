import { ArrowRight, TrendingUp, Layers, BarChart3, Check } from 'lucide-react'

export function Concept14PrecisionAg() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1a1a1a]">
      <link
        href="https://fonts.googleapis.com/css2?family=Suisse+Intl:wght@300;400;500;600;700;800&family=Tiempos+Headline:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @font-face {
          font-family: 'Suisse Intl';
          src: url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800&display=swap');
          font-display: swap;
        }

        .font-sans { font-family: 'Work Sans', -apple-system, sans-serif; }
        .font-serif { font-family: 'Libre Baskerville', Georgia, serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .precision-card {
          background: white;
          border: 2px solid #1a1a1a;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .precision-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(82, 121, 111, 0.03), transparent);
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }

        .precision-card:hover {
          border-color: #52796f;
          transform: translate(-2px, -2px);
          box-shadow: 4px 4px 0 #52796f;
        }

        .precision-card:hover::after {
          opacity: 1;
        }

        .ag-green { color: #52796f; }
        .ag-green-bg { background: #52796f; }
        .ag-earth { color: #84a98c; }

        .metric-grid {
          background-image:
            linear-gradient(#1a1a1a 2px, transparent 2px),
            linear-gradient(90deg, #1a1a1a 2px, transparent 2px);
          background-size: 60px 60px;
          background-position: -2px -2px;
          opacity: 0.06;
        }

        .swiss-grid {
          background-image:
            linear-gradient(#52796f 1px, transparent 1px),
            linear-gradient(90deg, #52796f 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.08;
        }

        .data-badge {
          background: #1a1a1a;
          color: white;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 12px;
          font-weight: 600;
        }

        .hero-number {
          font-feature-settings: 'tnum', 'lnum';
          letter-spacing: -0.03em;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-delay-1 { animation-delay: 0.1s; opacity: 0; }
        .animate-delay-2 { animation-delay: 0.2s; opacity: 0; }
        .animate-delay-3 { animation-delay: 0.3s; opacity: 0; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-black font-sans">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 ag-green-bg border-2 border-black flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">OpenPasture</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#platform" className="hover:text-[#52796f] transition-colors">
              Platform
            </a>
            <a href="#data" className="hover:text-[#52796f] transition-colors">
              Data
            </a>
            <a href="#pricing" className="hover:text-[#52796f] transition-colors">
              Pricing
            </a>
            <button className="px-6 py-2.5 ag-green-bg text-white border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[3px_3px_0_#1a1a1a]">
              Get started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-32 relative overflow-hidden">
        <div className="absolute inset-0 swiss-grid" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-5xl space-y-10">
            <div className="data-badge inline-block animate-in">
              Precision Intelligence System
            </div>

            <h1 className="font-serif text-7xl md:text-8xl lg:text-[120px] font-bold leading-[0.9] tracking-tight animate-in animate-delay-1">
              Satellite-grade
              <br />
              <span className="ag-green italic">grazing data</span>
            </h1>

            <p className="font-sans text-2xl md:text-3xl text-[#1a1a1a] max-w-3xl leading-relaxed font-light animate-in animate-delay-2">
              Sentinel-2 multispectral analysis transformed into daily pasture recommendations.
              Professional-grade vegetation intelligence for adaptive grazing operations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 animate-in animate-delay-3">
              <button className="px-10 py-5 ag-green-bg text-white border-2 border-black font-sans font-bold transition-all shadow-[4px_4px_0_#1a1a1a] hover:shadow-[2px_2px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 group">
                Start free trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-10 py-5 border-2 border-black bg-white text-black font-sans font-bold transition-all shadow-[4px_4px_0_#1a1a1a] hover:shadow-[2px_2px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5">
                View demo
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl">
            {[
              { value: '10m', label: 'Resolution', sublabel: 'Sentinel-2' },
              { value: '5d', label: 'Cadence', sublabel: 'Update frequency' },
              { value: '91%', label: 'Confidence', sublabel: 'Avg accuracy' },
            ].map((metric, idx) => (
              <div key={idx} className="precision-card p-8">
                <div className="font-mono hero-number text-6xl font-bold ag-green mb-3">{metric.value}</div>
                <div className="font-sans text-sm font-bold uppercase tracking-wider mb-1">
                  {metric.label}
                </div>
                <div className="font-sans text-xs text-gray-600">{metric.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section id="platform" className="px-6 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="font-serif text-6xl font-bold mb-6">
              Complete platform
            </h2>
            <p className="font-sans text-2xl text-gray-700 max-w-2xl font-light">
              Vegetation intelligence infrastructure for data-driven grazing
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'Spectral Indices',
                description:
                  'NDVI, EVI, NDWI analysis updated every 5 days from Sentinel-2 satellites.',
              },
              {
                icon: BarChart3,
                title: 'Time-Series',
                description:
                  'Recovery pattern tracking and seasonal trend analysis across pastures.',
              },
              {
                icon: Layers,
                title: 'Recommendations',
                description:
                  'Daily guidance with confidence scores and transparent reasoning.',
              },
              {
                icon: Check,
                title: 'Override System',
                description:
                  'Accept, adjust, or reject recommendations with feedback integration.',
              },
              {
                icon: TrendingUp,
                title: 'Historical Archive',
                description:
                  'Complete grazing and recovery data for pattern analysis.',
              },
              {
                icon: BarChart3,
                title: 'Export & API',
                description:
                  'Data export and integration with farm management systems.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="precision-card p-8">
                  <div className="w-14 h-14 ag-green-bg border-2 border-black flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-sans text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="font-sans text-gray-700 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section id="data" className="px-6 py-32 bg-[#f7f7f5] relative">
        <div className="absolute inset-0 metric-grid" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-6xl font-bold mb-8">
                Ground truth from orbit
              </h2>
              <p className="font-sans text-xl text-gray-800 mb-10 leading-relaxed">
                Multispectral sensors reveal vegetation health, moisture stress, and biomass
                density invisible from ground level.
              </p>

              <div className="space-y-4">
                {[
                  {
                    label: 'NDVI',
                    value: 'Chlorophyll density & health',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'EVI',
                    value: 'Enhanced vegetation index',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'NDWI',
                    value: 'Water stress detection',
                    metric: '-1.00–1.00',
                  },
                ].map((index, idx) => (
                  <div key={idx} className="precision-card p-6">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-mono text-lg font-bold ag-green">{index.label}</span>
                      <span className="font-mono text-xs text-gray-500">{index.metric}</span>
                    </div>
                    <p className="font-sans text-gray-700">{index.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="precision-card p-12 bg-white">
              <div className="aspect-square flex flex-col items-center justify-center text-center">
                <div className="data-badge mb-8">LIVE DATA</div>
                <BarChart3 className="w-24 h-24 ag-green mb-6" />
                <div className="font-mono hero-number text-7xl font-bold ag-green mb-3">0.82</div>
                <div className="font-sans text-sm font-semibold uppercase tracking-wider mb-2">
                  Current NDVI
                </div>
                <div className="font-mono text-xs text-gray-500">Pasture 7 • 2h ago</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-32 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <h2 className="font-serif text-6xl font-bold mb-6">Transparent pricing</h2>
            <p className="font-sans text-2xl text-gray-700 font-light">
              Start free, scale with your operation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: 'Single farm operations',
                features: [
                  '1 farm location',
                  'Daily recommendations',
                  'Basic indices',
                  'Email support',
                ],
              },
              {
                name: 'Professional',
                price: '$79',
                period: '/mo',
                description: 'Serious grazing operations',
                features: [
                  '5 farm locations',
                  'Advanced analytics',
                  'Historical export',
                  'API access',
                  'Priority support',
                ],
                highlighted: true,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`precision-card p-12 ${plan.highlighted ? 'bg-[#f0f4f3]' : 'bg-white'}`}
              >
                <h3 className="font-sans text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="font-sans text-sm text-gray-600 mb-8">{plan.description}</p>

                <div className="mb-10">
                  <span className="font-mono hero-number text-7xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="font-mono text-2xl text-gray-600">{plan.period}</span>
                  )}
                </div>

                <button
                  className={`w-full py-4 border-2 border-black font-sans font-bold mb-10 transition-all ${
                    plan.highlighted
                      ? 'ag-green-bg text-white shadow-[4px_4px_0_#1a1a1a] hover:shadow-[2px_2px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5'
                      : 'bg-white shadow-[4px_4px_0_#1a1a1a] hover:shadow-[2px_2px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5'
                  }`}
                >
                  {plan.highlighted ? 'Start trial' : 'Get started'}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center gap-3 font-sans text-sm">
                      <div className="w-5 h-5 ag-green-bg border border-black flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
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
      <section className="px-6 py-40 bg-[#1a1a1a] text-white relative overflow-hidden">
        <div className="absolute inset-0 metric-grid opacity-30" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="font-serif text-6xl md:text-7xl font-bold mb-10 leading-tight">
            Deploy precision intelligence
          </h2>
          <p className="font-sans text-2xl text-gray-300 mb-14 max-w-3xl mx-auto font-light">
            Join operations using satellite data for adaptive grazing decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-12 py-6 bg-white text-black border-2 border-white font-sans font-bold transition-all shadow-[6px_6px_0_rgba(255,255,255,0.2)] hover:shadow-[3px_3px_0_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 group">
              Get started free
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-12 py-6 border-2 border-white text-white font-sans font-bold transition-all shadow-[6px_6px_0_rgba(255,255,255,0.2)] hover:shadow-[3px_3px_0_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5">
              Schedule demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-black py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 ag-green-bg border-2 border-black flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="font-sans text-lg font-bold">OpenPasture</span>
              </div>
              <p className="font-sans text-sm text-gray-700">
                Precision grazing intelligence platform
              </p>
            </div>

            {[
              {
                title: 'Product',
                links: ['Platform', 'Pricing', 'API', 'Demo'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Contact'],
              },
              {
                title: 'Resources',
                links: ['Documentation', 'Support', 'Privacy', 'Terms'],
              },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-bold mb-4 uppercase text-xs tracking-wider">{section.title}</h4>
                <ul className="space-y-2 font-sans text-sm text-gray-700">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:text-[#52796f] transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t-2 border-black font-mono text-xs text-gray-600 text-center uppercase tracking-wider">
            © 2024 OpenPasture • Apache 2.0 Licensed
          </div>
        </div>
      </footer>
    </div>
  )
}
