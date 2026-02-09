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

function expandScopedSlug(slug: string): string[] {
  const trimmed = slug.trim()
  if (!trimmed) return []
  if (
    trimmed.startsWith('user:') ||
    trimmed.startsWith('org:') ||
    trimmed.startsWith('u:') ||
    trimmed.startsWith('o:')
  ) {
    return [trimmed]
  }
  return [
    trimmed,
    `user:${trimmed}`,
    `org:${trimmed}`,
    // Back-compat for older short-form claim prefixes.
    `u:${trimmed}`,
    `o:${trimmed}`,
  ]
}

function collectClaimEntries(claim: unknown): string[] {
  if (Array.isArray(claim)) {
    return claim
      .filter((entry): entry is string => typeof entry === 'string')
      .flatMap((entry) => entry.split(','))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }
  if (typeof claim === 'string') {
    return claim
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }
  return []
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
  const candidates = Array.from(new Set(plans.flatMap((plan) => expandScopedSlug(plan))))
  return candidates.some((plan) => safeCheck(hasPlan, plan))
}

export function hasAnyFeature(
  hasFeature: (feature: string) => boolean,
  features: readonly string[]
): boolean {
  const candidates = Array.from(new Set(features.flatMap((feature) => expandScopedSlug(feature))))
  return candidates.some((feature) => safeCheck(hasFeature, feature))
}

export function claimHasAnySlug(claim: unknown, slugs: readonly string[]): boolean {
  const claimEntries = collectClaimEntries(claim)
  if (claimEntries.length === 0 || slugs.length === 0) return false

  const normalizedClaims = new Set(claimEntries.map((entry) => normalizeSlug(entry)))
  return slugs.some((slug) => normalizedClaims.has(normalizeSlug(slug)))
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
