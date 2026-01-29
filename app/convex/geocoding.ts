"use node"

import { v } from 'convex/values'
import { action } from './_generated/server'

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

/**
 * Try to geocode a query using Nominatim
 */
async function tryGeocode(query: string): Promise<NominatimResult | null> {
  const encodedQuery = encodeURIComponent(query)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&countrycodes=us`,
    {
      headers: {
        'User-Agent': 'GrazingIntelligence/1.0',
      },
    }
  )

  if (!response.ok) {
    return null
  }

  const data = await response.json() as NominatimResult[]
  return data?.[0] ?? null
}

/**
 * Parse address components from a US address string.
 * Handles formats like:
 * - "20694 Highway H Hughesville MO 65334"
 * - "123 Main St, Nashville, TN 37201"
 */
function parseAddressComponents(address: string): {
  zip?: string
  state?: string
  city?: string
} {
  const cleaned = address.replace(/,/g, ' ').trim()

  // Try to find ZIP code (5 digits, optionally with -4 extension)
  const zipMatch = cleaned.match(/\b(\d{5})(-\d{4})?\b/)
  const zip = zipMatch?.[1]

  // Common US state abbreviations
  const stateAbbrevs = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
  const statePattern = new RegExp(`\\b(${stateAbbrevs.join('|')})\\b`, 'i')
  const stateMatch = cleaned.match(statePattern)
  const state = stateMatch?.[1]?.toUpperCase()

  // Try to extract city - typically word(s) before the state
  let city: string | undefined
  if (state) {
    const beforeState = cleaned.split(new RegExp(`\\b${state}\\b`, 'i'))[0]
    // Get the last 1-2 words before state (likely the city)
    const words = beforeState.trim().split(/\s+/)
    // Take last 1-2 words, avoiding numbers and highway designations
    const cityWords: string[] = []
    for (let i = words.length - 1; i >= 0 && cityWords.length < 2; i--) {
      const word = words[i]
      // Skip if it looks like a number, highway designation, or street suffix
      if (/^\d+$/.test(word) || /^(highway|hwy|route|rt|rd|st|ave|dr|ln|ct|blvd)$/i.test(word)) {
        break
      }
      cityWords.unshift(word)
    }
    if (cityWords.length > 0) {
      city = cityWords.join(' ')
    }
  }

  return { zip, state, city }
}

/**
 * Geocode an address string to coordinates using OpenStreetMap Nominatim API.
 * Uses fallback strategies for rural addresses that may not geocode exactly.
 * Free service, no API key required.
 */
export const geocodeAddress = action({
  args: { address: v.string() },
  handler: async (_ctx, args): Promise<{
    success: boolean
    coordinates?: [number, number]
    formattedAddress?: string
    isApproximate?: boolean
    error?: string
  }> => {
    if (!args.address.trim()) {
      return { success: false, error: 'Address is required' }
    }

    try {
      // Strategy 1: Try the full address
      let result = await tryGeocode(args.address)
      let isApproximate = false

      if (!result) {
        // Parse address components for fallback strategies
        const { zip, state, city } = parseAddressComponents(args.address)

        // Strategy 2: Try city, state, zip
        if (city && state && zip) {
          result = await tryGeocode(`${city}, ${state} ${zip}`)
          isApproximate = true
        }

        // Strategy 3: Try just zip code (very reliable for US)
        if (!result && zip) {
          result = await tryGeocode(zip)
          isApproximate = true
        }

        // Strategy 4: Try city, state
        if (!result && city && state) {
          result = await tryGeocode(`${city}, ${state}`)
          isApproximate = true
        }

        // Strategy 5: Try just state
        if (!result && state) {
          result = await tryGeocode(state)
          isApproximate = true
        }
      }

      if (!result) {
        return {
          success: false,
          error: 'Could not find location. Try entering just the city and state, or ZIP code.'
        }
      }

      const lat = parseFloat(result.lat)
      const lon = parseFloat(result.lon)

      if (isNaN(lat) || isNaN(lon)) {
        return { success: false, error: 'Invalid coordinates returned from geocoding' }
      }

      return {
        success: true,
        coordinates: [lon, lat], // GeoJSON format: [longitude, latitude]
        formattedAddress: isApproximate
          ? `Near ${result.display_name}`
          : result.display_name,
        isApproximate,
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return {
        success: false,
        error: 'Failed to geocode address. Please try again.'
      }
    }
  },
})
