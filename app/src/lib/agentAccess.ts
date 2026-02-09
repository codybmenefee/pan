import { AGENT_MONITOR_FEATURE_SLUGS, hasAnyFeature, hasAnyPlan } from '@/lib/auth/billing'

export function hasAgentDashboardAccess(args: {
  hasFeature: (featureKey: string) => boolean
  hasPlan: (plan: string) => boolean
  isDevAuth?: boolean
}): boolean {
  if (args.isDevAuth) return true
  return (
    hasAnyFeature(args.hasFeature, AGENT_MONITOR_FEATURE_SLUGS) ||
    hasAnyPlan(args.hasPlan, ['producer', 'commercial', 'professional', 'enterprise'])
  )
}
