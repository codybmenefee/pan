/**
 * Braintrust integration for agent trace logging via HTTP API.
 *
 * Uses direct HTTP calls to Braintrust API instead of SDK
 * to avoid bundler issues with native dependencies in Convex.
 *
 * API Docs: https://www.braintrust.dev/docs/deploy/api
 */

"use node"

// Declare process for Node.js environment (used by Convex actions)
declare const process: { env: Record<string, string | undefined> }

const BRAINTRUST_API_URL = "https://api.braintrust.dev"
const BRAINTRUST_PROJECT_NAME = process.env.BRAINTRUST_PROJECT_NAME || 'grazing-agent'

// Store for pending log events to be flushed
let pendingEvents: any[] = []
let projectId: string | null = null

// Current root span ID for establishing parent-child relationships
let currentRootSpanId: string | null = null

/**
 * Generate a unique span ID
 */
function generateSpanId(): string {
  return `span-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get or create the project ID from name
 */
async function getProjectId(apiKey: string): Promise<string | null> {
  if (projectId) return projectId

  try {
    const response = await fetch(`${BRAINTRUST_API_URL}/v1/project`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[Braintrust] Failed to list projects:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    const project = data.objects?.find((p: any) => p.name === BRAINTRUST_PROJECT_NAME)

    if (project) {
      projectId = project.id
      console.log('[Braintrust] Found project:', { name: BRAINTRUST_PROJECT_NAME, id: projectId })
      return projectId
    }

    // Create project if not found
    console.log('[Braintrust] Project not found, creating:', BRAINTRUST_PROJECT_NAME)
    const createResponse = await fetch(`${BRAINTRUST_API_URL}/v1/project`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: BRAINTRUST_PROJECT_NAME }),
    })

    if (!createResponse.ok) {
      console.error('[Braintrust] Failed to create project:', createResponse.status, await createResponse.text())
      return null
    }

    const newProject = await createResponse.json()
    projectId = newProject.id
    console.log('[Braintrust] Created project:', { name: BRAINTRUST_PROJECT_NAME, id: projectId })
    return projectId

  } catch (error) {
    console.error('[Braintrust] Error getting project ID:', error)
    return null
  }
}

/**
 * Insert log events to Braintrust
 */
async function insertLogEvents(apiKey: string, events: any[]): Promise<boolean> {
  const pid = await getProjectId(apiKey)
  if (!pid) {
    console.error('[Braintrust] Cannot insert events: no project ID')
    return false
  }

  try {
    console.log('[Braintrust] Inserting', events.length, 'events to project', pid)

    const response = await fetch(`${BRAINTRUST_API_URL}/v1/project_logs/${pid}/insert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Braintrust] Failed to insert events:', response.status, errorText)
      return false
    }

    const result = await response.json()
    console.log('[Braintrust] Events inserted successfully:', result)
    return true

  } catch (error) {
    console.error('[Braintrust] Error inserting events:', error)
    return false
  }
}

/**
 * Create a span object that mimics the Braintrust SDK interface.
 * Accumulates data from multiple log() calls and flushes as a single event.
 */
function createSpan(_apiKey: string, spanId: string, spanData: any): {
  log: (data: any) => void
  end: () => void
  id: string
} {
  // Accumulate all logged data
  let accumulatedData: any = {}

  return {
    id: spanId,
    log: (data: any) => {
      // Deep merge the data (simple version - merge top-level keys)
      for (const key of Object.keys(data)) {
        if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key]) && accumulatedData[key]) {
          // Merge objects
          accumulatedData[key] = { ...accumulatedData[key], ...data[key] }
        } else {
          accumulatedData[key] = data[key]
        }
      }
    },
    end: () => {
      // Push single event with all accumulated data
      const event = {
        span_id: spanId,
        ...spanData,
        ...accumulatedData,
      }
      pendingEvents.push(event)
    },
  }
}

/**
 * Get or initialize the Braintrust logger.
 */
