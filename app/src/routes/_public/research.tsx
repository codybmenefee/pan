import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight, FlaskConical, Database, FileText, Users } from 'lucide-react'
import { MarketingHeader, Footer } from '@/components/marketing'
import { PageSection } from '@/components/ui/page-section'
import { SectionDivider } from '@/components/ui/section-divider'

function ResearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingHeader />

      {/* Hero */}
      <PageSection className="py-24">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            &larr; Back to main site
          </Link>

          <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Research
            <br />
            <span className="text-olive italic">Partnerships</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl">
            Collaborate with us to advance the science of regenerative grazing and validate AI-powered decision support.
          </p>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Research Opportunities */}
      <PageSection bg="white" className="py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <FlaskConical className="h-8 w-8 text-olive" />
            <h2 className="text-4xl font-bold">Research Opportunities</h2>
          </div>
          <p className="text-xl text-muted-foreground mb-12">
            We're actively seeking research partners for the following areas.
          </p>

          <div className="space-y-6">
            <div className="border-2 border-border p-8 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <h3 className="text-xl font-semibold mb-3">
                Productivity Validation Studies
              </h3>
              <p className="text-muted-foreground mb-4">
                Measure the economic and ecological outcomes of AI-optimized rotational grazing compared to conventional approaches. Key metrics include:
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>-- Pounds of beef per acre</li>
                <li>-- Forage utilization efficiency</li>
                <li>-- Grazing season length extension</li>
                <li>-- Input cost reduction</li>
              </ul>
            </div>

            <div className="border-2 border-border p-8 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <h3 className="text-xl font-semibold mb-3">
                Soil Carbon Measurement
              </h3>
              <p className="text-muted-foreground mb-4">
                Partner with us to quantify soil carbon sequestration under AI-managed adaptive grazing. We're interested in:
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>-- Baseline and longitudinal soil sampling protocols</li>
                <li>-- Carbon credit verification methodologies</li>
                <li>-- Correlation between grazing patterns and carbon outcomes</li>
              </ul>
            </div>

            <div className="border-2 border-border p-8 shadow-hard-sm hover:border-olive hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <h3 className="text-xl font-semibold mb-3">
                Animal Behavior Analytics
                <span className="rsc-badge-solid ml-3" style={{ verticalAlign: 'middle' }}>Roadmap</span>
              </h3>
              <p className="text-muted-foreground mb-4">
                GPS collar integration is on our roadmap and will open new research possibilities in livestock behavior and welfare:
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>-- Grazing distribution and preference patterns</li>
                <li>-- Response to virtual fencing cues</li>
                <li>-- Health indicators from movement data</li>
                <li>-- Optimal herd density modeling</li>
              </ul>
            </div>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Data Availability */}
      <PageSection className="py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Database className="h-8 w-8 text-cobalt" />
            <h2 className="text-4xl font-bold">Data Availability</h2>
          </div>
          <p className="text-xl text-muted-foreground mb-12">
            What data can be made available for research partnerships.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-border p-6 shadow-hard-sm">
              <h3 className="text-lg font-semibold text-olive mb-3">Available for Sharing</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>-- Anonymized satellite-derived vegetation indices</li>
                <li>-- Aggregated grazing rotation patterns</li>
                <li>-- System recommendation accuracy metrics</li>
                <li>-- Weather correlation datasets</li>
              </ul>
            </div>

            <div className="border-2 border-border p-6 shadow-hard-sm">
              <h3 className="text-lg font-semibold text-terracotta mb-3">With Farmer Consent</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>-- Farm-specific time series data</li>
                <li>-- Decision feedback and outcomes</li>
                <li>-- Economic performance metrics</li>
                <li className="text-muted-foreground/60">-- GPS collar data <span className="text-cobalt text-xs">(planned)</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-2 border-border p-6 shadow-hard-sm">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">IRB & Ethics</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              We work with institutional review boards and follow ethical data sharing practices. All farmer data is shared only with explicit consent, and we support researchers in meeting their institutional requirements.
            </p>
          </div>
        </div>
      </PageSection>

      <SectionDivider />

      {/* Contact for Research */}
      <PageSection bg="white" className="py-24">
        <div className="max-w-3xl mx-auto text-center">
          <Users className="h-12 w-12 text-olive mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">
            Start a Research Partnership
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            We're actively seeking collaborators from universities, research institutions, and agricultural organizations.
          </p>

          <div className="border-2 border-border p-8 mb-8 shadow-hard-sm">
            <h3 className="font-semibold mb-4">Ideal Partners</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="text-olive font-medium mb-1">Universities</p>
                <p>Agricultural science, ecology, and data science departments</p>
              </div>
              <div>
                <p className="text-olive font-medium mb-1">Extension Services</p>
                <p>On-the-ground validation with producer networks</p>
              </div>
              <div>
                <p className="text-olive font-medium mb-1">NGOs</p>
                <p>Regenerative agriculture and carbon markets focus</p>
              </div>
            </div>
          </div>

          <Button
            variant="brutalist"
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={() => window.location.href = 'mailto:research@example.com'}
          >
            Contact Research Team
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-sm text-muted-foreground mt-6">
            Include your institution, research area, and proposed collaboration scope
          </p>
        </div>
      </PageSection>

      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/_public/research')({
  component: ResearchPage,
})
