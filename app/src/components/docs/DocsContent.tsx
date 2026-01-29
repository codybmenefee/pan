interface DocsContentProps {
  children: React.ReactNode
}

export function DocsContent({ children }: DocsContentProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-8 lg:px-12">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          {children}
        </article>
      </div>
    </div>
  )
}
