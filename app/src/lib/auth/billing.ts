const DEFAULT_APP_BILLING_PLAN_SLUGS = [
  'early_access',
  'early-access',
  'starter',
  'homesteader',
  'producer',
  'professional',
  'commercial',
  'enterprise',
] as const

export const AGENT_MONITOR_FEATURE_SLUGS = [
  'agent_monitor',
  'agent_dashboard', // Legacy slug kept for backward compatibility
] as const

const DEFAULT_APP_BILLING_FEATURE_SLUGS = AGENT_MONITOR_FEATURE_SLUGS

function parseSlugList(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function getAppBillingPlanSlugs(): string[] {
  const fromEnv = parseSlugList(import.meta.env.VITE_BILLING_PLAN_SLUGS as string | undefined)
  if (fromEnv.length === 0) return [...DEFAULT_APP_BILLING_PLAN_SLUGS]
  return Array.from(new Set([...DEFAULT_APP_BILLING_PLAN_SLUGS, ...fromEnv]))
}

export function getAppBillingFeatureSlugs(): string[] {
  const fromEnv = parseSlugList(import.meta.env.VITE_BILLING_FEATURE_SLUGS as string | undefined)
  if (fromEnv.length === 0) return [...DEFAULT_APP_BILLING_FEATURE_SLUGS]
  return Array.from(new Set([...DEFAULT_APP_BILLING_FEATURE_SLUGS, ...fromEnv]))
}

function safeCheck(check: (value: string) => boolean, value: string): boolean {
  try {
    return check(value)
  } catch {
    return false
  }
}

export function hasAnyPlan(
  hasPlan: (plan: string) => boolean,
  plans: readonly string[] = getAppBillingPlanSlugs()
): boolean {
  return plans.some((plan) => safeCheck(hasPlan, plan))
}

export function hasAnyFeature(
  hasFeature: (feature: string) => boolean,
  features: readonly string[]
): boolean {
  return features.some((feature) => safeCheck(hasFeature, feature))
}

export function hasBillingAccess(args: {
  hasPlan: (plan: string) => boolean
  hasFeature: (feature: string) => boolean
  planSlugs?: readonly string[]
  featureSlugs?: readonly string[]
}): boolean {
  const planSlugs = args.planSlugs ?? getAppBillingPlanSlugs()
  const featureSlugs = args.featureSlugs ?? getAppBillingFeatureSlugs()
  return hasAnyPlan(args.hasPlan, planSlugs) || hasAnyFeature(args.hasFeature, featureSlugs)
}
