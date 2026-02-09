import { AGENT_MONITOR_FEATURE_SLUGS, hasAnyFeature, hasAnyPlan } from '@/lib/auth/billing'

const AGENT_DASHBOARD_PLAN_FALLBACKS = ['producer', 'commercial', 'professional', 'enterprise'] as const

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^user:/, '')
    .replace(/^org:/, '')
    .replace(/^u:/, '')
    .replace(/^o:/, '')
    .replace(/-/g, '_')
}

function hasResolvedSlug(entitlements: readonly string[] | undefined, candidates: readonly string[]): boolean {
  if (!entitlements || entitlements.length === 0) return false
  const normalizedEntitlements = new Set(entitlements.map((slug) => normalizeSlug(slug)))
  return candidates.some((slug) => normalizedEntitlements.has(normalizeSlug(slug)))
}

export function hasAgentDashboardAccess(args: {
  hasFeature: (featureKey: string) => boolean
  hasPlan: (plan: string) => boolean
  isDevAuth?: boolean
  resolvedFeatureSlugs?: readonly string[]
  resolvedPlanSlugs?: readonly string[]
}): boolean {
  if (args.isDevAuth) return true
  if (hasResolvedSlug(args.resolvedFeatureSlugs, AGENT_MONITOR_FEATURE_SLUGS)) return true
  if (hasResolvedSlug(args.resolvedPlanSlugs, AGENT_DASHBOARD_PLAN_FALLBACKS)) return true
  return (
    hasAnyFeature(args.hasFeature, AGENT_MONITOR_FEATURE_SLUGS) ||
    hasAnyPlan(args.hasPlan, AGENT_DASHBOARD_PLAN_FALLBACKS)
  )
}
