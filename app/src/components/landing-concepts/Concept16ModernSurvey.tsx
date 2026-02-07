import { ArrowRight, Map, TrendingUp, Check, ChevronRight } from 'lucide-react'

export function Concept16ModernSurvey() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <link
        href="https://fonts.googleapis.com/css2?family=Sohne:wght@300;400;500;600;700&family=Archivo:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Lora:wght@400;500;600;700&display=swap');

        .font-sans { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
        .font-serif { font-family: 'Lora', Georgia, serif; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .survey-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .survey-card:hover {
          border-color: rgba(99, 123, 71, 0.2);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(99, 123, 71, 0.1);
          transform: translateY(-2px);
        }

        .topo-lines {
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 79px,
              rgba(99, 123, 71, 0.05) 79px,
              rgba(99, 123, 71, 0.05) 80px
            );
        }

        .topo-contour {
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              rgba(99, 123, 71, 0.03) 39px,
              rgba(99, 123, 71, 0.03) 40px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              rgba(99, 123, 71, 0.03) 39px,
              rgba(99, 123, 71, 0.03) 40px
            );
        }

        .land-green { color: #637b47; }
        .land-green-bg { background: #637b47; }

        .gradient-fade {
          background: linear-gradient(to bottom, white, rgba(255, 255, 255, 0));
        }

        .text-gradient {
          background: linear-gradient(135deg, #637b47 0%, #4a5a35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .float-animation {
          animation: float 6s ease-in-out infinite;
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(99, 123, 71, 0.1) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100 font-sans">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Map className="w-6 h-6 land-green" strokeWidth={1.5} />
            <span className="text-xl font-semibold tracking-tight">OpenPasture</span>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-[15px] font-medium">
            <a href="#product" className="text-gray-600 hover:text-gray-900 transition-colors">
              Product
            </a>
            <a href="#how" className="text-gray-600 hover:text-gray-900 transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <button className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-[15px] font-medium">
              Get started
              <ChevronRight className="inline w-4 h-4 ml-1" />
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-40 relative overflow-hidden">
        <div className="absolute inset-0 topo-contour opacity-40" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full text-sm font-medium text-gray-700 font-sans border border-gray-200 mb-10">
            <div className="w-1.5 h-1.5 land-green-bg rounded-full" />
            <span>Satellite intelligence for grazing</span>
          </div>

          <h1 className="font-serif text-[clamp(3.5rem,8vw,7rem)] font-bold leading-[0.95] mb-8 tracking-tight">
            Map your land's
            <br />
            <span className="text-gradient italic">invisible patterns</span>
          </h1>

          <p className="font-sans text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-14 leading-relaxed font-normal">
            Daily satellite analysis reveals vegetation health and recovery trends—helping you make
            better grazing decisions with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gray-900 text-white rounded-xl font-sans font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-gray-900/10">
              Start free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 survey-card rounded-xl font-sans font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              <Map className="w-5 h-5" />
              View demo
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-24 pt-20 border-t border-gray-200">
            <div className="font-sans text-sm text-gray-500 mb-10 uppercase tracking-wider font-semibold">
              Trusted by regenerative operations
            </div>
            <div className="grid grid-cols-3 gap-16 max-w-3xl mx-auto">
              {[
                { value: '10m', label: 'Resolution' },
                { value: '5 day', label: 'Cadence' },
                { value: '91%', label: 'Confidence' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="font-serif text-5xl font-bold land-green mb-2">{stat.value}</div>
                  <div className="font-sans text-sm text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="product" className="px-6 py-32 topo-lines relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-serif text-5xl md:text-6xl font-bold mb-5">Everything you need</h2>
            <p className="font-sans text-xl text-gray-600 font-normal">
              Comprehensive satellite intelligence, delivered daily
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Map,
                title: 'Vegetation mapping',
                description:
                  'NDVI, EVI, and NDWI indices from Sentinel-2 satellites—updated every 5 days across your entire operation.',
              },
              {
                icon: TrendingUp,
                title: 'Recovery tracking',
                description:
                  'Time-series analysis shows how pastures recover over time, helping you optimize rotation timing.',
              },
              {
                icon: Check,
                title: 'Daily recommendations',
                description:
                  'Clear guidance on where to graze today, with confidence scores and transparent reasoning.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="survey-card p-10 rounded-2xl">
                  <div className="w-14 h-14 land-green-bg rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-gray-900/5">
                    <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-sans text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="font-sans text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-serif text-5xl md:text-6xl font-bold mb-5">How it works</h2>
            <p className="font-sans text-xl text-gray-600 font-normal">
              Three steps to better decisions every morning
            </p>
          </div>

          <div className="space-y-16">
            {[
              {
                step: '01',
                title: 'Satellites capture multispectral imagery',
                description:
                  'Sentinel-2 satellites pass overhead every 5 days, capturing 13 bands of spectral data across your farm.',
              },
              {
                step: '02',
                title: 'AI analyzes vegetation patterns',
                description:
                  'Our models process NDVI, EVI, and NDWI to understand vegetation health, biomass density, and recovery status.',
              },
              {
                step: '03',
                title: 'You receive a clear recommendation',
                description:
                  'Each morning, get a simple answer: which pasture to graze, with confidence score and reasoning included.',
              },
            ].map((step, idx) => (
              <div key={idx} className="flex gap-10 items-start survey-card p-10 rounded-2xl">
                <div className="flex-shrink-0 w-20 h-20 land-green-bg rounded-2xl flex items-center justify-center shadow-lg shadow-gray-900/5">
                  <span className="font-serif text-3xl font-bold text-white">{step.step}</span>
                </div>
                <div className="flex-1 pt-3">
                  <h3 className="font-sans text-2xl font-semibold mb-4">{step.title}</h3>
                  <p className="font-sans text-lg text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-serif text-5xl md:text-6xl font-bold mb-8">
                See the whole picture
              </h2>
              <p className="font-sans text-xl text-gray-600 mb-10 leading-relaxed font-normal">
                Satellite imagery reveals vegetation patterns you can't see from the ground—giving
                you the complete view before making grazing decisions.
              </p>

              <ul className="space-y-5">
                {[
                  'Track recovery trends across all pastures',
                  "Identify stress before it's visible",
                  'Make decisions backed by objective data',
                  'Optimize rotation timing with confidence',
                ].map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-4 font-sans text-lg">
                    <div className="flex-shrink-0 w-6 h-6 land-green-bg rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="survey-card rounded-3xl p-12 float-animation">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-16 aspect-square flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="shimmer absolute inset-0" />
                <div className="relative z-10">
                  <div className="land-green-bg w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-xl shadow-gray-900/10">
                    <Map className="w-10 h-10 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="font-serif text-6xl font-bold land-green mb-4">0.82</div>
                  <div className="font-sans text-sm text-gray-600 font-medium">Current NDVI</div>
                  <div className="font-sans text-xs text-gray-500 mt-2">Pasture 7 • Updated 2h ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-serif text-5xl md:text-6xl font-bold mb-5">Simple pricing</h2>
            <p className="font-sans text-xl text-gray-600 font-normal">
              Start free, upgrade as you grow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: 'For single operations',
                features: ['1 farm', 'Daily recommendations', 'Basic indices', 'Email support'],
              },
              {
                name: 'Professional',
                price: '$79',
                period: '/month',
                description: 'For serious operations',
                features: [
                  '5 farms',
                  'Advanced analytics',
                  'Historical export',
                  'API access',
                  'Priority support',
                ],
                featured: true,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`survey-card rounded-3xl p-12 ${plan.featured ? 'ring-2 ring-gray-900 shadow-2xl' : ''}`}
              >
                <div className="mb-10">
                  <h3 className="font-sans text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="font-sans text-sm text-gray-600">{plan.description}</p>
                </div>

                <div className="mb-10">
                  <span className="font-serif text-7xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="font-sans text-2xl text-gray-600 font-normal">{plan.period}</span>
                  )}
                </div>

                <button
                  className={`w-full py-4 rounded-xl font-sans font-semibold mb-10 transition-all ${
                    plan.featured
                      ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20'
                      : 'survey-card hover:bg-gray-50'
                  }`}
                >
                  {plan.featured ? 'Start trial' : 'Get started'}
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center gap-3 font-sans text-sm">
                      <div className="w-5 h-5 land-green-bg rounded-full flex items-center justify-center flex-shrink-0">
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
      <section className="px-6 py-40 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold mb-10 leading-tight">
            Ready to start?
          </h2>
          <p className="font-sans text-xl text-gray-300 mb-14 max-w-2xl mx-auto font-normal">
            Join operations using satellite intelligence for better grazing decisions.
          </p>

          <button className="px-12 py-5 bg-white text-gray-900 rounded-xl font-sans font-bold hover:bg-gray-100 transition-all inline-flex items-center gap-2 group shadow-2xl shadow-white/10">
            Get started free
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-16 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <Map className="w-6 h-6 land-green" strokeWidth={1.5} />
                <span className="font-sans text-xl font-semibold">OpenPasture</span>
              </div>
              <p className="font-sans text-sm text-gray-600 font-normal">
                Satellite intelligence for adaptive grazing.
              </p>
            </div>

            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Demo'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers'] },
              { title: 'Resources', links: ['Docs', 'Support', 'Privacy'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-semibold mb-4 text-sm">{section.title}</h4>
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

          <div className="pt-8 border-t border-gray-200 font-sans text-sm text-gray-600 text-center">
            © 2024 OpenPasture. Apache 2.0 Licensed.
          </div>
        </div>
      </footer>
    </div>
  )
}
