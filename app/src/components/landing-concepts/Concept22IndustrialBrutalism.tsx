import { ArrowRight, TrendingUp, Layers, BarChart3, Check, Factory } from 'lucide-react'

export function Concept22IndustrialBrutalism() {
  return (
    <div className="min-h-screen bg-[#e8eaed] text-[#1a1d23]">
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-sans { font-family: 'Rajdhani', sans-serif; }
        .font-mono { font-family: 'Share Tech Mono', monospace; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .industrial-card {
          background: #f5f7f9;
          border: 3px solid #4a5c6d;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .industrial-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(74, 92, 109, 0.08), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .industrial-card:hover::after {
          opacity: 1;
        }

        .industrial-card:hover {
          transform: translate(-4px, -4px);
          box-shadow: 6px 6px 0 #4a5c6d;
        }

        .steel-blue { color: #4a5c6d; }
        .steel-blue-bg { background: #4a5c6d; }
        .steel-gray { color: #6b7c8f; }
        .steel-gray-bg { background: #6b7c8f; }

        .metal-grid {
          background-image:
            linear-gradient(#4a5c6d 2px, transparent 2px),
            linear-gradient(90deg, #4a5c6d 2px, transparent 2px);
          background-size: 50px 50px;
          background-position: -2px -2px;
          opacity: 0.1;
        }

        .rivet-pattern {
          background-image:
            radial-gradient(circle at 0 0, #4a5c6d 2px, transparent 2px),
            radial-gradient(circle at 50px 50px, #4a5c6d 2px, transparent 2px);
          background-size: 50px 50px;
          opacity: 0.06;
        }

        .factory-badge {
          background: #4a5c6d;
          color: #f5f7f9;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 16px;
          font-weight: 400;
          border: 3px solid #4a5c6d;
        }

        .hero-number {
          font-feature-settings: 'tnum', 'lnum';
          letter-spacing: -0.03em;
        }

        @keyframes assemblyLine {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        .assembly-line {
          position: absolute;
          width: 200%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #4a5c6d, transparent);
          animation: assemblyLine 3s linear infinite;
        }

        @keyframes marchIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .march-in {
          animation: marchIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#f5f7f9] border-b-3 border-[#4a5c6d] font-sans">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 steel-blue-bg border-3 border-[#4a5c6d] flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">OpenPasture</div>
              <div className="text-[9px] font-mono steel-blue uppercase tracking-[0.2em]">Industrial Grade</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-base font-bold uppercase tracking-wide">
            <a href="#platform" className="steel-gray hover:steel-blue transition-colors">
              Platform
            </a>
            <a href="#specs" className="steel-gray hover:steel-blue transition-colors">
              Specs
            </a>
            <a href="#pricing" className="steel-gray hover:steel-blue transition-colors">
              Pricing
            </a>
            <button className="px-7 py-3 steel-blue-bg text-white border-3 border-[#4a5c6d] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0_#4a5c6d]">
              Start
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-40 relative overflow-hidden">
        <div className="absolute inset-0 metal-grid" />
        <div className="absolute top-0 left-0 right-0 overflow-hidden">
          <div className="assembly-line" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-6xl space-y-12">
            <div className="factory-badge inline-block march-in">
              Industrial Grazing Intelligence
            </div>

            <h1 className="font-sans text-[clamp(4.5rem,10vw,9rem)] font-bold leading-[0.86] tracking-tight march-in delay-1">
              ENGINEERED FOR
              <br />
              <span className="steel-blue">PRECISION AGRICULTURE</span>
            </h1>

            <p className="font-mono text-lg md:text-xl steel-gray max-w-4xl leading-relaxed march-in delay-2">
              Sentinel-2 satellite platform delivers multispectral vegetation analysis.
              Daily operational directives computed from 13-band spectral data.
              Built for reliability. Designed for scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-8 march-in delay-3">
              <button className="px-11 py-5 steel-blue-bg text-white border-3 border-[#4a5c6d] font-sans font-bold transition-all shadow-[5px_5px_0_#4a5c6d] hover:shadow-[2px_2px_0_#4a5c6d] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 group uppercase tracking-wide">
              Initialize
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </button>
              <button className="px-11 py-5 border-3 border-[#4a5c6d] bg-[#f5f7f9] steel-blue font-sans font-bold transition-all shadow-[5px_5px_0_#4a5c6d] hover:shadow-[2px_2px_0_#4a5c6d] hover:translate-x-0.5 hover:translate-y-0.5 uppercase tracking-wide">
                Technical Specs
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="mt-32 grid md:grid-cols-3 gap-6 max-w-6xl">
            {[
              { value: '10m', label: 'Spatial Resolution', sublabel: 'Per-pixel accuracy' },
              { value: '5d', label: 'Refresh Cycle', sublabel: 'Update frequency' },
              { value: '91%', label: 'Confidence', sublabel: 'Average precision' },
            ].map((metric, idx) => (
              <div key={idx} className="industrial-card p-10">
                <div className="font-sans hero-number text-7xl font-bold steel-blue mb-4">{metric.value}</div>
                <div className="font-sans text-sm font-bold steel-blue uppercase tracking-wider mb-2">
                  {metric.label}
                </div>
                <div className="font-mono text-xs steel-gray">{metric.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section id="platform" className="px-6 py-40 bg-[#f5f7f9] rivet-pattern">
        <div className="max-w-7xl mx-auto">
          <div className="mb-28">
            <h2 className="font-sans text-7xl md:text-8xl font-bold mb-6 steel-blue uppercase">
              Platform Components
            </h2>
            <div className="w-28 h-2 steel-blue-bg" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'Spectral Processing',
                description:
                  'NDVI, EVI, NDWI indices from 13-band multispectral analysis. 5-day processing cycle.',
              },
              {
                icon: BarChart3,
                title: 'Time-Series Engine',
                description:
                  'Recovery pattern tracking and seasonal correlation analysis across all zones.',
              },
              {
                icon: Layers,
                title: 'Decision Module',
                description:
                  'Daily operational directives with confidence scoring and transparent logic.',
              },
              {
                icon: Check,
                title: 'Manual Override',
                description:
                  'Operator control retained. All recommendations subject to manual verification.',
              },
              {
                icon: TrendingUp,
                title: 'Data Archive',
                description:
                  'Complete operational history. Pattern identification and trend analysis.',
              },
              {
                icon: BarChart3,
                title: 'API Integration',
                description:
                  'System interoperability. Data pipeline and farm management sync.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="industrial-card p-9">
                  <div className="w-14 h-14 steel-gray-bg border-3 border-[#4a5c6d] flex items-center justify-center mb-7">
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-sans text-xl font-bold mb-4 steel-blue uppercase tracking-wide">{feature.title}</h3>
                  <p className="font-mono text-sm leading-relaxed steel-gray">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Specs Section */}
      <section id="specs" className="px-6 py-40 bg-[#e8eaed] relative">
        <div className="absolute inset-0 metal-grid" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-sans text-7xl font-bold mb-10 steel-blue uppercase leading-[0.9]">
                Technical
                <br />
                Specifications
              </h2>
              <div className="w-24 h-2 steel-blue-bg mb-12" />
              <p className="font-mono text-base mb-14 leading-relaxed steel-gray">
                Multispectral orbital sensors monitor vegetation health, moisture stress,
                and biomass distribution. Data processed through industrial-grade analysis pipeline.
                Operational reliability: 99.2% uptime.
              </p>

              <div className="space-y-5">
                {[
                  {
                    label: 'NDVI',
                    value: 'Normalized Difference Vegetation Index',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'EVI',
                    value: 'Enhanced Vegetation Index',
                    metric: '0.00–1.00',
                  },
                  {
                    label: 'NDWI',
                    value: 'Normalized Difference Water Index',
                    metric: '-1.00–1.00',
                  },
                ].map((index, idx) => (
                  <div key={idx} className="industrial-card p-7">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="font-mono text-lg font-bold steel-blue">{index.label}</span>
                      <span className="font-mono text-xs steel-gray">{index.metric}</span>
                    </div>
                    <p className="font-mono text-sm steel-gray">{index.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="industrial-card p-14">
              <div className="aspect-square flex flex-col items-center justify-center text-center border-3 border-[#4a5c6d] p-14 bg-gradient-to-br from-[#e8eaed] to-[#f5f7f9]">
                <div className="factory-badge mb-10">Live Sensor Data</div>
                <BarChart3 className="w-28 h-28 steel-blue mb-8" strokeWidth={2} />
                <div className="font-sans hero-number text-[120px] font-bold steel-blue leading-none mb-4">0.82</div>
                <div className="font-sans text-sm font-bold steel-blue uppercase tracking-wider mb-2">
                  NDVI Reading
                </div>
                <div className="font-mono text-xs steel-gray">Zone 7 • Updated 2h ago</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-40 bg-[#f5f7f9] rivet-pattern">
        <div className="max-w-6xl mx-auto">
          <div className="mb-28">
            <h2 className="font-sans text-7xl md:text-8xl font-bold mb-6 steel-blue uppercase">Deployment Plans</h2>
            <div className="w-28 h-2 steel-blue-bg" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: 'Standard',
                price: 'Free',
                description: 'Single-site deployment',
                features: [
                  '1 operational zone',
                  'Daily directives',
                  'Core spectral indices',
                  'Email support',
                ],
              },
              {
                name: 'Industrial',
                price: '$79',
                period: '/month',
                description: 'Multi-site operation',
                features: [
                  '5 operational zones',
                  'Advanced analytics',
                  'Data export protocol',
                  'API integration',
                  'Priority support',
                ],
                highlighted: true,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`industrial-card p-12 ${plan.highlighted ? 'border-[4px]' : ''}`}
              >
                <h3 className="font-sans text-3xl font-bold mb-2 steel-blue uppercase tracking-wide">{plan.name}</h3>
                <p className="font-mono text-sm steel-gray mb-10">{plan.description}</p>

                <div className="mb-12">
                  <span className="font-sans hero-number text-8xl font-bold steel-blue">{plan.price}</span>
                  {plan.period && (
                    <span className="font-mono text-2xl steel-gray">{plan.period}</span>
                  )}
                </div>

                <button
                  className={`w-full py-5 border-3 border-[#4a5c6d] font-sans font-bold mb-12 transition-all uppercase tracking-wide ${
                    plan.highlighted
                      ? 'steel-blue-bg text-white shadow-[5px_5px_0_#4a5c6d] hover:shadow-[2px_2px_0_#4a5c6d] hover:translate-x-0.5 hover:translate-y-0.5'
                      : 'bg-[#f5f7f9] steel-blue shadow-[5px_5px_0_#4a5c6d] hover:shadow-[2px_2px_0_#4a5c6d] hover:translate-x-0.5 hover:translate-y-0.5'
                  }`}
                >
                  {plan.highlighted ? 'Deploy Industrial' : 'Deploy Standard'}
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-center gap-3 font-mono text-sm">
                      <div className="w-6 h-6 steel-gray-bg border-3 border-[#4a5c6d] flex items-center justify-center flex-shrink-0">
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
      <section className="px-6 py-44 steel-blue-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 metal-grid opacity-30" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="font-sans text-7xl md:text-8xl font-bold mb-12 leading-tight uppercase">
            Ready for deployment?
          </h2>
          <p className="font-mono text-lg mb-16 max-w-3xl mx-auto leading-relaxed text-gray-200">
            Join agricultural operations using industrial-grade satellite intelligence
            for precision grazing management.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-12 py-6 bg-white text-[#4a5c6d] border-3 border-white font-sans font-bold transition-all shadow-[6px_6px_0_rgba(255,255,255,0.2)] hover:shadow-[3px_3px_0_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 group uppercase tracking-wide">
              Initialize System
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
            <button className="px-12 py-6 border-3 border-white text-white font-sans font-bold transition-all shadow-[6px_6px_0_rgba(255,255,255,0.2)] hover:shadow-[3px_3px_0_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 uppercase tracking-wide">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f5f7f9] border-t-3 border-[#4a5c6d] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 steel-blue-bg border-3 border-[#4a5c6d] flex items-center justify-center">
                  <Factory className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-sans text-xl font-bold">OpenPasture</span>
              </div>
              <p className="font-mono text-xs steel-gray uppercase tracking-wider">
                Industrial Grade Intelligence
              </p>
            </div>

            {[
              { title: 'Platform', links: ['Components', 'Specs', 'API', 'Docs'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Resources', links: ['Documentation', 'Support', 'Privacy', 'Terms'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-bold mb-5 text-xs uppercase tracking-wider steel-blue">{section.title}</h4>
                <ul className="space-y-3 font-mono text-xs steel-gray">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:steel-blue transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t-3 border-[#4a5c6d] font-mono text-xs text-center steel-gray uppercase tracking-wider">
            © 2024 OpenPasture • Apache 2.0 Licensed
          </div>
        </div>
      </footer>
    </div>
  )
}
