import { createFileRoute } from '@tanstack/react-router'
import {
  MarketingHeader,
  HeroSection,
  ProblemSolution,
  EconomicProof,
  HowItWorks,
  FeaturesGrid,
  TechnologyTrust,
  SocialProof,
  CTASection,
  Footer,
} from '@/components/marketing'

function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <MarketingHeader />
      <HeroSection />
      <ProblemSolution />
      <EconomicProof />
      <HowItWorks />
      <FeaturesGrid />
      <TechnologyTrust />
      <SocialProof />
      <CTASection />
      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/_public/marketing')({
  component: MarketingPage,
})
