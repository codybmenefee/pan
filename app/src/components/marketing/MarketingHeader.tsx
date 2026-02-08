import { Link } from '@tanstack/react-router'
import { Terminal } from 'lucide-react'

export function MarketingHeader() {
  return (
    <header className="border-b-2 border-border sticky top-0 z-50 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-dark flex items-center justify-center bg-olive">
            <Terminal className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold">openpasture</span>
          <span className="text-xs text-muted-foreground">v0.9.2</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
          <Link
            to="/technology"
            className="hover:opacity-70 transition-opacity text-muted-foreground"
          >
            technology
          </Link>
          <Link
            to="/investors"
            className="hover:opacity-70 transition-opacity text-muted-foreground"
          >
            thesis
          </Link>
          <Link
            to="/research"
            className="hover:opacity-70 transition-opacity text-muted-foreground"
          >
            research
          </Link>
          <a
            href="https://github.com/codybmenefee/pan"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition-opacity text-muted-foreground"
          >
            source
          </a>
          <Link
            to="/demo"
            className="hover:opacity-70 transition-opacity text-muted-foreground"
          >
            demo
          </Link>
          <Link
            to="/sign-in"
            className="rsc-cta"
            style={{ padding: '6px 16px', fontSize: '0.7rem' }}
          >
            get-started
          </Link>
        </nav>
      </div>
    </header>
  )
}
