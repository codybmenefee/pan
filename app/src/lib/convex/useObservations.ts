import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export interface Observation {
  _id: Id<'observations'>
  farmExternalId: string
  paddockExternalId: string
  date: string
  ndviMean: number
  ndviMin: number
  ndviMax: number
  ndviStd: number
  eviMean: number
  ndwiMean: number
  cloudFreePct: number
  pixelCount: number
  isValid: boolean
  sourceProvider: string
  resolutionMeters: number
  createdAt: string
}

export interface ObservationTrend {
  date: string
  ndvi: number
  isValid: boolean
}

interface UseObservationsResult {
  observations: Observation[]
  isLoading: boolean
  error: Error | null
}

interface UseLatestObservationResult {
  observation: Observation | null
  isLoading: boolean
  error: Error | null
}

interface UseObservationsTrendResult {
  trend: ObservationTrend[]
  isLoading: boolean
  error: Error | null
}

export function useObservations(
  farmId: string,
  options?: { paddockId?: string; days?: number }
): UseObservationsResult {
  const observations = useQuery(
    api.observations.getObservations,
    farmId
      ? { farmId, pastureId: options?.paddockId, days: options?.days }
      : 'skip'
  ) as Observation[] | undefined

  const isLoading = observations === undefined
  const error = null

  return {
    observations: observations ?? [],
    isLoading,
    error,
  }
}

export function useLatestObservation(
  farmId: string,
  paddockId: string
): UseLatestObservationResult {
  const observation = useQuery(
    api.observations.getLatestObservation,
    farmId && paddockId
      ? { farmId, pastureId: paddockId }
      : 'skip'
  ) as Observation | null | undefined

  const isLoading = observation === undefined

  return {
    observation: observation ?? null,
    isLoading,
    error: null,
  }
}

export function useObservationsByDate(
  farmId: string,
  date: string
): UseObservationsResult {
  const observations = useQuery(
    api.observations.getObservationsByDate,
    farmId && date
      ? { farmId, date }
      : 'skip'
  ) as Observation[] | undefined

  const isLoading = observations === undefined

  return {
    observations: observations ?? [],
    isLoading,
    error: null,
  }
}

export function useObservationsTrend(
  paddockId: string,
  days: number = 21
): UseObservationsTrendResult {
  const trend = useQuery(
    api.observations.getObservationsTrend,
    paddockId
      ? { pastureId: paddockId, days }
      : 'skip'
  ) as ObservationTrend[] | undefined

  const isLoading = trend === undefined

  return {
    trend: trend ?? [],
    isLoading,
    error: null,
  }
}

export function useRefreshObservations() {
  return useMutation(api.observations.refreshObservations)
}

export function useDeleteObservations() {
  return useMutation(api.observations.deleteObservations)
}

export function useRefreshFarmObservations() {
  const refreshObservations = useMutation(api.observations.refreshObservations)

  return async (farmId: string, observations: Omit<Observation, '_id'>[]) => {
    return refreshObservations({
      observations: observations.map(obs => ({
        ...obs,
        farmExternalId: farmId,
      })),
    })
  }
}
