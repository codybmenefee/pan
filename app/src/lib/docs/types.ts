import type { LucideIcon } from 'lucide-react'

export interface DocsNavItem {
  title: string
  href: string
  badge?: 'New' | 'Beta' | 'Updated'
  external?: boolean
}

export interface DocsNavSection {
  title: string
  slug: string
  icon?: LucideIcon
  items: DocsNavItem[]
  defaultOpen?: boolean
}

export interface DocsConfig {
  title: string
  description: string
  navigation: DocsNavSection[]
}
