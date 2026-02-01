import { Link } from '@tanstack/react-router'
import { ArrowRight, Users, Gift, Clock } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-12 bg-gradient-to-b from-[#1a2429] to-[#075056]/20" aria-labelledby="cta-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-[#FF5B04]/20 text-[#FF5B04] rounded-full mb-4">
              Limited Spots
            </span>
            <h2
              id="cta-heading"
              className="text-2xl md:text-3xl font-bold mb-3 text-[#FDF6E3] text-balance"
            >
              Join the Beta Waitlist
            </h2>
            <p className="text-base text-[#D3DBDD] text-balance">
              Limited spots available. We're onboarding farmers in waves to ensure quality support.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center text-base px-6 py-3 rounded-md bg-[#075056] hover:bg-[#FF5B04] text-[#FDF6E3] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2429]"
            >
              Request Early Access
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-2 justify-center">
              <Gift className="h-4 w-4 text-[#075056]" aria-hidden="true" />
              <span className="text-xs text-[#D3DBDD]">Free during beta</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Users className="h-4 w-4 text-[#075056]" aria-hidden="true" />
              <span className="text-xs text-[#D3DBDD]">Limited spots available</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Clock className="h-4 w-4 text-[#075056]" aria-hidden="true" />
              <span className="text-xs text-[#D3DBDD]">Priority onboarding</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
