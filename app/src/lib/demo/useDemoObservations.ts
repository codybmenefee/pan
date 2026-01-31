/**
 * Demo-aware farmer observations hook.
 *
 * - VITE_DEV_AUTH=true (Developer): Observations read/write from Convex
 * - Otherwise (Public Demo): Observations stored in localStorage
 *
 * Note: Satellite observations are read-only (from imagery) and don't need
 * a demo layer - they're always read from Convex.
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { useDemoAuth } from '@/lib/auth/DemoAuthProvider'
import { isDemoDevMode } from './isDemoDevMode'
import {
  getDemoFarmerObservations,
  addDemoFarmerObservation,
  type DemoFarmerObservation,
} from './demoLocalStorage'

/**
 * Demo-aware hook for listing farmer observations by farm.
 */
export function useDemoFarmerObservations(farmId: Id<'farms'>) {
  const { demoSessionId } = useDemoAuth()
  const [localStorageVersion, setLocalStorageVersion] = useState(0)

  // Convex query for base observations
  const convexObservations = useQuery(api.farmerObservations.listByFarm, { farmId })

  // Merge with localStorage observations for public demo mode
  const observations = useMemo(() => {
    if (isDemoDevMode || !demoSessionId) {
      return convexObservations ?? []
    }
    // Force dependency on localStorageVersion for re-render
    void localStorageVersion
    const localObservations = getDemoFarmerObservations(demoSessionId)
    const baseObservations = convexObservations ?? []
    // Combine Convex + localStorage observations
    return [...baseObservations, ...localObservations]
  }, [convexObservations, demoSessionId, localStorageVersion])

  // Return setter for triggering updates (used by create hook)
  return { observations, triggerUpdate: () => setLocalStorageVersion((v) => v + 1) }
}

/**
 * Demo-aware hook for listing recent farmer observations.
 */
export function useDemoRecentFarmerObservations(farmId: Id<'farms'>, limit?: number) {
  const { demoSessionId } = useDemoAuth()
  const [localStorageVersion, setLocalStorageVersion] = useState(0)

  // Convex query for base observations
  const convexObservations = useQuery(api.farmerObservations.listRecent, { farmId, limit })

  // Merge with localStorage observations for public demo mode
  const observations = useMemo(() => {
    if (isDemoDevMode || !demoSessionId) {
      return convexObservations ?? []
    }
    void localStorageVersion
    const localObservations = getDemoFarmerObservations(demoSessionId)
    const baseObservations = convexObservations ?? []
    // Combine and sort by createdAt, then limit
    const combined = [...baseObservations, ...localObservations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return limit ? combined.slice(0, limit) : combined
  }, [convexObservations, demoSessionId, localStorageVersion, limit])

  return { observations, triggerUpdate: () => setLocalStorageVersion((v) => v + 1) }
}

/**
 * Demo-aware hook for creating farmer observations.
 */
export function useDemoCreateFarmerObservation() {
  const { demoSessionId } = useDemoAuth()
  const [, setLocalStorageVersion] = useState(0)

  // Convex mutation (only used in dev mode)
  const createObservation = useMutation(api.farmerObservations.create)

  const triggerLocalStorageUpdate = useCallback(() => {
    setLocalStorageVersion((v) => v + 1)
  }, [])

  const create = useCallback(
    async (args: {
      farmId: Id<'farms'>
      authorId: string
      level: 'farm' | 'paddock' | 'zone'
      targetId: string
      content: string
      tags?: string[]
    }) => {
      if (isDemoDevMode) {
        // Developer mode: save to Convex
        return await createObservation(args)
      } else if (demoSessionId) {
        // Public demo mode: save to localStorage
        const observation: DemoFarmerObservation = {
          id: `demo-obs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          farmId: args.farmId,
          authorId: args.authorId,
          level: args.level,
          targetId: args.targetId,
          content: args.content,
          tags: args.tags,
          createdAt: new Date().toISOString(),
        }
        addDemoFarmerObservation(demoSessionId, observation)
        triggerLocalStorageUpdate()
        return observation.id
      }
    },
    [demoSessionId, createObservation, triggerLocalStorageUpdate]
  )

  return create
}

// Re-export the type for use in other modules
export type { DemoFarmerObservation }
