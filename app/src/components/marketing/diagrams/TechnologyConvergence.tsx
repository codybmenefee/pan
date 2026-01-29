import { Satellite, MapPin, Cpu, Brain, Check, Sparkles } from 'lucide-react'

const technologies = [
  {
    icon: Satellite,
    label: 'Daily satellite observation',
    year: '2015+',
    highlight: false,
  },
  {
    icon: MapPin,
    label: 'GPS-enabled animal tracking',
    year: '2018+',
    highlight: false,
  },
  {
    icon: Cpu,
    label: 'Cheap sensors & cloud',
    year: '2020+',
    highlight: false,
  },
  {
    icon: Brain,
    label: 'LLMs that can reason & draw',
    year: '2022+',
    highlight: true,
  },
]

export function TechnologyConvergence() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-[#111719]/60 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-4">
        <h3 className="text-sm font-semibold text-[#FDF6E3] mb-4 text-center">
          Technology Convergence
        </h3>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#075056]/50 via-[#075056] to-[#FF5B04]" />

          <div className="space-y-3">
            {technologies.map((tech, index) => {
              const Icon = tech.icon
              return (
                <div key={index} className="relative flex items-center gap-4 pl-10">
                  {/* Circle on timeline */}
                  <div className={`absolute left-2.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    tech.highlight
                      ? 'bg-[#FF5B04] border-2 border-[#FF5B04]'
                      : 'bg-[#1a2429] border-2 border-[#075056]'
                  }`}>
                    {tech.highlight ? (
                      <Sparkles className="h-2 w-2 text-white" />
                    ) : (
                      <Check className="h-2 w-2 text-[#075056]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 flex items-center justify-between rounded-md p-2.5 ${
                    tech.highlight
                      ? 'bg-[#FF5B04]/10 border border-[#FF5B04]/30'
                      : 'bg-[#1a2429]/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${tech.highlight ? 'text-[#FF5B04]' : 'text-[#075056]'}`} />
                      <span className={`text-xs ${tech.highlight ? 'text-[#FDF6E3] font-medium' : 'text-[#FDF6E3]/90'}`}>
                        {tech.label}
                      </span>
                    </div>
                    <span className={`text-[10px] ${tech.highlight ? 'text-[#FF5B04]' : 'text-[#D3DBDD]/70'}`}>
                      {tech.year}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#075056]/30 text-center">
          <p className="text-xs text-[#FDF6E3]/90">
            These existed separately.{' '}
            <span className="text-[#FF5B04] font-semibold">The AI made them one system.</span>
          </p>
        </div>

        {/* Expandable detail */}
        <details className="mt-3">
          <summary className="text-[10px] text-[#D3DBDD]/70 cursor-pointer hover:text-[#D3DBDD] transition-colors text-center">
            Why 2022 changed everything
          </summary>
          <div className="mt-2 pt-2 border-t border-[#075056]/20 text-[10px] text-[#D3DBDD]/70 space-y-1.5">
            <p>
              Before LLMs, you'd need a custom model for each farm's unique conditions—prohibitively expensive.
            </p>
            <p>
              <span className="text-[#FDF6E3]/90">Modern LLMs already know how to reason.</span>{' '}
              They weigh tradeoffs, understand cause and effect, and can follow complex instructions.
              We just tell them about your land.
            </p>
          </div>
        </details>
      </div>
    </div>
  )
}
