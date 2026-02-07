import { ArrowRight, Activity, Database, Shield, Zap, Terminal } from 'lucide-react'

export function Concept15FieldIntelligence() {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#d4d4d4]">
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-sans { font-family: 'Manrope', -apple-system, sans-serif; }
        .font-serif { font-family: 'Fraunces', Georgia, serif; }
        .font-mono { font-family: 'Fira Code', 'Courier New', monospace; }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .intel-card {
          background: linear-gradient(135deg, rgba(100, 149, 237, 0.04), rgba(50, 205, 50, 0.03));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(100, 149, 237, 0.15);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .intel-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(100, 149, 237, 0.5), transparent);
          transition: left 0.6s;
        }

        .intel-card:hover::before {
          left: 100%;
        }

        .intel-card:hover {
          background: linear-gradient(135deg, rgba(100, 149, 237, 0.08), rgba(50, 205, 50, 0.05));
          border-color: rgba(100, 149, 237, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(100, 149, 237, 0.15);
        }

        .tactical-green { color: #7cb342; }
        .tactical-blue { color: #6495ed; }
        .tactical-cyan { color: #00d9ff; }
        .tactical-green-bg { background: #7cb342; }

        .data-grid {
          background-image:
            linear-gradient(rgba(100, 149, 237, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 149, 237, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(100, 149, 237, 0.6), transparent);
          animation: scan 3s ease-in-out infinite;
        }

        @keyframes scan {
          0%, 100% {
            transform: translateY(0);
            opacity: 0;
          }
          50% {
            transform: translateY(400px);
            opacity: 1;
          }
        }

        .glow-green {
          box-shadow: 0 0 40px rgba(124, 179, 66, 0.3), 0 0 80px rgba(124, 179, 66, 0.1);
        }

        .terminal-cursor {
          display: inline-block;
          width: 8px;
          height: 20px;
          background: #7cb342;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .glitch {
          position: relative;
        }

        .glitch::before {
          content: attr(data-text);
          position: absolute;
          left: -2px;
          text-shadow: 1px 0 #6495ed;
          clip: rect(0, 900px, 0, 0);
          animation: glitch-anim 3s infinite linear alternate-reverse;
        }

        @keyframes glitch-anim {
          0% { clip: rect(42px, 9999px, 44px, 0); }
          5% { clip: rect(12px, 9999px, 59px, 0); }
          10% { clip: rect(85px, 9999px, 66px, 0); }
          15% { clip: rect(28px, 9999px, 33px, 0); }
          20% { clip: rect(91px, 9999px, 2px, 0); }
          100% { clip: rect(43px, 9999px, 77px, 0); }
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #7cb342;
          box-shadow: 0 0 12px rgba(124, 179, 66, 0.8);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        .noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.5;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0e14]/95 backdrop-blur-2xl border-b border-[#6495ed]/20 font-sans">
        <div className="noise" />
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 tactical-green-bg border border-[#7cb342] flex items-center justify-center relative">
              <Activity className="w-5 h-5 text-[#0a0e14]" />
              <div className="absolute -top-1 -right-1 status-dot" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">OpenPasture</div>
              <div className="text-[9px] font-mono tactical-cyan uppercase tracking-widest">
                Field Intel
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#platform" className="text-gray-400 hover:text-[#6495ed] transition-colors">
              Platform
            </a>
            <a href="#data" className="text-gray-400 hover:text-[#6495ed] transition-colors">
              Intelligence
            </a>
            <a href="#access" className="text-gray-400 hover:text-[#6495ed] transition-colors">
              Access
            </a>
            <button className="px-6 py-2.5 tactical-green-bg text-[#0a0e14] border border-[#7cb342] font-bold hover:shadow-[0_0_20px_rgba(124,179,66,0.4)] transition-all">
              Deploy
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-32 data-grid relative overflow-hidden">
        <div className="scan-line" />
        <div className="noise" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-5xl space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#6495ed]/10 border border-[#6495ed]/30 font-mono text-xs backdrop-blur-xl">
              <Terminal className="w-4 h-4 tactical-blue" />
              <span className="tactical-cyan uppercase tracking-widest">Satellite Intelligence Platform</span>
              <div className="terminal-cursor" />
            </div>

            <h1 className="font-serif text-7xl md:text-8xl lg:text-[110px] font-bold leading-[0.88] tracking-tight">
              <span className="glitch tactical-green" data-text="Field intelligence">
                Field intelligence
              </span>
              <br />
              <span className="tactical-blue italic">from orbital sensors</span>
            </h1>

            <p className="font-sans text-2xl md:text-3xl text-[#a0a0a0] max-w-3xl leading-relaxed font-light">
              Real-time grazing intelligence powered by Sentinel-2 constellation. Precision
              recommendations delivered daily with confidence scoring and full transparency.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button className="px-10 py-5 tactical-green-bg text-[#0a0e14] border border-[#7cb342] font-sans font-bold glow-green hover:shadow-[0_0_60px_rgba(124,179,66,0.4)] transition-all flex items-center justify-center gap-2 group">
                Request access
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-10 py-5 intel-card font-sans font-bold hover:bg-[#6495ed]/5">
                View capabilities
              </button>
            </div>

            {/* Status Bar */}
            <div className="grid grid-cols-3 gap-6 pt-8 font-mono text-xs intel-card p-6">
              <div>
                <div className="text-gray-500 mb-2 uppercase tracking-widest">Resolution</div>
                <div className="tactical-green font-semibold text-lg">10m spatial</div>
              </div>
              <div>
                <div className="text-gray-500 mb-2 uppercase tracking-widest">Cadence</div>
                <div className="tactical-blue font-semibold text-lg">5-day revisit</div>
              </div>
              <div>
                <div className="text-gray-500 mb-2 uppercase tracking-widest">Status</div>
                <div className="flex items-center gap-2">
                  <div className="status-dot" />
                  <span className="tactical-green font-semibold text-lg">OPERATIONAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="platform" className="px-6 py-32 relative">
        <div className="noise" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-20">
            <h2 className="font-serif text-6xl font-bold mb-6 tactical-blue">
              Intelligence capabilities
            </h2>
            <p className="font-sans text-2xl text-gray-400 font-light">
              Enterprise-grade satellite analysis for adaptive grazing
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Database,
                title: 'Multispectral Analysis',
                metric: '13 bands',
                description: 'NDVI, EVI, NDWI from Sentinel-2',
              },
              {
                icon: Activity,
                title: 'Time-Series Processing',
                metric: 'Real-time',
                description: 'Continuous recovery pattern analysis',
              },
              {
                icon: Shield,
                title: 'Confidence Scoring',
                metric: '0–100%',
                description: 'Transparent recommendation confidence',
              },
              {
                icon: Zap,
                title: 'Daily Intelligence',
                metric: 'Morning brief',
                description: 'Clear grazing guidance, updated daily',
              },
            ].map((capability, idx) => {
              const Icon = capability.icon
              return (
                <div key={idx} className="intel-card p-8">
                  <Icon className="w-10 h-10 tactical-green mb-6" />
                  <div className="font-mono text-[10px] tactical-cyan uppercase tracking-widest mb-3">
                    {capability.metric}
                  </div>
                  <h3 className="font-sans text-xl font-bold mb-4">{capability.title}</h3>
                  <p className="font-sans text-sm text-gray-400 leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Data Panel */}
      <section id="data" className="px-6 py-32 bg-black/30 relative">
        <div className="noise" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-6xl font-bold mb-8 tactical-blue">
                Precision at scale
              </h2>
              <p className="font-sans text-xl text-gray-400 mb-10 leading-relaxed font-light">
                Orbital sensors capture multispectral data across your entire operation. AI models
                process vegetation health, moisture stress, and biomass density—delivering
                actionable intelligence every morning.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Spatial coverage', value: 'Full farm visibility' },
                  { label: 'Update frequency', value: 'Every 5 days' },
                  { label: 'Processing time', value: '< 2 hours' },
                  { label: 'Delivery', value: 'Morning brief' },
                ].map((item, idx) => (
                  <div key={idx} className="intel-card p-5 flex items-center justify-between">
                    <span className="font-sans text-sm font-semibold">{item.label}</span>
                    <span className="font-mono text-sm tactical-green">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="intel-card p-10 glow-green relative">
              <div className="scan-line" style={{ animationDuration: '4s' }} />

              <div className="font-mono text-[10px] tactical-cyan uppercase tracking-widest mb-8">
                Live Data Feed
              </div>

              <div className="space-y-5 font-mono text-sm">
                <div className="flex justify-between items-center pb-4 border-b border-[#6495ed]/20">
                  <span className="text-gray-500">pasture_id:</span>
                  <span className="tactical-green">"north_quarter"</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-[#6495ed]/20">
                  <span className="text-gray-500">ndvi_current:</span>
                  <span className="tactical-blue text-2xl font-bold">0.82</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-[#6495ed]/20">
                  <span className="text-gray-500">confidence:</span>
                  <span className="tactical-green text-xl font-bold">91%</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-[#6495ed]/20">
                  <span className="text-gray-500">recovery_days:</span>
                  <span className="tactical-cyan text-xl font-bold">14</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">status:</span>
                  <span className="tactical-green font-bold flex items-center gap-2">
                    <div className="status-dot" />
                    READY
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="access" className="px-6 py-40 data-grid relative">
        <div className="noise" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="font-serif text-6xl md:text-7xl font-bold mb-10 leading-tight">
            Deploy satellite intelligence
            <br />
            <span className="tactical-green italic">on your operation</span>
          </h2>

          <p className="font-sans text-2xl text-gray-400 mb-14 max-w-3xl mx-auto font-light">
            Limited access for adaptive grazing operations. Priority deployment for established
            rotational systems.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-12 py-6 tactical-green-bg text-[#0a0e14] border border-[#7cb342] font-sans font-bold glow-green hover:shadow-[0_0_80px_rgba(124,179,66,0.5)] transition-all flex items-center justify-center gap-2 group">
              Request deployment
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-12 py-6 intel-card font-sans font-bold hover:bg-[#6495ed]/5">
              View documentation
            </button>
          </div>

          <div className="mt-16 font-mono text-[10px] text-gray-600 uppercase tracking-widest">
            Apache 2.0 Licensed • API-First • Open Source
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#6495ed]/20 py-16 px-6 relative">
        <div className="noise" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 tactical-green-bg border border-[#7cb342] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#0a0e14]" />
                </div>
                <div>
                  <div className="font-sans text-lg font-bold">OpenPasture</div>
                  <div className="text-[8px] font-mono tactical-cyan">FIELD INTEL</div>
                </div>
              </div>
              <p className="font-sans text-sm text-gray-500">
                Field intelligence from orbital sensors
              </p>
            </div>

            {[
              { title: 'Platform', links: ['Capabilities', 'Intelligence', 'API'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers'] },
              { title: 'Resources', links: ['Docs', 'Support', 'Privacy'] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-sans font-bold mb-4 text-xs uppercase tracking-widest">{section.title}</h4>
                <ul className="space-y-2 font-sans text-sm text-gray-500">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a href="#" className="hover:text-[#6495ed] transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-[#6495ed]/20 font-mono text-xs text-gray-600 text-center uppercase tracking-widest">
            © 2024 OpenPasture Intelligence Platform
          </div>
        </div>
      </footer>
    </div>
  )
}
