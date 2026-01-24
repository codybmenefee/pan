"use node"

// OTel initialization module for Convex Node.js actions
// Uses computed require to prevent bundler static analysis of native modules

let initialized = false
let cachedTracer: any = null

// Helper to dynamically require modules without bundler interference
function dynamicRequire(moduleName: string): any {
  // Use Function constructor to create a require that bundler can't analyze
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("moduleName", "return require(moduleName)")(moduleName)
}

export async function initOTelOnce(): Promise<void> {
  if (initialized) return
  initialized = true

  const apiKey = process.env.BRAINTRUST_API_KEY
  if (!apiKey) {
    console.warn("[OTel] BRAINTRUST_API_KEY not set - telemetry will use noop tracer")
    return
  }

  try {
    const { BasicTracerProvider } = dynamicRequire("@opentelemetry/sdk-trace-base")
    const { trace } = dynamicRequire("@opentelemetry/api")
    const { BraintrustSpanProcessor, setupOtelCompat } = dynamicRequire("@braintrust/otel")

    // Enable bidirectional Braintrust <-> OTel context propagation
    setupOtelCompat()

    const provider = new BasicTracerProvider()
    provider.addSpanProcessor(new BraintrustSpanProcessor({
      apiKey,
      parent: "project_name:grazing-agent",
      filterAISpans: true,
    }))

    trace.setGlobalTracerProvider(provider)
    cachedTracer = trace.getTracer("grazing-agent")
    console.log("[OTel] Initialized with BraintrustSpanProcessor")
  } catch (error) {
    console.error("[OTel] Failed to initialize:", error)
  }
}

export function getTracer(name = "grazing-agent"): any {
  if (cachedTracer) {
    return cachedTracer
  }

  try {
    const { trace } = dynamicRequire("@opentelemetry/api")
    return trace.getTracer(name)
  } catch {
    return undefined
  }
}
