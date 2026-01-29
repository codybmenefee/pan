import { Link } from '@tanstack/react-router'
import { Menu, Search, Github, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { docsConfig } from '@/lib/docs/navigation'
import { useEffect, useState } from 'react'

interface DocsHeaderProps {
  onMenuClick: () => void
}

export function DocsHeader({ onMenuClick }: DocsHeaderProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <Link
            to="/docs"
            className="flex items-center gap-2 text-lg font-semibold text-slate-100"
          >
            {docsConfig.title}
            <span className="text-xs font-normal text-slate-400">Docs</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            onClick={() => {}}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <a
            href="https://github.com/codybmenefee/pan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </a>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
