import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Factory, Leaf, TrendingUp, Users, Globe, RefreshCw, Lock } from 'lucide-react'
import { MarketingHeader, Footer } from '@/components/marketing'
import {
  DecisionScaleDiagram,
  SystemArchitectureDiagram,
  TechnologyConvergence,
} from '@/components/marketing/diagrams'

function InvestorsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a2429] text-[#FDF6E3]">
      <MarketingHeader />

      {/* Hero: The Thesis */}
      <section className="min-h-[50vh] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#075056]/30 via-transparent to-[#075056]/30 pointer-events-none" />
        <div className="container mx-auto px-4 py-10 text-center relative z-10">
          <Link
            to="/marketing"
            className="inline-flex items-center gap-1.5 text-xs text-[#D3DBDD] hover:text-[#FDF6E3] mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to main site
          </Link>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            The Thesis
          </h1>

          <p className="text-xl md:text-2xl font-light text-[#D3DBDD] mb-4">
            Pasture farming works. It just couldn't scale.
          </p>

          <p className="text-xl md:text-2xl font-light text-[#FF5B04] mb-6">
            Until now.
          </p>

          <p className="text-sm text-[#D3DBDD] max-w-xl mx-auto">
            How AI-automated decision-making unlocks industrial-scale output from regenerative methods—
            and why this is the inflection point for sustainable livestock.
          </p>
        </div>
      </section>

      {/* Section 2: The Problem */}
      <section className="py-10 bg-[#111719]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-[#FDF6E3]">
              The Problem: Decisions Don't Scale
            </h2>
            <p className="text-sm text-[#D3DBDD] text-center mb-6">
              Adaptive grazing requires constant decision-making. As operations grow, complexity explodes.
            </p>

            <DecisionScaleDiagram />

            <div className="mt-6 text-center">
              <p className="text-sm text-[#FDF6E3]/90">
                The limiting factor isn't land, livestock, or biology.
              </p>
              <p className="text-base text-[#FF5B04] font-semibold mt-1">
                It's human bandwidth for decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Why Now - The AI Breakthrough */}
      <section className="py-10 bg-[#1a2429]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-[#FDF6E3]">
              The AI Breakthrough (2022-2024)
            </h2>
            <p className="text-sm text-[#D3DBDD] text-center mb-6">
              Why this wasn't possible before—and why it is now.
            </p>

            <div className="bg-[#111719]/60 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5 mb-6">
              <p className="text-sm text-[#FDF6E3]/90 mb-4">
                Before large language models, automating grazing decisions required building
                a custom mathematical model for every farm—capturing every variable, every
                interaction, every edge case. That's prohibitively expensive for each
                operation's unique conditions.
              </p>

              <p className="text-sm text-[#FF5B04] font-semibold mb-4">
                The insight: Modern LLMs already know how to reason.
              </p>

              <p className="text-sm text-[#FDF6E3]/90 mb-4">
                They understand cause and effect, weigh tradeoffs, and explain their thinking.
                They just need context about <em>your</em> land.
              </p>

              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-semibold text-[#D3DBDD] uppercase tracking-wide">Our Architecture</h4>
                <div className="grid gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[#075056] font-bold text-xs">1.</span>
                    <div>
                      <span className="text-sm text-[#FDF6E3] font-medium">Data Pipeline</span>
                      <span className="text-sm text-[#D3DBDD]"> → Gather the facts (satellite, weather, history)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#075056] font-bold text-xs">2.</span>
                    <div>
                      <span className="text-sm text-[#FDF6E3] font-medium">Encoded Wisdom</span>
                      <span className="text-sm text-[#D3DBDD]"> → Explain grazing principles in the prompt</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#075056] font-bold text-xs">3.</span>
                    <div>
                      <span className="text-sm text-[#FDF6E3] font-medium">Structured Output</span>
                      <span className="text-sm text-[#D3DBDD]"> → Let the model draw a polygon and justify its choice</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[#FDF6E3]/80">
                This became possible in 2022. It became <em>practical</em> with 2024's frontier models.
              </p>
            </div>

            <div className="mt-6">
              <TechnologyConvergence />
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/technology"
                className="text-sm text-[#075056] hover:text-[#FF5B04] transition-colors"
              >
                Deep dive: How LLMs became agricultural reasoning engines →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: The System */}
      <section className="py-10 bg-[#111719]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-[#FDF6E3]">
              The System: Three Layers
            </h2>
            <p className="text-sm text-[#D3DBDD] text-center mb-6">
              A complete stack from raw data to actionable recommendations.
            </p>

            <SystemArchitectureDiagram />
          </div>
        </div>
      </section>

      {/* Section 5: Industrial Scale, Biological Methods */}
      <section className="py-10 bg-[#1a2429]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[#FDF6E3]">
              Industrial Scale, Biological Methods
            </h2>
            <p className="text-sm text-[#D3DBDD] mb-6">
              A new paradigm for livestock production.
            </p>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Factory className="h-4 w-4 text-[#D3DBDD]" />
                  <h3 className="text-sm font-semibold text-[#FDF6E3]">Feedlots</h3>
                </div>
                <p className="text-[#D3DBDD] text-xs mb-2">Scale by <em>removing</em> decisions</p>
                <ul className="text-xs text-[#D3DBDD]/70 space-y-1">
                  <li>• Standardized inputs</li>
                  <li>• Controlled environment</li>
                  <li>• External inputs required</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#111719] to-[#075056]/20 border border-[#075056]/50 rounded-lg p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="h-4 w-4 text-[#075056]" />
                  <h3 className="text-sm font-semibold text-[#FDF6E3]">This System</h3>
                </div>
                <p className="text-[#FF5B04] text-xs mb-2">Scale by <em>automating</em> decisions</p>
                <ul className="text-xs text-[#D3DBDD] space-y-1">
                  <li>• Biological complexity preserved</li>
                  <li>• Natural ecosystem services</li>
                  <li>• Regenerative outcomes</li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-[#FDF6E3]/90 mt-6 font-medium">
              Industrial-level output without industrial tradeoffs.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: The Market */}
      <section className="py-10 bg-[#111719]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4 justify-center">
              <TrendingUp className="h-5 w-5 text-[#FF5B04]" />
              <h2 className="text-2xl md:text-3xl font-bold text-[#FDF6E3]">
                The Market Opportunity
              </h2>
            </div>
            <p className="text-sm text-[#D3DBDD] text-center mb-6">
              Regenerative grazing is growing. The tools to scale it are not.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-4 text-center">
                <div className="text-2xl font-bold text-[#FF5B04] mb-1">654M</div>
                <p className="text-xs text-[#D3DBDD]">
                  Acres of US grazing land
                </p>
              </div>
              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-4 text-center">
                <div className="text-2xl font-bold text-[#FF5B04] mb-1">~880K</div>
                <p className="text-xs text-[#D3DBDD]">
                  Grazing livestock operations in the US
                </p>
              </div>
              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-4 text-center">
                <div className="text-2xl font-bold text-[#FF5B04] mb-1">$9.4B</div>
                <p className="text-xs text-[#D3DBDD]">
                  Global precision livestock market by 2027
                </p>
              </div>
            </div>

            <div className="bg-[#1a2429]/50 border border-[#075056]/20 rounded-lg p-5">
              <p className="text-sm text-[#D3DBDD] mb-3">
                The shift toward regenerative practices is accelerating—driven by consumer demand,
                carbon credit markets, and recognition that industrial methods have hidden costs.
                But adoption is bottlenecked by the complexity of managing adaptive systems.
              </p>
              <p className="text-sm text-[#FF5B04] font-medium mb-3">
                We remove that bottleneck.
              </p>
              <div className="pt-3 border-t border-[#075056]/20">
                <p className="text-xs text-[#D3DBDD]/80">
                  <span className="text-[#075056] font-semibold">Currently in beta</span> with early adopter farmers—building the training data flywheel now.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: The Platform Vision */}
      <section className="py-10 bg-[#1a2429]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4 justify-center">
              <Globe className="h-5 w-5 text-[#075056]" />
              <h2 className="text-2xl md:text-3xl font-bold text-[#FDF6E3]">
                The Platform Vision
              </h2>
            </div>
            <p className="text-sm text-[#D3DBDD] text-center mb-6">
              Not just software. An integrated stack for regenerative livestock at scale.
            </p>

            <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5 mb-4">
              <p className="text-sm text-[#FDF6E3] font-medium mb-4">
                We're building what John Deere built for industrial farming—but for rotational grazing.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-semibold text-[#075056] uppercase tracking-wide mb-2">Software</div>
                  <p className="text-xs text-[#D3DBDD]">
                    Decision intelligence, analytics, and automation platform
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#075056] uppercase tracking-wide mb-2">Sensors</div>
                  <p className="text-xs text-[#D3DBDD]">
                    Integration with satellite, collar, soil, and forage measurement systems
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#075056] uppercase tracking-wide mb-2">Open Specs</div>
                  <p className="text-xs text-[#D3DBDD]">
                    Hardware specifications you can build, repair, and modify yourself
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-[#D3DBDD]">
                Open source software. Open hardware specs. Farmer-owned data.
              </p>
              <p className="text-xs text-[#D3DBDD]/70 mt-2">
                The opposite of vendor lock-in. The foundation for an ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: The Moat */}
      <section className="py-10 bg-[#111719]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4 justify-center">
              <Lock className="h-5 w-5 text-[#F4D47C]" />
              <h2 className="text-2xl md:text-3xl font-bold text-[#FDF6E3]">
                The Moat
              </h2>
            </div>
            <p className="text-sm text-[#D3DBDD] text-center mb-6">
              Why this compounds over time.
            </p>

            <div className="space-y-4">
              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-[#F4D47C] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#FDF6E3] mb-2">The Data Flywheel</h3>
                    <p className="text-xs text-[#D3DBDD] mb-2">
                      Every farmer interaction creates training data that doesn't exist anywhere else.
                      No academic dataset captures daily grazing decisions at scale. No competitor
                      has thousands of farmer corrections paired with satellite observations.
                    </p>
                    <p className="text-xs text-[#FF5B04] font-medium">
                      We're building it. One decision at a time. Across thousands of farms.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-[#075056] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#FDF6E3] mb-2">Community Trust Through Openness</h3>
                    <p className="text-xs text-[#D3DBDD] mb-2">
                      Farmers have been burned by proprietary systems and data lock-in.
                      Our open source approach builds trust that translates to adoption and retention.
                    </p>
                    <p className="text-xs text-[#D3DBDD]">
                      The more farmers on the platform, the better the recommendations for everyone.
                      Network effects through shared learning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Get Involved */}
      <section className="py-10 bg-gradient-to-b from-[#1a2429] to-[#075056]/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[#FDF6E3]">
              Learn More
            </h2>
            <p className="text-sm text-[#D3DBDD] mb-6">
              Explore the technology, see it in action, or reach out directly.
            </p>

            <div className="grid md:grid-cols-3 gap-3 mb-6">
              <Link
                to="/technology"
                className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-4 hover:border-[#075056] transition-colors block"
              >
                <h3 className="text-sm font-semibold text-[#FDF6E3] mb-1">Technology Deep Dive</h3>
                <p className="text-xs text-[#D3DBDD]">
                  How the system works
                </p>
              </Link>

              <Link
                to="/research"
                className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-4 hover:border-[#075056] transition-colors block"
              >
                <h3 className="text-sm font-semibold text-[#FDF6E3] mb-1">Research Partnerships</h3>
                <p className="text-xs text-[#D3DBDD]">
                  Validate outcomes with us
                </p>
              </Link>

              <Link
                to="/sign-in"
                className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-4 hover:border-[#075056] transition-colors block"
              >
                <h3 className="text-sm font-semibold text-[#FDF6E3] mb-1">Try It Free</h3>
                <p className="text-xs text-[#D3DBDD]">
                  See it working today
                </p>
              </Link>
            </div>

            <p className="text-xs text-[#D3DBDD]/70">
              For partnership inquiries:{' '}
              <a href="mailto:hello@openpasture.io" className="text-[#075056] hover:text-[#FF5B04] transition-colors">
                hello@openpasture.io
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/_public/investors')({
  component: InvestorsPage,
})
