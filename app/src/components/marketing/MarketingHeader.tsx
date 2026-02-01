import { Link } from '@tanstack/react-router'
import { LogIn } from 'lucide-react'

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#075056]/30 bg-[#1a2429]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a2429]/80">
      <div className="container mx-auto px-4">
        <div className="flex h-12 items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2429]"
          >
            <span className="text-lg font-bold text-[#FDF6E3]">OpenPasture</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[#FF5B04] text-[#FDF6E3] rounded">Beta</span>
          </Link>

          <nav className="flex items-center gap-4" aria-label="Main navigation">
            <a
              href="#how-it-works"
              className="text-xs text-[#D3DBDD] hover:text-[#FDF6E3] transition-colors hidden sm:inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2429]"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="text-xs text-[#D3DBDD] hover:text-[#FDF6E3] transition-colors hidden sm:inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2429]"
            >
              Features
            </a>
            <Link
              to="/investors"
              className="text-xs text-[#D3DBDD] hover:text-[#FDF6E3] transition-colors hidden md:inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2429]"
            >
              The Thesis
            </Link>
            <Link
              to="/technology"
              className="text-xs text-[#D3DBDD] hover:text-[#FDF6E3] transition-colors hidden md:inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2429]"
            >
              Technology
            </Link>
            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-medium border border-[#075056]/30 bg-transparent px-2.5 py-1.5 text-[#D3DBDD] hover:bg-[#075056]/20 hover:text-[#FDF6E3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2429]"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              Get Started
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
