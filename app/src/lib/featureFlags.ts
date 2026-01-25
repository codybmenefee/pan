/**
 * Feature flag system for subscription-based feature gating.
 *
 * Features are gated by subscription tier, with graceful fallbacks
 * for free users.
 */

export const FEATURES = {
  HISTORICAL_SATELLITE: 'historical_satellite',
  NDVI_HEATMAP: 'ndvi_heatmap',
  RAW_IMAGERY: 'raw_imagery',
  PREMIUM_PROVIDERS: 'premium_providers',
  EVI_INDEX: 'evi_index',
  NDWI_INDEX: 'ndwi_index',
  EXPORT_DATA: 'export_data',
  API_ACCESS: 'api_access',
} as const

export type Feature = (typeof FEATURES)[keyof typeof FEATURES]

/**
 * Feature availability by tier.
 */
export const TIER_FEATURES: Record<string, Feature[]> = {
  // TODO: Remove RAW_IMAGERY from free tier after debugging
  free: [FEATURES.HISTORICAL_SATELLITE, FEATURES.NDVI_HEATMAP, FEATURES.RAW_IMAGERY],
  starter: [
    FEATURES.HISTORICAL_SATELLITE,
    FEATURES.NDVI_HEATMAP,
    FEATURES.RAW_IMAGERY,
    FEATURES.EVI_INDEX,
    FEATURES.NDWI_INDEX,
    FEATURES.EXPORT_DATA,
  ],
  professional: [
    FEATURES.HISTORICAL_SATELLITE,
    FEATURES.NDVI_HEATMAP,
    FEATURES.RAW_IMAGERY,
    FEATURES.PREMIUM_PROVIDERS,
    FEATURES.EVI_INDEX,
    FEATURES.NDWI_INDEX,
    FEATURES.EXPORT_DATA,
    FEATURES.API_ACCESS,
  ],
  enterprise: [
    FEATURES.HISTORICAL_SATELLITE,
    FEATURES.NDVI_HEATMAP,
    FEATURES.RAW_IMAGERY,
    FEATURES.PREMIUM_PROVIDERS,
    FEATURES.EVI_INDEX,
    FEATURES.NDWI_INDEX,
    FEATURES.EXPORT_DATA,
    FEATURES.API_ACCESS,
  ],
}

/**
 * Check if a tier has access to a feature.
 */
export function tierHasFeature(tier: string, feature: Feature): boolean {
  const features = TIER_FEATURES[tier] ?? TIER_FEATURES.free
  return features.includes(feature)
}

/**
 * Get the minimum tier required for a feature.
 */
export function getMinimumTierForFeature(feature: Feature): string {
  const tiers = ['free', 'starter', 'professional', 'enterprise']

  for (const tier of tiers) {
    if (TIER_FEATURES[tier]?.includes(feature)) {
      return tier
    }
  }

  return 'enterprise' // Default to highest tier if not found
}

/**
 * Feature descriptions for UI display.
 */
export const FEATURE_INFO: Record<
  Feature,
  {
    name: string
    description: string
    minimumTier: string
  }
> = {
  [FEATURES.HISTORICAL_SATELLITE]: {
    name: 'Historical Satellite',
    description: 'View satellite imagery and vegetation indices over time',
    minimumTier: 'free',
  },
  [FEATURES.NDVI_HEATMAP]: {
    name: 'NDVI Heatmap',
    description: 'Visualize vegetation health as a color-coded overlay',
    minimumTier: 'free',
  },
  [FEATURES.RAW_IMAGERY]: {
    name: 'Raw Satellite Imagery',
    description: 'Access full-resolution RGB satellite tiles',
    minimumTier: 'starter',
  },
  [FEATURES.PREMIUM_PROVIDERS]: {
    name: 'Premium Providers',
    description: 'Access high-resolution PlanetScope imagery (3m)',
    minimumTier: 'professional',
  },
  [FEATURES.EVI_INDEX]: {
    name: 'EVI Index',
    description: 'Enhanced Vegetation Index for canopy analysis',
    minimumTier: 'starter',
  },
  [FEATURES.NDWI_INDEX]: {
    name: 'NDWI Index',
    description: 'Water index for soil moisture monitoring',
    minimumTier: 'starter',
  },
  [FEATURES.EXPORT_DATA]: {
    name: 'Data Export',
    description: 'Export observation data as CSV or JSON',
    minimumTier: 'starter',
  },
  [FEATURES.API_ACCESS]: {
    name: 'API Access',
    description: 'Programmatic access to your farm data',
    minimumTier: 'professional',
  },
}
