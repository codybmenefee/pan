/**
 * Agent tool definitions for the grazing agent gateway.
 *
 * These tools allow the agent to fetch data, perform actions, and
 * access metadata about available capabilities.
 */

import { z } from 'zod'

/**
 * Data fetch tools - allow agent to retrieve information
 */
export const dataFetchTools = {
  getFarmGeometry: {
    name: 'getFarmGeometry',
    description: 'Get the farm boundary geometry and basic farm information',
    parameters: z.object({
      farmId: z.string(),
    }),
  },

  getPaddockStatus: {
    name: 'getPaddockStatus',
    description: 'Get current status and metrics for a specific paddock',
    parameters: z.object({
      paddockId: z.string(),
    }),
  },

  getRecentObservations: {
    name: 'getRecentObservations',
    description: 'Get recent satellite observations for a farm or paddock',
    parameters: z.object({
      farmId: z.string(),
      paddockId: z.string().optional(),
      days: z.number().optional(),
    }),
  },

  getFarmerObservations: {
    name: 'getFarmerObservations',
    description: 'Get recent farmer observations for a farm, paddock, or zone',
    parameters: z.object({
      farmId: z.string(),
      level: z.enum(['farm', 'paddock', 'zone']).optional(),
      targetId: z.string().optional(),
      limit: z.number().optional(),
    }),
  },
}

/**
 * Action tools - allow agent to modify state
 */
export const actionTools = {
  createPlan: {
    name: 'createPlan',
    description: 'Create a new grazing plan with recommended paddock and section',
    parameters: z.object({
      farmId: z.string(),
      date: z.string(),
      primaryPaddockId: z.string(),
      alternativePaddockIds: z.array(z.string()).optional(),
      confidenceScore: z.number().min(0).max(1),
      reasoning: z.array(z.string()),
      sectionGeometry: z.any().optional(), // GeoJSON Polygon
      sectionAreaHectares: z.number().optional(),
      sectionCentroid: z.array(z.number()).optional(),
      sectionAvgNdvi: z.number().optional(),
      sectionJustification: z.string().optional(),
      paddockGrazedPercentage: z.number().optional(),
    }),
  },

  updatePaddockSettings: {
    name: 'updatePaddockSettings',
    description: 'Update paddock-specific settings overrides',
    parameters: z.object({
      paddockId: z.string(),
      overrideMinNDVIThreshold: z.number().optional(),
      overrideMinRestPeriodDays: z.number().optional(),
    }),
  },

  requestVirtualFence: {
    name: 'requestVirtualFence',
    description: 'Request virtual fence geometry for a grazing section',
    parameters: z.object({
      planId: z.string(),
      sectionGeometry: z.any(), // GeoJSON Polygon
      provider: z.string().optional(),
    }),
  },
}

/**
 * Meta tools - provide information about agent capabilities
 */
export const metaTools = {
  getAvailableTools: {
    name: 'getAvailableTools',
    description: 'List all available tools and their descriptions',
    parameters: z.object({}),
  },

  explainReasoning: {
    name: 'explainReasoning',
    description: 'Provide detailed explanation of the agent\'s reasoning process',
    parameters: z.object({
      question: z.string().optional(),
    }),
  },
}

/**
 * All tools combined
 */
export const allTools = {
  ...dataFetchTools,
  ...actionTools,
  ...metaTools,
}

/**
 * Tool schemas for AI SDK
 */
export function getToolSchemas() {
  return Object.values(allTools).map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }))
}
