import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'

export function HeroSection() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-teal-950/20 pointer-events-none" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-50">
            Your Land Knows When It's Ready.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Now You Will Too.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AI watches your pastures daily so you can focus on what matters. Get recommendations that learn from your land.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => window.location.href = '/onboarding'}
            >
              Start Your Free Brief
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 h-auto border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              onClick={scrollToHowItWorks}
            >
              <Play className="mr-2 h-5 w-5" />
              See How It Works
            </Button>
          </div>

          <div className="pt-8 text-sm text-slate-500">
            <p>No credit card required • Free to start • Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  )
}
