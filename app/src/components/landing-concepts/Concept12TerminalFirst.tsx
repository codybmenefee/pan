import { ArrowRight, Terminal, ChevronRight, Download, Star, GitBranch } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Concept12TerminalFirst() {
  const [typedText, setTypedText] = useState('')
  const fullText = 'openpasture get-recommendation --farm north-ranch'

  useEffect(() => {
    if (typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1))
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [typedText])

  return (
    <div className="min-h-screen bg-black text-[#00ff00]">
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        .font-mono-alt { font-family: 'Space Mono', monospace; }

        .terminal-green { color: #00ff00; }
        .terminal-cursor::after {
          content: '▊';
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .scan-line {
          position: relative;
        }

        .scan-line::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ff00, transparent);
          animation: scan 8s linear infinite;
        }

        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }

        .terminal-border {
          border: 1px solid #00ff00;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.2), inset 0 0 20px rgba(0, 255, 0, 0.05);
        }

        .crt-effect {
          animation: crt 0.1s infinite alternate;
        }

        @keyframes crt {
          0% { text-shadow: 0 0 2px rgba(0, 255, 0, 0.8); }
          100% { text-shadow: 0 0 3px rgba(0, 255, 0, 0.8); }
        }

        .terminal-glow {
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3), 0 0 20px rgba(0, 255, 0, 0.2);
        }

        .ascii-border {
          border: 2px solid #00ff00;
          position: relative;
        }

        .ascii-border::before {
          content: '┌─────────────────────────────────────┐';
          position: absolute;
          top: -12px;
          left: 0;
          right: 0;
          font-family: monospace;
          color: #00ff00;
        }
      `}</style>

      {/* Header - Terminal Style */}
      <header className="border-b border-[#00ff00]/30 font-mono">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 terminal-green" />
              <span className="text-lg font-bold terminal-green">openpasture://</span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a href="#docs" className="text-[#00ff00]/70 hover:text-[#00ff00] transition-colors">
                [docs]
              </a>
              <a href="#api" className="text-[#00ff00]/70 hover:text-[#00ff00] transition-colors">
                [api]
              </a>
              <a href="#cli" className="text-[#00ff00]/70 hover:text-[#00ff00] transition-colors">
                [cli]
              </a>
              <button className="px-4 py-1 border border-[#00ff00] terminal-green hover:bg-[#00ff00]/10 transition-colors">
                $ install
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero - Terminal Output */}
      <section className="py-20 px-6 scan-line">
        <div className="max-w-6xl mx-auto">
          {/* Terminal Window */}
          <div className="terminal-border bg-black p-8 mb-12">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#00ff00]/30">
              <div className="flex gap-2">
                <div className="w-3 h-3 border border-[#00ff00]" />
                <div className="w-3 h-3 border border-[#00ff00]" />
                <div className="w-3 h-3 border border-[#00ff00]" />
              </div>
              <span className="ml-4 text-xs opacity-70">terminal@openpasture:~$</span>
            </div>

            <div className="font-mono text-sm space-y-3 crt-effect">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                <span className="terminal-cursor">{typedText}</span>
              </div>

              <div className="pl-6 space-y-2 text-xs opacity-90">
                <div>Fetching satellite data for north-ranch...</div>
                <div>[████████████████████] 100% Complete</div>
                <div className="text-white/70">
                  <br />
                  Processing Sentinel-2 imagery...
                  <br />
                  Computing NDVI, EVI, NDWI indices...
                  <br />
                  Analyzing recovery patterns...
                  <br />
                </div>

                <div className="border border-[#00ff00]/50 p-4 mt-4 bg-[#00ff00]/5">
                  <div className="mb-2">RECOMMENDATION:</div>
                  <div className="pl-4 space-y-1">
                    <div>├─ pasture: "East Quarter"</div>
                    <div>├─ confidence: 0.89</div>
                    <div>├─ ndvi: 0.76</div>
                    <div>├─ recovery_days: 12</div>
                    <div>└─ reasoning: "Optimal vegetation recovery detected"</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  <span className="opacity-50">awaiting input...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-6">
            <h1 className="font-mono-alt text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              {'> '}GRAZING INTELLIGENCE
              <br />
              {'  '}FROM THE COMMAND LINE
            </h1>

            <p className="font-mono text-lg text-[#00ff00]/70 max-w-3xl mx-auto leading-relaxed">
              Satellite-driven decision support for adaptive grazing. Install the CLI, run one
              command, get your daily recommendation. Open source. Apache 2.0.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <button className="px-8 py-4 bg-[#00ff00] text-black font-mono font-bold hover:bg-[#00ff00]/90 transition-colors terminal-glow flex items-center justify-center gap-2 group">
                <Download className="w-5 h-5" />
                INSTALL CLI
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 border border-[#00ff00] font-mono font-bold hover:bg-[#00ff00]/10 transition-colors">
                VIEW DOCS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Install Instructions */}
      <section className="py-20 px-6 border-t border-[#00ff00]/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-mono-alt text-3xl font-bold mb-12 text-center">
            {'>'} QUICK START
          </h2>

          <div className="space-y-6">
            {[
              {
                step: '01',
                cmd: 'curl -fsSL https://openpasture.dev/install | bash',
                description: 'Install the OpenPasture CLI',
              },
              {
                step: '02',
                cmd: 'openpasture init --farm "your-farm-name"',
                description: 'Initialize your farm configuration',
              },
              {
                step: '03',
                cmd: 'openpasture get-recommendation',
                description: 'Get your daily grazing recommendation',
              },
            ].map((item) => (
              <div key={item.step} className="terminal-border p-6">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-2xl font-bold">[{item.step}]</span>
                  <span className="text-sm opacity-70">{item.description}</span>
                </div>
                <div className="bg-black/50 p-4 rounded border border-[#00ff00]/20">
                  <code className="font-mono text-sm">$ {item.cmd}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - ASCII Table */}
      <section className="py-20 px-6 border-t border-[#00ff00]/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-mono-alt text-3xl font-bold mb-12 text-center">
            {'>'} FEATURES
          </h2>

          <div className="terminal-border p-8 font-mono text-sm">
            <div className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-4 pb-2 border-b border-[#00ff00]/30">
                <div className="font-bold">FEATURE</div>
                <div className="font-bold">DESCRIPTION</div>
              </div>

              {[
                {
                  name: 'satellite',
                  description: 'Sentinel-2 multispectral imagery (10m resolution, 5-day cadence)',
                },
                {
                  name: 'indices',
                  description: 'NDVI, EVI, NDWI vegetation and moisture analysis',
                },
                {
                  name: 'ai-engine',
                  description: 'Time-series ML model for recovery pattern prediction',
                },
                {
                  name: 'confidence',
                  description: 'Transparent scoring (0-100%) with reasoning output',
                },
                {
                  name: 'cli-first',
                  description: 'Terminal-native workflow, scriptable, CI/CD ready',
                },
                {
                  name: 'open-source',
                  description: 'Apache 2.0 licensed, audit the logic, contribute PRs',
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[120px_1fr] gap-4 py-2 hover:bg-[#00ff00]/5 transition-colors"
                >
                  <div className="font-bold">{feature.name}</div>
                  <div className="opacity-80">{feature.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Terminal Output */}
      <section className="py-20 px-6 border-t border-[#00ff00]/30">
        <div className="max-w-6xl mx-auto">
          <div className="terminal-border p-8">
            <div className="font-mono text-xs mb-6 opacity-70">$ openpasture --stats</div>
            <div className="grid md:grid-cols-4 gap-8 font-mono">
              {[
                { label: 'spatial_resolution', value: '10m', unit: 'meters' },
                { label: 'temporal_frequency', value: '5d', unit: 'days' },
                { label: 'avg_confidence', value: '89%', unit: 'accuracy' },
                { label: 'open_source', value: 'true', unit: 'boolean' },
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-xs opacity-70 mb-2">{stat.label}:</div>
                  <div className="text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs opacity-50">// {stat.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Stats */}
      <section className="py-20 px-6 border-t border-[#00ff00]/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-mono-alt text-3xl font-bold mb-12">
            {'>'} OPEN SOURCE
          </h2>

          <div className="terminal-border p-12">
            <div className="flex flex-col md:flex-row justify-center gap-12 font-mono">
              <div>
                <Star className="w-8 h-8 mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">1.2k</div>
                <div className="text-sm opacity-70">GitHub Stars</div>
              </div>

              <div>
                <GitBranch className="w-8 h-8 mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">450</div>
                <div className="text-sm opacity-70">Contributors</div>
              </div>

              <div>
                <Terminal className="w-8 h-8 mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">2.1M</div>
                <div className="text-sm opacity-70">CLI Downloads</div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-[#00ff00]/30">
              <code className="text-sm">
                $ git clone https://github.com/openpasture/openpasture.git
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 border-t border-[#00ff00]/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="terminal-border p-12">
            <div className="font-mono text-xs mb-8 opacity-70">
              $ openpasture --version
              <br />
              openpasture v2.1.0 (beta)
            </div>

            <h2 className="font-mono-alt text-4xl md:text-5xl font-bold mb-8 leading-tight">
              {'>'} START USING
              <br />
              {'  '}SATELLITE INTELLIGENCE
              <br />
              {'  '}TODAY
            </h2>

            <p className="font-mono text-lg opacity-80 mb-12">
              Free for first 100 operations. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-10 py-5 bg-[#00ff00] text-black font-mono font-bold hover:bg-[#00ff00]/90 transition-colors terminal-glow flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                INSTALL NOW
              </button>
              <button className="px-10 py-5 border border-[#00ff00] font-mono font-bold hover:bg-[#00ff00]/10 transition-colors">
                READ DOCS
              </button>
            </div>

            <div className="mt-12 font-mono text-xs opacity-50">
              Apache 2.0 Licensed | Community-Driven | API-First
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#00ff00]/30 py-12 px-6 font-mono">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5" />
                <span className="font-bold">openpasture</span>
              </div>
              <div className="text-xs opacity-70">
                Satellite-powered
                <br />
                grazing intelligence
                <br />
                for CLI users
              </div>
            </div>

            <div>
              <div className="font-bold mb-4">[product]</div>
              <ul className="space-y-2 text-xs opacity-70">
                <li>
                  <a href="#" className="hover:opacity-100">
                    - features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100">
                    - pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100">
                    - api-docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-bold mb-4">[developers]</div>
              <ul className="space-y-2 text-xs opacity-70">
                <li>
                  <a href="#" className="hover:opacity-100">
                    - documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100">
                    - github
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100">
                    - community
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-bold mb-4">[legal]</div>
              <ul className="space-y-2 text-xs opacity-70">
                <li>
                  <a href="#" className="hover:opacity-100">
                    - privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100">
                    - terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100">
                    - license
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#00ff00]/30 text-center text-xs opacity-50">
            © 2024 openpasture | apache-2.0 | built by developers, for developers
          </div>
        </div>
      </footer>
    </div>
  )
}
