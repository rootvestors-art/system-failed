// Vercel Edge Function — generates OG images (1200×630 PNG) for incidents and hazards.
// All data arrives via query params so no DB lookup is needed at render time.
// The /share/* HTML endpoints pre-bake the params into the og:image URL.

import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

// ---------------------------------------------------------------------------
// Font loader (Inter Bold via jsDelivr — reliable CDN for npm packages)
// ---------------------------------------------------------------------------
async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    return await fetch(
      'https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-700-normal.woff2',
    ).then((r) => r.arrayBuffer())
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Design tokens (match the app's Tailwind config)
// ---------------------------------------------------------------------------
const C = {
  void: '#0a0a0a',
  charcoal: '#121212',
  blood: '#D90429',
  caution: '#eab308',
  gray800: '#1f2937',
  gray600: '#4b5563',
  gray400: '#9ca3af',
  gray300: '#d1d5db',
  white: '#ffffff',
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)

  const type = searchParams.get('type') ?? 'incident'
  const isHazard = type === 'hazard'

  // Shared
  const city = searchParams.get('city') ?? ''
  const state = searchParams.get('state') ?? ''
  const negligence = (searchParams.get('negligence') ?? '').replace(/_/g, ' ')

  // Incident-specific
  const caseId = searchParams.get('case_id') ?? ''
  const title = searchParams.get('title') ?? 'Civic Negligence Report'
  const deaths = Number(searchParams.get('deaths') ?? 0)
  const injuries = Number(searchParams.get('injuries') ?? 0)
  const agency = searchParams.get('agency') ?? ''
  const status = searchParams.get('status') ?? ''

  // Hazard-specific
  const severity = searchParams.get('severity') ?? ''
  const description = searchParams.get('description') ?? ''
  const severityColor: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: C.caution,
    Low: '#22c55e',
  }

  const accentColor = isHazard ? C.caution : C.blood

  const fontData = await loadFont()
  const fonts = fontData
    ? [{ name: 'Inter', data: fontData, weight: 700 as const, style: 'normal' as const }]
    : []

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return new ImageResponse(
    isHazard ? (
      // ── HAZARD card ──────────────────────────────────────────────────────
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: C.void,
          fontFamily: fonts.length ? 'Inter' : 'sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div style={{ display: 'flex', height: 8, backgroundColor: C.caution }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 64px' }}>
          {/* Brand + label row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', width: 6, height: 36, backgroundColor: C.caution, borderRadius: 2 }} />
              <span style={{ color: C.white, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
                SYSTEM<span style={{ color: C.blood }}>FAILED</span>
              </span>
            </div>
            <div style={{
              display: 'flex',
              backgroundColor: C.caution,
              color: '#000',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '6px 14px',
              borderRadius: 4,
            }}>
              ⚠ DEATH TRAP
            </div>
          </div>

          {/* Severity badge */}
          <div style={{ display: 'flex', marginBottom: 20 }}>
            <div style={{
              display: 'flex',
              backgroundColor: severityColor[severity] ?? C.gray800,
              color: C.white,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.12em',
              padding: '4px 12px',
              borderRadius: 4,
            }}>
              {severity.toUpperCase()} SEVERITY
            </div>
          </div>

          {/* Negligence type — big */}
          <div style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: C.white, lineHeight: 1.1, marginBottom: 16 }}>
            {negligence.toUpperCase()}
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', width: 8, height: 8, borderRadius: '50%', backgroundColor: C.caution }} />
            <span style={{ color: C.caution, fontSize: 20, fontWeight: 700, letterSpacing: '0.05em' }}>
              {[city, state].filter(Boolean).join(', ').toUpperCase()}
            </span>
          </div>

          {/* Description snippet */}
          {description && (
            <div style={{ display: 'flex', color: C.gray400, fontSize: 18, lineHeight: 1.5, maxWidth: 900, marginBottom: 24 }}>
              {description.length > 140 ? description.slice(0, 140) + '…' : description}
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Bottom row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: C.gray600, fontSize: 14, letterSpacing: '0.1em', fontWeight: 700 }}>
                REPORTED • NOT YET FIXED
              </span>
              <span style={{ color: C.gray400, fontSize: 13 }}>systemfailed.in</span>
            </div>
            <div style={{ display: 'flex', color: C.caution, fontSize: 14, fontWeight: 700, letterSpacing: '0.08em' }}>
              CHECK IF THIS IS FIXED →
            </div>
          </div>
        </div>
      </div>
    ) : (
      // ── INCIDENT card ─────────────────────────────────────────────────────
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: C.void,
          fontFamily: fonts.length ? 'Inter' : 'sans-serif',
        }}
      >
        {/* Left blood-red bar */}
        <div style={{ display: 'flex', width: '100%', height: '100%', position: 'absolute' }}>
          <div style={{ display: 'flex', width: 8, height: '100%', backgroundColor: C.blood }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 64px 48px 80px' }}>
          {/* Brand + case ID row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
            <span style={{ color: C.white, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
              SYSTEM<span style={{ color: C.blood }}>FAILED</span>
            </span>
            {caseId && (
              <span style={{ color: C.blood, fontSize: 14, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                CASE {caseId}
              </span>
            )}
          </div>

          {/* Title */}
          <div style={{
            display: 'flex',
            fontSize: title.length > 60 ? 38 : 46,
            fontWeight: 700,
            color: C.white,
            lineHeight: 1.15,
            marginBottom: 24,
            maxWidth: 950,
          }}>
            {title}
          </div>

          {/* Outcome badges */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {deaths > 0 && (
              <div style={{
                display: 'flex',
                backgroundColor: '#7f1d1d',
                color: '#fca5a5',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '4px 12px',
                borderRadius: 4,
              }}>
                {deaths} {deaths === 1 ? 'DEATH' : 'DEATHS'}
              </div>
            )}
            {injuries > 0 && (
              <div style={{
                display: 'flex',
                backgroundColor: '#78350f',
                color: '#fde68a',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '4px 12px',
                borderRadius: 4,
              }}>
                {injuries} INJURED
              </div>
            )}
            {negligence && (
              <div style={{
                display: 'flex',
                backgroundColor: C.charcoal,
                color: C.gray300,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '4px 12px',
                borderRadius: 4,
                border: `1px solid ${C.gray800}`,
              }}>
                {negligence.toUpperCase()}
              </div>
            )}
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', width: 8, height: 8, borderRadius: '50%', backgroundColor: C.blood }} />
            <span style={{ color: C.blood, fontSize: 20, fontWeight: 700, letterSpacing: '0.05em' }}>
              {[city, state].filter(Boolean).join(', ').toUpperCase()}
            </span>
          </div>

          {/* Agency */}
          {agency && (
            <div style={{ display: 'flex', color: C.gray400, fontSize: 16, marginBottom: 8, fontWeight: 700 }}>
              Responsible: {agency}
            </div>
          )}

          {/* Status */}
          {status && (
            <div style={{ display: 'flex', color: C.gray600, fontSize: 14, letterSpacing: '0.08em', fontWeight: 700 }}>
              STATUS: {status.replace(/_/g, ' ').toUpperCase()}
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Bottom tagline */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ color: C.gray600, fontSize: 14, letterSpacing: '0.1em', fontWeight: 700 }}>
              systemfailed.in
            </span>
            <span style={{ color: C.blood, fontSize: 14, fontWeight: 700, letterSpacing: '0.08em' }}>
              DOCUMENT. DEMAND. FIX.
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    },
  )
}
