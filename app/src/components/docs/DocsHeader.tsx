import { Link } from '@tanstack/react-router'
import { Menu, Search, Github, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { docsConfig } from '@/lib/docs/navigation'

interface DocsHeaderProps {
  onMenuClick: () => void
}

export function DocsHeader({ onMenuClick }: DocsHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-border bg-background">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <Link
            to="/docs"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <div className="w-6 h-6 bg-olive flex items-center justify-center">
              <Terminal className="h-3.5 w-3.5 text-white" />
            </div>
            {docsConfig.title}
            <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Docs</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {}}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <a
            href="https://github.com/codybmenefee/pan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  )
}
