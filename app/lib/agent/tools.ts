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

  getPastureStatus: {
    name: 'getPastureStatus',
    description: 'Get current status and metrics for a specific pasture',
    parameters: z.object({
      pastureId: z.string(),
    }),
  },

  getRecentObservations: {
    name: 'getRecentObservations',
    description: 'Get recent satellite observations for a farm or pasture',
    parameters: z.object({
      farmId: z.string(),
      pastureId: z.string().optional(),
      days: z.number().optional(),
    }),
  },

  getFarmerObservations: {
    name: 'getFarmerObservations',
    description: 'Get recent farmer observations for a farm, pasture, or zone',
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
    description: 'Create a new grazing plan with recommended pasture and paddock',
    parameters: z.object({
      farmId: z.string(),
      date: z.string(),
      primaryPastureId: z.string(),
      alternativePastureIds: z.array(z.string()).optional(),
      confidenceScore: z.number().min(0).max(1),
      reasoning: z.array(z.string()),
      paddockGeometry: z.any().optional(), // GeoJSON Polygon
      paddockAreaHectares: z.number().optional(),
      paddockCentroid: z.array(z.number()).optional(),
      paddockAvgNdvi: z.number().optional(),
      paddockJustification: z.string().optional(),
      pastureGrazedPercentage: z.number().optional(),
    }),
  },

  updatePastureSettings: {
    name: 'updatePastureSettings',
    description: 'Update pasture-specific settings overrides',
    parameters: z.object({
      pastureId: z.string(),
      overrideMinNDVIThreshold: z.number().optional(),
      overrideMinRestPeriodDays: z.number().optional(),
    }),
  },

  requestVirtualFence: {
    name: 'requestVirtualFence',
    description: 'Request virtual fence geometry for a grazing paddock',
    parameters: z.object({
      planId: z.string(),
      paddockGeometry: z.any(), // GeoJSON Polygon
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