export function getLogger(): {
  traced: <T>(fn: (span: { log: (data: any) => void }) => Promise<T>, options?: any) => Promise<T>
} {
  const apiKey = process.env.BRAINTRUST_API_KEY

  if (!apiKey) {
    console.warn('[Braintrust] BRAINTRUST_API_KEY not set - returning no-op logger')
    return {
      traced: async (fn) => {
        const noopSpan = { log: () => {} }
        return fn(noopSpan)
      },
    }
  }

  return {
    traced: async <T>(fn: (span: { log: (data: any) => void }) => Promise<T>, options?: any): Promise<T> => {
      const spanId = generateSpanId()
      const startTime = Date.now()

      // Set as root span if none exists
      const isRoot = !currentRootSpanId
      if (isRoot) {
        currentRootSpanId = spanId
      }

      const spanData = {
        span_id: spanId,
        span_name: options?.name || 'agent-gateway',
        created: new Date().toISOString(),
        span_attributes: { type: 'task' },
        metadata: { ...options?.metadata },
        ...(isRoot ? { root_span_id: spanId } : {
          root_span_id: currentRootSpanId,
          span_parents: [currentRootSpanId],
        }),
      }

      const span = createSpan(apiKey, spanId, spanData)

      try {
        const result = await fn(span)
        span.log({ metrics: { duration_ms: Date.now() - startTime } })
        return result
      } catch (error) {
        span.log({
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      } finally {
        // Flush the accumulated span data as a single event
        span.end()
        if (isRoot) {
          currentRootSpanId = null
        }
      }
    },
  }
}

/**
 * Start a trace and return the root span ID for child spans
 */
export function startTrace(name: string, metadata?: Record<string, any>): string {
  const spanId = generateSpanId()
  currentRootSpanId = spanId

  const event = {
    span_id: spanId,
    span_name: name,
    created: new Date().toISOString(),
    root_span_id: spanId,
    span_attributes: { type: 'task' },
    metadata: metadata || {},
  }

  pendingEvents.push(event)
  console.log('[Braintrust] Started trace:', { spanId, name })
  return spanId
}

/**
 * Log an LLM call as a child span
 */
export function logLLMCall(data: {
  parentSpanId?: string
  model: string
  prompt: string
  systemPrompt?: string
  response: string
  toolCalls?: any[]
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  durationMs?: number
  metadata?: Record<string, any>
}): string {
  const spanId = generateSpanId()
  const rootSpanId = data.parentSpanId || currentRootSpanId || spanId

  console.log('[Braintrust] Logging LLM call:', {
    spanId,
    parentSpanId: data.parentSpanId,
    rootSpanId,
    model: data.model,
    promptLength: data.prompt.length,
    responseLength: data.response.length,
    toolCallsCount: data.toolCalls?.length || 0,
  })

  const event = {
    span_id: spanId,
    span_name: `LLM: ${data.model}`,
    created: new Date().toISOString(),
    root_span_id: rootSpanId,
    span_parents: data.parentSpanId ? [data.parentSpanId] : (currentRootSpanId ? [currentRootSpanId] : undefined),
    span_attributes: {
      type: 'llm',
      name: data.model,
    },
    input: {
      messages: [
        ...(data.systemPrompt ? [{ role: 'system', content: data.systemPrompt }] : []),
        { role: 'user', content: data.prompt },
      ],
    },
    output: {
      content: data.response,
      // Include tool call names for quick reference
      tool_calls: data.toolCalls?.map(tc => ({
        name: tc.toolName,
        // Full arguments are in separate tool spans
      })),
    },
    metadata: {
      model: data.model,
      ...data.metadata,
    },
    metrics: {
      ...(data.durationMs && { duration_ms: data.durationMs }),
      ...(data.usage?.promptTokens && { prompt_tokens: data.usage.promptTokens }),
      ...(data.usage?.completionTokens && { completion_tokens: data.usage.completionTokens }),
      ...(data.usage?.totalTokens && { total_tokens: data.usage.totalTokens }),
    },
  }

  pendingEvents.push(event)
  return spanId
}

/**
 * Log a tool call as a child span with full input/output
 */
export function logToolCall(data: {
  parentSpanId?: string
  toolName: string
  input: any
  output?: any
  error?: string
  durationMs?: number
}): string {
  const spanId = generateSpanId()
  const rootSpanId = currentRootSpanId || data.parentSpanId || spanId

  console.log('[Braintrust] Logging tool call:', {
    spanId,
    toolName: data.toolName,
    hasInput: !!data.input,
    hasOutput: !!data.output,
    hasError: !!data.error,
  })

  const event = {
    span_id: spanId,
    span_name: `Tool: ${data.toolName}`,
    created: new Date().toISOString(),
    root_span_id: rootSpanId,
    span_parents: data.parentSpanId ? [data.parentSpanId] : (currentRootSpanId ? [currentRootSpanId] : undefined),
    span_attributes: {
      type: 'tool',
      name: data.toolName,
    },
    input: data.input,
    output: data.output,
    error: data.error,
    metrics: {
      ...(data.durationMs && { duration_ms: data.durationMs }),
    },
  }

  pendingEvents.push(event)
  return spanId
}

/**
 * Flush pending logs to Braintrust.
 */
export async function flushLogs(): Promise<void> {
  const apiKey = process.env.BRAINTRUST_API_KEY

  if (!apiKey) {
    console.log('[Braintrust] No API key, skipping flush')
    return
  }

  if (pendingEvents.length === 0) {
    console.log('[Braintrust] No pending events to flush')
    return
  }

  console.log('[Braintrust] Flushing', pendingEvents.length, 'pending events...')

  const eventsToSend = [...pendingEvents]
  pendingEvents = []

  const success = await insertLogEvents(apiKey, eventsToSend)

  if (!success) {
    console.error('[Braintrust] Flush failed, events lost:', eventsToSend.length)
  }
}

export { getLogger as logger }
