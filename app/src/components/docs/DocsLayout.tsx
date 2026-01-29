import { useState } from 'react'
import { DocsHeader } from './DocsHeader'
import { DocsSidebar } from './DocsSidebar'
import { DocsMobileNav } from './DocsMobileNav'

interface DocsLayoutProps {
  children: React.ReactNode
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DocsHeader onMenuClick={() => setIsMobileNavOpen(true)} />

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <DocsSidebar className="hidden md:flex" />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile navigation drawer */}
      <DocsMobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </div>
  )
}
