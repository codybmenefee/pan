import { createContext, useContext, useMemo, useCallback, useEffect, useRef, type ReactNode } from 'react'
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
    isDevAuth,
  } = useAppAuth()

  // Track which orgs we've already tried to create farms for
  const createdFarmsRef = useRef<Set<string>>(new Set())

  // Track if we've already tried to auto-activate an org
  const autoActivatedRef = useRef(false)

  // Auto-select first organization if user has orgs but none is active
  useEffect(() => {
    if (isDevAuth || autoActivatedRef.current) return
    if (!isOrgLoaded) return
    // If user has orgs but no active one, activate the first
    if (organizationList.length > 0 && !organizationId) {
      autoActivatedRef.current = true
      console.log('[FarmContext] No active org, auto-selecting first:', organizationList[0].id)
      void setActiveOrganization(organizationList[0].id)
    }
  }, [isDevAuth, isOrgLoaded, organizationList, organizationId, setActiveOrganization])

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
  const createFarmFromOrg = useMutation(api.organizations.createFarmFromOrg)

  // Auto-create farm records for Clerk organizations that don't have one
  useEffect(() => {
    if (isDevAuth || !farmsData || !organizationList.length) return

    // Find orgs that don't have a corresponding farm
    const existingFarmIds = new Set(farmsData.map(f => f.externalId))

    for (const org of organizationList) {
      if (!existingFarmIds.has(org.id) && !createdFarmsRef.current.has(org.id)) {
        createdFarmsRef.current.add(org.id)
        // Create a blank farm for this org
        void createFarmFromOrg({
          clerkOrgId: org.id,
          name: org.name,
        })
      }
    }
  }, [isDevAuth, farmsData, organizationList, createFarmFromOrg])

  // Build available farms list from Clerk organizations
  // Always use Clerk org name (source of truth) for the dropdown
  const availableFarms = useMemo<FarmInfo[]>(() => {
    return organizationList.map(org => ({
      id: org.id,
      name: org.name,
    }))
  }, [organizationList])

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

  // Loading if: org data not loaded, or waiting for farm doc, or need to auto-activate an org
  const needsAutoActivation = organizationList.length > 0 && !organizationId
  const isLoading = !isOrgLoaded || (organizationId !== null && activeFarmDoc === undefined) || needsAutoActivation

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
