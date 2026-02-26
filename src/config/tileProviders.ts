const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY

export interface TileProvider {
  id: string
  label: string
  requiresKey: boolean
  getUrl: (key: string | undefined) => string | null
  attribution: string
  subdomains: string[]
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
  },
  carto: {
    id: 'carto',
    label: 'CARTO dark matter',
    requiresKey: false,
    getUrl: () => 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
  },
}

// Pre-resolved URLs at module level — keys never change at runtime
export const RESOLVED_URLS: Record<string, string | null> = Object.fromEntries(
  Object.values(TILE_PROVIDERS).map((p) => [p.id, p.getUrl(TOMTOM_KEY)]),
)
