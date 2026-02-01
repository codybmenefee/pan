import { Sparkles, MousePointer } from 'lucide-react'

export function YourTurnStep() {
  return (
    <div className="max-w-2xl mx-auto text-center text-white">
      {/* Content with backdrop */}
      <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-6">
        {/* Sparkle icon with glow */}
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>

        <h2 className="text-sm font-medium text-green-400 uppercase tracking-wider mb-2">
          Your Turn
        </h2>

        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Make today's decision
        </h1>

        <p className="text-lg text-white/70 mb-4 max-w-md mx-auto">
          The Morning Brief will open with today's recommendation.
        </p>

        {/* Action preview */}
        <div className="bg-zinc-900/80 rounded-xl p-4 border border-green-500/30 max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3 text-white/70">
            <MousePointer className="h-4 w-4 text-green-400" />
            <span className="text-sm">When you click "Let's Go":</span>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold">1</div>
              <span className="text-white/80">Tutorial closes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold">2</div>
              <span className="text-white/80">Brief opens</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-white/40">
          Demo farm - experiment freely!
        </p>
      </div>
    </div>
  )
}
