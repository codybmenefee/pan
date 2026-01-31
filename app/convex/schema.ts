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

const animalType = v.union(
  v.literal('cow'),
  v.literal('sheep'),
)

const livestockSettings = v.object({
  // Animal Unit factors (defaults: cow=1.0, calf=0.5, sheep=0.2, lamb=0.1)
  cowAU: v.number(),
  calfAU: v.number(),
  sheepAU: v.number(),
  lambAU: v.number(),
  // Daily dry matter consumption per AU (default: 12 kg)
  dailyDMPerAU: v.number(),
})

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
    // Demo farm tracking
    isDemoFarm: v.optional(v.boolean()),
    demoCreatedAt: v.optional(v.string()),  // ISO timestamp for cleanup
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_externalId', ['externalId'])
    .index('by_legacyExternalId', ['legacyExternalId'])
    .index('by_isDemoFarm', ['isDemoFarm']),
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
    // User-level subscription (Early Access paywall)
    subscriptionStatus: v.optional(v.union(
      v.literal('none'),
      v.literal('active'),
      v.literal('past_due'),
      v.literal('canceled')
    )),
    subscriptionPlanId: v.optional(v.string()),     // Clerk plan ID
    subscriptionId: v.optional(v.string()),         // Clerk subscription ID
    subscriptionCurrentPeriodEnd: v.optional(v.string()),
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
    rotationFrequency: v.optional(v.number()),
    dailyBriefTime: v.string(),
    emailNotifications: v.boolean(),
    pushNotifications: v.boolean(),
    virtualFenceProvider: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    mapPreferences: v.optional(v.object({
      showRGBSatellite: v.boolean(),
      showNDVIHeatmap: v.optional(v.boolean()),
    })),
    // Livestock settings for animal unit calculations
    livestockSettings: v.optional(livestockSettings),
    // Area unit preference (hectares or acres)
    areaUnit: v.optional(v.union(v.literal('hectares'), v.literal('acres'))),
    // Imagery check tracking for smart scheduling
    lastImageryCheckAt: v.optional(v.string()),   // When we last checked for new imagery (ISO timestamp)
    lastNewImageryDate: v.optional(v.string()),   // Date of newest imagery found (YYYY-MM-DD)
    createdAt: v.string(),
    updatedAt: v.string(),
  })    .index('by_farm', ['farmExternalId']),
  livestock: defineTable({
    farmId: v.id('farms'),
    animalType: animalType,
    adultCount: v.number(),               // Breeding cows or ewes
    offspringCount: v.number(),           // Calves or lambs
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_farm', ['farmId'])
    .index('by_farm_type', ['farmId', 'animalType']),
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
      v.literal('ndvi_heatmap'),
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
      // Actionable notification fields
      actionUrl: v.optional(v.string()),      // e.g., "/?editBoundary=true"
      actionLabel: v.optional(v.string()),    // e.g., "Edit Boundary"
      failureReason: v.optional(v.string()),  // e.g., "boundary_overlap"
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

  // Track section modifications with rationale for AI training/RAG retrieval
  sectionModifications: defineTable({
    planId: v.id('plans'),
    farmExternalId: v.string(),
    paddockExternalId: v.string(),
    originalGeometry: rawPolygon,
    modifiedGeometry: rawPolygon,
    originalAreaHectares: v.number(),
    modifiedAreaHectares: v.number(),
    rationale: v.optional(v.string()),           // Free-form explanation
    quickReasons: v.optional(v.array(v.string())), // Selected preset reasons
    modifiedAt: v.string(),
    modifiedBy: v.optional(v.string()),
  })
    .index('by_farm', ['farmExternalId'])
    .index('by_plan', ['planId']),

  // Bug reports submitted by users
  bugReports: defineTable({
    userExternalId: v.optional(v.string()),
    farmExternalId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal('ui_visual'),
      v.literal('functionality'),
      v.literal('performance'),
      v.literal('data'),
      v.literal('map'),
      v.literal('satellite'),
      v.literal('ai_recommendations'),
      v.literal('other')
    ),
    severity: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical')
    ),
    stepsToReproduce: v.optional(v.string()),
    context: v.object({
      url: v.string(),
      userAgent: v.string(),
      screenSize: v.optional(v.string()),
      timestamp: v.string(),
    }),
    // GitHub integration
    githubIssueUrl: v.optional(v.string()),
    githubIssueNumber: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_user', ['userExternalId']),
})
