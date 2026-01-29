/**
 * Frontend Debug Logger
 *
 * Provides namespaced logging that can be enabled/disabled via:
 * - localStorage.setItem('debug', 'openpasture:*') - enable all
 * - localStorage.setItem('debug', 'openpasture:map') - enable specific namespace
 * - localStorage.setItem('debug', '') - disable all
 *
 * Usage:
 *   import { createLogger } from '@/lib/logger'
 *   const log = createLogger('map')
 *   log('Something happened', { data })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  (message: string, data?: unknown): void
  debug: (message: string, data?: unknown) => void
  info: (message: string, data?: unknown) => void
  warn: (message: string, data?: unknown) => void
  error: (message: string, data?: unknown) => void
}

const NAMESPACE_PREFIX = 'openpasture'

function isDebugEnabled(namespace: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const debugPattern = localStorage.getItem('debug') || ''
    if (!debugPattern) return false

    // Support patterns like 'openpasture:*' or 'openpasture:map,openpasture:api'
    const patterns = debugPattern.split(',').map(p => p.trim())

    for (const pattern of patterns) {
      if (pattern === '*' || pattern === `${NAMESPACE_PREFIX}:*`) {
        return true
      }
      if (pattern === `${NAMESPACE_PREFIX}:${namespace}`) {
        return true
      }
      // Support wildcards like 'openpasture:map*'
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1)
        if (`${NAMESPACE_PREFIX}:${namespace}`.startsWith(prefix)) {
          return true
        }
      }
    }
  } catch {
    // localStorage not available
  }

  return false
}

function formatMessage(namespace: string, _level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
  return `[${timestamp}] [${NAMESPACE_PREFIX}:${namespace}] ${message}`
}

/**
 * Create a namespaced logger for frontend code.
 *
 * @param namespace - The namespace for this logger (e.g., 'map', 'api', 'agent')
 * @returns A logger function with level-specific methods
 */
export function createLogger(namespace: string): Logger {
  const log = (message: string, data?: unknown): void => {
    if (!isDebugEnabled(namespace)) return

    const formatted = formatMessage(namespace, 'debug', message)
    if (data !== undefined) {
      console.log(formatted, data)
    } else {
      console.log(formatted)
    }
  }

  log.debug = (message: string, data?: unknown): void => {
    if (!isDebugEnabled(namespace)) return

    const formatted = formatMessage(namespace, 'debug', message)
    if (data !== undefined) {
      console.debug(formatted, data)
    } else {
      console.debug(formatted)
    }
  }

  log.info = (message: string, data?: unknown): void => {
    if (!isDebugEnabled(namespace)) return

    const formatted = formatMessage(namespace, 'info', message)
    if (data !== undefined) {
      console.info(formatted, data)
    } else {
      console.info(formatted)
    }
  }

  log.warn = (message: string, data?: unknown): void => {
    // Warnings always log (regardless of debug setting)
    const formatted = formatMessage(namespace, 'warn', message)
    if (data !== undefined) {
      console.warn(formatted, data)
    } else {
      console.warn(formatted)
    }
  }

  log.error = (message: string, data?: unknown): void => {
    // Errors always log (regardless of debug setting)
    const formatted = formatMessage(namespace, 'error', message)
    if (data !== undefined) {
      console.error(formatted, data)
    } else {
      console.error(formatted)
    }
  }

  return log
}

// Pre-configured loggers for common namespaces
export const mapLogger = createLogger('map')
export const apiLogger = createLogger('api')
export const agentLogger = createLogger('agent')
