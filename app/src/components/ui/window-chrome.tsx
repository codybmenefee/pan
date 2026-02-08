import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WindowChromeProps {
  title: string
  children: ReactNode
  className?: string
}

export function WindowChrome({ title, children, className }: WindowChromeProps) {
  return (
    <div className={cn('rsc-window', className)}>
      <div className="rsc-window-bar">
        <div className="rsc-window-dot" style={{ background: '#d45a5a' }} />
        <div className="rsc-window-dot" style={{ background: '#d4a84a' }} />
        <div className="rsc-window-dot" style={{ background: '#5aaa5a' }} />
        <span className="text-xs text-white/60 ml-2">{title}</span>
      </div>
      <div className="p-0">
        {children}
      </div>
    </div>
  )
}
