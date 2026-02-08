import { GrassAnimation } from '../GrassAnimation'

export function PhilosophyStep() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Visual */}
      <div className="flex h-48 w-full items-center justify-center rounded-xl bg-gradient-to-b from-olive-light to-olive-light">
        <GrassAnimation className="h-32" />
      </div>

      {/* Content */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Grass is Dynamic
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Traditional fencing is static, but grass conditions change daily.
          Rotational grazing moves livestock to give pastures time to recover,
          keeping your land healthy and productive.
        </p>
      </div>

      {/* Key insight callout */}
      <div className="flex items-center gap-2 rounded-full bg-olive-light px-4 py-2 text-sm text-olive">
        <span className="h-2 w-2 rounded-full bg-olive" />
        Move livestock to allow recovery
      </div>
    </div>
  )
}
