import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { docsConfig } from '@/lib/docs/navigation'
import { DocsNavSection } from './DocsNavSection'

interface DocsSidebarProps {
  className?: string
}

export function DocsSidebar({ className = '' }: DocsSidebarProps) {
  return (
    <aside
      className={`flex h-full w-64 flex-col border-r border-[var(--docs-sidebar-border)] bg-[var(--docs-sidebar-bg)] ${className}`}
    >
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <Link
          to="/"
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>

        <nav className="space-y-1">
          {docsConfig.navigation.map((section) => (
            <DocsNavSection key={section.slug} section={section} />
          ))}
        </nav>
      </div>
    </aside>
  )
}
