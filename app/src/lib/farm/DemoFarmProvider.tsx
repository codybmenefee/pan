import { useMemo, type ReactNode } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useDemoAuth } from '@/lib/auth/DemoAuthProvider'
import { mapFarmDoc, type FarmDoc } from '@/lib/convex/mappers'
import { FarmContext } from './FarmContext'
import { isDemoDevMode } from '@/lib/demo/isDemoDevMode'
import type { Farm } from '@/lib/types'

interface FarmInfo {
  id: string
  name: string
}

export function DemoFarmProvider({ children }: { children: ReactNode }) {
  const { demoSessionId, organizationId } = useDemoAuth()

  // In dev mode, query farm-1 directly (not a demo farm copy)
  // This ensures mutations and queries target the same farm
  const demoFarmDoc = useQuery(
    isDemoDevMode ? api.farms.getFarm : api.demo.getDemoFarm,
    isDemoDevMode
      ? { farmId: 'farm-1' }
      : (demoSessionId ? { sessionId: demoSessionId } : 'skip')
  ) as FarmDoc | null | undefined

  // Map to domain type
  const activeFarm = useMemo<Farm | null>(() => {
    if (!demoFarmDoc) return null
    return mapFarmDoc(demoFarmDoc)
  }, [demoFarmDoc])

  // Demo mode only has one farm
  const availableFarms = useMemo<FarmInfo[]>(() => {
    if (!organizationId || !activeFarm) return []
    return [{ id: organizationId, name: activeFarm.name }]
  }, [organizationId, activeFarm])

  // No-op for demo mode - only one farm
  const switchFarm = async (_farmId: string) => {
    // Demo mode doesn't support switching farms
  }

  // In dev mode, loading is based on whether we got farm-1 yet
  // In public demo mode, loading is based on session ID and demo farm query
  const isLoading = isDemoDevMode
    ? demoFarmDoc === undefined
    : (demoSessionId !== null && demoFarmDoc === undefined)

  const value = useMemo(() => ({
    activeFarmId: organizationId,
    activeFarm,
    availableFarms,
    isLoading,
    switchFarm,
  }), [organizationId, activeFarm, availableFarms, isLoading])

  // Use the same FarmContext so useFarmContext() works in demo mode
  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  )
}
