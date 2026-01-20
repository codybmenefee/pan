import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'


export function useTodayPlan(farmExternalId: string) {
  const plan = useQuery(api.intelligence.getTodayPlan, {
    farmExternalId,
  })

  const generatePlan = useAction(api.intelligenceActions.generateDailyPlan)
  const approvePlan = useMutation(api.intelligence.approvePlan)
  const submitFeedback = useMutation(api.intelligence.submitFeedback)

  const isLoading = plan === undefined
  const isError = plan === null

  return {
    plan,
    isLoading,
    isError,
    generatePlan: () => generatePlan({ farmExternalId }),
    approvePlan: (planId: string, userId: string) =>
      approvePlan({ planId, userId }),
    submitFeedback: (planId: string, feedback: string) =>
      submitFeedback({ planId, feedback }),
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
  const plan = useQuery(api.intelligence.getPlanById, { planId })

  return {
    plan,
    isLoading: plan === undefined,
  }
}
