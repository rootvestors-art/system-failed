type MapProviderKey = 'tomtom' | 'carto'

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

  if (useTomTom && hasKey) {
    return { primaryId: 'tomtom_in', fallbackChain: ['tomtom_default', 'carto'] }
  }
  return { primaryId: 'carto', fallbackChain: [] }
}

export const MAP_CONFIG = resolveConfig()
