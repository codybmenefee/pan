import { Map, TrendingUp, Calendar, Eye, Plug, MessageSquare } from 'lucide-react'

const features = [
  {
    icon: Map,
    title: 'Digital Twin of Your Farm',
    description: 'Define boundaries and paddocks. Visualize all zones on an interactive map.',
  },
  {
    icon: TrendingUp,
    title: 'Satellite-Derived Intelligence',
    description: 'NDVI, EVI, and NDWI metrics show vegetation health, recovery trends, and water stress.',
  },
  {
    icon: Calendar,
    title: 'Daily Grazing Plan',
    description: 'Get a recommended paddock with confidence score, assumptions, and plain-language reasoning.',
  },
  {
    icon: Eye,
    title: 'No Black Box',
    description: 'See exactly why we recommend each action. Confidence scores and assumptions are always visible.',
  },
  {
    icon: Plug,
    title: 'Works With Your Tools',
    description: 'Export fence geometry and instructions for virtual fencing systems or manual workflows.',
  },
  {
    icon: MessageSquare,
    title: 'You Stay In Control',
    description: 'Approve, adjust, or provide feedback. The system learns from your decisions.',
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-slate-100">
            Everything You Need
          </h2>
          <p className="text-xl text-slate-400 text-center mb-16">
            Decision support tools built for adaptive grazing
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="rounded-lg bg-emerald-500/10 p-3">
                      <Icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100">{feature.title}</h3>
                  </div>
                  <p className="text-slate-400">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
