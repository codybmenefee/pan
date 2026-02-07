import { ArrowRight, Cloud, CloudRain, CloudSun, Gauge, BarChart3, Thermometer } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Concept8WeatherStation() {
  const [currentTemp, setCurrentTemp] = useState(72)
  const [humidity, setHumidity] = useState(65)
  const [ndvi, setNdvi] = useState(0.75)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTemp((prev) => prev + (Math.random() - 0.5) * 2)
      setHumidity((prev) => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 5)))
      setNdvi((prev) => Math.max(0, Math.min(1, prev + (Math.random() - 0.5) * 0.05)))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f2f7] to-[#f5f9fb] text-[#1a3a52]">
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-swiss { font-family: 'IBM Plex Sans', sans-serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        .gauge-bg {
          background: conic-gradient(
            from 180deg at 50% 50%,
            #1a3a52 0deg,
            #2d5f7f 120deg,
            #4a8fb9 240deg,
            #66b3d9 360deg
          );
        }

        .weather-card {
          background: white;
          box-shadow: 0 1px 3px rgba(26, 58, 82, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .weather-card:hover {
          box-shadow: 0 4px 12px rgba(26, 58, 82, 0.12);
          transform: translateY(-2px);
        }

        .metric-line {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: drawLine 2s ease-out forwards;
        }

        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }

        .fade-slide-up {
          animation: fadeSlideUp 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }

        .pressure-indicator {
          animation: pressure 3s ease-in-out infinite;
        }

        @keyframes pressure {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.8);
          }
        }
      `}</style>

      {/* Header - Weather Station Bar */}
      <header className="bg-white border-b border-[#1a3a52]/10 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#4a8fb9] to-[#66b3d9] rounded-lg flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-swiss text-xl font-bold text-[#1a3a52]">OpenPasture</div>
                  <div className="font-body text-xs text-[#1a3a52]/60">Land Intelligence Station</div>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex gap-8 font-swiss text-sm font-medium">
              <a href="#forecast" className="hover:text-[#4a8fb9] transition-colors">
                Forecast
              </a>
              <a href="#metrics" className="hover:text-[#4a8fb9] transition-colors">
                Metrics
              </a>
              <a href="#stations" className="hover:text-[#4a8fb9] transition-colors">
                Stations
              </a>
              <button className="px-5 py-2 bg-[#4a8fb9] text-white rounded-lg hover:bg-[#2d5f7f] transition-colors">
                Get Access
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero - Weather Dashboard */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headlines */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#4a8fb9]/30 fade-slide-up">
                <div className="w-2 h-2 bg-[#4a8fb9] rounded-full animate-pulse" />
                <span className="font-body text-sm font-medium text-[#1a3a52]">
                  Live Satellite Monitoring
                </span>
              </div>

              <div className="fade-slide-up delay-100">
                <h1 className="font-swiss text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-[#1a3a52] mb-6">
                  Land Conditions,
                  <br />
                  <span className="text-[#4a8fb9]">Forecasted Daily</span>
                </h1>

                <p className="font-body text-xl text-[#1a3a52]/70 leading-relaxed max-w-xl">
                  Like a weather station for your pastures. Satellite imagery delivers vegetation
                  health metrics and grazing forecasts every morning. Clear data, actionable
                  guidance.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 fade-slide-up delay-200">
                <button className="px-8 py-4 bg-[#4a8fb9] text-white font-body font-semibold rounded-lg hover:bg-[#2d5f7f] transition-all hover:shadow-lg flex items-center justify-center gap-2 group">
                  View Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 border-2 border-[#4a8fb9] text-[#4a8fb9] font-body font-semibold rounded-lg hover:bg-[#4a8fb9]/5 transition-all">
                  How It Works
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 fade-slide-up delay-300">
                <div className="weather-card rounded-xl p-4">
                  <div className="font-body text-xs text-[#1a3a52]/60 mb-1">Resolution</div>
                  <div className="font-swiss text-2xl font-bold text-[#4a8fb9]">10m</div>
                </div>
                <div className="weather-card rounded-xl p-4">
                  <div className="font-body text-xs text-[#1a3a52]/60 mb-1">Update Freq.</div>
                  <div className="font-swiss text-2xl font-bold text-[#4a8fb9]">5 days</div>
                </div>
                <div className="weather-card rounded-xl p-4">
                  <div className="font-body text-xs text-[#1a3a52]/60 mb-1">Accuracy</div>
                  <div className="font-swiss text-2xl font-bold text-[#4a8fb9]">91%</div>
                </div>
              </div>
            </div>

            {/* Right: Dashboard Widget */}
            <div className="fade-slide-up delay-200">
              <div className="weather-card rounded-2xl p-8 border border-[#1a3a52]/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="font-swiss text-sm font-medium text-[#1a3a52]/60">
                      Current Conditions
                    </div>
                    <div className="font-swiss text-2xl font-bold text-[#1a3a52]">
                      Pasture 7
                    </div>
                  </div>
                  <CloudSun className="w-12 h-12 text-[#4a8fb9]" />
                </div>

                {/* Main Metric */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-swiss text-6xl font-bold text-[#1a3a52]">
                      {ndvi.toFixed(2)}
                    </span>
                    <span className="font-body text-xl text-[#1a3a52]/60">NDVI</span>
                  </div>
                  <div className="font-body text-sm text-[#4a8fb9]">
                    ↑ 0.08 from last week
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#e8f2f7] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-[#4a8fb9]" />
                      <span className="font-body text-xs text-[#1a3a52]/60">Temperature</span>
                    </div>
                    <div className="font-swiss text-2xl font-bold text-[#1a3a52]">
                      {currentTemp.toFixed(0)}°F
                    </div>
                  </div>

                  <div className="bg-[#e8f2f7] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CloudRain className="w-4 h-4 text-[#4a8fb9]" />
                      <span className="font-body text-xs text-[#1a3a52]/60">Humidity</span>
                    </div>
                    <div className="font-swiss text-2xl font-bold text-[#1a3a52]">
                      {humidity.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-gradient-to-r from-[#4a8fb9] to-[#66b3d9] rounded-lg p-4 text-white">
                  <div className="font-body text-xs uppercase tracking-wide opacity-90 mb-1">
                    Today's Forecast
                  </div>
                  <div className="font-swiss text-lg font-semibold">
                    Optimal for Grazing
                  </div>
                  <div className="font-body text-sm opacity-90 mt-2">
                    Vegetation recovery complete. Moisture levels adequate. Confidence: 89%.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Metric Cards */}
      <section id="metrics" className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-swiss text-4xl md:text-5xl font-bold mb-6 text-[#1a3a52]">
              Precision Monitoring Systems
            </h2>
            <p className="font-body text-xl text-[#1a3a52]/70 max-w-3xl mx-auto">
              Like meteorological instruments for your rangeland. Track key indices with
              professional-grade accuracy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Gauge,
                title: 'NDVI Analysis',
                description:
                  'Normalized Difference Vegetation Index measures chlorophyll density. Track biomass accumulation and vegetation health across all pastures.',
                metric: '0.00 - 1.00 scale',
                color: '#4a8fb9',
              },
              {
                icon: BarChart3,
                title: 'Time-Series Trends',
                description:
                  "Historical data visualization shows recovery curves and seasonal patterns. Identify optimal rotation timing based on your land's rhythms.",
                metric: '30-day rolling avg',
                color: '#66b3d9',
              },
              {
                icon: CloudRain,
                title: 'Moisture Indicators',
                description:
                  'NDWI (Normalized Difference Water Index) detects moisture stress before visible symptoms appear. Plan grazing around water availability.',
                metric: 'Real-time sensing',
                color: '#2d5f7f',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="weather-card rounded-2xl p-8">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: feature.color }} />
                  </div>

                  <h3 className="font-swiss text-2xl font-bold mb-4 text-[#1a3a52]">
                    {feature.title}
                  </h3>

                  <p className="font-body text-[#1a3a52]/70 leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  <div className="pt-4 border-t border-[#1a3a52]/10">
                    <div className="font-body text-xs text-[#1a3a52]/60 uppercase tracking-wide">
                      {feature.metric}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works - Process Flow */}
      <section id="forecast" className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-swiss text-4xl font-bold mb-4 text-[#1a3a52]">
              Your Daily Forecast
            </h2>
            <p className="font-body text-lg text-[#1a3a52]/70">
              Automated monitoring and analysis, delivered every morning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Satellite Pass',
                description:
                  'Sentinel-2 satellites capture multispectral imagery of your ranch. 13 bands of data collected every 5 days at 10m resolution.',
              },
              {
                step: '02',
                title: 'Data Processing',
                description:
                  'Automated pipeline computes vegetation indices, moisture levels, and time-series trends. Cloud-free pixels analyzed for accuracy.',
              },
              {
                step: '03',
                title: 'Morning Brief',
                description:
                  'Wake up to a clear forecast: which pasture to graze, confidence score, and reasoning. Review or override based on ground truth.',
              },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="weather-card rounded-2xl p-8 h-full">
                  <div className="inline-block px-3 py-1 bg-[#4a8fb9] text-white font-swiss text-sm font-bold rounded-md mb-4">
                    {step.step}
                  </div>

                  <h3 className="font-swiss text-2xl font-bold mb-4 text-[#1a3a52]">
                    {step.title}
                  </h3>

                  <p className="font-body text-[#1a3a52]/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-[#4a8fb9]/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - Weather Bar */}
      <section className="px-6 py-16 bg-gradient-to-r from-[#1a3a52] to-[#2d5f7f] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10m', label: 'Spatial Resolution', unit: 'meters' },
              { value: '5', label: 'Revisit Frequency', unit: 'days' },
              { value: '13', label: 'Spectral Bands', unit: 'channels' },
              { value: '91%', label: 'Avg. Confidence', unit: 'accuracy' },
            ].map((stat, idx) => (
              <div key={idx} className="weather-card bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="font-swiss text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="font-body text-lg font-medium mb-1">{stat.label}</div>
                <div className="font-body text-sm opacity-70">{stat.unit}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="stations" className="px-6 py-32 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-swiss text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-[#1a3a52] leading-tight">
            Add Satellite Sensing
            <br />
            to Your Operation
          </h2>

          <p className="font-body text-xl text-[#1a3a52]/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join the beta program and receive daily land intelligence forecasts. Professional-grade
            monitoring for your pasture management.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-5 bg-[#4a8fb9] text-white font-body font-bold rounded-lg hover:bg-[#2d5f7f] transition-all hover:shadow-xl flex items-center justify-center gap-2 group">
              Request Station Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 border-2 border-[#4a8fb9] text-[#4a8fb9] font-body font-bold rounded-lg hover:bg-[#4a8fb9]/5 transition-all">
              View Sample Dashboard
            </button>
          </div>

          <div className="mt-12 pt-12 border-t border-[#1a3a52]/10">
            <p className="font-body text-sm text-[#1a3a52]/60">
              Priority access for established rotational grazing operations
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a3a52] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#4a8fb9] rounded-lg flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-swiss text-xl font-bold">OpenPasture</div>
                  <div className="font-body text-xs text-white/60">Land Intelligence Station</div>
                </div>
              </div>
              <p className="font-body text-white/70 leading-relaxed max-w-sm">
                Professional-grade satellite monitoring for adaptive grazing operations. Clear
                metrics, daily forecasts, expert-level accuracy.
              </p>
            </div>

            <div>
              <h4 className="font-swiss font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 font-body text-sm text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Metrics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Forecasts
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-swiss font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 font-body text-sm text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GitHub
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

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 font-body text-sm text-white/50">
            <div>© 2024 OpenPasture. Open source intelligence layer.</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#4a8fb9] rounded-full animate-pulse" />
              <span>Monitoring active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
