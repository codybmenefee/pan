import { createFileRoute, Link } from '@tanstack/react-router'
import { DocsContent } from '@/components/docs'
import { docsConfig } from '@/lib/docs/navigation'
import { ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/_public/docs/')({
  component: DocsIndexPage,
})

function DocsIndexPage() {
  return (
    <DocsContent>
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          {docsConfig.title} Documentation
        </h1>
        <p className="text-lg text-muted-foreground">
          {docsConfig.description}
        </p>
      </div>

      {/* Getting Started callout */}
      <div className="mb-10 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-2">New to Morning Farm Brief?</h2>
        <p className="text-muted-foreground mb-4">
          Start with our introduction guide to learn the core concepts and get up and running quickly.
        </p>
        <Link
          to="/docs/$category/$article"
          params={{ category: 'getting-started', article: 'introduction' }}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Quick links grid */}
      <h2 className="text-2xl font-semibold mb-6">Explore the docs</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {docsConfig.navigation.map((section) => {
          const Icon = section.icon
          const firstItem = section.items[0]
          // Parse the href to get category and article
          const hrefParts = firstItem?.href.split('/').filter(Boolean) ?? []
          const category = hrefParts[1] ?? section.slug
          const article = hrefParts[2] ?? 'overview'

          return (
            <Link
              key={section.slug}
              to="/docs/$category/$article"
              params={{ category, article }}
              className="group rounded-lg border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                {Icon && (
                  <div className="rounded-md bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                )}
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {section.items.length} articles
              </p>
            </Link>
          )
        })}
      </div>
    </DocsContent>
  )
}
