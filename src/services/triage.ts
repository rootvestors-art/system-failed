export interface TriageResult {
  negligence_type:
    | 'Pothole'
    | 'Open_Drain'
    | 'Electrocution'
    | 'Collapse'
    | 'Open_Pit'
    | 'Street_Light'
    | 'Road_Design'
    | 'Broken_Footpath'
    | 'Waterlogging'
    | 'Debris'
    | 'Dangerous_Structure'
    | 'Garbage_Waste'
    | 'Water_Leak'
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  title: string
  description: string
  complaint_body: string
  detected_language: string
  translated_text: string
  recommended_report_type: 'incident' | 'hazard'
  confidence: number
  missing_info: string[]
  source: 'openai' | 'mock'
  model?: string
  degraded_reason?: string
}

/**
 * Shrink a photo before it leaves the device.
 *
 * Two reasons: a 6 MB phone photo on a 3G connection is a 30-second upload the
 * citizen will abandon, and the triage endpoint only needs enough resolution to
 * recognise a pothole. 1024px on the long edge at q=0.7 is typically under 150 KB.
 */
export async function compressImage(file: File, maxEdge = 1024, quality = 0.7): Promise<string> {
  const bitmap = await loadBitmap(file)

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      /* fall through to the <img> path */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = URL.createObjectURL(file)
  })
}

// ---------------------------------------------------------------------------
// Speech to text
// ---------------------------------------------------------------------------

export interface TranscriptionOutcome {
  text: string
  /** 'openai' when the server transcribed it; 'unavailable' when the caller should fall back. */
  source: 'openai' | 'unavailable'
  reason?: string
}

/** Pick a container the browser can actually record. Safari only does mp4. */
export function pickAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

export function canRecordAudio(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  )
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the recording'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Send a recorded clip to `/api/transcribe`.
 *
 * Returns `source: 'unavailable'` rather than throwing when the endpoint is
 * missing (bare `vite dev`) or unconfigured (no API key), so the caller can fall
 * back to the browser's own recogniser instead of showing an error.
 */
export async function transcribeAudio(
  blob: Blob,
  languageHint?: string,
): Promise<TranscriptionOutcome> {
  try {
    const audio = await blobToDataUrl(blob)
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio, language: languageHint }),
    })

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      // Vite dev server hands back index.html — the function isn't running.
      return { source: 'unavailable', text: '', reason: 'endpoint_missing' }
    }

    const payload = await response.json()

    if (!response.ok) {
      return {
        source: 'unavailable',
        text: '',
        reason: payload?.reason ?? `http_${response.status}`,
      }
    }

    return { source: 'openai', text: String(payload?.text ?? '') }
  } catch {
    return { source: 'unavailable', text: '', reason: 'network' }
  }
}

export interface TriageInput {
  text: string
  photo?: File | null
  city?: string
  state?: string
}

/**
 * Ask the triage endpoint to turn a plain-language description into a
 * structured complaint.
 *
 * `/api/triage` is a Vercel Serverless Function, so it does not exist under a
 * bare `vite dev` server. When it is unreachable we fall back to the local
 * heuristic below so the journey still completes on localhost — the returned
 * `source` is always surfaced in the UI, so a mocked answer is never presented
 * as a model answer.
 */
export async function runTriage(input: TriageInput): Promise<TriageResult> {
  let image: string | undefined
  if (input.photo) {
    try {
      image = await compressImage(input.photo)
    } catch {
      image = undefined
    }
  }

  try {
    const response = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input.text,
        image,
        city: input.city ?? '',
        state: input.state ?? '',
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      // Vite dev server answers with the SPA's index.html — endpoint isn't running.
      throw new Error('Endpoint not available')
    }

    return (await response.json()) as TriageResult
  } catch {
    return localFallback(input.text, input.city ?? '')
  }
}

/**
 * Compact mirror of the server-side heuristic in `api/triage.ts`.
 *
 * Duplicated rather than shared because the two run in different build targets
 * (browser bundle vs. Vercel function). Kept deliberately small; the server
 * version is the one that matters in production.
 */
