import type { Doc } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { DEFAULT_FARM_EXTERNAL_ID, DEFAULT_USER_EXTERNAL_ID } from '../seedData'

export const AGENT_DASHBOARD_FEATURE_KEY = 'agent_dashboard'

type GuardCtx = {
  auth: QueryCtx['auth'] | MutationCtx['auth']
  db: QueryCtx['db'] | MutationCtx['db']
}

export function hasPlanLevelAccess(planId?: string): boolean {
  if (!planId) return false
  const normalized = planId.toLowerCase()
  return (
    normalized.includes('producer') ||
    normalized.includes('commercial') ||
    normalized.includes('professional') ||
    normalized.includes('enterprise') ||
    normalized.includes(AGENT_DASHBOARD_FEATURE_KEY)
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

  if (!user) {
    throw new Error('User record not found')
  }

  const entitlementEnabled =
    user.agentDashboardEnabled === true || hasPlanLevelAccess(user.subscriptionPlanId)
  if (!entitlementEnabled) {
    throw new Error('Agent dashboard access denied')
  }

  if (farmExternalId) {
    const canAccessFarm =
      user.activeFarmExternalId === farmExternalId ||
      user.farmExternalId === farmExternalId
    if (!canAccessFarm) {
      throw new Error('Farm access denied')
    }
  }

  return { user, userExternalId }
}
