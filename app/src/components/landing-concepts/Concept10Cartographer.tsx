import { ArrowRight, Compass, Map, MapPin, Navigation } from 'lucide-react'
import { useState } from 'react'

export function Concept10Cartographer() {
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#2d3e2b]">
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=EB+Garamond:wght@400;500;600;700&family=Libre+Franklin:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-engraved { font-family: 'Cinzel', serif; }
        .font-serif { font-family: 'EB Garamond', serif; }
        .font-sans { font-family: 'Libre Franklin', sans-serif; }

        .topo-lines {
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 19px,
              rgba(139, 111, 78, 0.15) 19px,
              rgba(139, 111, 78, 0.15) 20px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 19px,
              rgba(139, 111, 78, 0.15) 19px,
              rgba(139, 111, 78, 0.15) 20px
            );
          background-size: 100px 100px;
        }

        .contour-effect {
          position: relative;
        }

        .contour-effect::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              45deg,
              transparent 0px,
              transparent 4px,
              rgba(122, 155, 61, 0.1) 4px,
              rgba(122, 155, 61, 0.1) 8px
            );
        }

        .map-border {
          border: 3px solid #2d3e2b;
          box-shadow:
            inset 0 0 0 1px #f5f0e8,
            inset 0 0 0 4px #8b6f4e,
            inset 0 0 0 5px #f5f0e8,
            inset 0 0 0 8px #2d3e2b;
        }

        .compass-rotate {
          animation: compassRotate 20s linear infinite;
        }

        @keyframes compassRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .draw-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawPath 3s ease-out forwards;
        }

        @keyframes drawPath {
          to {
            stroke-dashoffset: 0;
          }
        }

        .parchment-fade {
          animation: parchmentFade 1s ease-out forwards;
          opacity: 0;
        }

        @keyframes parchmentFade {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }

        .elevation-shadow {
          box-shadow:
            2px 2px 0 rgba(45, 62, 43, 0.2),
            4px 4px 0 rgba(45, 62, 43, 0.1);
        }

        .surveyor-grid {
          background-image:
            linear-gradient(rgba(139, 111, 78, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 111, 78, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      {/* Header - Cartographer's Label */}
      <header className="bg-[#2d3e2b] border-b-4 border-[#8b6f4e]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-3 border-[#8b6f4e] rounded-full compass-rotate">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-[#c65d3b]" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-[#8b6f4e]" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-[#8b6f4e]" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-[#8b6f4e]" />
                </div>
                <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-[#8b6f4e]" />
              </div>
              <div>
                <div className="font-engraved text-2xl text-white tracking-wider">OpenPasture</div>
                <div className="font-serif text-sm italic text-[#8b6f4e]">
                  Cartography & Intelligence
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#survey"
                className="font-sans text-sm text-white hover:text-[#8b6f4e] transition-colors"
              >
                Survey
              </a>
              <a
                href="#territory"
                className="font-sans text-sm text-white hover:text-[#8b6f4e] transition-colors"
              >
                Territory
              </a>
              <a
                href="#charts"
                className="font-sans text-sm text-white hover:text-[#8b6f4e] transition-colors"
              >
                Charts
              </a>
              <button className="px-6 py-2 bg-[#8b6f4e] text-white font-sans font-semibold hover:bg-[#6d5939] transition-colors">
                Commission
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero - Map Layout */}
      <section className="py-24 px-6 topo-lines">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-white border-2 border-[#8b6f4e] parchment-fade">
                <Navigation className="w-4 h-4 text-[#2d3e2b]" />
                <span className="font-sans text-sm uppercase tracking-wider text-[#2d3e2b]">
                  Orbital Cartography
                </span>
              </div>

              <h1 className="font-engraved text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-[#2d3e2b] parchment-fade delay-1">
                Map Your Land's
                <br />
                <span className="text-[#7a9b3d]">Living Patterns</span>
              </h1>

              <p className="font-serif text-2xl text-[#2d3e2b]/80 leading-relaxed parchment-fade delay-2">
                Like the cartographers of old who charted unknown territories, OpenPasture maps the
                invisible signals of your pastures. Satellite imagery reveals vegetation contours,
                moisture topography, and recovery gradients—charting the living landscape from above.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 parchment-fade delay-3">
                <button className="px-8 py-4 bg-[#7a9b3d] text-white font-sans font-semibold hover:bg-[#6a8b2d] transition-all elevation-shadow flex items-center justify-center gap-2 group">
                  Explore Territory
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 border-3 border-[#2d3e2b] text-[#2d3e2b] font-sans font-semibold hover:bg-[#2d3e2b] hover:text-white transition-all">
                  View Survey
                </button>
              </div>

              {/* Coordinates */}
              <div className="flex gap-8 pt-8 font-sans text-sm border-t border-[#2d3e2b]/20">
                <div>
                  <div className="text-[#2d3e2b]/60 mb-1">RESOLUTION</div>
                  <div className="font-engraved text-xl text-[#7a9b3d]">10m</div>
                </div>
                <div>
                  <div className="text-[#2d3e2b]/60 mb-1">FREQUENCY</div>
                  <div className="font-engraved text-xl text-[#7a9b3d]">5 days</div>
                </div>
                <div>
                  <div className="text-[#2d3e2b]/60 mb-1">COVERAGE</div>
                  <div className="font-engraved text-xl text-[#7a9b3d]">Global</div>
                </div>
              </div>
            </div>

            {/* Right: Map Illustration */}
            <div className="relative">
              <div className="map-border bg-white p-8 surveyor-grid relative">
                {/* Compass Rose */}
                <div className="absolute top-4 right-4 w-16 h-16">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#8b6f4e" strokeWidth="2" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#8b6f4e" strokeWidth="1" />
                    <polygon points="50,10 55,45 50,50 45,45" fill="#c65d3b" />
                    <polygon points="50,90 55,55 50,50 45,55" fill="#8b6f4e" />
                    <polygon points="10,50 45,55 50,50 45,45" fill="#8b6f4e" />
                    <polygon points="90,50 55,55 50,50 55,45" fill="#8b6f4e" />
                    <text x="50" y="8" textAnchor="middle" fill="#2d3e2b" fontSize="10" fontFamily="serif">
                      N
                    </text>
                  </svg>
                </div>

                {/* Title Cartouche */}
                <div className="border-2 border-[#8b6f4e] bg-[#f5f0e8] p-4 mb-6">
                  <div className="font-engraved text-center text-sm uppercase tracking-widest mb-1">
                    Survey Chart
                  </div>
                  <div className="font-serif text-center text-xs italic text-[#2d3e2b]/60">
                    Pasture Vegetation Index
                  </div>
                </div>

                {/* Pasture Regions */}
                <div className="space-y-3">
                  {[
                    { name: 'North Pasture', ndvi: 0.82, status: 'Optimal' },
                    { name: 'East Pasture', ndvi: 0.45, status: 'Recovering' },
                    { name: 'South Pasture', ndvi: 0.71, status: 'Ready' },
                    { name: 'West Pasture', ndvi: 0.38, status: 'Resting' },
                  ].map((pasture, idx) => (
                    <div
                      key={idx}
                      className={`border-2 p-4 cursor-pointer transition-all ${
                        hoveredRegion === idx
                          ? 'border-[#7a9b3d] bg-[#7a9b3d]/10'
                          : 'border-[#2d3e2b]/20 bg-white'
                      }`}
                      onMouseEnter={() => setHoveredRegion(idx)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#8b6f4e]" />
                          <span className="font-engraved text-sm">{pasture.name}</span>
                        </div>
                        <span className="font-sans text-xs px-2 py-1 bg-[#2d3e2b]/10">
                          {pasture.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-serif text-xs text-[#2d3e2b]/60">NDVI Index:</span>
                        <span className="font-engraved text-lg text-[#7a9b3d]">
                          {pasture.ndvi.toFixed(2)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1 bg-[#2d3e2b]/10 mt-2">
                        <div
                          className="h-full bg-[#7a9b3d] transition-all"
                          style={{ width: `${pasture.ndvi * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="border-t-2 border-[#2d3e2b]/20 mt-6 pt-4">
                  <div className="font-engraved text-xs uppercase tracking-wider mb-3">Legend</div>
                  <div className="grid grid-cols-2 gap-2 font-serif text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#7a9b3d]" />
                      <span>High Vigor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#8b6f4e]" />
                      <span>Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#c65d3b]" />
                      <span>Low Vigor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#2d3e2b]" />
                      <span>Resting</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scale Bar */}
              <div className="mt-4 flex items-center gap-2 font-serif text-xs">
                <div className="flex border-2 border-[#2d3e2b]">
                  <div className="w-12 h-3 bg-[#2d3e2b]" />
                  <div className="w-12 h-3 bg-white" />
                  <div className="w-12 h-3 bg-[#2d3e2b]" />
                  <div className="w-12 h-3 bg-white" />
                </div>
                <span>Scale: 1:10,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Survey Cards */}
      <section id="survey" className="py-24 px-6 bg-white contour-effect">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="font-engraved text-4xl md:text-5xl font-bold mb-6 text-[#2d3e2b]">
              The Surveyor's Instruments
            </h2>
            <p className="font-serif text-xl text-[#2d3e2b]/70 max-w-3xl mx-auto italic">
              Modern cartography employs spectral analysis to chart vegetation territories
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Map,
                title: 'Vegetation Contours',
                description:
                  'NDVI mapping reveals chlorophyll density across your territory. Like elevation lines on a topographic map, these contours show where biomass accumulates.',
                coordinates: 'Index: 0.0-1.0',
              },
              {
                icon: Navigation,
                title: 'Moisture Topography',
                description:
                  'NDWI charts water distribution patterns. Identify stress zones before they become visible, like a surveyor finding underground springs.',
                coordinates: 'Sensitivity: High',
              },
              {
                icon: Compass,
                title: 'Recovery Gradients',
                description:
                  "Time-series analysis maps how vegetation regenerates after grazing. Chart optimal rotation timing based on your land's natural rhythms.",
                coordinates: 'Temporal: 5-day',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="bg-[#f5f0e8] border-3 border-[#2d3e2b] p-8 elevation-shadow hover:shadow-lg transition-all"
                >
                  <div className="w-16 h-16 border-2 border-[#8b6f4e] bg-white flex items-center justify-center mb-6 mx-auto">
                    <Icon className="w-8 h-8 text-[#7a9b3d]" />
                  </div>

                  <h3 className="font-engraved text-2xl text-center mb-4 text-[#2d3e2b]">
                    {feature.title}
                  </h3>

                  <p className="font-serif text-[#2d3e2b]/70 leading-relaxed text-center mb-6">
                    {feature.description}
                  </p>

                  <div className="text-center pt-4 border-t border-[#2d3e2b]/20">
                    <div className="font-sans text-xs uppercase tracking-wider text-[#2d3e2b]/60">
                      {feature.coordinates}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Territory Info - Parchment */}
      <section id="territory" className="py-24 px-6 bg-[#f5f0e8] topo-lines">
        <div className="max-w-4xl mx-auto">
          <div className="map-border bg-white p-12">
            <div className="text-center border-b-2 border-[#8b6f4e] pb-6 mb-8">
              <div className="font-engraved text-4xl mb-2">Territory Intelligence</div>
              <div className="font-serif text-lg italic text-[#2d3e2b]/60">
                Sentinel-2 Orbital Reconnaissance
              </div>
            </div>

            <div className="space-y-6 font-serif text-lg leading-relaxed text-[#2d3e2b]/80">
              <p className="first-letter:text-5xl first-letter:font-engraved first-letter:float-left first-letter:mr-2 first-letter:text-[#7a9b3d]">
                In the tradition of great land surveys—from the Domesday Book to the US Geological
                Survey—OpenPasture charts your pastures with modern precision. Where historical
                cartographers used theodolites and chain measures, we employ multispectral sensors
                orbiting 700 kilometers overhead.
              </p>

              <p>
                Every five days, Sentinel-2 satellites pass above your coordinates, capturing
                thirteen bands of spectral data. We process these signals into vegetation indices—NDVI
                for chlorophyll, EVI for biomass, NDWI for moisture—and compile them into a daily
                intelligence brief.
              </p>

              <p>
                The result: a clear recommendation of which pasture to graze, backed by satellite
                observation and temporal analysis. Like a surveyor's report, it provides facts you
                can verify on the ground. You maintain full authority to accept, adjust, or override
                based on local knowledge.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12 pt-8 border-t-2 border-[#2d3e2b]/20">
              <div className="text-center">
                <div className="font-engraved text-3xl text-[#7a9b3d] mb-2">13</div>
                <div className="font-sans text-sm text-[#2d3e2b]/60 uppercase">Spectral Bands</div>
              </div>
              <div className="text-center">
                <div className="font-engraved text-3xl text-[#7a9b3d] mb-2">290km</div>
                <div className="font-sans text-sm text-[#2d3e2b]/60 uppercase">Swath Width</div>
              </div>
              <div className="text-center">
                <div className="font-engraved text-3xl text-[#7a9b3d] mb-2">10m</div>
                <div className="font-sans text-sm text-[#2d3e2b]/60 uppercase">Resolution</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Commission */}
      <section id="charts" className="py-32 px-6 bg-gradient-to-br from-[#2d3e2b] to-[#3d4e3b]">
        <div className="max-w-5xl mx-auto text-center text-white">
          <div className="inline-block mb-8">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-3 border-[#8b6f4e] rounded-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-[#c65d3b]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-[#8b6f4e]" />
              </div>
              <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-[#8b6f4e]" />
            </div>
          </div>

          <h2 className="font-engraved text-5xl md:text-6xl lg:text-7xl mb-8 leading-tight">
            Commission Your
            <br />
            Territory Survey
          </h2>

          <p className="font-serif text-2xl md:text-3xl italic mb-12 max-w-3xl mx-auto leading-relaxed">
            Join the beta program and receive daily cartographic intelligence for your grazing
            operation. Limited commissions available for established territories.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-10 py-5 bg-[#8b6f4e] text-white font-sans font-bold hover:bg-[#6d5939] transition-all elevation-shadow flex items-center justify-center gap-2 group">
              Request Survey Commission
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 border-3 border-[#8b6f4e] text-[#8b6f4e] font-sans font-bold hover:bg-[#8b6f4e] hover:text-white transition-all">
              View Sample Charts
            </button>
          </div>

          <div className="mt-16 font-serif text-lg italic opacity-90">
            Priority for rotational grazing operations with established pasture systems
          </div>
        </div>
      </section>

      {/* Footer - Cartouche */}
      <footer className="bg-[#2d3e2b] border-t-4 border-[#8b6f4e]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Compass className="w-10 h-10 text-[#8b6f4e]" />
                <div>
                  <div className="font-engraved text-2xl text-white tracking-wider">
                    OpenPasture
                  </div>
                  <div className="font-serif text-sm italic text-[#8b6f4e]">
                    Cartography & Intelligence
                  </div>
                </div>
              </div>
              <p className="font-serif text-white/70 leading-relaxed max-w-md">
                Charting the living landscape through orbital reconnaissance. Precision mapping for
                adaptive grazing operations.
              </p>
            </div>

            <div>
              <h4 className="font-engraved font-bold text-white mb-4">Charts</h4>
              <ul className="space-y-2 font-sans text-sm text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Territory Survey
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Intelligence Brief
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Commission
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-engraved font-bold text-white mb-4">Resources</h4>
              <ul className="space-y-2 font-sans text-sm text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Apache 2.0 License
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 font-serif text-sm text-white/50">
            <div>© MMXXIV OpenPasture. Charting the intelligence layer for regenerative grazing.</div>
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              <span>True North: Open Source</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
