import type { Incident, Hazard } from '../types/incident.ts'
import { getTotalDeaths, getTotalInjuries } from './victims.ts'
import { negligenceLabel } from './formatters.ts'

// ---------------------------------------------------------------------------
// State & type hashtag maps (India-focused)
// ---------------------------------------------------------------------------

const STATE_HASHTAGS: Record<string, string> = {
  Delhi: '#Delhi',
  Karnataka: '#Bengaluru',
  Maharashtra: '#Mumbai',
  'Tamil Nadu': '#Chennai',
  'Uttar Pradesh': '#UttarPradesh',
  'West Bengal': '#Kolkata',
  Telangana: '#Hyderabad',
  Gujarat: '#Gujarat',
  Rajasthan: '#Rajasthan',
  'Madhya Pradesh': '#MadhyaPradesh',
  Bihar: '#Bihar',
  'Andhra Pradesh': '#AndhraPradesh',
  Kerala: '#Kerala',
  Haryana: '#Haryana',
  Punjab: '#Punjab',
  Goa: '#Goa',
  Odisha: '#Odisha',
  Jharkhand: '#Jharkhand',
  Assam: '#Assam',
}

const TYPE_HASHTAGS: Record<string, string> = {
  Pothole: '#PotholeDeath',
  Open_Drain: '#OpenDrain',
  Electrocution: '#Electrocution',
  Collapse: '#StructuralCollapse',
  Open_Pit: '#OpenPit',
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Returns the shareable URL for an incident or hazard.
 * In production this points to the OG-meta HTML endpoint (/share/*).
 * In local dev it falls back to the direct SPA route.
 */
export function getShareUrl(type: 'incident' | 'hazard', id: string): string {
  if (typeof window === 'undefined') return ''
  const base = window.location.origin
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local')

  if (isLocal) {
    return type === 'incident'
      ? `${base}/incident/${id}`
      : `${base}/deathtraps/${id}`
  }
  return `${base}/share/${type}/${id}`
}

/**
 * Build the OG image URL, passing all card data as query params so the
 * Edge Function can render without a DB lookup.
 */
export function buildOgImageUrl(
  type: 'incident' | 'hazard',
  params: Record<string, string | number>,
): string {
  if (typeof window === 'undefined') return ''
  const base = window.location.origin
  const qs = new URLSearchParams({
    type,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  }).toString()
  return `${base}/api/og?${qs}`
}

// ---------------------------------------------------------------------------
// Hashtag generators
// ---------------------------------------------------------------------------

export function generateIncidentHashtags(incident: Incident): string[] {
  const tags = ['#SystemFailed', '#CivicNegligence']
  const stateTag = STATE_HASHTAGS[incident.location.state]
  if (stateTag) tags.push(stateTag)
  const typeTag = TYPE_HASHTAGS[incident.negligence_type]
  if (typeTag) tags.push(typeTag)
  return tags
}

export function generateHazardHashtags(hazard: Hazard): string[] {
  const tags = ['#SystemFailed', '#RoadSafety', '#CivicNegligence']
  const stateTag = STATE_HASHTAGS[hazard.location.state]
  if (stateTag) tags.push(stateTag)
  return tags
}

// ---------------------------------------------------------------------------
// Caption generators
// ---------------------------------------------------------------------------

export function generateIncidentCaption(
  incident: Incident,
  shareUrl: string,
): string {
  const deaths = getTotalDeaths(incident)
  const injuries = getTotalInjuries(incident)

  const outcomeStr = [
    deaths > 0 ? `${deaths} ${deaths === 1 ? 'Death' : 'Deaths'}` : null,
    injuries > 0 ? `${injuries} Injured` : null,
  ]
    .filter(Boolean)
    .join(' • ')

  const lines: string[] = [
    `${incident.location.city}, ${incident.location.state}`,
    incident.title,
    `${outcomeStr} • ${negligenceLabel(incident.negligence_type)}`,
  ]

  lines.push('')
  lines.push("Demand accountability. Share until it's answered.")
  lines.push(`More on systemfailed.in: ${shareUrl}`)
  lines.push(generateIncidentHashtags(incident).join(' '))

  return lines.join('\n')
}

export function generateHazardCaption(hazard: Hazard, shareUrl: string): string {
  const desc =
    hazard.description.length > 120
      ? hazard.description.slice(0, 120) + '…'
      : hazard.description

  const lines: string[] = [
    `⚠ DEATH TRAP | ${hazard.location.city}, ${hazard.location.state}`,
    `${hazard.severity.toUpperCase()}: ${negligenceLabel(hazard.negligence_type)}`,
    desc,
    '',
    'Check if this is fixed. Share with your ward office.',
    shareUrl,
    generateHazardHashtags(hazard).join(' '),
  ]

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Share link builders
// ---------------------------------------------------------------------------

export interface ShareLinks {
  whatsapp: string
  telegram: string
  twitter: string
  email: string
}

export function buildShareLinks(caption: string, shareUrl: string): ShareLinks {
  const encodedText = encodeURIComponent(caption)
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedSubject = encodeURIComponent('SystemFailed — Civic Negligence Report')
  // Twitter has a 280-char limit; use the first 3 lines + URL + hashtags
  const tweetLines = caption.split('\n')
  const tweetText = [
    ...tweetLines.slice(0, 3),
    '',
    tweetLines.at(-1) ?? '', // hashtags always last
  ].join('\n')

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
      caption.split('\n').slice(0, 3).join('\n'),
    )}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
    email: `mailto:?subject=${encodedSubject}&body=${encodedText}`,
  }
}

// ---------------------------------------------------------------------------
// Web Share API + clipboard helpers
// ---------------------------------------------------------------------------

/** Attempt navigator.share. Returns false if unsupported or user cancelled. */
export async function nativeShare(
  title: string,
  text: string,
  url: string,
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false
  try {
    await navigator.share({ title, text, url })
    return true
  } catch {
    return false
  }
}

/** Copy text to clipboard with graceful legacy fallback. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Legacy execCommand fallback
    const el = document.createElement('textarea')
    el.value = text
    el.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}
