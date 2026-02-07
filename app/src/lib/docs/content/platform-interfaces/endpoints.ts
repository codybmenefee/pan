import type { ArticleContent } from '../types'

export const endpoints: ArticleContent = {
  title: 'Endpoints',
  description:
    'Reference for available API endpoints. Queries for reading data, mutations for writing, and actions for complex operations.',
  sections: [
    {
      heading: 'Endpoint Categories',
      content: `The API is organized by domain:

**Plans** - Daily grazing recommendations
- Get today's plan
- Plan history
- Approval and feedback

**Paddocks** - Land management units
- List paddocks with status
- Individual paddock details
- Threshold overrides

**Observations** - Satellite data
- Current readings
- Historical time series
- Refresh triggers

**Settings** - Farm configuration
- Thresholds and defaults
- Notification preferences
- Integration settings`,
    },
    {
      heading: 'Key Queries',
      content: `**getAllPaddocksWithObservations**
Returns all paddocks for a farm with current status:`,
      codeExample: {
        language: 'typescript',
        code: `// Query: grazingAgentTools.getAllPaddocksWithObservations
const paddocks = await ctx.runQuery(
  api.grazingAgentTools.getAllPaddocksWithObservations,
  { farmExternalId: 'farm-1' }
)

// Returns: PaddockSummary[]
// {
//   externalId: string
//   name: string
//   area: number
//   ndviMean: number
//   restDays: number
//   lastGrazed: string | null
//   status: 'ready' | 'almost_ready' | 'recovering' | 'grazed'
//   geometry: GeoJSON
// }`,
      },
    },
    {
      heading: 'Paddock Data Query',
      content: `**getPaddockData**
Detailed data for the currently active paddock:`,
      codeExample: {
        language: 'typescript',
        code: `// Query: grazingAgentTools.getPaddockData
const paddock = await ctx.runQuery(
  api.grazingAgentTools.getPaddockData,
  { farmExternalId: 'farm-1' }
)

// Returns: PaddockData
// {
//   externalId: string
//   name: string
//   area: number
//   ndviMean: number
//   ndviStd: number
//   ndviTrend: 'increasing' | 'stable' | 'decreasing'
//   restDays: number
//   daysGrazed: number
//   totalPlanned: number
//   geometry: GeoJSON
//   latestObservation: { date, ndviMean, ndviStd, cloudFreePct } | null
// }`,
      },
    },
    {
      heading: 'Settings Query',
      content: `**getFarmSettings**
Farm-level configuration:`,
      codeExample: {
        language: 'typescript',
        code: `// Query: grazingAgentTools.getFarmSettings
const settings = await ctx.runQuery(
  api.grazingAgentTools.getFarmSettings,
  { farmExternalId: 'farm-1' }
)

// Returns:
// {
//   minNDVIThreshold: number    // Default: 0.40
//   minRestPeriod: number       // Default: 21 days
//   defaultSectionPct: number   // Default: 0.20 (20%)
// }`,
      },
    },
    {
      heading: 'Key Mutations',
      content: `**createPlanWithPaddock**
Creates or updates today's grazing plan:`,
      codeExample: {
        language: 'typescript',
        code: `// Mutation: grazingAgentTools.createPlanWithPaddock
await ctx.runMutation(
  api.grazingAgentTools.createPlanWithPaddock,
  {
    farmExternalId: 'farm-1',
    targetPaddockId: 'paddock-3',
    sectionGeometry: { type: 'Polygon', coordinates: [...] },
    sectionAreaHectares: 8.5,
    sectionCentroid: [lng, lat],
    sectionAvgNdvi: 0.45,
    sectionJustification: 'Section covers northeast area...',
    confidence: 0.75,
    reasoning: ['NDVI above threshold', 'Adequate rest days'],
  }
)`,
      },
    },
    {
      heading: 'Plan Finalization',
      content: `**finalizePlan**
Sets plan status to pending after creation:`,
      codeExample: {
        language: 'typescript',
        code: `// Mutation: grazingAgentTools.finalizePlan
await ctx.runMutation(
  api.grazingAgentTools.finalizePlan,
  { farmExternalId: 'farm-1' }
)`,
      },
    },
    {
      heading: 'Agent Gateway Action',
      content: `**agentGateway**
Primary entry point for AI-powered plan generation:`,
      codeExample: {
        language: 'typescript',
        code: `// Action: grazingAgentGateway.agentGateway
const result = await ctx.runAction(
  api.grazingAgentGateway.agentGateway,
  {
    trigger: 'morning_brief',
    farmId: farmId,           // Convex ID
    farmExternalId: 'farm-1',
    userId: 'user-123',
  }
)

// Returns:
// {
//   success: boolean
//   trigger: string
//   planId?: string
//   error?: string
//   message: string
// }`,
      },
    },
    {
      heading: 'Query Patterns and Indexing',
      content: `Queries use indexes for performance:`,
      codeExample: {
        language: 'typescript',
        code: `// Indexed queries are fast
const paddocks = await ctx.db
  .query('paddocks')
  .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
  .collect()

// Available indexes:
// paddocks: by_farm, by_farm_externalId
// observations: by_paddock_date, by_farm_date, by_farm
// plans: by_farm_date, by_farm
// grazingEvents: by_paddock, by_farm`,
      },
    },
    {
      heading: 'Error Handling',
      content: `API calls may fail for various reasons:

**Authentication errors:**
User not authenticated or lacks permission.

**Validation errors:**
Invalid input (missing required fields, out-of-range values).

**Not found:**
Requested resource doesn't exist.

**Conflict:**
Operation conflicts with current state (e.g., plan already exists for date).

Handle errors appropriately:`,
      codeExample: {
        language: 'typescript',
        code: `try {
  const result = await ctx.runMutation(api.plans.approvePlan, { planId })
} catch (error) {
  if (error.message.includes('not found')) {
    // Handle missing plan
  } else if (error.message.includes('already approved')) {
    // Handle duplicate approval
  } else {
    // Handle unexpected error
    throw error
  }
}`,
      },
    },
  ],
  relatedArticles: [
    '/docs/platform-interfaces/overview',
    '/docs/platform-interfaces/auth',
    '/docs/system-architecture/data-pipeline',
  ],
}
