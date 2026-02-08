/**
 * Agent Gateway - Primary Entry Point for Agent Invocations
 *
 * This is the ONLY public entry point for agent operations.
 * All agent calls should route through this gateway.
 *
 * The gateway:
 * - Fetches farm context and assembles data
 * - Routes to appropriate agent implementation (currently uses runGrazingAgent internally)
 * - Handles trigger-specific logic (morning_brief, observation_refresh, plan_execution)
 * - Provides unified error handling and response format
 * - Braintrust logging for observability
 *
 * Usage:
 *   await ctx.runAction(api.grazingAgentGateway.agentGateway, {
 *     trigger: 'morning_brief',
 *     farmId: farm._id,
 *     farmExternalId: 'farm-1',
 *     userId: 'user-123',
 *   })
 *
 * NOTE: runGrazingAgent in grazingAgentDirect.ts is legacy/internal implementation.
 * It should only be called by this gateway, not directly.
 */

"use node"

import { action } from './_generated/server'
import { v } from 'convex/values'
import { api, internal } from './_generated/api'
import type { ActionCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
// Internal: Legacy agent implementation - only used by this gateway
import { runGrazingAgent } from './grazingAgentDirect'
import { getLogger, flushLogs } from '../lib/braintrust'
import { sanitizeForBraintrust } from '../lib/braintrustSanitize'
import { initOTelOnce, getTracer, flushOTel } from '../lib/otel'

// Note: initOTelOnce is called in handler since it's async

// Helper to flush all telemetry before returning
async function flushAllTelemetry(): Promise<void> {
  console.log('[agentGateway] Flushing all telemetry...')
  await Promise.all([
    flushLogs(),
    flushOTel(),
  ])
  console.log('[agentGateway] All telemetry flushed')
}

/**
 * Type definition for morning_brief trigger additional context
 * This allows passing event-specific data to avoid duplicate queries
 */
export type MorningBriefContext = {
  planGenerationData: {
    existingPlanId: Id<'plans'> | null
    observations: unknown[] | null
    grazingEvents: unknown[] | null
    settings: { minNDVIThreshold?: number; minRestPeriod?: number } | null
    farm: { name?: string } | null
    mostRecentGrazingEvent: { paddockExternalId?: string } | null
    pastures: Array<{ externalId: string }> | null
  }
  farmName: string
}

type HarnessState = {
  config: {
    profileId: 'conservative' | 'balanced' | 'aggressive' | 'custom'
    behaviorConfig: {
      riskPosture: 'low' | 'medium' | 'high'
      explanationStyle: 'concise' | 'balanced' | 'detailed'
      forageSensitivity: number
      movementBias: number
      enableWeatherSignals: boolean
    }
    promptOverrideEnabled: boolean
    promptOverrideText?: string
    promptOverrideVersion: number
  }
  principles: Doc<'grazingPrinciples'> | null
  memories: Array<Pick<Doc<'agentMemories'>, '_id' | 'title' | 'content'>>
  structuredRules: string[]
  promptContext: string
}

type TraceSpan = { log: (data: unknown) => void }
type AgentRunStepType = 'prompt' | 'tool_call' | 'tool_result' | 'decision' | 'error' | 'info'
type AgentRunStepPayload = {
  stepType: AgentRunStepType
  title: string
  toolName?: string
  justification?: string
  input?: unknown
  output?: unknown
  error?: string
}

type AgentRunStepRecorder = {
  recordStep: (payload: AgentRunStepPayload) => Promise<void>
}

function createRunStepRecorder(
  ctx: ActionCtx,
  runId: Id<'agentRuns'>,
  farmExternalId: string
): AgentRunStepRecorder {
  let stepIndex = 0
  return {
    recordStep: async (payload) => {
      const currentStepIndex = stepIndex
      try {
        await ctx.runMutation(internal.agentAdmin.appendAgentRunStepInternal, {
          runId,
          farmExternalId,
          stepIndex: currentStepIndex,
          ...payload,
        })
      } catch (error) {
        console.error('[agentGateway] Failed to record run step', {
          runId: runId.toString(),
          stepIndex: currentStepIndex,
          title: payload.title,
          error,
        })
      } finally {
        stepIndex += 1
      }
    },
  }
}

/**
 * PRIMARY ENTRY POINT: Agent Gateway Action
 * 
 * This is the public API for all agent operations.
 * All external code should call this, not runGrazingAgent directly.
 * 
 * For plan generation (morning_brief trigger), this gateway:
 * 1. Fetches farm context via getFarmContext query
 * 2. Gets plan generation data to determine active paddock
 * 3. Delegates to runGrazingAgent (internal/legacy implementation)
 * 4. Returns standardized result format
 * 
 * Future enhancements:
 * - Use trigger-specific prompts from lib/agent/triggers.ts
 * - Migrate runGrazingAgent logic into gateway for better control
 */
export const agentGateway = action({
  args: {
    trigger: v.union(
      v.literal('morning_brief'),
      v.literal('observation_refresh'),
      v.literal('plan_execution')
    ),
    farmId: v.id('farms'),
    farmExternalId: v.string(),
    userId: v.string(),
    profileOverride: v.optional(v.union(
      v.literal('conservative'),
      v.literal('balanced'),
      v.literal('aggressive'),
      v.literal('custom')
    )),
    dryRun: v.optional(v.boolean()),
    additionalContext: v.optional(v.object({
      planGenerationData: v.any(), // PlanGenerationData type
      farmName: v.string(),
    })),
  },
  handler: async (ctx: ActionCtx, args): Promise<{
    success: boolean
    trigger: 'morning_brief' | 'observation_refresh' | 'plan_execution'
    planId?: string
    error?: string
    message: string
    dryRunOutput?: {
      profileId: string
      behaviorConfig: HarnessState['config']['behaviorConfig']
      promptPreview: string
      activeMemoryCount: number
      structuredRules: string[]
      draftPlan?: {
        action: 'MOVE' | 'STAY'
        sectionIndex: number
        reasoning: string[]
        confidence: 'high' | 'medium' | 'low'
      }
      renderedDraft?: string
      triggerDetails?: string[]
    }
  }> => {
    // Initialize OTel (async, runs once per cold start)
    await initOTelOnce()

    const logger = getLogger()
    const tracer = getTracer()

    console.log('[agentGateway] Telemetry status:', {
      hasLogger: !!logger,
      loggerType: typeof logger,
      hasTracer: !!tracer,
      tracerType: typeof tracer,
    })

    // Use try/finally to ensure telemetry is flushed before returning
    try {
      return await logger.traced(async (rootSpan: TraceSpan) => {
        console.log('[agentGateway] Inside logger.traced, rootSpan:', {
          hasRootSpan: !!rootSpan,
          rootSpanType: typeof rootSpan,
          rootSpanMethods: rootSpan ? Object.keys(rootSpan) : 'null',
        })

        // Log gateway invocation (sanitize to remove Convex internal fields)
        rootSpan.log({
          input: sanitizeForBraintrust({
            trigger: args.trigger,
            farmId: String(args.farmId), // Convert Convex ID to string
            farmExternalId: args.farmExternalId,
            userId: args.userId,
          }),
          metadata: sanitizeForBraintrust({
            hasAdditionalContext: !!args.additionalContext,
          }),
        })

        console.log('[agentGateway] START:', {
        trigger: args.trigger,
        farmId: args.farmId.toString(),
        farmExternalId: args.farmExternalId,
        userId: args.userId,
        hasAdditionalContext: !!args.additionalContext,
        contextKeys: args.additionalContext ? Object.keys(args.additionalContext) : [],
      })

    const runStart = Date.now()
    const harnessState = await ctx.runQuery(internal.agentAdmin.getHarnessContextInternal, {
      farmExternalId: args.farmExternalId,
    }) as HarnessState
    const selectedProfileId = args.profileOverride || harnessState.config.profileId || 'balanced'

    const runId = await ctx.runMutation(internal.agentAdmin.startAgentRunInternal, {
      farmExternalId: args.farmExternalId,
      trigger: args.trigger,
      profileId: selectedProfileId,
      adapterId: 'managed_ai_sdk',
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
      dryRun: !!args.dryRun,
      requestedBy: args.userId,
    })
    const recorder = createRunStepRecorder(ctx, runId, args.farmExternalId)

    await recorder.recordStep({
      stepType: 'info',
      title: 'Agent run started',
      justification: 'Gateway initialized run metadata and selected profile context.',
      input: {
        trigger: args.trigger,
        dryRun: !!args.dryRun,
        profileId: selectedProfileId,
        requestedBy: args.userId,
        model: 'claude-haiku-4-5',
      },
    })

    const dryRunBase = {
      profileId: selectedProfileId,
      behaviorConfig: harnessState.config.behaviorConfig,
      promptPreview: harnessState.promptContext,
      activeMemoryCount: harnessState.memories.length,
      structuredRules: harnessState.structuredRules,
    }

    // For morning_brief trigger, generate a daily plan
    if (args.trigger === 'morning_brief') {
      const today = new Date().toISOString().split('T')[0]

      // Use provided context or fetch plan generation data
      const hasProvidedContext = !!args.additionalContext?.planGenerationData
      console.log('[agentGateway] Data source decision:', {
        hasProvidedContext,
        willFetch: !hasProvidedContext,
        optimization: hasProvidedContext ? 'Using provided context (query saved)' : 'Fetching data (no context provided)',
      })

      const providedPlanData = args.additionalContext?.planGenerationData as MorningBriefContext['planGenerationData'] | undefined
      let planData = hasProvidedContext && providedPlanData
        ? providedPlanData
        : await ctx.runQuery(api.intelligence.getPlanGenerationData, {
            farmExternalId: args.farmExternalId,
            date: today,
          })

      if (args.dryRun && planData.existingPlanId && (!planData.pastures || !planData.settings || !planData.farm)) {
        const [settings, farm, mostRecentGrazingEvent, pastures] = await Promise.all([
          ctx.runQuery(api.intelligence.getSettingsForFarm, { farmExternalId: args.farmExternalId }),
          ctx.runQuery(api.intelligence.getFarmByExternalId, { externalId: args.farmExternalId }),
          ctx.runQuery(api.intelligence.getMostRecentGrazingEvent, { farmExternalId: args.farmExternalId }),
          ctx.runQuery(api.intelligence.getPasturesForFarm, { farmExternalId: args.farmExternalId }),
        ])

        planData = {
          ...planData,
          settings,
          farm,
          mostRecentGrazingEvent,
          pastures,
        }
      }

      console.log('[agentGateway] Plan data available:', {
        source: hasProvidedContext ? 'provided context' : 'fetched',
        hasExistingPlan: !!planData.existingPlanId,
        existingPlanId: planData.existingPlanId?.toString(),
        pasturesCount: planData.pastures?.length || 0,
        hasFarm: !!planData.farm,
        hasSettings: !!planData.settings,
        hasObservations: !!planData.observations,
        hasGrazingEvents: !!planData.grazingEvents,
      })

      if (planData.existingPlanId && !args.dryRun) {
        const existingPlanResult = {
          success: true,
          trigger: args.trigger,
          planId: planData.existingPlanId.toString(),
          message: 'Plan already exists for today',
        }
        await recorder.recordStep({
          stepType: 'decision',
          title: 'Skipped plan generation because plan already exists',
          justification: 'Morning brief must avoid creating duplicate plans for the same farm/day.',
          output: {
            existingPlanId: planData.existingPlanId.toString(),
          },
        })
        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'blocked',
          toolCallCount: 0,
          toolSummary: ['existing_plan'],
          outputPlanId: planData.existingPlanId,
          latencyMs: Date.now() - runStart,
        })
        rootSpan.log({ output: sanitizeForBraintrust(existingPlanResult) })
        return existingPlanResult
      }

      if (!planData.pastures || planData.pastures.length === 0) {
        const noPasturesResult = {
          success: false,
          trigger: args.trigger,
          error: 'No pastures found for farm',
          message: 'Cannot generate plan: farm has no pastures',
        }
        await recorder.recordStep({
          stepType: 'error',
          title: 'Plan generation failed: no pastures found',
          justification: 'The agent cannot generate a grazing plan without pasture geometry.',
          error: noPasturesResult.error,
        })
        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'failed',
          errorCode: 'no_pastures',
          errorMessage: noPasturesResult.error,
          latencyMs: Date.now() - runStart,
        })
        rootSpan.log({ output: sanitizeForBraintrust(noPasturesResult) })
        return noPasturesResult
      }

      const activePastureId = planData.mostRecentGrazingEvent?.paddockExternalId ||
        (planData.pastures && planData.pastures.length > 0 ? planData.pastures[0].externalId : null)

      // Sanitize settings to remove Convex internal fields before passing to agent
      const rawSettings = planData.settings || {
        minNDVIThreshold: 0.40,
        minRestPeriod: 21,
      }
      const settings = {
        minNDVIThreshold: rawSettings.minNDVIThreshold ?? 0.40,
        minRestPeriod: rawSettings.minRestPeriod ?? 21,
      }

      // Use farmName from context or fetch minimal data
      const farmNameFromContext = args.additionalContext?.farmName
      const farmName = farmNameFromContext || (planData.farm?.name || args.farmExternalId)

      console.log('[agentGateway] Prepared agent inputs:', {
        farmExternalId: args.farmExternalId,
        farmName,
        farmNameSource: farmNameFromContext ? 'provided context' : (planData.farm?.name ? 'planData.farm' : 'fallback to externalId'),
        activePastureId,
        activePastureSource: planData.mostRecentGrazingEvent?.paddockExternalId ? 'mostRecentGrazingEvent' : 'first pasture',
        settings,
        today,
        usingProvidedContext: !!args.additionalContext?.planGenerationData,
        selectedProfileId,
        memoryCount: harnessState.memories.length,
      })

      console.log('[agentGateway] Delegating to runGrazingAgent...')
      await recorder.recordStep({
        stepType: 'info',
        title: 'Prepared morning brief agent inputs',
        justification: 'Resolved active pasture, farm settings, and harness context before invoking the planner.',
        input: {
          farmName,
          activePastureId,
          settings,
          selectedProfileId,
          memoryCount: harnessState.memories.length,
          usedProvidedContext: !!args.additionalContext?.planGenerationData,
        },
      })

      const logger = getLogger()

      const result = await runGrazingAgent(
        ctx,
        args.farmExternalId,
        farmName,
        activePastureId,
        settings,
        logger,
        undefined,
        tracer,
        {
          profileId: selectedProfileId,
          behaviorConfig: harnessState.config.behaviorConfig,
          promptContext: harnessState.promptContext,
          memoryCount: harnessState.memories.length,
          structuredRules: harnessState.structuredRules,
        },
        {
          dryRun: !!args.dryRun,
          recorder,
        },
      )

      if (!args.dryRun && harnessState.memories.length > 0) {
        await ctx.runMutation(internal.agentAdmin.touchMemoriesInternal, {
          memoryIds: harnessState.memories.map((m) => m._id),
        })
      }

      console.log('[agentGateway] runGrazingAgent result received:', {
        success: result.success,
        planCreated: result.planCreated,
        planId: result.planId?.toString(),
        hasPlanId: !!result.planId,
        error: result.error,
      })

      if (!result.success) {
        const errorResult = {
          success: false,
          trigger: args.trigger,
          error: result.error || 'Agent execution failed',
          message: 'Failed to generate plan',
        }
        await recorder.recordStep({
          stepType: 'error',
          title: 'Agent execution failed',
          justification: 'Planner returned an unsuccessful result.',
          output: {
            toolCallCount: result.toolCallCount ?? 0,
            toolSummary: result.toolSummary ?? [],
          },
          error: errorResult.error,
        })

        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'failed',
          toolCallCount: result.toolCallCount ?? 0,
          toolSummary: result.toolSummary ?? [],
          errorCode: 'execution_failed',
          errorMessage: errorResult.error,
          latencyMs: Date.now() - runStart,
        })

        rootSpan.log({ output: sanitizeForBraintrust(errorResult) })
        return errorResult
      }

      if (!result.planCreated) {
        const noPlanResult = {
          success: false,
          trigger: args.trigger,
          error: 'Agent did not create a plan',
          message: 'Plan generation completed but no plan was created',
        }
        await recorder.recordStep({
          stepType: 'error',
          title: 'Planner completed without creating a plan',
          justification: 'Morning brief expects a concrete plan artifact unless execution fails earlier.',
          output: {
            toolCallCount: result.toolCallCount ?? 0,
            toolSummary: result.toolSummary ?? [],
          },
          error: noPlanResult.error,
        })

        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'failed',
          toolCallCount: result.toolCallCount ?? 0,
          toolSummary: result.toolSummary ?? [],
          errorCode: 'no_plan_created',
          errorMessage: noPlanResult.error,
          latencyMs: Date.now() - runStart,
        })

        rootSpan.log({ output: sanitizeForBraintrust(noPlanResult) })
        return noPlanResult
      }

      if (args.dryRun) {
        const dryRunResult = {
          success: true,
          trigger: args.trigger,
          message: 'Dry run completed for morning brief',
          dryRunOutput: {
            ...dryRunBase,
            draftPlan: result.draftPlan,
            renderedDraft: result.agentText,
          },
        }
        await recorder.recordStep({
          stepType: 'decision',
          title: 'Dry run completed',
          justification: 'Dry run validates planning logic without mutating plan state.',
          output: dryRunResult.dryRunOutput,
        })

        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'succeeded',
          toolCallCount: result.toolCallCount ?? 0,
          toolSummary: [...(result.toolSummary ?? []), 'dry_run'],
          latencyMs: Date.now() - runStart,
        })

        rootSpan.log({ output: sanitizeForBraintrust(dryRunResult) })
        return dryRunResult
      }

      const finalPlanId = result.planId?.toString()
      const successResult = {
        success: true,
        trigger: args.trigger,
        planId: finalPlanId ? String(finalPlanId) : undefined,
        message: 'Plan generated successfully',
      }
      await recorder.recordStep({
        stepType: 'decision',
        title: 'Plan generated successfully',
        justification: 'Morning brief planner produced a valid plan artifact.',
        output: {
          planId: finalPlanId,
          toolCallCount: result.toolCallCount ?? 0,
          toolSummary: result.toolSummary ?? [],
        },
      })

      await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
        runId,
        status: 'succeeded',
        toolCallCount: result.toolCallCount ?? 0,
        toolSummary: result.toolSummary ?? [],
        outputPlanId: result.planId,
        latencyMs: Date.now() - runStart,
      })

      rootSpan.log({ output: sanitizeForBraintrust(successResult) })
      return successResult
    }

    if (args.trigger === 'observation_refresh') {
      const activeJob = await ctx.runQuery(api.satelliteFetchJobs.getActiveJob, {
        farmExternalId: args.farmExternalId,
      })
      const latestObservationDate = await ctx.runQuery(api.observations.getLatestObservationDate, {
        farmExternalId: args.farmExternalId,
      })
      await recorder.recordStep({
        stepType: 'info',
        title: 'Observation refresh context loaded',
        justification: 'Gateway checked current job state and latest observation recency before deciding refresh behavior.',
        output: {
          latestObservationDate,
          activeJob: activeJob
            ? {
                id: activeJob._id.toString(),
                status: activeJob.status,
              }
            : null,
        },
      })

      if (args.dryRun) {
        const dryRunResult = {
          success: true,
          trigger: args.trigger,
          message: 'Dry run completed for observation refresh',
          dryRunOutput: {
            ...dryRunBase,
            triggerDetails: [
              latestObservationDate
                ? `Latest observation date: ${latestObservationDate}`
                : 'No observations available yet',
              activeJob
                ? `Active fetch job already exists (${activeJob.status})`
                : 'A new manual refresh job would be queued',
            ],
          },
        }
        await recorder.recordStep({
          stepType: 'decision',
          title: 'Dry run completed for observation refresh',
          justification: 'Dry run reports what refresh action would be taken without queueing a job.',
          output: dryRunResult.dryRunOutput,
        })

        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'succeeded',
          toolCallCount: 0,
          toolSummary: ['observation_refresh', 'dry_run'],
          latencyMs: Date.now() - runStart,
        })
        rootSpan.log({ output: sanitizeForBraintrust(dryRunResult) })
        return dryRunResult
      }

      if (activeJob && (activeJob.status === 'pending' || activeJob.status === 'processing')) {
        const blockedResult = {
          success: true,
          trigger: args.trigger,
          message: `Observation refresh already in progress (${activeJob.status}).`,
        }
        await recorder.recordStep({
          stepType: 'decision',
          title: 'Refresh skipped because a job is already active',
          justification: 'Queueing another manual refresh while one is in progress is redundant.',
          output: {
            activeJobId: activeJob._id.toString(),
            activeJobStatus: activeJob.status,
          },
        })

        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'blocked',
          toolCallCount: 0,
          toolSummary: ['active_job_exists'],
          latencyMs: Date.now() - runStart,
        })
        rootSpan.log({ output: sanitizeForBraintrust(blockedResult) })
        return blockedResult
      }

      const jobId = await ctx.runMutation(api.satelliteFetchJobs.createForManualRefresh, {
        farmExternalId: args.farmExternalId,
      })
      await recorder.recordStep({
        stepType: 'tool_call',
        title: 'Queued manual observation refresh job',
        toolName: 'createForManualRefresh',
        justification: 'No active fetch job exists, so the gateway queued a manual refresh.',
        input: {
          farmExternalId: args.farmExternalId,
        },
        output: {
          jobId: String(jobId),
        },
      })

      const successResult = {
        success: true,
        trigger: args.trigger,
        message: `Observation refresh job queued (${jobId}).`,
      }
      await recorder.recordStep({
        stepType: 'decision',
        title: 'Observation refresh queued',
        justification: 'Manual refresh request was accepted and queued successfully.',
        output: {
          jobId: String(jobId),
        },
      })

      await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
        runId,
        status: 'succeeded',
        toolCallCount: 1,
        toolSummary: ['create_manual_refresh_job'],
        latencyMs: Date.now() - runStart,
      })

      rootSpan.log({ output: sanitizeForBraintrust(successResult) })
      return successResult
    }

    if (args.trigger === 'plan_execution') {
      const [todayDailyPlan, todayLegacyPlan] = await Promise.all([
        ctx.runQuery(api.grazingAgentTools.getTodayPlan, {
          farmExternalId: args.farmExternalId,
        }),
        ctx.runQuery(api.intelligence.getTodayPlan, {
          farmExternalId: args.farmExternalId,
        }),
      ])
      await recorder.recordStep({
        stepType: 'info',
        title: 'Plan execution context loaded',
        justification: 'Gateway inspected today’s daily and legacy plan states before evaluating execution readiness.',
        output: {
          todayDailyPlan: todayDailyPlan
            ? {
                id: todayDailyPlan._id.toString(),
                status: todayDailyPlan.status,
              }
            : null,
          todayLegacyPlan: todayLegacyPlan
            ? {
                id: todayLegacyPlan._id.toString(),
                status: todayLegacyPlan.status,
              }
            : null,
        },
      })

      if (args.dryRun) {
        const dryRunResult = {
          success: true,
          trigger: args.trigger,
          message: 'Dry run completed for plan execution',
          dryRunOutput: {
            ...dryRunBase,
            triggerDetails: [
              todayDailyPlan
                ? `Daily plan status: ${todayDailyPlan.status}`
                : 'No daily plan exists for today',
              todayLegacyPlan
                ? `Legacy plan status: ${todayLegacyPlan.status}`
                : 'No legacy plan exists for today',
            ],
          },
        }
        await recorder.recordStep({
          stepType: 'decision',
          title: 'Dry run completed for plan execution',
          justification: 'Dry run reports approval prerequisites without changing execution state.',
          output: dryRunResult.dryRunOutput,
        })

        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'succeeded',
          toolCallCount: 0,
          toolSummary: ['plan_execution', 'dry_run'],
          latencyMs: Date.now() - runStart,
        })
        rootSpan.log({ output: sanitizeForBraintrust(dryRunResult) })
        return dryRunResult
      }

      if (todayDailyPlan) {
        if (todayDailyPlan.status !== 'approved') {
          const blockedResult = {
            success: false,
            trigger: args.trigger,
            message: `Daily plan is ${todayDailyPlan.status}. Farmer approval is required before execution.`,
          }
          await recorder.recordStep({
            stepType: 'decision',
            title: 'Execution blocked: daily plan not approved',
            justification: 'Manual workflow requires explicit farmer approval before execution.',
            output: {
              planId: todayDailyPlan._id.toString(),
              status: todayDailyPlan.status,
            },
          })
          await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
            runId,
            status: 'blocked',
            toolCallCount: 0,
            toolSummary: ['approval_required'],
            latencyMs: Date.now() - runStart,
          })
          rootSpan.log({ output: sanitizeForBraintrust(blockedResult) })
          return blockedResult
        }

        const successResult = {
          success: true,
          trigger: args.trigger,
          message: 'Daily plan is approved. Execution can proceed in the manual workflow.',
        }
        await recorder.recordStep({
          stepType: 'decision',
          title: 'Execution ready: daily plan approved',
          justification: 'Approved daily plan satisfies execution prerequisites.',
          output: {
            planId: todayDailyPlan._id.toString(),
            status: todayDailyPlan.status,
          },
        })
        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'succeeded',
          toolCallCount: 0,
          toolSummary: ['approved_plan_ready'],
          latencyMs: Date.now() - runStart,
        })
        rootSpan.log({ output: sanitizeForBraintrust(successResult) })
        return successResult
      }

      if (todayLegacyPlan) {
        if (todayLegacyPlan.status !== 'approved') {
          const blockedResult = {
            success: false,
            trigger: args.trigger,
            planId: todayLegacyPlan._id.toString(),
            message: `Legacy plan is ${todayLegacyPlan.status}. Farmer approval is required before execution.`,
          }
          await recorder.recordStep({
            stepType: 'decision',
            title: 'Execution blocked: legacy plan not approved',
            justification: 'Legacy plans also require farmer approval before execution.',
            output: {
              planId: todayLegacyPlan._id.toString(),
              status: todayLegacyPlan.status,
            },
          })
          await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
            runId,
            status: 'blocked',
            outputPlanId: todayLegacyPlan._id,
            toolCallCount: 0,
            toolSummary: ['approval_required'],
            latencyMs: Date.now() - runStart,
          })
          rootSpan.log({ output: sanitizeForBraintrust(blockedResult) })
          return blockedResult
        }

        const successResult = {
          success: true,
          trigger: args.trigger,
          planId: todayLegacyPlan._id.toString(),
          message: 'Legacy plan is approved. Execution can proceed in the manual workflow.',
        }
        await recorder.recordStep({
          stepType: 'decision',
          title: 'Execution ready: legacy plan approved',
          justification: 'Approved legacy plan satisfies execution prerequisites.',
          output: {
            planId: todayLegacyPlan._id.toString(),
            status: todayLegacyPlan.status,
          },
        })
        await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
          runId,
          status: 'succeeded',
          outputPlanId: todayLegacyPlan._id,
          toolCallCount: 0,
          toolSummary: ['approved_plan_ready'],
          latencyMs: Date.now() - runStart,
        })
        rootSpan.log({ output: sanitizeForBraintrust(successResult) })
        return successResult
      }

      const blockedResult = {
        success: false,
        trigger: args.trigger,
        message: 'No plan exists for today. Generate a morning brief first.',
      }
      await recorder.recordStep({
        stepType: 'decision',
        title: 'Execution blocked: no plan for today',
        justification: 'Execution requires a same-day plan artifact.',
      })
      await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
        runId,
        status: 'blocked',
        toolCallCount: 0,
        toolSummary: ['no_plan_for_today'],
        latencyMs: Date.now() - runStart,
      })
      rootSpan.log({ output: sanitizeForBraintrust(blockedResult) })
      return blockedResult
    }

    const unsupportedTriggerResult = {
      success: false,
      trigger: args.trigger,
      message: `Unsupported trigger: ${args.trigger}`,
    }
    await recorder.recordStep({
      stepType: 'error',
      title: 'Unsupported trigger',
      justification: 'Gateway received a trigger type it does not implement.',
      error: unsupportedTriggerResult.message,
    })
    await ctx.runMutation(internal.agentAdmin.completeAgentRunInternal, {
      runId,
      status: 'failed',
      toolCallCount: 0,
      toolSummary: ['unsupported_trigger'],
      errorCode: 'unsupported_trigger',
      errorMessage: unsupportedTriggerResult.message,
      latencyMs: Date.now() - runStart,
    })
    rootSpan.log({ output: sanitizeForBraintrust(unsupportedTriggerResult) })
    return unsupportedTriggerResult
      }, { name: 'Agent Gateway', metadata: { trigger: args.trigger, farmExternalId: args.farmExternalId, userId: args.userId } })
    } finally {
      // Always flush telemetry before the action completes
      await flushAllTelemetry()
    }
  },
})
