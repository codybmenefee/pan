import { createFileRoute, Link } from '@tanstack/react-router'
import { Satellite, Cloud, MapPin, FileText, Database, Cpu, Code, Globe, Brain, RefreshCw, Layers, Plus } from 'lucide-react'
import { MarketingHeader, Footer } from '@/components/marketing'
import { SystemArchitectureDiagram } from '@/components/marketing/diagrams'
import { PageSection } from '@/components/ui/page-section'
import { SectionDivider } from '@/components/ui/section-divider'

function TechnologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingHeader />

      {/* Hero */}
      <PageSection className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            &larr; Back to main site
          </Link>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Technology
            <br />
            <span className="text-olive italic">Deep Dive</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            How we turn satellite data, weather patterns, and farmer knowledge into daily grazing decisions.
          </p>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Data Sources */}
      <PageSection bg="white" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Data Sources</h2>
          <p className="text-lg text-muted-foreground mb-10">
            We ingest multiple data streams to build a complete picture of your land.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-2 border-border p-5 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <Satellite className="h-5 w-5 text-olive" />
                <h3 className="text-base font-semibold">Satellite Imagery</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-2">
                Multiple providers from free to commercial-grade resolution:
              </p>
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li><strong className="text-foreground">NDVI:</strong> Vegetation health and biomass estimation</li>
                <li><strong className="text-foreground">EVI:</strong> Enhanced index for dense canopy areas</li>
                <li><strong className="text-foreground">NDWI:</strong> Moisture stress and water content</li>
              </ul>
            </div>

            <div className="border-2 border-border p-5 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <Cloud className="h-5 w-5 text-olive" />
                <h3 className="text-base font-semibold">Weather Integration</h3>
              </div>
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li>Precipitation history and forecasts</li>
                <li>Temperature and growing degree days</li>
                <li>Evapotranspiration estimates</li>
              </ul>
            </div>

            <div className="border-2 border-border p-5 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="h-5 w-5 text-olive" />
                <h3 className="text-base font-semibold">Pasture Boundaries</h3>
              </div>
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li>GeoJSON fence lines and pasture shapes</li>
                <li>Water point and infrastructure locations</li>
                <li>Exclusion zones and sensitive areas</li>
              </ul>
            </div>

            <div className="border-2 border-border p-5 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-5 w-5 text-olive" />
                <h3 className="text-base font-semibold">Farmer Input</h3>
              </div>
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li>Field notes and observations</li>
                <li>Decision feedback and corrections</li>
                <li>Local knowledge integration</li>
              </ul>
            </div>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Our Core Bet */}
      <PageSection className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-7 w-7 text-terracotta" />
            <h2 className="text-3xl md:text-4xl font-bold">Our Core Bet</h2>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            LLMs as Agricultural Reasoning Engines
          </p>

          <div className="border-2 border-border p-6 md:p-8 mb-6 shadow-hard-sm">
            <p className="text-muted-foreground mb-5">
              Traditional agricultural software required expensive custom models for every
              decision type. We took a different approach.
            </p>

            <p className="text-terracotta font-semibold text-lg mb-5">
              Modern AI models like Claude already know how to reason. They understand cause
              and effect. They can weigh tradeoffs. They can explain their thinking. They
              just need context about YOUR land.
            </p>

            <p className="text-muted-foreground mb-5">
              OpenPasture provides that context:
            </p>

            <div className="grid md:grid-cols-3 gap-3 mb-5">
              <div className="bg-olive-light p-4 border-2 border-border">
                <div className="text-olive font-bold text-sm mb-2">1. The Facts</div>
                <p className="text-muted-foreground text-sm">
                  Vegetation health, grazing history, weather patterns
                </p>
              </div>
              <div className="bg-olive-light p-4 border-2 border-border">
                <div className="text-olive font-bold text-sm mb-2">2. The Wisdom</div>
                <p className="text-muted-foreground text-sm">
                  Rotational grazing principles and how to apply them
                </p>
              </div>
              <div className="bg-olive-light p-4 border-2 border-border">
                <div className="text-olive font-bold text-sm mb-2">3. The Output Format</div>
                <p className="text-muted-foreground text-sm">
                  Exactly what shape to draw and why
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">
              The model doesn't need to "learn" agriculture from scratch. It already understands
              that plants need rest, animals need food daily, and variety in grazing promotes
              healthier pastures. We provide the specific numbers and let it reason.
            </p>

            <p className="text-olive font-medium">
              This is extensible by design. Add a new sensor? Include its readings and
              explain what they mean. The AI adapts without rebuilding anything.
            </p>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 text-sm text-olive hover:text-terracotta transition-colors"
            >
              Read the full technical architecture in our docs &rarr;
            </Link>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* System Architecture */}
      <PageSection bg="white" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">System Architecture</h2>
          <p className="text-lg text-muted-foreground mb-10">
            Three layers transform raw data into actionable recommendations.
          </p>

          <SystemArchitectureDiagram />

          <div className="mt-10 grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <Database className="h-7 w-7 text-olive mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Data Pipeline</h3>
              <p className="text-sm text-muted-foreground">
                Automated ingestion with quality checks and gap-filling for cloudy days
              </p>
            </div>
            <div className="text-center">
              <Cpu className="h-7 w-7 text-terracotta mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Scoring Engine</h3>
              <p className="text-sm text-muted-foreground">
                Multi-factor analysis considering recovery, weather, and grazing history
              </p>
            </div>
            <div className="text-center">
              <Code className="h-7 w-7 text-cobalt mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Recommendation AI</h3>
              <p className="text-sm text-muted-foreground">
                Natural language explanations with confidence scores and assumptions
              </p>
            </div>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Training Data Flywheel */}
      <PageSection className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="h-7 w-7 text-cobalt" />
            <h2 className="text-3xl md:text-4xl font-bold">Building the Training Data</h2>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            That Doesn't Exist Anywhere Else
          </p>

          <div className="border-2 border-border p-6 md:p-8 mb-6 shadow-hard-sm">
            <p className="text-cobalt font-semibold text-lg mb-5">
              The question the AI answers daily: "What would an experienced farmer do?"
            </p>

            <p className="text-muted-foreground mb-5">
              Every time a farmer modifies our suggestion, they're creating the answer key:
            </p>

            <div className="grid md:grid-cols-2 gap-3 mb-5">
              <div className="bg-olive-light p-4 border-l-4 border-cobalt">
                <div className="font-medium mb-2">The Question</div>
                <p className="text-muted-foreground text-sm">
                  Farm state on that day (vegetation health, weather, history)
                </p>
              </div>
              <div className="bg-olive-light p-4 border-l-4 border-olive">
                <div className="font-medium mb-2">The Answer</div>
                <p className="text-muted-foreground text-sm">
                  What the experienced farmer actually chose
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">
              This training data doesn't exist anywhere else. No academic dataset captures
              daily grazing decisions at scale. No research institution has thousands of
              farmer corrections paired with satellite observations.
            </p>

            <p className="text-terracotta font-semibold text-lg mb-4">
              We're building it. One decision at a time. Across thousands of farms.
            </p>

            <p className="text-muted-foreground">
              Over time, the model learns to think like <em>your</em> farmers -- mimicking their
              decision-making patterns, respecting their local knowledge, adapting to
              conditions they understand but satellites can't see.
            </p>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 text-sm text-olive hover:text-terracotta transition-colors"
            >
              Learn more about our training data approach in the docs &rarr;
            </Link>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* The Foundation */}
      <PageSection bg="white" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="h-7 w-7 text-olive" />
            <h2 className="text-3xl md:text-4xl font-bold">The Foundation</h2>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            The architecture that makes everything else possible.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-2 border-border p-5 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <div className="text-olive font-bold text-xs uppercase tracking-wider mb-3">Today</div>
              <h3 className="text-lg font-semibold mb-3">
                Satellite-Based Intelligence
              </h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Multi-source satellite imagery pipeline:
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-olive mt-0.5 font-bold">--</span>
                  <span>Vegetation indices (NDVI, EVI, NDWI) for pasture health</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-olive mt-0.5 font-bold">--</span>
                  <span>Resolution options from 10m (free) to sub-meter (premium)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-olive mt-0.5 font-bold">--</span>
                  <span>The data pipeline that makes everything else possible</span>
                </li>
              </ul>
            </div>

            <div className="border-2 border-olive/50 p-5 bg-olive-light shadow-hard-sm hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <div className="text-terracotta font-bold text-xs uppercase tracking-wider mb-3">Growing Smarter</div>
              <h3 className="text-lg font-semibold mb-3">
                Each Data Layer Improves Decisions
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Plus className="h-4 w-4 text-terracotta mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Forage Height Sensors</div>
                    <div className="text-muted-foreground text-sm">Ground-truth validation of satellite estimates</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Plus className="h-4 w-4 text-terracotta mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Soil Moisture</div>
                    <div className="text-muted-foreground text-sm">Better recovery predictions</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Plus className="h-4 w-4 text-terracotta mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">GPS Collars</div>
                    <div className="text-muted-foreground text-sm">Animal behavior insights</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="font-medium">
              The same AI architecture, fed richer data, making better decisions.
            </p>
            <p className="text-olive text-sm mt-2">
              No rebuilding. No retraining from scratch. Just more context.
            </p>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Integration Points */}
      <PageSection className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Integration Points</h2>
          <p className="text-lg text-muted-foreground mb-10">
            Designed to work with your existing tools and workflows.
          </p>

          <div className="space-y-4">
            <div className="border-2 border-border p-5 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <h3 className="text-base font-semibold mb-2">Virtual Fencing Systems</h3>
              <p className="text-muted-foreground text-sm">
                Export fence geometry and grazing schedules in formats compatible with major virtual fencing providers. Instructions can be pushed directly to collars.
              </p>
            </div>

            <div className="border-2 border-border p-5 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <h3 className="text-base font-semibold mb-2">Data Export</h3>
              <p className="text-muted-foreground text-sm">
                GeoJSON for pasture boundaries, CSV for time-series data, PDF for reports. API access for custom integrations.
              </p>
            </div>

            <div className="border-2 border-border p-5 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <h3 className="text-base font-semibold mb-2">Farm Management Software</h3>
              <p className="text-muted-foreground text-sm">
                Webhook notifications and API endpoints for integration with existing farm management platforms.
              </p>
            </div>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Data Advantage */}
      <PageSection bg="white" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">The Data Advantage</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Why this compounds over time.
          </p>

          <div className="border-2 border-border p-6 md:p-8 mb-6 shadow-hard-sm">
            <div className="mb-4 pb-4 border-b-2 border-border">
              <span className="rsc-badge-solid">
                Beta Users Drive This
              </span>
            </div>

            <p className="text-terracotta font-semibold text-lg mb-4">
              Beta users are creating the training data that makes this work.
            </p>

            <p className="text-muted-foreground mb-4">
              When a farmer modifies our suggestion, they're creating the answer key: here's
              the farm state, and here's what an experienced farmer actually chose. No academic
              dataset captures this. No competitor has thousands of these decisions paired with
              satellite observations.
            </p>

            <p className="text-muted-foreground mb-4">
              Every correction improves recommendations for all farmers. This creates a flywheel:
              more farmers &rarr; more corrections &rarr; better recommendations &rarr; more farmers. Over time,
              the model learns to think like experienced farmers -- mimicking their patterns,
              respecting local knowledge, adapting to conditions satellites can't see.
            </p>

            <p className="text-olive font-medium">
              The data advantage is insurmountable once it's established. And we're building it first.
            </p>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Built Open */}
      <PageSection className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Globe className="h-10 w-10 text-olive mx-auto mb-5" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Built Open</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            We believe farmers should own their tools. No proprietary lock-in. No dealer-only repairs.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Open Source Software', desc: 'Our code is public. Inspect it, fork it, contribute to it.' },
              { title: 'Open Satellite Data', desc: 'Free tier powered by ESA Copernicus -- no vendor lock-in.' },
              { title: 'Open Hardware Specs', desc: 'Right to repair. Build, modify, and fix your own equipment.' },
              { title: 'Your Data', desc: 'Export everything. Your farm data belongs to you.' },
            ].map((item, idx) => (
              <div key={idx} className="border-2 border-border p-5 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-left">
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t-2 border-border">
            <p className="text-sm text-muted-foreground">
              Licensed under{' '}
              <a
                href="https://www.apache.org/licenses/LICENSE-2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-olive hover:text-terracotta hover:underline transition-colors"
              >
                Apache License 2.0
              </a>
              {' -- Free tier data from '}
              <a
                href="https://planetarycomputer.microsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-olive hover:text-terracotta hover:underline transition-colors"
              >
                Microsoft Planetary Computer
              </a>
              {' & '}
              <a
                href="https://sentinels.copernicus.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-olive hover:text-terracotta hover:underline transition-colors"
              >
                ESA Copernicus
              </a>
            </p>
          </div>
        </div>
      </PageSection>

      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/_public/technology')({
  component: TechnologyPage,
})
