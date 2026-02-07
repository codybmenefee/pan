import { ArrowRight, Sparkles, Zap, CheckCircle2, ArrowUpRight } from 'lucide-react'

export function Concept13AISaasGradient() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-inter { font-family: 'Inter', sans-serif; }

        .gradient-purple-blue {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .gradient-orange-pink {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .gradient-blue-teal {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .gradient-yellow-orange {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .gradient-green-blue {
          background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
        }

        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }

        .text-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f5576c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 font-inter">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gradient-purple-blue rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">OpenPasture</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how" className="text-gray-600 hover:text-gray-900 transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <button className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              Get started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-sm font-medium text-purple-700 mb-8 fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>AI-powered grazing intelligence</span>
          </div>

          <h1 className="font-inter text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-8 fade-in-up delay-100">
            Smarter grazing decisions,
            <br />
            <span className="text-gradient">powered by satellites</span>
          </h1>

          <p className="font-inter text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed fade-in-up delay-200">
            Get daily AI recommendations on where to graze based on real-time satellite imagery.
            Simple, clear, and backed by data.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up delay-300">
            <button className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all hover:scale-105 flex items-center justify-center gap-2 group">
              Start free trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border-2 border-gray-200 text-gray-900 rounded-xl font-semibold hover:border-gray-300 transition-all">
              Watch demo
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                gradient: 'gradient-purple-blue',
                title: 'Daily Recommendations',
                description:
                  'Wake up to clear grazing suggestions based on overnight satellite analysis. Know exactly where to move your herd.',
                icon: '🎯',
              },
              {
                gradient: 'gradient-orange-pink',
                title: 'Real-time Satellite Data',
                description:
                  'Sentinel-2 imagery updated every 5 days at 10m resolution. Track vegetation health across your entire operation.',
                icon: '🛰️',
              },
              {
                gradient: 'gradient-blue-teal',
                title: 'AI-Powered Analysis',
                description:
                  'Machine learning models process NDVI, EVI, and NDWI indices to predict optimal grazing timing.',
                icon: '🤖',
              },
              {
                gradient: 'gradient-yellow-orange',
                title: 'Confidence Scoring',
                description:
                  'Every recommendation includes a confidence score (0-100%) and transparent reasoning you can understand.',
                icon: '📊',
              },
              {
                gradient: 'gradient-green-blue',
                title: 'Mobile-First',
                description:
                  'Access your morning brief from anywhere. Simple interface designed for on-the-go decision making.',
                icon: '📱',
              },
              {
                gradient: 'gradient-purple-blue',
                title: 'Full Control',
                description:
                  'Override any recommendation with one tap. Add feedback in plain language to improve future suggestions.',
                icon: '✅',
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className={`${card.gradient} rounded-2xl p-8 text-white card-hover cursor-pointer`}
              >
                <div className="text-5xl mb-4">{card.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                <p className="text-white/90 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-6">How it works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to better grazing decisions every morning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Satellites scan your land',
                description:
                  'Sentinel-2 captures multispectral imagery of your ranch every 5 days. We automatically process NDVI, EVI, and moisture indicators.',
                color: 'bg-purple-600',
              },
              {
                step: '2',
                title: 'AI analyzes conditions',
                description:
                  'Our ML models evaluate vegetation health, recovery patterns, and grazing history to identify optimal pastures.',
                color: 'bg-pink-600',
              },
              {
                step: '3',
                title: 'You decide',
                description:
                  'Get a clear morning recommendation with confidence score. Approve or override based on what you see on the ground.',
                color: 'bg-blue-600',
              },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div
                  className={`${step.color} text-white text-2xl font-bold w-12 h-12 rounded-full flex items-center justify-center mb-6`}
                >
                  {step.step}
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>

                {idx < 2 && (
                  <div className="hidden md:block absolute top-6 -right-12 text-gray-300">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="gradient-purple-blue rounded-3xl p-16 text-white text-center">
            <h2 className="text-4xl font-bold mb-12">Trusted by forward-thinking ranchers</h2>

            <div className="grid md:grid-cols-4 gap-12">
              {[
                { value: '10m', label: 'Satellite resolution' },
                { value: '5 days', label: 'Update frequency' },
                { value: '91%', label: 'Avg confidence' },
                { value: '100+', label: 'Beta users' },
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-5xl font-extrabold mb-2">{stat.value}</div>
                  <div className="text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-extrabold mb-8 leading-tight">
                See what your land is telling you
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Vegetation health isn't always visible from the ground. Satellite imagery reveals
                patterns you can't see manually—helping you rotate at the perfect time.
              </p>

              <div className="space-y-4">
                {[
                  'Track recovery trends across all pastures',
                  'Identify stress zones before they become visible',
                  'Make decisions backed by objective data',
                  'Optimize rotation timing for better outcomes',
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="gradient-purple-blue rounded-2xl p-8 text-white">
                <div className="text-4xl mb-3">🌱</div>
                <div className="text-3xl font-bold mb-2">NDVI</div>
                <div className="text-sm opacity-90">Vegetation health tracking</div>
              </div>
              <div className="gradient-orange-pink rounded-2xl p-8 text-white mt-8">
                <div className="text-4xl mb-3">💧</div>
                <div className="text-3xl font-bold mb-2">NDWI</div>
                <div className="text-sm opacity-90">Moisture stress detection</div>
              </div>
              <div className="gradient-blue-teal rounded-2xl p-8 text-white">
                <div className="text-4xl mb-3">📈</div>
                <div className="text-3xl font-bold mb-2">EVI</div>
                <div className="text-sm opacity-90">Enhanced biomass analysis</div>
              </div>
              <div className="gradient-yellow-orange rounded-2xl p-8 text-white mt-8">
                <div className="text-4xl mb-3">🎯</div>
                <div className="text-3xl font-bold mb-2">AI</div>
                <div className="text-sm opacity-90">Smart recommendations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-6">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: 'Perfect for trying out OpenPasture',
                features: [
                  'Up to 1 farm',
                  'Daily recommendations',
                  'Email support',
                  'Basic analytics',
                ],
                cta: 'Start free',
                highlighted: false,
              },
              {
                name: 'Professional',
                price: '$49',
                period: '/month',
                description: 'For serious ranching operations',
                features: [
                  'Up to 5 farms',
                  'Priority processing',
                  'Advanced analytics',
                  'API access',
                  'Priority support',
                ],
                cta: 'Start trial',
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For large-scale operations',
                features: [
                  'Unlimited farms',
                  'Custom integrations',
                  'Dedicated support',
                  'SLA guarantees',
                  'White-label options',
                ],
                cta: 'Contact sales',
                highlighted: false,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'gradient-purple-blue text-white shadow-2xl scale-105'
                    : 'bg-white border-2 border-gray-200'
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p
                  className={`text-sm mb-6 ${plan.highlighted ? 'text-white/80' : 'text-gray-600'}`}
                >
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-5xl font-extrabold">{plan.price}</span>
                  {plan.period && (
                    <span className={plan.highlighted ? 'text-white/80' : 'text-gray-600'}>
                      {plan.period}
                    </span>
                  )}
                </div>

                <button
                  className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${
                    plan.highlighted
                      ? 'bg-white text-purple-600 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center gap-3">
                      <CheckCircle2
                        className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-white' : 'text-green-600'}`}
                      />
                      <span className={plan.highlighted ? 'text-white/90' : 'text-gray-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-8 leading-tight">
            Ready to make better grazing decisions?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join the beta program and get free access for your first 30 days. No credit card
            required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-5 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 flex items-center justify-center gap-2 group">
              Get started free
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 border-2 border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/5 transition-all">
              Schedule demo
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Free for 30 days</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 gradient-purple-blue rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">OpenPasture</span>
              </div>
              <p className="text-gray-600 leading-relaxed max-w-sm">
                AI-powered grazing intelligence from satellite imagery. Make better decisions every
                day.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Demo
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <div>© 2024 OpenPasture. All rights reserved.</div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-gray-900 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
