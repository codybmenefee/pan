import { Link } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { DemoFarmSelector } from './DemoFarmSelector'
import { DemoDailyPlanButton } from './DemoDailyPlanButton'
import { DemoDevToolsDropdown } from './DemoDevToolsDropdown'

export function DemoHeader() {
  return (
    <header className="relative flex h-10 items-center border-b border-border bg-background pl-1 pr-3 py-2 gap-2">
      {/* Left side */}
      <DemoFarmSelector />
      <DemoDailyPlanButton />

      {/* Centered logo - absolutely positioned */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <span className="text-sm font-semibold tracking-tight">OpenPasture</span>
        <span className="ml-1.5 text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">demo</span>
      </div>

      {/* Right side - pushed to far right */}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Link to="/docs" className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent" title="Documentation">
          <BookOpen className="h-3 w-3" />
        </Link>

        <DemoDevToolsDropdown />

        <Link
          to="/sign-in"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </header>
  )
}
