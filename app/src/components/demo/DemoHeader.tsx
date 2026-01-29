import { Link } from '@tanstack/react-router'
import { BookOpen, UserPlus } from 'lucide-react'
import { DemoFarmSelector } from './DemoFarmSelector'
import { DemoDailyPlanButton } from './DemoDailyPlanButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function DemoProfileDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full hover:ring-2 hover:ring-accent focus:outline-none focus:ring-2 focus:ring-accent">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-amber-950 text-[10px] font-medium">
            D
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link to="/onboarding" className="flex items-center gap-2 cursor-pointer">
            <UserPlus className="h-3.5 w-3.5" />
            Sign Up Free
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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

        <DemoProfileDropdown />
      </div>
    </header>
  )
}
