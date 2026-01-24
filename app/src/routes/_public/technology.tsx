import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Satellite, Cloud, MapPin, FileText, Database, Cpu, Code, Globe } from 'lucide-react'
import { MarketingHeader, Footer } from '@/components/marketing'
import { SystemArchitectureDiagram } from '@/components/marketing/diagrams'

function TechnologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <MarketingHeader />

      {/* Hero */}
      <section className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/marketing"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to main site
            </Link>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Technology
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Deep Dive
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl">
              How we turn satellite data, weather patterns, and farmer knowledge into daily grazing decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-slate-100">Data Sources</h2>
            <p className="text-xl text-slate-400 mb-12">
              We ingest multiple data streams to build a complete picture of your land.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Satellite className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-slate-100">Sentinel-2 Imagery</h3>
                </div>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li><strong className="text-slate-300">NDVI:</strong> Normalized Difference Vegetation Index - overall plant health</li>
                  <li><strong className="text-slate-300">EVI:</strong> Enhanced Vegetation Index - corrects for atmospheric distortion</li>
                  <li><strong className="text-slate-300">NDWI:</strong> Normalized Difference Water Index - moisture stress detection</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Cloud className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-slate-100">Weather Integration</h3>
                </div>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li>Precipitation history and forecasts</li>
                  <li>Temperature and growing degree days</li>
                  <li>Evapotranspiration estimates</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-slate-100">GPS Collar Integration</h3>
                </div>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li>Animal location and movement patterns</li>
                  <li>Grazing pressure estimation</li>
                  <li>Virtual fence compatibility</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-slate-100">Farmer Input</h3>
                </div>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li>Field notes and observations</li>
                  <li>Decision feedback and corrections</li>
                  <li>Local knowledge integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-slate-100">System Architecture</h2>
            <p className="text-xl text-slate-400 mb-12">
              Three layers transform raw data into actionable recommendations.
            </p>

            <SystemArchitectureDiagram />

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Database className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-100 mb-2">Data Pipeline</h3>
                <p className="text-sm text-slate-400">
                  Automated ingestion with quality checks and gap-filling for cloudy days
                </p>
              </div>
              <div className="text-center">
                <Cpu className="h-8 w-8 text-teal-400 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-100 mb-2">Scoring Engine</h3>
                <p className="text-sm text-slate-400">
                  Multi-factor analysis considering recovery, weather, and grazing history
                </p>
              </div>
              <div className="text-center">
                <Code className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-100 mb-2">Recommendation AI</h3>
                <p className="text-sm text-slate-400">
                  Natural language explanations with confidence scores and assumptions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Points */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-slate-100">Integration Points</h2>
            <p className="text-xl text-slate-400 mb-12">
              Designed to work with your existing tools and workflows.
            </p>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Virtual Fencing Systems</h3>
                <p className="text-slate-400">
                  Export fence geometry and grazing schedules in formats compatible with major virtual fencing providers. Instructions can be pushed directly to collars.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Data Export</h3>
                <p className="text-slate-400">
                  GeoJSON for paddock boundaries, CSV for time-series data, PDF for reports. API access for custom integrations.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Farm Management Software</h3>
                <p className="text-slate-400">
                  Webhook notifications and API endpoints for integration with existing farm management platforms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Data Philosophy */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Globe className="h-12 w-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6 text-slate-100">Open Data Philosophy</h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              We believe in building on open foundations. No proprietary data lock-in.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-slate-100 mb-2">Sentinel-2</h3>
                <p className="text-sm text-slate-400">
                  Free, open satellite data from ESA's Copernicus program
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-slate-100 mb-2">Microsoft Planetary Computer</h3>
                <p className="text-sm text-slate-400">
                  Cloud-optimized access to petabytes of Earth observation data
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-slate-100 mb-2">Your Data</h3>
                <p className="text-sm text-slate-400">
                  Export everything. We don't lock you in.
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-800">
              <p className="text-sm text-slate-500">
                Data sources:{' '}
                <a
                  href="https://planetarycomputer.microsoft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  Microsoft Planetary Computer
                </a>
                {' • '}
                <a
                  href="https://sentinels.copernicus.eu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  Copernicus Sentinel-2
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
