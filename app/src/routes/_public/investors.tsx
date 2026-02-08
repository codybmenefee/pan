import { createFileRoute, Link } from '@tanstack/react-router'
import { Factory, Leaf, TrendingUp, Users, Globe, RefreshCw, Lock } from 'lucide-react'
import { MarketingHeader, Footer } from '@/components/marketing'
import {
  DecisionScaleDiagram,
  SystemArchitectureDiagram,
  TechnologyConvergence,
} from '@/components/marketing/diagrams'
import { PageSection } from '@/components/ui/page-section'
import { SectionDivider } from '@/components/ui/section-divider'

function InvestorsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingHeader />

      {/* Hero: The Thesis */}
      <section className="min-h-[50vh] flex items-center justify-center relative">
        <div className="rsc-grid-bg" />
        <div className="container mx-auto px-4 py-10 text-center relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            &larr; Back to main site
          </Link>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            The Thesis
          </h1>

          <p className="text-xl md:text-2xl font-light text-muted-foreground mb-4">
            Pasture farming works. It just couldn't scale.
          </p>

          <p className="text-xl md:text-2xl font-light text-terracotta mb-6">
            Until now.
          </p>

          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            How AI-automated decision-making unlocks industrial-scale output from regenerative methods --
            and why this is the inflection point for sustainable livestock.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* The Problem */}
      <PageSection bg="white" className="py-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            The Problem: Decisions Don't Scale
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Adaptive grazing requires constant decision-making. As operations grow, complexity explodes.
          </p>

          <DecisionScaleDiagram />

          <div className="mt-6 text-center">
            <p className="text-sm">
              The limiting factor isn't land, livestock, or biology.
            </p>
            <p className="text-base text-terracotta font-semibold mt-1">
              It's human bandwidth for decisions.
            </p>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* AI Breakthrough */}
      <PageSection className="py-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            The AI Breakthrough (2022-2024)
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Why this wasn't possible before -- and why it is now.
          </p>

          <div className="border-2 border-border p-5 mb-6 shadow-hard-sm">
            <p className="text-sm mb-4">
              Before large language models, automating grazing decisions required building
              a custom mathematical model for every farm -- capturing every variable, every
              interaction, every edge case. That's prohibitively expensive for each
              operation's unique conditions.
            </p>

            <p className="text-sm text-terracotta font-semibold mb-4">
              The insight: Modern LLMs already know how to reason.
            </p>

            <p className="text-sm mb-4">
              They understand cause and effect, weigh tradeoffs, and explain their thinking.
              They just need context about <em>your</em> land.
            </p>

            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Our Architecture</h4>
              <div className="grid gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-olive font-bold text-xs">1.</span>
                  <div>
                    <span className="text-sm font-medium">Data Pipeline</span>
                    <span className="text-sm text-muted-foreground"> &rarr; Gather the facts (satellite, weather, history)</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-olive font-bold text-xs">2.</span>
                  <div>
                    <span className="text-sm font-medium">Encoded Wisdom</span>
                    <span className="text-sm text-muted-foreground"> &rarr; Explain grazing principles in the prompt</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-olive font-bold text-xs">3.</span>
                  <div>
                    <span className="text-sm font-medium">Structured Output</span>
                    <span className="text-sm text-muted-foreground"> &rarr; Let the model draw a polygon and justify its choice</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This became possible in 2022. It became <em>practical</em> with 2024's frontier models.
            </p>
          </div>

          <div className="mt-6">
            <TechnologyConvergence />
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/technology"
              className="text-sm text-olive hover:text-terracotta transition-colors"
            >
              Deep dive: How LLMs became agricultural reasoning engines &rarr;
            </Link>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* The System */}
      <PageSection bg="white" className="py-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            The System: Three Layers
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            A complete stack from raw data to actionable recommendations.
          </p>

          <SystemArchitectureDiagram />
        </div>
      </PageSection>

      <SectionDivider />

      {/* Industrial Scale */}
      <PageSection className="py-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Industrial Scale, Biological Methods
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            A new paradigm for livestock production.
          </p>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="border-2 border-border p-4 text-left shadow-hard-sm">
              <div className="flex items-center gap-2 mb-2">
                <Factory className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Feedlots</h3>
              </div>
              <p className="text-muted-foreground text-xs mb-2">Scale by <em>removing</em> decisions</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>-- Standardized inputs</li>
                <li>-- Controlled environment</li>
                <li>-- External inputs required</li>
              </ul>
            </div>

            <div className="border-2 border-olive/50 p-4 text-left bg-olive-light shadow-hard-sm">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-4 w-4 text-olive" />
                <h3 className="text-sm font-semibold">This System</h3>
              </div>
              <p className="text-terracotta text-xs mb-2">Scale by <em>automating</em> decisions</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>-- Biological complexity preserved</li>
                <li>-- Natural ecosystem services</li>
                <li>-- Regenerative outcomes</li>
              </ul>
            </div>
          </div>

          <p className="text-sm mt-6 font-medium">
            Industrial-level output without industrial tradeoffs.
          </p>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Market Opportunity */}
      <PageSection bg="white" className="py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <TrendingUp className="h-5 w-5 text-terracotta" />
            <h2 className="text-2xl md:text-3xl font-bold">
              The Market Opportunity
            </h2>
          </div>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Regenerative grazing is growing. The tools to scale it are not.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { value: '654M', label: 'Acres of US grazing land' },
              { value: '~880K', label: 'Grazing livestock operations in the US' },
              { value: '$9.4B', label: 'Global precision livestock market by 2027' },
            ].map((stat, idx) => (
              <div key={idx} className="border-2 border-border p-4 text-center shadow-hard-sm">
                <div className="text-2xl font-bold text-terracotta mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="border-2 border-border p-5 shadow-hard-sm">
            <p className="text-sm text-muted-foreground mb-3">
              The shift toward regenerative practices is accelerating -- driven by consumer demand,
              carbon credit markets, and recognition that industrial methods have hidden costs.
              But adoption is bottlenecked by the complexity of managing adaptive systems.
            </p>
            <p className="text-sm text-terracotta font-medium mb-3">
              We remove that bottleneck.
            </p>
            <div className="pt-3 border-t-2 border-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-olive font-semibold">Currently in beta</span> with early adopter farmers -- building the training data flywheel now.
              </p>
            </div>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Platform Vision */}
      <PageSection className="py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <Globe className="h-5 w-5 text-olive" />
            <h2 className="text-2xl md:text-3xl font-bold">
              The Platform Vision
            </h2>
          </div>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Not just software. An integrated stack for regenerative livestock at scale.
          </p>

          <div className="border-2 border-border p-5 mb-4 shadow-hard-sm">
            <p className="text-sm font-medium mb-4">
              We're building what John Deere built for industrial farming -- but for rotational grazing.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-semibold text-olive uppercase tracking-wider mb-2">Software</div>
                <p className="text-xs text-muted-foreground">
                  Decision intelligence, analytics, and automation platform
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-olive uppercase tracking-wider mb-2">Sensors</div>
                <p className="text-xs text-muted-foreground">
                  Integration with satellite, collar, soil, and forage measurement systems
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-olive uppercase tracking-wider mb-2">Open Specs</div>
                <p className="text-xs text-muted-foreground">
                  Hardware specifications you can build, repair, and modify yourself
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Open source software. Open hardware specs. Farmer-owned data.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              The opposite of vendor lock-in. The foundation for an ecosystem.
            </p>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* The Moat */}
      <PageSection bg="white" className="py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <Lock className="h-5 w-5 text-cobalt" />
            <h2 className="text-2xl md:text-3xl font-bold">
              The Moat
            </h2>
          </div>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Why this compounds over time.
          </p>

          <div className="space-y-4">
            <div className="border-2 border-border p-5 shadow-hard-sm">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-cobalt mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold mb-2">The Data Flywheel</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Every farmer interaction creates training data that doesn't exist anywhere else.
                    No academic dataset captures daily grazing decisions at scale. No competitor
                    has thousands of farmer corrections paired with satellite observations.
                  </p>
                  <p className="text-xs text-terracotta font-medium">
                    We're building it. One decision at a time. Across thousands of farms.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-border p-5 shadow-hard-sm">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-olive mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold mb-2">Community Trust Through Openness</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Farmers have been burned by proprietary systems and data lock-in.
                    Our open source approach builds trust that translates to adoption and retention.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The more farmers on the platform, the better the recommendations for everyone.
                    Network effects through shared learning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Get Involved */}
      <PageSection className="py-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Learn More
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Explore the technology, see it in action, or reach out directly.
          </p>

          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <Link
              to="/technology"
              className="border-2 border-border p-4 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all block"
            >
              <h3 className="text-sm font-semibold mb-1">Technology Deep Dive</h3>
              <p className="text-xs text-muted-foreground">
                How the system works
              </p>
            </Link>

            <Link
              to="/research"
              className="border-2 border-border p-4 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all block"
            >
              <h3 className="text-sm font-semibold mb-1">Research Partnerships</h3>
              <p className="text-xs text-muted-foreground">
                Validate outcomes with us
              </p>
            </Link>

            <Link
              to="/sign-in"
              className="border-2 border-border p-4 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all block"
            >
              <h3 className="text-sm font-semibold mb-1">Try It Free</h3>
              <p className="text-xs text-muted-foreground">
                See it working today
              </p>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            For partnership inquiries:{' '}
            <a href="mailto:hello@openpasture.io" className="text-olive hover:text-terracotta transition-colors">
              hello@openpasture.io
            </a>
          </p>
        </div>
      </PageSection>

      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/_public/investors')({
  component: InvestorsPage,
})
