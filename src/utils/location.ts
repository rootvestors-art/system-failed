/**
 * Repeatedly percent-decode a URL.
 *
 * Google's "open in app" links wrap the real maps URL inside a `link=` query
 * parameter, so the coordinates arrive encoded as `%4012.97%2C77.69` rather than
 * `@12.97,77.69`. Decoding first means those links parse locally with no network
 * call at all.
 */
function decodeDeep(value: string): string {
  let out = value
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(out)
      if (next === out) break
      out = next
    } catch {
      break
    }
  }
  return out
}

/**
 * Resolve a shortened Google Maps link via our own endpoint.
 *
 * This cannot be done in the browser: Google serves no CORS headers on the
 * shortener, so `fetch` fails before any redirect can be read. The previous
 * implementation attempted it client-side anyway and therefore always failed.
 */
async function expandShortUrl(shortUrl: string): Promise<{
  url: string | null
  coords: { lat: number; lng: number } | null
  place: string | null
}> {
  try {
    const response = await fetch('/api/expand-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: shortUrl }),
    })

    const contentType = response.headers.get('content-type') ?? ''
    if (!response.ok || !contentType.includes('application/json')) {
      return { url: null, coords: null, place: null }
    }

    const payload = await response.json()
    return {
      url: payload?.url ?? null,
      coords: payload?.coords ?? null,
      place: payload?.place ?? null,
    }
  } catch {
    return { url: null, coords: null, place: null }
  }
}

/**
 * Forward-geocode a place or address string to coordinates via Nominatim.
 *
 * Needed because Google's short links resolve to a place name plus an internal
 * feature id, not to a latitude and longitude.
 */
async function geocodeOnce(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query,
    )}&format=json&limit=1&countrycodes=in`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
    }
    return null
  } catch {
    return null
  }
}

async function geocodePlace(query: string): Promise<{ lat: number; lng: number } | null> {
  // Google place strings often start with a Plus Code fragment ("XMCX+R4R") and a
  // business name, neither of which Nominatim knows. Dropping leading segments
  // one at a time degrades from exact address to locality, which still lands the
  // citizen in the right neighbourhood — they then fine-tune on the map.
  const cleaned = query.replace(/^[A-Z0-9]{4,}\+[A-Z0-9]{2,}\s*/i, '').trim()
  const segments = cleaned.split(',').map((s) => s.trim()).filter(Boolean)

  const attempts: string[] = []
  for (let start = 0; start < Math.min(segments.length, 4); start += 1) {
    const candidate = segments.slice(start).join(', ')
    if (candidate) attempts.push(candidate)
  }
  if (cleaned && attempts[0] !== cleaned) attempts.unshift(cleaned)

  for (const attempt of attempts) {
    const hit = await geocodeOnce(attempt)
    if (hit) return hit
    // Nominatim asks for at most one request per second.
    await new Promise((resolve) => setTimeout(resolve, 1100))
  }
  return null
}

/**
 * Parse Google Maps URL to extract coordinates
 * Supports various Google Maps URL formats:
 * - https://www.google.com/maps?q=lat,lng
 * - https://www.google.com/maps/@lat,lng,zoom
 * - https://maps.google.com/?q=lat,lng
 * - https://goo.gl/maps/...
 * - https://maps.app.goo.gl/...
 */
/**
 * Coordinate patterns, most trustworthy first.
 *
 * `!3d…!4d…` inside Google's `data=` blob is the pinned place. `@lat,lng` is only
 * the viewport centre, which can sit hundreds of metres away from the pin — so it
 * is tried last among the precise forms.
 */
const COORD_PATTERNS: RegExp[] = [
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/i,
  /[?&]query=(-?\d+\.\d+),\s*(-?\d+\.\d+)/i,
  /[?&]ll=(-?\d+\.\d+),\s*(-?\d+\.\d+)/i,
  /[?&]destination=(-?\d+\.\d+),\s*(-?\d+\.\d+)/i,
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
]

function matchCoords(text: string): { lat: number; lng: number } | null {
  for (const pattern of COORD_PATTERNS) {
    const match = pattern.exec(text)
    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
    }
  }
  return null
}

export interface ParsedMapLocation {
  lat: number
  lng: number
  /** True when derived from a place name rather than coordinates in the link. */
  approximate?: boolean
}

export async function parseGoogleMapsUrl(url: string): Promise<ParsedMapLocation | null> {
  try {
    const raw = url.trim()
    if (!raw) return null

    // Decode before anything else. Many Google links — including the long
    // "open in app" form — already contain the coordinates, just percent-encoded
    // inside a `link=` parameter. This resolves them without a network call.
    const decoded = decodeDeep(raw)

    const direct = matchCoords(decoded)
    if (direct) return direct

    // No coordinates in the link itself. If it is one of Google's shorteners the
    // location is only revealed by following the redirect, which needs the server.
    const isShortener = /(^|\/\/)(maps\.app\.goo\.gl|goo\.gl)\b/i.test(decoded)
    if (isShortener) {
      const expanded = await expandShortUrl(raw)
      if (expanded.coords) return expanded.coords
      if (expanded.url) {
        const fromExpanded = matchCoords(decodeDeep(expanded.url))
        if (fromExpanded) return fromExpanded
      }
      // Google resolves many short links to a place name and an internal id
      // rather than coordinates, so geocode the name we were given.
      if (expanded.place) {
        const geocoded = await geocodePlace(expanded.place)
        if (geocoded) return { ...geocoded, approximate: true }
      }
      return null
    }

    // Last resort: a bare "lat,lng" pair anywhere in the string, accepted only
    // when it falls inside India so page numbers and ids aren't mistaken for it.
    const loose = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/.exec(decoded)
    if (loose) {
      const lat = parseFloat(loose[1])
      const lng = parseFloat(loose[2])
      if (isValidIndiaCoordinates(lat, lng)) return { lat, lng }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Reverse geocode coordinates to get address details
 * Uses Nominatim API (OpenStreetMap)
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ address: string; city: string; state: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&countrycodes=in`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CivicFix/1.0' },
    })
    const data = await res.json()
    
    if (data && data.address) {
      const addr = data.address
      return {
        address: data.display_name?.split(',')[0] || addr.road || addr.house_number || '',
        city: addr.city || addr.town || addr.village || addr.district || '',
        state: addr.state || '',
      }
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Validate if coordinates are within India bounds (rough check)
 */
export function isValidIndiaCoordinates(lat: number, lng: number): boolean {
  return lat >= 6 && lat <= 37 && lng >= 68 && lng <= 98
}
