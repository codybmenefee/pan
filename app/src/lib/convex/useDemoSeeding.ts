import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useDemoAuth } from '@/lib/auth/DemoAuthProvider'

interface UseDemoSeedingResult {
  isSeeding: boolean
  isSeeded: boolean
  error: string | null
}

export function useDemoSeeding(): UseDemoSeedingResult {
  const { demoSessionId } = useDemoAuth()
  const seedDemoFarm = useMutation(api.demo.seedDemoFarm)
  const seedRequestedRef = useRef(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if demo farm already exists
  const demoFarm = useQuery(
    api.demo.getDemoFarm,
    demoSessionId ? { sessionId: demoSessionId } : 'skip'
  )

  // Seed demo farm on first load
  useEffect(() => {
    if (!demoSessionId) return
    if (demoFarm !== null && demoFarm !== undefined) return // Farm already exists
    if (demoFarm === undefined) return // Still loading
    if (seedRequestedRef.current) return

    seedRequestedRef.current = true
    setIsSeeding(true)

    void seedDemoFarm({ sessionId: demoSessionId })
      .then(() => {
        setIsSeeding(false)
      })
      .catch((err) => {
        console.error('[useDemoSeeding] Error seeding demo farm:', err)
        setError(err instanceof Error ? err.message : 'Failed to seed demo farm')
        setIsSeeding(false)
      })
  }, [demoSessionId, demoFarm, seedDemoFarm])

  return {
    isSeeding,
    isSeeded: demoFarm !== null && demoFarm !== undefined,
    error,
  }
}
