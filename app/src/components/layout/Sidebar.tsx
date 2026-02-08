import { Link, useLocation } from '@tanstack/react-router'
import { Map, History, Settings, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
}

function getNavItems(isDemo: boolean): NavItem[] {
  const prefix = isDemo ? '/demo' : '/app'
  return [
    { label: 'GIS View', icon: Map, href: isDemo ? '/demo' : '/app' },
    { label: 'History', icon: History, href: `${prefix}/history` },
    { label: 'Analytics', icon: BarChart3, href: `${prefix}/analytics` },
  ]
}

export function Sidebar() {
  const location = useLocation()
  const isDemo = location.pathname.startsWith('/demo')
  const navItems = getNavItems(isDemo)
  const settingsPath = isDemo ? '/demo/settings' : '/app/settings'

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-9 flex-col items-center border-r-2 border-sidebar-border bg-sidebar py-1">
        {/* Navigation */}
        <nav className="flex flex-1 flex-col items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      'flex h-6 w-6 items-center justify-center transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-olive/40'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-0.5">
          <Separator className="mb-0.5 w-4 bg-sidebar-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={settingsPath}
                className={cn(
                  'flex h-6 w-6 items-center justify-center transition-colors',
                  location.pathname === settingsPath
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-olive/40'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
