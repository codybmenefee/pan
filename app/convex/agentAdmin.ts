import { action, internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { AGENT_DASHBOARD_FEATURE_KEY, assertAgentDashboardAccess, hasPlanLevelAccess } from './lib/agentAccess'
import { DEFAULT_GRAZING_PRINCIPLES } from './lib/grazingPrinciples'
import { DEFAULT_FARM_EXTERNAL_ID, DEFAULT_USER_EXTERNAL_ID } from './seedData'

type AgentProfileId = Doc<'agentConfigs'>['profileId']
type AgentBehaviorConfig = Doc<'agentConfigs'>['behaviorConfig']
type AgentMemoryDoc = Doc<'agentMemories'>
type GrazingPrinciplesDoc = Doc<'grazingPrinciples'>
type ResolvedAgentConfig = Pick<
  Doc<'agentConfigs'>,
  | 'farmExternalId'
  | 'profileId'
  | 'behaviorConfig'
  | 'promptOverrideEnabled'
  | 'promptOverrideVersion'
  | 'promptOverrideText'
>

type HarnessState = {
  config: ResolvedAgentConfig
  principles: GrazingPrinciplesDoc | null
  memories: AgentMemoryDoc[]
  structuredRules: string[]
  promptContext: string
}

type SimulateRunResult = {
  success: boolean
  trigger: 'morning_brief' | 'observation_refresh' | 'plan_execution'
  planId?: string
  error?: string
  message: string
  dryRunOutput?: {
    profileId: string
    behaviorConfig: AgentBehaviorConfig
    promptPreview: string
    activeMemoryCount: number
    structuredRules: string[]
  }
}

const triggerValidator = v.union(
  v.literal('morning_brief'),
  v.literal('observation_refresh'),
  v.literal('plan_execution'),
)

const profileValidator = v.union(
  v.literal('conservative'),
  v.literal('balanced'),
  v.literal('aggressive'),
  v.literal('custom'),
)

const behaviorConfigValidator = v.object({
  riskPosture: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
  explanationStyle: v.union(v.literal('concise'), v.literal('balanced'), v.literal('detailed')),
  forageSensitivity: v.number(),
  movementBias: v.number(),
  enableWeatherSignals: v.boolean(),
})

const runStatusValidator = v.union(
  v.literal('started'),
  v.literal('succeeded'),
  v.literal('failed'),
  v.literal('blocked'),
)
const runStepTypeValidator = v.union(
  v.literal('prompt'),
  v.literal('tool_call'),
  v.literal('tool_result'),
  v.literal('decision'),
  v.literal('error'),
  v.literal('info'),
)

const memoryStatusValidator = v.union(v.literal('active'), v.literal('archived'))
const memoryScopeValidator = v.union(v.literal('farm'), v.literal('paddock'))

const DEFAULT_BEHAVIOR_CONFIG = {
  riskPosture: 'medium' as const,
  explanationStyle: 'balanced' as const,
  forageSensitivity: 50,
  movementBias: 50,
  enableWeatherSignals: true,
}

function serializeStructuredRules(principles: GrazingPrinciplesDoc | null | undefined): string[] {
  const resolved = {
    minDaysPerSection: principles?.minDaysPerSection ?? DEFAULT_GRAZING_PRINCIPLES.minDaysPerSection,
    maxDaysPerSection: principles?.maxDaysPerSection ?? DEFAULT_GRAZING_PRINCIPLES.maxDaysPerSection,
    minNdviThreshold: principles?.minNdviThreshold ?? DEFAULT_GRAZING_PRINCIPLES.minNdviThreshold,
    preferHighNdviAreas: principles?.preferHighNdviAreas ?? DEFAULT_GRAZING_PRINCIPLES.preferHighNdviAreas,
    requireAdjacentSections: principles?.requireAdjacentSections ?? DEFAULT_GRAZING_PRINCIPLES.requireAdjacentSections,
    allowSectionOverlapPct: principles?.allowSectionOverlapPct ?? DEFAULT_GRAZING_PRINCIPLES.allowSectionOverlapPct,
  }

  const lines = [
    `Min days per section: ${resolved.minDaysPerSection}`,
    `Max days per section: ${resolved.maxDaysPerSection}`,
    `Min NDVI threshold: ${resolved.minNdviThreshold}`,
    `Prefer high NDVI: ${resolved.preferHighNdviAreas ? 'yes' : 'no'}`,
    `Require adjacent sections: ${resolved.requireAdjacentSections ? 'yes' : 'no'}`,
    `Allowed overlap pct: ${resolved.allowSectionOverlapPct}`,
  ]

  if (principles?.customRules?.length) {
    lines.push(`Custom rules: ${principles.customRules.join(' | ')}`)
  }

  return lines
}

async function upsertAgentConfig(
  ctx: MutationCtx,
  args: {
    farmExternalId: string
    profileId: AgentProfileId
    behaviorConfig: AgentBehaviorConfig
    userExternalId: string
  }
) {
  const now = new Date().toISOString()
  const existing = await ctx.db
    .query('agentConfigs')
    .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
    .first()

  if (!existing) {
    await ctx.db.insert('agentConfigs', {
      farmExternalId: args.farmExternalId,
      profileId: args.profileId,
      behaviorConfig: args.behaviorConfig,
      promptOverrideEnabled: false,
      promptOverrideVersion: 1,
      updatedBy: args.userExternalId,
      createdAt: now,
      updatedAt: now,
    })
  } else {
    await ctx.db.patch(existing._id, {
      profileId: args.profileId,
      behaviorConfig: args.behaviorConfig,
      updatedBy: args.userExternalId,
      updatedAt: now,
    })
  }

  const farmSettings = await ctx.db
    .query('farmSettings')
    .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
    .first()

  if (!farmSettings) {
    await ctx.db.insert('farmSettings', {
      farmExternalId: args.farmExternalId,
      minNDVIThreshold: 0.4,
      minRestPeriod: 21,
      cloudCoverTolerance: 50,
      rotationFrequency: 1,
      dailyBriefTime: '06:00',
      emailNotifications: true,
      pushNotifications: false,
      virtualFenceProvider: '',
      apiKey: '',
      areaUnit: 'hectares',
      agentProfileId: args.profileId,
      createdAt: now,
      updatedAt: now,
    })
  } else {
    await ctx.db.patch(farmSettings._id, {
      agentProfileId: args.profileId,
      updatedAt: now,
    })
  }
}

async function fetchHarnessState(ctx: QueryCtx, farmExternalId: string): Promise<HarnessState> {
  const [config, principles, memories, farmSettings] = await Promise.all([
    ctx.db
      .query('agentConfigs')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', farmExternalId))
      .first(),
    ctx.db
      .query('grazingPrinciples')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', farmExternalId))
      .first(),
    ctx.db
      .query('agentMemories')
      .withIndex('by_farm_status', (q) => q.eq('farmExternalId', farmExternalId).eq('status', 'active'))
      .collect(),
    ctx.db
      .query('farmSettings')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', farmExternalId))
      .first(),
  ])

  const resolvedConfig: ResolvedAgentConfig = config || {
    farmExternalId,
    profileId: farmSettings?.agentProfileId || 'balanced',
    behaviorConfig: DEFAULT_BEHAVIOR_CONFIG,
    promptOverrideEnabled: false,
    promptOverrideVersion: 1,
    promptOverrideText: '',
  }

  const structuredRules = serializeStructuredRules(principles)
  const memoryLines = memories
    .sort((a, b) => b.priority - a.priority)
    .map((m) => {
      const tags = m.tags?.length ? ` [${m.tags.join(', ')}]` : ''
      return `(${m.scope}) ${m.title}: ${m.content}${tags}`
    })

  const promptSections = [
    '## STRUCTURED RULES',
    ...structuredRules.map((line) => `- ${line}`),
    '',
    '## ACTIVE MEMORY',
    ...(memoryLines.length ? memoryLines.map((line: string) => `- ${line}`) : ['- None']),
    '',
    '## RAW PROMPT OVERRIDE',
    resolvedConfig.promptOverrideEnabled && resolvedConfig.promptOverrideText
      ? resolvedConfig.promptOverrideText
      : 'Disabled',
  ]

  return {
    config: resolvedConfig,
    principles: principles ?? null,
    memories,
    structuredRules,
    promptContext: promptSections.join('\n'),
  }
}

export const getDashboardState = query({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    const { userExternalId } = await assertAgentDashboardAccess(ctx, args.farmExternalId)
    const state = await fetchHarnessState(ctx, args.farmExternalId)

    const recentRuns = await ctx.db
      .query('agentRuns')
      .withIndex('by_farm_startedAt', (q) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    const sortedRuns = recentRuns
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 20)

    const farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.farmExternalId))
      .first()

    const recentFarmerObservations = farm
      ? await ctx.db
          .query('farmerObservations')
          .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
          .order('desc')
          .take(25)
      : []

    return {
      requester: userExternalId,
      config: state.config,
      principles: state.principles,
      memories: state.memories,
      recentRuns: sortedRuns,
      recentFarmerObservations,
    }
  },
})

