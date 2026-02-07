import { ArrowRight, Leaf, Eye, Heart, MapPin, Calendar, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export function Concept4LandLogic() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#f5f1eb] text-[#3d3732]">
      <link
        href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&family=Lora:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-sans { font-family: 'Source Sans 3', sans-serif; }
        .font-serif { font-family: 'Lora', serif; }

        .gentle-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gentle-hover:hover {
          transform: translateY(-4px);
        }

        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        .breathing {
          animation: breathing 3s ease-in-out infinite;
        }

        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Header - Clean and Minimal */}
      <header className="sticky top-0 z-40 bg-[#f5f1eb]/95 backdrop-blur-sm border-b border-[#3d3732]/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7a9b3d] to-[#5a7b2d] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-2xl font-semibold text-[#3d3732]">OpenPasture</span>
          </div>

          <nav className="hidden md:flex gap-8 font-sans text-sm font-medium">
            <a href="#how" className="hover:text-[#7a9b3d] transition-colors">
              How it Works
            </a>
            <a href="#why" className="hover:text-[#7a9b3d] transition-colors">
              Why Now
            </a>
            <a href="#join" className="hover:text-[#7a9b3d] transition-colors">
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero - Generous Space */}
      <section className="px-6 py-32 md:py-40">
        <div className="max-w-5xl mx-auto text-center space-y-10 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7a9b3d]/10 rounded-full text-[#7a9b3d] font-sans text-sm font-medium">
            <Eye className="w-4 h-4" />
            <span>See what your land is telling you</span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight text-[#2d2520] max-w-4xl mx-auto">
            Better Grazing Decisions
            <br />
            Start with Better Information
          </h1>

          <p className="font-sans text-xl md:text-2xl text-[#3d3732]/70 max-w-3xl mx-auto leading-relaxed font-light">
            OpenPasture translates satellite imagery into a simple daily recommendation: which
            pasture is ready to graze. Clear reasoning. Your final call.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <button className="px-8 py-4 bg-[#7a9b3d] text-white font-sans font-semibold rounded-lg hover:bg-[#6a8b2d] transition-all gentle-hover flex items-center justify-center gap-2 group">
              Try the Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border-2 border-[#3d3732]/20 text-[#3d3732] font-sans font-semibold rounded-lg hover:border-[#7a9b3d] hover:text-[#7a9b3d] transition-all">
              How it Works
            </button>
          </div>
        </div>
      </section>

      {/* Visual Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#3d3732]/20 to-transparent" />
      </div>

      {/* Value Props - Card Grid */}
      <section className="px-6 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6 text-[#2d2520]">
              Grazing Intelligence, Simplified
            </h2>
            <p className="font-sans text-lg text-[#3d3732]/70 max-w-2xl mx-auto">
              We handle the complexity of satellite analysis so you can focus on your operation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: 'See the Whole Picture',
                description:
                  'Satellite imagery reveals vegetation health across your entire farm. NDVI heatmaps show which pastures are thriving and which need more rest.',
                color: '#7a9b3d',
              },
              {
                icon: Heart,
                title: 'Decisions You Can Trust',
                description:
                  'Every recommendation includes confidence scores and plain-language reasoning. No black boxes. No mysteries. Just clear guidance.',
                color: '#8b6f47',
              },
              {
                icon: TrendingUp,
                title: 'Improve Over Time',
                description:
                  'Track recovery patterns and grazing outcomes. Learn what works on your land. Build a data-backed rotation strategy.',
                color: '#5a7b2d',
              },
            ].map((card, idx) => {
              const Icon = card.icon
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-8 gentle-hover border border-[#3d3732]/10 hover:border-[#7a9b3d]/30 hover:shadow-xl"
                  onMouseEnter={() => setHoveredCard(idx)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-all"
                    style={{
                      backgroundColor: hoveredCard === idx ? card.color : `${card.color}20`,
                    }}
                  >
                    <Icon
                      className="w-7 h-7 transition-colors"
                      style={{ color: hoveredCard === idx ? 'white' : card.color }}
                    />
                  </div>

                  <h3 className="font-serif text-2xl font-semibold mb-4 text-[#2d2520]">
                    {card.title}
                  </h3>

                  <p className="font-sans text-[#3d3732]/70 leading-relaxed">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works - Step-by-Step */}
      <section id="how" className="px-6 py-32 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6 text-[#2d2520]">
              Your Morning Routine
            </h2>
            <p className="font-sans text-lg text-[#3d3732]/70">
              Three simple steps to better grazing decisions.
            </p>
          </div>

          <div className="space-y-16">
            {[
              {
                step: '01',
                title: 'Open Your Brief',
                description:
                  "Every morning, OpenPasture delivers a status update on your pastures. We've already processed the latest satellite imagery and analyzed vegetation trends overnight.",
                icon: Calendar,
              },
              {
                step: '02',
                title: 'Review the Recommendation',
                description:
                  "See which pasture our AI suggests for today's grazing, along with a confidence score and reasoning. Understand why this pasture is ready and others aren't.",
                icon: MapPin,
              },
              {
                step: '03',
                title: 'Make Your Decision',
                description:
                  "Approve the plan and move forward, or override with your own choice. Add feedback in plain language if conditions have changed. You're always in control.",
                icon: Heart,
              },
            ].map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={idx} className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full border-4 border-[#7a9b3d] flex items-center justify-center">
                      <span className="font-serif text-3xl font-semibold text-[#7a9b3d]">
                        {step.step}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="w-6 h-6 text-[#7a9b3d]" />
                      <h3 className="font-serif text-3xl font-semibold text-[#2d2520]">
                        {step.title}
                      </h3>
                    </div>
                    <p className="font-sans text-lg text-[#3d3732]/70 leading-relaxed max-w-2xl">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Now - Testimonial Style */}
      <section id="why" className="px-6 py-32 bg-gradient-to-b from-[#f5f1eb] to-[#e8dcc8]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-12 md:p-16 shadow-sm border border-[#3d3732]/10">
            <div className="text-center mb-12">
              <div className="w-16 h-16 rounded-full bg-[#7a9b3d]/10 flex items-center justify-center mx-auto mb-6 breathing">
                <Leaf className="w-8 h-8 text-[#7a9b3d]" />
              </div>
              <h2 className="font-serif text-4xl font-semibold mb-6 text-[#2d2520]">
                Satellite Technology,
                <br />
                Finally Practical
              </h2>
            </div>

            <div className="space-y-6 font-sans text-lg text-[#3d3732]/80 leading-relaxed">
              <p>
                For years, satellite imagery has been available—but hard to use. You'd need to
                download gigabytes of data, learn specialized software, and interpret complex
                multispectral bands yourself.
              </p>

              <p>
                OpenPasture handles all of that. We query Sentinel-2 imagery, compute vegetation
                indices (NDVI, EVI, NDWI), track time-series trends, and translate everything into
                a simple daily brief.
              </p>

              <p className="font-semibold text-[#2d2520]">
                You get the benefit of orbital-scale sensing without the overhead.
              </p>

              <div className="grid md:grid-cols-3 gap-6 pt-8 border-t border-[#3d3732]/10 mt-8">
                <div>
                  <div className="font-serif text-3xl font-semibold text-[#7a9b3d] mb-2">
                    10m
                  </div>
                  <div className="text-sm text-[#3d3732]/60">Spatial resolution</div>
                </div>
                <div>
                  <div className="font-serif text-3xl font-semibold text-[#7a9b3d] mb-2">
                    5 days
                  </div>
                  <div className="text-sm text-[#3d3732]/60">Satellite revisit time</div>
                </div>
                <div>
                  <div className="font-serif text-3xl font-semibold text-[#7a9b3d] mb-2">
                    Free
                  </div>
                  <div className="text-sm text-[#3d3732]/60">Sentinel-2 data</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="px-6 py-32 bg-[#f5f1eb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-semibold mb-4 text-[#2d2520]">
              Built on Clear Principles
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'You Stay in Control',
                description:
                  'We provide recommendations, not commands. Override any suggestion with natural-language feedback. Your expertise always takes priority.',
              },
              {
                title: 'Transparent Reasoning',
                description:
                  'Every recommendation includes confidence scores and explanations. No black-box AI. You understand exactly why we suggest what we do.',
              },
              {
                title: 'Decision Support, Not Automation',
                description:
                  'This is intelligence software, not control hardware. We help you make better decisions—you execute them however works for your operation.',
              },
              {
                title: 'Open and Extensible',
                description:
                  'Apache 2.0 license. Open architecture. Integrate with virtual fencing systems or use for manual planning. Your data, your workflow.',
              },
            ].map((principle, idx) => (
              <div
                key={idx}
                className="flex gap-6 p-8 bg-white rounded-xl border border-[#3d3732]/10 gentle-hover"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#7a9b3d]/10 flex items-center justify-center">
                    <span className="font-serif text-xl font-semibold text-[#7a9b3d]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-3 text-[#2d2520]">
                    {principle.title}
                  </h3>
                  <p className="font-sans text-[#3d3732]/70 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Warm and Inviting */}
      <section id="join" className="px-6 py-32 bg-gradient-to-br from-[#7a9b3d] to-[#5a7b2d]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold mb-8 leading-tight">
            Ready to Make Land-Informed Decisions?
          </h2>

          <p className="font-sans text-xl md:text-2xl opacity-95 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Join early access and start receiving satellite-backed grazing recommendations every
            morning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-5 bg-white text-[#7a9b3d] font-sans font-semibold rounded-lg hover:bg-[#f5f1eb] transition-all gentle-hover flex items-center justify-center gap-2 group">
              Request Beta Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 border-2 border-white text-white font-sans font-semibold rounded-lg hover:bg-white/10 transition-all">
              Explore Demo
            </button>
          </div>

          <div className="mt-16 pt-16 border-t border-white/20 font-sans text-sm opacity-80">
            Priority given to operations practicing rotational or adaptive grazing
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2d2520] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#7a9b3d] flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="font-serif text-2xl font-semibold">OpenPasture</span>
              </div>
              <p className="font-sans text-white/70 leading-relaxed max-w-sm">
                Building the intelligence layer for regenerative grazing. Satellite sensing,
                AI analysis, human decisions.
              </p>
            </div>

            <div>
              <h4 className="font-sans font-semibold mb-4">Product</h4>
              <ul className="space-y-2 font-sans text-sm text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-sans font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 font-sans text-sm text-white/70">
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
                    Apache 2.0 License
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 font-sans text-sm text-white/50">
            <div>© 2024 OpenPasture. Open source, Apache 2.0 licensed.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
