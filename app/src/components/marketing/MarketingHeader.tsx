import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/marketing" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-slate-100">Morning Farm Brief</span>
          </Link>

          <nav className="flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden sm:inline-block"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden sm:inline-block"
            >
              Features
            </a>
            <Link
              to="/investors"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden md:inline-block"
            >
              For Investors
            </Link>
            <Link
              to="/technology"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden md:inline-block"
            >
              Technology
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              onClick={() => window.location.href = '/onboarding'}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Get Started
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
