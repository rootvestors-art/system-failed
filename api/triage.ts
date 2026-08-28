// Vercel Serverless Function — civic hazard triage.
//
// Takes what a citizen actually has (a photo and one sentence in their own
// language) and returns the structured, correctly-worded complaint that a
// municipal portal would otherwise demand they assemble themselves.
//
// The OpenAI key is read from OPENAI_API_KEY server-side and is never exposed
// to the browser. If no key is configured the endpoint returns a clearly
// labelled heuristic fallback (source: 'mock') so the journey stays demoable.

const NEGLIGENCE_TYPES = [
  'Pothole',
  'Open_Drain',
  'Electrocution',
  'Collapse',
  'Open_Pit',
  'Street_Light',
  'Road_Design',
  'Broken_Footpath',
  'Waterlogging',
  'Debris',
  'Dangerous_Structure',
  'Garbage_Waste',
  'Water_Leak',
] as const

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const

type NegligenceType = (typeof NEGLIGENCE_TYPES)[number]
type Severity = (typeof SEVERITIES)[number]

export interface TriageResult {
  negligence_type: NegligenceType
  severity: Severity
  title: string
  description: string
  complaint_body: string
  detected_language: string
  translated_text: string
  recommended_report_type: 'incident' | 'hazard'
  confidence: number
  missing_info: string[]
  /** 'openai' when a real model answered, 'mock' for the keyword fallback */
  source: 'openai' | 'mock'
  model?: string
}

const SYSTEM_PROMPT = `You are a civic grievance intake assistant for Indian municipal services.

A citizen will describe a public infrastructure hazard in their own words — often in Hindi, Kannada, Tamil, Telugu, Marathi, Bengali or Hinglish — and may attach a photo. Your job is to convert that into the structured, formally-worded complaint that a municipal portal requires, so the citizen does not have to navigate department dropdowns or write bureaucratic English themselves.

Rules:
- Classify negligence_type as exactly one of these values, and never invent a new one. The category decides which department receives the complaint, so choosing precisely matters more than choosing quickly:
  - Pothole — broken or cratered road surface.
  - Open_Drain — uncovered drain, nala, sewer, manhole or chamber.
  - Electrocution — ONLY an electrical shock risk: an exposed or sagging live wire, a damaged transformer, an electrified pole or fence. Do NOT use this merely because electricity is mentioned.
  - Collapse — a structure that has fallen or is failing: wall, slab, ceiling, bridge, building.
  - Open_Pit — an excavation, trench, borewell or dug-up shaft left unguarded.
  - Street_Light — street lighting that is missing, broken or switched off. Darkness is a lighting fault, NOT an electrocution risk. This is the correct choice for "no streetlights", "lights not working", "andhera".
  - Road_Design — the road layout itself is dangerous: a blind or sharp turn, an unmarked junction, a missing crash barrier, divider or warning sign, no pedestrian crossing.
  - Broken_Footpath — absent, broken or obstructed pavement forcing people onto the carriageway.
  - Waterlogging — standing water or flooding on a road or path from drainage failure.
  - Debris — construction material or rubble physically obstructing a road or footpath.
  - Dangerous_Structure — a structure that has NOT yet failed but looks unsafe: a cracked or leaning metro pillar, flyover or bridge, a crumbling facade, an unsafe building or unguarded construction site. Use Collapse only when something has already fallen.
  - Garbage_Waste — uncollected garbage, an overflowing bin, a dumping black spot, or stagnant waste and sewage creating a stench or disease risk. This is a public-health problem, distinct from Debris (which is about obstruction) and Open_Drain (which is about falling in).
  - Water_Leak — a burst main, leaking pipeline or continuously overflowing sewer, which belongs to the water utility rather than the roads department.
- If a report describes more than one problem, choose the one posing the greatest danger, and mention the others in the description.
- severity must be one of: Low, Medium, High, Critical. Base it on danger to life, not on inconvenience. An open pit or live wire on a public path is Critical. A shallow pothole on a quiet lane is Low.
- recommended_report_type is "incident" ONLY if the citizen states someone was already killed or seriously injured. Otherwise "hazard" (preventive report).
- NEVER invent victims, names, ages, dates, casualty counts, officer names or case numbers. If the citizen did not say it, leave it out and list it in missing_info.
- title: a short factual English headline, max 90 characters, no sensationalism.
- description: 2-3 factual sentences in English describing what is wrong and why it is dangerous.
- complaint_body: a formal complaint addressed to the responsible municipal department. Polite, specific, cites the location, states the danger, and requests time-bound repair. Do not fabricate statute numbers or section references.
- detected_language: the language the citizen wrote in, in English (e.g. "Hindi", "Kannada", "English", "Hinglish").
- translated_text: a faithful English translation of what the citizen said. If already English, repeat it.
- confidence: 0 to 1, how confident you are in the classification given the evidence.
- missing_info: short prompts for anything important the citizen should still add (e.g. "nearest landmark", "how long it has been like this"). Empty array if nothing is needed.

Respond with a single JSON object and nothing else.`

