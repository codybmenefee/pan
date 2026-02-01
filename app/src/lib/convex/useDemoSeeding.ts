import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useDemoAuth } from '@/lib/auth/DemoAuthProvider'
import { isDemoDevMode } from '@/lib/demo/isDemoDevMode'

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

  // In dev mode, query farm-1 directly (no seeding needed)
  // In public demo mode, check if demo farm already exists
  const demoFarm = useQuery(
    isDemoDevMode ? api.farms.getFarm : api.demo.getDemoFarm,
    isDemoDevMode
      ? { farmId: 'farm-1' }
      : (demoSessionId ? { sessionId: demoSessionId } : 'skip')
  )

  // Seed demo farm on first load (only in public demo mode)
  // In dev mode, we use farm-1 directly and don't need to seed
  useEffect(() => {
    if (isDemoDevMode) return // Dev mode uses farm-1 directly
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
