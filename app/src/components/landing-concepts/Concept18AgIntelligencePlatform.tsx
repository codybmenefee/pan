import { ArrowRight, Layers, TrendingUp, Check, BarChart2, Sparkles } from 'lucide-react'

export function Concept18AgIntelligencePlatform() {
  return (
    <div className="min-h-screen bg-[#fdfcfb] text-[#1a1a1a]">
      <link
        href="https://fonts.googleapis.com/css2?family=Graphik:wght@300;400;500;600;700;800&family=Switzer:wght@300;400;500;600;700;800&family=Tiempos+Text:wght@400;500;600;700&family=Recoleta:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Lora:wght@400;500;600;700&display=swap');

        .font-sans { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; }
        .font-serif { font-family: 'Lora', Georgia, serif; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern', 'liga', 'calt';
        }

        .platform-card {
          background: white;
          border: 1px solid rgba(105, 120, 64, 0.08);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .platform-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(105, 120, 64, 0.05), transparent);
          opacity: 0;
          transition: opacity 0.35s;
        }

        .platform-card:hover::after {
          opacity: 1;
        }

        .platform-card:hover {
          border-color: rgba(105, 120, 64, 0.2);
          box-shadow: 0 20px 50px rgba(105, 120, 64, 0.12), 0 0 0 1px rgba(105, 120, 64, 0.05);
          transform: translateY(-4px);
        }

        .ag-olive { color: #697840; }
        .ag-olive-light { color: #8a9a5a; }
        .ag-olive-bg { background: #697840; }

        .subtle-pattern {
          background-image:
            radial-gradient(circle at 25% 15%, rgba(105, 120, 64, 0.04) 0%, transparent 50%),
            radial-gradient(circle at 75% 85%, rgba(105, 120, 64, 0.03) 0%, transparent 50%);
        }

        .mesh-gradient {
          background:
            radial-gradient(at 20% 30%, rgba(105, 120, 64, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 70%, rgba(138, 154, 90, 0.08) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(105, 120, 64, 0.05) 0px, transparent 50%);
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .float {
          animation: float 8s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(105, 120, 64, 0.08) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 4s ease-in-out infinite;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .delay-100 { animation-delay: 0.1s; opacity: 0; }
        .delay-200 { animation-delay: 0.2s; opacity: 0; }
        .delay-300 { animation-delay: 0.3s; opacity: 0; }
        .delay-400 { animation-delay: 0.4s; opacity: 0; }

        .elegant-underline {
          position: relative;
          display: inline-block;
        }

        .elegant-underline::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 0;
          right: 0;
          height: 12px;
          background: rgba(105, 120, 64, 0.15);
          z-index: -1;
          border-radius: 2px;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-gray-100 font-sans">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 ag-olive-bg rounded-xl flex items-center justify-center shadow-lg shadow-gray-900/5">
              <Layers className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold tracking-tight">OpenPasture</span>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-[15px] font-medium">
            <a href="#platform" className="text-gray-600 hover:text-gray-900 transition-colors">
              Platform
            </a>
            <a href="#intelligence" className="text-gray-600 hover:text-gray-900 transition-colors">
              Intelligence
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <button className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-semibold shadow-lg shadow-gray-900/10">
              Get started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-36 mesh-gradient relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-full text-sm font-medium mb-12 font-sans shadow-lg shadow-gray-900/5 fade-in-up">
            <Sparkles className="w-4 h-4 ag-olive" strokeWidth={2} />
            <span>Agricultural Intelligence Platform</span>
          </div>

          <h1 className="font-serif text-[clamp(4rem,9vw,7.5rem)] font-bold leading-[0.9] mb-12 tracking-tight fade-in-up delay-100">
            Satellite intelligence
            <br />
            for <span className="ag-olive italic elegant-underline">adaptive grazing</span>
          </h1>

          <p className="font-sans text-2xl md:text-3xl text-gray-600 max-w-4xl mx-auto mb-14 leading-relaxed font-normal fade-in-up delay-200">
            Know exactly when your pastures are ready. Daily recommendations powered by Sentinel-2
            satellites, delivered with confidence scores and clear reasoning.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center fade-in-up delay-300">
            <button className="px-10 py-5 bg-gray-900 text-white rounded-xl font-sans font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group shadow-2xl shadow-gray-900/10">
              Start free trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
            <button className="px-10 py-5 platform-card rounded-xl font-sans font-bold hover:bg-gray-50 transition-all">
              Watch demo
            </button>
          </div>
        </div>

        {/* Floating decoration */}
        <div className="absolute top-20 right-20 w-64 h-64 ag-olive-bg rounded-full opacity-5 blur-3xl float" />
        <div className="absolute bottom-20 left-20 w-48 h-48 ag-olive-bg rounded-full opacity-5 blur-3xl float" style={{ animationDelay: '2s' }} />
      </section>

      {/* Stats */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="platform-card rounded-3xl p-16 relative overflow-hidden">
            <div className="shimmer absolute inset-0" />
            <div className="grid md:grid-cols-3 gap-16 text-center relative z-10">
              {[
                { value: '10m', label: 'Spatial resolution', detail: 'Sentinel-2 imagery' },
                { value: '5 days', label: 'Update frequency', detail: 'Fresh satellite data' },
                { value: '91%', label: 'Avg confidence', detail: 'Recommendation accuracy' },
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="font-serif text-6xl font-bold ag-olive mb-3">{stat.value}</div>
                  <div className="font-sans text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <div className="font-sans text-xs text-gray-500">{stat.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section id="platform" className="px-6 py-32 subtle-pattern">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-serif text-6xl md:text-7xl font-bold mb-6">The complete platform</h2>
            <p className="font-sans text-2xl text-gray-600 max-w-3xl mx-auto font-normal">
              Everything you need for data-driven grazing decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: 'Vegetation Intelligence',
                description:
                  'NDVI, EVI, and NDWI indices from Sentinel-2 satellites, updated every 5 days.',
              },
              {
                icon: TrendingUp,
                title: 'Recovery Analytics',
                description:
                  'Time-series analysis tracks pasture recovery patterns and optimal rotation timing.',
              },
              {
                icon: BarChart2,
                title: 'Daily Recommendations',
                description:
                  'Clear guidance on where to graze today, with confidence scores and reasoning.',
              },
              {
                icon: Check,
                title: 'Override Control',
                description:
                  'Accept, adjust, or override any recommendation with natural language feedback.',
              },
              {
                icon: TrendingUp,
                title: 'Historical Data',
                description:
                  'Access complete grazing history and recovery trends for pattern analysis.',
              },
              {
                icon: Layers,
                title: 'Export & API',
                description:
                  'Download data or integrate with your farm management systems via API.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="platform-card rounded-2xl p-10">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-8 shadow-sm">
                    <Icon className="w-7 h-7 ag-olive" strokeWidth={2} />
                  </div>
                  <h3 className="font-sans text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="font-sans text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Intelligence Section */}
      <section id="intelligence" className="px-6 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-serif text-6xl md:text-7xl font-bold mb-8">
                Intelligence you can trust
              </h2>
              <p className="font-sans text-xl text-gray-600 mb-12 leading-relaxed font-normal">
                Every recommendation includes transparent reasoning and confidence scoring. No black
                boxes—just clear guidance backed by satellite data and vegetation science.
              </p>

              <ul className="space-y-5">
                {[
                  'Multispectral analysis from 13 satellite bands',
                  'Time-series recovery pattern recognition',
                  'Confidence scoring with transparent reasoning',
                  'Override capability with feedback loop',
                ].map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-4 font-sans text-lg">
                    <div className="w-6 h-6 ag-olive-bg rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-gray-900/10">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="platform-card rounded-3xl p-14 relative overflow-hidden">
              <div className="shimmer absolute inset-0" />
              <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl p-16 text-center relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 ag-olive-bg rounded-2xl mb-10 shadow-xl shadow-gray-900/10">
                  <BarChart2 className="w-10 h-10 text-white" strokeWidth={2} />
                </div>
                <div className="font-serif text-8xl font-bold ag-olive mb-4">0.82</div>
                <div className="font-sans text-sm text-gray-600 mb-2 font-semibold uppercase tracking-wider">Current NDVI</div>
                <div className="font-sans text-xs text-gray-500">Pasture 7 • Updated 2 hours ago</div>

                <div className="mt-12 pt-12 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-10 text-left font-sans text-sm">
                    <div>
                      <div className="text-gray-500 mb-2 uppercase tracking-wider text-xs font-semibold">Confidence</div>
                      <div className="ag-olive font-bold text-3xl">91%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-2 uppercase tracking-wider text-xs font-semibold">Recovery</div>
                      <div className="ag-olive font-bold text-3xl">14 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-32 subtle-pattern">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-serif text-6xl md:text-7xl font-bold mb-6">Simple, transparent pricing</h2>
            <p className="font-sans text-2xl text-gray-600 font-normal">
              Start free, scale as you grow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: 'For single-farm operations',
                features: [
                  '1 farm location',
                  'Daily recommendations',
                  'Basic vegetation indices',
                  'Email support',
                ],
              },
              {
                name: 'Professional',
                price: '$79',
                period: '/month',
                description: 'For serious operations',
                features: [
                  'Up to 5 farms',
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
                className={`platform-card rounded-3xl p-12 ${plan.highlighted ? 'ring-2 ring-gray-900 shadow-2xl' : ''}`}
              >
                <h3 className="font-sans text-3xl font-bold mb-2">{plan.name}</h3>
                <p className="font-sans text-sm text-gray-600 mb-10">{plan.description}</p>

                <div className="mb-12">
                  <span className="font-serif text-7xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="font-sans text-2xl text-gray-600 font-normal">{plan.period}</span>
                  )}
                </div>

                <button
                  className={`w-full py-5 rounded-xl font-sans font-bold mb-12 transition-all ${
                    plan.highlighted
                      ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-xl shadow-gray-900/10'
                      : 'platform-card hover:bg-gray-50'
                  }`}
                >
                  {plan.highlighted ? 'Start trial' : 'Get started'}
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center gap-3 font-sans text-sm">
                      <div className="w-5 h-5 ag-olive-bg rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
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
      <section className="px-6 py-40 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ag-olive-bg rounded-full opacity-10 blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="font-serif text-6xl md:text-7xl font-bold mb-12 leading-tight">
            Ready to get started?
          </h2>
          <p className="font-sans text-2xl text-gray-300 mb-16 max-w-3xl mx-auto font-normal">
            Join operations using satellite intelligence for adaptive grazing decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-12 py-6 bg-white text-gray-900 rounded-xl font-sans font-bold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2 group shadow-2xl shadow-white/10">
              Start free trial
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
            <button className="px-12 py-6 border-2 border-white/20 text-white rounded-xl font-sans font-bold hover:bg-white/5 transition-all backdrop-blur-xl">
              Schedule demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-16 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-10 h-10 ag-olive-bg rounded-xl flex items-center justify-center shadow-md shadow-gray-900/5">
                  <Layers className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <span className="font-sans text-xl font-bold">OpenPasture</span>
              </div>
              <p className="font-sans text-sm text-gray-600">
                Agricultural intelligence platform powered by satellite data.
              </p>
            </div>

            {[
              { title: 'Platform', links: ['Features', 'Pricing', 'API'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers'] },
              { title: 'Resources', links: ['Documentation', 'Support', 'Privacy'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-bold mb-5 text-sm uppercase tracking-wider">{section.title}</h4>
                <ul className="space-y-3 font-sans text-sm text-gray-600">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:text-gray-900 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-gray-100 font-sans text-sm text-gray-600 text-center">
            © 2024 OpenPasture. Apache 2.0 Licensed.
          </div>
        </div>
      </footer>
    </div>
  )
}
