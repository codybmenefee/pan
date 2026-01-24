import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Lock, X } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-emerald-950/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
              Start Your Morning Farm Brief Today
            </h2>
            <p className="text-xl text-slate-400">
              Free to start. No credit card required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => window.location.href = '/onboarding'}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            <div className="flex items-center gap-3 justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-slate-400">No credit card required</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <X className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-slate-400">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Lock className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-slate-400">Data stays private</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
