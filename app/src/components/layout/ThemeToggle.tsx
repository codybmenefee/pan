import { Moon } from 'lucide-react'

export function ThemeToggle() {
  // Dark mode only - no toggle functionality
  return (
    <div className="h-9 w-9 flex items-center justify-center text-muted-foreground">
      <Moon className="h-4 w-4" />
      <span className="sr-only">Dark mode</span>
    </div>
  )
}
