import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAppAuth } from '@/lib/auth'
import { mapFarmDoc, type FarmDoc } from '@/lib/convex/mappers'
import type { Farm } from '@/lib/types'

interface FarmInfo {
  id: string
  name: string
}

interface FarmContextValue {
  activeFarmId: string | null         // Clerk org ID
  activeFarm: Farm | null             // Full farm data from Convex
  availableFarms: FarmInfo[]          // List of farms user has access to
  isLoading: boolean
  switchFarm: (farmId: string) => Promise<void>
}

const FarmContext = createContext<FarmContextValue | null>(null)

export function FarmProvider({ children }: { children: ReactNode }) {
  const {
    userId,
    organizationId,
    organizationList,
    isOrgLoaded,
    setActiveOrganization,
  } = useAppAuth()

  // Get all farm records for the user's organizations
  const orgIds = useMemo(() => organizationList.map(org => org.id), [organizationList])

  const farmsData = useQuery(
    api.organizations.getFarmsByOrgIds,
    orgIds.length > 0 ? { orgIds } : 'skip'
  ) as FarmDoc[] | undefined

  // Get the active farm based on organization context
  const activeFarmDoc = useQuery(
    api.organizations.getFarmByIdOrLegacy,
    organizationId ? { farmId: organizationId } : 'skip'
  ) as FarmDoc | null | undefined

  const setActiveFarmMutation = useMutation(api.organizations.setActiveFarm)

  // Build available farms list by merging Clerk org info with farm data
  const availableFarms = useMemo<FarmInfo[]>(() => {
    // Use farm data if available, otherwise fall back to org list
    if (farmsData && farmsData.length > 0) {
      return farmsData.map(farm => ({
        id: farm.externalId,
        name: farm.name,
      }))
    }
    // Fall back to Clerk org names if no farm data yet
    return organizationList.map(org => ({
      id: org.id,
      name: org.name,
    }))
  }, [farmsData, organizationList])

  // Map active farm to domain type
  const activeFarm = useMemo<Farm | null>(() => {
    if (!activeFarmDoc) return null
    return mapFarmDoc(activeFarmDoc)
  }, [activeFarmDoc])

  const switchFarm = useCallback(async (farmId: string) => {
    // Update Clerk organization context
    await setActiveOrganization(farmId)

    // Also persist to user record for consistency
    if (userId) {
      await setActiveFarmMutation({
        userExternalId: userId,
        farmExternalId: farmId,
      })
    }
  }, [setActiveOrganization, userId, setActiveFarmMutation])

  const isLoading = !isOrgLoaded || (organizationId !== null && activeFarmDoc === undefined)

  const value = useMemo<FarmContextValue>(() => ({
    activeFarmId: organizationId,
    activeFarm,
    availableFarms,
    isLoading,
    switchFarm,
  }), [organizationId, activeFarm, availableFarms, isLoading, switchFarm])

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  )
}

export function useFarmContext() {
  const context = useContext(FarmContext)
  if (!context) {
    throw new Error('useFarmContext must be used within FarmProvider')
  }
  return context
}
