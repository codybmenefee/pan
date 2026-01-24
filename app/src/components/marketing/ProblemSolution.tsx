import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function ProblemSolution() {
  return (
    <section className="py-24 bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
          {/* Problem Side */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-7 w-7 text-red-400" />
              <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
                You Can't Be Everywhere. But Your Data Can.
              </h2>
            </div>

            <ul className="space-y-5 text-lg text-slate-400">
              <li className="flex items-start gap-4">
                <span className="text-red-400 mt-1 text-xl">•</span>
                <span>Hard to know which paddock is ready to graze</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-red-400 mt-1 text-xl">•</span>
                <span>Waste time checking land conditions manually</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-red-400 mt-1 text-xl">•</span>
                <span>Miss optimal grazing windows</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-red-400 mt-1 text-xl">•</span>
                <span>Overgraze or underutilize pasture</span>
              </li>
            </ul>
          </div>

          {/* Solution Side */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
                One Brief. Every Morning. No Guesswork.
              </h2>
            </div>

            <ul className="space-y-5 text-lg text-slate-400">
              <li className="flex items-start gap-4">
                <span className="text-emerald-400 mt-1 text-xl">✓</span>
                <span>Daily land status reports for every paddock</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-emerald-400 mt-1 text-xl">✓</span>
                <span>AI-powered grazing recommendations</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-emerald-400 mt-1 text-xl">✓</span>
                <span>Plain language explanations you can trust</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-emerald-400 mt-1 text-xl">✓</span>
                <span>Works with your existing virtual fencing system</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
