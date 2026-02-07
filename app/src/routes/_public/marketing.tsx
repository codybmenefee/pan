import { createFileRoute } from '@tanstack/react-router'
import {
  MarketingHeader,
  HeroSection,
  ProductShowcase,
  HowItWorks,
  VisionRoadmap,
  OpenPhilosophy,
  VirtualFencingDifferentiator,
  CTASection,
  Footer,
  BetaValueProp,
} from '@/components/marketing'

function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a2429] text-[#FDF6E3]">
      <MarketingHeader />
      <HeroSection />
      <BetaValueProp />

      {/* Product Showcase: Daily Brief */}
      <ProductShowcase
        title="Your Morning Decision, Made Simple"
        description="AI analyzes satellite data overnight and delivers a recommended grazing plan with confidence scores and reasoning."
        bullets={[
          'Wake up to a clear recommendation for today',
          'Understand the "why" behind each suggestion',
          'Override with one tap when conditions change',
        ]}
        screenshotSrc="/marketing/daily-brief.png"
        screenshotAlt="Daily Brief panel showing AI-recommended pasture with confidence score and reasoning"
        badge="Available now"
      />

      {/* Product Showcase: Satellite Intelligence */}
      <ProductShowcase
        title="See What's Invisible from the Ground"
        description="NDVI heatmaps reveal vegetation health across your entire operation. Historical patterns show recovery trends you can't observe manually."
        bullets={[
          'Color-coded vegetation health at a glance',
          'Track recovery patterns over time',
          'Identify problem areas before they spread',
        ]}
        screenshotSrc="/marketing/ndvi-map.png"
        screenshotAlt="Map showing NDVI vegetation health overlay with grazing paddocks highlighted"
        reverse
        badge="Available now"
      />

      {/* Product Showcase: Analytics Dashboard */}
      <ProductShowcase
        title="Track Recovery, Optimize Timing"
        description="Monitor rest periods, recovery rates, and AI approval trends. Identify which pastures are thriving and which need attention."
        bullets={[
          'Real-time pasture status tracking',
          'Historical grazing patterns and recovery',
          'Data-driven insights for better rotation',
        ]}
        screenshotSrc="/marketing/paddock-status.png"
        screenshotAlt="Analytics dashboard showing pasture metrics and recovery tracking"
        badge="Available now"
      />

      <HowItWorks />
      <VirtualFencingDifferentiator />
      <VisionRoadmap />
      <OpenPhilosophy />
      <CTASection />
      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/_public/marketing')({
  component: MarketingPage,
})
