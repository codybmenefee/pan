import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Satellite, Cloud, MapPin, FileText, Database, Cpu, Code, Globe, Brain, RefreshCw, Layers, Plus } from 'lucide-react'
import { MarketingHeader, Footer } from '@/components/marketing'
import { SystemArchitectureDiagram } from '@/components/marketing/diagrams'

function TechnologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a2429] text-[#FDF6E3]">
      <MarketingHeader />

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#1a2429] via-[#111719] to-[#1a2429]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#075056]/20 via-transparent to-[#075056]/20 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/marketing"
              className="inline-flex items-center gap-2 text-sm text-[#D3DBDD] hover:text-[#FDF6E3] mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to main site
            </Link>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Technology
              <br />
              <span className="bg-gradient-to-r from-[#075056] to-[#FF5B04] bg-clip-text text-transparent">
                Deep Dive
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#D3DBDD] max-w-2xl">
              How we turn satellite data, weather patterns, and farmer knowledge into daily grazing decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-16 md:py-24 bg-[#111719]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#FDF6E3]">Data Sources</h2>
            <p className="text-lg text-[#D3DBDD] mb-10">
              We ingest multiple data streams to build a complete picture of your land.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Satellite className="h-5 w-5 text-[#075056]" />
                  <h3 className="text-base font-semibold text-[#FDF6E3]">Satellite Imagery</h3>
                </div>
                <p className="text-[#D3DBDD] text-sm mb-2">
                  Multiple providers from free to commercial-grade resolution:
                </p>
                <ul className="text-[#D3DBDD] space-y-1.5 text-sm">
                  <li><strong className="text-[#FDF6E3]/90">NDVI:</strong> Vegetation health and biomass estimation</li>
                  <li><strong className="text-[#FDF6E3]/90">EVI:</strong> Enhanced index for dense canopy areas</li>
                  <li><strong className="text-[#FDF6E3]/90">NDWI:</strong> Moisture stress and water content</li>
                </ul>
              </div>

              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Cloud className="h-5 w-5 text-[#075056]" />
                  <h3 className="text-base font-semibold text-[#FDF6E3]">Weather Integration</h3>
                </div>
                <ul className="text-[#D3DBDD] space-y-1.5 text-sm">
                  <li>Precipitation history and forecasts</li>
                  <li>Temperature and growing degree days</li>
                  <li>Evapotranspiration estimates</li>
                </ul>
              </div>

              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-[#075056]" />
                  <h3 className="text-base font-semibold text-[#FDF6E3]">Pasture Boundaries</h3>
                </div>
                <ul className="text-[#D3DBDD] space-y-1.5 text-sm">
                  <li>GeoJSON fence lines and pasture shapes</li>
                  <li>Water point and infrastructure locations</li>
                  <li>Exclusion zones and sensitive areas</li>
                </ul>
              </div>

              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-5 w-5 text-[#075056]" />
                  <h3 className="text-base font-semibold text-[#FDF6E3]">Farmer Input</h3>
                </div>
                <ul className="text-[#D3DBDD] space-y-1.5 text-sm">
                  <li>Field notes and observations</li>
                  <li>Decision feedback and corrections</li>
                  <li>Local knowledge integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Core Bet: LLMs as Agricultural Reasoning Engines */}
      <section className="py-16 md:py-24 bg-[#1a2429]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-7 w-7 text-[#FF5B04]" />
              <h2 className="text-3xl md:text-4xl font-bold text-[#FDF6E3]">Our Core Bet</h2>
            </div>
            <p className="text-lg text-[#D3DBDD] mb-8">
              LLMs as Agricultural Reasoning Engines
            </p>

            <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-6 md:p-8 mb-6">
              <p className="text-[#D3DBDD] mb-5">
                Traditional agricultural software required expensive custom models for every
                decision type. We took a different approach.
              </p>

              <p className="text-[#FF5B04] font-semibold text-lg mb-5">
                Modern AI models like Claude already know how to reason. They understand cause
                and effect. They can weigh tradeoffs. They can explain their thinking. They
                just need context about YOUR land.
              </p>

              <p className="text-[#D3DBDD] mb-5">
                OpenPasture provides that context:
              </p>

              <div className="grid md:grid-cols-3 gap-3 mb-5">
                <div className="bg-[#1a2429]/80 rounded-lg p-4 border border-[#075056]/20">
                  <div className="text-[#075056] font-bold text-sm mb-2">1. The Facts</div>
                  <p className="text-[#D3DBDD] text-sm">
                    Vegetation health, grazing history, weather patterns
                  </p>
                </div>
                <div className="bg-[#1a2429]/80 rounded-lg p-4 border border-[#075056]/20">
                  <div className="text-[#075056] font-bold text-sm mb-2">2. The Wisdom</div>
                  <p className="text-[#D3DBDD] text-sm">
                    Rotational grazing principles and how to apply them
                  </p>
                </div>
                <div className="bg-[#1a2429]/80 rounded-lg p-4 border border-[#075056]/20">
                  <div className="text-[#075056] font-bold text-sm mb-2">3. The Output Format</div>
                  <p className="text-[#D3DBDD] text-sm">
                    Exactly what shape to draw and why
                  </p>
                </div>
              </div>

              <p className="text-[#D3DBDD] mb-4">
                The model doesn't need to "learn" agriculture from scratch. It already understands
                that plants need rest, animals need food daily, and variety in grazing promotes
                healthier pastures. We provide the specific numbers and let it reason.
              </p>

              <p className="text-[#075056] font-medium">
                This is extensible by design. Add a new sensor? Include its readings and
                explain what they mean. The AI adapts without rebuilding anything.
              </p>
            </div>

            <div className="text-center mt-6">
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 text-sm text-[#075056] hover:text-[#FF5B04] transition-colors"
              >
                Read the full technical architecture in our docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="py-16 md:py-24 bg-[#111719]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#FDF6E3]">System Architecture</h2>
            <p className="text-lg text-[#D3DBDD] mb-10">
              Three layers transform raw data into actionable recommendations.
            </p>

            <SystemArchitectureDiagram />

            <div className="mt-10 grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <Database className="h-7 w-7 text-[#075056] mx-auto mb-3" />
                <h3 className="font-semibold text-[#FDF6E3] mb-2">Data Pipeline</h3>
                <p className="text-sm text-[#D3DBDD]">
                  Automated ingestion with quality checks and gap-filling for cloudy days
                </p>
              </div>
              <div className="text-center">
                <Cpu className="h-7 w-7 text-[#FF5B04] mx-auto mb-3" />
                <h3 className="font-semibold text-[#FDF6E3] mb-2">Scoring Engine</h3>
                <p className="text-sm text-[#D3DBDD]">
                  Multi-factor analysis considering recovery, weather, and grazing history
                </p>
              </div>
              <div className="text-center">
                <Code className="h-7 w-7 text-[#F4D47C] mx-auto mb-3" />
                <h3 className="font-semibold text-[#FDF6E3] mb-2">Recommendation AI</h3>
                <p className="text-sm text-[#D3DBDD]">
                  Natural language explanations with confidence scores and assumptions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Building the Training Data - Feedback Flywheel */}
      <section className="py-16 md:py-24 bg-[#1a2429]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="h-7 w-7 text-[#F4D47C]" />
              <h2 className="text-3xl md:text-4xl font-bold text-[#FDF6E3]">Building the Training Data</h2>
            </div>
            <p className="text-lg text-[#D3DBDD] mb-8">
              That Doesn't Exist Anywhere Else
            </p>

            <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-6 md:p-8 mb-6">
              <p className="text-[#F4D47C] font-semibold text-lg mb-5">
                The question the AI answers daily: "What would an experienced farmer do?"
              </p>

              <p className="text-[#D3DBDD] mb-5">
                Every time a farmer modifies our suggestion, they're creating the answer key:
              </p>

              <div className="grid md:grid-cols-2 gap-3 mb-5">
                <div className="bg-[#1a2429]/80 rounded-lg p-4 border-l-2 border-[#F4D47C]">
                  <div className="text-[#FDF6E3] font-medium mb-2">The Question</div>
                  <p className="text-[#D3DBDD] text-sm">
                    Farm state on that day (vegetation health, weather, history)
                  </p>
                </div>
                <div className="bg-[#1a2429]/80 rounded-lg p-4 border-l-2 border-[#075056]">
                  <div className="text-[#FDF6E3] font-medium mb-2">The Answer</div>
                  <p className="text-[#D3DBDD] text-sm">
                    What the experienced farmer actually chose
                  </p>
                </div>
              </div>

              <p className="text-[#D3DBDD] mb-4">
                This training data doesn't exist anywhere else. No academic dataset captures
                daily grazing decisions at scale. No research institution has thousands of
                farmer corrections paired with satellite observations.
              </p>

              <p className="text-[#FF5B04] font-semibold text-lg mb-4">
                We're building it. One decision at a time. Across thousands of farms.
              </p>

              <p className="text-[#D3DBDD]">
                Over time, the model learns to think like <em>your</em> farmers—mimicking their
                decision-making patterns, respecting their local knowledge, adapting to
                conditions they understand but satellites can't see.
              </p>
            </div>

            <div className="text-center mt-6">
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 text-sm text-[#075056] hover:text-[#FF5B04] transition-colors"
              >
                Learn more about our training data approach in the docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Foundation */}
      <section className="py-16 md:py-24 bg-[#111719]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="h-7 w-7 text-[#075056]" />
              <h2 className="text-3xl md:text-4xl font-bold text-[#FDF6E3]">The Foundation</h2>
            </div>
            <p className="text-lg text-[#D3DBDD] mb-8">
              The architecture that makes everything else possible.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Today */}
              <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <div className="text-[#075056] font-bold text-xs uppercase tracking-wide mb-3">Today</div>
                <h3 className="text-lg font-semibold text-[#FDF6E3] mb-3">
                  Satellite-Based Intelligence
                </h3>
                <p className="text-[#D3DBDD] mb-3 text-sm">
                  Multi-source satellite imagery pipeline:
                </p>
                <ul className="text-[#D3DBDD] space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#075056] mt-0.5">•</span>
                    <span>Vegetation indices (NDVI, EVI, NDWI) for pasture health</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#075056] mt-0.5">•</span>
                    <span>Resolution options from 10m (free) to sub-meter (premium)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#075056] mt-0.5">•</span>
                    <span>The data pipeline that makes everything else possible</span>
                  </li>
                </ul>
              </div>

              {/* Growing Smarter */}
              <div className="bg-gradient-to-br from-[#1a2429] to-[#075056]/20 border border-[#075056]/50 rounded-lg p-5">
                <div className="text-[#FF5B04] font-bold text-xs uppercase tracking-wide mb-3">Growing Smarter</div>
                <h3 className="text-lg font-semibold text-[#FDF6E3] mb-3">
                  Each Data Layer Improves Decisions
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Plus className="h-4 w-4 text-[#FF5B04] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[#FDF6E3] font-medium text-sm">Forage Height Sensors</div>
                      <div className="text-[#D3DBDD] text-sm">Ground-truth validation of satellite estimates</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Plus className="h-4 w-4 text-[#FF5B04] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[#FDF6E3] font-medium text-sm">Soil Moisture</div>
                      <div className="text-[#D3DBDD] text-sm">Better recovery predictions</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Plus className="h-4 w-4 text-[#FF5B04] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[#FDF6E3] font-medium text-sm">GPS Collars</div>
                      <div className="text-[#D3DBDD] text-sm">Animal behavior insights</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[#FDF6E3] font-medium">
                The same AI architecture, fed richer data, making better decisions.
              </p>
              <p className="text-[#075056] text-sm mt-2">
                No rebuilding. No retraining from scratch. Just more context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Points */}
      <section className="py-16 md:py-24 bg-[#1a2429]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#FDF6E3]">Integration Points</h2>
            <p className="text-lg text-[#D3DBDD] mb-10">
              Designed to work with your existing tools and workflows.
            </p>

            <div className="space-y-4">
              <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <h3 className="text-base font-semibold text-[#FDF6E3] mb-2">Virtual Fencing Systems</h3>
                <p className="text-[#D3DBDD] text-sm">
                  Export fence geometry and grazing schedules in formats compatible with major virtual fencing providers. Instructions can be pushed directly to collars.
                </p>
              </div>

              <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <h3 className="text-base font-semibold text-[#FDF6E3] mb-2">Data Export</h3>
                <p className="text-[#D3DBDD] text-sm">
                  GeoJSON for pasture boundaries, CSV for time-series data, PDF for reports. API access for custom integrations.
                </p>
              </div>

              <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <h3 className="text-base font-semibold text-[#FDF6E3] mb-2">Farm Management Software</h3>
                <p className="text-[#D3DBDD] text-sm">
                  Webhook notifications and API endpoints for integration with existing farm management platforms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Data Advantage */}
      <section className="py-16 md:py-24 bg-[#111719]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#FDF6E3]">The Data Advantage</h2>
            <p className="text-lg text-[#D3DBDD] mb-8">
              Why this compounds over time.
            </p>

            <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-6 md:p-8 mb-6">
              <div className="mb-4 pb-4 border-b border-[#075056]/20">
                <span className="inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-wide bg-[#FF5B04]/20 text-[#FF5B04] rounded-full">
                  Beta Users Drive This
                </span>
              </div>

              <p className="text-[#FF5B04] font-semibold text-lg mb-4">
                Beta users are creating the training data that makes this work.
              </p>

              <p className="text-[#D3DBDD] mb-4">
                When a farmer modifies our suggestion, they're creating the answer key: here's
                the farm state, and here's what an experienced farmer actually chose. No academic
                dataset captures this. No competitor has thousands of these decisions paired with
                satellite observations.
              </p>

              <p className="text-[#D3DBDD] mb-4">
                Every correction improves recommendations for all farmers. This creates a flywheel:
                more farmers → more corrections → better recommendations → more farmers. Over time,
                the model learns to think like experienced farmers—mimicking their patterns,
                respecting local knowledge, adapting to conditions satellites can't see.
              </p>

              <p className="text-[#075056] font-medium">
                The data advantage is insurmountable once it's established. And we're building it first.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built Open */}
      <section className="py-16 md:py-24 bg-[#1a2429]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Globe className="h-10 w-10 text-[#075056] mx-auto mb-5" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#FDF6E3]">Built Open</h2>
            <p className="text-lg text-[#D3DBDD] mb-10 max-w-2xl mx-auto">
              We believe farmers should own their tools. No proprietary lock-in. No dealer-only repairs.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <h3 className="font-semibold text-[#FDF6E3] mb-2">Open Source Software</h3>
                <p className="text-sm text-[#D3DBDD]">
                  Our code is public. Inspect it, fork it, contribute to it.
                </p>
              </div>

              <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <h3 className="font-semibold text-[#FDF6E3] mb-2">Open Satellite Data</h3>
                <p className="text-sm text-[#D3DBDD]">
                  Free tier powered by ESA Copernicus—no vendor lock-in.
                </p>
              </div>

              <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <h3 className="font-semibold text-[#FDF6E3] mb-2">Open Hardware Specs</h3>
                <p className="text-sm text-[#D3DBDD]">
                  Right to repair. Build, modify, and fix your own equipment.
                </p>
              </div>

              <div className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5">
                <h3 className="font-semibold text-[#FDF6E3] mb-2">Your Data</h3>
                <p className="text-sm text-[#D3DBDD]">
                  Export everything. Your farm data belongs to you.
                </p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-[#075056]/30">
              <p className="text-sm text-[#D3DBDD]/70">
                Licensed under{' '}
                <a
                  href="https://www.apache.org/licenses/LICENSE-2.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#075056] hover:text-[#FF5B04] hover:underline transition-colors"
                >
                  Apache License 2.0
                </a>
                {' · Free tier data from '}
                <a
                  href="https://planetarycomputer.microsoft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#075056] hover:text-[#FF5B04] hover:underline transition-colors"
                >
                  Microsoft Planetary Computer
                </a>
                {' & '}
                <a
                  href="https://sentinels.copernicus.eu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#075056] hover:text-[#FF5B04] hover:underline transition-colors"
                >
                  ESA Copernicus
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/_public/technology')({
  component: TechnologyPage,
})
