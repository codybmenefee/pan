import type { Doc } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { DEFAULT_FARM_EXTERNAL_ID, DEFAULT_USER_EXTERNAL_ID } from '../seedData'

export const AGENT_DASHBOARD_FEATURE_KEY = 'agent_dashboard'
export const AGENT_MONITOR_FEATURE_KEY = 'agent_monitor'

type GuardCtx = {
  auth: QueryCtx['auth'] | MutationCtx['auth']
  db: QueryCtx['db'] | MutationCtx['db']
}

export function hasPlanLevelAccess(planId?: string): boolean {
  if (!planId) return false
  const normalized = planId.toLowerCase()
  return (
    normalized.includes('early_access') ||
    normalized.includes('early-access') ||
    normalized.includes('starter') ||
    normalized.includes('homesteader') ||
    normalized.includes('producer') ||
    normalized.includes('commercial') ||
    normalized.includes('professional') ||
    normalized.includes('enterprise') ||
    normalized.includes(AGENT_DASHBOARD_FEATURE_KEY) ||
    normalized.includes(AGENT_MONITOR_FEATURE_KEY)
  )
}

function getIdentityFarmExternalId(identity: Record<string, unknown> | null | undefined): string | null {
  if (!identity) return null
  const orgId =
    (typeof identity.org_id === 'string' && identity.org_id) ||
    (typeof identity.orgId === 'string' && identity.orgId) ||
    null
  return orgId
}

function userCanAccessFarm(args: {
  user: Doc<'users'>
  requestedFarmExternalId: string
  identityFarmExternalId: string | null
}): boolean {
  return (
    args.user.activeFarmExternalId === args.requestedFarmExternalId ||
    args.user.farmExternalId === args.requestedFarmExternalId ||
    args.identityFarmExternalId === args.requestedFarmExternalId
  )
}

export async function assertAgentDashboardAccess(
  ctx: GuardCtx,
  farmExternalId?: string
): Promise<{ user: Doc<'users'> | null; userExternalId: string }> {
  const identity = await ctx.auth.getUserIdentity()
  let userExternalId = identity?.subject || identity?.tokenIdentifier
  if (!userExternalId && farmExternalId === DEFAULT_FARM_EXTERNAL_ID) {
    const devUser = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', DEFAULT_USER_EXTERNAL_ID))
      .first()
    if (devUser) {
      userExternalId = DEFAULT_USER_EXTERNAL_ID
    }
  }
  if (!userExternalId) {
    throw new Error('Unauthorized')
  }

  if (userExternalId === DEFAULT_USER_EXTERNAL_ID) {
    return { user: null, userExternalId }
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_externalId', (q) => q.eq('externalId', userExternalId))
    .first()

  // B2C billing source of truth is Clerk has() in the app layer.
  // Convex mirrors are best-effort and can lag/miss during rollout; do not hard-fail
  // solely because mirrored entitlement fields are absent.
  if (!user) {
    if (farmExternalId) {
      const identityFarmId = getIdentityFarmExternalId(identity as Record<string, unknown> | null)
      if (identityFarmId && identityFarmId !== farmExternalId) {
        throw new Error('Farm access denied')
      }
    }
    return { user: null, userExternalId }
  }

  if (farmExternalId) {
    const identityFarmId = getIdentityFarmExternalId(identity as Record<string, unknown> | null)
    const canAccessFarm = userCanAccessFarm({
      user,
      requestedFarmExternalId: farmExternalId,
      identityFarmExternalId: identityFarmId,
    })
    if (!canAccessFarm) {
      throw new Error('Farm access denied')
    }
  }

  const hasMirroredEntitlementFields =
    user.agentDashboardEnabled !== undefined || !!user.subscriptionPlanId
  if (hasMirroredEntitlementFields) {
    const entitlementEnabled =
      user.agentDashboardEnabled === true || hasPlanLevelAccess(user.subscriptionPlanId)
    if (!entitlementEnabled) {
      throw new Error('Agent dashboard access denied')
    }
  }

  return { user, userExternalId }
}
