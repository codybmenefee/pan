---
name: braintrust
description: Guide for using Braintrust platform for AI observability, logging agent calls, tools, and prompts in the grazing intelligence system
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: ai-observability
---

# Braintrust Integration Skill

## Introduction

Braintrust is an AI observability platform that provides comprehensive logging, debugging, and evaluation capabilities for AI agent applications. This skill guides you through integrating Braintrust into the grazing intelligence system to capture traces from agent interactions, tool executions, and prompt construction.

**Why Braintrust?** This project uses Braintrust to:
- Log all agent calls for debugging and analysis
- Track tool executions with full context
- Monitor prompt construction and versioning
- Build evaluation datasets from production traces
- Debug agent behavior in production

**Current State:** The project has a stub implementation in `app/lib/braintrust.ts` that needs to be replaced with real Braintrust SDK integration. This skill provides the patterns and examples needed to complete that integration.

## Braintrust Workflow Overview

Braintrust follows a five-stage workflow for AI observability:

1. **Instrument** → Capture traces from agent applications automatically or manually
2. **Observe** → Analyze logs in the Braintrust UI, find patterns, identify issues
3. **Annotate** → Add human feedback to traces, build datasets for evaluation
4. **Evaluate** → Test changes systematically with experiments, compare model versions
5. **Deploy** → Ship validated changes and monitor impact in production

This project primarily uses the **Instrument** and **Observe** stages for production logging, with **Evaluate** used for testing agent improvements.

## Installation & Setup

### Install SDK

```bash
npm install braintrust
```

### Environment Configuration

Set the Braintrust API key as an environment variable:

```bash
BRAINTRUST_API_KEY=your_api_key_here
```

In Convex actions, access via `process.env.BRAINTRUST_API_KEY`.

### Initialize Logger

For production logging (what this project uses), initialize a logger:

```typescript
import { initLogger } from 'braintrust'

const logger = initLogger({
  project: 'grazing-agent',
  // Optional: set experiment name for evaluation runs
  // experiment: 'morning-brief-v2'
})
```

**Project Naming Convention:** Use `'grazing-agent'` as the project name for all agent-related traces. This groups all logs in the Braintrust UI.

## Core Concepts

### Experiments vs Loggers

- **Experiments**: Immutable snapshots used for evaluation and comparison. Use for testing changes.
- **Loggers**: Production logging for ongoing observability. Use for all production agent calls.

**This project uses loggers for production**, not experiments. Use experiments only when evaluating prompt changes or model versions.

### Spans

A **span** is an individual unit of work (e.g., an LLM call, a tool call, a prompt construction). Spans can be nested to create hierarchical traces.

### Traces

A **trace** is a hierarchical collection of spans representing a complete agent interaction. For example:
- Root span: Agent invocation
  - Child span: Prompt construction
  - Child span: LLM call
    - Child span: Tool call (createPlanWithSection)
    - Child span: Tool call (finalizePlan)
  - Child span: Response processing

## Logging Agent Calls

### Automatic Logging with wrapAnthropic()

The easiest way to log Anthropic Claude calls is to wrap the Anthropic client:

```typescript
import { wrapAnthropic } from 'braintrust'
import { Anthropic } from '@anthropic-ai/sdk'

const anthropic = wrapAnthropic(
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
)

// All calls through this client are automatically logged
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [...]
})
```

**Integration Point:** Replace the direct `anthropic()` call in `app/convex/grazingAgentDirect.ts` with a wrapped client.

### Manual Span Logging

For more control, create spans manually:

```typescript
import { initLogger } from 'braintrust'

const logger = initLogger({ project: 'grazing-agent' })

await logger.traced(async (span) => {
  span.log({
    name: 'agent_call',
    input: {
      systemPrompt: GRAZING_SYSTEM_PROMPT,
      userPrompt: prompt,
      model: GRAZING_AGENT_MODEL,
      farmExternalId,
      farmName,
    },
    metadata: {
      trigger: 'morning_brief',
      activePaddockId,
      settings,
    },
  })

  const result = await generateText({
    model: anthropic(GRAZING_AGENT_MODEL),
    system: GRAZING_SYSTEM_PROMPT,
    prompt,
    tools: { ... },
  })

  span.log({
    output: {
      text: result.text,
      toolCalls: result.toolCalls,
      finishReason: result.finishReason,
    },
    metadata: {
      usage: {
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens,
      },
    },
  })

  return result
})
```

## Logging Tool Calls

