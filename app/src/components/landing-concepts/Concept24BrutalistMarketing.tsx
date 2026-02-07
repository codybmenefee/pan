import { ArrowRight, Check, Layers, TrendingUp, BarChart3, MapPin } from 'lucide-react'

export function Concept24BrutalistMarketing() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1a1a1a]">
      <link
        href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800&family=Libre+Baskerville:wght@400;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-sans { font-family: 'Work Sans', -apple-system, sans-serif; }
        .font-serif { font-family: 'Libre Baskerville', Georgia, serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .brutal-card {
          background: white;
          border: 2px solid #1a1a1a;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .brutal-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 4px 4px 0 #52796f;
        }

        .ag-green { color: #52796f; }
        .ag-green-bg { background: #52796f; }

        .grid-bg {
          background-image:
            linear-gradient(#1a1a1a 1px, transparent 1px),
            linear-gradient(90deg, #1a1a1a 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.03;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b-2 border-black font-sans sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 ag-green-bg border-2 border-black flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold tracking-tight">OpenPasture</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#product" className="hover:ag-green transition-colors">
              Product
            </a>
            <a href="#how" className="hover:ag-green transition-colors">
              How it works
            </a>
            <a href="#vision" className="hover:ag-green transition-colors">
              Vision
            </a>
            <button className="px-6 py-2.5 ag-green-bg text-white border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[3px_3px_0_#1a1a1a] font-bold">
              Get started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-32 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center space-y-8">
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight fade-up">
              Graze More on the Same Land.
              <br />
              <span className="ag-green italic">Let the Grass Tell You When It's Ready.</span>
            </h1>

            <p className="font-sans text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed fade-up delay-1">
              Satellite imagery and AI recommendations help you decide where to graze today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 fade-up delay-2">
              <button className="px-10 py-4 ag-green-bg text-white border-2 border-black font-sans font-bold transition-all shadow-[4px_4px_0_#1a1a1a] hover:shadow-[2px_2px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 group">
                Try Interactive Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </button>
              <button className="px-10 py-4 border-2 border-black bg-white text-black font-sans font-bold transition-all shadow-[4px_4px_0_#1a1a1a] hover:shadow-[2px_2px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5">
                Sign up for early access
              </button>
            </div>
          </div>

          {/* Hero Screenshot Placeholder */}
          <div className="mt-20 brutal-card p-8">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-black flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 ag-green mx-auto mb-4" strokeWidth={1.5} />
                <p className="font-mono text-sm text-gray-600">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Value Prop */}
      <section className="px-6 py-20 bg-white border-y-2 border-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-6 py-2 bg-black text-white border-2 border-black font-mono text-xs uppercase tracking-wider mb-8">
            Early Access Beta
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Join ranchers testing satellite-powered grazing decisions
          </h2>
          <p className="font-sans text-lg text-gray-700 leading-relaxed">
            Be among the first to experience AI-guided adaptive grazing. Free during beta.
          </p>
        </div>
      </section>

      {/* Product Showcase 1 */}
      <section id="product" className="px-6 py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-4 py-1 bg-black text-white border-2 border-black font-mono text-[10px] uppercase tracking-wider mb-6">
                Available Now
              </div>
              <h2 className="font-serif text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Your Morning Decision, Made Simple
              </h2>
              <p className="font-sans text-xl text-gray-700 mb-8 leading-relaxed">
                AI analyzes satellite data overnight and delivers a recommended grazing plan with confidence scores and reasoning.
              </p>
              <ul className="space-y-4">
                {[
                  'Wake up to a clear recommendation for today',
                  'Understand the "why" behind each suggestion',
                  'Override with one tap when conditions change',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 font-sans text-lg">
                    <div className="w-6 h-6 ag-green-bg border-2 border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="brutal-card p-8">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-black flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-20 h-20 ag-green mx-auto mb-4" strokeWidth={1.5} />
                  <p className="font-mono text-sm text-gray-600">Daily Brief Interface</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase 2 - Reversed */}
      <section className="px-6 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="brutal-card p-8 lg:order-1">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-black flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-20 h-20 ag-green mx-auto mb-4" strokeWidth={1.5} />
                  <p className="font-mono text-sm text-gray-600">NDVI Heat Map</p>
                </div>
              </div>
            </div>

            <div className="lg:order-2">
              <div className="inline-block px-4 py-1 bg-black text-white border-2 border-black font-mono text-[10px] uppercase tracking-wider mb-6">
                Available Now
              </div>
              <h2 className="font-serif text-5xl md:text-6xl font-bold mb-6 leading-tight">
                See What's Invisible from the Ground
              </h2>
              <p className="font-sans text-xl text-gray-700 mb-8 leading-relaxed">
                NDVI heatmaps reveal vegetation health across your entire operation. Historical patterns show recovery trends you can't observe manually.
              </p>
              <ul className="space-y-4">
                {[
                  'Color-coded vegetation health at a glance',
                  'Track recovery patterns over time',
                  'Identify problem areas before they spread',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 font-sans text-lg">
                    <div className="w-6 h-6 ag-green-bg border-2 border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase 3 */}
      <section className="px-6 py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-4 py-1 bg-black text-white border-2 border-black font-mono text-[10px] uppercase tracking-wider mb-6">
                Available Now
              </div>
              <h2 className="font-serif text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Track Recovery, Optimize Timing
              </h2>
              <p className="font-sans text-xl text-gray-700 mb-8 leading-relaxed">
                Monitor rest periods, recovery rates, and AI approval trends. Identify which pastures are thriving and which need attention.
              </p>
              <ul className="space-y-4">
                {[
                  'Real-time pasture status tracking',
                  'Historical grazing patterns and recovery',
                  'Data-driven insights for better rotation',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 font-sans text-lg">
                    <div className="w-6 h-6 ag-green-bg border-2 border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="brutal-card p-8">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-black flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-20 h-20 ag-green mx-auto mb-4" strokeWidth={1.5} />
                  <p className="font-mono text-sm text-gray-600">Analytics Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="px-6 py-32 bg-white border-y-2 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-serif text-5xl md:text-6xl font-bold mb-6">How it works</h2>
            <p className="font-sans text-xl text-gray-700">
              Three steps to smarter grazing decisions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Satellites capture data',
                description: 'Sentinel-2 passes overhead every 5 days, capturing multispectral imagery of your pastures.',
              },
              {
                num: '02',
                title: 'AI analyzes patterns',
                description: 'Our models process NDVI, EVI, and recovery trends to understand vegetation health.',
              },
              {
                num: '03',
                title: 'You get recommendations',
                description: 'Wake up to clear grazing guidance with confidence scores and reasoning.',
              },
            ].map((step, idx) => (
              <div key={idx} className="brutal-card p-8">
                <div className="font-mono text-6xl font-bold ag-green mb-4">{step.num}</div>
                <h3 className="font-sans text-2xl font-bold mb-4">{step.title}</h3>
                <p className="font-sans text-gray-700 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Roadmap */}
      <section id="vision" className="px-6 py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-5xl md:text-6xl font-bold mb-6">Built in public, Apache 2.0</h2>
            <p className="font-sans text-xl text-gray-700 leading-relaxed">
              OpenPasture is open-source software. No vendor lock-in, no hidden algorithms, no proprietary data formats.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                title: 'Open Source',
                description: 'Full source code available. Self-host or use our managed service.',
              },
              {
                title: 'Open Data',
                description: 'Your data stays yours. Export anytime, in standard formats.',
              },
              {
                title: 'Open Development',
                description: 'Public roadmap. GitHub issues. Community-driven features.',
              },
            ].map((item, idx) => (
              <div key={idx} className="brutal-card p-8 flex gap-6 items-start">
                <div className="w-12 h-12 ag-green-bg border-2 border-black flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-white" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-sans text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="font-sans text-lg text-gray-700 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-40 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold mb-10 leading-tight">
            Ready to make better grazing decisions?
          </h2>
          <p className="font-sans text-xl text-gray-300 mb-14 max-w-2xl mx-auto leading-relaxed">
            Join the beta program and start using satellite intelligence for adaptive grazing.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-12 py-5 bg-white text-black border-2 border-white font-sans font-bold transition-all shadow-[6px_6px_0_rgba(255,255,255,0.2)] hover:shadow-[3px_3px_0_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 group">
              Get started free
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
            <button className="px-12 py-5 border-2 border-white text-white font-sans font-bold transition-all shadow-[6px_6px_0_rgba(255,255,255,0.2)] hover:shadow-[3px_3px_0_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5">
              Schedule demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-black py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 ag-green-bg border-2 border-black flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <span className="font-sans text-lg font-bold">OpenPasture</span>
              </div>
              <p className="font-sans text-sm text-gray-700">
                Open-source grazing intelligence platform
              </p>
            </div>

            {[
              { title: 'Product', links: ['Features', 'Demo', 'Pricing', 'Roadmap'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Resources', links: ['Docs', 'GitHub', 'Support', 'Privacy'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-bold mb-5 text-sm uppercase tracking-wider">{section.title}</h4>
                <ul className="space-y-3 font-sans text-sm text-gray-700">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:ag-green transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t-2 border-black font-mono text-xs text-center text-gray-600 uppercase tracking-wider">
            © 2024 OpenPasture • Apache 2.0 Licensed
          </div>
        </div>
      </footer>
    </div>
  )
}
