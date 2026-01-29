import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'

interface BriefPanelContextValue {
  briefOpen: boolean
  setBriefOpen: (open: boolean) => void
  toggleBrief: () => void
}

const BriefPanelContext = createContext<BriefPanelContextValue | null>(null)

export function BriefPanelProvider({ children }: { children: ReactNode }) {
  // Default to closed - user can open when ready
  const [briefOpen, setBriefOpen] = useState(false)

  const value = useMemo<BriefPanelContextValue>(() => ({
    briefOpen,
    setBriefOpen,
    toggleBrief: () => setBriefOpen(prev => !prev),
  }), [briefOpen])

  return (
    <BriefPanelContext.Provider value={value}>
      {children}
    </BriefPanelContext.Provider>
  )
}

export function useBriefPanel() {
  const context = useContext(BriefPanelContext)
  if (!context) {
    throw new Error('useBriefPanel must be used within BriefPanelProvider')
  }
  return context
}
