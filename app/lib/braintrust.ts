/**
 * Braintrust integration for agent trace logging.
 *
 * Logs all agent interactions, prompts, tool calls, and responses
 * for observability and debugging.
 *
 * Uses Braintrust logger (not experiments) for production logging.
 * Project name: 'grazing-agent' (groups all agent-related traces in Braintrust UI)
 */

"use node"

// Helper to dynamically require modules without bundler interference
function dynamicRequire(moduleName: string): any {
  // Use Function constructor to create a require that bundler can't analyze
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("moduleName", "return require(moduleName)")(moduleName)
}

// Initialize logger once, reuse across requests
// Use logger (not experiment) for production observability
let logger: any = null

/**
 * Get or initialize the Braintrust logger.
 * Uses project name 'grazing-agent' per skill guidelines.
 */
export function getLogger() {
  if (!logger) {
    // Check if API key is available (required for Braintrust to work)
    const apiKey = typeof process !== 'undefined' ? process.env.BRAINTRUST_API_KEY : null

    if (!apiKey) {
      console.warn('[Braintrust] BRAINTRUST_API_KEY not set - logging will be disabled')
    }

    try {
      const { initLogger } = dynamicRequire('braintrust')
      logger = initLogger({
        projectId: 'grazing-agent',
        // Optional: set experiment name for evaluation runs
        // experiment: 'morning-brief-v2'
      })
    } catch (error) {
      console.error('[Braintrust] Failed to initialize logger:', error)
      // Return a no-op logger that doesn't crash
      logger = {
        traced: async (fn: (span: any) => Promise<any>) => {
          const noopSpan = { log: () => {} }
          return fn(noopSpan)
        },
        log: () => {},
      }
    }
  }

  return logger
}

/**
 * Export logger instance for direct use in agent code.
 * Use logger.traced() to create spans, logger.log() for simple logs.
 */
export { getLogger as logger }
