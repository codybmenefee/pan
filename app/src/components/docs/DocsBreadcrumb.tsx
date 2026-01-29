import { Link } from '@tanstack/react-router'
import { ChevronRight, Home } from 'lucide-react'

interface DocsBreadcrumbProps {
  category: string
  article: string
}

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function DocsBreadcrumb({ category, article }: DocsBreadcrumbProps) {
  return (
    <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
      <Link
        to="/docs"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      <ChevronRight className="h-4 w-4" />

      <Link
        to="/docs/$category/$article"
        params={{
          category,
          article: category === 'getting-started' ? 'introduction' : 'overview',
        }}
        className="hover:text-foreground transition-colors"
      >
        {formatSlug(category)}
      </Link>

      <ChevronRight className="h-4 w-4" />

      <span className="text-foreground font-medium">{formatSlug(article)}</span>
    </nav>
  )
}
