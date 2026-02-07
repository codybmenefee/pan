import { ArrowRight, Target, Activity, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Concept5CommandCenter() {
  const [missionTime, setMissionTime] = useState('')
  const [systemStatus, setSystemStatus] = useState<'OPERATIONAL' | 'ANALYZING' | 'READY'>('OPERATIONAL')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setMissionTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)

    const statusCycle = setInterval(() => {
      setSystemStatus((prev) => {
        if (prev === 'OPERATIONAL') return 'ANALYZING'
        if (prev === 'ANALYZING') return 'READY'
        return 'OPERATIONAL'
      })
    }, 3000)

    return () => {
      clearInterval(interval)
      clearInterval(statusCycle)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#1a1f1a] text-[#e0e8d0]">
      <link
        href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-condensed { font-family: 'Saira Condensed', sans-serif; }
        .font-mono { font-family: 'Roboto Mono', monospace; }

        .tactical-grid {
          background-image:
            linear-gradient(rgba(96, 125, 50, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96, 125, 50, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .status-pulse {
          animation: statusPulse 2s ease-in-out infinite;
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .tactical-border {
          position: relative;
        }

        .tactical-border::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid #607d32;
          clip-path: polygon(
            0 0, 12px 0, 12px 2px, 2px 2px, 2px 12px, 0 12px,
            0 100%, 12px 100%, 12px calc(100% - 2px), 2px calc(100% - 2px), 2px calc(100% - 12px), 0 calc(100% - 12px),
            100% calc(100% - 12px), calc(100% - 2px) calc(100% - 12px), calc(100% - 2px) calc(100% - 2px), calc(100% - 12px) calc(100% - 2px), calc(100% - 12px) 100%, 100% 100%,
            100% 0, calc(100% - 12px) 0, calc(100% - 12px) 2px, calc(100% - 2px) 2px, calc(100% - 2px) 12px, 100% 12px
          );
        }

        .instant-transition {
          transition: all 0.1s linear;
        }
      `}</style>

      {/* Header - Command Bar */}
      <header className="border-b-2 border-[#607d32] bg-[#0f140f] tactical-grid">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="grid grid-cols-12 gap-4 items-center font-condensed text-sm">
            {/* Logo */}
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#607d32] flex items-center justify-center">
                <Target className="w-6 h-6 text-[#0f140f]" />
              </div>
              <div>
                <div className="font-bold text-base leading-none">OPENPASTURE</div>
                <div className="text-xs text-[#607d32] uppercase">GRAZING OPS</div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="col-span-6 flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#7fb800] status-pulse" />
                <span>SATELLITE: {systemStatus}</span>
              </div>
              <div className="border-l border-[#607d32]/30 h-4" />
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{missionTime}</span>
              </div>
              <div className="border-l border-[#607d32]/30 h-4" />
              <div>MISSION DAY: 2024.037</div>
            </div>

            {/* Action */}
            <div className="col-span-3 flex justify-end">
              <button className="px-6 py-2 bg-[#607d32] text-[#0f140f] font-bold uppercase text-xs hover:bg-[#7fb800] instant-transition">
                DEPLOY SYSTEM
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero - Dense Information Grid */}
      <section className="px-4 py-12 tactical-grid">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Main Mission Brief */}
            <div className="lg:col-span-8 space-y-6">
              {/* Mission Header */}
              <div className="bg-[#0f140f] border-2 border-[#607d32] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-condensed text-xs text-[#607d32] uppercase mb-1">
                      MISSION BRIEFING
                    </div>
                    <h1 className="font-condensed text-5xl font-bold leading-none uppercase">
                      DAILY GRAZING
                      <br />
                      <span className="text-[#7fb800]">DECISION SUPPORT</span>
                    </h1>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-[#607d32]">CLEARANCE</div>
                    <div className="font-condensed text-2xl font-bold text-[#7fb800]">BETA</div>
                  </div>
                </div>

                <div className="border-t border-[#607d32]/30 pt-4 mt-4">
                  <p className="font-condensed text-lg leading-relaxed">
                    SATELLITE-DERIVED INTELLIGENCE FOR ADAPTIVE GRAZING OPERATIONS. SENTINEL-2
                    MULTISPECTRAL ANALYSIS DELIVERS VEGETATION METRICS. AI DECISION ENGINE PROCESSES
                    NDVI/EVI/NDWI INDICES AND OUTPUTS ACTIONABLE DAILY RECOMMENDATIONS WITH
                    CONFIDENCE SCORING.
                  </p>
                </div>
              </div>

              {/* Mission Objectives */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0f140f] border-l-4 border-[#7fb800] p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-[#7fb800] flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-condensed text-sm font-bold uppercase text-[#7fb800] mb-2">
                        PRIMARY OBJECTIVE
                      </div>
                      <div className="font-condensed text-base leading-snug">
                        Optimize pasture rotation timing using orbital sensing. Maximize forage
                        utilization while maintaining recovery periods.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0f140f] border-l-4 border-[#d4af37] p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-condensed text-sm font-bold uppercase text-[#d4af37] mb-2">
                        OPERATOR CONTROL
                      </div>
                      <div className="font-condensed text-base leading-snug">
                        All recommendations advisory only. Operator maintains full override
                        authority. Natural language feedback loop enabled.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capability Blocks */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    label: 'SENSING',
                    value: 'SENTINEL-2',
                    detail: '10m Resolution',
                    status: 'ACTIVE',
                  },
                  {
                    label: 'ANALYSIS',
                    value: 'AI ENGINE',
                    detail: 'Time-Series',
                    status: 'PROCESSING',
                  },
                  {
                    label: 'OUTPUT',
                    value: 'DAILY BRIEF',
                    detail: 'Morning Delivery',
                    status: 'READY',
                  },
                ].map((block, idx) => (
                  <div key={idx} className="bg-[#0f140f] border border-[#607d32] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-mono text-xs text-[#607d32]">{block.label}</div>
                      <div className="font-mono text-xs text-[#7fb800]">{block.status}</div>
                    </div>
                    <div className="font-condensed text-2xl font-bold mb-1">{block.value}</div>
                    <div className="font-condensed text-sm text-[#607d32]">{block.detail}</div>
                  </div>
                ))}
              </div>

              {/* CTA Block */}
              <div className="bg-gradient-to-r from-[#607d32] to-[#7fb800] p-[2px] tactical-border">
                <div className="bg-[#0f140f] p-8">
                  <div className="grid md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-2">
                      <div className="font-condensed text-xs text-[#7fb800] uppercase mb-2">
                        DEPLOYMENT CLEARANCE REQUIRED
                      </div>
                      <div className="font-condensed text-2xl font-bold mb-2">
                        REQUEST BETA ACCESS
                      </div>
                      <div className="font-condensed text-sm text-[#e0e8d0]/70">
                        Priority assignment for operations with established rotational systems.
                        Limited slots available.
                      </div>
                    </div>
                    <div>
                      <button className="w-full px-6 py-4 bg-[#7fb800] text-[#0f140f] font-condensed font-bold uppercase text-sm hover:bg-[#607d32] instant-transition flex items-center justify-center gap-2 group">
                        SUBMIT REQUEST
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 instant-transition" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Status Panels */}
            <div className="lg:col-span-4 space-y-4">
              {/* System Status */}
              <div className="bg-[#0f140f] border-2 border-[#607d32] p-5">
                <div className="font-condensed text-xs text-[#607d32] uppercase mb-4">
                  SYSTEM STATUS
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Satellite Link', status: 'OPERATIONAL', level: 100 },
                    { label: 'AI Processing', status: 'OPERATIONAL', level: 100 },
                    { label: 'Data Pipeline', status: 'OPERATIONAL', level: 95 },
                    { label: 'User Interface', status: 'OPERATIONAL', level: 100 },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-condensed text-sm">{item.label}</span>
                        <span className="font-mono text-xs text-[#7fb800]">{item.status}</span>
                      </div>
                      <div className="h-1 bg-[#607d32]/30">
                        <div
                          className="h-full bg-[#7fb800]"
                          style={{ width: `${item.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mission Metrics */}
              <div className="bg-[#0f140f] border-2 border-[#607d32] p-5">
                <div className="font-condensed text-xs text-[#607d32] uppercase mb-4">
                  PERFORMANCE METRICS
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="font-mono text-xs text-[#607d32] mb-1">DECISION ACCURACY</div>
                    <div className="font-condensed text-3xl font-bold text-[#7fb800]">87%</div>
                  </div>

                  <div className="border-t border-[#607d32]/30 pt-4">
                    <div className="font-mono text-xs text-[#607d32] mb-1">AVG CONFIDENCE</div>
                    <div className="font-condensed text-3xl font-bold text-[#7fb800]">91%</div>
                  </div>

                  <div className="border-t border-[#607d32]/30 pt-4">
                    <div className="font-mono text-xs text-[#607d32] mb-1">RESPONSE TIME</div>
                    <div className="font-condensed text-3xl font-bold text-[#7fb800]">&lt;2m</div>
                  </div>
                </div>
              </div>

              {/* Alert Panel */}
              <div className="bg-[#0f140f] border-2 border-[#d4af37] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-[#d4af37]" />
                  <div className="font-condensed text-xs text-[#d4af37] uppercase">
                    ADVISORY NOTICE
                  </div>
                </div>
                <div className="font-condensed text-sm leading-snug">
                  This is decision support software. Not autonomous control. Operator oversight
                  required for all grazing actions.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Matrix */}
      <section className="px-4 py-16 bg-[#0f140f] border-y-2 border-[#607d32]">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-10">
            <div className="font-condensed text-xs text-[#607d32] uppercase mb-2">
              TECHNICAL SPECIFICATIONS
            </div>
            <h2 className="font-condensed text-4xl font-bold uppercase">
              CAPABILITY <span className="text-[#7fb800]">MATRIX</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                category: 'SENSING',
                items: ['Sentinel-2 MSI', '13-Band Multispectral', '10m–20m Resolution', 'L2A Surface Reflectance'],
              },
              {
                category: 'PROCESSING',
                items: ['NDVI Computation', 'EVI Analysis', 'NDWI Moisture Index', 'Time-Series Trends'],
              },
              {
                category: 'DECISION',
                items: ['AI Recommendation Engine', 'Confidence Scoring', 'Natural Language Output', 'Override Capability'],
              },
              {
                category: 'EXECUTION',
                items: ['Manual Guidance', 'Virtual Fence Ready', 'Custom Workflow', 'Open Architecture'],
              },
            ].map((module, idx) => (
              <div key={idx} className="bg-[#1a1f1a] border border-[#607d32] p-5">
                <div className="font-condensed text-xs text-[#7fb800] uppercase mb-4 pb-2 border-b border-[#607d32]/30">
                  {module.category}
                </div>
                <ul className="space-y-2">
                  {module.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2 font-condensed text-sm">
                      <div className="w-1 h-1 bg-[#607d32] mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Operational Flow */}
      <section className="px-4 py-16 tactical-grid">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-10">
            <div className="font-condensed text-xs text-[#607d32] uppercase mb-2">
              OPERATIONAL WORKFLOW
            </div>
            <h2 className="font-condensed text-4xl font-bold uppercase">
              MISSION <span className="text-[#7fb800]">PROTOCOL</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                phase: 'PHASE 01',
                title: 'MORNING BRIEFING',
                description:
                  'Open dashboard. Review satellite-derived pasture status. View vegetation indices and recovery metrics.',
                icon: Clock,
              },
              {
                phase: 'PHASE 02',
                title: 'RECOMMENDATION ANALYSIS',
                description:
                  'AI engine presents optimal pasture selection with confidence score and reasoning. Review supporting data.',
                icon: Activity,
              },
              {
                phase: 'PHASE 03',
                title: 'OPERATOR DECISION',
                description:
                  'Approve recommended action or override with feedback. Execute grazing plan via manual or automated workflow.',
                icon: Target,
              },
            ].map((phase, idx) => {
              const Icon = phase.icon
              return (
                <div key={idx} className="bg-[#0f140f] border-2 border-[#607d32] p-6 tactical-border">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#607d32] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#0f140f]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-mono text-xs text-[#607d32] mb-1">{phase.phase}</div>
                      <div className="font-condensed text-xl font-bold uppercase">
                        {phase.title}
                      </div>
                    </div>
                  </div>
                  <div className="font-condensed leading-relaxed pl-16">
                    {phase.description}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 bg-gradient-to-b from-[#0f140f] to-[#1a1f1a] border-t-2 border-[#607d32]">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="font-mono text-xs text-[#607d32] uppercase mb-4">CLEARANCE LEVEL: BETA</div>
          <h2 className="font-condensed text-5xl md:text-6xl font-bold uppercase mb-6">
            DEPLOY GRAZING INTELLIGENCE
            <br />
            <span className="text-[#7fb800]">ON YOUR OPERATION</span>
          </h2>
          <p className="font-condensed text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
            REQUEST EARLY ACCESS TO SATELLITE-BACKED DECISION SUPPORT SYSTEM. LIMITED DEPLOYMENT
            SLOTS. PRIORITY TO ESTABLISHED ROTATIONAL OPERATIONS.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-5 bg-[#7fb800] text-[#0f140f] font-condensed font-bold uppercase hover:bg-[#607d32] instant-transition flex items-center justify-center gap-2 group">
              REQUEST DEPLOYMENT
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 instant-transition" />
            </button>
            <button className="px-10 py-5 border-2 border-[#607d32] text-[#607d32] font-condensed font-bold uppercase hover:bg-[#607d32]/10 instant-transition">
              VIEW TECHNICAL DOCS
            </button>
          </div>

          <div className="mt-12 pt-12 border-t border-[#607d32]/30 font-mono text-xs text-[#607d32]">
            SYSTEM STATUS: OPERATIONAL | APACHE 2.0 LICENSE | OPEN SOURCE ARCHITECTURE
          </div>
        </div>
      </section>

      {/* Footer - Command Bar Style */}
      <footer className="border-t-2 border-[#607d32] bg-[#0f140f]">
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-condensed text-xs text-[#607d32] uppercase mb-3">SYSTEM</div>
              <div className="space-y-2 font-condensed text-sm">
                <div>OPENPASTURE</div>
                <div className="text-[#607d32]">Intelligence Layer</div>
              </div>
            </div>

            <div>
              <div className="font-condensed text-xs text-[#607d32] uppercase mb-3">RESOURCES</div>
              <ul className="space-y-2 font-condensed text-sm">
                <li>
                  <a href="#" className="hover:text-[#7fb800] instant-transition">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7fb800] instant-transition">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7fb800] instant-transition">
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-condensed text-xs text-[#607d32] uppercase mb-3">LICENSE</div>
              <ul className="space-y-2 font-condensed text-sm">
                <li>Apache 2.0</li>
                <li>Open Source</li>
                <li>Extensible</li>
              </ul>
            </div>

            <div>
              <div className="font-condensed text-xs text-[#607d32] uppercase mb-3">
                CONTACT
              </div>
              <div className="font-condensed text-sm text-[#607d32]">
                SECURE CHANNEL ONLY
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#607d32]/30 font-mono text-xs text-[#607d32] text-center">
            © 2024 OPENPASTURE | BUILDING THE INTELLIGENCE LAYER FOR REGENERATIVE GRAZING
          </div>
        </div>
      </footer>
    </div>
  )
}
