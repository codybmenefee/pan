export const APP_BILLING_PLAN_SLUGS = [
  'early_access',
  'starter',
  'producer',
  'professional',
  'commercial',
  'enterprise',
] as const

export const AGENT_MONITOR_FEATURE_SLUGS = [
  'agent_monitor',
  'agent_dashboard', // Legacy slug kept for backward compatibility
] as const

function safeCheck(check: (value: string) => boolean, value: string): boolean {
  try {
    return check(value)
  } catch {
    return false
  }
}

export function hasAnyPlan(
  hasPlan: (plan: string) => boolean,
  plans: readonly string[] = APP_BILLING_PLAN_SLUGS
): boolean {
  return plans.some((plan) => safeCheck(hasPlan, plan))
}

export function hasAnyFeature(
  hasFeature: (feature: string) => boolean,
  features: readonly string[]
): boolean {
  return features.some((feature) => safeCheck(hasFeature, feature))
}
