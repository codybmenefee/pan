import { Sparkles, MousePointer } from 'lucide-react'

export function YourTurnStep() {
  return (
    <div className="max-w-2xl mx-auto text-center text-dark">
      {/* Sparkle icon */}
      <div className="inline-block mb-4">
        <div className="w-16 h-16 bg-olive flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
      </div>

      <h2 className="text-sm font-bold text-olive uppercase tracking-wider mb-2">
        Your Turn
      </h2>

      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
        Make today's decision
      </h1>

      <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
        The Morning Brief will open with today's recommendation.
      </p>

      {/* Action preview */}
      <div className="bg-white border-2 border-olive/30 p-4 max-w-xs mx-auto mb-4">
        <div className="flex items-center justify-center gap-2 mb-3 text-muted-foreground">
          <MousePointer className="h-4 w-4 text-olive" />
          <span className="text-sm">When you click "Let's Go":</span>
        </div>
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-olive flex items-center justify-center text-xs font-bold text-white">1</div>
            <span className="text-dark/80">Tutorial closes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-olive flex items-center justify-center text-xs font-bold text-white">2</div>
            <span className="text-dark/80">Brief opens</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Demo farm - experiment freely!
      </p>
    </div>
  )
}
