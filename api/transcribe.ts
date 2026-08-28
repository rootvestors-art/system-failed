// Vercel Serverless Function — speech to text for the report intake.
//
// Why this exists rather than relying on the browser's SpeechRecognition API:
// that API is Chromium/Safari only (no Firefox), and Google's recogniser handles
// code-switched Hinglish poorly. An OpenAI transcription model works in every
// browser that can record audio and is materially better on Indian languages.
//
// The key is read from OPENAI_API_KEY server-side and never reaches the browser.

export const config = {
  api: {
    // Audio clips are larger than the default 1 MB body limit.
    bodyParser: { sizeLimit: '12mb' },
  },
}

/** ~30 s of Opus at typical bitrates lands well under this. */
const MAX_AUDIO_BYTES = 10 * 1024 * 1024

const ALLOWED_MIME = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a',
  'audio/m4a',
]

function extensionFor(mime: string): string {
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mp4') || mime.includes('m4a')) return 'mp4'
  if (mime.includes('mpeg')) return 'mp3'
  if (mime.includes('wav')) return 'wav'
  return 'webm'
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // The client falls back to on-device SpeechRecognition when this happens.
    return res.status(503).json({
      error: 'Transcription is not configured',
      reason: 'no_api_key',
    })
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body ?? {}
  const dataUrl: string = body.audio ?? ''
  const languageHint: string | undefined = body.language

  // The header can carry codec parameters — Chrome's MediaRecorder yields
  // `data:audio/webm;codecs=opus;base64,...` — so split on the first comma and
  // parse the parameter list, rather than assuming `mime;base64` exactly.
  const match = /^data:([^,]+),(.*)$/.exec(dataUrl)
  if (!match) {
    return res.status(400).json({ error: 'Send audio as a base64 data URL.' })
  }

  const header = match[1]
  const headerParts = header.split(';').map((p) => p.trim().toLowerCase())
  if (!headerParts.includes('base64')) {
    return res.status(400).json({ error: 'Audio must be base64 encoded.' })
  }

  const mime = headerParts[0]
  if (!ALLOWED_MIME.some((m) => mime.startsWith(m))) {
    return res.status(415).json({ error: `Unsupported audio format: ${mime}` })
  }

  let audio: Buffer
  try {
    audio = Buffer.from(match[2], 'base64')
  } catch {
    return res.status(400).json({ error: 'Could not decode the audio.' })
  }

  if (audio.byteLength === 0) {
    return res.status(400).json({ error: 'The recording was empty.' })
  }
  if (audio.byteLength > MAX_AUDIO_BYTES) {
    return res.status(413).json({ error: 'That recording is too long. Keep it under 30 seconds.' })
  }

  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-transcribe'

  try {
    const form = new FormData()
    form.append('file', new Blob([audio], { type: mime }), `speech.${extensionFor(mime)}`)
    form.append('model', model)
    // A hint improves accuracy but must not stop the model transcribing another
    // language — citizens routinely mix English into Hindi mid-sentence.
    if (languageHint && /^[a-z]{2}$/.test(languageHint)) {
      form.append('language', languageHint)
    }
    form.append(
      'prompt',
      'The speaker is an Indian citizen describing a civic infrastructure problem such as a pothole, open drain, exposed electrical wire, or an open pit. They may mix Hindi, Kannada, Tamil, Telugu, Marathi or Bengali with English.',
    )

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45_000)

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('OpenAI transcription failed', response.status, detail.slice(0, 400))
      return res.status(502).json({
        error: 'Could not transcribe that recording.',
        reason: `upstream_${response.status}`,
      })
    }

    const payload = await response.json()
    const text = typeof payload?.text === 'string' ? payload.text.trim() : ''

    if (!text) {
      return res.status(200).json({ text: '', model, empty: true })
    }

    return res.status(200).json({ text, model })
  } catch (err) {
    console.error('OpenAI transcription error', err)
    return res.status(504).json({ error: 'Transcription timed out.', reason: 'timeout' })
  }
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}
