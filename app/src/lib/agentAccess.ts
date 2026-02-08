export const AGENT_DASHBOARD_FEATURE_KEY = 'agent_dashboard'

export function hasAgentDashboardAccess(args: {
  hasFeature: (featureKey: string) => boolean
  hasPlan: (plan: string) => boolean
  isDevAuth?: boolean
}): boolean {
  if (args.isDevAuth) return true
  return (
    args.hasFeature(AGENT_DASHBOARD_FEATURE_KEY) ||
    args.hasPlan('producer') ||
    args.hasPlan('commercial') ||
    args.hasPlan('professional') ||
    args.hasPlan('enterprise')
  )
}
