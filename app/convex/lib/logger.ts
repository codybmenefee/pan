/**
 * Convex Backend Logger
 *
 * Provides structured logging for Convex functions.
 * Debug logs are controlled by the CONVEX_DEBUG environment variable.
 *
 * In production, only warnings and errors are logged.
 * Set CONVEX_DEBUG=true in your Convex dashboard to enable debug logs.
 *
 * Usage:
 *   import { createLogger } from './lib/logger'
 *   const log = createLogger('grazingAgent')
 *   log('Processing request', { farmId })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  (message: string, data?: Record<string, unknown>): void
  debug: (message: string, data?: Record<string, unknown>) => void
  info: (message: string, data?: Record<string, unknown>) => void
  warn: (message: string, data?: Record<string, unknown>) => void
  error: (message: string, data?: Record<string, unknown>) => void
}

// Check if debug logging is enabled
// In Convex, environment variables are accessed via process.env
// Note: Debug logging is disabled by default; set CONVEX_DEBUG=true in dashboard
function isDebugEnabled(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).process?.env?.CONVEX_DEBUG === 'true'
  } catch {
    return false
  }
}

function formatLog(namespace: string, _level: LogLevel, message: string, data?: Record<string, unknown>): string {
  const prefix = `[${namespace}]`
  if (data && Object.keys(data).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(data)}`
  }
  return `${prefix} ${message}`
}

/**
 * Create a namespaced logger for Convex backend code.
 *
 * @param namespace - The namespace for this logger (e.g., 'grazingAgent', 'ndviGrid')
 * @returns A logger function with level-specific methods
 */
export function createLogger(namespace: string): Logger {
  const debugEnabled = isDebugEnabled()

  const log = (message: string, data?: Record<string, unknown>): void => {
    if (!debugEnabled) return
    console.log(formatLog(namespace, 'debug', message, data))
  }

  log.debug = (message: string, data?: Record<string, unknown>): void => {
    if (!debugEnabled) return
    console.log(formatLog(namespace, 'debug', message, data))
  }

  log.info = (message: string, data?: Record<string, unknown>): void => {
    if (!debugEnabled) return
    console.log(formatLog(namespace, 'info', message, data))
  }

  log.warn = (message: string, data?: Record<string, unknown>): void => {
    // Warnings always log
    console.warn(formatLog(namespace, 'warn', message, data))
  }

  log.error = (message: string, data?: Record<string, unknown>): void => {
    // Errors always log
    console.error(formatLog(namespace, 'error', message, data))
  }

  return log
}
