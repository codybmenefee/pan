import { Link } from '@tanstack/react-router'
import { ArrowRight, FlaskConical } from 'lucide-react'
import { ScreenshotDisplay } from './ScreenshotDisplay'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-[#1a2429] via-[#111719] to-[#1a2429]">
      {/* Subtle gradient accent */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#075056]/20 via-transparent to-[#075056]/20 pointer-events-none"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 pt-8 pb-16 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#FDF6E3] text-balance">
            Graze More on the Same Land.
            <br />
            <span className="bg-gradient-to-r from-[#075056] to-[#FF5B04] bg-clip-text text-transparent">
              Let the Grass Tell You When It's Ready.
            </span>
          </h1>

          <p className="text-base md:text-lg text-[#D3DBDD] max-w-xl mx-auto leading-relaxed text-balance">
            Satellite imagery and AI recommendations help you decide where to graze today.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
            <Link
              to="/demo"
              className="inline-flex items-center justify-center text-sm px-5 py-2.5 rounded-md bg-[#FF5B04] hover:bg-[#e54f00] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B04] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2429]"
            >
              <FlaskConical className="mr-2 h-4 w-4" aria-hidden="true" />
              Try Interactive Demo
            </Link>

            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center text-sm px-5 py-2.5 rounded-md bg-[#075056] hover:bg-[#086369] text-[#FDF6E3] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2429]"
            >
              Join the Waitlist
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Hero screenshot */}
        <div className="mt-12 max-w-5xl mx-auto">
          <ScreenshotDisplay
            src="/marketing/hero-dashboard.png"
            alt="OpenPasture dashboard showing paddock map with NDVI vegetation health overlay and daily grazing recommendations"
          />
        </div>
      </div>
    </section>
  )
}
