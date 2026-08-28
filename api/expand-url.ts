// Vercel Serverless Function — resolve a shortened Google Maps link.
//
// Short links (maps.app.goo.gl/xxxx) carry no coordinates; the location only
// appears after following the redirect. The browser cannot do this because
// Google serves no CORS headers, so the expansion has to happen server-side.
//
// Deliberately narrow: only Google's own shortener hosts are allowed, so this
// cannot be used as an open proxy to probe arbitrary URLs.

const ALLOWED_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'www.google.com',
  'google.com',
])

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body ?? {}
  const raw = String(body.url ?? '').trim()

  if (!raw) return res.status(400).json({ error: 'No URL supplied.' })

  let target: URL
  try {
    target = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return res.status(400).json({ error: 'That does not look like a URL.' })
  }

  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return res.status(400).json({ error: 'Unsupported protocol.' })
  }
  if (!ALLOWED_HOSTS.has(target.hostname.toLowerCase())) {
    return res.status(403).json({
      error: 'Only Google Maps links can be expanded.',
      host: target.hostname,
    })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    // Follow the redirect chain manually so we can read intermediate Location
    // headers — Google sometimes lands on a consent page whose body we don't want.
    let current = target.toString()
    let finalUrl = current

    for (let hop = 0; hop < 5; hop += 1) {
      const response = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          // Deliberately NOT a browser User-Agent. Given a browser UA Google
          // answers the shortener with a 200 JavaScript interstitial that
          // contains no location at all; a plain client gets a real 302 whose
          // Location header names the place.
          'User-Agent': 'CivicFix/1.0 (+civic issue reporting prototype)',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
      })

      const location = response.headers.get('location')
      if (response.status >= 300 && response.status < 400 && location) {
        current = new URL(location, current).toString()
        finalUrl = current
        continue
      }

      // Terminal response — the body may still contain the canonical URL.
      if (response.ok) {
        const html = await response.text().catch(() => '')
        const meta =
          /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
          /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html)
        if (meta?.[1]) finalUrl = meta[1]
      }
      break
    }

    clearTimeout(timeout)

    const coords = extractCoords(finalUrl)
    // Short links often resolve to a place *name* rather than coordinates, so
    // hand the caller that address to geocode instead of failing outright.
    const place = coords ? null : extractPlace(finalUrl)

    return res.status(200).json({ url: finalUrl, coords, place })
  } catch (err) {
    console.error('expand-url failed', err)
    return res.status(504).json({ error: 'Could not resolve that link.' })
  }
}

/**
 * Pull lat/lng out of a resolved Google Maps URL.
 *
 * Kept here as well as on the client so a caller gets coordinates in one round
 * trip: the `!3d<lat>!4d<lng>` form in the `data=` blob is the most precise —
 * `@lat,lng` is the viewport centre, which can differ from the pinned place.
 */
function extractCoords(url: string): { lat: number; lng: number } | null {
  const decoded = safeDecode(url)

  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // pinned place — most accurate
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // viewport centre
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(decoded)
    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
    }
  }
  return null
}

/**
 * Pull a human-readable place or address out of a resolved Maps URL, for links
 * that identify a place by name and feature id rather than by coordinates.
 */
function extractPlace(url: string): string | null {
  const decoded = safeDecode(url)

  const fromQuery = /[?&](?:q|query|destination)=([^&]+)/i.exec(decoded)
  if (fromQuery) {
    const value = fromQuery[1].replace(/\+/g, ' ').trim()
    // Skip a bare coordinate pair — extractCoords already handles that shape.
    if (value && !/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(value)) return value
  }

  const fromPath = /\/maps\/place\/([^/@?]+)/i.exec(decoded)
  if (fromPath) {
    const value = fromPath[1].replace(/\+/g, ' ').trim()
    if (value) return value
  }

  return null
}

function safeDecode(value: string): string {
  let out = value
  // Google nests an encoded URL inside `link=`, sometimes doubly encoded.
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

function safeParse(s: string): any {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}
