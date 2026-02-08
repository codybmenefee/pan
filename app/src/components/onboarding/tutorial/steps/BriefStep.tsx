import { Sun, Check } from 'lucide-react'
import { ScreenshotFrame } from '../ScreenshotFrame'

export function BriefStep() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Visual - screenshot */}
      <ScreenshotFrame
        src="/tutorial/daily-brief.png"
        alt="Daily Plan panel with AI recommendation"
        className="w-full"
      />

      {/* Content */}
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-terracotta/10 px-3 py-1 text-sm text-terracotta">
          <Sun className="h-4 w-4" />
          Your morning ritual
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Your Morning Brief
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Each morning, receive an AI-powered recommendation for where to graze
          today. Review the suggestion, make adjustments if needed, and approve
          with one click.
        </p>
      </div>

      {/* Workflow steps */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</div>
          <span className="text-muted-foreground">Receive recommendation</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</div>
          <span className="text-muted-foreground">Review</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <Check className="h-5 w-5 text-olive" />
          <span className="text-muted-foreground">Approve</span>
        </div>
      </div>
    </div>
  )
}
