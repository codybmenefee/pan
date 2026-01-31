/**
 * LEGACY/INTERNAL: Direct agent implementation
 * 
 * This file contains the core agent logic but should NOT be called directly from external code.
 * All agent invocations should route through grazingAgentGateway.agentGateway.
 * 
 * This file is kept as legacy/internal implementation that the gateway uses.
 * If you need to call the agent, use: api.grazingAgentGateway.agentGateway
 * 
 * @deprecated Direct usage - use agentGateway instead
 * 
 * NOTE: This file uses Braintrust which requires Node.js APIs.
 * It's imported by an action with "use node", so it runs in Node.js context.
 * We don't add "use node" here because this file doesn't define actions.
 */

import { anthropic } from "@ai-sdk/anthropic"
import { generateText, tool } from "ai"
import { api } from "./_generated/api"
import type { ActionCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { z } from "zod"
import { sanitizeForBraintrust } from "../lib/braintrustSanitize"
import { logLLMCall, logToolCall } from "../lib/braintrust"
import { createLogger } from "./lib/logger"

const log = createLogger('grazingAgent')

// OTel Tracer type - using any to avoid importing @opentelemetry/api in non-node context
type OTelTracer = any

const GRAZING_AGENT_MODEL = "claude-haiku-4-5"
const PROMPT_VERSION = "v2.0.0-ndvi-grid" // Track prompt changes for comparison

// NOTE: Braintrust imports are done in the action file (grazingAgentGateway.ts)
// to avoid bundler issues. The logger and wrapped Anthropic client are passed
// as parameters to this function.

const GRAZING_SYSTEM_PROMPT = `You are a grazing intelligence specialist. Your role is to recommend daily grazing sections based on satellite-derived NDVI (vegetation) data.

## YOUR TASK
Analyze the NDVI heat map grid and create a grazing plan by calling the tools.

## READING THE NDVI GRID
The grid shows NDVI values sampled across the paddock:
- Higher values (0.60-0.80+) = healthy green vegetation (TARGET THESE)
- Medium values (0.40-0.60) = moderate vegetation
- Lower values (<0.40) = sparse vegetation (AVOID)

Use the coordinate reference to convert grid cells to polygon vertices.

## SECTION PLACEMENT PRIORITY (follow this order)
1. ADJACENCY FIRST: New section MUST share an edge with the most recent section
2. NDVI SECOND: Within adjacent area, target cells with NDVI 0.60+
3. Shape: Avoid skinny strips - draw reasonably-shaped polygons
4. Size: Approximately 20% of paddock area
5. Overlap: Up to 5% overlap with previous sections is acceptable

IMPORTANT: Only place a section away from the previous section if:
- This is the first section in the paddock (no previous sections exist)
- The paddock has been fully grazed and is starting a new rotation

## CRITICAL RULES
- You MUST ALWAYS create a section geometry - animals must eat somewhere every day
- You MUST call createPlanWithSection AND finalizePlan tools. The tools are your output mechanism - not text.
- NEVER recommend "rest" - always select a paddock and draw a section, even if conditions aren't ideal
- If the current paddock has low NDVI, find the best alternative paddock or continue in current paddock with appropriate justification
- Always output valid GeoJSON Polygon for section geometry
- Calculate section centroid as [lng, lat]`

interface PlanGenerationResult {
  success: boolean
  planId?: Id<"plans">
  error?: string
  planCreated?: boolean
}

/**
 * INTERNAL: Core agent execution logic
 * 
 * This function is called by grazingAgentGateway.agentGateway.
 * Do not call this directly - use the gateway instead.
 * 
 * @internal
 */
/**
 * Internal helper: Run agent without Braintrust logging
 */
async function runGrazingAgentCore(
  ctx: ActionCtx,
  farmExternalId: string,
  farmName: string,
  activePaddockId: string | null,
  settings: { minNDVIThreshold: number; minRestPeriod: number },
  anthropicClient: any,
  tracer?: OTelTracer
): Promise<PlanGenerationResult> {
    log('START - Input', {
      farmExternalId,
      farmName,
      activePaddockId,
      settings,
    })

    // Fetch all data upfront in parallel
    const dataFetchStart = Date.now()
    const [allPaddocks, currentPaddock, currentPaddockSections, currentGrazedPercentage] = await Promise.all([
      ctx.runQuery(api.grazingAgentTools.getAllPaddocksWithObservations, { farmExternalId }),
      ctx.runQuery(api.grazingAgentTools.getPaddockData, { farmExternalId }),
      ctx.runQuery(api.grazingAgentTools.getPreviousSections, { farmExternalId, paddockId: activePaddockId ?? undefined }),
      ctx.runQuery(api.grazingAgentTools.calculatePaddockGrazedPercentage, { farmExternalId, paddockId: activePaddockId || 'p1' }),
    ])

    // Data fetching complete
    const dataFetchDuration = Date.now() - dataFetchStart

  log('Data fetched', {
    dataFetchDurationMs: dataFetchDuration,
    allPaddocksCount: allPaddocks?.length,
    currentPaddock: {
      id: currentPaddock?.externalId,
      name: currentPaddock?.name,
      ndviMean: currentPaddock?.ndviMean,
      restDays: currentPaddock?.restDays,
      area: currentPaddock?.area,
    },
    previousSectionsCount: currentPaddockSections?.length,
    currentGrazedPercentage,
  })

  const currentNdvi = currentPaddock?.ndviMean ?? 0
  const threshold = settings.minNDVIThreshold

  log('Decision logic', {
    currentNdvi,
    threshold,
    comparison: currentNdvi >= threshold ? 'meets threshold' : 'below threshold',
  })

  let targetPaddock: any = currentPaddock
  let recommendation = "graze"
  
  // Always select a paddock - never recommend rest
  if (currentNdvi < threshold) {
    // Find best alternative paddock (prefer those meeting threshold, but use best available if none)
    const alternativesAboveThreshold = allPaddocks?.filter((p: any) => p.ndviMean >= threshold) ?? []
    log('Current NDVI below threshold', { alternativesAboveThreshold: alternativesAboveThreshold.length })

    if (alternativesAboveThreshold.length > 0) {
      // Move to best alternative that meets threshold
      alternativesAboveThreshold.sort((a: any, b: any) => {
        if (b.ndviMean !== a.ndviMean) return b.ndviMean - a.ndviMean
        return b.restDays - a.restDays
      })
      targetPaddock = alternativesAboveThreshold[0]
      recommendation = "move"
      log('DECISION: Move to alternative paddock (meets threshold)', {
        paddockId: targetPaddock?.externalId,
        name: targetPaddock?.name,
        ndviMean: targetPaddock?.ndviMean,
        restDays: targetPaddock?.restDays,
      })
    } else {
      // No paddocks meet threshold - find best available (highest NDVI)
      const allSorted = [...(allPaddocks || [])].sort((a: any, b: any) => {
        if (b.ndviMean !== a.ndviMean) return b.ndviMean - a.ndviMean
        return b.restDays - a.restDays
      })
      const bestAvailable = allSorted[0]

      if (bestAvailable && bestAvailable.externalId !== currentPaddock?.externalId) {
        targetPaddock = bestAvailable
        recommendation = "move"
        log('DECISION: Move to best available paddock (below threshold but best option)', {
          paddockId: targetPaddock?.externalId,
          name: targetPaddock?.name,
          ndviMean: targetPaddock?.ndviMean,
          restDays: targetPaddock?.restDays,
        })
      } else {
        // Stay in current paddock - it's the best available
        recommendation = "graze"
        log('DECISION: Continue in current paddock (best available, below threshold)', {
          paddockId: currentPaddock?.externalId,
          ndviMean: currentNdvi,
          note: 'Will create section with low NDVI warning in justification',
        })
      }
    }
  } else {
    log('DECISION: Graze in current paddock - NDVI meets threshold')
  }

  // Runtime assertion: Never allow "rest" recommendation (old code path)
  if (recommendation === "rest" || !targetPaddock) {
    throw new Error(`CRITICAL: Old code path detected! recommendation="${recommendation}", targetPaddock=${targetPaddock ? 'exists' : 'null'}. This should never happen - all paths must select a paddock and create a section.`)
  }

  // Ensure targetPaddock has geometry - if it came from currentPaddock, fetch from allPaddocks
  if (targetPaddock && !targetPaddock.geometry) {
    const paddockWithGeometry = allPaddocks?.find((p: any) => p.externalId === targetPaddock.externalId)
    if (paddockWithGeometry) {
      targetPaddock.geometry = paddockWithGeometry.geometry
    }
  }

  // Fetch previous sections for the target paddock (may be different from current)
  const previousSections = targetPaddock?.externalId === currentPaddock?.externalId
    ? currentPaddockSections
    : await ctx.runQuery(api.grazingAgentTools.getPreviousSections, { farmExternalId, paddockId: targetPaddock?.externalId })
  
  // Fetch grazed percentage for target paddock
  const grazedPercentage = targetPaddock?.externalId === currentPaddock?.externalId
    ? currentGrazedPercentage
    : await ctx.runQuery(api.grazingAgentTools.calculatePaddockGrazedPercentage, { farmExternalId, paddockId: targetPaddock?.externalId || 'p1' })

  log('Target paddock data', {
    targetPaddockId: targetPaddock?.externalId,
    targetPaddockName: targetPaddock?.name,
    previousSectionsCount: previousSections?.length,
    grazedPercentage,
    targetNdvi: targetPaddock?.ndviMean,
    meetsThreshold: (targetPaddock?.ndviMean ?? 0) >= threshold,
    hasGeometry: !!targetPaddock?.geometry,
    geometryType: targetPaddock?.geometry?.type,
    geometryCoordinatesCount: targetPaddock?.geometry?.geometry?.coordinates?.[0]?.length || targetPaddock?.geometry?.coordinates?.[0]?.length || 0,
  })

  // Fetch NDVI grid for the target paddock
  log('Fetching NDVI grid for target paddock...')
  let ndviGridText = 'NDVI grid unavailable - using aggregate paddock NDVI values'
  try {
    const ndviGrid = await ctx.runAction(api.ndviGrid.generateNDVIGrid, {
      farmExternalId,
      paddockExternalId: targetPaddock?.externalId || 'p1',
    })
    if (ndviGrid.hasData) {
      ndviGridText = ndviGrid.gridText
      log('NDVI grid generated successfully')
    } else {
      log('NDVI grid not available', { error: ndviGrid.error })
      ndviGridText = ndviGrid.gridText // Contains fallback message
    }
  } catch (error: any) {
    log.error('Error generating NDVI grid', { error: error.message })
    // Continue with aggregate NDVI values
  }

  // Get most recent section for adjacency guidance
  const mostRecentSection = previousSections && previousSections.length > 0
    ? previousSections[0] // Already sorted by date descending
    : null

  // Build data quality warnings section if any paddocks have warnings
  const dataQualityWarnings = allPaddocks
    ?.filter((p: any) => p.dataQualityWarning)
    .map((p: any) => `- ${p.name}: ${p.dataQualityWarning}`) ?? []

  const qualitySection = dataQualityWarnings.length > 0
    ? `## DATA QUALITY WARNINGS
${dataQualityWarnings.join('\n')}

IMPORTANT: When paddock data has quality warnings:
- Avoid recommending paddock moves based solely on NDVI from stale observations
- Prefer keeping livestock in current paddock if uncertain about alternative conditions
- Note data quality concerns in your sectionJustification
- Consider lower confidence score when using fallback data

`
    : ''

  const prompt = `Generate today's grazing plan for farm "${farmName}".
${qualitySection}
## ACTIVE PADDOCK: ${targetPaddock?.name} (${targetPaddock?.externalId})
- Total Area: ${targetPaddock?.area} hectares
- Target Section: ~20% = ${Math.round((targetPaddock?.area ?? 0) * 0.2 * 10) / 10} hectares
- Already Grazed: ${grazedPercentage}%
- Aggregate NDVI: ${targetPaddock?.ndviMean} (threshold: ${threshold})

## NDVI HEAT MAP GRID
Use this grid to identify HIGH-NDVI cells (0.60+) for section placement:

${ndviGridText}

## PADDOCK BOUNDARY (section MUST stay within):
${JSON.stringify(targetPaddock?.geometry, null, 2)}

${mostRecentSection ? `## MOST RECENT SECTION (draw adjacent to this):
- Date: ${mostRecentSection.date}
- Area: ${mostRecentSection.area} hectares
- Geometry: ${JSON.stringify(mostRecentSection.geometry)}
` : '## NO PREVIOUS SECTIONS - paddock is fresh, draw anywhere within bounds'}

${previousSections && previousSections.length > 1 ? `## OTHER PREVIOUS SECTIONS (avoid >5% overlap):
${JSON.stringify(previousSections.slice(1).map((s: any) => ({ date: s.date, area: s.area })), null, 2)}
` : ''}

## SECTION DRAWING INSTRUCTIONS
1. Study the NDVI grid above - identify cells with values 0.60+ (high vegetation)
2. ${mostRecentSection ? 'CRITICAL: New section MUST share an edge with the previous section. Start from where livestock finished yesterday.' : 'First section in paddock - draw in highest-NDVI area'}
3. Use the grid coordinates to convert cell positions to polygon vertices
4. Section MUST be entirely within the paddock boundary
5. Target ~${Math.round((targetPaddock?.area ?? 0) * 0.2 * 10) / 10} hectares (20% of paddock)

## ALL PADDOCKS (for context):
${JSON.stringify(allPaddocks?.map((p: any) => ({
  externalId: p.externalId,
  name: p.name,
  ndviMean: p.ndviMean,
  area: p.area,
  restDays: p.restDays,
  status: p.status,
})), null, 2)}

## REQUIRED TOOL CALL - createPlanWithSection:
- farmExternalId: "${farmExternalId}"
- targetPaddockId: "${targetPaddock?.externalId}"
- sectionGeometry: GeoJSON Polygon targeting high-NDVI cells from the grid
- sectionAreaHectares: ${Math.round((targetPaddock?.area ?? 0) * 0.2 * 10) / 10}
- sectionCentroid: [lng, lat] center of your section
- sectionAvgNdvi: Estimate based on grid cells covered
- sectionJustification: Explain which grid cells you targeted and why
- paddockGrazedPercentage: ${grazedPercentage}
- confidence: ${recommendation === 'move' ? 0.55 : 0.75}
- reasoning: ["Targeted high-NDVI cells at Row/Col...", "Adjacent to previous section...", ...]

CRITICAL: You MUST call createPlanWithSection then finalizePlan.`

    const result = await generateText({
      model: anthropicClient(GRAZING_AGENT_MODEL) as any,
    system: GRAZING_SYSTEM_PROMPT,
    prompt,
    tools: {
      createPlanWithSection: tool({
        description: "Create or update a grazing plan with section geometry and justification. You MUST always provide sectionGeometry - animals must eat somewhere every day.",
        inputSchema: z.object({
          farmExternalId: z.string(),
          targetPaddockId: z.string(),
          sectionGeometry: z.any(), // Required - always create a section
          sectionAreaHectares: z.number().optional(),
          sectionCentroid: z.array(z.number()).optional(),
          sectionAvgNdvi: z.number().optional(),
          sectionJustification: z.string(),
          paddockGrazedPercentage: z.number().optional(),
          confidence: z.number(),
          reasoning: z.array(z.string()),
        }),
      }),

      finalizePlan: tool({
        description: "Finalize the plan and set it to pending status for user approval",
        inputSchema: z.object({
          farmExternalId: z.string().optional(),
        }),
      }),
    },
    ...(tracer && {
      experimental_telemetry: {
        isEnabled: true,
        tracer,
        functionId: "runGrazingAgent",
        recordInputs: true,
        recordOutputs: true,
        metadata: {
          farmExternalId,
          farmName,
          activePaddockId: activePaddockId || "none",
          promptVersion: PROMPT_VERSION,
          model: GRAZING_AGENT_MODEL,
        },
      },
    }),
  })

    const finalText = result.text
    const toolCalls = (result as any).toolCalls || []
    const usage = (result as any).usage || (result as any).experimental_providerMetadata?.anthropic?.usage

    log('LLM response received', {
      textLength: finalText?.length,
      toolCallsCount: toolCalls.length,
      toolNames: toolCalls.map((tc: any) => tc.toolName),
      usage: usage,
    })

    // Log LLM call to Braintrust and capture span ID for tool call nesting
    const llmEndTime = Date.now()
    const llmSpanId = logLLMCall({
      model: GRAZING_AGENT_MODEL,
      prompt: prompt,
      systemPrompt: GRAZING_SYSTEM_PROMPT,
      response: finalText || '',
      toolCalls: toolCalls,
      usage: usage ? {
        promptTokens: usage.promptTokens || usage.input_tokens,
        completionTokens: usage.completionTokens || usage.output_tokens,
        totalTokens: usage.totalTokens || (usage.input_tokens + usage.output_tokens),
      } : undefined,
      durationMs: llmEndTime - dataFetchStart, // Approximate, includes data fetch
      metadata: {
        farmExternalId,
        farmName,
        activePaddockId: activePaddockId || 'none',
        targetPaddockId: targetPaddock?.externalId,
        promptVersion: PROMPT_VERSION,
      },
    })

    let planCreated = false
    let planFinalized = false
    let createdPlanId: Id<'plans'> | undefined = undefined

    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const args = (toolCall as any).args ?? (toolCall as any).input ?? {}

        log('Executing tool', {
          toolName: toolCall.toolName,
          hasSectionGeometry: !!args.sectionGeometry,
          targetPaddockId: args.targetPaddockId,
          sectionAreaHectares: args.sectionAreaHectares,
          sectionGeometryPreview: args.sectionGeometry ? JSON.stringify(args.sectionGeometry).substring(0, 200) : 'null',
          sectionGeometryType: args.sectionGeometry?.type,
          sectionCoordinatesCount: args.sectionGeometry?.coordinates?.[0]?.length || 0,
        })

        const toolStartTime = Date.now()
        try {
            if (toolCall.toolName === "createPlanWithSection") {
          // Validate that sectionGeometry is provided
          if (!args.sectionGeometry) {
            // Log tool call error to Braintrust
            logToolCall({
              parentSpanId: llmSpanId,
              toolName: toolCall.toolName,
              input: args,
              error: 'sectionGeometry is required - animals must eat somewhere',
              durationMs: Date.now() - toolStartTime,
            })

            throw new Error('sectionGeometry is required - animals must eat somewhere. The agent must always create a section, even if conditions are not ideal.')
          }

          // === NDVI VALIDATION ===
          // Validate section NDVI before saving to ensure high-quality sections
          let sectionNDVI = { mean: 0, meetsThreshold: false, threshold: threshold }
          try {
            log('Validating section NDVI...')
            sectionNDVI = await ctx.runAction(api.ndviGrid.calculateSectionNDVI, {
              farmExternalId,
              paddockExternalId: args.targetPaddockId || targetPaddock?.externalId || 'p1',
              sectionGeometry: args.sectionGeometry,
            })

            // Log section NDVI validation to Braintrust
            logToolCall({
              parentSpanId: llmSpanId,
              toolName: 'calculateSectionNDVI',
              input: {
                sectionGeometry: JSON.stringify(args.sectionGeometry).substring(0, 200),
                paddockId: args.targetPaddockId,
                iteration: 1, // Note: Hardcoded until multi-iteration loops are implemented
              },
              output: {
                mean: sectionNDVI.mean,
                threshold: sectionNDVI.threshold,
                meetsThreshold: sectionNDVI.meetsThreshold,
              },
              durationMs: Date.now() - toolStartTime,
            })

            log('Section NDVI validation', {
              mean: sectionNDVI.mean,
              threshold: sectionNDVI.threshold,
              meetsThreshold: sectionNDVI.meetsThreshold,
            })

            // Update section NDVI in args if we calculated it
            if (sectionNDVI.mean > 0) {
              args.sectionAvgNdvi = sectionNDVI.mean
            }

            // Add warning to justification if section doesn't meet threshold
            if (!sectionNDVI.meetsThreshold && sectionNDVI.mean > 0) {
              const warningNote = ` [NDVI Warning: Section average ${sectionNDVI.mean.toFixed(2)} is below threshold ${sectionNDVI.threshold}. Consider reviewing grid placement.]`
              args.sectionJustification = (args.sectionJustification || '') + warningNote
              log('Added NDVI warning to justification')
            }
          } catch (ndviError: any) {
            log.warn('NDVI validation failed (continuing)', { error: ndviError.message })
            // Continue with section creation even if NDVI validation fails
          }

              const planId = await ctx.runMutation(api.grazingAgentTools.createPlanWithSection, args as any)
              createdPlanId = planId

              // Log successful tool call to Braintrust
              logToolCall({
                parentSpanId: llmSpanId,
                toolName: toolCall.toolName,
                input: args,
                output: {
                  planId: planId.toString(),
                  sectionNDVI: sectionNDVI.mean,
                  meetsThreshold: sectionNDVI.meetsThreshold,
                },
                durationMs: Date.now() - toolStartTime,
              })

              log('createPlanWithSection SUCCESS - PlanId created', {
                planId: planId.toString(),
                planIdType: typeof planId,
                hasSectionGeometry: !!args.sectionGeometry,
                targetPaddockId: args.targetPaddockId,
                sectionNDVI: sectionNDVI.mean,
                meetsThreshold: sectionNDVI.meetsThreshold,
                note: 'This planId will be returned in result object',
              })
              planCreated = true
            } else if (toolCall.toolName === "finalizePlan") {
              const result = await ctx.runMutation(api.grazingAgentTools.finalizePlan, {
                farmExternalId: (args.farmExternalId as string) ?? farmExternalId
              })

              // Log successful tool call to Braintrust
              logToolCall({
                parentSpanId: llmSpanId,
                toolName: toolCall.toolName,
                input: { farmExternalId: (args.farmExternalId as string) ?? farmExternalId },
                output: result,
                durationMs: Date.now() - toolStartTime,
              })

              log('finalizePlan SUCCESS', { result })
              planFinalized = true
            }
          } catch (toolError: any) {
            // Log tool call error to Braintrust (if not already logged above)
            if (toolCall.toolName !== "createPlanWithSection" || args.sectionGeometry) {
              logToolCall({
                parentSpanId: llmSpanId,
                toolName: toolCall.toolName,
                input: args,
                error: toolError.message || String(toolError),
                durationMs: Date.now() - toolStartTime,
              })
            }

            log.error('Tool execution ERROR', {
              toolName: toolCall.toolName,
              error: toolError,
              args: JSON.stringify(args).substring(0, 200),
            })

            throw toolError
          }
      }
    } else {
      log.warn('WARNING: No tool calls returned from LLM')
    }

    const finalResult = { 
      success: true, 
      planCreated: planCreated && planFinalized,
      planId: createdPlanId,
    }

    log('END - Summary', {
      planCreated,
      planFinalized,
      planId: createdPlanId?.toString(),
      hasPlanId: !!createdPlanId,
      planIdIncludedInResult: true,
      finalTextPreview: finalText?.substring(0, 100),
      returnValue: finalResult,
    })

    return finalResult
}