function jsonSchemaHint(): string {
  return `{
  "negligence_type": "Pothole|Open_Drain|Electrocution|Collapse|Open_Pit|Street_Light|Road_Design|Broken_Footpath|Waterlogging|Debris|Dangerous_Structure|Garbage_Waste|Water_Leak",
  "severity": "Low|Medium|High|Critical",
  "title": "string",
  "description": "string",
  "complaint_body": "string",
  "detected_language": "string",
  "translated_text": "string",
  "recommended_report_type": "incident|hazard",
  "confidence": 0.0,
  "missing_info": ["string"]
}`
}

// ---------------------------------------------------------------------------
// Heuristic fallback — used only when OPENAI_API_KEY is absent.
// Deliberately simple and always labelled source:'mock' in the response so the
// UI can tell the user the AI layer is not live.
// ---------------------------------------------------------------------------
function mockTriage(text: string, city: string): TriageResult {
  const t = text.toLowerCase()

  const rules: Array<{ type: NegligenceType; severity: Severity; keys: string[] }> = [
    { type: 'Street_Light', severity: 'High', keys: ['streetlight', 'street light', 'street lights', 'no light', 'lights not working', 'lighting', 'andhera', 'no lamp'] },
    { type: 'Road_Design', severity: 'High', keys: ['blind turn', 'sharp turn', '90 degree', 'junction', 'no signage', 'divider', 'crash barrier', 'no crossing'] },
    { type: 'Electrocution', severity: 'Critical', keys: ['wire', 'current', 'shock', 'electric', 'bijli', 'karant', 'transformer', 'pole'] },
    { type: 'Open_Pit', severity: 'Critical', keys: ['pit', 'hole dug', 'khadda', 'gaddha', 'trench', 'excavat', 'dug'] },
    { type: 'Open_Drain', severity: 'High', keys: ['drain', 'nala', 'nallah', 'sewer', 'manhole', 'gutter', 'chamber'] },
    { type: 'Collapse', severity: 'Critical', keys: ['collapse', 'fell', 'building', 'wall', 'slab', 'bridge', 'girder'] },
    { type: 'Dangerous_Structure', severity: 'Critical', keys: ['metro pillar', 'pillar', 'crack', 'leaning', 'facade', 'unsafe building', 'about to fall', 'girne wala'] },
    { type: 'Garbage_Waste', severity: 'Medium', keys: ['garbage', 'kachra', 'stink', 'smell', 'badbu', 'dumping', 'waste pile', 'disease', 'mosquito', 'sewage'] },
    { type: 'Water_Leak', severity: 'Medium', keys: ['leak', 'burst', 'pipeline', 'water main', 'paani beh raha'] },
    { type: 'Waterlogging', severity: 'High', keys: ['waterlog', 'flood', 'paani bhara', 'standing water'] },
    { type: 'Broken_Footpath', severity: 'Medium', keys: ['footpath', 'pavement', 'sidewalk'] },
    { type: 'Debris', severity: 'Medium', keys: ['debris', 'rubble', 'malba', 'garbage', 'kachra'] },
    { type: 'Pothole', severity: 'High', keys: ['pothole', 'gadde', 'gaddi', 'road', 'sadak', 'bump', 'crater'] },
  ]

  let matched = rules.find((r) => r.keys.some((k) => t.includes(k)))
  if (!matched) matched = { type: 'Pothole', severity: 'Medium', keys: [] }

  const casualty = /(died|death|killed|mar gaya|mrityu|fatal|dead)/.test(t)
  const injured = /(injur|ghayal|hurt|fracture|hospital)/.test(t)

  const where = city ? ` in ${city}` : ''
  const label = matched.type.replace(/_/g, ' ').toLowerCase()

  return {
    negligence_type: matched.type,
    severity: casualty ? 'Critical' : matched.severity,
    title: `Unrepaired ${label}${where} endangering the public`,
    description: `A citizen has reported an unrepaired ${label}${where}. It presents an immediate danger to pedestrians and two-wheeler riders, and has not been attended to by the responsible department.`,
    complaint_body: `To the concerned department,\n\nI wish to report an unrepaired ${label}${where}. In its present condition it poses a serious and immediate risk to public safety, particularly to pedestrians and two-wheeler riders.\n\nCitizen's own account: "${text.trim()}"\n\nI request that the hazard be inspected and repaired within the published redressal window, and that the action taken be recorded against this complaint.\n\nRegards,\nA concerned citizen`,
    detected_language: /[ऀ-ॿಀ-೿஀-௿ఀ-౿ঀ-৿]/.test(text)
      ? 'Indic script detected'
      : 'English',
    translated_text: text.trim(),
    recommended_report_type: casualty || injured ? 'incident' : 'hazard',
    confidence: matched.keys.length ? 0.55 : 0.3,
    missing_info: ['Nearest landmark', 'How long the hazard has existed'],
    source: 'mock',
  }
}

