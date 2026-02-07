export function Concept29MatrixOrganics() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;600;900&family=Newsreader:wght@400;600&display=swap');

        .matrix-page {
          --primary: #00ff41;
          --secondary: #008f11;
          --accent: #39ff14;
          --dark: #0a0e0a;
          --darker: #030503;
          --light: #e8ffe8;
          font-family: 'Newsreader', serif;
          background: var(--dark);
          min-height: 100vh;
          color: var(--primary);
          overflow-x: hidden;
        }

        .mono {
          font-family: 'Azeret Mono', monospace;
        }

        /* Matrix rain background */
        .matrix-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          overflow: hidden;
        }

        .matrix-column {
          position: absolute;
          top: -100%;
          font-family: 'Azeret Mono', monospace;
          font-size: 16px;
          color: var(--primary);
          opacity: 0.7;
          white-space: pre;
          line-height: 1.2;
          animation: matrixFall linear infinite;
        }

        @keyframes matrixFall {
          to {
            top: 100%;
          }
        }

        .matrix-column:nth-child(1) { left: 5%; animation-duration: 15s; animation-delay: 0s; }
        .matrix-column:nth-child(2) { left: 15%; animation-duration: 12s; animation-delay: 2s; opacity: 0.5; }
        .matrix-column:nth-child(3) { left: 25%; animation-duration: 18s; animation-delay: 4s; }
        .matrix-column:nth-child(4) { left: 35%; animation-duration: 14s; animation-delay: 1s; opacity: 0.6; }
        .matrix-column:nth-child(5) { left: 45%; animation-duration: 16s; animation-delay: 3s; }
        .matrix-column:nth-child(6) { left: 55%; animation-duration: 13s; animation-delay: 5s; opacity: 0.5; }
        .matrix-column:nth-child(7) { left: 65%; animation-duration: 17s; animation-delay: 2s; }
        .matrix-column:nth-child(8) { left: 75%; animation-duration: 15s; animation-delay: 4s; opacity: 0.6; }
        .matrix-column:nth-child(9) { left: 85%; animation-duration: 19s; animation-delay: 1s; }
        .matrix-column:nth-child(10) { left: 95%; animation-duration: 14s; animation-delay: 3s; opacity: 0.5; }

        /* Organic overlay that grows */
        .organic-overlay {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40%;
          z-index: 1;
          background: linear-gradient(to top,
            var(--dark) 0%,
            rgba(10, 14, 10, 0.8) 50%,
            transparent 100%
          );
          pointer-events: none;
        }

        .content-layer {
          position: relative;
          z-index: 2;
        }

        /* Data terminal styling */
        .terminal-card {
          background: var(--darker);
          border: 2px solid var(--primary);
          font-family: 'Azeret Mono', monospace;
          padding: 24px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
        }

        .terminal-card::before {
          content: '> _';
          position: absolute;
          top: 8px;
          right: 16px;
          font-size: 12px;
          color: var(--accent);
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        .terminal-card:hover {
          border-color: var(--accent);
          box-shadow: 0 0 40px rgba(57, 255, 20, 0.5);
          transform: translateY(-4px);
        }

        /* Organic card that grows */
        .organic-card {
          background: linear-gradient(135deg,
            rgba(0, 255, 65, 0.05) 0%,
            rgba(0, 143, 17, 0.1) 100%
          );
          border: 2px solid var(--secondary);
          border-radius: 24px;
          padding: 40px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .organic-card::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: radial-gradient(circle,
            rgba(0, 255, 65, 0.1) 0%,
            transparent 70%
          );
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.8s ease, height 0.8s ease;
        }

        .organic-card:hover::before {
          width: 500px;
          height: 500px;
        }

        .organic-card:hover {
          border-radius: 48px;
          border-color: var(--accent);
          transform: scale(1.02);
        }

        /* Transformation visualization */
        .transform-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          margin: 80px 0;
          align-items: stretch;
        }

        .code-block {
          background: var(--darker);
          border: 2px solid var(--primary);
          padding: 24px;
          font-family: 'Azeret Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: var(--primary);
          position: relative;
          overflow: hidden;
        }

        .code-line {
          margin: 4px 0;
          opacity: 0;
          animation: codeFadeIn 0.5s ease forwards;
        }

        .code-line:nth-child(1) { animation-delay: 0.1s; }
        .code-line:nth-child(2) { animation-delay: 0.2s; }
        .code-line:nth-child(3) { animation-delay: 0.3s; }
        .code-line:nth-child(4) { animation-delay: 0.4s; }
        .code-line:nth-child(5) { animation-delay: 0.5s; }
        .code-line:nth-child(6) { animation-delay: 0.6s; }
        .code-line:nth-child(7) { animation-delay: 0.7s; }

        @keyframes codeFadeIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .nature-block {
          display: flex;
          flex-direction: column;
          justify-content: center;
          font-family: 'Newsreader', serif;
          font-size: 18px;
          line-height: 1.8;
          color: var(--light);
        }

        /* Growing vine decoration */
        .vine {
          position: absolute;
          width: 4px;
          background: linear-gradient(to bottom,
            var(--secondary) 0%,
            var(--accent) 100%
          );
          left: 0;
          top: 0;
          height: 0;
          animation: vineGrow 2s ease-out forwards;
        }

        @keyframes vineGrow {
          to { height: 100%; }
        }

        /* Scanline effect */
        .scanline {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
          opacity: 0.3;
          animation: scan 6s linear infinite;
          z-index: 999;
          pointer-events: none;
        }

        @keyframes scan {
          from { top: 0; }
          to { top: 100%; }
        }

        /* Terminal badge */
        .terminal-badge {
          display: inline-block;
          padding: 6px 12px;
          background: var(--darker);
          border: 1px solid var(--primary);
          font-family: 'Azeret Mono', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          color: var(--primary);
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .terminal-badge:hover {
          background: var(--primary);
          color: var(--darker);
          box-shadow: 0 0 20px var(--primary);
        }

        /* Organic badge */
        .organic-badge {
          display: inline-block;
          padding: 8px 16px;
          background: linear-gradient(135deg,
            rgba(0, 255, 65, 0.2),
            rgba(0, 143, 17, 0.2)
          );
          border: 1px solid var(--secondary);
          border-radius: 20px;
          font-family: 'Newsreader', serif;
          font-size: 14px;
          color: var(--light);
          transition: all 0.3s ease;
        }

        .organic-badge:hover {
          border-radius: 8px;
          border-color: var(--accent);
          background: linear-gradient(135deg,
            rgba(57, 255, 20, 0.3),
            rgba(0, 255, 65, 0.3)
          );
        }

        /* CTA button */
        .matrix-cta {
          padding: 18px 40px;
          background: var(--darker);
          color: var(--primary);
          font-family: 'Azeret Mono', monospace;
          font-weight: 900;
          font-size: 1rem;
          border: 3px solid var(--primary);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .matrix-cta::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: var(--primary);
          transition: left 0.3s ease;
        }

        .matrix-cta:hover::before {
          left: 0;
        }

        .matrix-cta:hover {
          color: var(--darker);
          box-shadow: 0 0 30px var(--primary);
        }

        .matrix-cta span {
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

      <div className="matrix-page">
        {/* Scanline effect */}
        <div className="scanline"></div>

        {/* Matrix rain background */}
        <div className="matrix-bg">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="matrix-column">
              {`NDVI\n0.87\nLAT\n45.2\nLON\n-93\nEVI\n0.92\nNDWI\n0.15\nVEG\nPIXEL\nDATA\nSAT\nNDVI\n0.87`}
            </div>
          ))}
        </div>

        {/* Organic overlay */}
        <div className="organic-overlay"></div>

        <div className="content-layer">
          {/* Header */}
          <header className="px-6 py-8 fade-in fade-in-1">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-green-500 bg-black flex items-center justify-center">
                  <span className="mono text-green-500 text-xs font-bold">OP</span>
                </div>
                <span className="mono text-xl font-black">OpenPasture</span>
              </div>
              <nav className="flex items-center gap-8">
                <a href="#" className="text-sm mono hover:text-accent transition-colors">SYSTEM</a>
                <a href="#" className="text-sm mono hover:text-accent transition-colors">MATRIX</a>
                <a href="#" className="text-sm mono hover:text-accent transition-colors">DOCS</a>
                <button className="terminal-badge">
                  ACCESS
                </button>
              </nav>
            </div>
          </header>

          {/* Hero */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="max-w-5xl">
              <div className="flex items-center gap-4 mb-8 fade-in fade-in-2">
                <span className="terminal-badge">DATA STREAMS</span>
                <span className="text-2xl">→</span>
                <span className="organic-badge">Living Systems</span>
              </div>

              <h1 className="mb-8 leading-tight fade-in fade-in-3" style={{
                fontSize: '7rem',
                fontFamily: 'Azeret Mono, monospace',
                fontWeight: 900,
                letterSpacing: '-0.03em'
              }}>
                CODE<br/>
                BECOMES<br/>
                <span style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', color: 'var(--accent)' }}>
                  Nature
                </span>
              </h1>

              <p className="text-2xl mb-12 max-w-3xl leading-relaxed fade-in fade-in-4" style={{
                color: 'var(--light)',
                fontFamily: 'Newsreader, serif'
              }}>
                Watch as terminal data streams—cold pixels and coordinates—transform into warm, breathing intelligence.
                Your pasture emerges from the matrix.
              </p>

              <div className="flex gap-4 fade-in fade-in-5">
                <button className="matrix-cta">
                  <span>Enter System</span>
                </button>
              </div>
            </div>
          </section>

          {/* Transformation */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <h2 className="text-5xl font-black mono mb-6 text-center">
              THE TRANSFORMATION
            </h2>
            <p className="text-xl text-center mb-16 max-w-3xl mx-auto" style={{
              color: 'var(--light)',
              fontFamily: 'Newsreader, serif'
            }}>
              Data enters as code. Intelligence emerges as nature.
            </p>

            <div className="transform-container">
              <div className="code-block">
                <div className="code-line">{"{"}</div>
                <div className="code-line">{"  \"ndvi\": 0.8745,"}</div>
                <div className="code-line">{"  \"evi\": 0.9234,"}</div>
                <div className="code-line">{"  \"ndwi\": 0.1567,"}</div>
                <div className="code-line">{"  \"lat\": 45.2891,"}</div>
                <div className="code-line">{"  \"lon\": -93.4567"}</div>
                <div className="code-line">{"}"}</div>
              </div>

              <div className="nature-block">
                <div className="vine"></div>
                <p style={{ marginBottom: '1.5rem' }}>
                  The north pasture breathes deeply today. Vegetation pulses with late spring vigor.
                </p>
                <p style={{ marginBottom: '1.5rem' }}>
                  Soil moisture speaks of recent rains. The land invites grazing but asks for gentleness.
                </p>
                <p>
                  Consider three days here, then rest. Let regeneration spiral through summer.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="terminal-card">
                <h3 className="text-xl font-black mb-4 mono">INPUT: MATRIX</h3>
                <div className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--light)' }}>
                  <div className="mb-2">NDVI: 0.8745</div>
                  <div className="mb-2">EVI: 0.9234</div>
                  <div className="mb-2">NDWI: 0.1567</div>
                  <div className="mb-2">COORDS: 45.28, -93.45</div>
                  <div>TIMESTAMP: 2024-06-15</div>
                </div>
                <div className="terminal-badge" style={{ fontSize: '9px' }}>DETERMINISTIC</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1), rgba(0, 143, 17, 0.15))',
                border: '2px solid var(--secondary)',
                padding: '32px',
                borderRadius: '16px',
                transition: 'all 0.4s ease'
              }}>
                <h3 className="text-xl font-black mb-4 mono">PROCESS: LLM</h3>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--light)', fontFamily: 'Newsreader, serif' }}>
                  Layers of reasoning transform cold numbers into warm understanding. Context emerges. Patterns breathe.
                  The system learns to see.
                </p>
                <div className="organic-badge">Emergence</div>
              </div>

              <div className="organic-card">
                <h3 className="text-xl font-black mb-4" style={{ fontFamily: 'Newsreader, serif' }}>OUTPUT: NATURE</h3>
                <p className="text-sm leading-relaxed" style={{
                  color: 'var(--light)',
                  fontFamily: 'Newsreader, serif',
                  fontStyle: 'italic'
                }}>
                  "Your north pasture shows vibrant growth. Consider grazing now, but leave 40% ungrazed.
                  Return in 35 days when the land calls again."
                </p>
                <div className="organic-badge mt-4">Probabilistic</div>
              </div>
            </div>
          </section>

          {/* Philosophy */}
          <section className="px-6 py-24 max-w-5xl mx-auto">
            <div className="organic-card">
              <h2 className="text-4xl font-black mb-8" style={{ fontFamily: 'Newsreader, serif' }}>
                The Matrix of Nature
              </h2>
              <div className="space-y-6 text-lg leading-relaxed" style={{
                color: 'var(--light)',
                fontFamily: 'Newsreader, serif'
              }}>
                <p>
                  All intelligence begins as data. Streams of numbers flowing through silicon. The matrix of measurement.
                </p>
                <p>
                  But somewhere in the transformation—between input and output, between code and comprehension—something
                  magical happens. The discrete becomes continuous. The deterministic becomes probabilistic. The artificial
                  becomes natural.
                </p>
                <p>
                  This is not AI pretending to understand nature. This is nature speaking through AI. The satellite data
                  carries real signals from real plants, real soil, real cycles. We simply translate the language.
                </p>
                <p>
                  Code becomes nature. The matrix becomes organic. And your grazing decisions feel less like following
                  algorithms and more like listening to the land.
                </p>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <h2 className="text-5xl font-black mono mb-16 text-center">
              SYSTEM ARCHITECTURE
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="terminal-card">
                <h3 className="text-lg font-black mb-4">01. DATA INGESTION</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--light)' }}>
                  Sentinel-2 satellite imagery flows in: 13 spectral bands, 10m resolution, 5-day revisit cycles.
                  Raw pixels become structured data arrays.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="terminal-badge">NDVI</span>
                  <span className="terminal-badge">EVI</span>
                  <span className="terminal-badge">NDWI</span>
                </div>
              </div>

              <div className="terminal-card">
                <h3 className="text-lg font-black mb-4">02. FEATURE EXTRACTION</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--light)' }}>
                  Vegetation indices, moisture content, biomass estimates. Mathematical transformations
                  extract meaningful signals from spectral noise.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="terminal-badge">POLYGONS</span>
                  <span className="terminal-badge">VECTORS</span>
                  <span className="terminal-badge">METRICS</span>
                </div>
              </div>

              <div className="organic-card">
                <h3 className="text-lg font-black mb-4" style={{ fontFamily: 'Newsreader, serif' }}>
                  03. Contextual Reasoning
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--light)', fontFamily: 'Newsreader, serif' }}>
                  LLM layers add temporal context, seasonal patterns, regional knowledge. Numbers become narratives.
                  Data becomes understanding.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="organic-badge">Context</span>
                  <span className="organic-badge">Memory</span>
                  <span className="organic-badge">Wisdom</span>
                </div>
              </div>

              <div className="organic-card">
                <h3 className="text-lg font-black mb-4" style={{ fontFamily: 'Newsreader, serif' }}>
                  04. Probabilistic Output
                </h3>
                <p className="text-sm mb-4" style={{
                  color: 'var(--light)',
                  fontFamily: 'Newsreader, serif',
                  fontStyle: 'italic'
                }}>
                  Daily recommendations that honor uncertainty. Confidence gradients instead of binary commands.
                  Intelligence that breathes with the land.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="organic-badge">Prediction</span>
                  <span className="organic-badge">Confidence</span>
                  <span className="organic-badge">Flow</span>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-24 max-w-7xl mx-auto text-center">
            <h2 className="mb-8 leading-tight" style={{
              fontSize: '5rem',
              fontFamily: 'Azeret Mono, monospace',
              fontWeight: 900
            }}>
              JACK IN
            </h2>
            <p className="text-xl mb-12 max-w-2xl mx-auto" style={{
              color: 'var(--light)',
              fontFamily: 'Newsreader, serif'
            }}>
              Transform your grazing data into living intelligence
            </p>
            <button className="matrix-cta">
              <span>Request Access</span>
            </button>
          </section>

          {/* Footer */}
          <footer className="px-6 py-12 border-t-2 border-green-900 mt-20">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-sm mono">© 2024 OpenPasture</div>
              <div className="flex gap-6 text-sm mono">
                <a href="#" className="hover:text-accent transition-colors">DOCS</a>
                <a href="#" className="hover:text-accent transition-colors">API</a>
                <a href="#" className="hover:text-accent transition-colors">GITHUB</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
