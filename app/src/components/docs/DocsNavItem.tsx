import { Link, useLocation } from '@tanstack/react-router'
import type { DocsNavItem as NavItemType } from '@/lib/docs/types'
import { ExternalLink } from 'lucide-react'

interface DocsNavItemProps {
  item: NavItemType
}

export function DocsNavItem({ item }: DocsNavItemProps) {
  const location = useLocation()
  const isActive = location.pathname === item.href

  // Parse the href to get category and article params
  const hrefParts = item.href.split('/').filter(Boolean)
  const category = hrefParts[1] ?? ''
  const article = hrefParts[2] ?? ''

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-[var(--docs-nav-active-bg)] hover:text-foreground transition-colors"
      >
        <span>{item.title}</span>
        <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
      </a>
    )
  }

  return (
    <Link
      to="/docs/$category/$article"
      params={{ category, article }}
      className={`
        relative block rounded-md px-3 py-2 text-sm transition-colors
        ${
          isActive
            ? 'bg-[var(--docs-nav-active-bg)] text-foreground font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-[var(--docs-nav-active-border)]'
            : 'text-muted-foreground hover:bg-[var(--docs-nav-active-bg)] hover:text-foreground'
        }
      `}
    >
      <span className="flex items-center justify-between">
        {item.title}
        {item.badge && (
          <span
            className={`
              ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide
              ${item.badge === 'New' ? 'bg-olive/10 text-olive' : ''}
              ${item.badge === 'Beta' ? 'bg-terracotta/10 text-terracotta' : ''}
              ${item.badge === 'Updated' ? 'bg-cobalt/10 text-cobalt' : ''}
            `}
          >
            {item.badge}
          </span>
        )}
      </span>
    </Link>
  )
}