// ---------------------------------------------------------------------------
// Validation — never trust the model's shape blindly.
// ---------------------------------------------------------------------------
function coerce(raw: any, fallbackText: string, city: string): TriageResult {
  const safe = mockTriage(fallbackText, city)

  const type = NEGLIGENCE_TYPES.includes(raw?.negligence_type)
    ? raw.negligence_type
    : safe.negligence_type
  const severity = SEVERITIES.includes(raw?.severity) ? raw.severity : safe.severity

  const str = (v: any, fb: string, max = 4000) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : fb

  return {
    negligence_type: type,
    severity,
    title: str(raw?.title, safe.title, 140),
    description: str(raw?.description, safe.description),
    complaint_body: str(raw?.complaint_body, safe.complaint_body),
    detected_language: str(raw?.detected_language, safe.detected_language, 60),
    translated_text: str(raw?.translated_text, safe.translated_text),
    recommended_report_type:
      raw?.recommended_report_type === 'incident' ? 'incident' : 'hazard',
    confidence:
      typeof raw?.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1
        ? raw.confidence
        : 0.6,
    missing_info: Array.isArray(raw?.missing_info)
      ? raw.missing_info.filter((s: any) => typeof s === 'string').slice(0, 6)
      : [],
    source: 'openai',
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body ?? {}
  const text: string = (body.text ?? '').toString().slice(0, 2000)
  const imageDataUrl: string | undefined = body.image
  const city: string = (body.city ?? '').toString().slice(0, 120)
  const state: string = (body.state ?? '').toString().slice(0, 120)

  if (!text.trim() && !imageDataUrl) {
    return res.status(400).json({ error: 'Describe the problem or attach a photo.' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4o'

  // No key configured — return the labelled fallback rather than failing.
  if (!apiKey) {
    return res.status(200).json(mockTriage(text, city))
  }

  const userContent: any[] = [
    {
      type: 'text',
      text: `Citizen's description: ${text || '(none provided — rely on the photo)'}
Reported location: ${city || 'unknown city'}, ${state || 'unknown state'}

Return JSON in exactly this shape:
${jsonSchemaHint()}`,
    },
  ]

  if (imageDataUrl?.startsWith('data:image/')) {
    userContent.push({ type: 'image_url', image_url: { url: imageDataUrl, detail: 'low' } })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45_000)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('OpenAI triage failed', response.status, detail.slice(0, 500))
      // Degrade rather than block the citizen's journey.
      return res.status(200).json({
        ...mockTriage(text, city),
        degraded_reason: `Model unavailable (HTTP ${response.status})`,
      })
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content ?? '{}'
    const parsed = coerce(safeParse(content), text, city)

    return res.status(200).json({ ...parsed, model })
  } catch (err) {
    console.error('OpenAI triage error', err)
    return res.status(200).json({
      ...mockTriage(text, city),
      degraded_reason: 'Model request timed out',
    })
  }
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}