/**
 * Main entry point: Run agent with optional Braintrust logging
 */
export async function runGrazingAgent(
  ctx: ActionCtx,
  farmExternalId: string,
  farmName: string,
  activePaddockId: string | null,
  settings: { minNDVIThreshold: number; minRestPeriod: number },
  logger?: any, // Braintrust logger passed from action
  wrappedAnthropic?: any, // Wrapped Anthropic client passed from action
  tracer?: OTelTracer // OTel tracer for experimental_telemetry
): Promise<PlanGenerationResult> {
  // Use wrapped Anthropic if provided, otherwise use regular Anthropic
  const anthropicClient = wrappedAnthropic || anthropic

  // If no logger provided, run without Braintrust logging
  if (!logger) {
    return await runGrazingAgentCore(ctx, farmExternalId, farmName, activePaddockId, settings, anthropicClient, tracer)
  }
  
  // Run with Braintrust logging
  return await logger.traced(async (rootSpan: any) => {
    // Log agent invocation (sanitize to remove Convex internal fields)
    rootSpan.log({
      input: sanitizeForBraintrust({
        farmExternalId,
        farmName,
        activePaddockId,
        settings: {
          minNDVIThreshold: settings.minNDVIThreshold,
          minRestPeriod: settings.minRestPeriod,
        },
      }),
      metadata: sanitizeForBraintrust({
        trigger: 'agent_execution',
        promptVersion: PROMPT_VERSION,
      }),
    })

    // Call core function and wrap result logging
    const result = await runGrazingAgentCore(ctx, farmExternalId, farmName, activePaddockId, settings, anthropicClient, tracer)
    
    // Log final result (sanitize to remove Convex internal fields)
    rootSpan.log({
      output: sanitizeForBraintrust({
        success: result.success,
        planCreated: result.planCreated,
        planId: result.planId ? String(result.planId) : undefined,
      }),
    })

    return result
  }, { name: 'Grazing Agent', metadata: { farmExternalId, farmName, activePaddockId } })
}
