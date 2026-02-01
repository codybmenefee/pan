import { CheckCircle, PenLine } from 'lucide-react'

export function DecisionStep() {
  return (
    <div className="max-w-3xl mx-auto text-center text-white">
      {/* Header with backdrop */}
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <h2 className="text-sm font-medium text-green-400 uppercase tracking-wider">
            The Decision
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Approve or modify
        </h1>

        <p className="text-base text-white/70">
          You're always in control. The system learns from your choices.
        </p>
      </div>

      {/* Decision options with solid backgrounds */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        {/* AI Recommendation */}
        <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-zinc-600 w-36">
          <div className="text-xs text-white/50 mb-1">AI Recommends</div>
          <div className="text-base font-bold text-green-400">East Ridge</div>
          <div className="text-xs text-white/60">P4</div>
        </div>

        <div className="text-2xl text-white/50 hidden md:block">&rarr;</div>

        {/* Options */}
        <div className="flex gap-4">
          <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-4 border border-green-600/50 text-center w-32">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm font-medium text-green-400">Approve</div>
            <div className="text-xs text-white/50 mt-1">Move to suggested section</div>
          </div>

          <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-4 border border-blue-600/50 text-center w-32">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-2">
              <PenLine className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm font-medium text-blue-400">Modify</div>
            <div className="text-xs text-white/50 mt-1">Choose different or stay</div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
        <span className="text-green-400 font-medium">You know your farm best.</span> The AI gives you a starting point.
      </p>
    </div>
  )
}
