/**
 * React hooks for farmer observations.
 */

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

/**
 * Query hook for farmer observations by farm.
 */
export function useFarmerObservations(farmId: Id<'farms'>) {
  return useQuery(api.farmerObservations.listByFarm, { farmId })
}

/**
 * Query hook for farmer observations by target (paddock, zone, or farm).
 */
export function useFarmerObservationsByTarget(
  level: 'farm' | 'paddock' | 'zone',
  targetId: string
) {
  return useQuery(api.farmerObservations.listByTarget, { level, targetId })
}

/**
 * Query hook for recent farmer observations.
 */
export function useRecentFarmerObservations(
  farmId: Id<'farms'>,
  limit?: number
) {
  return useQuery(api.farmerObservations.listRecent, { farmId, limit })
}

/**
 * Mutation hook for creating a farmer observation.
 */
export function useCreateFarmerObservation() {
  return useMutation(api.farmerObservations.create)
}