Each tool execution should be logged as a child span:

```typescript
await logger.traced(async (span) => {
  // Log tool call start
  span.log({
    name: 'tool_call',
    input: {
      tool: 'createPlanWithSection',
      args: {
        farmExternalId,
        targetPaddockId,
        sectionGeometry,
        confidence,
        reasoning,
      },
    },
    metadata: {
      farmExternalId,
      trigger: 'agent_execution',
    },
  })

  try {
    // Execute tool
    const planId = await ctx.runMutation(
      api.grazingAgentTools.createPlanWithSection,
      args
    )

    // Log success
    span.log({
      output: {
        planId: planId.toString(),
        success: true,
      },
    })

    return planId
  } catch (error) {
    // Log error
    span.log({
      output: {
        success: false,
        error: error.message,
        stack: error.stack,
      },
    })
    throw error
  }
})
```

**Integration Point:** Add logging to each tool in `app/convex/grazingAgentTools.ts`:
- `createPlanWithSection`
- `finalizePlan`
- Other tool functions

### Hierarchical Tool Logging

For nested tool calls, create child spans:

```typescript
await logger.traced(async (rootSpan) => {
  // Agent invocation
  rootSpan.log({ name: 'agent_invocation', input: { farmExternalId } })

  // Tool call 1
  await rootSpan.traced(async (toolSpan) => {
    toolSpan.log({ name: 'createPlanWithSection', input: { ... } })
    await ctx.runMutation(api.grazingAgentTools.createPlanWithSection, args)
    toolSpan.log({ output: { planId } })
  })

  // Tool call 2
  await rootSpan.traced(async (toolSpan) => {
    toolSpan.log({ name: 'finalizePlan', input: { farmExternalId } })
    await ctx.runMutation(api.grazingAgentTools.finalizePlan, args)
    toolSpan.log({ output: { success: true } })
  })
})
```

## Logging Prompt Construction

Log prompt assembly separately from LLM calls to track prompt versioning:

```typescript
await logger.log({
  input: {
    systemPrompt: GRAZING_SYSTEM_PROMPT,
    userPrompt: prompt,
    promptVersion: 'v1.2.0', // Track prompt changes
  },
  metadata: {
    farmId: farmExternalId,
    farmName,
    trigger: 'morning_brief',
    contextVersion: '2024-01-20', // Track data schema version
    activePaddockId,
    settings,
    paddockCount: allPaddocks?.length,
    observationDate: latestObservation?.date,
  },
})
```

**Best Practice:** Include a `promptVersion` in metadata to track when prompts change. This enables comparing performance across prompt versions.

## Integration with Current Architecture

### Replace Stub Implementation

The current stub in `app/lib/braintrust.ts` should be replaced with real Braintrust SDK calls. The stub provides a good interface - maintain the same function signatures but implement with Braintrust SDK.

### Integration Points

1. **`app/convex/grazingAgentDirect.ts`**
   - Wrap Anthropic client with `wrapAnthropic()`
   - Or add manual span logging around `generateText()` call
   - Log prompt construction before LLM call
   - Log tool calls as child spans

2. **`app/convex/grazingAgentTools.ts`**
   - Add logging to each tool function
   - Log inputs, outputs, and errors
   - Include execution time

3. **`app/convex/grazingAgentGateway.ts`**
   - Initialize logger at gateway entry point
   - Log each agent invocation with trigger type
   - Create root span for entire agent execution

### Logger Pattern (Not Experiments)

**Important:** Use `initLogger()` for production, not `init()` or experiments. Loggers are designed for ongoing observability, while experiments are for evaluation snapshots.

```typescript
// ✅ Correct: Production logging
const logger = initLogger({ project: 'grazing-agent' })

// ❌ Wrong: Don't use experiments for production
// const experiment = init({ project: 'grazing-agent', experiment: 'prod' })
```

Use experiments only when:
- Testing a new prompt version
- Comparing model performance
- Running A/B tests

## Code Examples

### Example 1: Basic Logger Setup

```typescript
import { initLogger } from 'braintrust'

// Initialize once, reuse across requests
const logger = initLogger({
  project: 'grazing-agent',
})

// Use in agent functions
export async function runGrazingAgent(...) {
  await logger.log({
    input: { farmExternalId, farmName },
    metadata: { trigger: 'morning_brief' },
  })
  
  // ... agent logic
}
```

### Example 2: Wrap Anthropic Client

