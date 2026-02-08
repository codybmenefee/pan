import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export type TileType = 'rgb' | 'ndvi' | 'ndvi_heatmap' | 'evi' | 'ndwi'

/**
 * Get the Convex site URL for HTTP endpoints.
 * Converts the Convex cloud URL to the site URL format.
 */
function getConvexSiteUrl(): string {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string
  // Convert https://xxx.convex.cloud to https://xxx.convex.site
  return convexUrl.replace('.convex.cloud', '.convex.site')
}

/**
 * Get a tile-serving URL by document ID.
 * Uses the on-demand /tiles/serve endpoint which generates fresh presigned URLs.
 */
function getServedTileUrl(tileId: string): string {
  const siteUrl = getConvexSiteUrl()
  return `${siteUrl}/tiles/serve?id=${encodeURIComponent(tileId)}`
}

export interface SatelliteTile {
  _id: string
  farmId: string
  captureDate: string
  provider: string
  tileType: TileType
  r2Key: string
  r2Url: string
  bounds: {
    west: number
    south: number
    east: number
    north: number
  }
  cloudCoverPct: number
  resolutionMeters: number
  fileSizeBytes: number
  createdAt: string
  expiresAt?: string
}

export interface AvailableDate {
  date: string
  cloudCoverPct: number
  tileTypes: string[]
  provider: string
}

export interface UseSatelliteTilesOptions {
  farmId: string | undefined
  startDate?: string
  endDate?: string
  tileType?: TileType
}

export interface UseSatelliteTilesResult {
  tiles: SatelliteTile[]
  isLoading: boolean
}

/**
 * Hook to fetch satellite tiles for a farm.
 */
export function useSatelliteTiles(
  options: UseSatelliteTilesOptions
): UseSatelliteTilesResult {
  const tiles = useQuery(
    api.satelliteTiles.getTilesForFarmByExternalId,
    options.farmId
      ? {
          farmExternalId: options.farmId,
          startDate: options.startDate,
          endDate: options.endDate,
          tileType: options.tileType,
        }
      : 'skip'
  )

  return {
    tiles: (tiles as SatelliteTile[]) ?? [],
    isLoading: tiles === undefined,
  }
}

/**
 * Hook to fetch available dates with satellite observation data for a farm.
 * Uses the observations table which stores computed indices from satellite imagery.
 */
export function useAvailableDates(
  farmId: string | undefined,
  _tileType?: TileType
): {
  dates: AvailableDate[]
  isLoading: boolean
} {
  const rawDates = useQuery(
    api.observations.getAvailableDates,
    farmId ? { farmExternalId: farmId } : 'skip'
  )

  // Map to AvailableDate format
  const dates: AvailableDate[] = (rawDates ?? []).map(d => ({
    date: d.date,
    cloudCoverPct: d.cloudCoverPct,
    tileTypes: ['ndvi'], // Observations always have NDVI
    provider: d.provider,
  }))

  return {
    dates,
    isLoading: rawDates === undefined,
  }
}

/**
 * Hook to fetch available dates that have actual satellite raster tiles.
 * Unlike useAvailableDates (which queries observations), this queries the
 * satelliteImageTiles table directly to find dates with actual imagery.
 */
export function useAvailableTileDates(
  farmId: string | undefined,
  tileType?: TileType
): {
  dates: AvailableDate[]
  isLoading: boolean
} {
  const rawDates = useQuery(
    api.satelliteTiles.getAvailableDatesByExternalId,
    farmId ? { farmExternalId: farmId, tileType } : 'skip'
  )

  return {
    dates: (rawDates as AvailableDate[]) ?? [],
    isLoading: rawDates === undefined,
  }
}

/**
 * Hook to fetch a specific tile by date and type.
 * Returns the tile with r2Url transformed to use the CORS proxy.
 */
export function useSatelliteTile(
  farmId: string | undefined,
  captureDate: string | undefined,
  tileType: TileType
): {
  tile: SatelliteTile | null
  isLoading: boolean
} {
  const rawTile = useQuery(
    api.satelliteTiles.getTileByExternalId,
    farmId && captureDate
      ? {
          farmExternalId: farmId,
          captureDate,
          tileType,
        }
      : 'skip'
  )

  // Generate a served URL using tile ID (never expires)
  const tile = useMemo(() => {
    if (!rawTile) return null
    return {
      ...(rawTile as SatelliteTile),
      r2Url: getServedTileUrl((rawTile as SatelliteTile)._id),
    }
  }, [rawTile])

  return {
    tile,
    isLoading: rawTile === undefined,
  }
}

/**
 * Hook to fetch storage usage for a farm.
 * Note: Returns null for now until Convex functions are updated
 * to accept external farm IDs.
 */
export function useStorageUsage(_farmId: string | undefined): {
  usage: {
    totalBytes: number
    totalMB: number
    tileCount: number
    byType: Record<string, { count: number; bytes: number }>
  } | null
  isLoading: boolean
} {
  // Note: Returns stub data; wire up to Convex when tile usage tracking is implemented
  return {
    usage: null,
    isLoading: false,
  }
}

export interface ObservationData {
  paddockExternalId: string
  ndviMean: number
  ndviMin: number
  ndviMax: number
  eviMean: number
  ndwiMean: number
  cloudFreePct: number
  sourceProvider: string
  resolutionMeters: number
}

/**
 * Hook to fetch observations for a specific date.
 */
export function useObservationsByDate(
  farmId: string | undefined,
  date: string | null
): {
  observations: ObservationData[]
  isLoading: boolean
} {
  const observations = useQuery(
    api.observations.getObservationsByDate,
    farmId && date ? { farmId, date } : 'skip'
  )

  return {
    observations: (observations as ObservationData[]) ?? [],
    isLoading: observations === undefined,
  }
}
