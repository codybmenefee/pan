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
      <div className="border-2 border-border p-4 shadow-hard-sm">
        <h3 className="text-sm font-semibold mb-4 text-center">
          Technology Convergence
        </h3>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-olive" />

          <div className="space-y-3">
            {technologies.map((tech, index) => {
              const Icon = tech.icon
              return (
                <div key={index} className="relative flex items-center gap-4 pl-10">
                  {/* Circle on timeline */}
                  <div className={`absolute left-2.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    tech.highlight
                      ? 'bg-terracotta border-2 border-terracotta'
                      : 'bg-white border-2 border-olive'
                  }`}>
                    {tech.highlight ? (
                      <Sparkles className="h-2 w-2 text-white" />
                    ) : (
                      <Check className="h-2 w-2 text-olive" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 flex items-center justify-between p-2.5 ${
                    tech.highlight
                      ? 'bg-terracotta/10 border-2 border-terracotta/30'
                      : 'bg-olive-light border border-border'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${tech.highlight ? 'text-terracotta' : 'text-olive'}`} />
                      <span className={`text-xs ${tech.highlight ? 'font-medium' : ''}`}>
                        {tech.label}
                      </span>
                    </div>
                    <span className={`text-[10px] ${tech.highlight ? 'text-terracotta' : 'text-muted-foreground'}`}>
                      {tech.year}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t-2 border-border text-center">
          <p className="text-xs">
            These existed separately.{' '}
            <span className="text-terracotta font-semibold">The AI made them one system.</span>
          </p>
        </div>

        {/* Expandable detail */}
        <details className="mt-3">
          <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-center">
            Why 2022 changed everything
          </summary>
          <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground space-y-1.5">
            <p>
              Before LLMs, you'd need a custom model for each farm's unique conditions -- prohibitively expensive.
            </p>
            <p>
              <span className="text-foreground">Modern LLMs already know how to reason.</span>{' '}
              They weigh tradeoffs, understand cause and effect, and can follow complex instructions.
              We just tell them about your land.
            </p>
          </div>
        </details>
      </div>
    </div>
  )
}
