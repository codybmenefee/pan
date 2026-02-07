export function Concept25ProbabilityField() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap');

        .probability-field-page {
          --primary: #2a5d67;
          --secondary: #ff6b35;
          --accent: #00d9ff;
          --dark: #0a1612;
          --light: #f5f7f6;
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg,
            #0a1612 0%,
            #1a2d27 25%,
            #2a5d67 50%,
            #1a2d27 75%,
            #0a1612 100%
          );
          min-height: 100vh;
          color: white;
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        /* Animated probability heat map background */
        .probability-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.4;
          z-index: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(0, 217, 255, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 107, 53, 0.5) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(42, 93, 103, 0.7) 0%, transparent 50%),
            radial-gradient(circle at 60% 20%, rgba(0, 217, 255, 0.4) 0%, transparent 50%);
          background-size: 200% 200%;
          animation: probabilityFlow 20s ease-in-out infinite;
          filter: blur(60px);
        }

        @keyframes probabilityFlow {
          0%, 100% {
            background-position: 0% 0%, 100% 100%, 50% 50%, 75% 25%;
          }
          50% {
            background-position: 100% 100%, 0% 0%, 25% 75%, 50% 50%;
          }
        }

        /* Grid overlay - represents deterministic input structure */
        .grid-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          opacity: 0.1;
          background-image:
            linear-gradient(rgba(0, 217, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.3) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .content-layer {
          position: relative;
          z-index: 2;
        }

        /* Probability cards with blur transition */
        .prob-card {
          background: rgba(10, 22, 18, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 2px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .prob-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg,
            transparent,
            rgba(0, 217, 255, 0.1),
            transparent
          );
          transition: left 0.6s ease;
        }

        .prob-card:hover::before {
          left: 100%;
        }

        .prob-card:hover {
          border-color: rgba(0, 217, 255, 0.6);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0, 217, 255, 0.2);
        }

        /* Heat map indicator */
        .heat-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
          position: relative;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 currentColor;
            opacity: 1;
          }
          50% {
            box-shadow: 0 0 0 8px transparent;
            opacity: 0.8;
          }
        }

        .heat-high { color: var(--secondary); }
        .heat-med { color: var(--accent); }
        .heat-low { color: var(--primary); }

        /* Probability distribution bars */
        .prob-dist {
          display: flex;
          gap: 2px;
          height: 60px;
          align-items: flex-end;
          margin: 20px 0;
        }

        .prob-bar {
          flex: 1;
          background: linear-gradient(to top, var(--accent), var(--secondary));
          opacity: 0.7;
          transition: all 0.3s ease;
          border-radius: 2px 2px 0 0;
          position: relative;
        }

        .prob-bar:hover {
          opacity: 1;
          transform: scaleY(1.1);
        }

        /* Metric badge with sharp edges */
        .metric-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 2px;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .metric-badge:hover {
          background: rgba(0, 217, 255, 0.2);
          border-color: rgba(0, 217, 255, 0.6);
        }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, var(--accent), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* CTA with probability glow */
        .prob-cta {
          background: var(--accent);
          color: var(--dark);
          padding: 16px 32px;
          border: none;
          border-radius: 2px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .prob-cta::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .prob-cta:hover::after {
          width: 300px;
          height: 300px;
        }

        .prob-cta:hover {
          box-shadow: 0 0 40px rgba(0, 217, 255, 0.6);
          transform: translateY(-2px);
        }

        /* Staggered fade-in animations */
        .fade-in {
          animation: fadeInUp 0.8s ease forwards;
          opacity: 0;
        }

        .fade-in-1 { animation-delay: 0.1s; }
        .fade-in-2 { animation-delay: 0.2s; }
        .fade-in-3 { animation-delay: 0.3s; }
        .fade-in-4 { animation-delay: 0.4s; }
        .fade-in-5 { animation-delay: 0.5s; }
        .fade-in-6 { animation-delay: 0.6s; }

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

        /* Sharp corners for deterministic elements, soft for probabilistic */
        .sharp { border-radius: 0; }
        .soft { border-radius: 12px; }
      `}</style>

      <div className="probability-field-page">
        {/* Animated probability background */}
        <div className="probability-bg"></div>

        {/* Grid overlay - deterministic structure */}
        <div className="grid-overlay"></div>

        <div className="content-layer">
          {/* Header */}
          <header className="px-6 py-6 fade-in fade-in-1">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-orange-500 sharp"></div>
                <span className="text-xl font-bold">OpenPasture</span>
              </div>
              <nav className="flex items-center gap-8">
                <a href="#" className="text-sm hover:text-cyan-400 transition-colors">Product</a>
                <a href="#" className="text-sm hover:text-cyan-400 transition-colors">Approach</a>
                <a href="#" className="text-sm hover:text-cyan-400 transition-colors">Docs</a>
                <button className="px-5 py-2 bg-cyan-400 text-gray-900 font-medium sharp hover:shadow-lg hover:shadow-cyan-400/50 transition-all">
                  Get Access
                </button>
              </nav>
            </div>
          </header>

          {/* Hero */}
          <section className="px-6 py-20 max-w-7xl mx-auto">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-6 fade-in fade-in-2">
                <span className="heat-indicator heat-high"></span>
                <span className="mono text-xs tracking-wider text-cyan-400">PROBABILISTIC INTELLIGENCE</span>
              </div>

              <h1 className="text-7xl font-bold mb-6 leading-tight fade-in fade-in-3">
                From Hard Data to <span className="gradient-text">Soft Predictions</span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed fade-in fade-in-4">
                Sentinel-2 satellite imagery flows through probabilistic models to predict optimal grazing patterns.
                We transform deterministic metrics into living, breathing intelligence.
              </p>

              {/* Metric badges - sharp, deterministic */}
              <div className="flex flex-wrap gap-3 mb-12 fade-in fade-in-5">
                <div className="metric-badge">
                  <span className="mono text-cyan-400">NDVI</span>
                  <span className="text-gray-400">→</span>
                  <span>Vegetation Index</span>
                </div>
                <div className="metric-badge">
                  <span className="mono text-cyan-400">EVI</span>
                  <span className="text-gray-400">→</span>
                  <span>Enhanced Index</span>
                </div>
                <div className="metric-badge">
                  <span className="mono text-cyan-400">NDWI</span>
                  <span className="text-gray-400">→</span>
                  <span>Water Index</span>
                </div>
              </div>

              <div className="flex gap-4 fade-in fade-in-6">
                <button className="prob-cta">
                  Start Free Trial
                </button>
                <button className="px-8 py-4 border border-cyan-400/30 text-cyan-400 font-medium sharp hover:bg-cyan-400/10 transition-all">
                  View Demo
                </button>
              </div>
            </div>

            {/* Probability distribution visualization */}
            <div className="mt-20 fade-in fade-in-6">
              <div className="prob-card p-8 soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">7-Day Confidence Distribution</h3>
                  <span className="mono text-xs text-cyan-400">LIVE PREDICTION</span>
                </div>
                <div className="prob-dist">
                  {[30, 45, 65, 85, 95, 88, 72].map((height, i) => (
                    <div
                      key={i}
                      className="prob-bar"
                      style={{ height: `${height}%` }}
                      title={`Day ${i + 1}: ${height}% confidence`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mono mt-2">
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>SAT</span>
                  <span>SUN</span>
                </div>
              </div>
            </div>
          </section>

          {/* Features - cards with probability styling */}
          <section className="px-6 py-20 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="prob-card p-8">
                <span className="heat-indicator heat-high"></span>
                <h3 className="text-xl font-bold mb-3 mt-4">Input: Hard Metrics</h3>
                <p className="text-gray-400 mb-4">
                  Sentinel-2 multispectral data analyzed with mathematical precision. Sharp boundaries, discrete values, deterministic processing.
                </p>
                <div className="mono text-xs text-cyan-400">10m RESOLUTION • 13 BANDS • 5-DAY REVISIT</div>
              </div>

              <div className="prob-card p-8">
                <span className="heat-indicator heat-med"></span>
                <h3 className="text-xl font-bold mb-3 mt-4">Process: Emergence</h3>
                <p className="text-gray-400 mb-4">
                  LLM reasoning layers transform discrete metrics into continuous probability fields. Complexity emerges from simple rules.
                </p>
                <div className="mono text-xs text-orange-400">MULTI-LAYER • ADAPTIVE • CONTEXT-AWARE</div>
              </div>

              <div className="prob-card p-8">
                <span className="heat-indicator heat-low"></span>
                <h3 className="text-xl font-bold mb-3 mt-4">Output: Soft Intelligence</h3>
                <p className="text-gray-400 mb-4">
                  Daily recommendations that feel like intuition. Probabilistic guidance respecting natural cycles and uncertainty.
                </p>
                <div className="mono text-xs text-cyan-400">PROBABILISTIC • ADAPTIVE • FARMER-FIRST</div>
              </div>
            </div>
          </section>

          {/* How it works - showing transformation */}
          <section className="px-6 py-20 max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">
              The Transformation
            </h2>

            <div className="prob-card p-12 soft">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 sharp bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                    <span className="mono text-2xl font-bold text-gray-900">0.87</span>
                  </div>
                  <h4 className="font-bold mb-2">Deterministic Input</h4>
                  <p className="text-sm text-gray-400">NDVI value: precise, bounded, discrete</p>
                </div>

                <div className="text-center">
                  <div className="text-4xl text-cyan-400 mb-4">→</div>
                  <p className="text-sm text-gray-500 mono">PROBABILISTIC PROCESSING</p>
                </div>

                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 via-cyan-400 to-blue-500 flex items-center justify-center" style={{ filter: 'blur(2px)' }}>
                    <span className="mono text-lg font-bold text-white" style={{ filter: 'blur(0)' }}>~85%</span>
                  </div>
                  <h4 className="font-bold mb-2">Probabilistic Output</h4>
                  <p className="text-sm text-gray-400">Confidence field: fuzzy, continuous, living</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-20 max-w-7xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6">
              Intelligence That <span className="gradient-text">Breathes</span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join farmers using probabilistic intelligence to work with nature, not against it.
            </p>
            <button className="prob-cta">
              Request Access
            </button>
          </section>

          {/* Footer */}
          <footer className="px-6 py-12 border-t border-cyan-400/20">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-sm text-gray-500">© 2024 OpenPasture</div>
              <div className="flex gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
                <a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
