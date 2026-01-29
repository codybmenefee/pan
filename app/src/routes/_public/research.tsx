import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, FlaskConical, Database, FileText, Users } from 'lucide-react'
import { MarketingHeader, Footer } from '@/components/marketing'

function ResearchPage() {
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
              Research
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Partnerships
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl">
              Collaborate with us to advance the science of regenerative grazing and validate AI-powered decision support.
            </p>
          </div>
        </div>
      </section>

      {/* Research Opportunities */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <FlaskConical className="h-8 w-8 text-emerald-400" />
              <h2 className="text-4xl font-bold text-slate-100">Research Opportunities</h2>
            </div>
            <p className="text-xl text-slate-400 mb-12">
              We're actively seeking research partners for the following areas.
            </p>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-slate-100 mb-3">
                  Productivity Validation Studies
                </h3>
                <p className="text-slate-400 mb-4">
                  Measure the economic and ecological outcomes of AI-optimized rotational grazing compared to conventional approaches. Key metrics include:
                </p>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li>• Pounds of beef per acre</li>
                  <li>• Forage utilization efficiency</li>
                  <li>• Grazing season length extension</li>
                  <li>• Input cost reduction</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-slate-100 mb-3">
                  Soil Carbon Measurement
                </h3>
                <p className="text-slate-400 mb-4">
                  Partner with us to quantify soil carbon sequestration under AI-managed adaptive grazing. We're interested in:
                </p>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li>• Baseline and longitudinal soil sampling protocols</li>
                  <li>• Carbon credit verification methodologies</li>
                  <li>• Correlation between grazing patterns and carbon outcomes</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-slate-100 mb-3">
                  Animal Behavior Analytics
                  <span className="ml-2 text-xs font-normal text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Roadmap</span>
                </h3>
                <p className="text-slate-400 mb-4">
                  GPS collar integration is on our roadmap and will open new research possibilities in livestock behavior and welfare:
                </p>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li>• Grazing distribution and preference patterns</li>
                  <li>• Response to virtual fencing cues</li>
                  <li>• Health indicators from movement data</li>
                  <li>• Optimal herd density modeling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Availability */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-8 w-8 text-teal-400" />
              <h2 className="text-4xl font-bold text-slate-100">Data Availability</h2>
            </div>
            <p className="text-xl text-slate-400 mb-12">
              What data can be made available for research partnerships.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-emerald-400 mb-3">Available for Sharing</h3>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li>• Anonymized satellite-derived vegetation indices</li>
                  <li>• Aggregated grazing rotation patterns</li>
                  <li>• System recommendation accuracy metrics</li>
                  <li>• Weather correlation datasets</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-3">With Farmer Consent</h3>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li>• Farm-specific time series data</li>
                  <li>• Decision feedback and outcomes</li>
                  <li>• Economic performance metrics</li>
                  <li className="text-slate-500">• GPS collar data <span className="text-amber-400/70 text-xs">(planned)</span></li>
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-slate-900/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <h3 className="font-semibold text-slate-100">IRB & Ethics</h3>
              </div>
              <p className="text-slate-400 text-sm">
                We work with institutional review boards and follow ethical data sharing practices. All farmer data is shared only with explicit consent, and we support researchers in meeting their institutional requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact for Research */}
      <section className="py-24 bg-gradient-to-b from-slate-900/50 to-emerald-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Users className="h-12 w-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6 text-slate-100">
              Start a Research Partnership
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              We're actively seeking collaborators from universities, research institutions, and agricultural organizations.
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-8">
              <h3 className="font-semibold text-slate-100 mb-4">Ideal Partners</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-400">
                <div>
                  <p className="text-emerald-400 font-medium mb-1">Universities</p>
                  <p>Agricultural science, ecology, and data science departments</p>
                </div>
                <div>
                  <p className="text-emerald-400 font-medium mb-1">Extension Services</p>
                  <p>On-the-ground validation with producer networks</p>
                </div>
                <div>
                  <p className="text-emerald-400 font-medium mb-1">NGOs</p>
                  <p>Regenerative agriculture and carbon markets focus</p>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => window.location.href = 'mailto:research@example.com'}
            >
              Contact Research Team
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-sm text-slate-500 mt-6">
              Include your institution, research area, and proposed collaboration scope
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/_public/research')({
  component: ResearchPage,
})
