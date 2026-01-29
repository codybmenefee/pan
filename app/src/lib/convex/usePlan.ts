import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAppAuth } from '../auth'


export function useTodayPlan(farmExternalId: string) {
  const { userId } = useAppAuth()
  const shouldSkip = !farmExternalId
  const plan = useQuery(
    api.intelligence.getTodayPlan,
    shouldSkip
      ? 'skip'
      : {
          farmExternalId,
        }
  )

  const generatePlan = useAction(api.intelligenceActions.generateDailyPlan)
  const approvePlan = useMutation(api.intelligence.approvePlan)
  const submitFeedback = useMutation(api.intelligence.submitFeedback)
  const deleteTodayPlan = useMutation(api.intelligence.deleteTodayPlan)

  const isLoading = shouldSkip || plan === undefined
  const isError = !shouldSkip && plan === null

  return {
    plan,
    isLoading,
    isError,
    generatePlan: async () => {
      if (!farmExternalId) {
        throw new Error('Farm ID is unavailable.')
      }
      const result = await generatePlan({ farmExternalId, userId: userId || undefined })
      if (!result) {
        throw new Error('Plan generation did not produce a plan.')
      }
      return result
    },
    approvePlan: (planId: string, userId: string) =>
      approvePlan({ planId, userId } as { planId: string & { __tableName: 'plans' }, userId: string }),
    submitFeedback: (planId: string, feedback: string) =>
      submitFeedback({ planId, feedback } as { planId: string & { __tableName: 'plans' }, feedback: string }),
    deleteTodayPlan: () => deleteTodayPlan({ farmExternalId }),
  }
}


export function usePlanHistory(farmExternalId: string, days: number = 30) {
  const history = useQuery(api.intelligence.getPlanHistory, {
    farmExternalId,
    days,
  })

  return {
    history,
    isLoading: history === undefined,
  }
}


export function usePlan(planId: string) {
  const plan = useQuery(api.intelligence.getPlanById, { planId } as { planId: string & { __tableName: 'plans' } })

  return {
    plan,
    isLoading: plan === undefined,
  }
}
