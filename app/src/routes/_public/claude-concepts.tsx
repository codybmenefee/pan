import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { ConceptSwitcher } from '@/components/landing-concepts/ConceptSwitcher'

const claudeSearchSchema = z.object({
  hideSwitcher: z.string().optional(),
})

export const Route = createFileRoute('/_public/claude-concepts')({
  validateSearch: search => {
    const parsed = claudeSearchSchema.safeParse(search)
    const rawHideSwitcher = parsed.success ? parsed.data.hideSwitcher : undefined
    return {
      hideSwitcher: rawHideSwitcher === 'true' || rawHideSwitcher === '1',
    }
  },
  component: ClaudeConceptsPage,
})

function ClaudeConceptsPage() {
  const { hideSwitcher } = useSearch({ from: '/_public/claude-concepts' })
  const [isSwitcherHidden, setIsSwitcherHidden] = useState(hideSwitcher)

  useEffect(() => {
    setIsSwitcherHidden(hideSwitcher)
  }, [hideSwitcher])

  return (
    <ConceptSwitcher
      hideSwitcher={isSwitcherHidden}
      onToggleSwitcher={nextHidden => {
        setIsSwitcherHidden(nextHidden)
      }}
    />
  )
}
