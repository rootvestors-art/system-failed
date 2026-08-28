import { useEffect, useMemo, useRef, useState } from 'react'
import { TILE_PROVIDERS, RESOLVED_URLS } from '../config/tileProviders'
import { MAP_CONFIG } from '../config/map'

const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY

// Persisting the fallback index in sessionStorage means subsequent map mounts
// (e.g. navigating to a detail page after the full map) start at the same
// provider instead of re-attempting a broken one.
//
// We store BOTH the primary ID and the active fallback ID. If the primary changes
// (e.g. user adds a TomTom key or changes VITE_MAP_PROVIDER), the cached fallback
// is stale and must be ignored — otherwise a previously stored 'carto' would cause
// the map to skip TomTom entirely even after the config was updated.
const SESSION_KEY = 'sf_map_provider'
const SESSION_PRIMARY_KEY = 'sf_map_primary'

const ALL_PROVIDERS = [MAP_CONFIG.primaryId, ...MAP_CONFIG.fallbackChain]

function getInitialIndex(): number {
  try {
    const storedPrimary = sessionStorage.getItem(SESSION_PRIMARY_KEY)
    if (storedPrimary !== MAP_CONFIG.primaryId) {
      // Config has changed — discard the stale fallback
      return 0
    }
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      const idx = ALL_PROVIDERS.indexOf(stored)
      if (idx !== -1) return idx
    }
  } catch {
    // sessionStorage unavailable (e.g. some private-browsing configs)
  }
  return 0
}

export interface TileLayerConfig {
  url: string
  attribution: string
  subdomains: string[]
  /** CSS class applied to the tile layer, used to invert light basemaps. */
  className?: string
}

export function useTileProvider() {
  const [providerIndex, setProviderIndex] = useState<number>(getInitialIndex)
  const errorCount = useRef(0)
  const lastProbed = useRef<string | null>(null)

  const currentId = ALL_PROVIDERS[providerIndex]
  const provider = TILE_PROVIDERS[currentId]

  // Reset error counter whenever the active provider changes so dev logging
  // stays useful across the full fallback chain (not just the first provider).
  useEffect(() => {
    errorCount.current = 0
  }, [currentId])

  // Persist the active provider + current primary so other map instances in this
  // session start at the same provider, and so getInitialIndex can detect stale
  // caches when the config changes between sessions.
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, currentId)
      sessionStorage.setItem(SESSION_PRIMARY_KEY, MAP_CONFIG.primaryId)
    } catch {
      // ignore
    }
  }, [currentId])

  // Dev-only: log which provider is active
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (provider.requiresKey && TOMTOM_KEY) {
      const suffix = TOMTOM_KEY.slice(-4)
      console.info(`[map] provider: ${currentId} (${provider.label}) key=…${suffix}`)
    } else {
      console.info(`[map] provider: ${currentId} (${provider.label})`)
    }
  }, [currentId, provider])

  // Dev-only: probe one tile via fetch to surface HTTP status codes —
  // Leaflet image loads don't expose HTTP status, making 403/429 invisible otherwise.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (!provider.requiresKey) return
    if (lastProbed.current === currentId) return
    lastProbed.current = currentId

    const templateUrl = RESOLVED_URLS[currentId]
    if (!templateUrl) return

    const url = templateUrl
      .replace('{z}', '0')
      .replace('{x}', '0')
      .replace('{y}', '0')
      .replace('{s}', 'a')

    fetch(url)
      .then(async (res) => {
        console.info('[map] tile probe:', res.status, res.statusText)
        if (!res.ok) {
          const ct = res.headers.get('content-type') ?? ''
          if (ct.includes('json') || ct.includes('text/')) {
            const body = await res.text()
            console.info('[map] tile probe body:', body.slice(0, 400))
          }
        }
      })
      .catch((err) => console.error('[map] tile probe failed:', err))
  }, [currentId, provider.requiresKey])

  // The active tile layer props — recomputed only when provider changes
  const tileConfig: TileLayerConfig = useMemo(() => {
    const url = RESOLVED_URLS[currentId]
    if (url) {
      return {
        url,
        attribution: provider.attribution,
        subdomains: provider.subdomains,
        className: provider.darkFilter ? 'tile-dark' : undefined,
      }
    }
    // A key-requiring provider with no key: fall back to the keyless basemap
    // rather than to CARTO, which now needs a key of its own.
    const osm = TILE_PROVIDERS['osm']
    return {
      url: osm.getUrl(undefined) as string,
      attribution: osm.attribution,
      subdomains: osm.subdomains,
      className: 'tile-dark',
    }
  }, [currentId, provider])

  // Using a stable ref so Leaflet never needs to re-register the listener.
  // The handler reads the live index via functional setState to avoid stale
  // closures: if multiple tile errors arrive after a provider switch (in-flight
  // requests from the old provider completing late), each one sees the latest
  // committed index rather than the one captured at memo-creation time.
  const eventHandlers = useMemo(
    () => ({
      tileerror: (e: unknown) => {
        errorCount.current += 1

        // Dev-only tile error logging — avoid spamming after the first few
        if (import.meta.env.DEV) {
          if (errorCount.current <= 5) {
            const rawSrc = (e as { tile?: HTMLImageElement }).tile?.src
            const safeSrc = rawSrc ? rawSrc.replace(/key=[^&]+/i, 'key=***') : rawSrc
            const coords = (e as { coords?: { x: number; y: number; z: number } }).coords
            console.error('[map] tile error', { src: safeSrc, coords })
          } else if (errorCount.current === 6) {
            console.error('[map] further tile errors suppressed')
          }
        }

        // Functional updater: reads the live index at the moment React processes
        // this update, not the stale index captured in the closure. This prevents
        // late-arriving errors from the old provider double-advancing the chain.
        setProviderIndex((idx) => {
          if (idx >= ALL_PROVIDERS.length - 1) return idx
          const nextId = ALL_PROVIDERS[idx + 1]
          if (import.meta.env.DEV) {
            console.warn(`[map] fallback: ${ALL_PROVIDERS[idx]} → ${nextId}`)
          }
          return idx + 1
        })
      },
    }),
    // No deps needed — functional updater never captures stale state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return { tileConfig, eventHandlers }
}
