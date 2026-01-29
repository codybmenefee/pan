import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { AnimalType, LivestockSummary } from '@/lib/types'
import { useFarmContext } from '@/lib/farm'

interface UseLivestockResult {
  summary: LivestockSummary | null
  isLoading: boolean
  upsertLivestock: (data: {
    animalType: AnimalType
    adultCount: number
    offspringCount: number
    notes?: string
  }) => Promise<void>
}

export function useLivestock(): UseLivestockResult {
  const { activeFarmId } = useFarmContext()

  const summaryData = useQuery(
    api.livestock.getLivestockSummary,
    activeFarmId ? { farmId: activeFarmId } : 'skip'
  )

  const upsertMutation = useMutation(api.livestock.upsertLivestock)

  const isLoading = activeFarmId ? summaryData === undefined : false

  const upsertLivestock = async (data: {
    animalType: AnimalType
    adultCount: number
    offspringCount: number
    notes?: string
  }) => {
    if (!activeFarmId) {
      throw new Error('Farm ID is unavailable.')
    }
    await upsertMutation({
      farmId: activeFarmId,
      ...data,
    })
  }

  return {
    summary: summaryData as LivestockSummary | null,
    isLoading,
    upsertLivestock,
  }
}
