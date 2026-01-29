import { Satellite, Brain, FileText } from 'lucide-react'

const steps = [
  {
    icon: Satellite,
    title: 'Observe',
    description: 'Satellite imagery shows vegetation health across your whole operation—patterns you can\'t see from the ground.',
  },
  {
    icon: Brain,
    title: 'Analyze',
    description: 'AI weighs recovery time, forage quality, weather forecast, and your grazing history to find the best option.',
  },
  {
    icon: FileText,
    title: 'Recommend',
    description: 'Wake up to a clear recommendation: where to graze today, why it\'s the best choice, and when to move next.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-20 bg-[#1a2429]" aria-labelledby="how-it-works-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2
              id="how-it-works-heading"
              className="text-2xl md:text-3xl font-bold text-[#FDF6E3] text-balance"
            >
              Your Farm's Daily Playbook
            </h2>
            <p className="text-base text-[#D3DBDD] mt-3 max-w-xl mx-auto">
              The decision-making brain behind your rotation.
            </p>
          </div>

          {/* Horizontal timeline */}
          <div className="relative">
            {/* Connecting line - hidden on mobile */}
            <div
              className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#075056]/50 via-[#075056]/30 to-[#075056]/50"
              aria-hidden="true"
            />

            <ol className="grid md:grid-cols-3 gap-8 list-none">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={index} className="relative text-center">
                    {/* Step number badge */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="rounded-full bg-[#111719] border-2 border-[#075056]/50 p-3">
                          <Icon className="h-5 w-5 text-[#075056]" aria-hidden="true" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#075056] rounded-full text-xs font-bold text-[#FDF6E3] flex items-center justify-center">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-[#FDF6E3] mb-2">{step.title}</h3>
                    <p className="text-sm text-[#D3DBDD]">{step.description}</p>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
