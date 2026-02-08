import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAppAuth } from '@/lib/auth'
import { DEV_DEFAULT_ORG_ID, DEV_USER_EXTERNAL_ID } from '@/lib/auth/constants'
import { DEFAULT_FARM_ID } from '@/lib/convex/constants'
import type { UserDoc } from '@/lib/convex/mappers'

interface UseCurrentUserResult {
  user: UserDoc | null
  farmId: string | null
  isLoading: boolean
  isSeeding: boolean
}

export function useCurrentUser(): UseCurrentUserResult {
  const { userId, isLoaded, isSignedIn, isDevAuth, organizationId } = useAppAuth()
  const authReady = isDevAuth || (isLoaded && isSignedIn)
  const effectiveUserId = isDevAuth ? DEV_USER_EXTERNAL_ID : userId
  const seedSampleFarm = useMutation(api.farms.seedSampleFarm)
  const seedRequestedRef = useRef(false)
  const [isSeeding, setIsSeeding] = useState(false)

  const userDoc = useQuery(
    api.users.getUserByExternalId,
    authReady && effectiveUserId ? { externalId: effectiveUserId } : 'skip'
  ) as UserDoc | null | undefined

  // Create user mutation for Clerk users (without demo data)
  const createUser = useMutation(api.users.createUser)

  useEffect(() => {
    if (!authReady || !effectiveUserId) return
    if (userDoc !== null) return
    if (seedRequestedRef.current) return

    seedRequestedRef.current = true
    setIsSeeding(true)

    if (isDevAuth) {
      // Dev mode: seed sample farm with demo data
      void seedSampleFarm({
        farmId: DEFAULT_FARM_ID,
        seedUser: true,
        seedSettings: true,
        userExternalId: effectiveUserId,
      }).finally(() => setIsSeeding(false))
    } else {
      // Clerk auth: just create the user record, farms come from orgs
      void createUser({
        externalId: effectiveUserId,
        farmExternalId: organizationId ?? '',
      }).finally(() => setIsSeeding(false))
    }
  }, [authReady, effectiveUserId, seedSampleFarm, createUser, userDoc, isDevAuth, organizationId])

  const isLoading = !authReady || (effectiveUserId ? userDoc === undefined : false) || isSeeding

  // Use organization ID from Clerk context for farm ID
  // Fall back to user record's farmExternalId for backward compatibility
  const effectiveFarmId = (() => {
    // In dev mode, use the dev org ID
    if (isDevAuth) {
      return DEV_DEFAULT_ORG_ID
    }
    // If we have an active organization from Clerk, use that
    if (organizationId) {
      return organizationId
    }
    // Fall back to user record (legacy behavior)
    return userDoc?.farmExternalId ?? null
  })()

  return {
    user: userDoc ?? null,
    farmId: effectiveFarmId,
    isLoading,
    isSeeding,
  }
}