```typescript
import { wrapAnthropic } from 'braintrust'
import { anthropic } from '@ai-sdk/anthropic'

// Wrap once, reuse
const wrappedAnthropic = wrapAnthropic(anthropic)

// Use in generateText
const result = await generateText({
  model: wrappedAnthropic(GRAZING_AGENT_MODEL),
  system: GRAZING_SYSTEM_PROMPT,
  prompt,
  tools: { ... },
})
// Automatically logged to Braintrust
```

### Example 3: Manual Span for Tool Call

```typescript
import { initLogger } from 'braintrust'

const logger = initLogger({ project: 'grazing-agent' })

export const createPlanWithSection = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    return await logger.traced(async (span) => {
      span.log({
        name: 'createPlanWithSection',
        input: args,
        metadata: {
          farmExternalId: args.farmExternalId,
          timestamp: new Date().toISOString(),
        },
      })

      const startTime = Date.now()
      
      try {
        const planId = await ctx.db.insert('plans', { ... })
        
        span.log({
          output: { planId: planId.toString() },
          metadata: {
            executionTimeMs: Date.now() - startTime,
          },
        })
        
        return planId
      } catch (error) {
        span.log({
          output: {
            error: error.message,
            stack: error.stack,
          },
          metadata: {
            executionTimeMs: Date.now() - startTime,
          },
        })
        throw error
      }
    })
  },
})
```

### Example 4: Log Prompt Construction

```typescript
await logger.log({
  input: {
    systemPrompt: GRAZING_SYSTEM_PROMPT,
    userPrompt: prompt,
  },
  metadata: {
    farmId: farmExternalId,
    farmName,
    trigger: 'morning_brief',
    promptVersion: 'v1.2.0',
    contextVersion: '2024-01-20',
    activePaddockId,
    settings,
    paddockData: {
      count: allPaddocks?.length,
      currentNdvi: currentPaddock?.ndviMean,
      recommendation,
    },
  },
})
```

### Example 5: Complete Agent Integration

```typescript
import { initLogger } from 'braintrust'
import { wrapAnthropic } from 'braintrust'
import { anthropic } from '@ai-sdk/anthropic'

const logger = initLogger({ project: 'grazing-agent' })
const wrappedAnthropic = wrapAnthropic(anthropic)

export async function runGrazingAgent(
  ctx: ActionCtx,
  farmExternalId: string,
  farmName: string,
  ...
): Promise<PlanGenerationResult> {
  return await logger.traced(async (rootSpan) => {
    // Log agent invocation
    rootSpan.log({
      name: 'grazing_agent_invocation',
      input: { farmExternalId, farmName, activePaddockId, settings },
      metadata: { trigger: 'morning_brief' },
    })

    // Fetch data
    const [allPaddocks, currentPaddock, ...] = await Promise.all([...])

    // Log prompt construction
    rootSpan.log({
      name: 'prompt_construction',
      input: {
        systemPrompt: GRAZING_SYSTEM_PROMPT,
        userPrompt: prompt,
      },
      metadata: {
        promptVersion: 'v1.2.0',
        paddockCount: allPaddocks?.length,
        currentNdvi: currentPaddock?.ndviMean,
      },
    })

    // LLM call (automatically logged if using wrapAnthropic)
    const result = await generateText({
      model: wrappedAnthropic(GRAZING_AGENT_MODEL),
      system: GRAZING_SYSTEM_PROMPT,
      prompt,
      tools: { ... },
    })

    // Log LLM response
    rootSpan.log({
      name: 'llm_response',
      output: {
        text: result.text,
        toolCalls: result.toolCalls,
      },
      metadata: {
        usage: result.usage,
      },
    })

    // Execute tool calls with logging
    for (const toolCall of toolCalls) {
      await rootSpan.traced(async (toolSpan) => {
        toolSpan.log({
          name: `tool_${toolCall.toolName}`,
          input: toolCall.args,
        })

        try {
          const toolResult = await executeTool(toolCall)
          toolSpan.log({ output: { success: true, result: toolResult } })
        } catch (error) {
          toolSpan.log({ output: { success: false, error: error.message } })
          throw error
        }
      })
    }

    // Log final result
    rootSpan.log({
      name: 'agent_complete',
      output: { success: true, planCreated, planFinalized },
    })

    return { success: true, planCreated: planCreated && planFinalized }
  })
}
```

## Best Practices

### Always Log in Production

Use loggers (not experiments) for all production agent calls. Logging should be non-blocking and not affect agent performance.

### Include Relevant Metadata

