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

const pointFeature = v.object({
  type: v.literal('Feature'),
  properties: v.optional(v.any()),
  geometry: v.object({
    type: v.literal('Point'),
    coordinates: v.array(v.number()), // [lng, lat]
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

const noGrazeZoneType = v.union(
  v.literal('environmental'),
  v.literal('hazard'),
  v.literal('infrastructure'),
  v.literal('protected'),
  v.literal('other'),
)

const waterSourceStatus = v.union(
  v.literal('active'),
  v.literal('seasonal'),
  v.literal('maintenance'),
  v.literal('dry'),
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
    mapPreferences: v.optional(v.object({
      showRGBSatellite: v.boolean(),
    })),
    // Imagery check tracking for smart scheduling
    lastImageryCheckAt: v.optional(v.string()),   // When we last checked for new imagery (ISO timestamp)
    lastNewImageryDate: v.optional(v.string()),   // Date of newest imagery found (YYYY-MM-DD)
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
  noGrazeZones: defineTable({
    farmId: v.id('farms'),
    name: v.string(),
    type: v.optional(noGrazeZoneType),
    area: v.optional(v.number()),
    description: v.optional(v.string()),
    geometry: polygonFeature,
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_farm', ['farmId']),
  waterSources: defineTable({
    farmId: v.id('farms'),
    name: v.string(),
    type: v.union(
      v.literal('trough'),
      v.literal('pond'),
      v.literal('dam'),
      v.literal('tank'),
      v.literal('stream'),
      v.literal('other')
    ),
    geometryType: v.union(v.literal('point'), v.literal('polygon')),
    geometry: v.union(pointFeature, polygonFeature),
    area: v.optional(v.number()),
    description: v.optional(v.string()),
    status: v.optional(waterSourceStatus),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_farm', ['farmId']),
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

  // Satellite image tiles stored in Cloudflare R2
  satelliteImageTiles: defineTable({
    farmId: v.id('farms'),
    captureDate: v.string(),
    provider: v.string(),  // 'sentinel2' | 'planet'
    tileType: v.union(
      v.literal('rgb'),
      v.literal('ndvi'),
      v.literal('evi'),
      v.literal('ndwi')
    ),
    r2Key: v.string(),     // Cloudflare R2 object key
    r2Url: v.string(),     // Public/signed URL
    bounds: v.object({
      west: v.number(),
      south: v.number(),
      east: v.number(),
      north: v.number(),
    }),
    cloudCoverPct: v.number(),
    resolutionMeters: v.number(),
    fileSizeBytes: v.number(),
    createdAt: v.string(),
    expiresAt: v.optional(v.string()),
  })
    .index('by_farm_date', ['farmId', 'captureDate'])
    .index('by_farm_type', ['farmId', 'tileType']),

  // Clerk Billing subscriptions
  subscriptions: defineTable({
    farmId: v.id('farms'),
    clerkSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    tier: v.union(
      v.literal('free'),
      v.literal('starter'),
      v.literal('professional'),
      v.literal('enterprise')
    ),
    acreageLimit: v.number(),
    rawImageryEnabled: v.boolean(),
    premiumProvidersEnabled: v.boolean(),
    retentionDays: v.number(),
    status: v.union(
      v.literal('active'),
      v.literal('past_due'),
      v.literal('canceled')
    ),
    currentPeriodEnd: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_farm', ['farmId'])
    .index('by_clerk_subscription', ['clerkSubscriptionId']),

  // Notifications for satellite data readiness and system alerts
  notifications: defineTable({
    farmExternalId: v.string(),
    type: v.union(
      v.literal('satellite_ready'),
      v.literal('satellite_failed'),
      v.literal('system')
    ),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.object({
      provider: v.optional(v.string()),
      captureDate: v.optional(v.string()),
    })),
    isRead: v.boolean(),
    createdAt: v.string(),
  })
    .index('by_farm', ['farmExternalId'])
    .index('by_farm_unread', ['farmExternalId', 'isRead']),

  // Track satellite fetch jobs for banner display
  satelliteFetchJobs: defineTable({
    farmExternalId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    provider: v.string(),
    triggeredBy: v.union(
      v.literal('boundary_update'),
      v.literal('scheduled'),
      v.literal('manual')
    ),
    priority: v.optional(v.number()),  // 1=boundary, 2=manual, 3=scheduled (lower = higher priority)
    startedAt: v.string(),
    completedAt: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index('by_farm', ['farmExternalId'])
    .index('by_farm_status', ['farmExternalId', 'status'])
    .index('by_status', ['status']),
})