export const listAgentRuns = query({
  args: {
    farmExternalId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    status: v.optional(runStatusValidator),
    trigger: v.optional(triggerValidator),
  },
  handler: async (ctx, args) => {
    await assertAgentDashboardAccess(ctx, args.farmExternalId)

    const limit = Math.min(args.limit ?? 30, 100)
    const allRuns = await ctx.db
      .query('agentRuns')
      .withIndex('by_farm_startedAt', (q) => q.eq('farmExternalId', args.farmExternalId))
      .collect()

    const filtered = allRuns
      .filter((run) => (args.status ? run.status === args.status : true))
      .filter((run) => (args.trigger ? run.trigger === args.trigger : true))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .filter((run) => (args.cursor ? run.startedAt < args.cursor : true))

    const items = filtered.slice(0, limit)
    const nextCursor = filtered.length > limit ? items[items.length - 1]?.startedAt : null

    return { items, nextCursor }
  },
})

export const getAgentRunDeepDive = query({
  args: {
    runId: v.id('agentRuns'),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId)
    if (!run) {
      throw new Error('Agent run not found')
    }

    await assertAgentDashboardAccess(ctx, run.farmExternalId)

    const steps = await ctx.db
      .query('agentRunSteps')
      .withIndex('by_run_step', (q) => q.eq('runId', args.runId))
      .collect()

    const sortedSteps = steps.sort((a, b) => a.stepIndex - b.stepIndex)
    return {
      run,
      steps: sortedSteps,
      hasDeepDive: sortedSteps.length > 0,
    }
  },
})

