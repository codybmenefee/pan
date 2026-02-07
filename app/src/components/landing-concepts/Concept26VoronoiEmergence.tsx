export function Concept26VoronoiEmergence() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .voronoi-page {
          --primary: #1a4d2e;
          --secondary: #4f9d69;
          --accent: #ffd93d;
          --dark: #0d1f16;
          --light: #f0f4f1;
          font-family: 'Syne', sans-serif;
          background: var(--light);
          min-height: 100vh;
          color: var(--dark);
        }

        .mono {
          font-family: 'IBM Plex Mono', monospace;
        }

        /* Animated Voronoi diagram background */
        .voronoi-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          overflow: hidden;
        }

        .voronoi-cell {
          position: absolute;
          border: 2px solid var(--primary);
          opacity: 0.15;
          transition: all 2s ease-in-out;
          clip-path: polygon(
            50% 0%,
            100% 25%,
            100% 75%,
            50% 100%,
            0% 75%,
            0% 25%
          );
          animation: cellGrow 15s ease-in-out infinite;
        }

        @keyframes cellGrow {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.2) rotate(5deg);
          }
        }

        .voronoi-cell:nth-child(1) {
          top: 10%;
          left: 20%;
          width: 300px;
          height: 300px;
          border-color: var(--secondary);
          animation-delay: 0s;
        }

        .voronoi-cell:nth-child(2) {
          top: 40%;
          right: 15%;
          width: 400px;
          height: 400px;
          border-color: var(--accent);
          animation-delay: 3s;
        }

        .voronoi-cell:nth-child(3) {
          bottom: 15%;
          left: 30%;
          width: 350px;
          height: 350px;
          border-color: var(--primary);
          animation-delay: 6s;
        }

        .voronoi-cell:nth-child(4) {
          top: 60%;
          left: 5%;
          width: 250px;
          height: 250px;
          border-color: var(--secondary);
          animation-delay: 9s;
        }

        .voronoi-cell:nth-child(5) {
          top: 5%;
          right: 25%;
          width: 280px;
          height: 280px;
          border-color: var(--primary);
          animation-delay: 12s;
        }

        .content-layer {
          position: relative;
          z-index: 1;
        }

        /* Organic cards that look like natural cells */
        .organic-card {
          background: white;
          border: 3px solid var(--primary);
          padding: 32px;
          position: relative;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          clip-path: polygon(
            0% 5%,
            5% 0%,
            95% 0%,
            100% 5%,
            100% 95%,
            95% 100%,
            5% 100%,
            0% 95%
          );
        }

        .organic-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg,
            rgba(79, 157, 105, 0.1) 0%,
            rgba(255, 217, 61, 0.1) 100%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .organic-card:hover::before {
          opacity: 1;
        }

        .organic-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 60px rgba(26, 77, 46, 0.2);
          border-color: var(--secondary);
        }

        /* Coordinate system - sharp, deterministic points */
        .coord-point {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: var(--accent);
          position: relative;
          margin: 0 4px;
          animation: coordPulse 2s ease-in-out infinite;
        }

        @keyframes coordPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 var(--accent);
          }
          50% {
            box-shadow: 0 0 0 8px transparent;
          }
        }

        /* Propagation rings - showing emergence */
        .propagation-ring {
          border: 2px solid var(--secondary);
          border-radius: 50%;
          opacity: 0;
          animation: propagate 3s ease-out infinite;
        }

        @keyframes propagate {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Growth ring indicator */
        .growth-rings {
          width: 120px;
          height: 120px;
          position: relative;
          margin: 0 auto;
        }

        .ring {
          position: absolute;
          border: 2px solid var(--primary);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.3;
        }

        .ring-1 { width: 40px; height: 40px; }
        .ring-2 { width: 70px; height: 70px; }
        .ring-3 { width: 100px; height: 100px; }
        .ring-4 { width: 120px; height: 120px; opacity: 0.15; }

        /* Tessellation pattern */
        .tessellation {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          height: 80px;
          margin: 20px 0;
        }

        .hex {
          background: linear-gradient(135deg, var(--secondary), var(--primary));
          clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
          opacity: 0;
          animation: hexAppear 0.6s ease forwards;
        }

        .hex:nth-child(1) { animation-delay: 0.05s; }
        .hex:nth-child(2) { animation-delay: 0.1s; }
        .hex:nth-child(3) { animation-delay: 0.15s; }
        .hex:nth-child(4) { animation-delay: 0.2s; }
        .hex:nth-child(5) { animation-delay: 0.25s; }
        .hex:nth-child(6) { animation-delay: 0.3s; }
        .hex:nth-child(7) { animation-delay: 0.35s; }
        .hex:nth-child(8) { animation-delay: 0.4s; }

        @keyframes hexAppear {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 0.6;
            transform: scale(1);
          }
        }

        /* Sharp badge */
        .sharp-badge {
          display: inline-block;
          padding: 8px 16px;
          background: var(--accent);
          color: var(--dark);
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 1px;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }

        /* CTA button with organic hover */
        .organic-cta {
          padding: 18px 40px;
          background: var(--primary);
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
          clip-path: polygon(
            0% 8%,
            8% 0%,
            92% 0%,
            100% 8%,
            100% 92%,
            92% 100%,
            8% 100%,
            0% 92%
          );
        }

        .organic-cta::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 217, 61, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s ease, height 0.6s ease;
        }

        .organic-cta:hover::before {
          width: 400px;
          height: 400px;
        }

        .organic-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 40px rgba(26, 77, 46, 0.3);
        }

        /* Fade in animations */
        .fade-in {
          animation: fadeInUp 0.8s ease forwards;
          opacity: 0;
        }

        .fade-in-1 { animation-delay: 0.1s; }
        .fade-in-2 { animation-delay: 0.2s; }
        .fade-in-3 { animation-delay: 0.3s; }
        .fade-in-4 { animation-delay: 0.4s; }
        .fade-in-5 { animation-delay: 0.5s; }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="voronoi-page">
        {/* Voronoi cell background */}
        <div className="voronoi-bg">
          <div className="voronoi-cell"></div>
          <div className="voronoi-cell"></div>
          <div className="voronoi-cell"></div>
          <div className="voronoi-cell"></div>
          <div className="voronoi-cell"></div>
        </div>

        <div className="content-layer">
          {/* Header */}
          <header className="px-6 py-8 fade-in fade-in-1">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-green-500" style={{
                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                }}></div>
                <span className="text-2xl font-bold">OpenPasture</span>
              </div>
              <nav className="flex items-center gap-8">
                <a href="#" className="text-sm font-medium hover:text-green-700 transition-colors">Emergence</a>
                <a href="#" className="text-sm font-medium hover:text-green-700 transition-colors">Systems</a>
                <a href="#" className="text-sm font-medium hover:text-green-700 transition-colors">Science</a>
                <button className="sharp-badge">
                  JOIN BETA
                </button>
              </nav>
            </div>
          </header>

          {/* Hero */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-8 fade-in fade-in-2">
                <div className="coord-point"></div>
                <div className="coord-point"></div>
                <div className="coord-point"></div>
                <span className="mono text-sm text-green-700">COORDINATE SYSTEM → LIVING TESSELLATION</span>
              </div>

              <h1 className="text-8xl font-extrabold mb-8 leading-tight fade-in fade-in-3" style={{ letterSpacing: '-0.02em' }}>
                Natural Patterns<br/>
                From <span style={{ color: 'var(--secondary)' }}>Satellite Points</span>
              </h1>

              <p className="text-2xl text-gray-700 mb-10 max-w-2xl leading-relaxed fade-in fade-in-4">
                Like cells dividing or territories forming, Voronoi tessellation emerges from discrete coordinates.
                Your pasture becomes a living organism, each zone influencing its neighbors.
              </p>

              {/* Tessellation pattern */}
              <div className="tessellation fade-in fade-in-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="hex"></div>
                ))}
              </div>

              <div className="flex gap-4 mt-10 fade-in fade-in-5">
                <button className="organic-cta">
                  Watch Emergence
                </button>
                <button className="px-10 py-4 border-3 border-green-800 font-semibold hover:bg-green-50 transition-all">
                  Read Research
                </button>
              </div>
            </div>
          </section>

          {/* How it emerges */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold mb-16 text-center">
              From Points to Patterns
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="organic-card">
                <div className="growth-rings mb-6">
                  <div className="ring ring-1"></div>
                  <div className="ring ring-2"></div>
                  <div className="ring ring-3"></div>
                  <div className="ring ring-4"></div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '12px',
                    height: '12px',
                    background: 'var(--accent)',
                    borderRadius: '50%'
                  }}></div>
                </div>
                <h3 className="text-xl font-bold mb-3">Seed Points</h3>
                <p className="text-gray-600 mb-4">
                  Start with GPS coordinates. Each satellite pixel becomes a seed from which zones grow and territories form.
                </p>
                <div className="mono text-xs text-green-700">10M RESOLUTION • 13 SPECTRAL BANDS</div>
              </div>

              <div className="organic-card">
                <div style={{
                  position: 'relative',
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 24px'
                }}>
                  <div className="propagation-ring" style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    animationDelay: '0s'
                  }}></div>
                  <div className="propagation-ring" style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    animationDelay: '1s'
                  }}></div>
                  <div className="propagation-ring" style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    animationDelay: '2s'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                  }}></div>
                </div>
                <h3 className="text-xl font-bold mb-3">Propagation</h3>
                <p className="text-gray-600 mb-4">
                  Influence radiates outward. Boundaries form where competing influences meet, creating natural management zones.
                </p>
                <div className="mono text-xs text-green-700">EMERGENT BEHAVIOR • SELF-ORGANIZING</div>
              </div>

              <div className="organic-card">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 24px'
                }}>
                  {[...Array(9)].map((_, i) => (
                    <div key={i} style={{
                      background: `linear-gradient(${i * 40}deg, var(--secondary), var(--primary))`,
                      clipPath: i % 2 === 0
                        ? 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                        : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                      opacity: 0.7
                    }}></div>
                  ))}
                </div>
                <h3 className="text-xl font-bold mb-3">Living Tessellation</h3>
                <p className="text-gray-600 mb-4">
                  Your land becomes a cellular organism. Each zone breathes with vegetation cycles, influencing neighbors through time.
                </p>
                <div className="mono text-xs text-green-700">DYNAMIC • ADAPTIVE • ORGANIC</div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="organic-card max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-6">Intelligence That Grows</h2>
              <p className="text-xl text-gray-700 mb-10 leading-relaxed">
                We don't impose rigid grids on your land. Instead, we let natural patterns emerge from the data itself.
                Voronoi tessellation turns satellite coordinates into living territories that respect natural boundaries
                and influence patterns.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-green-50 rounded-lg">
                  <h4 className="font-bold text-lg mb-2">Deterministic Input</h4>
                  <p className="text-gray-600 mb-3">GPS coordinates, NDVI values, fixed timestamps</p>
                  <div className="mono text-xs text-green-700">SHARP • DISCRETE • MEASURED</div>
                </div>
                <div className="p-6 bg-yellow-50 rounded-lg">
                  <h4 className="font-bold text-lg mb-2">Organic Output</h4>
                  <p className="text-gray-600 mb-3">Living zones, probabilistic growth, natural territories</p>
                  <div className="mono text-xs text-yellow-700">SOFT • CONTINUOUS • EMERGENT</div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-24 max-w-7xl mx-auto text-center">
            <h2 className="text-6xl font-extrabold mb-8">
              Watch Your Land<br/>
              <span style={{ color: 'var(--secondary)' }}>Come Alive</span>
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
              Join ranchers discovering natural patterns in their pastures through emergent intelligence.
            </p>
            <button className="organic-cta">
              Start Growing
            </button>
          </section>

          {/* Footer */}
          <footer className="px-6 py-12 border-t-4 border-green-800/20 mt-20">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-sm text-gray-600 mono">© 2024 OpenPasture • Emergent Systems</div>
              <div className="flex gap-6 text-sm font-medium text-gray-600">
                <a href="#" className="hover:text-green-700 transition-colors">Research</a>
                <a href="#" className="hover:text-green-700 transition-colors">Docs</a>
                <a href="#" className="hover:text-green-700 transition-colors">Open Source</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
