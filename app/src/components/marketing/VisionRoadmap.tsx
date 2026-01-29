import { Rocket, Bot, Cpu, Check } from 'lucide-react'

const stages = [
  {
    icon: Check,
    stage: 'Today',
    title: 'Daily Recommendations',
    description: 'AI analyzes your land overnight and delivers a grazing plan each morning. You review, adjust, and execute.',
    status: 'active',
  },
  {
    icon: Bot,
    stage: 'Next',
    title: 'Supervised Automation',
    description: 'Virtual fencing integration. Push grazing zones directly to collars. Review before execution.',
    status: 'upcoming',
  },
  {
    icon: Cpu,
    stage: 'Vision',
    title: 'Full Autonomy',
    description: 'Your operation runs itself. AI manages the rotation. You set the goals and handle exceptions.',
    status: 'future',
  },
]

export function VisionRoadmap() {
  return (
    <section className="py-16 md:py-20 bg-[#111719]" aria-labelledby="vision-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-[#FF5B04] text-xs font-semibold uppercase tracking-wide mb-3">
              <Rocket className="h-4 w-4" />
              Where We're Going
            </div>
            <h2
              id="vision-heading"
              className="text-2xl md:text-3xl font-bold text-[#FDF6E3] text-balance mb-4"
            >
              The Operating System for Regenerative Livestock
            </h2>
            <p className="text-base text-[#D3DBDD] max-w-2xl mx-auto mb-2">
              Today we help you make better decisions. Tomorrow, we handle the decisions entirely.
              Your farm's operating system, running itself.
            </p>
            <p className="text-sm text-[#FF5B04] font-medium">
              Beta users help us build each stage.
            </p>
          </div>

          {/* Roadmap Timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div
              className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#075056] via-[#075056]/50 to-[#075056]/20"
              aria-hidden="true"
            />

            <div className="grid md:grid-cols-3 gap-6">
              {stages.map((stage, index) => {
                const Icon = stage.icon
                const isActive = stage.status === 'active'
                const isFuture = stage.status === 'future'

                return (
                  <div key={index} className="relative text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`
                        rounded-full p-4 border-2
                        ${isActive
                          ? 'bg-[#075056] border-[#075056] text-[#FDF6E3]'
                          : isFuture
                            ? 'bg-[#1a2429] border-[#075056]/30 text-[#D3DBDD]/50'
                            : 'bg-[#1a2429] border-[#075056]/50 text-[#D3DBDD]'
                        }
                      `}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                    </div>
                    <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                      isActive ? 'text-[#FF5B04]' : 'text-[#D3DBDD]/70'
                    }`}>
                      {stage.stage}
                      {isActive && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-[#FF5B04]/20 text-[#FF5B04] rounded">
                          You're here
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      isFuture ? 'text-[#FDF6E3]/60' : 'text-[#FDF6E3]'
                    }`}>
                      {stage.title}
                    </h3>
                    <p className={`text-sm ${
                      isFuture ? 'text-[#D3DBDD]/50' : 'text-[#D3DBDD]'
                    }`}>
                      {stage.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Platform Vision */}
          <div className="mt-12 bg-gradient-to-br from-[#1a2429] to-[#075056]/20 border border-[#075056]/30 rounded-lg p-6 text-center">
            <p className="text-lg text-[#FDF6E3] font-medium mb-2">
              Software. Sensors. Tools.
            </p>
            <p className="text-sm text-[#D3DBDD]">
              We're building the full stack for rotational livestock at scale—not just an app,
              but an integrated platform with open specs you can repair, modify, and own.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