export const updateAgentConfig = mutation({
  args: {
    farmExternalId: v.string(),
    profileId: profileValidator,
    behaviorConfig: behaviorConfigValidator,
  },
  handler: async (ctx, args) => {
    const { userExternalId } = await assertAgentDashboardAccess(ctx, args.farmExternalId)
    await upsertAgentConfig(ctx, {
      ...args,
      userExternalId,
    })
    return { success: true }
  },
})

export const upsertGrazingRules = mutation({
  args: {
    farmExternalId: v.string(),
    minDaysPerSection: v.optional(v.number()),
    maxDaysPerSection: v.optional(v.number()),
    minNdviThreshold: v.optional(v.number()),
    preferHighNdviAreas: v.optional(v.boolean()),
    requireAdjacentSections: v.optional(v.boolean()),
    allowSectionOverlapPct: v.optional(v.number()),
    customRules: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await assertAgentDashboardAccess(ctx, args.farmExternalId)
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query('grazingPrinciples')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .first()

    const payload = {
      minDaysPerSection: args.minDaysPerSection,
      maxDaysPerSection: args.maxDaysPerSection,
      minNdviThreshold: args.minNdviThreshold,
      preferHighNdviAreas: args.preferHighNdviAreas,
      requireAdjacentSections: args.requireAdjacentSections,
      allowSectionOverlapPct: args.allowSectionOverlapPct,
      customRules: args.customRules,
      updatedAt: now,
    }

    if (!existing) {
      await ctx.db.insert('grazingPrinciples', {
        farmExternalId: args.farmExternalId,
        ...payload,
      })
    } else {
      await ctx.db.patch(existing._id, payload)
    }

    return { success: true }
  },
})

export const updatePromptOverride = mutation({
  args: {
    farmExternalId: v.string(),
    enabled: v.boolean(),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userExternalId } = await assertAgentDashboardAccess(ctx, args.farmExternalId)
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query('agentConfigs')
      .withIndex('by_farm', (q) => q.eq('farmExternalId', args.farmExternalId))
      .first()

    if (!existing) {
      await ctx.db.insert('agentConfigs', {
        farmExternalId: args.farmExternalId,
        profileId: 'balanced',
        behaviorConfig: DEFAULT_BEHAVIOR_CONFIG,
        promptOverrideEnabled: args.enabled,
        promptOverrideText: args.text,
        promptOverrideVersion: 1,
        updatedBy: userExternalId,
        createdAt: now,
        updatedAt: now,
      })
      return { success: true, version: 1 }
    }

    const version = (existing.promptOverrideVersion ?? 1) + 1
    await ctx.db.patch(existing._id, {
      promptOverrideEnabled: args.enabled,
      promptOverrideText: args.text,
      promptOverrideVersion: version,
      updatedBy: userExternalId,
      updatedAt: now,
    })

    return { success: true, version }
  },
})

