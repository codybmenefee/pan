import { CheckCircle, PenLine } from 'lucide-react'

export function DecisionStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-dark">
      <div className="flex items-center justify-center gap-2 mb-2">
        <CheckCircle className="h-5 w-5 text-olive" />
        <h2 className="text-sm font-bold text-olive uppercase tracking-wider">
          The Decision
        </h2>
      </div>

      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">
        Approve or modify
      </h1>

      <p className="text-base text-muted-foreground mb-6">
        You're always in control. The system learns from your choices.
      </p>

      {/* Decision options */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        {/* AI Recommendation */}
        <div className="bg-white border-2 border-border p-3 w-36">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">AI Recommends</div>
          <div className="text-base font-bold text-olive">East Ridge</div>
          <div className="text-xs text-muted-foreground">P4</div>
        </div>

        <div className="text-2xl text-dark/30 font-bold hidden md:block">&rarr;</div>

        {/* Options */}
        <div className="flex gap-4">
          <div className="bg-white border-2 border-olive/40 p-4 text-center w-32">
            <div className="w-12 h-12 bg-olive flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm font-bold text-olive">Approve</div>
            <div className="text-xs text-muted-foreground mt-1">Move to suggested section</div>
          </div>

          <div className="bg-white border-2 border-cobalt/40 p-4 text-center w-32">
            <div className="w-12 h-12 bg-cobalt flex items-center justify-center mx-auto mb-2">
              <PenLine className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm font-bold text-cobalt">Modify</div>
            <div className="text-xs text-muted-foreground mt-1">Choose different or stay</div>
          </div>
        </div>
      </div>

      <div className="pt-5 border-t-2 border-border">
        <p className="text-sm">
          <span className="text-olive font-bold">You know your farm best.</span> The AI gives you a starting point.
        </p>
      </div>
    </div>
  )
}
