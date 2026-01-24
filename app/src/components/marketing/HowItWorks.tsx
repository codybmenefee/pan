import { Satellite, Brain, FileText, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: Satellite,
    title: 'Satellite Data',
    description: 'We analyze Sentinel-2 imagery daily to measure vegetation health (NDVI) across your farm',
  },
  {
    icon: Brain,
    title: 'Intelligence Layer',
    description: 'Our system scores each paddock and generates a recommended grazing plan with confidence scores',
  },
  {
    icon: FileText,
    title: 'Your Morning Brief',
    description: 'Receive a plain-language report each morning with today\'s recommended action and reasoning',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-slate-100">
            How It Works
          </h2>
          <p className="text-xl text-slate-400 text-center mb-16">
            Three simple steps from satellite data to your daily grazing decision
          </p>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-5 h-full hover:border-slate-700 transition-colors">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-emerald-500/10 p-5">
                        <Icon className="h-9 w-9 text-emerald-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-100">{step.title}</h3>
                    <p className="text-slate-400">{step.description}</p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 z-10">
                      <ArrowRight className="h-8 w-8 text-slate-600" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
