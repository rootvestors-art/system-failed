// Vercel Serverless Function — same pattern as /api/share/incident/[id].ts
// but for Death Trap (hazard) detail pages.

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
  <title>${opts.canonicalTitle}</title>
  <meta name="description" content="${opts.description}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="SystemFailed">
  <meta property="og:title" content="${opts.title}">
  <meta property="og:description" content="${opts.description}">
  <meta property="og:url" content="${opts.ogUrl}">
  <meta property="og:image" content="${opts.ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@SystemFailed_in">
  <meta name="twitter:title" content="${opts.title}">
  <meta name="twitter:description" content="${opts.description}">
  <meta name="twitter:image" content="${opts.ogImage}">

  <!-- Immediate redirect for browsers -->
  <meta http-equiv="refresh" content="0;url=${opts.spaUrl}">
</head>
<body>
  <p style="font-family:sans-serif;color:#999;margin:40px auto;max-width:600px;text-align:center">
    Redirecting to death trap page…
  </p>
  <script>window.location.replace("${opts.spaUrl}")</script>
</body>
</html>`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const id = req.query.id as string
  const proto = req.headers['x-forwarded-proto'] ?? 'https'
  const host = req.headers.host ?? ''
  const base = `${proto}://${host}`
  const spaUrl = `${base}/deathtraps/${id}`
  const shareUrl = `${base}/share/hazard/${id}`

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: hazard } = await supabase
        .from('hazards')
        .select('*')
        .eq('id', id)
        .single<HazardRow>()

      if (hazard) {
        const title = `⚠ DEATH TRAP — ${hazard.severity} ${hazard.negligence_type.replace(/_/g, ' ')} in ${hazard.location.city}`
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
      title: 'SystemFailed — Active Death Trap',
      description: 'A dangerous civic hazard has been reported. Check if it has been fixed.',
      ogImage: fallbackOg,
      ogUrl: shareUrl,
      spaUrl,
      canonicalTitle: 'SystemFailed — Active Death Trap',
    }),
  )
}
