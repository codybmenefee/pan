import { useState } from 'react'
import { BookOpen, Bug, HelpCircle, LogOut } from 'lucide-react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { FarmSelector } from './FarmSelector'
import { DailyPlanButton } from './DailyPlanButton'
import { NotificationBell } from './NotificationBell'
import { DevToolsDropdown } from './DevToolsDropdown'
import { SatelliteStatusIcon } from './SatelliteStatusIcon'
import { Link } from '@tanstack/react-router'
import { useAppAuth } from '@/lib/auth'
import { useTutorial } from '@/components/onboarding/tutorial'
import { BugReportModal } from './BugReportModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function AvatarFallback({ initial = 'U' }: { initial?: string }) {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
      {initial}
    </div>
  )
}

function ClerkProfileAvatar() {
  const { user } = useUser()

  if (!user?.imageUrl) {
    const initial = user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() || 'U'
    return <AvatarFallback initial={initial} />
  }

  return (
    <img
      src={user.imageUrl}
      alt={user.fullName || 'Profile'}
      className="h-5 w-5 rounded-full object-cover"
    />
  )
}

function ClerkProfileDropdown() {
  const { signOut } = useClerk()

  const handleLogout = () => {
    signOut()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full hover:ring-2 hover:ring-accent focus:outline-none focus:ring-2 focus:ring-accent">
          <ClerkProfileAvatar />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DevProfileDropdown() {
  const handleLogout = () => {
    // In dev mode, just reload the page to simulate logout
    window.location.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full hover:ring-2 hover:ring-accent focus:outline-none focus:ring-2 focus:ring-accent">
          <AvatarFallback initial="D" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProfileDropdown() {
  const { isDevAuth } = useAppAuth()

  // In dev auth mode, ClerkProvider isn't mounted, so we can't use useClerk()
  if (isDevAuth) {
    return <DevProfileDropdown />
  }

  return <ClerkProfileDropdown />
}

export function Header() {
  const { startTutorial, resetTutorial } = useTutorial()
  const [bugReportOpen, setBugReportOpen] = useState(false)

  const handleHelpClick = () => {
    resetTutorial()
    startTutorial()
  }

  return (
    <header className="flex h-10 items-center border-b border-border bg-background pl-1 pr-3 py-2 gap-2">
      <FarmSelector />
      <DailyPlanButton />
      <div className="flex-1 flex justify-center">
        <span className="text-sm font-semibold tracking-tight">OpenPasture</span>
        <span className="ml-1.5 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">beta</span>
      </div>
      <div className="flex items-center gap-2">
        <DevToolsDropdown />

        <SatelliteStatusIcon />

        <button
          onClick={handleHelpClick}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent"
          title="Take a tour"
        >
          <HelpCircle className="h-3 w-3" />
        </button>

        <button
          onClick={() => setBugReportOpen(true)}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent"
          title="Report a bug"
        >
          <Bug className="h-3 w-3" />
        </button>

        <Link to="/docs" className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent" title="Documentation">
          <BookOpen className="h-3 w-3" />
        </Link>

        <NotificationBell />

        <ProfileDropdown />
      </div>

      <BugReportModal open={bugReportOpen} onOpenChange={setBugReportOpen} />
    </header>
  )
}
