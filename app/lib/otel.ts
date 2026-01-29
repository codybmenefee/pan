"use node"

/**
 * OTel initialization module - STUB
 *
 * The full OTel integration with @braintrust/otel has native dependency issues
 * with Convex's bundler. For now, we use direct HTTP API calls in braintrust.ts.
 *
 * This module provides no-op stubs to avoid breaking the codebase.
 * The AI SDK's experimental_telemetry will be disabled until we find a solution.
 */

export async function initOTelOnce(): Promise<void> {
  console.log("[OTel] Stub - OTel disabled due to Convex bundler constraints")
}

export function getTracer(_name = "grazing-agent"): any {
  // Return undefined - experimental_telemetry will be disabled
  return undefined
}

export async function flushOTel(): Promise<void> {
  // No-op
}
