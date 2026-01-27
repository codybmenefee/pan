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
    text: '2–3 day revisit frequency',
  },
  {
    icon: Archive,
    text: 'Historical archive since 2015',
  },
]

export function TechnologyTrust() {
  return (
    <section className="py-12 bg-[#233038]" aria-labelledby="technology-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div>
            <h2
              id="technology-heading"
              className="text-2xl md:text-3xl font-bold mb-3 text-[#FDF6E3] text-balance"
            >
              Open Data. Open Platform. No Lock-In.
            </h2>
            <p className="text-base text-[#D3DBDD] text-balance">
              We believe the infrastructure for sustainable agriculture should be as open as the
              pastures it supports. Built on publicly available Sentinel-2 imagery from the European
              Space Agency.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {trustPoints.map((point, index) => {
              const Icon = point.icon
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-[#075056]/20 p-3">
                    <Icon className="h-5 w-5 text-[#075056]" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-[#D3DBDD] text-center">{point.text}</p>
                </div>
              )
            })}
          </div>

          <div className="pt-6 border-t border-[#075056]/30">
            <p className="text-xs text-[#D3DBDD]/70 mb-2">
              Data provided by{' '}
              <a
                href="https://planetarycomputer.microsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#075056] hover:text-[#FF5B04] hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#233038] rounded"
              >
                Microsoft Planetary Computer
              </a>
              {' '}and{' '}
              <a
                href="https://sentinels.copernicus.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#075056] hover:text-[#FF5B04] hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#233038] rounded"
              >
                Copernicus Sentinel-2
              </a>
            </p>
            <Link
              to="/technology"
              className="text-xs text-[#075056] hover:text-[#FF5B04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#233038] rounded"
            >
              Learn more about our technology →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
