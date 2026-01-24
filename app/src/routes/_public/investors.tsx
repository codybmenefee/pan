import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Factory, Leaf } from 'lucide-react'
import { MarketingHeader, Footer } from '@/components/marketing'
import {
  DecisionScaleDiagram,
  SystemArchitectureDiagram,
  TechnologyConvergence,
} from '@/components/marketing/diagrams'

function InvestorsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <MarketingHeader />

      {/* Hero: The Thesis */}
      <section className="min-h-[80vh] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-transparent to-teal-950/30 pointer-events-none" />
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <Link
            to="/marketing"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to main site
          </Link>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
            Pasture Farming Works.
            <br />
            <span className="text-slate-400">It Just Couldn't Scale.</span>
          </h1>

          <p className="text-3xl md:text-4xl font-light text-emerald-400 mb-12">
            Until now.
          </p>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            A thesis-driven look at how AI-powered decision support unlocks the economic potential of regenerative grazing.
          </p>
        </div>
      </section>

      {/* Section 2: The Problem */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-slate-100">
              The Problem: Decisions Don't Scale
            </h2>
            <p className="text-xl text-slate-400 text-center mb-12">
              Adaptive grazing requires constant decision-making. As operations grow, complexity explodes.
            </p>

            <DecisionScaleDiagram />

            <div className="mt-12 text-center">
              <p className="text-lg text-slate-300">
                The limiting factor isn't land, cattle, or biology.
              </p>
              <p className="text-xl text-emerald-400 font-semibold mt-2">
                It's human bandwidth for decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Why Now */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-slate-100">
              Why Now: Technology Convergence
            </h2>
            <p className="text-xl text-slate-400 text-center mb-12">
              Four technologies have matured simultaneously, creating a unique moment.
            </p>

            <TechnologyConvergence />
          </div>
        </div>
      </section>

      {/* Section 4: The System */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-slate-100">
              The System: Three Layers
            </h2>
            <p className="text-xl text-slate-400 text-center mb-12">
              A complete stack from raw data to actionable recommendations.
            </p>

            <SystemArchitectureDiagram />
          </div>
        </div>
      </section>

      {/* Section 5: The Economics */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
              The Economics
            </h2>
            <p className="text-xl text-slate-400 mb-12">
              Stark differences in profitability between grazing approaches.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                <p className="text-slate-400 mb-4">Continuous Grazing</p>
                <p className="text-4xl font-bold text-red-400">Baseline</p>
                <p className="text-sm text-slate-500 mt-4">
                  Overgrazing, soil degradation, declining productivity
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-700/50 rounded-xl p-8">
                <p className="text-slate-400 mb-4">AI-Optimized Rotational</p>
                <p className="text-4xl font-bold text-emerald-400">+$1,000+/acre</p>
                <p className="text-sm text-slate-400 mt-4">
                  Soil health, forage growth, longer seasons, reduced inputs
                </p>
              </div>
            </div>

            <p className="text-lg text-slate-300 mt-12 max-w-2xl mx-auto">
              The value comes from doing rotational grazing <em>well</em>—timing moves precisely, adapting to conditions, and capturing every opportunity.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Industrial Scale, Biological Methods */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
              Industrial Scale, Biological Methods
            </h2>
            <p className="text-xl text-slate-400 mb-12">
              A new paradigm for livestock production.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Factory className="h-6 w-6 text-slate-400" />
                  <h3 className="text-xl font-semibold text-slate-100">Feedlots</h3>
                </div>
                <p className="text-slate-400 mb-4">Scale by <em>removing</em> decisions</p>
                <ul className="text-sm text-slate-500 space-y-2">
                  <li>• Standardized inputs</li>
                  <li>• Controlled environment</li>
                  <li>• External inputs required</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-700/50 rounded-xl p-8 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Leaf className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-xl font-semibold text-slate-100">This System</h3>
                </div>
                <p className="text-emerald-400 mb-4">Scale by <em>automating</em> decisions</p>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li>• Biological complexity preserved</li>
                  <li>• Natural ecosystem services</li>
                  <li>• Regenerative outcomes</li>
                </ul>
              </div>
            </div>

            <p className="text-xl text-slate-300 mt-12 font-medium">
              Industrial-level output without industrial tradeoffs.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: The Ask */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-emerald-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
              Partnership Opportunities
            </h2>
            <p className="text-xl text-slate-400 mb-12">
              We're building this in partnership with aligned stakeholders.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-emerald-400 mb-3">Capital Partners</h3>
                <p className="text-sm text-slate-400">
                  Scale deployments and expand to new regions
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-emerald-400 mb-3">Research Collaborators</h3>
                <p className="text-sm text-slate-400">
                  Validate productivity gains with rigorous measurement
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-emerald-400 mb-3">Integration Partners</h3>
                <p className="text-sm text-slate-400">
                  GPS collars, satellites, and institutional data providers
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => window.location.href = 'mailto:investors@example.com'}
            >
              Get in Touch
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
