import { Shield, Database, Clock, Archive } from 'lucide-react'
import { Link } from '@tanstack/react-router'

const trustPoints = [
  {
    icon: Shield,
    text: 'Free and open satellite imagery',
  },
  {
    icon: Database,
    text: '10-meter resolution',
  },
  {
    icon: Clock,
    text: '2-3 day revisit frequency',
  },
  {
    icon: Archive,
    text: 'Historical archive since 2015',
  },
]

export function TechnologyTrust() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
              Powered by Free, Open Satellite Data
            </h2>
            <p className="text-xl text-slate-400">
              We use publicly available Sentinel-2 imagery from the European Space Agency. No proprietary data lock-in.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
            {trustPoints.map((point, index) => {
              const Icon = point.icon
              return (
                <div key={index} className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-emerald-500/10 p-5">
                    <Icon className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-400 text-center">{point.text}</p>
                </div>
              )
            })}
          </div>

          <div className="pt-10 border-t border-slate-800">
            <p className="text-sm text-slate-500 mb-4">
              Data provided by{' '}
              <a
                href="https://planetarycomputer.microsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Microsoft Planetary Computer
              </a>
              {' '}and{' '}
              <a
                href="https://sentinels.copernicus.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Copernicus Sentinel-2
              </a>
            </p>
            <Link
              to="/technology"
              className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              Learn more about our technology →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
