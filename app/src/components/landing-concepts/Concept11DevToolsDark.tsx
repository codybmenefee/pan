import { ArrowRight, Terminal, Code2, Zap, Check, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export function Concept11DevToolsDark() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }

        .gradient-purple {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
        }

        .gradient-blue {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        }

        .gradient-orange {
          background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .code-window {
          background: linear-gradient(to bottom, #1a1a1a, #0f0f0f);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .glow-purple {
          box-shadow: 0 0 40px rgba(124, 58, 237, 0.3);
        }

        .glow-orange {
          box-shadow: 0 0 40px rgba(249, 115, 22, 0.3);
        }

        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes slideUp {
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

        .bg-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #a855f7 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-card font-inter">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gradient-purple rounded-lg flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold">OpenPasture</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#docs" className="text-gray-400 hover:text-white transition-colors">
              Docs
            </a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
              Pricing
            </a>
            <button className="px-4 py-2 gradient-orange rounded-lg font-medium hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-grid">
        {/* Gradient Orbs */}
        <div className="absolute top-40 left-20 w-96 h-96 gradient-purple opacity-20 blur-3xl rounded-full" />
        <div className="absolute top-60 right-20 w-96 h-96 gradient-orange opacity-20 blur-3xl rounded-full" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-sm slide-up">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-gray-300">Satellite-powered grazing intelligence</span>
            </div>

            <h1 className="font-inter text-5xl md:text-6xl lg:text-7xl font-bold leading-tight slide-up delay-100">
              Make Better Grazing
              <br />
              Decisions with{' '}
              <span className="gradient-text">AI</span>
            </h1>

            <p className="font-inter text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed slide-up delay-200">
              Sentinel-2 satellites analyze your pastures overnight. Wake up to a clear
              recommendation on where to graze today, with confidence scores and reasoning.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 slide-up delay-300">
              <button className="px-8 py-4 gradient-orange rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group glow-orange">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 glass-card rounded-lg font-semibold hover:bg-white/5 transition-colors">
                View Demo
              </button>
            </div>
          </div>

          {/* Code Window */}
          <div className="max-w-4xl mx-auto slide-up delay-400">
            <div className="code-window rounded-xl overflow-hidden shadow-2xl glow-purple">
              {/* Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-xs text-gray-500 font-mono">morning-brief.json</span>
              </div>

              {/* Code Content */}
              <div className="p-6 font-mono text-sm">
                <pre className="text-gray-300">
                  <span className="text-purple-400">{'{'}</span>
                  {'\n  '}<span className="text-blue-400">"date"</span>: <span className="text-green-400">"2024-02-06"</span>,
                  {'\n  '}<span className="text-blue-400">"recommendation"</span>: <span className="text-purple-400">{'{'}</span>
                  {'\n    '}<span className="text-blue-400">"pasture"</span>: <span className="text-green-400">"North Quarter"</span>,
                  {'\n    '}<span className="text-blue-400">"confidence"</span>: <span className="text-orange-400">0.91</span>,
                  {'\n    '}<span className="text-blue-400">"ndvi"</span>: <span className="text-orange-400">0.82</span>,
                  {'\n    '}<span className="text-blue-400">"reasoning"</span>: <span className="text-green-400">"Optimal recovery period complete. Vegetation index high."</span>
                  {'\n  '}<span className="text-purple-400">{'}'}</span>,
                  {'\n  '}<span className="text-blue-400">"metrics"</span>: <span className="text-purple-400">{'{'}</span>
                  {'\n    '}<span className="text-blue-400">"recovery_days"</span>: <span className="text-orange-400">14</span>,
                  {'\n    '}<span className="text-blue-400">"moisture_index"</span>: <span className="text-orange-400">0.35</span>,
                  {'\n    '}<span className="text-blue-400">"biomass_estimate"</span>: <span className="text-green-400">"High"</span>
                  {'\n  '}<span className="text-purple-400">{'}'}</span>
                  {'\n'}<span className="text-purple-400">{'}'}</span>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-inter text-4xl md:text-5xl font-bold mb-6">
              Built for Modern Ranchers
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Satellite intelligence meets adaptive grazing. No complicated dashboards—just clear,
              daily recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Terminal,
                title: 'API-First Design',
                description:
                  'Integrate grazing intelligence into your existing workflows. RESTful API with comprehensive docs.',
                gradient: 'gradient-purple',
              },
              {
                icon: Code2,
                title: 'Open Source Core',
                description:
                  'Apache 2.0 licensed. Audit the decision logic, contribute improvements, deploy anywhere.',
                gradient: 'gradient-blue',
              },
              {
                icon: Zap,
                title: 'Real-Time Updates',
                description:
                  'New satellite data processed automatically. Recommendations update as soon as imagery is available.',
                gradient: 'gradient-orange',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="glass-card rounded-xl p-8 hover:bg-white/5 transition-all group"
                >
                  <div
                    className={`w-12 h-12 ${feature.gradient} rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-inter text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works - Code Steps */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-purple-950/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-inter text-4xl font-bold mb-4">Simple Integration</h2>
            <p className="text-xl text-gray-400">Three lines to better grazing decisions</p>
          </div>

          <div className="space-y-6">
            {[
              {
                step: '01',
                code: 'const farm = await openpasture.init({ farmId: "your-farm" })',
                description: 'Initialize with your farm coordinates',
              },
              {
                step: '02',
                code: 'const brief = await farm.getMorningBrief()',
                description: 'Fetch daily recommendation with satellite data',
              },
              {
                step: '03',
                code: 'console.log(brief.recommendation) // "North Quarter" (91% confidence)',
                description: 'Get clear guidance on where to graze today',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 gradient-purple rounded-lg flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="code-window rounded-lg p-4 mb-3">
                    <code className="font-mono text-sm text-green-400">{item.code}</code>
                  </div>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-12">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { value: '10m', label: 'Resolution', unit: 'spatial' },
                { value: '5d', label: 'Update Frequency', unit: 'satellite revisit' },
                { value: '91%', label: 'Avg Confidence', unit: 'recommendation accuracy' },
                { value: '24/7', label: 'Processing', unit: 'continuous analysis' },
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold mb-1">{stat.label}</div>
                  <div className="text-sm text-gray-500">{stat.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 to-orange-950/20" />
        <div className="absolute inset-0 bg-grid opacity-50" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-inter text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Start Making Better
            <br />
            Grazing Decisions Today
          </h2>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join beta program for early access. Free for first 100 operations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-5 gradient-orange rounded-lg font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group glow-orange">
              Get Started Free
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 glass-card rounded-lg font-bold text-lg hover:bg-white/5 transition-colors">
              View Documentation
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Open source</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Apache 2.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 gradient-purple rounded-lg flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold">OpenPasture</span>
              </div>
              <p className="text-sm text-gray-500">
                Satellite-powered grazing intelligence for adaptive operations.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div>© 2024 OpenPasture. Apache 2.0 Licensed.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
