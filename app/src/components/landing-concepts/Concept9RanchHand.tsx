import { ArrowRight, Mountain, Star, Award } from 'lucide-react'

export function Concept9RanchHand() {
  return (
    <div className="min-h-screen bg-[#f7f3ed] text-[#3d2f1f]">
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bitter:wght@400;500;600;700&family=Arvo:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .font-western { font-family: 'Bebas Neue', sans-serif; }
        .font-slab { font-family: 'Arvo', serif; }
        .font-body { font-family: 'Bitter', serif; }

        .leather-texture {
          background-image:
            linear-gradient(rgba(61, 47, 31, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(61, 47, 31, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .denim-overlay {
          position: relative;
        }

        .denim-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              90deg,
              rgba(70, 130, 180, 0.02) 0px,
              rgba(70, 130, 180, 0.02) 2px,
              transparent 2px,
              transparent 4px
            );
        }

        .rust-accent {
          background: linear-gradient(135deg, #c65d3b 0%, #a94e31 100%);
        }

        .wheat-gold {
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
        }

        .hero-parallax {
          background-image: linear-gradient(
            to bottom,
            rgba(247, 243, 237, 0.9) 0%,
            rgba(247, 243, 237, 0.7) 50%,
            rgba(247, 243, 237, 0.9) 100%
          ),
          radial-gradient(circle at 30% 50%, rgba(198, 93, 59, 0.1), transparent),
          radial-gradient(circle at 70% 50%, rgba(218, 165, 32, 0.1), transparent);
        }

        .slide-in-left {
          animation: slideInLeft 1s ease-out forwards;
          opacity: 0;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }

        .star-badge {
          clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          );
        }
      `}</style>

      {/* Header - Western Bar */}
      <header className="bg-[#3d2f1f] border-b-4 border-[#c65d3b]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 wheat-gold star-badge" />
                <Mountain className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <div className="font-western text-3xl text-white tracking-wider">OPENPASTURE</div>
                <div className="font-body text-xs text-[#daa520] uppercase tracking-wide">
                  Range Intelligence
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#heritage"
                className="font-slab text-sm text-white hover:text-[#daa520] transition-colors"
              >
                Heritage
              </a>
              <a
                href="#technology"
                className="font-slab text-sm text-white hover:text-[#daa520] transition-colors"
              >
                Technology
              </a>
              <a
                href="#access"
                className="font-slab text-sm text-white hover:text-[#daa520] transition-colors"
              >
                Get Started
              </a>
              <button className="px-6 py-2 rust-accent text-white font-slab font-bold hover:shadow-lg transition-all">
                JOIN BETA
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero - Wide Open */}
      <section className="hero-parallax py-32 px-6 leather-texture">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-6 py-2 bg-[#c65d3b]/10 border-2 border-[#c65d3b] mb-8 slide-in-left">
              <span className="font-slab text-sm uppercase tracking-wider text-[#c65d3b] font-bold">
                Tradition Meets Technology
              </span>
            </div>

            <h1 className="font-western text-6xl md:text-7xl lg:text-8xl leading-none mb-8 text-[#3d2f1f] slide-in-left delay-1">
              WORK SMARTER,
              <br />
              <span className="text-[#c65d3b]">NOT HARDER</span>
            </h1>

            <p className="font-body text-2xl md:text-3xl text-[#3d2f1f]/80 mb-12 leading-relaxed max-w-3xl mx-auto slide-in-left delay-2">
              Satellite technology for working ranchers. Get daily grazing recommendations backed
              by orbital sensing and AI analysis. No guesswork, no complicated dashboards—just
              clear guidance for better land management.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center slide-in-left delay-3">
              <button className="px-10 py-5 rust-accent text-white font-slab text-lg font-bold hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-3 group">
                TRY THE DEMO
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-10 py-5 border-4 border-[#3d2f1f] text-[#3d2f1f] font-slab text-lg font-bold hover:bg-[#3d2f1f] hover:text-white transition-all">
                HOW IT WORKS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props - Western Cards */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-western text-5xl md:text-6xl mb-6 text-[#3d2f1f]">
              BUILT FOR THE RANCH
            </h2>
            <p className="font-body text-xl text-[#3d2f1f]/70 max-w-3xl mx-auto">
              Real solutions for real ranchers. Satellite sensing meets decades of grazing wisdom.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Mountain,
                title: 'See Every Acre',
                description:
                  'Satellite imagery shows vegetation health across your entire operation. Know which pastures are ready and which need rest—without walking every inch.',
                color: '#c65d3b',
              },
              {
                icon: Star,
                title: 'Daily Guidance',
                description:
                  'Wake up to a clear recommendation: where to move cattle today. AI analyzes land conditions overnight, you make the final call over morning coffee.',
                color: '#daa520',
              },
              {
                icon: Award,
                title: 'Your Land, Your Rules',
                description:
                  'Not some Silicon Valley autopilot. This is decision support—recommendations you can override with one tap. Your experience always takes priority.',
                color: '#4682b4',
              },
            ].map((card, idx) => {
              const Icon = card.icon
              return (
                <div
                  key={idx}
                  className="bg-[#f7f3ed] border-4 border-[#3d2f1f] p-8 hover:shadow-xl transition-all hover:-translate-y-2 leather-texture"
                >
                  <div
                    className="w-20 h-20 mb-6 flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon className="w-10 h-10" style={{ color: card.color }} />
                  </div>

                  <h3 className="font-western text-3xl mb-4 text-[#3d2f1f]">{card.title}</h3>

                  <p className="font-body text-lg text-[#3d2f1f]/70 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Heritage Section */}
      <section id="heritage" className="py-24 px-6 denim-overlay bg-[#4682b4]">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <div className="inline-block px-4 py-2 bg-white/20 border-2 border-white mb-6">
                <span className="font-slab text-sm uppercase tracking-wider font-bold">
                  Ranching Heritage
                </span>
              </div>

              <h2 className="font-western text-5xl md:text-6xl mb-8 leading-tight">
                RANCHERS HAVE ALWAYS
                <br />
                BEEN INNOVATORS
              </h2>

              <div className="space-y-6 font-body text-lg leading-relaxed text-white/90">
                <p>
                  From barbed wire to rotational grazing, ranching has a long history of adopting
                  tools that work. Satellite sensing is the latest chapter—technology that's finally
                  practical and affordable for working operations.
                </p>

                <p>
                  We're not replacing rangeland expertise. We're adding eyes in the sky to what you
                  already know about your land. It's like having a bird's-eye view of every pasture,
                  updated every few days, with AI doing the math so you don't have to.
                </p>

                <p className="font-bold">
                  This is modern ranching. Grounded in tradition, powered by technology.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm border-2 border-white p-8">
                <div className="font-western text-4xl text-white mb-2">10 METERS</div>
                <div className="font-body text-white/80">
                  Satellite resolution—see individual pastures clearly
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border-2 border-white p-8">
                <div className="font-western text-4xl text-white mb-2">5 DAYS</div>
                <div className="font-body text-white/80">
                  Fresh imagery frequency—track recovery in real-time
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border-2 border-white p-8">
                <div className="font-western text-4xl text-white mb-2">FREE DATA</div>
                <div className="font-body text-white/80">
                  Sentinel-2 imagery is publicly available—we just make it useful
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Simple Steps */}
      <section id="technology" className="py-24 px-6 bg-[#f7f3ed] leather-texture">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-western text-5xl md:text-6xl mb-6 text-[#3d2f1f]">
              THREE STEPS TO BETTER GRAZING
            </h2>
          </div>

          <div className="space-y-12">
            {[
              {
                number: '01',
                title: 'Satellites Scan Your Land',
                description:
                  'Every few days, Sentinel-2 satellites pass overhead and capture multispectral images of your ranch. We pull vegetation health data (NDVI), moisture levels (NDWI), and biomass indicators (EVI) automatically.',
              },
              {
                number: '02',
                title: 'AI Analyzes Conditions',
                description:
                  'Our decision engine processes the satellite data overnight. It looks at current vegetation levels, historical patterns, and your grazing history to identify which pastures are ready for cattle.',
              },
              {
                number: '03',
                title: 'You Get a Morning Recommendation',
                description:
                  "Open the app with your morning coffee. See a clear suggestion for today's grazing—which pasture, why it's ready, and how confident the system is. Approve it or override based on what you see on the ground.",
              },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rust-accent flex items-center justify-center border-4 border-[#3d2f1f]">
                    <span className="font-western text-5xl text-white">{step.number}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-western text-4xl mb-4 text-[#3d2f1f]">{step.title}</h3>
                  <p className="font-body text-xl text-[#3d2f1f]/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial - Ranch Hand Quote */}
      <section className="py-24 px-6 bg-[#3d2f1f]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="w-16 h-16 wheat-gold star-badge mx-auto mb-8" />

          <blockquote className="font-body text-3xl md:text-4xl italic leading-relaxed mb-8">
            "Finally, satellite tech that doesn't require a PhD to use. Just tells me where to graze
            and why. That's it."
          </blockquote>

          <div className="font-slab text-lg uppercase tracking-wider text-[#daa520]">
            — Beta Program Rancher
          </div>
        </div>
      </section>

      {/* CTA - Strong and Direct */}
      <section id="access" className="py-32 px-6 bg-gradient-to-br from-[#c65d3b] to-[#a94e31]">
        <div className="max-w-5xl mx-auto text-center text-white">
          <h2 className="font-western text-6xl md:text-7xl lg:text-8xl mb-8 leading-none">
            READY TO SADDLE UP?
          </h2>

          <p className="font-body text-2xl md:text-3xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Join the beta program and start getting satellite-backed grazing recommendations.
            Limited spots for working ranchers with rotational systems.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-12 py-6 bg-white text-[#c65d3b] font-western text-2xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-3 group">
              REQUEST BETA ACCESS
              <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-12 py-6 border-4 border-white text-white font-western text-2xl hover:bg-white hover:text-[#c65d3b] transition-all">
              VIEW DEMO
            </button>
          </div>

          <div className="mt-16 font-body text-lg opacity-90">
            No credit card required. No complicated setup. Just honest tech for honest work.
          </div>
        </div>
      </section>

      {/* Footer - Western Style */}
      <footer className="bg-[#3d2f1f] border-t-4 border-[#c65d3b]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 wheat-gold star-badge relative">
                  <Mountain className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <div className="font-western text-3xl text-white tracking-wider">OPENPASTURE</div>
                  <div className="font-body text-xs text-[#daa520]">Range Intelligence</div>
                </div>
              </div>
              <p className="font-body text-white/70 leading-relaxed max-w-md">
                Satellite-driven grazing intelligence for working ranchers. Built with respect for
                tradition and powered by modern technology.
              </p>
            </div>

            <div>
              <h4 className="font-slab font-bold text-white mb-4">Platform</h4>
              <ul className="space-y-2 font-body text-sm text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Beta Access
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-slab font-bold text-white mb-4">Resources</h4>
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

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-body text-sm text-white/50">
              © 2024 OpenPasture. Built for ranchers, by ranchers (with some tech help).
            </div>
            <div className="flex gap-6 font-body text-sm text-white/50">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