export const listMemories = query({
  args: {
    farmExternalId: v.string(),
    status: v.optional(memoryStatusValidator),
    scope: v.optional(memoryScopeValidator),
    targetId: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAgentDashboardAccess(ctx, args.farmExternalId)
    const limit = Math.min(args.limit ?? 50, 200)

    const status = args.status
    const source = status
      ? await ctx.db
          .query('agentMemories')
          .withIndex('by_farm_status', (q) =>
            q.eq('farmExternalId', args.farmExternalId).eq('status', status)
          )
          .collect()
      : await ctx.db
          .query('agentMemories')
          .withIndex('by_farm_priority', (q) => q.eq('farmExternalId', args.farmExternalId))
          .collect()

    const filtered = source
      .filter((m) => (args.scope ? m.scope === args.scope : true))
      .filter((m) => (args.targetId ? m.targetId === args.targetId : true))
      .filter((m) => (args.cursor ? m.updatedAt < args.cursor : true))
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

    const items = filtered.slice(0, limit)
    const nextCursor = filtered.length > limit ? items[items.length - 1]?.updatedAt : null
    return { items, nextCursor }
  },
})

export const createMemory = mutation({
  args: {
    farmExternalId: v.string(),
    scope: memoryScopeValidator,
    targetId: v.optional(v.string()),
    title: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const { userExternalId } = await assertAgentDashboardAccess(ctx, args.farmExternalId)
    const now = new Date().toISOString()
    const memoryId = await ctx.db.insert('agentMemories', {
      farmExternalId: args.farmExternalId,
      scope: args.scope,
      targetId: args.targetId,
      title: args.title,
      content: args.content,
      tags: args.tags,
      priority: args.priority,
      status: 'active',
      source: 'farmer',
      createdBy: userExternalId,
      updatedBy: userExternalId,
      createdAt: now,
      updatedAt: now,
    })
    return { memoryId }
  },
})

export const updateMemory = mutation({
  args: {
    memoryId: v.id('agentMemories'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    priority: v.optional(v.number()),
    status: v.optional(memoryStatusValidator),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId)
    if (!memory) throw new Error('Memory not found')
    const { userExternalId } = await assertAgentDashboardAccess(ctx, memory.farmExternalId)
    await ctx.db.patch(args.memoryId, {
      title: args.title ?? memory.title,
      content: args.content ?? memory.content,
      tags: args.tags ?? memory.tags,
      priority: args.priority ?? memory.priority,
      status: args.status ?? memory.status,
      updatedBy: userExternalId,
      updatedAt: new Date().toISOString(),
    })
    return { success: true }
  },
})

export const archiveMemory = mutation({
  args: { memoryId: v.id('agentMemories') },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId)
    if (!memory) throw new Error('Memory not found')
    const { userExternalId } = await assertAgentDashboardAccess(ctx, memory.farmExternalId)
    await ctx.db.patch(args.memoryId, {
      status: 'archived',
      updatedBy: userExternalId,
      updatedAt: new Date().toISOString(),
    })
    return { success: true }
  },
})

export const promoteObservationToMemory = mutation({
  args: {
    observationId: v.id('farmerObservations'),
    title: v.string(),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const obs = await ctx.db.get(args.observationId)
    if (!obs) throw new Error('Observation not found')

    const farm = await ctx.db.get(obs.farmId)
    if (!farm) throw new Error('Farm not found for observation')

    const { userExternalId } = await assertAgentDashboardAccess(ctx, farm.externalId)
    const now = new Date().toISOString()

    const scope = obs.level === 'farm' ? 'farm' : 'paddock'
    const targetId = obs.level === 'farm' ? undefined : obs.targetId

    const memoryId = await ctx.db.insert('agentMemories', {
      farmExternalId: farm.externalId,
      scope,
      targetId,
      title: args.title,
      content: obs.content,
      tags: obs.tags,
      priority: args.priority,
      status: 'active',
      source: 'farmer',
      createdBy: userExternalId,
      updatedBy: userExternalId,
      createdAt: now,
      updatedAt: now,
    })

    return { memoryId }
  },
})

