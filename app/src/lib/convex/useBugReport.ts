/**
 * React hooks and utilities for bug reporting.
 */

import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export type BugCategory =
  | 'ui_visual'
  | 'functionality'
  | 'performance'
  | 'data'
  | 'map'
  | 'satellite'
  | 'ai_recommendations'
  | 'other'

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface BugContext {
  url: string
  userAgent: string
  screenSize?: string
  timestamp: string
}

export interface BugReportInput {
  userExternalId?: string
  farmExternalId?: string
  title: string
  description: string
  category: BugCategory
  severity: BugSeverity
  stepsToReproduce?: string
  context: BugContext
}

/**
 * Capture the current context for a bug report.
 */
export function captureBugContext(): BugContext {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Hook to submit a bug report.
 */
export function useSubmitBugReport() {
  return useAction(api.bugReportsAction.submit)
}

export const CATEGORY_OPTIONS: { value: BugCategory; label: string }[] = [
  { value: 'ui_visual', label: 'UI/Visual' },
  { value: 'functionality', label: 'Functionality' },
  { value: 'performance', label: 'Performance' },
  { value: 'data', label: 'Data' },
  { value: 'map', label: 'Map' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'ai_recommendations', label: 'AI Recommendations' },
  { value: 'other', label: 'Other' },
]

export const SEVERITY_OPTIONS: { value: BugSeverity; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Minor issue, workaround exists' },
  { value: 'medium', label: 'Medium', description: 'Noticeable impact on usability' },
  { value: 'high', label: 'High', description: 'Significant issue affecting workflow' },
  { value: 'critical', label: 'Critical', description: 'System unusable or data loss' },
]
