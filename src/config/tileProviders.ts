const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY

export interface TileProvider {
  id: string
  label: string
  requiresKey: boolean
  getUrl: (key: string | undefined) => string | null
  attribution: string
  subdomains: string[]
  /**
   * The tone the tiles ship in. TomTom's `night` style is natively dark; OSM is
   * natively light. The map layer is tagged with this, and CSS inverts whichever
   * one is the wrong way round for the active theme — dark journey pages want a
   * dark map, the light report journey wants a light one.
   */
  nativeTone: 'dark' | 'light'
}

export const TILE_PROVIDERS: Record<string, TileProvider> = {
  tomtom_in: {
    id: 'tomtom_in',
    label: 'TomTom India view',
    requiresKey: true,
    getUrl: (key) =>
      key
        ? `https://{s}.api.tomtom.com/map/1/tile/basic/night/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}&tileSize=256&view=IN`
        : null,
    attribution: '&copy; TomTom &copy; OpenStreetMap contributors',
    subdomains: ['a', 'b', 'c', 'd'],
    nativeTone: 'dark',
  },
  tomtom_default: {
    id: 'tomtom_default',
    label: 'TomTom default view',
    requiresKey: true,
    getUrl: (key) =>
      key
        ? `https://{s}.api.tomtom.com/map/1/tile/basic/night/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}&tileSize=256`
        : null,
    attribution: '&copy; TomTom &copy; OpenStreetMap contributors',
    subdomains: ['a', 'b', 'c', 'd'],
    nativeTone: 'dark',
  },
  /**
   * OpenStreetMap standard tiles — the only genuinely key-free option left.
   *
   * CARTO's dark_all basemap now serves an "API KEY REQUIRED" watermark to
   * anonymous callers (HTTP 200, so Leaflet never fires a tile error and the
   * fallback chain can't detect it). OSM tiles are light, so `darkFilter` tells
   * the map layer to invert them into something that matches the theme.
   */
  osm: {
    id: 'osm',
    label: 'OpenStreetMap (no key needed)',
    requiresKey: false,
    getUrl: () => 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: [],
    nativeTone: 'light',
  },
}

// Pre-resolved URLs at module level — keys never change at runtime
export const RESOLVED_URLS: Record<string, string | null> = Object.fromEntries(
  Object.values(TILE_PROVIDERS).map((p) => [p.id, p.getUrl(TOMTOM_KEY)]),
)
