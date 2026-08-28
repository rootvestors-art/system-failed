// Vercel Serverless Function — same pattern as /api/share/incident/[id].ts
// but for Safety Hazard (hazard) detail pages.

import { createClient } from '@supabase/supabase-js'

interface HazardRow {
  id: string
  location: { lat: number; lng: number; address: string; city: string; state: string }
  negligence_type: string
  severity: string
  description: string
  status: string
  image_url?: string
}

function buildOgImageUrl(base: string, hazard: HazardRow): string {
  const params = new URLSearchParams({
    type: 'hazard',
    city: hazard.location.city,
    state: hazard.location.state,
    negligence: hazard.negligence_type,
    severity: hazard.severity,
    description: hazard.description.slice(0, 120),
    status: hazard.status,
  })
  return `${base}/api/og?${params.toString()}`
}

function buildDescription(hazard: HazardRow): string {
  const loc = `${hazard.location.city}, ${hazard.location.state}`
  return `${hazard.severity} severity • ${hazard.negligence_type.replace(/_/g, ' ')} • ${loc} — ${hazard.description.slice(0, 140)}`
}

/**
 * Escape a value for interpolation into HTML text or a double-quoted attribute.
 * Hazard titles and descriptions come from anonymous submissions, and `id` comes
 * from the URL — both must be treated as hostile. See the incident handler for
 * the full rationale.
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
    Redirecting to the safety hazard page… <a href="${esc(opts.spaUrl)}">Continue</a>
  </p>
</body>
</html>`
}

/** Hazards are addressed by UUID (bundled samples aside), so anything else is invalid. */
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
  const spaUrl = id ? `${base}/deathtraps/${id}` : `${base}/`
  const shareUrl = id ? `${base}/share/hazard/${id}` : `${base}/`

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (id && supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: hazard } = await supabase
        .from('hazards')
        .select('*')
        .eq('id', id)
        .single<HazardRow>()

      if (hazard) {
        const title = `⚠ SAFETY HAZARD — ${hazard.severity} ${hazard.negligence_type.replace(/_/g, ' ')} in ${hazard.location.city}`
        const description = buildDescription(hazard)
        const ogImage = buildOgImageUrl(base, hazard)

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
        return res.send(html({ title, description, ogImage, ogUrl: shareUrl, spaUrl, canonicalTitle: title }))
      }
    } catch {
      // Fall through to generic fallback
    }
  }

  const fallbackOg = `${base}/api/og?type=hazard&severity=Critical&negligence=Open_Drain`
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=60')
  return res.send(
    html({
      title: 'CivicFix — Active Safety Hazard',
      description: 'A dangerous civic hazard has been reported. Check if it has been fixed.',
      ogImage: fallbackOg,
      ogUrl: shareUrl,
      spaUrl,
      canonicalTitle: 'CivicFix — Active Safety Hazard',
    }),
  )
}
