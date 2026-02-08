/**
 * React hooks and utilities for feature requests.
 */

import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export type FeatureCategory =
  | 'grazing'
  | 'map'
  | 'satellite'
  | 'livestock'
  | 'analytics'
  | 'integrations'
  | 'mobile'
  | 'other'

export interface FeatureContext {
  url: string
  userAgent: string
  screenSize?: string
  timestamp: string
}

export interface FeatureRequestInput {
  userExternalId?: string
  farmExternalId?: string
  title: string
  description: string
  category: FeatureCategory
  context: FeatureContext
}

/**
 * Capture the current context for a feature request.
 */
export function captureFeatureContext(): FeatureContext {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Hook to submit a feature request.
 */
export function useSubmitFeatureRequest() {
  return useAction(api.featureRequestsAction.submit)
}

export const FEATURE_CATEGORY_OPTIONS: { value: FeatureCategory; label: string }[] = [
  { value: 'grazing', label: 'Grazing Recommendations' },
  { value: 'map', label: 'Map & Pastures' },
  { value: 'satellite', label: 'Satellite Imagery' },
  { value: 'livestock', label: 'Livestock Management' },
  { value: 'analytics', label: 'Analytics & Reports' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'mobile', label: 'Mobile Experience' },
  { value: 'other', label: 'Other' },
]
