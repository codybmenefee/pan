import { Link } from '@tanstack/react-router'
import { Terminal, BookOpen, ArrowRight } from 'lucide-react'
import { DemoFarmSelector } from './DemoFarmSelector'
import { DemoDailyPlanButton } from './DemoDailyPlanButton'
import { DemoDevToolsDropdown } from './DemoDevToolsDropdown'

export function DemoHeader() {
  return (
    <header className="relative flex h-10 items-center border-b-2 border-border bg-white pl-1 pr-3 py-2 gap-2">
      {/* Left side */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 border-2 border-dark bg-olive flex items-center justify-center">
          <Terminal className="w-3 h-3 text-white" strokeWidth={2.5} />
        </div>
        <DemoFarmSelector />
        <DemoDailyPlanButton />
      </div>

      {/* Centered logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="text-xs font-bold tracking-tight">openpasture</span>
        <span className="text-[9px] text-muted-foreground">v0.9.2</span>
        <span className="inline-block px-1.5 py-0.5 border-2 border-olive text-olive text-[8px] font-semibold uppercase tracking-widest">
          demo
        </span>
      </div>

      {/* Right side */}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Link to="/docs" className="flex h-5 w-5 items-center justify-center hover:bg-olive-light transition-colors" title="Documentation">
          <BookOpen className="h-3 w-3" />
        </Link>

        <DemoDevToolsDropdown />

        <Link
          to="/sign-in"
          className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-white bg-olive hover:bg-olive-bright uppercase tracking-wider transition-colors shadow-[2px_2px_0_var(--dark)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--dark)] group"
        >
          ./signup
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
        </Link>
      </div>
    </header>
  )
}
