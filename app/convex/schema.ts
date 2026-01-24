import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const polygonFeature = v.object({
  type: v.literal('Feature'),
  properties: v.optional(v.any()),
  geometry: v.object({
    type: v.literal('Polygon'),
    coordinates: v.array(v.array(v.array(v.number()))),
  }),
})

const rawPolygon = v.object({
  type: v.literal('Polygon'),
  coordinates: v.array(v.array(v.array(v.number()))),
})

const paddockStatus = v.union(
  v.literal('ready'),
  v.literal('almost_ready'),
  v.literal('recovering'),
  v.literal('grazed'),
)

export default defineSchema({
  farms: defineTable({
    externalId: v.string(),  // Will store Clerk org ID (org_xxx) for new farms
    legacyExternalId: v.optional(v.string()),  // For migration: maps old farm-1 style IDs
    clerkOrgSlug: v.optional(v.string()),  // Clerk org slug
    name: v.string(),
    location: v.string(),
    totalArea: v.number(),
    paddockCount: v.number(),
    coordinates: v.array(v.number()),
    geometry: polygonFeature,
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_externalId', ['externalId'])
    .index('by_legacyExternalId', ['legacyExternalId']),
  paddocks: defineTable({
    farmId: v.id('farms'),
    externalId: v.string(),
    name: v.string(),
    status: paddockStatus,
    ndvi: v.number(),
    restDays: v.number(),
    area: v.number(),
    waterAccess: v.string(),
    lastGrazed: v.string(),
    geometry: polygonFeature,
    overrideMinNDVIThreshold: v.optional(v.number()),
    overrideMinRestPeriodDays: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_farm', ['farmId'])
    .index('by_farm_externalId', ['farmId', 'externalId']),
  users: defineTable({
    externalId: v.string(),                    // Clerk user ID
    activeFarmExternalId: v.optional(v.string()), // Currently selected farm (Clerk org ID)
    farmExternalId: v.string(),                // DEPRECATED: keep for migration, remove later
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_externalId', ['externalId']),
  farmSettings: defineTable({
    farmExternalId: v.string(),
    subscriptionTier: v.optional(v.union(v.literal('free'), v.literal('premium'))),
    planetScopeApiKey: v.optional(v.string()),
    minNDVIThreshold: v.number(),
    minRestPeriod: v.number(),
    cloudCoverTolerance: v.number(),
    dailyBriefTime: v.string(),
    emailNotifications: v.boolean(),
    pushNotifications: v.boolean(),
    virtualFenceProvider: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })    .index('by_farm', ['farmExternalId']),
  observations: defineTable({
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
    date: v.string(),
    ndviMean: v.number(),
    ndviMin: v.number(),
    ndviMax: v.number(),
    ndviStd: v.number(),
    eviMean: v.number(),
    ndwiMean: v.number(),
    cloudFreePct: v.number(),
    pixelCount: v.number(),
    isValid: v.boolean(),
    sourceProvider: v.string(),
    resolutionMeters: v.number(),
    createdAt: v.string(),
  })
    .index('by_paddock_date', ['paddockExternalId', 'date'])
    .index('by_farm_date', ['farmExternalId', 'date'])
    .index('by_farm', ['farmExternalId']),
  grazingEvents: defineTable({
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
    date: v.string(),
    durationDays: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_paddock', ['paddockExternalId'])
    .index('by_farm', ['farmExternalId']),
  plans: defineTable({
    farmExternalId: v.string(),
    date: v.string(),
    primaryPaddockExternalId: v.optional(v.string()),
    alternativePaddockExternalIds: v.optional(v.array(v.string())),
    confidenceScore: v.number(),
    reasoning: v.array(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('executed'),
      v.literal('modified')
    ),
    approvedAt: v.optional(v.string()),
    approvedBy: v.optional(v.string()),
    feedback: v.optional(v.string()),
    sectionGeometry: v.optional(rawPolygon),
    sectionAreaHectares: v.optional(v.number()),
    sectionCentroid: v.optional(v.array(v.number())),
    sectionAvgNdvi: v.optional(v.number()),
    sectionJustification: v.optional(v.string()),
    paddockGrazedPercentage: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_farm_date', ['farmExternalId', 'date'])
    .index('by_farm', ['farmExternalId']),
  farmerObservations: defineTable({
    farmId: v.id('farms'),
    authorId: v.string(),
    level: v.union(v.literal('farm'), v.literal('paddock'), v.literal('zone')),
    targetId: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    createdAt: v.string(),
  })
    .index('by_farm', ['farmId'])
    .index('by_target', ['level', 'targetId']),
  zones: defineTable({
    paddockId: v.id('paddocks'),
    name: v.string(),
    type: v.union(
      v.literal('water'),
      v.literal('shade'),
      v.literal('feeding'),
      v.literal('mineral'),
      v.literal('other')
    ),
    geometry: polygonFeature,
    metadata: v.optional(v.any()),
  }).index('by_paddock', ['paddockId']),
  weatherHistory: defineTable({
    farmId: v.id('farms'),
    date: v.string(),
    temperature: v.number(),
    precipitation: v.number(),
    humidity: v.optional(v.number()),
    windSpeed: v.optional(v.number()),
    windDirection: v.optional(v.number()),
    createdAt: v.string(),
  }).index('by_farm_date', ['farmId', 'date']),
})
