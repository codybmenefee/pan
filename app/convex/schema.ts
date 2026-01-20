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

const paddockStatus = v.union(
  v.literal('ready'),
  v.literal('almost_ready'),
  v.literal('recovering'),
  v.literal('grazed'),
)

export default defineSchema({
  farms: defineTable({
    externalId: v.string(),
    name: v.string(),
    location: v.string(),
    totalArea: v.number(),
    paddockCount: v.number(),
    coordinates: v.array(v.number()),
    geometry: polygonFeature,
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_externalId', ['externalId']),
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
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_farm', ['farmId'])
    .index('by_farm_externalId', ['farmId', 'externalId']),
  users: defineTable({
    externalId: v.string(),
    farmExternalId: v.string(),
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
  }).index('by_farm', ['farmExternalId']),
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
})