Always include:
- `farmExternalId` or `farmId`
- `userId` (if available)
- `trigger` type (morning_brief, observation_refresh, etc.)
- `promptVersion` for prompt changes
- `contextVersion` for data schema changes

### Log Errors with Full Context

When logging errors, include:
- Error message and stack trace
- Input parameters that caused the error
- Relevant metadata (farm ID, user ID, etc.)

```typescript
catch (error) {
  span.log({
    output: {
      error: error.message,
      stack: error.stack,
    },
    metadata: {
      farmExternalId,
      inputArgs: args,
    },
  })
  throw error
}
```

### Use Spans for Hierarchical Structure

Create parent-child relationships:
- Root span: Agent invocation
- Child span: Prompt construction
- Child span: LLM call
  - Child span: Tool call 1
  - Child span: Tool call 2

This creates a trace tree in Braintrust UI for easy navigation.

### Flush Logs Before Process Exit

In long-running processes, ensure logs are flushed:

```typescript
// At process exit or end of request
await logger.flush()
```

### Don't Log Sensitive Data

Avoid logging:
- API keys or secrets
- Personal identifiable information (PII)
- Sensitive farm data (if required by compliance)

Use masking if needed:

```typescript
span.log({
  input: {
    apiKey: maskValue(apiKey), // Mask sensitive values
  },
})
```

## Common Patterns

### Agent Gateway Pattern

Initialize logger at gateway entry point, log each agent invocation:

```typescript
// app/convex/grazingAgentGateway.ts
import { initLogger } from 'braintrust'

const logger = initLogger({ project: 'grazing-agent' })

export const agentGateway = action({
  handler: async (ctx, args) => {
    await logger.traced(async (span) => {
      span.log({
        name: 'agent_gateway',
        input: {
          trigger: args.trigger,
          farmId: args.farmId.toString(),
          farmExternalId: args.farmExternalId,
        },
      })

      // Fetch context
      const context = await ctx.runQuery(...)

      // Call agent
      const result = await runGrazingAgent(...)

      span.log({
        output: { success: result.success },
      })

      return result
    })
  },
})
```

### Tool Execution Pattern

Each tool function should create a span:

```typescript
export const myTool = mutation({
  handler: async (ctx, args) => {
    return await logger.traced(async (span) => {
      span.log({ name: 'myTool', input: args })
      
      const result = await executeToolLogic(args)
      
      span.log({ output: result })
      return result
    })
  },
})
```

### Prompt Versioning

Track prompt changes in metadata:

```typescript
const PROMPT_VERSION = 'v1.2.0' // Update when prompt changes

await logger.log({
  input: { systemPrompt, userPrompt },
  metadata: {
    promptVersion: PROMPT_VERSION,
    // ... other metadata
  },
})
```

### Error Handling

Always log errors with context:

```typescript
try {
  const result = await riskyOperation()
  span.log({ output: { success: true, result } })
} catch (error) {
  span.log({
    output: {
      success: false,
      error: error.message,
      stack: error.stack,
    },
    metadata: {
      operation: 'riskyOperation',
      input: args,
    },
  })
  throw error
}
```

## Troubleshooting

### No Traces Appearing in Braintrust

1. **Check API Key**: Verify `BRAINTRUST_API_KEY` is set correctly
2. **Verify Initialization**: Ensure `initLogger()` is called before logging
3. **Check Network**: Ensure server can reach Braintrust API
4. **Verify Project Name**: Check that project name matches in Braintrust UI

### Missing Spans

- Ensure proper parent-child relationships using `span.traced()`
- Don't create new logger instances for each span - reuse the same logger
- Check that spans are created within the traced callback

### Performance Issues

- Use async logging (Braintrust SDK handles this automatically)
- Don't block on log writes - they're async by default
- Batch logs when possible (Braintrust handles batching internally)

### Logs Not Showing Immediately

- Braintrust batches logs for efficiency
- Logs may take a few seconds to appear in UI
- Use `await logger.flush()` to force immediate flush if needed

## References

- **Braintrust Documentation**: https://www.braintrust.dev/docs
- **SDK Reference**: https://github.com/braintrustdata/braintrust-sdk
- **Current Stub**: `app/lib/braintrust.ts` (to be replaced)
- **Agent Implementation**: `app/convex/grazingAgentDirect.ts`
- **Tool Implementation**: `app/convex/grazingAgentTools.ts`
- **Gateway**: `app/convex/grazingAgentGateway.ts`
