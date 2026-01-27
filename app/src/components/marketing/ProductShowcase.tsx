import { ScreenshotDisplay } from './ScreenshotDisplay'

interface ProductShowcaseProps {
  title: string
  description: string
  bullets?: string[]
  screenshotSrc: string
  screenshotAlt: string
  reverse?: boolean
}

export function ProductShowcase({
  title,
  description,
  bullets,
  screenshotSrc,
  screenshotAlt,
  reverse = false,
}: ProductShowcaseProps) {
  return (
    <section className="py-16 md:py-24 bg-[#233038] relative overflow-hidden">
      {/* Subtle gradient accent */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          reverse
            ? 'from-[#075056]/20 via-transparent to-[#075056]/10'
            : 'from-[#075056]/20 via-transparent to-[#075056]/10'
        } pointer-events-none`}
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div
          className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${
            reverse ? 'md:flex-row-reverse' : ''
          }`}
        >
          {/* Text content */}
          <div className={`space-y-6 ${reverse ? 'md:order-2' : 'md:order-1'}`}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#FDF6E3] text-balance">
              {title}
            </h2>
            <p className="text-lg text-[#D3DBDD] leading-relaxed">{description}</p>
            {bullets && bullets.length > 0 && (
              <ul className="space-y-3">
                {bullets.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[#075056]/20 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-[#075056]" />
                    </span>
                    <span className="text-[#FDF6E3]/90">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Screenshot */}
          <div className={reverse ? 'md:order-1' : 'md:order-2'}>
            <ScreenshotDisplay
              src={screenshotSrc}
              alt={screenshotAlt}
              className="max-w-xl mx-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
