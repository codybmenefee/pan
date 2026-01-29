import { MapPin, Calendar, HelpCircle, Scale } from 'lucide-react'

export function VirtualFencingDifferentiator() {
  return (
    <section className="py-16 md:py-20 bg-[#111719]" aria-labelledby="differentiator-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              id="differentiator-heading"
              className="text-2xl md:text-3xl font-bold text-[#FDF6E3] text-balance mb-4"
            >
              Already Using Virtual Fencing?
            </h2>
            <p className="text-base text-[#D3DBDD] max-w-2xl mx-auto">
              Virtual fences are great at keeping livestock where you want them.
              But they can't tell you where that should be.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Virtual Fencing */}
            <div className="bg-[#1a2429]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-lg shadow-black/20 p-6">
              <div className="text-sm font-semibold text-[#D3DBDD] uppercase tracking-wide mb-4">
                Virtual Fencing
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#075056] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#FDF6E3] font-medium">WHERE</span>
                    <p className="text-sm text-[#D3DBDD]">
                      Draw a boundary. Animals stay inside.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <Calendar className="h-5 w-5 text-[#D3DBDD] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#D3DBDD] font-medium">WHEN?</span>
                    <p className="text-sm text-[#D3DBDD]">
                      You figure it out.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <HelpCircle className="h-5 w-5 text-[#D3DBDD] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#D3DBDD] font-medium">WHY?</span>
                    <p className="text-sm text-[#D3DBDD]">
                      You figure it out.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <Scale className="h-5 w-5 text-[#D3DBDD] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#D3DBDD] font-medium">HOW MUCH?</span>
                    <p className="text-sm text-[#D3DBDD]">
                      You figure it out.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* OpenPasture */}
            <div className="bg-gradient-to-br from-[#1a2429] to-[#075056]/20 border border-[#075056]/50 rounded-lg p-6">
              <div className="text-sm font-semibold text-[#FF5B04] uppercase tracking-wide mb-4">
                OpenPasture
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#075056] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#FDF6E3] font-medium">WHERE</span>
                    <p className="text-sm text-[#D3DBDD]">
                      "Graze the northeast section of Paddock 3."
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[#075056] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#FDF6E3] font-medium">WHEN</span>
                    <p className="text-sm text-[#D3DBDD]">
                      "Today. Paddock 7 needs 4 more days to recover."
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-[#075056] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#FDF6E3] font-medium">WHY</span>
                    <p className="text-sm text-[#D3DBDD]">
                      "NDVI shows peak growth. Rain expected tomorrow."
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="h-5 w-5 text-[#075056] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#FDF6E3] font-medium">HOW MUCH</span>
                    <p className="text-sm text-[#D3DBDD]">
                      "12 acres for 150 head. Move tomorrow afternoon."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a2429] border border-[#FF5B04]/30 rounded-lg p-5 text-center">
            <p className="text-[#FDF6E3] font-medium mb-2">
              We work with your virtual fencing system.
            </p>
            <p className="text-sm text-[#D3DBDD]">
              Export grazing zones directly to major virtual fencing providers.
              The intelligence layer your collar system is missing.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