function localFallback(text: string, city: string): TriageResult {
  const t = text.toLowerCase()

  const rules = [
    { type: 'Street_Light' as const, severity: 'High' as const, keys: ['streetlight', 'street light', 'street lights', 'no light', 'lights not working', 'lighting', 'andhera', 'dark at night', 'no lamp'] },
    { type: 'Road_Design' as const, severity: 'High' as const, keys: ['blind turn', 'sharp turn', '90 degree', 'junction', 'no signage', 'no sign board', 'divider', 'crash barrier', 'no crossing', 'u-turn'] },
    { type: 'Electrocution' as const, severity: 'Critical' as const, keys: ['wire', 'current', 'shock', 'electric', 'bijli', 'karant', 'transformer'] },
    { type: 'Open_Pit' as const, severity: 'Critical' as const, keys: ['pit', 'khadda', 'gaddha', 'trench', 'excavat', 'dug'] },
    { type: 'Open_Drain' as const, severity: 'High' as const, keys: ['drain', 'nala', 'nallah', 'sewer', 'manhole', 'gutter'] },
    { type: 'Collapse' as const, severity: 'Critical' as const, keys: ['collapse', 'building', 'wall', 'slab', 'bridge'] },
    { type: 'Dangerous_Structure' as const, severity: 'Critical' as const, keys: ['metro pillar', 'pillar', 'crack', 'leaning', 'facade', 'unsafe building', 'about to fall'] },
    { type: 'Garbage_Waste' as const, severity: 'Medium' as const, keys: ['garbage', 'kachra', 'stink', 'smell', 'badbu', 'dumping', 'disease', 'mosquito', 'sewage'] },
    { type: 'Water_Leak' as const, severity: 'Medium' as const, keys: ['leak', 'burst', 'pipeline', 'water main'] },
    { type: 'Waterlogging' as const, severity: 'High' as const, keys: ['waterlog', 'flood', 'paani bhara', 'standing water', 'jal jamav'] },
    { type: 'Broken_Footpath' as const, severity: 'Medium' as const, keys: ['footpath', 'pavement', 'sidewalk', 'futpath'] },
    { type: 'Debris' as const, severity: 'Medium' as const, keys: ['debris', 'rubble', 'malba', 'garbage', 'kachra', 'construction material'] },
    { type: 'Pothole' as const, severity: 'High' as const, keys: ['pothole', 'gadde', 'road', 'sadak', 'crater'] },
  ]

  const matched =
    rules.find((r) => r.keys.some((k) => t.includes(k))) ??
    { type: 'Pothole' as const, severity: 'Medium' as const, keys: [] as string[] }

  const casualty = /(died|death|killed|mar gaya|fatal|dead)/.test(t)
  const injured = /(injur|ghayal|hurt|fracture|hospital)/.test(t)
  const label = matched.type.replace(/_/g, ' ').toLowerCase()
  const where = city ? ` in ${city}` : ''

  return {
    negligence_type: matched.type,
    severity: casualty ? 'Critical' : matched.severity,
    title: `Unrepaired ${label}${where} endangering the public`,
    description: `A citizen has reported an unrepaired ${label}${where}. It presents an immediate danger to pedestrians and two-wheeler riders and has not been attended to by the responsible department.`,
    complaint_body: `To the concerned department,\n\nI wish to report an unrepaired ${label}${where}. In its present condition it poses a serious risk to public safety.\n\nCitizen's own account: "${text.trim()}"\n\nI request that the hazard be inspected and repaired within the published redressal window.\n\nRegards,\nA concerned citizen`,
    detected_language: /[ऀ-ॿಀ-೿஀-௿ఀ-౿ঀ-৿]/.test(text) ? 'Indic script detected' : 'English',
    translated_text: text.trim(),
    recommended_report_type: casualty || injured ? 'incident' : 'hazard',
    confidence: matched.keys.length ? 0.55 : 0.3,
    missing_info: ['Nearest landmark', 'How long the hazard has existed'],
    source: 'mock',
    degraded_reason: 'Triage endpoint unreachable — using on-device keyword matching',
  }
}
