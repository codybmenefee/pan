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
 */

import { anthropic } from "@ai-sdk/anthropic"
import { generateText, tool } from "ai"
import { api } from "./_generated/api"
import type { ActionCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { z } from "zod"

const GRAZING_AGENT_MODEL = "claude-haiku-4-5"

const GRAZING_SYSTEM_PROMPT = `You are a grazing intelligence specialist. Your role is to recommend daily grazing sections based on satellite-derived vegetation data.

## YOUR TASK
Analyze the provided data and create a grazing plan by calling the tools.

## CRITICAL RULES
- You MUST ALWAYS create a section geometry - animals must eat somewhere every day
- You MUST call createPlanWithSection AND finalizePlan tools. The tools are your output mechanism - not text.
- NEVER recommend "rest" - always select a paddock and draw a section, even if conditions aren't ideal
- If the current paddock has low NDVI, find the best alternative paddock or continue in current paddock with appropriate justification
- Never suggest sections that overlap with previously grazed areas
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
export async function runGrazingAgent(
  ctx: ActionCtx,
  farmExternalId: string,
  farmName: string,
  activePaddockId: string | null,
  settings: { minNDVIThreshold: number; minRestPeriod: number }
): Promise<PlanGenerationResult> {
  console.log('[runGrazingAgent] START - Input:', {
    farmExternalId,
    farmName,
    activePaddockId,
    settings,
  })

  // Fetch all data upfront in parallel
  const [allPaddocks, currentPaddock, currentPaddockSections, currentGrazedPercentage] = await Promise.all([
    ctx.runQuery(api.grazingAgentTools.getAllPaddocksWithObservations, { farmExternalId }),
    ctx.runQuery(api.grazingAgentTools.getPaddockData, { farmExternalId }),
    ctx.runQuery(api.grazingAgentTools.getPreviousSections, { farmExternalId, paddockId: activePaddockId ?? undefined }),
    ctx.runQuery(api.grazingAgentTools.calculatePaddockGrazedPercentage, { farmExternalId, paddockId: activePaddockId || 'p1' }),
  ])

  console.log('[runGrazingAgent] Data fetched:', {
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

  console.log('[runGrazingAgent] Decision logic:', {
    currentNdvi,
    threshold,
    comparison: currentNdvi >= threshold ? 'meets threshold' : 'below threshold',
  })

  let targetPaddock: any = currentPaddock
  let recommendation = "graze"
  
  // #region debug log
  fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:75',message:'Decision logic start',data:{currentNdvi,threshold,allPaddocksCount:allPaddocks?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // Always select a paddock - never recommend rest
  if (currentNdvi < threshold) {
    // Find best alternative paddock (prefer those meeting threshold, but use best available if none)
    const alternativesAboveThreshold = allPaddocks?.filter((p: any) => p.ndviMean >= threshold) ?? []
    console.log('[runGrazingAgent] Current NDVI below threshold, found', alternativesAboveThreshold.length, 'alternatives above threshold')
    
    // #region debug log
    fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:82',message:'Alternatives check',data:{alternativesCount:alternativesAboveThreshold.length,alternatives:alternativesAboveThreshold.map((p:any)=>({id:p.externalId,ndvi:p.ndviMean}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (alternativesAboveThreshold.length > 0) {
      // Move to best alternative that meets threshold
      alternativesAboveThreshold.sort((a: any, b: any) => {
        if (b.ndviMean !== a.ndviMean) return b.ndviMean - a.ndviMean
        return b.restDays - a.restDays
      })
      targetPaddock = alternativesAboveThreshold[0]
      recommendation = "move"
      console.log('[runGrazingAgent] DECISION: Move to alternative paddock (meets threshold):', {
        paddockId: targetPaddock?.externalId,
        name: targetPaddock?.name,
        ndviMean: targetPaddock?.ndviMean,
        restDays: targetPaddock?.restDays,
      })
      
      // #region debug log
      fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:92',message:'Decision: move to alternative',data:{recommendation,targetPaddockId:targetPaddock?.externalId,targetNdvi:targetPaddock?.ndviMean},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } else {
      // No paddocks meet threshold - find best available (highest NDVI)
      const allSorted = [...(allPaddocks || [])].sort((a: any, b: any) => {
        if (b.ndviMean !== a.ndviMean) return b.ndviMean - a.ndviMean
        return b.restDays - a.restDays
      })
      const bestAvailable = allSorted[0]
      
      // #region debug log
      fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:100',message:'Best available check',data:{bestAvailableId:bestAvailable?.externalId,bestAvailableNdvi:bestAvailable?.ndviMean,currentPaddockId:currentPaddock?.externalId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (bestAvailable && bestAvailable.externalId !== currentPaddock?.externalId) {
        targetPaddock = bestAvailable
        recommendation = "move"
        console.log('[runGrazingAgent] DECISION: Move to best available paddock (below threshold but best option):', {
          paddockId: targetPaddock?.externalId,
          name: targetPaddock?.name,
          ndviMean: targetPaddock?.ndviMean,
          restDays: targetPaddock?.restDays,
        })
        
        // #region debug log
        fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:109',message:'Decision: move to best available',data:{recommendation,targetPaddockId:targetPaddock?.externalId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        // Stay in current paddock - it's the best available
        recommendation = "graze"
        console.log('[runGrazingAgent] DECISION: Continue in current paddock (best available, below threshold):', {
          paddockId: currentPaddock?.externalId,
          ndviMean: currentNdvi,
          note: 'Will create section with low NDVI warning in justification',
        })
        
        // #region debug log
        fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:118',message:'Decision: continue in current',data:{recommendation,targetPaddockId:currentPaddock?.externalId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
    }
  } else {
    console.log('[runGrazingAgent] DECISION: Graze in current paddock - NDVI meets threshold')
    
    // #region debug log
    fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:126',message:'Decision: graze (meets threshold)',data:{recommendation,targetPaddockId:currentPaddock?.externalId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }
  
  // #region debug log
  fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:129',message:'Final decision',data:{recommendation,targetPaddockId:targetPaddock?.externalId,targetNdvi:targetPaddock?.ndviMean},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

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

  console.log('[runGrazingAgent] Target paddock data:', {
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

  // #region debug log
  fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:196',message:'Target paddock geometry check',data:{targetPaddockId:targetPaddock?.externalId,hasGeometry:!!targetPaddock?.geometry,geometryPreview:targetPaddock?.geometry?JSON.stringify(targetPaddock.geometry).substring(0,200):'null'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  const prompt = `Generate today's grazing plan for farm "${farmName}".

## All Paddocks (sorted by NDVI):
${JSON.stringify(allPaddocks?.map((p: any) => ({
  externalId: p.externalId,
  name: p.name,
  ndviMean: p.ndviMean,
  area: p.area,
  restDays: p.restDays,
  status: p.status,
  // Geometry included for reference - use target paddock geometry for section creation
  geometry: p.geometry,
})), null, 2)}

## Current Paddock (${currentPaddock?.externalId}):
- Name: ${currentPaddock?.name}
- NDVI: ${currentNdvi} (threshold: ${threshold})
- Area: ${currentPaddock?.area} hectares
- Rest days: ${currentPaddock?.restDays}
- Grazed: ${currentGrazedPercentage}%

## Target Paddock (${targetPaddock?.externalId}):
- Name: ${targetPaddock?.name}
- NDVI: ${targetPaddock?.ndviMean}
- Area: ${targetPaddock?.area} hectares
- Grazed: ${grazedPercentage}%
- **Paddock Boundary Geometry (CRITICAL - section must stay within this):**
${JSON.stringify(targetPaddock?.geometry, null, 2)}

## Target Paddock for Plan:
${recommendation === 'graze' 
  ? (targetPaddock?.ndviMean >= threshold
    ? `Continue grazing in ${targetPaddock?.externalId} (${targetPaddock?.name}) - NDVI ${targetPaddock?.ndviMean} meets threshold`
    : `Continue grazing in ${targetPaddock?.externalId} (${targetPaddock?.name}) - NDVI ${targetPaddock?.ndviMean} is below threshold but this is the best available option`)
  : (targetPaddock?.ndviMean >= threshold
    ? `MOVE HERD to ${targetPaddock?.externalId} (${targetPaddock?.name}) - NDVI ${targetPaddock?.ndviMean} meets threshold and is better than current`
    : `MOVE HERD to ${targetPaddock?.externalId} (${targetPaddock?.name}) - NDVI ${targetPaddock?.ndviMean} is below threshold but is the best available option`)
}

## Previous Sections in Target Paddock:
${previousSections?.length === 0 ? "paddock is fresh" : JSON.stringify(previousSections)}

## Farm Settings:
- NDVI threshold: ${threshold}
- Rest period: ${settings.minRestPeriod} days
- Section size: 20%

## Your Task:
CRITICAL: You MUST create a section geometry - animals must eat somewhere. Never create a plan without a section.

Create a grazing plan by calling createPlanWithSection then finalizePlan.

${recommendation === 'graze' && previousSections && previousSections.length > 0 ? `
IMPORTANT: You are creating a NEW section in the SAME paddock (${targetPaddock?.externalId}) where livestock are currently grazing.
The paddock has ${previousSections.length} previous section(s). You MUST create a section that does NOT overlap with any previous sections.

Previous sections in this paddock:
${JSON.stringify(previousSections.map((s: any) => ({ date: s.date, area: s.area, justification: s.justification })), null, 2)}

Create a NEW ~20% section in ${targetPaddock?.externalId} that avoids all previous sections:
` : `
Create an optimal ~20% section in ${targetPaddock?.externalId}:
`}

REQUIRED FIELDS:
- targetPaddockId: ${targetPaddock?.externalId}
- confidence: ${recommendation === 'move' ? '0.55' : '0.75'}${targetPaddock?.ndviMean < threshold ? ' (lower confidence due to below-threshold NDVI)' : ''}
- reasoning: Array with 2-3 technical factors:
  ${targetPaddock?.ndviMean < threshold 
    ? `  * Note that NDVI ${targetPaddock?.ndviMean} is below the ${threshold} threshold but this is the best available option
  * Explain why this paddock was selected despite low NDVI
  * Mention any mitigating factors (rest days, alternative options considered)`
    : recommendation === 'graze'
    ? '  * Why staying in current paddock (good NDVI, sufficient forage)'
    : '  * Why this paddock was selected (better NDVI than current)'}
- sectionGeometry: REQUIRED - Create a valid GeoJSON Polygon that:
  ${previousSections && previousSections.length > 0 ? `  * Does NOT overlap with any previous sections listed above
  * Is approximately 20% of paddock area (${Math.round((targetPaddock?.area ?? 0) * 0.2 * 10) / 10} hectares)
  * **CRITICAL: Must be 100% within the paddock boundary geometry shown above - ALL coordinates must be inside the paddock polygon**
  * Use coordinates from the paddock boundary as reference - create a smaller polygon inside it
  * Ensure every vertex of your section polygon is within the paddock boundary coordinates` : `  * Is approximately 20% of paddock area (${Math.round((targetPaddock?.area ?? 0) * 0.2 * 10) / 10} hectares)
  * **CRITICAL: Must be 100% within the paddock boundary geometry shown above - ALL coordinates must be inside the paddock polygon**
  * Use coordinates from the paddock boundary as reference - create a smaller polygon inside it
  * Ensure every vertex of your section polygon is within the paddock boundary coordinates`}
- sectionJustification: 3-5 sentences explaining:
  ${targetPaddock?.ndviMean < threshold
    ? `  * That NDVI is below threshold but this is the best available option
  * Why animals must graze somewhere and this paddock was selected
  * Any considerations for monitoring or shorter grazing duration`
    : recommendation === 'graze'
    ? '  * Why staying in current paddock (good NDVI, sufficient forage)'
    : '  * Why this paddock was selected (better NDVI than current)'}
  * NDVI range and vegetation quality
  * What areas to avoid (if any previous sections exist)
- sectionAreaHectares: ~20% of ${targetPaddock?.area} ha = ${Math.round((targetPaddock?.area ?? 0) * 0.2 * 10) / 10} ha
- sectionCentroid: [lng, lat] from the geometry center
- sectionAvgNdvi: ${targetPaddock?.ndviMean}
- paddockGrazedPercentage: ${grazedPercentage}% (current percentage of paddock already grazed)

CRITICAL: You MUST call createPlanWithSection then finalizePlan. Use farmExternalId="${farmExternalId}".`

  // #region debug log
  const promptPreview = prompt.substring(0, 1000) + (prompt.length > 1000 ? '...' : '')
  const targetGeometryInPrompt = targetPaddock?.geometry ? JSON.stringify(targetPaddock.geometry).substring(0, 300) : 'MISSING'
  fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:314',message:'LLM prompt check',data:{promptLength:prompt.length,targetPaddockId:targetPaddock?.externalId,targetGeometryInPrompt:targetGeometryInPrompt.substring(0,300),hasTargetGeometry:!!targetPaddock?.geometry},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  const result = await generateText({
    model: anthropic(GRAZING_AGENT_MODEL) as any,
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
  })

  const finalText = result.text
  const toolCalls = (result as any).toolCalls || []

  console.log('[runGrazingAgent] LLM response received:', {
    textLength: finalText?.length,
    toolCallsCount: toolCalls.length,
    toolNames: toolCalls.map((tc: any) => tc.toolName),
  })

  let planCreated = false
  let planFinalized = false
  let createdPlanId: Id<'plans'> | undefined = undefined
  
  if (toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      const args = (toolCall as any).args ?? (toolCall as any).input ?? {}
      
      console.log('[runGrazingAgent] Executing tool:', toolCall.toolName, {
        hasSectionGeometry: !!args.sectionGeometry,
        targetPaddockId: args.targetPaddockId,
        sectionAreaHectares: args.sectionAreaHectares,
        sectionGeometryPreview: args.sectionGeometry ? JSON.stringify(args.sectionGeometry).substring(0, 200) : 'null',
        sectionGeometryType: args.sectionGeometry?.type,
        sectionCoordinatesCount: args.sectionGeometry?.coordinates?.[0]?.length || 0,
      })
      
      // #region debug log
      fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:322',message:'LLM generated section geometry',data:{targetPaddockId:args.targetPaddockId,hasSectionGeometry:!!args.sectionGeometry,sectionGeometryType:args.sectionGeometry?.type,sectionCoordinatesPreview:args.sectionGeometry?.coordinates?JSON.stringify(args.sectionGeometry.coordinates[0]).substring(0,200):'null',coordinateCount:args.sectionGeometry?.coordinates?.[0]?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      try {
        if (toolCall.toolName === "createPlanWithSection") {
          // #region debug log
          fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:288',message:'Tool call validation',data:{hasSectionGeometry:!!args.sectionGeometry,sectionGeometryType:args.sectionGeometry?typeof args.sectionGeometry:'null',targetPaddockId:args.targetPaddockId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          // Validate that sectionGeometry is provided
          if (!args.sectionGeometry) {
            // #region debug log
            fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:293',message:'Validation failed: no sectionGeometry',data:{args:JSON.stringify(args).substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            throw new Error('sectionGeometry is required - animals must eat somewhere. The agent must always create a section, even if conditions are not ideal.')
          }
          
          // #region debug log
          fetch('http://127.0.0.1:7249/ingest/2e230f40-eca6-4d99-9954-1225e31e8a0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grazingAgentDirect.ts:299',message:'Calling createPlanWithSection mutation',data:{hasSectionGeometry:true,targetPaddockId:args.targetPaddockId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          const planId = await ctx.runMutation(api.grazingAgentTools.createPlanWithSection, args as any)
          createdPlanId = planId
          console.log('[runGrazingAgent] createPlanWithSection SUCCESS - PlanId created:', {
            planId: planId.toString(),
            planIdType: typeof planId,
            hasSectionGeometry: !!args.sectionGeometry,
            targetPaddockId: args.targetPaddockId,
            note: 'This planId will be returned in result object',
          })
          planCreated = true
        } else if (toolCall.toolName === "finalizePlan") {
          const result = await ctx.runMutation(api.grazingAgentTools.finalizePlan, { 
            farmExternalId: (args.farmExternalId as string) ?? farmExternalId 
          })
          console.log('[runGrazingAgent] finalizePlan SUCCESS:', result)
          planFinalized = true
        }
      } catch (toolError) {
        console.error('[runGrazingAgent] Tool execution ERROR:', {
          toolName: toolCall.toolName,
          error: toolError,
          args: JSON.stringify(args).substring(0, 200),
        })
      }
    }
  } else {
    console.warn('[runGrazingAgent] WARNING: No tool calls returned from LLM')
  }

  console.log('[runGrazingAgent] END - Summary:', {
    planCreated,
    planFinalized,
    planId: createdPlanId?.toString(),
    hasPlanId: !!createdPlanId,
    planIdIncludedInResult: true,
    finalTextPreview: finalText?.substring(0, 100),
    returnValue: {
      success: true,
      planCreated: planCreated && planFinalized,
      planId: createdPlanId?.toString(),
      note: 'planId is included in result for gateway to use (optimization: avoids getTodayPlan query)',
    },
  })

  return { 
    success: true, 
    planCreated: planCreated && planFinalized,
    planId: createdPlanId,
  }
}
