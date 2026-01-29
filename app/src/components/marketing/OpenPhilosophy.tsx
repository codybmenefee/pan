import { Wrench, Database, Code, Shield } from 'lucide-react'

const principles = [
  {
    icon: Code,
    title: 'Open Source Software',
    description: 'Our code is public. Inspect it, fork it, contribute to it. No black boxes.',
  },
  {
    icon: Wrench,
    title: 'Right to Repair',
    description: 'Open specs on all hardware. Fix your own equipment. No dealer lockouts.',
  },
  {
    icon: Database,
    title: 'Your Data, Your Control',
    description: 'Export everything. We never lock you in. Your farm data belongs to you.',
  },
  {
    icon: Shield,
    title: 'No Vendor Lock-in',
    description: 'Built on open satellite data and standards. Switch providers anytime.',
  },
]

export function OpenPhilosophy() {
  return (
    <section className="py-16 md:py-20 bg-[#1a2429]" aria-labelledby="open-philosophy-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              id="open-philosophy-heading"
              className="text-2xl md:text-3xl font-bold text-[#FDF6E3] text-balance mb-4"
            >
              Built Open. Because You've Had Enough of Being Locked In.
            </h2>
            <p className="text-base text-[#D3DBDD] max-w-2xl mx-auto">
              Farmers are sick of proprietary systems, dealer-only repairs, and data hostage situations.
              We're building the alternative.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {principles.map((principle, index) => {
              const Icon = principle.icon
              return (
                <div
                  key={index}
                  className="bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-5 flex items-start gap-4"
                >
                  <div className="rounded-lg bg-[#075056]/20 p-2.5 flex-shrink-0">
                    <Icon className="h-5 w-5 text-[#075056]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#FDF6E3] mb-1">
                      {principle.title}
                    </h3>
                    <p className="text-sm text-[#D3DBDD]">
                      {principle.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-[#D3DBDD]/70">
              Licensed under{' '}
              <a
                href="https://www.apache.org/licenses/LICENSE-2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#075056] hover:text-[#FF5B04] hover:underline transition-colors"
              >
                Apache License 2.0
              </a>
              {' · '}
              <a
                href="https://github.com/codybmenefee/pan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#075056] hover:text-[#FF5B04] hover:underline transition-colors"
              >
                View Source on GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
