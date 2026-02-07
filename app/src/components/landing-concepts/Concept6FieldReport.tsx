import { ArrowRight, FileText, Calendar, TrendingUp, Award } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Concept6FieldReport() {
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const now = new Date()
    setCurrentDate(
      now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    )
  }, [])

  return (
    <div className="min-h-screen bg-[#f4ede1] text-[#2d2520]">
      <link
        href="https://fonts.googleapis.com/css2?family=Rockwell:wght@400;700&family=Courier+Prime:wght@400;700&family=Merriweather:wght@300;400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-slab { font-family: 'Merriweather', serif; }
        .font-mono { font-family: 'Courier Prime', monospace; }

        .paper-texture {
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(45, 37, 32, 0.03) 2px,
              rgba(45, 37, 32, 0.03) 4px
            );
        }

        .stamp-effect {
          border: 3px double #8b4513;
          background: radial-gradient(circle at 30% 30%, rgba(139, 69, 19, 0.1), transparent);
        }

        .typewriter {
          overflow: hidden;
          white-space: nowrap;
          animation: typing 2s steps(40, end);
        }

        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }

        .vintage-border {
          border: 2px solid #2d2520;
          box-shadow: inset 0 0 0 4px #f4ede1, inset 0 0 0 6px #2d2520;
        }

        .column-layout {
          column-count: 2;
          column-gap: 2rem;
          column-rule: 1px solid #2d2520;
        }

        @media (max-width: 768px) {
          .column-layout {
            column-count: 1;
          }
        }

        .drop-cap::first-letter {
          float: left;
          font-size: 4rem;
          line-height: 3rem;
          padding-right: 0.5rem;
          font-weight: bold;
          color: #8b4513;
        }
      `}</style>

      {/* Masthead - Newspaper Style */}
      <header className="border-b-4 border-double border-[#2d2520] bg-[#e8dcc8] paper-texture">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-center border-b-2 border-[#2d2520] pb-6 mb-4">
            <div className="font-mono text-xs uppercase tracking-widest mb-2">Est. 2024</div>
            <h1 className="font-slab text-5xl md:text-6xl font-bold mb-2">
              The OpenPasture Field Report
            </h1>
            <div className="font-mono text-sm">
              Daily Intelligence for the Modern Range Manager
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-xs">
            <div>Vol. I, No. 1</div>
            <div className="text-center">
              <div className="font-slab text-sm font-bold mb-1">SATELLITE RECONNAISSANCE EDITION</div>
              <div>{currentDate}</div>
            </div>
            <div>Price: Open Source</div>
          </div>
        </div>
      </header>

      {/* Lead Story */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="vintage-border bg-white p-8 mb-8">
          <div className="text-center mb-6">
            <div className="inline-block px-4 py-1 bg-[#8b4513] text-white font-mono text-xs uppercase tracking-wider mb-4">
              Special Report
            </div>
          </div>

          <h2 className="font-slab text-4xl md:text-5xl font-bold text-center mb-8 leading-tight">
            Orbital Sensing Meets Traditional Range Management
          </h2>

          <div className="border-t-2 border-b-2 border-[#2d2520] py-4 mb-8 text-center">
            <p className="font-slab text-xl italic">
              How Sentinel-2 Satellites Are Giving Ranchers Eyes in the Sky for Daily Grazing Decisions
            </p>
          </div>

          <div className="column-layout font-slab text-base leading-relaxed">
            <p className="drop-cap">
              Every five days, a pair of European satellites pass overhead, capturing multispectral
              imagery of rangeland across the continent. What was once the domain of government
              agencies and large research institutions is now available to individual operations
              through OpenPasture.
            </p>

            <p>
              The system works like this: While you sleep, our platform queries the latest
              Sentinel-2 imagery for your operation. We compute vegetation indices—NDVI shows
              chlorophyll density, EVI enhances sensitivity in dense pastures, NDWI reveals
              moisture stress. These metrics, invisible to the naked eye, tell the full story
              of your land's readiness.
            </p>

            <p>
              By morning, you receive a plain-language recommendation: which pasture is ready
              to graze, backed by confidence scoring and transparent reasoning. It's like having
              an agronomist who can see your entire operation from space, delivering a daily
              briefing over coffee.
            </p>

            <p>
              "We're not replacing rancher judgment," explains the development team. "We're
              adding satellite-scale observation to what you already know about your land. You
              stay in control—approve, override, or adjust with natural feedback."
            </p>
          </div>
        </div>

        {/* Feature Boxes - Newspaper Layout */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border-2 border-[#2d2520] p-6 stamp-effect">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-[#8b4513]" />
              <h3 className="font-slab text-xl font-bold">The Daily Brief</h3>
            </div>
            <p className="font-slab text-sm leading-relaxed">
              Delivered each morning with pasture status, recovery metrics, and a clear recommendation.
              No charts to interpret—just actionable intelligence.
            </p>
          </div>

          <div className="bg-white border-2 border-[#2d2520] p-6 stamp-effect">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-[#8b4513]" />
              <h3 className="font-slab text-xl font-bold">Time-Series Analysis</h3>
            </div>
            <p className="font-slab text-sm leading-relaxed">
              Track pasture recovery patterns over weeks and seasons. Learn what rest periods
              work best on your land. Build a data-backed rotation strategy.
            </p>
          </div>

          <div className="bg-white border-2 border-[#2d2520] p-6 stamp-effect">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-8 h-8 text-[#8b4513]" />
              <h3 className="font-slab text-xl font-bold">Operator Control</h3>
            </div>
            <p className="font-slab text-sm leading-relaxed">
              Every recommendation is advisory. Override with one tap. Add feedback in plain
              language. Your expertise always takes priority.
            </p>
          </div>
        </div>

        {/* Technical Specifications - Table Format */}
        <div className="bg-white vintage-border p-8 mb-12">
          <h3 className="font-slab text-3xl font-bold text-center mb-8 border-b-2 border-[#2d2520] pb-4">
            Technical Specifications
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-mono text-sm font-bold uppercase mb-4 bg-[#e8dcc8] px-3 py-2">
                Satellite Platform
              </h4>
              <table className="w-full font-mono text-sm">
                <tbody>
                  <tr className="border-b border-[#2d2520]/20">
                    <td className="py-2 pr-4">Mission:</td>
                    <td className="py-2 font-bold">Sentinel-2 MSI</td>
                  </tr>
                  <tr className="border-b border-[#2d2520]/20">
                    <td className="py-2 pr-4">Resolution:</td>
                    <td className="py-2 font-bold">10m–20m</td>
                  </tr>
                  <tr className="border-b border-[#2d2520]/20">
                    <td className="py-2 pr-4">Revisit:</td>
                    <td className="py-2 font-bold">5 days</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Bands:</td>
                    <td className="py-2 font-bold">13 spectral</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-mono text-sm font-bold uppercase mb-4 bg-[#e8dcc8] px-3 py-2">
                Decision Engine
              </h4>
              <table className="w-full font-mono text-sm">
                <tbody>
                  <tr className="border-b border-[#2d2520]/20">
                    <td className="py-2 pr-4">Delivery:</td>
                    <td className="py-2 font-bold">Daily (morning)</td>
                  </tr>
                  <tr className="border-b border-[#2d2520]/20">
                    <td className="py-2 pr-4">Indices:</td>
                    <td className="py-2 font-bold">NDVI, EVI, NDWI</td>
                  </tr>
                  <tr className="border-b border-[#2d2520]/20">
                    <td className="py-2 pr-4">Confidence:</td>
                    <td className="py-2 font-bold">0–100% scored</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Override:</td>
                    <td className="py-2 font-bold">Natural language</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Testimonial - Pull Quote Style */}
        <div className="bg-[#8b4513] text-white p-12 mb-12 border-4 border-double border-[#2d2520]">
          <div className="max-w-3xl mx-auto text-center">
            <div className="font-slab text-4xl md:text-5xl italic leading-tight mb-6">
              "Like having an agronomist who can see the whole ranch from orbit."
            </div>
            <div className="font-mono text-sm uppercase tracking-wider opacity-90">
              — Beta Program Participant
            </div>
          </div>
        </div>

        {/* How to Access - Coupon Style */}
        <div className="vintage-border bg-gradient-to-b from-white to-[#e8dcc8] p-10">
          <div className="text-center mb-6">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-[#8b4513]" />
            <h3 className="font-slab text-3xl font-bold mb-3">Request Your Daily Field Report</h3>
            <p className="font-slab text-lg max-w-2xl mx-auto">
              Limited early access for operations practicing rotational or adaptive grazing.
              Join the beta program and start receiving satellite-backed intelligence every morning.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <button className="px-8 py-4 bg-[#8b4513] text-white font-slab font-bold hover:bg-[#6d3710] transition-colors flex items-center justify-center gap-2 group">
              Subscribe for Beta Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border-2 border-[#2d2520] text-[#2d2520] font-slab font-bold hover:bg-[#2d2520] hover:text-white transition-colors">
              Read Full Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Newspaper Classified Style */}
      <footer className="border-t-4 border-double border-[#2d2520] bg-[#e8dcc8] paper-texture">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-slab font-bold mb-3">Publication</h4>
              <ul className="font-mono text-xs space-y-1">
                <li>OpenPasture</li>
                <li>Field Report Division</li>
                <li>Est. 2024</li>
              </ul>
            </div>

            <div>
              <h4 className="font-slab font-bold mb-3">Sections</h4>
              <ul className="font-mono text-xs space-y-1">
                <li>
                  <a href="#" className="hover:underline">
                    Daily Brief
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Technical Reports
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Field Research
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-slab font-bold mb-3">Resources</h4>
              <ul className="font-mono text-xs space-y-1">
                <li>
                  <a href="#" className="hover:underline">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Apache 2.0 License
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-slab font-bold mb-3">Notice</h4>
              <p className="font-mono text-xs leading-relaxed">
                Decision support software. Not autonomous control. Operator oversight required.
              </p>
            </div>
          </div>

          <div className="border-t-2 border-[#2d2520] pt-6 text-center font-mono text-xs">
            © 2024 OpenPasture | Building the intelligence layer for regenerative grazing
          </div>
        </div>
      </footer>
    </div>
  )
}
