// Vercel Serverless Function — serves pre-rendered HTML with full OG meta tags
// for incident detail pages. Bots (WhatsApp, Telegram, Facebook) that don't
// execute JS will crawl this URL and see the correct preview cards.
// Human browsers are redirected immediately to the SPA route.

import { createClient } from '@supabase/supabase-js'

interface IncidentRow {
  id: string
  case_id: string
  title: string
  victims: Array<{ outcome: string }>
  location: { lat: number; lng: number; address: string; city: string; state: string }
  negligence_type: string
  responsible_entities: { agency: string; mla?: string; mp?: string }
  status: string
  description: string
  image_url?: string
}

function buildOgImageUrl(base: string, incident: IncidentRow): string {
  const deaths = incident.victims.filter((v) => v.outcome === 'Death').length
  const injuries = incident.victims.filter((v) => v.outcome === 'Serious_Injury').length
  const params = new URLSearchParams({
    type: 'incident',
    case_id: incident.case_id,
    title: incident.title.slice(0, 120),
    city: incident.location.city,
    state: incident.location.state,
    negligence: incident.negligence_type,
    deaths: String(deaths),
    injuries: String(injuries),
    agency: incident.responsible_entities.agency ?? '',
    status: incident.status,
  })
  return `${base}/api/og?${params.toString()}`
}

function buildDescription(incident: IncidentRow): string {
  const deaths = incident.victims.filter((v) => v.outcome === 'Death').length
  const injuries = incident.victims.filter((v) => v.outcome === 'Serious_Injury').length
  const parts: string[] = []
  if (deaths > 0) parts.push(`${deaths} ${deaths === 1 ? 'death' : 'deaths'}`)
  if (injuries > 0) parts.push(`${injuries} injured`)
  const outcome = parts.join(', ')
  const loc = `${incident.location.city}, ${incident.location.state}`
  return `${outcome} • ${incident.negligence_type.replace(/_/g, ' ')} • ${loc} — ${incident.description.slice(0, 140)}`
}

/**
 * Escape a value for interpolation into HTML text or a double-quoted attribute.
 *
 * Everything below is built from database rows and the request URL, both of
 * which are attacker-controlled: any visitor can submit a report title, and the
 * `id` path segment is arbitrary. Without this, `"><script>` in a title breaks
 * out of a `content="..."` attribute and executes same-origin on a response the
 * CDN then caches for every subsequent viewer.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function html(opts: {
  title: string
  description: string
  ogImage: string
  ogUrl: string
  spaUrl: string
  canonicalTitle: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(opts.canonicalTitle)}</title>
  <meta name="description" content="${esc(opts.description)}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="CivicFix">
  <meta property="og:title" content="${esc(opts.title)}">
  <meta property="og:description" content="${esc(opts.description)}">
  <meta property="og:url" content="${esc(opts.ogUrl)}">
  <meta property="og:image" content="${esc(opts.ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(opts.title)}">
  <meta name="twitter:description" content="${esc(opts.description)}">
  <meta name="twitter:image" content="${esc(opts.ogImage)}">

  <!-- Redirect for browsers. Deliberately meta-refresh only: an inline
       script here would place a URL-derived value inside a JS string. -->
  <meta http-equiv="refresh" content="0;url=${esc(opts.spaUrl)}">
</head>
<body>
  <p style="font-family:sans-serif;color:#999;margin:40px auto;max-width:600px;text-align:center">
    Redirecting to the incident page… <a href="${esc(opts.spaUrl)}">Continue</a>
  </p>
</body>
</html>`
}

/** Reports are addressed by UUID; anything else is not a real reference. */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const rawId = String(req.query.id ?? '')
  // Never reflect an unvalidated path segment into the response.
  const id = isUuid(rawId) ? rawId : ''
  const proto = req.headers['x-forwarded-proto'] === 'http' ? 'http' : 'https'
  const host = String(req.headers.host ?? '').replace(/[^a-zA-Z0-9.:-]/g, '')
  const base = `${proto}://${host}`
  const spaUrl = id ? `${base}/incident/${id}` : `${base}/`
  const shareUrl = id ? `${base}/share/incident/${id}` : `${base}/`

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  // --------------------------------------------------------------------------
  // Try to fetch live data from Supabase
  // --------------------------------------------------------------------------
  if (id && supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: incident } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single<IncidentRow>()

      if (incident) {
        const title = `CASE ${incident.case_id} — ${incident.title}`
        const description = buildDescription(incident)
        const ogImage = buildOgImageUrl(base, incident)

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
        return res.send(html({ title, description, ogImage, ogUrl: shareUrl, spaUrl, canonicalTitle: title }))
      }
    } catch {
      // Fall through to generic fallback
    }
  }

  // --------------------------------------------------------------------------
  // Fallback — generic branded page (no Supabase or incident not found)
  // --------------------------------------------------------------------------
  const fallbackOg = `${base}/api/og?type=incident&title=Civic+Negligence+Report`
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=60')
  return res.send(
    html({
      title: 'CivicFix — Civic Negligence Report',
      description: 'Report a dangerous civic issue in India — routed to the right department, with a deadline attached.',
      ogImage: fallbackOg,
      ogUrl: shareUrl,
      spaUrl,
      canonicalTitle: 'CivicFix — Civic Negligence Report',
    }),
  )
}
