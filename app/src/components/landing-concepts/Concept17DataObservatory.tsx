import { ArrowRight, Eye, Satellite, BarChart3, Database, Telescope } from 'lucide-react'

export function Concept17DataObservatory() {
  return (
    <div className="min-h-screen bg-[#0b0f15] text-[#e8e6e3]">
      <link
        href="https://fonts.googleapis.com/css2?family=GT+America:wght@300;400;500;600;700&family=Erode:wght@400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');

        .font-sans { font-family: 'Public Sans', -apple-system, sans-serif; }
        .font-serif { font-family: 'Cormorant Garamond', Georgia, serif; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .observatory-card {
          background: linear-gradient(135deg, rgba(139, 157, 91, 0.04), rgba(255, 255, 255, 0.02));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 157, 91, 0.12);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .observatory-card::before {
          content: '';
          position: absolute;
          inset: -100% 0 0 0;
          background: linear-gradient(to bottom, rgba(139, 157, 91, 0.1), transparent);
          transition: inset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .observatory-card:hover::before {
          inset: 0;
        }

        .observatory-card:hover {
          background: linear-gradient(135deg, rgba(139, 157, 91, 0.08), rgba(255, 255, 255, 0.04));
          border-color: rgba(139, 157, 91, 0.25);
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(139, 157, 91, 0.15);
        }

        .observatory-green { color: #8b9d5b; }
        .observatory-gold { color: #c9a961; }
        .observatory-green-bg { background: #8b9d5b; }

        .data-viz-bg {
          background-image:
            radial-gradient(circle at 30% 20%, rgba(139, 157, 91, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(201, 169, 97, 0.05) 0%, transparent 60%);
        }

        .subtle-grid {
          background-image:
            linear-gradient(rgba(139, 157, 91, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 157, 91, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .glow {
          box-shadow: 0 0 40px rgba(139, 157, 91, 0.2), 0 0 80px rgba(139, 157, 91, 0.1);
        }

        .elegant-line {
          position: relative;
        }

        .elegant-line::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 0;
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, rgba(139, 157, 91, 0.8), transparent);
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(100px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(100px) rotate(-360deg);
          }
        }

        .orbit-dot {
          animation: orbit 20s linear infinite;
        }

        .grain {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 100;
          mix-blend-mode: overlay;
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

        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }
      `}</style>

      <div className="grain" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0b0f15]/85 backdrop-blur-2xl border-b border-white/5 font-sans">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 observatory-green-bg rounded flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#0b0f15]" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">OpenPasture</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-[0.15em] font-medium">
                Observatory
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-sm font-medium">
            <a href="#observatory" className="text-gray-400 hover:text-white transition-colors">
              Observatory
            </a>
            <a href="#data" className="text-gray-400 hover:text-white transition-colors">
              Data
            </a>
            <a href="#access" className="text-gray-400 hover:text-white transition-colors">
              Access
            </a>
            <button className="px-6 py-2.5 observatory-green-bg text-[#0b0f15] font-semibold hover:shadow-[0_0_30px_rgba(139,157,91,0.3)] transition-all rounded">
              Request access
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-40 subtle-grid relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-5xl space-y-12">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded font-sans text-xs font-medium fade-in-up">
              <div className="w-2 h-2 observatory-green-bg rounded-full animate-pulse" />
              <span className="text-gray-400 uppercase tracking-wider">Orbital Sensing • Data Observatory</span>
            </div>

            <h1 className="font-serif text-[clamp(4rem,9vw,8rem)] font-bold leading-[0.88] tracking-tight fade-in-up delay-1">
              Observe your land
              <br />
              <span className="observatory-green italic">from orbit</span>
            </h1>

            <p className="font-sans text-2xl md:text-3xl text-gray-400 max-w-3xl leading-relaxed font-light fade-in-up delay-2">
              A precision data observatory for adaptive grazing. Sentinel-2 satellites deliver
              multispectral intelligence—revealing vegetation patterns invisible from ground level.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-8 fade-in-up delay-3">
              <button className="px-10 py-5 observatory-green-bg text-[#0b0f15] font-sans font-bold rounded hover:shadow-[0_0_50px_rgba(139,157,91,0.4)] transition-all glow flex items-center justify-center gap-2 group">
                Begin observing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-10 py-5 observatory-card font-sans font-semibold rounded">
                View capabilities
              </button>
            </div>
          </div>
        </div>

        {/* Orbital decoration */}
        <div className="absolute top-1/2 right-20 w-4 h-4 observatory-green-bg rounded-full opacity-20 orbit-dot" />
      </section>

      {/* Observatory Cards */}
      <section id="observatory" className="px-6 py-32 data-viz-bg">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24">
            <h2 className="font-serif text-6xl md:text-7xl font-bold mb-6 elegant-line">
              The Observatory
            </h2>
            <p className="font-sans text-2xl text-gray-400 font-light max-w-2xl">
              Precision instruments for land intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Satellite,
                title: 'Orbital Platform',
                metric: 'Sentinel-2',
                description: '10m resolution, 5-day cadence',
              },
              {
                icon: BarChart3,
                title: 'Spectral Analysis',
                metric: '13 bands',
                description: 'NDVI, EVI, NDWI processing',
              },
              {
                icon: Database,
                title: 'Time-Series Data',
                metric: 'Continuous',
                description: 'Recovery pattern tracking',
              },
              {
                icon: Telescope,
                title: 'Daily Intelligence',
                metric: 'Morning brief',
                description: 'Clear recommendations',
              },
            ].map((instrument, idx) => {
              const Icon = instrument.icon
              return (
                <div key={idx} className="observatory-card rounded-xl p-8 group">
                  <Icon className="w-12 h-12 observatory-green mb-8 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                  <div className="font-sans text-[10px] text-gray-500 uppercase tracking-[0.15em] mb-3 font-semibold">
                    {instrument.metric}
                  </div>
                  <h3 className="font-serif text-3xl font-semibold mb-4">{instrument.title}</h3>
                  <p className="font-sans text-sm text-gray-400 leading-relaxed">
                    {instrument.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Data Visualization */}
      <section id="data" className="px-6 py-32 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-serif text-6xl md:text-7xl font-bold mb-8 elegant-line">
                Precision at scale
              </h2>
              <p className="font-sans text-xl text-gray-400 mb-12 leading-relaxed font-light">
                Multispectral sensors capture vegetation health, moisture stress, and biomass
                density across your entire operation. AI models process orbital data into
                actionable daily guidance.
              </p>

              <div className="space-y-5">
                {[
                  { label: 'Spatial resolution', value: '10 meters' },
                  { label: 'Temporal frequency', value: '5 days' },
                  { label: 'Spectral bands', value: '13 channels' },
                  { label: 'Processing time', value: '< 2 hours' },
                ].map((spec, idx) => (
                  <div key={idx} className="observatory-card rounded-lg p-6 flex items-center justify-between">
                    <span className="font-sans text-sm text-gray-400 font-medium">{spec.label}</span>
                    <span className="font-mono text-sm observatory-green font-semibold tracking-wide">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="observatory-card rounded-3xl p-14 glow relative">
              <div className="text-center">
                <div className="font-sans text-[10px] text-gray-500 uppercase tracking-[0.15em] mb-10 font-semibold">
                  Live Reading
                </div>
                <div className="font-serif text-[120px] font-bold observatory-green mb-6 leading-none">
                  0.82
                </div>
                <div className="font-sans text-sm text-gray-400 mb-12 font-medium">
                  NDVI • Pasture 7 • North Quarter
                </div>
                <div className="h-px bg-white/10 mb-12" />
                <div className="grid grid-cols-2 gap-8 text-left font-mono text-xs">
                  <div>
                    <div className="text-gray-500 mb-2 uppercase tracking-wider">EVI</div>
                    <div className="observatory-green text-2xl font-bold">0.76</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-2 uppercase tracking-wider">NDWI</div>
                    <div className="observatory-gold text-2xl font-bold">0.34</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-2 uppercase tracking-wider">Recovery</div>
                    <div className="observatory-green text-2xl font-bold">14 days</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-2 uppercase tracking-wider">Status</div>
                    <div className="observatory-green text-xl font-bold flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full observatory-green-bg animate-pulse" />
                      READY
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="access" className="px-6 py-40 subtle-grid">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-serif text-6xl md:text-7xl lg:text-[90px] font-bold mb-12 leading-tight">
            Access the observatory
          </h2>

          <p className="font-sans text-2xl text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed font-light">
            Limited access for adaptive grazing operations. Priority given to established
            rotational systems.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-12 py-6 observatory-green-bg text-[#0b0f15] font-sans font-bold rounded hover:shadow-[0_0_60px_rgba(139,157,91,0.5)] transition-all glow flex items-center justify-center gap-2 group">
              Request access
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-12 py-6 observatory-card font-sans font-bold rounded">
              View documentation
            </button>
          </div>

          <div className="mt-20 font-sans text-xs text-gray-600 uppercase tracking-[0.15em] font-medium">
            Apache 2.0 Licensed • Open Architecture • API Available
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 observatory-green-bg rounded flex items-center justify-center">
                  <Eye className="w-5 h-5 text-[#0b0f15]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-sans text-lg font-semibold">OpenPasture</div>
                  <div className="text-[8px] text-gray-500 uppercase tracking-wider">Observatory</div>
                </div>
              </div>
              <p className="font-sans text-sm text-gray-500 font-normal">
                Data observatory for land intelligence
              </p>
            </div>

            {[
              { title: 'Observatory', links: ['Capabilities', 'Data', 'API'] },
              { title: 'Company', links: ['About', 'Research', 'Careers'] },
              { title: 'Resources', links: ['Documentation', 'Support', 'Privacy'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-semibold mb-5 text-sm uppercase tracking-wider">{section.title}</h4>
                <ul className="space-y-3 font-sans text-sm text-gray-500">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-white/5 font-sans text-sm text-gray-600 text-center">
            © 2024 OpenPasture Observatory
          </div>
        </div>
      </footer>
    </div>
  )
}
