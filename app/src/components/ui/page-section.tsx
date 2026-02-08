import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageSectionProps {
  maxWidth?: '4xl' | '5xl' | '6xl' | '7xl'
  bg?: 'cream' | 'white' | 'dark'
  className?: string
  children: ReactNode
}

const maxWidthMap = {
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
}

const bgMap = {
  cream: 'bg-background',
  white: 'bg-white',
  dark: 'bg-dark text-white',
}

export function PageSection({
  maxWidth = '5xl',
  bg = 'cream',
  className,
  children,
}: PageSectionProps) {
  return (
    <section className={cn('px-6 py-24', bgMap[bg], className)}>
      <div className={cn('mx-auto', maxWidthMap[maxWidth])}>
        {children}
      </div>
    </section>
  )
}