export const simulateRun = action({
  args: {
    farmExternalId: v.string(),
    trigger: triggerValidator,
    profileOverride: v.optional(profileValidator),
  },
  handler: async (ctx, args): Promise<SimulateRunResult> => {
    const identity = await ctx.auth.getUserIdentity()
    let userExternalId = identity?.subject || identity?.tokenIdentifier
    if (!userExternalId && args.farmExternalId === DEFAULT_FARM_EXTERNAL_ID) {
      userExternalId = DEFAULT_USER_EXTERNAL_ID
    }
    if (!userExternalId) throw new Error('Unauthorized')

    if (userExternalId !== DEFAULT_USER_EXTERNAL_ID) {
      const user: Doc<'users'> | null = await ctx.runQuery(api.users.getUserByExternalId, {
        externalId: userExternalId,
      })
      if (!user) throw new Error('User record not found')
      const hasEntitlement =
        user.agentDashboardEnabled === true || hasPlanLevelAccess(user.subscriptionPlanId)
      if (!hasEntitlement) {
        throw new Error(`Feature "${AGENT_DASHBOARD_FEATURE_KEY}" not enabled`)
      }

      const canAccessFarm =
        user.activeFarmExternalId === args.farmExternalId || user.farmExternalId === args.farmExternalId
      if (!canAccessFarm) {
        throw new Error('Farm access denied')
      }
    } else {
      const devUser: Doc<'users'> | null = await ctx.runQuery(api.users.getUserByExternalId, {
        externalId: DEFAULT_USER_EXTERNAL_ID,
      })
      const canAccessFarm =
        devUser?.activeFarmExternalId === args.farmExternalId ||
        devUser?.farmExternalId === args.farmExternalId
      if (!canAccessFarm) {
        throw new Error('Farm access denied')
      }
    }

    const farm: Doc<'farms'> | null = await ctx.runQuery(api.intelligence.getFarmByExternalId, {
      externalId: args.farmExternalId,
    })
    if (!farm) throw new Error('Farm not found')

    const result = await ctx.runAction(api.grazingAgentGateway.agentGateway, {
      trigger: args.trigger,
      farmId: farm._id,
      farmExternalId: args.farmExternalId,
      userId: userExternalId,
      profileOverride: args.profileOverride,
      dryRun: true,
    })
    return result as SimulateRunResult
  },
})

export const getAccessContext = query({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    return await assertAgentDashboardAccess(ctx, args.farmExternalId)
  },
})

export const getAccessContextInternal = internalQuery({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    return await assertAgentDashboardAccess(ctx, args.farmExternalId)
  },
})

export const getHarnessContext = query({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    await assertAgentDashboardAccess(ctx, args.farmExternalId)
    return await fetchHarnessState(ctx, args.farmExternalId)
  },
})

export const getHarnessContextInternal = internalQuery({
  args: { farmExternalId: v.string() },
  handler: async (ctx, args) => {
    return await fetchHarnessState(ctx, args.farmExternalId)
  },
})

export const startAgentRunInternal = internalMutation({
  args: {
    farmExternalId: v.string(),
    trigger: triggerValidator,
    profileId: profileValidator,
    adapterId: v.string(),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    dryRun: v.boolean(),
    requestedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('agentRuns', {
      ...args,
      status: 'started',
      startedAt: new Date().toISOString(),
    })
  },
})

export const completeAgentRunInternal = internalMutation({
  args: {
    runId: v.id('agentRuns'),
    status: runStatusValidator,
    toolCallCount: v.optional(v.number()),
    toolSummary: v.optional(v.array(v.string())),
    outputPlanId: v.optional(v.id('plans')),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    latencyMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: args.status,
      toolCallCount: args.toolCallCount,
      toolSummary: args.toolSummary,
      outputPlanId: args.outputPlanId,
      errorCode: args.errorCode,
      errorMessage: args.errorMessage,
      latencyMs: args.latencyMs,
      completedAt: new Date().toISOString(),
    })
    return { success: true }
  },
})

export const appendAgentRunStepInternal = internalMutation({
  args: {
    runId: v.id('agentRuns'),
    farmExternalId: v.string(),
    stepIndex: v.number(),
    stepType: runStepTypeValidator,
    title: v.string(),
    toolName: v.optional(v.string()),
    justification: v.optional(v.string()),
    input: v.optional(v.any()),
    output: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId)
    if (!run) throw new Error('Agent run not found')
    if (run.farmExternalId !== args.farmExternalId) {
      throw new Error('Run farm mismatch')
    }

    return await ctx.db.insert('agentRunSteps', {
      runId: args.runId,
      farmExternalId: args.farmExternalId,
      stepIndex: args.stepIndex,
      stepType: args.stepType,
      title: args.title,
      toolName: args.toolName,
      justification: args.justification,
      input: args.input,
      output: args.output,
      error: args.error,
      createdAt: new Date().toISOString(),
    })
  },
})

export const touchMemoriesInternal = internalMutation({
  args: {
    memoryIds: v.array(v.id('agentMemories')),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    for (const id of args.memoryIds) {
      await ctx.db.patch(id, { lastUsedAt: now, updatedAt: now })
    }
    return { updated: args.memoryIds.length }
  },
})
