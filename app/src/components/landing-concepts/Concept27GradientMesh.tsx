export function Concept27GradientMesh() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&family=Fira+Code:wght@400;500&display=swap');

        .gradient-mesh-page {
          --primary: #6b46c1;
          --secondary: #ec4899;
          --accent: #10b981;
          --dark: #1a1625;
          --light: #faf8ff;
          font-family: 'Manrope', sans-serif;
          background: var(--dark);
          min-height: 100vh;
          color: white;
          overflow-x: hidden;
        }

        .mono {
          font-family: 'Fira Code', monospace;
        }

        /* Complex gradient mesh background */
        .mesh-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          background:
            radial-gradient(ellipse 800px 600px at 10% 20%, rgba(107, 70, 193, 0.4), transparent),
            radial-gradient(ellipse 600px 800px at 90% 80%, rgba(236, 72, 153, 0.3), transparent),
            radial-gradient(ellipse 700px 700px at 50% 50%, rgba(16, 185, 129, 0.2), transparent),
            radial-gradient(ellipse 500px 900px at 30% 70%, rgba(107, 70, 193, 0.3), transparent),
            radial-gradient(ellipse 900px 500px at 70% 30%, rgba(236, 72, 153, 0.25), transparent);
          filter: blur(80px);
          opacity: 0.8;
          animation: meshShift 20s ease-in-out infinite;
        }

        @keyframes meshShift {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
        }

        /* Sharp polygon overlay */
        .polygon-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          opacity: 0.08;
          background-image:
            linear-gradient(30deg, transparent 45%, rgba(107, 70, 193, 0.5) 45%, rgba(107, 70, 193, 0.5) 55%, transparent 55%),
            linear-gradient(150deg, transparent 45%, rgba(236, 72, 153, 0.5) 45%, rgba(236, 72, 153, 0.5) 55%, transparent 55%);
          background-size: 80px 140px;
        }

        .content-layer {
          position: relative;
          z-index: 2;
        }

        /* Cards that transition from sharp to soft */
        .mesh-card {
          background: rgba(26, 22, 37, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(107, 70, 193, 0.3);
          border-radius: 4px;
          padding: 32px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .mesh-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle,
            rgba(107, 70, 193, 0.15) 0%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .mesh-card:hover::before {
          opacity: 1;
          animation: meshRotate 3s linear infinite;
        }

        @keyframes meshRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .mesh-card:hover {
          border-color: rgba(236, 72, 153, 0.6);
          transform: translateY(-8px);
          box-shadow: 0 30px 80px rgba(107, 70, 193, 0.4);
          border-radius: 24px;
        }

        /* Polygon dissolve effect */
        .polygon-sharp {
          clip-path: polygon(
            20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%
          );
          transition: clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .polygon-sharp:hover {
          clip-path: polygon(
            0% 0%, 100% 0%, 100% 100%, 100% 100%, 100% 100%, 0% 100%, 0% 100%, 0% 0%
          );
        }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg,
            var(--primary),
            var(--secondary),
            var(--accent)
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientFlow 4s ease infinite;
        }

        @keyframes gradientFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Probability cloud visualization */
        .prob-cloud {
          position: relative;
          height: 200px;
          margin: 40px 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 4px;
        }

        .cloud-bar {
          width: 8px;
          background: linear-gradient(to top,
            var(--accent),
            var(--secondary),
            var(--primary)
          );
          border-radius: 4px 4px 0 0;
          transition: all 0.3s ease;
          filter: blur(0);
        }

        .cloud-bar:hover {
          filter: blur(4px);
          transform: scaleY(1.1);
        }

        /* Sharp metric badge */
        .sharp-metric {
          display: inline-block;
          padding: 8px 16px;
          background: rgba(107, 70, 193, 0.2);
          border: 2px solid var(--primary);
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .sharp-metric:hover {
          background: rgba(236, 72, 153, 0.2);
          border-color: var(--secondary);
          border-radius: 20px;
          transform: scale(1.05);
        }

        /* Soft badge */
        .soft-badge {
          display: inline-block;
          padding: 8px 16px;
          background: linear-gradient(135deg,
            rgba(107, 70, 193, 0.3),
            rgba(236, 72, 153, 0.3)
          );
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid transparent;
          transition: all 0.3s ease;
        }

        .soft-badge:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
        }

        /* Transformation visualization */
        .transform-viz {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 40px;
          align-items: center;
          margin: 60px 0;
        }

        .viz-box {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .viz-sharp {
          width: 160px;
          height: 160px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          box-shadow: 0 10px 40px rgba(107, 70, 193, 0.5);
        }

        .viz-soft {
          width: 180px;
          height: 180px;
          background: radial-gradient(circle,
            var(--accent),
            var(--secondary),
            var(--primary)
          );
          border-radius: 50%;
          filter: blur(8px);
          box-shadow: 0 10px 60px rgba(236, 72, 153, 0.6);
        }

        .viz-arrow {
          font-size: 3rem;
          color: var(--accent);
          animation: arrowPulse 2s ease-in-out infinite;
        }

        @keyframes arrowPulse {
          0%, 100% { transform: translateX(0); opacity: 0.6; }
          50% { transform: translateX(10px); opacity: 1; }
        }

        /* CTA button */
        .mesh-cta {
          padding: 20px 48px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .mesh-cta::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.5s ease;
        }

        .mesh-cta:hover::before {
          left: 100%;
        }

        .mesh-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 50px rgba(236, 72, 153, 0.5);
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

      <div className="gradient-mesh-page">
        {/* Gradient mesh background */}
        <div className="mesh-bg"></div>

        {/* Polygon overlay */}
        <div className="polygon-overlay"></div>

        <div className="content-layer">
          {/* Header */}
          <header className="px-6 py-8 fade-in fade-in-1">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 polygon-sharp"></div>
                <span className="text-2xl font-extrabold">OpenPasture</span>
              </div>
              <nav className="flex items-center gap-8">
                <a href="#" className="text-sm font-semibold hover:text-pink-400 transition-colors">Technology</a>
                <a href="#" className="text-sm font-semibold hover:text-pink-400 transition-colors">Science</a>
                <a href="#" className="text-sm font-semibold hover:text-pink-400 transition-colors">Platform</a>
                <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 font-bold rounded-lg hover:shadow-lg hover:shadow-pink-500/50 transition-all">
                  Get Started
                </button>
              </nav>
            </div>
          </header>

          {/* Hero */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="max-w-5xl">
              <div className="flex items-center gap-3 mb-8 fade-in fade-in-2">
                <span className="sharp-metric mono">VECTOR INPUT</span>
                <span className="text-2xl text-green-400">→</span>
                <span className="soft-badge mono">PROBABILITY FIELD</span>
              </div>

              <h1 className="text-8xl font-extrabold mb-8 leading-tight fade-in fade-in-3" style={{ letterSpacing: '-0.03em' }}>
                Sharp Data<br/>
                <span className="gradient-text">Dissolves Into</span><br/>
                Soft Intelligence
              </h1>

              <p className="text-2xl text-gray-300 mb-12 max-w-3xl leading-relaxed fade-in fade-in-4">
                Watch as precise polygon boundaries and discrete measurements transform into continuous probability clouds.
                Your pasture intelligence flows like gradients, not grids.
              </p>

              <div className="fade-in fade-in-5">
                <button className="mesh-cta">
                  Experience the Flow
                </button>
              </div>
            </div>

            {/* Probability cloud visualization */}
            <div className="mt-20 fade-in fade-in-5">
              <div className="mesh-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Continuous Probability Distribution</h3>
                  <span className="mono text-xs text-purple-400">REAL-TIME GRADIENT</span>
                </div>
                <div className="prob-cloud">
                  {Array.from({ length: 80 }, (_, i) => {
                    const center = 40
                    const distance = Math.abs(i - center)
                    const height = 100 * Math.exp(-(distance * distance) / 400)
                    return (
                      <div
                        key={i}
                        className="cloud-bar"
                        style={{ height: `${Math.max(height, 10)}%` }}
                      ></div>
                    )
                  })}
                </div>
                <p className="text-sm text-gray-400 text-center mt-4 mono">
                  From discrete pixels to continuous fields
                </p>
              </div>
            </div>
          </section>

          {/* Transformation visualization */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 text-center">
              The Transformation
            </h2>
            <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
              Mathematical precision meets organic prediction. Watch discrete data dissolve into probability fields.
            </p>

            <div className="transform-viz">
              <div className="viz-box">
                <div className="viz-sharp"></div>
              </div>

              <div className="viz-arrow">→</div>

              <div className="viz-box">
                <div className="viz-soft"></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-16 mt-16">
              <div>
                <h3 className="text-3xl font-bold mb-4">Deterministic Input</h3>
                <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                  Sentinel-2 delivers sharp polygon boundaries. NDVI values are discrete measurements.
                  Coordinates are exact points. This is the language of machines and mathematics.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="sharp-metric mono">POLYGON</span>
                  <span className="sharp-metric mono">DISCRETE</span>
                  <span className="sharp-metric mono">BOUNDED</span>
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-bold mb-4">Probabilistic Output</h3>
                <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                  Intelligence flows across boundaries. Confidence gradients replace binary states.
                  Predictions breathe and adapt. This is the language of nature and evolution.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="soft-badge mono">GRADIENT</span>
                  <span className="soft-badge mono">CONTINUOUS</span>
                  <span className="soft-badge mono">FLOWING</span>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="mesh-card">
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-purple-600 to-pink-600 polygon-sharp"></div>
                <h3 className="text-2xl font-bold mb-4">Vector Precision</h3>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Start with hard edges. GPS coordinates, spectral bands, temporal snapshots. Linear algebra and geometry.
                </p>
                <span className="mono text-xs text-purple-400">INPUT LAYER</span>
              </div>

              <div className="mesh-card">
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-pink-600 to-green-500 rounded-lg" style={{ filter: 'blur(2px)' }}></div>
                <h3 className="text-2xl font-bold mb-4">Gradient Processing</h3>
                <p className="text-gray-400 leading-relaxed mb-4">
                  LLM layers smooth discrete values into continuous fields. Boundaries dissolve into probability zones.
                </p>
                <span className="mono text-xs text-pink-400">TRANSFORMATION</span>
              </div>

              <div className="mesh-card">
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-green-500 to-purple-600 rounded-full" style={{ filter: 'blur(4px)' }}></div>
                <h3 className="text-2xl font-bold mb-4">Probability Clouds</h3>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Arrive at soft predictions. Confidence gradients that respect uncertainty and natural variation.
                </p>
                <span className="mono text-xs text-green-400">OUTPUT FIELD</span>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="px-6 py-24 max-w-5xl mx-auto">
            <div className="mesh-card">
              <h2 className="text-4xl font-bold mb-8">Gradient Mesh Intelligence</h2>
              <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
                <p>
                  Traditional grazing systems impose rigid grids on living landscapes. We take the opposite approach:
                  let probability gradients emerge from the data itself.
                </p>
                <p>
                  Start with <span className="text-purple-400 font-semibold">sharp vectors</span>: satellite pixels,
                  spectral indices, GPS coordinates. Feed them through <span className="text-pink-400 font-semibold">
                  gradient processing</span> where LLM reasoning layers smooth discrete boundaries into continuous fields.
                  Arrive at <span className="text-green-400 font-semibold">probability clouds</span> that guide grazing
                  decisions with natural uncertainty built in.
                </p>
                <p>
                  The result feels less like following instructions and more like reading the land. Because that is exactly what it is.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-24 max-w-7xl mx-auto text-center">
            <h2 className="text-6xl font-extrabold mb-6">
              Intelligence That<br/>
              <span className="gradient-text">Flows Like Nature</span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join ranchers using gradient mesh intelligence to make decisions that respect uncertainty.
            </p>
            <button className="mesh-cta">
              Request Beta Access
            </button>
          </section>

          {/* Footer */}
          <footer className="px-6 py-12 border-t border-purple-900/30 mt-20">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-sm text-gray-500 mono">© 2024 OpenPasture</div>
              <div className="flex gap-6 text-sm font-semibold text-gray-400">
                <a href="#" className="hover:text-pink-400 transition-colors">Gradient Docs</a>
                <a href="#" className="hover:text-pink-400 transition-colors">Research</a>
                <a href="#" className="hover:text-pink-400 transition-colors">Open Source</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
