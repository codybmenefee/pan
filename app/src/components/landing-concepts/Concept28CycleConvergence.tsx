export function Concept28CycleConvergence() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;900&family=Source+Code+Pro:wght@400;600&display=swap');

        .cycle-page {
          --primary: #c17a2e;
          --secondary: #5c8a58;
          --accent: #e85d4a;
          --dark: #1f1510;
          --light: #faf6f0;
          font-family: 'Outfit', sans-serif;
          background: var(--light);
          min-height: 100vh;
          color: var(--dark);
        }

        .mono {
          font-family: 'Source Code Pro', monospace;
        }

        /* Rotating circles background */
        .circles-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          overflow: hidden;
        }

        .rotation-circle {
          position: absolute;
          border: 3px solid;
          border-radius: 50%;
          opacity: 0.1;
          animation: rotate 30s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .circle-1 {
          width: 400px;
          height: 400px;
          top: 10%;
          left: 5%;
          border-color: var(--primary);
          animation-duration: 25s;
        }

        .circle-2 {
          width: 500px;
          height: 500px;
          top: 50%;
          right: 10%;
          border-color: var(--secondary);
          animation-duration: 35s;
          animation-direction: reverse;
        }

        .circle-3 {
          width: 350px;
          height: 350px;
          bottom: 15%;
          left: 40%;
          border-color: var(--accent);
          animation-duration: 30s;
        }

        /* Spiral overlay */
        .spiral-overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          transform: translate(-50%, -50%);
          z-index: 1;
          opacity: 0.05;
        }

        .spiral-line {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          height: 80%;
          background: linear-gradient(to bottom, var(--primary), transparent);
          transform-origin: top center;
          animation: spiral 20s linear infinite;
        }

        @keyframes spiral {
          from {
            transform: rotate(0deg) translateY(-50%);
          }
          to {
            transform: rotate(360deg) translateY(-50%);
          }
        }

        .content-layer {
          position: relative;
          z-index: 2;
        }

        /* Circular cards */
        .cycle-card {
          background: white;
          border: 3px solid var(--dark);
          padding: 40px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: visible;
        }

        .cycle-card::before {
          content: '';
          position: absolute;
          top: -6px;
          left: -6px;
          right: -6px;
          bottom: -6px;
          border-radius: inherit;
          border: 3px solid;
          border-color: transparent;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cycle-card:hover::before {
          border-color: var(--accent);
          transform: rotate(5deg);
        }

        .cycle-card:hover {
          transform: translateY(-8px) rotate(-2deg);
          box-shadow: 20px 20px 0 rgba(193, 122, 46, 0.2);
        }

        /* Circular progress indicator */
        .cycle-progress {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 4px solid var(--primary);
          position: relative;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }

        .cycle-progress::before {
          content: '';
          position: absolute;
          width: 140px;
          height: 140px;
          border: 2px solid var(--secondary);
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .cycle-progress-inner {
          width: 80%;
          height: 80%;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 1.5rem;
        }

        /* Timeline - linear and deterministic */
        .timeline {
          position: relative;
          padding: 40px 0;
          margin: 60px 0;
        }

        .timeline-line {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 4px;
          background: var(--dark);
          transform: translateY(-50%);
        }

        .timeline-points {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .timeline-point {
          width: 24px;
          height: 24px;
          background: white;
          border: 4px solid var(--dark);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .timeline-point:hover {
          transform: scale(1.5);
          background: var(--accent);
          border-color: var(--accent);
        }

        /* Convergence visualization */
        .convergence-viz {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 60px;
          align-items: center;
          margin: 80px 0;
        }

        .linear-side {
          text-align: right;
        }

        .linear-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-end;
        }

        .linear-bar {
          height: 8px;
          background: var(--dark);
          transition: all 0.3s ease;
        }

        .linear-bar:nth-child(1) { width: 100%; }
        .linear-bar:nth-child(2) { width: 85%; }
        .linear-bar:nth-child(3) { width: 70%; }
        .linear-bar:nth-child(4) { width: 55%; }
        .linear-bar:nth-child(5) { width: 40%; }

        .linear-bars:hover .linear-bar {
          background: var(--primary);
        }

        .circular-side {
          text-align: left;
        }

        .circular-rings {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .circular-ring {
          height: 60px;
          border: 3px solid;
          border-radius: 0 30px 30px 0;
          border-left: none;
          transition: all 0.3s ease;
          position: relative;
        }

        .circular-ring:nth-child(1) { width: 40%; border-color: var(--accent); }
        .circular-ring:nth-child(2) { width: 55%; border-color: var(--secondary); }
        .circular-ring:nth-child(3) { width: 70%; border-color: var(--primary); }
        .circular-ring:nth-child(4) { width: 85%; border-color: var(--secondary); }
        .circular-ring:nth-child(5) { width: 100%; border-color: var(--accent); }

        .circular-rings:hover .circular-ring {
          border-radius: 0 50% 50% 0;
        }

        .convergence-center {
          font-size: 4rem;
          color: var(--accent);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        /* Metric badge with rotation */
        .rotating-badge {
          display: inline-block;
          padding: 10px 20px;
          background: white;
          border: 3px solid var(--dark);
          font-weight: 700;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          position: relative;
        }

        .rotating-badge:hover {
          transform: rotate(-5deg);
          border-color: var(--accent);
          box-shadow: 8px 8px 0 rgba(193, 122, 46, 0.2);
        }

        /* CTA button */
        .cycle-cta {
          padding: 20px 48px;
          background: var(--dark);
          color: white;
          font-weight: 900;
          font-size: 1.2rem;
          border: 4px solid var(--dark);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .cycle-cta::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: var(--accent);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.5s ease, height 0.5s ease;
        }

        .cycle-cta:hover::before {
          width: 400px;
          height: 400px;
        }

        .cycle-cta:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
          box-shadow: 12px 12px 0 var(--accent);
        }

        .cycle-cta span {
          position: relative;
          z-index: 1;
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

      <div className="cycle-page">
        {/* Rotating circles background */}
        <div className="circles-bg">
          <div className="rotation-circle circle-1"></div>
          <div className="rotation-circle circle-2"></div>
          <div className="rotation-circle circle-3"></div>
        </div>

        {/* Spiral overlay */}
        <div className="spiral-overlay">
          <div className="spiral-line"></div>
        </div>

        <div className="content-layer">
          {/* Header */}
          <header className="px-6 py-8 fade-in fade-in-1">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-4 border-amber-700 rounded-full relative">
                  <div className="absolute inset-2 bg-green-700 rounded-full"></div>
                </div>
                <span className="text-2xl font-black">OpenPasture</span>
              </div>
              <nav className="flex items-center gap-8">
                <a href="#" className="text-sm font-bold hover:text-amber-700 transition-colors">Cycles</a>
                <a href="#" className="text-sm font-bold hover:text-amber-700 transition-colors">Systems</a>
                <a href="#" className="text-sm font-bold hover:text-amber-700 transition-colors">Evolution</a>
                <button className="px-6 py-3 bg-gray-900 text-white font-black border-4 border-gray-900 hover:bg-transparent hover:text-gray-900 transition-all">
                  JOIN
                </button>
              </nav>
            </div>
          </header>

          {/* Hero */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="max-w-5xl">
              <div className="flex items-center gap-4 mb-8 fade-in fade-in-2">
                <span className="rotating-badge mono">LINEAR TIME</span>
                <span className="text-3xl font-black text-red-600">⟳</span>
                <span className="rotating-badge mono">CIRCULAR CYCLES</span>
              </div>

              <h1 className="text-8xl font-black mb-8 leading-tight fade-in fade-in-3" style={{ letterSpacing: '-0.04em' }}>
                Where Metrics<br/>
                Meet <span style={{ color: 'var(--secondary)' }}>Natural</span><br/>
                <span style={{ color: 'var(--accent)' }}>Rhythms</span>
              </h1>

              <p className="text-2xl text-gray-700 mb-12 max-w-3xl leading-relaxed fade-in fade-in-4">
                Sentinel-2 captures linear snapshots. But your land moves in circles—seasons, growth cycles, regeneration loops.
                We transform timeline data into spiral intelligence.
              </p>

              <div className="flex gap-4 fade-in fade-in-5">
                <button className="cycle-cta">
                  <span>See The Spiral</span>
                </button>
              </div>
            </div>
          </section>

          {/* Convergence visualization */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <h2 className="text-5xl font-black mb-6 text-center">
              The Convergence
            </h2>
            <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
              Linear measurements converge into circular understanding
            </p>

            <div className="convergence-viz">
              <div className="linear-side">
                <h3 className="text-2xl font-black mb-6">Linear Input</h3>
                <div className="linear-bars">
                  <div className="linear-bar"></div>
                  <div className="linear-bar"></div>
                  <div className="linear-bar"></div>
                  <div className="linear-bar"></div>
                  <div className="linear-bar"></div>
                </div>
                <p className="text-sm text-gray-600 mt-4 mono">
                  TEMPORAL SNAPSHOTS<br/>
                  DISCRETE MEASUREMENTS<br/>
                  TIMELINE DATA
                </p>
              </div>

              <div className="convergence-center">⟳</div>

              <div className="circular-side">
                <h3 className="text-2xl font-black mb-6">Circular Output</h3>
                <div className="circular-rings">
                  <div className="circular-ring"></div>
                  <div className="circular-ring"></div>
                  <div className="circular-ring"></div>
                  <div className="circular-ring"></div>
                  <div className="circular-ring"></div>
                </div>
                <p className="text-sm text-gray-600 mt-4 mono">
                  SEASONAL CYCLES<br/>
                  GROWTH RHYTHMS<br/>
                  REGENERATION LOOPS
                </p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="cycle-card" style={{ borderRadius: '24px' }}>
              <h2 className="text-4xl font-black mb-12 text-center">Evolution Over Time</h2>

              <div className="timeline">
                <div className="timeline-line"></div>
                <div className="timeline-points">
                  {['JAN', 'APR', 'JUL', 'OCT', 'JAN'].map((month, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div className="timeline-point"></div>
                      <div className="mono text-xs mt-4 font-bold">{month}</div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-center text-gray-600 text-lg mt-8">
                Linear time becomes circular wisdom. Each season informs the next in an endless loop of learning.
              </p>
            </div>
          </section>

          {/* Features */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="cycle-card" style={{ borderRadius: '0' }}>
                <div className="cycle-progress">
                  <div className="cycle-progress-inner">1</div>
                </div>
                <h3 className="text-2xl font-black mb-4 text-center">Capture</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Sentinel-2 satellites capture precise moments in time. NDVI, EVI, NDWI—discrete snapshots along a timeline.
                </p>
              </div>

              <div className="cycle-card" style={{ borderRadius: '0' }}>
                <div className="cycle-progress">
                  <div className="cycle-progress-inner">2</div>
                </div>
                <h3 className="text-2xl font-black mb-4 text-center">Connect</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  LLM reasoning layers discover circular patterns. Timeline points connect into seasonal loops and growth spirals.
                </p>
              </div>

              <div className="cycle-card" style={{ borderRadius: '0' }}>
                <div className="cycle-progress">
                  <div className="cycle-progress-inner">3</div>
                </div>
                <h3 className="text-2xl font-black mb-4 text-center">Cycle</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Daily recommendations that understand rotation. Intelligence that breathes with seasons and honors natural rhythms.
                </p>
              </div>
            </div>
          </section>

          {/* Philosophy */}
          <section className="px-6 py-24 max-w-5xl mx-auto">
            <div className="cycle-card" style={{ borderRadius: '32px' }}>
              <h2 className="text-4xl font-black mb-8">Spiral Intelligence</h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  Nature thinks in circles. Seasons cycle. Plants regenerate. Soil rebuilds. Ecosystems spiral through succession.
                </p>
                <p>
                  But our measurement tools are linear. Timestamps. Datasets. Timelines. We capture moments, not rhythms.
                </p>
                <p>
                  OpenPasture bridges this gap. We take linear satellite data and transform it into circular understanding.
                  Timeline becomes spiral. History becomes prophecy. Past and future converge in an eternal return.
                </p>
                <p>
                  The result: grazing intelligence that honors both the precision of satellites and the wisdom of seasons.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-24 max-w-7xl mx-auto text-center">
            <h2 className="text-6xl font-black mb-8">
              Break The Line.<br/>
              <span style={{ color: 'var(--accent)' }}>Join The Cycle.</span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Transform your grazing intelligence from timeline to spiral.
            </p>
            <button className="cycle-cta">
              <span>Start Your Cycle</span>
            </button>
          </section>

          {/* Footer */}
          <footer className="px-6 py-12 border-t-4 border-gray-900 mt-20">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-sm text-gray-600 mono font-bold">© 2024 OpenPasture</div>
              <div className="flex gap-6 text-sm font-black text-gray-600">
                <a href="#" className="hover:text-amber-700 transition-colors">Cycles</a>
                <a href="#" className="hover:text-amber-700 transition-colors">Docs</a>
                <a href="#" className="hover:text-amber-700 transition-colors">GitHub</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
