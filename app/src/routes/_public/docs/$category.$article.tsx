import { createFileRoute, Link } from '@tanstack/react-router'
import { DocsContent, DocsBreadcrumb } from '@/components/docs'
import { docsConfig } from '@/lib/docs/navigation'
import { getArticleContent } from '@/lib/docs/content'
import type { ArticleSection } from '@/lib/docs/content'

export const Route = createFileRoute('/_public/docs/$category/$article')({
  component: DocsArticlePage,
})

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function CodeBlock({
  code,
  language,
  filename,
}: {
  code: string
  language: string
  filename?: string
}) {
  return (
    <div className="not-prose my-4 rounded-lg border border-border bg-muted/50 overflow-hidden">
      {filename && (
        <div className="px-4 py-2 border-b border-border bg-muted text-sm text-muted-foreground font-mono">
          {filename}
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className={`language-${language} text-sm`}>{code}</code>
      </pre>
    </div>
  )
}

function ArticleSectionContent({ section }: { section: ArticleSection }) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">
        {section.heading}
      </h2>
      <div
        className="prose prose-slate dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(section.content) }}
      />
      {section.codeExample && (
        <CodeBlock
          code={section.codeExample.code}
          language={section.codeExample.language}
          filename={section.codeExample.filename}
        />
      )}
    </section>
  )
}

function RelatedArticles({ hrefs }: { hrefs: string[] }) {
  const articles = hrefs
    .map((href) => {
      for (const section of docsConfig.navigation) {
        const item = section.items.find((i) => i.href === href)
        if (item) {
          return { ...item, section: section.title }
        }
      }
      return null
    })
    .filter(Boolean)

  if (articles.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Related Articles
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {articles.map(
          (article) =>
            article && (
              <Link
                key={article.href}
                to={article.href}
                className="group block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {article.section}
                </div>
                <div className="font-medium text-foreground group-hover:text-primary">
                  {article.title}
                </div>
              </Link>
            )
        )}
      </div>
    </div>
  )
}

// Simple markdown parser for basic formatting
function parseMarkdown(text: string): string {
  return (
    text
      // Code blocks (must come before inline code)
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      // Unordered lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc list-inside space-y-1 my-4">$&</ul>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Paragraphs (double newline)
      .replace(/\n\n/g, '</p><p class="mb-4">')
      // Single line breaks in lists should not create paragraphs
      .replace(/<\/li><\/p><p class="mb-4"><li>/g, '</li><li>')
      // Wrap in paragraph
      .replace(/^(.+)$/s, '<p class="mb-4">$1</p>')
      // Clean up empty paragraphs
      .replace(/<p class="mb-4"><\/p>/g, '')
      // Clean up paragraph inside list
      .replace(/<p class="mb-4">(<ul|<ol)/g, '$1')
      .replace(/(<\/ul>|<\/ol>)<\/p>/g, '$1')
  )
}

function DocsArticlePage() {
  const { category, article } = Route.useParams()

  // Find the section and item in the navigation config
  const section = docsConfig.navigation.find((s) => s.slug === category)
  const item = section?.items.find(
    (i) => i.href === `/docs/${category}/${article}`
  )

  // Get article content from registry
  const content = getArticleContent(category, article)

  return (
    <DocsContent>
      <DocsBreadcrumb category={category} article={article} />

      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
        {content?.title ?? item?.title ?? formatSlug(article)}
      </h1>

      {item?.badge && (
        <span
          className={`
            inline-block mb-6 rounded-full px-2 py-1 text-xs font-medium uppercase tracking-wide
            ${item.badge === 'New' ? 'bg-olive/10 text-olive' : ''}
            ${item.badge === 'Beta' ? 'bg-terracotta/10 text-terracotta' : ''}
            ${item.badge === 'Updated' ? 'bg-blue-500/10 text-blue-500' : ''}
          `}
        >
          {item.badge}
        </span>
      )}

      {content?.description && (
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          {content.description}
        </p>
      )}

      {content ? (
        <>
          {content.sections.map((section, index) => (
            <ArticleSectionContent key={index} section={section} />
          ))}

          {content.relatedArticles && content.relatedArticles.length > 0 && (
            <RelatedArticles hrefs={content.relatedArticles} />
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">
            This is a placeholder for the{' '}
            <strong>{formatSlug(article)}</strong> documentation.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Content will be added here.
          </p>
        </div>
      )}
    </DocsContent>
  )
}
