import { Brain, MessageSquare, Gift, Star } from 'lucide-react'

const benefits = [
  {
    icon: Brain,
    title: 'Help Train the AI',
    description: 'Your corrections make it smarter for everyone. Every adjustment teaches the system what experienced farmers would do.',
  },
  {
    icon: MessageSquare,
    title: 'Shape the Product',
    description: 'Direct input on what gets built next. Beta users have a direct line to influence development priorities.',
  },
  {
    icon: Gift,
    title: 'Free Access',
    description: 'Full features, no cost during beta. Experience everything OpenPasture offers while helping us improve.',
  },
  {
    icon: Star,
    title: 'Early Adopter Status',
    description: 'First access when new features launch. Be among the first to try new capabilities as we release them.',
  },
]

export function BetaValueProp() {
  return (
    <section className="py-12 md:py-16 bg-[#111719]" aria-labelledby="beta-value-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-[#FF5B04]/20 text-[#FF5B04] rounded-full mb-4">
              Beta Program
            </span>
            <h2
              id="beta-value-heading"
              className="text-2xl md:text-3xl font-bold text-[#FDF6E3] text-balance mb-3"
            >
              Why Beta Users Matter
            </h2>
            <p className="text-base text-[#D3DBDD] max-w-xl mx-auto">
              You're not just getting early access—you're helping build something that will work for farmers everywhere.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div
                  key={index}
                  className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5 hover:border-[#075056]/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-[#075056]/20">
                      <Icon className="h-5 w-5 text-[#075056]" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#FDF6E3] mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-[#D3DBDD]">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
