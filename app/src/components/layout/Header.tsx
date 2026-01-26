import { BookOpen } from 'lucide-react'
import { FarmSelector } from './FarmSelector'
import { NotificationBell } from './NotificationBell'
import { DevToolsDropdown } from './DevToolsDropdown'
import { Link } from '@tanstack/react-router'

export function Header() {
  return (
    <header className="flex h-8 items-center justify-between border-b border-border bg-background px-2">
      <FarmSelector />
      <div className="flex items-center gap-2">
        <DevToolsDropdown />

        <Link to="/docs" className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent" title="Documentation">
          <BookOpen className="h-3 w-3" />
        </Link>

        <NotificationBell />

        {/* Avatar placeholder */}
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
          C
        </div>
      </div>
    </header>
  )
}
