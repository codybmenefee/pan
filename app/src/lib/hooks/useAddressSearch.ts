import { useState, useEffect, useRef, useCallback } from 'react'

export interface AddressSuggestion {
  displayName: string
  city?: string
  state?: string
  postalCode?: string
  coordinates: [number, number] // [lon, lat]
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]
  }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
}

interface PhotonResponse {
  features: PhotonFeature[]
}

function formatDisplayName(props: PhotonFeature['properties']): string {
  const parts: string[] = []

  // Build street address
  if (props.housenumber && props.street) {
    parts.push(`${props.housenumber} ${props.street}`)
  } else if (props.street) {
    parts.push(props.street)
  } else if (props.name) {
    parts.push(props.name)
  }

  // Add city, state, postcode
  if (props.city) parts.push(props.city)
  if (props.state) parts.push(props.state)
  if (props.postcode) parts.push(props.postcode)

  return parts.join(', ')
}

function parsePhotonResult(feature: PhotonFeature): AddressSuggestion {
  const { properties, geometry } = feature

  return {
    displayName: formatDisplayName(properties),
    city: properties.city,
    state: properties.state,
    postalCode: properties.postcode,
    coordinates: geometry.coordinates,
  }
}

interface UseAddressSearchOptions {
  debounceMs?: number
  minChars?: number
}

interface UseAddressSearchResult {
  suggestions: AddressSuggestion[]
  isLoading: boolean
  error: string | null
  search: (query: string) => void
  clear: () => void
}

export function useAddressSearch(
  options: UseAddressSearchOptions = {}
): UseAddressSearchResult {
  const { debounceMs = 300, minChars = 3 } = options

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      // Photon API with continental US bounding box
      const params = new URLSearchParams({
        q: query,
        limit: '5',
        lang: 'en',
        bbox: '-125,24,-66,50', // Continental US
      })

      const response = await fetch(
        `https://photon.komoot.io/api/?${params.toString()}`,
        { signal: controller.signal }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch address suggestions')
      }

      const data: PhotonResponse = await response.json()

      // Filter to US results only and parse
      const results = data.features
        .filter((f) => f.properties.country === 'United States')
        .map(parsePhotonResult)
        .filter((s) => s.displayName.length > 0)

      setSuggestions(results)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
        return
      }
      setError(err instanceof Error ? err.message : 'Search failed')
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const search = useCallback(
    (query: string) => {
      // Clear any pending timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      // Don't search if below minimum characters
      if (query.length < minChars) {
        setSuggestions([])
        setIsLoading(false)
        return
      }

      // Debounce the search
      timerRef.current = setTimeout(() => {
        fetchSuggestions(query)
      }, debounceMs)
    },
    [minChars, debounceMs, fetchSuggestions]
  )

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setSuggestions([])
    setError(null)
    setIsLoading(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    suggestions,
    isLoading,
    error,
    search,
    clear,
  }
}
