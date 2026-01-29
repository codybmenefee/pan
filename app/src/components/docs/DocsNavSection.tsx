import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { DocsNavSection as NavSectionType } from '@/lib/docs/types'
import { DocsNavItem } from './DocsNavItem'

interface DocsNavSectionProps {
  section: NavSectionType
}

export function DocsNavSection({ section }: DocsNavSectionProps) {
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? false)
  const Icon = section.icon

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {section.title}
        </span>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
      </button>
      <div
        className={`
          overflow-hidden transition-all duration-200 ease-in-out
          ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-2">
          {section.items.map((item) => (
            <DocsNavItem key={item.href} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
