import { ArrowRight, Sun, Coffee, Check } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Concept2MorningRitual() {
  const [scrollY, setScrollY] = useState(0)
  const [timeOfDay, setTimeOfDay] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)

    const now = new Date()
    const hour = now.getHours()
    setTimeOfDay(hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening')

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2d2520]">
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Work+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .serif-display { font-family: 'Cormorant', serif; }
        .sans-body { font-family: 'Work Sans', sans-serif; }
        .parallax-slow { transform: translateY(${scrollY * 0.3}px); }
        .parallax-fast { transform: translateY(${scrollY * 0.6}px); }
        .fade-in-up {
          animation: fadeInUp 1s ease-out forwards;
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
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
      `}</style>

      {/* Header - Elegant and Minimal */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#2d2520]/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e8a87c] to-[#c38d5c] flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <span className="serif-display text-2xl font-semibold">OpenPasture</span>
          </div>
          <nav className="hidden md:flex gap-8 sans-body text-sm">
            <a href="#story" className="hover:text-[#c38d5c] transition-colors">
              Our Story
            </a>
            <a href="#approach" className="hover:text-[#c38d5c] transition-colors">
              The Approach
            </a>
            <a href="#join" className="hover:text-[#c38d5c] transition-colors">
              Join Us
            </a>
          </nav>
        </div>
      </header>

      {/* Hero - Full-bleed with Gradient */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient Background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#ffd89b] via-[#ffb88c] to-[#e8a87c] parallax-slow"
          style={{ backgroundSize: '200% 200%' }}
        />

        {/* Overlay Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, #2d2520 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl fade-in-up">
          <div className="sans-body text-sm uppercase tracking-wider mb-6 text-[#2d2520]/70 stagger-1">
            {timeOfDay}'s Decision, Delivered
          </div>
          <h1 className="serif-display text-6xl md:text-7xl lg:text-8xl font-semibold leading-tight mb-8 text-[#2d2520] stagger-2">
            Let the Land
            <br />
            Tell You When
            <br />
            It's Ready
          </h1>
          <p className="sans-body text-lg md:text-xl text-[#2d2520]/80 max-w-2xl mx-auto leading-relaxed mb-10 stagger-3">
            Every sunrise brings a new grazing recommendation, distilled from satellite imagery and
            years of agricultural wisdom. Simple, clear, actionable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center stagger-4">
            <button className="px-8 py-4 bg-[#2d2520] text-[#faf8f5] sans-body font-medium rounded-full hover:bg-[#3d3530] transition-all hover:scale-105 flex items-center justify-center gap-2 group">
              Experience the Morning Brief
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border-2 border-[#2d2520] text-[#2d2520] sans-body font-medium rounded-full hover:bg-[#2d2520]/5 transition-colors">
              Learn Our Story
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60 animate-bounce">
          <div className="sans-body text-xs uppercase tracking-wider">Scroll to explore</div>
          <div className="w-px h-12 bg-[#2d2520]" />
        </div>
      </section>

      {/* Story Section - Editorial Layout */}
      <section id="story" className="py-32 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Coffee className="w-6 h-6 text-[#c38d5c]" />
            <span className="sans-body text-sm uppercase tracking-wider text-[#2d2520]/60">
              Chapter One
            </span>
          </div>

          <h2 className="serif-display text-5xl md:text-6xl font-semibold mb-8 leading-tight">
            Your Morning Ritual, Reimagined
          </h2>

          <div className="space-y-6 sans-body text-lg leading-relaxed text-[#2d2520]/80">
            <p className="text-2xl leading-relaxed text-[#2d2520] font-light">
              Coffee in hand, you open OpenPasture. The map loads—your farm, from above, painted in
              the greens and golds of vegetation health.
            </p>

            <p>
              While you slept, satellites passed overhead. Multispectral sensors measured the
              invisible: chlorophyll density, moisture stress, biomass recovery. Our AI analyzed
              this data against your grazing history, weather patterns, and rest periods.
            </p>

            <p>
              By the time you're ready to plan your day, the answer is waiting. Not a wall of
              charts or confusing metrics—just a recommendation, backed by confidence and reasoning
              you can understand.
            </p>

            <div className="bg-[#faf8f5] border-l-4 border-[#c38d5c] p-8 my-12 italic serif-display text-2xl">
              "Graze Pasture 7 today. Recovery index: 0.87. Soil moisture optimal. Confidence: 91%."
            </div>

            <p>
              You review the map, check the details, and make the call. Override if conditions have
              changed. Approve and move forward. The land speaks, we translate, you decide.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Break - Image Placeholder */}
      <section className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7a9b3d] to-[#5a7b2d] parallax-fast" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/90">
            <div className="sans-body text-sm uppercase tracking-wider mb-4 opacity-70">
              Visualization
            </div>
            <div className="serif-display text-4xl md:text-5xl font-semibold">
              Satellite-Derived Intelligence
            </div>
            <div className="sans-body mt-4 text-lg opacity-80">
              NDVI • EVI • NDWI • Time-Series Analysis
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Cards */}
      <section id="approach" className="py-32 px-6 bg-[#faf8f5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="sans-body text-sm uppercase tracking-wider text-[#2d2520]/60">
              The Process
            </span>
            <h2 className="serif-display text-5xl md:text-6xl font-semibold mt-4 mb-6">
              Three Steps to Better Grazing
            </h2>
            <p className="sans-body text-xl text-[#2d2520]/70 max-w-2xl mx-auto">
              We've distilled complex satellite analysis into a simple daily workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Satellite Sensing',
                description:
                  'Sentinel-2 captures multispectral imagery of your farm every 5 days. We process vegetation indices (NDVI, EVI) and moisture indicators (NDWI) to understand pasture health.',
              },
              {
                num: '02',
                title: 'AI Analysis',
                description:
                  'Our decision engine evaluates current conditions against historical patterns, rest periods, and grazing pressure. It identifies the optimal pasture with a confidence score.',
              },
              {
                num: '03',
                title: 'Your Decision',
                description:
                  'Review the recommendation each morning. Understand the reasoning. Override with feedback if needed, or approve and execute. You remain in full control.',
              },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
                <div className="serif-display text-6xl font-bold text-[#c38d5c]/20 mb-4">
                  {step.num}
                </div>
                <h3 className="serif-display text-3xl font-semibold mb-4">{step.title}</h3>
                <p className="sans-body text-[#2d2520]/70 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits - Two Column */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="serif-display text-5xl font-semibold mb-8 leading-tight">
              Graze More.
              <br />
              Rest Better.
              <br />
              Decide Clearly.
            </h2>
            <p className="sans-body text-lg text-[#2d2520]/70 leading-relaxed mb-8">
              Adaptive grazing requires timing, observation, and instinct. OpenPasture adds
              satellite-scale vision and data-driven confidence to your existing expertise.
            </p>
            <div className="space-y-4">
              {[
                'See vegetation health across your entire operation',
                'Track recovery trends you can\'t observe manually',
                'Make decisions backed by objective data',
                'Stay in control with override capability',
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#7a9b3d] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="sans-body text-[#2d2520]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#7a9b3d] to-[#5a7b2d] rounded-2xl p-8 text-white">
              <div className="sans-body text-sm uppercase tracking-wider opacity-70 mb-2">
                Beta Outcome
              </div>
              <div className="serif-display text-5xl font-bold mb-2">14%</div>
              <div className="sans-body text-lg opacity-90">
                Average increase in grazing days per pasture
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#e8a87c] to-[#c38d5c] rounded-2xl p-8 text-white">
              <div className="sans-body text-sm uppercase tracking-wider opacity-70 mb-2">
                Decision Speed
              </div>
              <div className="serif-display text-5xl font-bold mb-2">&lt; 2 min</div>
              <div className="sans-body text-lg opacity-90">
                From opening app to executing plan
              </div>
            </div>

            <div className="bg-[#2d2520] rounded-2xl p-8 text-white">
              <div className="sans-body text-sm uppercase tracking-wider opacity-70 mb-2">
                Satellite Cadence
              </div>
              <div className="serif-display text-5xl font-bold mb-2">5 days</div>
              <div className="sans-body text-lg opacity-90">Fresh imagery, continuous insights</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Full Width */}
      <section id="join" className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d2520] to-[#3d3530]" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <div className="sans-body text-sm uppercase tracking-wider mb-6 opacity-70">
            Join the Beta
          </div>
          <h2 className="serif-display text-5xl md:text-6xl lg:text-7xl font-semibold mb-8 leading-tight">
            Start Your Morning Ritual Tomorrow
          </h2>
          <p className="sans-body text-xl opacity-90 mb-12 max-w-2xl mx-auto leading-relaxed">
            Limited early access for operations practicing rotational or adaptive grazing. Priority
            given to farms with established pasture systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-5 bg-white text-[#2d2520] sans-body font-semibold rounded-full hover:bg-[#faf8f5] transition-all hover:scale-105 flex items-center justify-center gap-2 group">
              Request Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 border-2 border-white text-white sans-body font-semibold rounded-full hover:bg-white/10 transition-colors">
              Explore Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#faf8f5] border-t border-[#2d2520]/10">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8a87c] to-[#c38d5c]" />
              <span className="serif-display text-xl font-semibold">OpenPasture</span>
            </div>
            <div className="flex gap-8 sans-body text-sm text-[#2d2520]/60">
              <a href="#" className="hover:text-[#2d2520] transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-[#2d2520] transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-[#2d2520] transition-colors">
                Apache 2.0 License
              </a>
            </div>
          </div>
          <div className="mt-8 text-center sans-body text-sm text-[#2d2520]/50">
            Building the intelligence layer for regenerative grazing.
          </div>
        </div>
      </footer>
    </div>
  )
}
