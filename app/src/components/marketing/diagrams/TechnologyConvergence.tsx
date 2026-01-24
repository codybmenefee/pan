import { Satellite, MapPin, Cpu, Brain, Check } from 'lucide-react'

const technologies = [
  {
    icon: Satellite,
    label: 'Daily satellite observation',
    year: '2015+',
  },
  {
    icon: MapPin,
    label: 'GPS-enabled animal tracking',
    year: '2018+',
  },
  {
    icon: Cpu,
    label: 'Cheap sensors & cloud',
    year: '2020+',
  },
  {
    icon: Brain,
    label: 'AI for multi-variable decisions',
    year: '2023+',
  },
]

export function TechnologyConvergence() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-slate-100 mb-8 text-center">
          Technology Convergence
        </h3>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-slate-700 via-emerald-500/50 to-emerald-500" />

          <div className="space-y-6">
            {technologies.map((tech, index) => {
              const Icon = tech.icon
              return (
                <div key={index} className="relative flex items-center gap-6 pl-14">
                  {/* Circle on timeline */}
                  <div className="absolute left-4 w-5 h-5 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex items-center justify-between bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-emerald-400" />
                      <span className="text-slate-300">{tech.label}</span>
                    </div>
                    <span className="text-sm text-slate-500">{tech.year}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-lg text-slate-300">
            These existed separately.{' '}
            <span className="text-emerald-400 font-semibold">Now they're one system.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
