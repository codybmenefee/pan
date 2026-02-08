import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { useFarmContext } from '@/lib/farm'
import { useAppAuth } from '@/lib/auth'
import { hasAgentDashboardAccess } from '@/lib/agentAccess'
import type { AgentBehaviorConfig, AgentProfileId, AgentTriggerType } from '@/lib/types'

export function useAgentDashboard() {
  const { activeFarmId, isLoading: farmLoading } = useFarmContext()
  const { hasFeature, hasPlan, isDevAuth } = useAppAuth()
  const canAccess = hasAgentDashboardAccess({ hasFeature, hasPlan, isDevAuth })

  const dashboardState = useQuery(
    api.agentAdmin.getDashboardState,
    activeFarmId && canAccess ? { farmExternalId: activeFarmId } : 'skip'
  )

  const listRunsQuery = useQuery(
    api.agentAdmin.listAgentRuns,
    activeFarmId && canAccess ? { farmExternalId: activeFarmId, limit: 50 } : 'skip'
  )

  const listMemoriesQuery = useQuery(
    api.agentAdmin.listMemories,
    activeFarmId && canAccess ? { farmExternalId: activeFarmId, status: 'active', limit: 200 } : 'skip'
  )
  const listArchivedMemoriesQuery = useQuery(
    api.agentAdmin.listMemories,
    activeFarmId && canAccess ? { farmExternalId: activeFarmId, status: 'archived', limit: 200 } : 'skip'
  )

  const updateAgentConfig = useMutation(api.agentAdmin.updateAgentConfig)
  const updatePromptOverride = useMutation(api.agentAdmin.updatePromptOverride)
  const upsertGrazingRules = useMutation(api.agentAdmin.upsertGrazingRules)
  const createMemory = useMutation(api.agentAdmin.createMemory)
  const updateMemoryMutation = useMutation(api.agentAdmin.updateMemory)
  const archiveMemoryMutation = useMutation(api.agentAdmin.archiveMemory)
  const promoteObservationToMemoryMutation = useMutation(api.agentAdmin.promoteObservationToMemory)
  const simulateRun = useAction(api.agentAdmin.simulateRun)

  const isLoading = farmLoading || (canAccess && activeFarmId !== null && dashboardState === undefined)

  return {
    farmId: activeFarmId,
    canAccess,
    isLoading,
    dashboardState: dashboardState ?? null,
    runs: listRunsQuery?.items ?? [],
    memories: listMemoriesQuery?.items ?? [],
    archivedMemories: listArchivedMemoriesQuery?.items ?? [],
    nextRunsCursor: listRunsQuery?.nextCursor ?? null,
    nextMemoriesCursor: listMemoriesQuery?.nextCursor ?? null,
    nextArchivedMemoriesCursor: listArchivedMemoriesQuery?.nextCursor ?? null,
    saveBehavior: async (profileId: AgentProfileId, behaviorConfig: AgentBehaviorConfig) => {
      if (!activeFarmId) throw new Error('Farm ID is unavailable.')
      await updateAgentConfig({ farmExternalId: activeFarmId, profileId, behaviorConfig })
    },
    savePromptOverride: async (enabled: boolean, text: string) => {
      if (!activeFarmId) throw new Error('Farm ID is unavailable.')
      await updatePromptOverride({ farmExternalId: activeFarmId, enabled, text })
    },
    saveRules: async (rules: {
      minDaysPerSection?: number
      maxDaysPerSection?: number
      minNdviThreshold?: number
      preferHighNdviAreas?: boolean
      requireAdjacentSections?: boolean
      allowSectionOverlapPct?: number
      customRules?: string[]
    }) => {
      if (!activeFarmId) throw new Error('Farm ID is unavailable.')
      await upsertGrazingRules({ farmExternalId: activeFarmId, ...rules })
    },
    createMemory: async (memory: {
      scope: 'farm' | 'paddock'
      targetId?: string
      title: string
      content: string
      tags?: string[]
      priority: number
    }) => {
      if (!activeFarmId) throw new Error('Farm ID is unavailable.')
      await createMemory({ farmExternalId: activeFarmId, ...memory })
    },
    updateMemory: async (memory: {
      memoryId: string
      title?: string
      content?: string
      tags?: string[]
      priority?: number
      status?: 'active' | 'archived'
    }) => {
      await updateMemoryMutation({
        ...memory,
        memoryId: memory.memoryId as Id<'agentMemories'>,
      })
    },
    archiveMemory: async (memoryId: string) => {
      await archiveMemoryMutation({ memoryId: memoryId as Id<'agentMemories'> })
    },
    unarchiveMemory: async (memoryId: string) => {
      await updateMemoryMutation({
        memoryId: memoryId as Id<'agentMemories'>,
        status: 'active',
      })
    },
    promoteObservation: async (
      observationId: string,
      title: string,
      priority: number
    ) => {
      await promoteObservationToMemoryMutation({
        observationId: observationId as Id<'farmerObservations'>,
        title,
        priority,
      })
    },
    runDryRun: async (trigger: AgentTriggerType, profileOverride?: AgentProfileId) => {
      if (!activeFarmId) throw new Error('Farm ID is unavailable.')
      return await simulateRun({ farmExternalId: activeFarmId, trigger, profileOverride })
    },
  }
}

export function useAgentRunDeepDive(runId: Id<'agentRuns'> | null) {
  const deepDive = useQuery(
    api.agentAdmin.getAgentRunDeepDive,
    runId ? { runId } : 'skip'
  )

  return {
    deepDive: deepDive ?? null,
    isLoading: runId !== null && deepDive === undefined,
  }
}
