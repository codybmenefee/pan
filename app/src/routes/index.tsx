import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import { MarketingHeader, Footer } from '@/components/marketing'
import { WindowChrome } from '@/components/ui/window-chrome'
import { PageSection } from '@/components/ui/page-section'
import { SectionDivider } from '@/components/ui/section-divider'

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <MarketingHeader />

      {/* Hero */}
      <section className="px-6 py-28 relative">
        <div className="rsc-grid-bg" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-8 rsc-fade rsc-d1">
            <span className="rsc-badge">satellite-input</span>
            <span className="font-bold text-olive">&rarr;</span>
            <span className="rsc-badge">probability-output</span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-8xl font-bold leading-[0.92] mb-8 rsc-fade rsc-d2" style={{ textWrap: 'balance' }}>
            Two Layers.<br />
            <span className="text-olive italic">One Intelligence.</span>
          </h1>

          <p className="text-lg md:text-xl max-w-3xl leading-relaxed mb-10 text-muted-foreground rsc-fade rsc-d3">
            Satellite imagery meets probability theory. Your morning brief delivers
            gradient confidence, not binary answers. All data, all reasoning, all open source.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 rsc-fade rsc-d3">
            <Link to="/demo" className="rsc-cta flex items-center gap-2 group">
              ./demo --interactive
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </Link>
            <Link to="/docs" className="rsc-cta-outline">
              cat README.md
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Hero Screenshot */}
      <PageSection bg="white">
        <WindowChrome title="openpasture -- morning-brief">
          <img src="/marketing/hero-app.png" alt="OpenPasture app showing daily grazing plan with NDVI satellite map" className="w-full" />
        </WindowChrome>
      </PageSection>

      <SectionDivider />

      {/* Beta Banner */}
      <section className="px-6 py-14 bg-white border-b-2 border-border">
        <div className="max-w-4xl mx-auto text-center">
          <span className="rsc-badge-solid mb-4 inline-block">early-access-beta</span>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ textWrap: 'balance' }}>
            join ranchers testing probability-powered grazing
          </h2>
          <p className="text-sm text-muted-foreground">
            be among the first to experience gradient intelligence. free during beta.
          </p>
        </div>
      </section>

      {/* Product Showcase 1: Morning Brief */}
      <PageSection maxWidth="7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="rsc-badge mb-6 inline-block">available-now</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              <span className="rsc-prompt">morning_brief</span><br />
              <span className="text-olive">--probability-scored</span>
            </h2>
            <p className="text-sm mb-8 leading-relaxed text-muted-foreground">
              AI analyzes satellite data overnight and delivers a recommended grazing plan
              with probability distributions and reasoning you can interrogate.
            </p>
            <ul className="space-y-3">
              {[
                'confidence scores replace yes/no',
                'probability reasoning for each suggestion',
                'override --force when conditions change',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs">
                  <span className="font-bold mt-0.5 text-olive">[x]</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <WindowChrome title="brief --daily">
            <img src="/marketing/morning-brief.png" alt="AI-powered grazing recommendation with probability reasoning" className="w-full" />
          </WindowChrome>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Product Showcase 2: NDVI Map */}
      <PageSection bg="white" maxWidth="7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <WindowChrome title="map --ndvi --pastures">
            <img src="/marketing/ndvi-map.png" alt="NDVI satellite heatmap showing pasture health across paddocks" className="w-full" />
          </WindowChrome>

          <div>
            <span className="rsc-badge mb-6 inline-block">available-now</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              see what&apos;s invisible<br /><span className="text-terracotta">from the ground</span>
            </h2>
            <p className="text-sm mb-8 leading-relaxed text-muted-foreground">
              NDVI heatmaps reveal vegetation health as probability distributions.
              Historical patterns show recovery trends as continuous fields.
            </p>
            <ul className="space-y-3">
              {[
                'probability-colored vegetation health',
                'recovery distributions over time',
                'uncertainty zones flagged early',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs">
                  <span className="font-bold mt-0.5 text-terracotta">[x]</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Product Showcase 3: Analytics */}
      <PageSection maxWidth="7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="rsc-badge mb-6 inline-block">available-now</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              track recovery<br /><span className="text-cobalt">quantify certainty</span>
            </h2>
            <p className="text-sm mb-8 leading-relaxed text-muted-foreground">
              Monitor rest periods as probability distributions. Recovery rates as data fields.
              Know not just if ready, but how confident.
            </p>
            <ul className="space-y-3">
              {[
                'real-time pasture probability tracking',
                'historical confidence trend analysis',
                'uncertainty-aware rotation planning',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs">
                  <span className="font-bold mt-0.5 text-cobalt">[x]</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <WindowChrome title="analytics --recovery --trends">
            <img src="/marketing/analytics-dashboard.png" alt="Analytics dashboard with pasture recovery, rest periods, NDVI trends, and AI partnership stats" className="w-full" />
          </WindowChrome>
        </div>
      </PageSection>

      <SectionDivider />

      {/* How It Works */}
      <PageSection bg="white" maxWidth="6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">how_it_works()</h2>
          <p className="text-sm text-muted-foreground">three steps to probability-powered grazing</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: '01', title: 'capture', desc: 'sentinel-2 delivers multispectral imagery every 5 days. discrete pixels become raw material.', color: 'text-olive' },
            { num: '02', title: 'process', desc: 'models transform point measurements into continuous probability fields. uncertainty is a feature.', color: 'text-terracotta' },
            { num: '03', title: 'harvest', desc: 'wake up to probability-scored guidance. not just where to graze but how certain we are.', color: 'text-cobalt' },
          ].map((step, idx) => (
            <div key={idx} className="rsc-card">
              <div className={`text-4xl font-bold mb-4 ${step.color}`}>{step.num}</div>
              <h3 className="text-base font-bold mb-3">{step.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Open Source */}
      <PageSection maxWidth="4xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">license: apache-2.0</h2>
          <p className="text-sm mb-12 text-muted-foreground">
            open source. open data. open development.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { label: 'open_source', desc: 'full source. self-host or use managed.' },
            { label: 'open_data', desc: 'your data stays yours. export anytime.' },
            { label: 'open_development', desc: 'public roadmap. community-driven.' },
          ].map((item, idx) => (
            <div key={idx} className="rsc-card flex gap-4 items-center text-left">
              <Check className="w-5 h-5 flex-shrink-0 text-terracotta" strokeWidth={2.5} />
              <div>
                <span className="text-sm font-bold">{item.label}</span>
                <span className="text-xs ml-3 text-muted-foreground">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* CTA */}
      <section className="px-6 py-28 bg-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-white" style={{ textWrap: 'balance' }}>
            ready to harvest<br />
            <span className="text-terracotta">probability?</span>
          </h2>
          <p className="text-sm mb-12 max-w-2xl mx-auto text-terracotta-muted">
            join the beta. start using data intelligence for adaptive grazing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/sign-in"
              className="px-10 py-4 bg-white font-bold border-2 border-white transition-all shadow-[4px_4px_0_rgba(168,58,50,0.5)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_rgba(168,58,50,0.5)] flex items-center justify-center gap-2 text-xs uppercase tracking-wider group text-dark"
            >
              ./signup --free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </Link>
            <Link
              to="/demo"
              className="px-10 py-4 bg-transparent text-white font-bold border-2 border-white/40 transition-all shadow-[4px_4px_0_rgba(168,58,50,0.25)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_rgba(168,58,50,0.25)] text-xs uppercase tracking-wider hover:border-white/70"
            >
              ./schedule --demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: LandingPage,
})
