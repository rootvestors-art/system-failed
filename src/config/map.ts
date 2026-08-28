type MapProviderKey = 'tomtom' | 'osm'

export interface MapConfig {
  /** First provider to attempt */
  primaryId: string
  /** Ordered list of provider IDs tried after primary fails */
  fallbackChain: string[]
}

function resolveConfig(): MapConfig {
  const explicit = import.meta.env.VITE_MAP_PROVIDER as MapProviderKey | undefined
  const hasKey = Boolean(import.meta.env.VITE_TOMTOM_API_KEY)
  const useTomTom = explicit ? explicit === 'tomtom' : hasKey

  // `osm` is the terminal fallback because it is the only provider that still
  // works without a key. CARTO has been removed: it answers anonymous requests
  // with a watermarked tile and HTTP 200, so it fails invisibly.
  if (useTomTom && hasKey) {
    return { primaryId: 'tomtom_in', fallbackChain: ['tomtom_default', 'osm'] }
  }
  return { primaryId: 'osm', fallbackChain: [] }
}

export const MAP_CONFIG = resolveConfig()
