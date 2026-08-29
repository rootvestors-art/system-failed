import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mic, MicOff, MessageSquare, Send, Loader2, Check, X, AlertCircle } from 'lucide-react'
import {
  runTriage,
  transcribeAudio,
  canRecordAudio,
  pickAudioMimeType,
  type TriageResult,
} from '../services/triage.ts'
import { resolveAgency, resolveJurisdiction, resolveRouting } from '../data/jurisdictions.ts'
import PhotoInput from './PhotoInput.tsx'
import { useLang } from '../i18n/index.tsx'

/** Hard stop on recording length — a description needs a sentence, not a monologue. */
const MAX_RECORDING_MS = 30_000

/**
 * Loaded by /report?demo=1 so a reviewer can complete the whole journey in
 * seconds without typing Hinglish or having a hazard photo to hand.
 */
const SAMPLE_REPORT = {
  text: 'Hamari gali mein pichle do hafte se bada khadda hai, koi barricade ya light nahi hai. Raat mein scooter walon ko dikhta hi nahi, kal ek aunty gir gayi thi.',
  city: 'Bengaluru',
  state: 'Karnataka',
}

/** Speech recognition locales worth offering an Indian citizen. */
const SPEECH_LANGS: Array<{ code: string; label: string }> = [
  { code: 'en-IN', label: 'English / Hinglish' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'bn-IN', label: 'বাংলা' },
]

export interface SmartIntakeApplied {
  result: TriageResult
  photo: File | null
  city: string
  state: string
  agency: string
}

interface Props {
  onApply: (applied: SmartIntakeApplied) => void
  onSkip: () => void
}

export default function SmartIntake({ onApply, onSkip }: Props) {
  const { t, lang } = useLang()
  const headFont = lang === 'hi' ? 'font-sans' : 'font-header'
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<TriageResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [listening, setListening] = useState(false)
  const [speechLang, setSpeechLang] = useState('en-IN')
  const recognitionRef = useRef<any>(null)

  const [recording, setRecording] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceSource, setVoiceSource] = useState<'openai' | 'browser' | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const autoStopRef = useRef<number>(0)

  const [searchParams] = useSearchParams()
  const isDemo = searchParams.get('demo') === '1'
  const demoStarted = useRef(false)

  const speechSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  const recordSupported = canRecordAudio()

  // /report?demo=1 — prefill a realistic report and triage it immediately.
  useEffect(() => {
    if (!isDemo || demoStarted.current) return
    demoStarted.current = true
    setText(SAMPLE_REPORT.text)
    setCity(SAMPLE_REPORT.city)
    setState(SAMPLE_REPORT.state)
    void triage(SAMPLE_REPORT.text, SAMPLE_REPORT.city, SAMPLE_REPORT.state, null)
  }, [isDemo])

  /**
   * Record a clip and send it to the server for transcription. Preferred over the
   * browser's own recogniser because it works outside Chromium and is far better
   * on code-switched Hinglish. Falls back automatically if the endpoint is absent.
   */
  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop()
      return
    }
    if (preparing) return

    setError(null)
    const mimeType = pickAudioMimeType()

    // The first tap has to clear the browser's permission prompt, which can take
    // seconds. Without a visible "preparing" state the button looks dead and
    // anything said during the prompt is lost — so say so before awaiting.
    setPreparing(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        window.clearTimeout(autoStopRef.current)
        setRecording(false)

        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' })
        // A blob this small holds container headers and no speech. Say so rather
        // than failing silently, which reads as "the mic is broken".
        if (blob.size < 1024) {
          setError('We did not catch anything. Tap Speak, wait for the red dot, then talk.')
          return
        }

        setTranscribing(true)
        const outcome = await transcribeAudio(blob, speechLang.slice(0, 2))
        setTranscribing(false)

        if (outcome.source === 'openai' && outcome.text) {
          setText((prev) => (prev ? `${prev} ${outcome.text}` : outcome.text).trim())
          setVoiceSource('openai')
          return
        }

        // Only fall back permanently when the server genuinely cannot help.
        // A timeout or a blip should not downgrade the rest of the session.
        const permanentlyUnavailable =
          outcome.reason === 'no_api_key' || outcome.reason === 'endpoint_missing'

        if (permanentlyUnavailable && speechSupported) {
          setVoiceSource('browser')
          setError('Voice transcription is not configured, so we will use your browser instead. Tap Speak and talk.')
        } else if (permanentlyUnavailable) {
          setError('Voice input is unavailable right now. Please type your description.')
        } else {
          setError('That recording did not come through. Please tap Speak and try again.')
        }
      }

      autoStopRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, MAX_RECORDING_MS)

      mediaRecorderRef.current = recorder
      // A timeslice makes chunks arrive during the recording rather than only on
      // stop, so a short clip still produces data.
      recorder.start(250)
      setPreparing(false)
      setRecording(true)
    } catch {
      setPreparing(false)
      setError(
        'We could not access your microphone. Allow microphone permission, or type your description instead.',
      )
    }
  }

  function toggleDictation() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = speechLang
    recognition.continuous = true
    recognition.interimResults = true

    let committed = text ? text + ' ' : ''

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) committed += chunk + ' '
        else interim += chunk
      }
      setText((committed + interim).replace(/\s+/g, ' ').trimStart())
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  /** Shared by the button and the ?demo=1 auto-run, which can't wait for state to settle. */
  async function triage(
    textVal: string,
    cityVal: string,
    stateVal: string,
    photoVal: File | null,
  ) {
    setRunning(true)
    setError(null)
    try {
      const outcome = await runTriage({
        text: textVal,
        photo: photoVal,
        city: cityVal,
        state: stateVal,
      })
      setResult(outcome)
    } catch {
      setError('Could not analyse that. You can still fill the form yourself.')
    } finally {
      setRunning(false)
    }
  }

  async function handleRun() {
    if (!text.trim() && !photo) {
      setError('Describe the problem in a sentence, or attach a photo.')
      return
    }
    await triage(text, city, state, photo)
  }

  function handleApply() {
    if (!result) return
    onApply({
      result,
      photo,
      city,
      state,
      agency: routing?.primaryAuthority ?? resolveAgency(city, state, result.negligence_type),
    })
  }

  const jurisdiction = resolveJurisdiction(city, state)
  // Routing needs the citizen's own words too: a mention of a metro pillar or a
  // national highway moves ownership away from the municipal body entirely.
  const routing = result
    ? resolveRouting(city, state, result.negligence_type, `${text} ${result.description}`)
    : null
  const routedAgency = routing?.primaryAuthority ?? null

  const inputClass =
    'w-full bg-raised-2 border border-line text-ink px-4 py-3 focus:border-blood focus:outline-none transition rounded'

  return (
    <div className="border border-line rounded-lg bg-raised p-5 sm:p-6 mb-8">
      <div className="flex items-start gap-3 mb-1">
        <MessageSquare className="text-civic shrink-0 mt-1" size={20} />
        <div>
          <h2 className={`text-lg sm:text-xl ${headFont} font-bold text-ink leading-tight`}>
            {t('intake.title')}
          </h2>
          <p className="text-ink-muted text-sm mt-1">
            {t('intake.sub')}
          </p>
        </div>
      </div>

      {isDemo && (
        <div className="mt-4 rounded border border-civic/30 bg-civic-soft px-3 py-2 text-xs text-civic">
          <span className="font-bold">Sample report loaded.</span> This is example text so you
          can see the whole journey quickly — edit anything, or clear it and describe your own
          issue.
        </div>
      )}

      {/* Description + dictation */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <label className="block text-xs text-ink-faint font-bold">
            {t('intake.problemLabel')}
          </label>
          {(recordSupported || speechSupported) && (
            <div className="flex items-center gap-2">
              <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                disabled={listening || recording || transcribing}
                className="bg-raised-2 border border-line text-ink-muted text-xs rounded px-2 py-1 disabled:opacity-50"
              >
                {SPEECH_LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>

              {/* Recording is the primary path; browser dictation is the fallback
                  once the server has told us it cannot help. */}
              {recordSupported && voiceSource !== 'browser' ? (
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={transcribing || preparing}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded border transition disabled:opacity-60 ${
                    recording
                      ? 'bg-blood border-blood text-white animate-pulse'
                      : 'border-gray-600 text-ink-muted hover:border-gray-400'
                  }`}
                >
                  {transcribing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> {t('intake.transcribing')}
                    </>
                  ) : preparing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> {t('intake.preparing')}
                    </>
                  ) : recording ? (
                    <>
                      <MicOff size={13} /> {t('intake.stop')}
                    </>
                  ) : (
                    <>
                      <Mic size={13} /> {t('intake.speak')}
                    </>
                  )}
                </button>
              ) : (
                speechSupported && (
                  <button
                    type="button"
                    onClick={toggleDictation}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded border transition ${
                      listening
                        ? 'bg-blood border-blood text-white animate-pulse'
                        : 'border-gray-600 text-ink-muted hover:border-gray-400'
                    }`}
                  >
                    {listening ? <MicOff size={13} /> : <Mic size={13} />}
                    {listening ? t('intake.stop') : t('intake.speak')}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {preparing && (
          <p className="text-ink-muted text-xs mb-2">
            Getting the microphone ready — allow access if your browser asks, then wait for the
            red dot before you speak.
          </p>
        )}

        {recording && (
          <p className="text-blood text-xs mb-2 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blood animate-pulse" />
            Listening — speak now, then tap Stop. Stops on its own after 30 seconds.
          </p>
        )}
        <textarea
          rows={3}
          className={inputClass}
          placeholder={t('intake.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* Photo + location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-xs text-ink-faint font-bold mb-2">
            {t('intake.photo')}
          </label>
          <PhotoInput value={photo} onChange={setPhoto} onError={setError} />
        </div>

        <div className="grid grid-cols-2 gap-2 content-start">
          <div>
            <label className="block text-xs text-ink-faint font-bold mb-2">
              {t('intake.city')}
            </label>
            <input
              className={inputClass}
              placeholder="Bengaluru"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-faint font-bold mb-2">
              {t('intake.state')}
            </label>
            <input
              className={inputClass}
              placeholder="Karnataka"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-700 text-sm mt-4 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {/* Action */}
      <div className="flex flex-wrap items-center gap-3 mt-5">
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 bg-blood text-white px-5 py-3 font-bold uppercase text-sm hover:bg-red-700 transition disabled:opacity-60 rounded"
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {running ? t('intake.reading') : t('intake.submit')}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-ink-muted hover:text-ink text-sm underline underline-offset-4"
        >
          {t('intake.manual')}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
            <h3 className="text-ink font-header font-bold uppercase text-sm tracking-wide">
              {t('intake.result.title')}
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded tracking-wider ${
                result.source === 'openai'
                  ? 'bg-green-50 text-green-700 border border-green-300'
                  : 'bg-amber-50 text-amber-600 border border-yellow-700'
              }`}
            >
              {result.source === 'openai'
                ? `Drafted by ${result.model ?? 'OpenAI'}`
                : t('intake.result.mocked')}
            </span>
          </div>

          {result.degraded_reason && (
            <p className="text-amber-600/80 text-xs mb-4 flex items-center gap-1.5">
              <AlertCircle size={12} /> {result.degraded_reason}
            </p>
          )}

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Field label={t('intake.result.hazard')} value={result.negligence_type.replace(/_/g, ' ')} />
            <Field label={t('intake.result.severity')} value={result.severity} />
            <Field label={t('intake.result.language')} value={result.detected_language} />
            <Field label={t('intake.result.confidence')} value={`${Math.round(result.confidence * 100)}%`} />
          </dl>

          {/* Life-safety first: some hazards need a phone call, not a ticket. */}
          {routing?.emergency && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 p-3">
              <p className="text-red-700 text-xs font-bold mb-1">
                {t('intake.result.doFirst')}
              </p>
              <p className="text-red-900 text-sm">{routing.emergency}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
              <p className="text-xs text-ink-faint font-bold">
                {t('intake.result.router')}
              </p>
              {routing && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    routing.confidence === 'medium'
                      ? 'border-gray-600 text-ink-muted'
                      : 'border-amber-300 text-amber-600'
                  }`}
                >
                  {routing.confidence} confidence
                </span>
              )}
            </div>
            <p className="text-ink text-sm font-bold">{routedAgency}</p>

            {routing?.whyThisRoute && (
              <p className="text-ink-muted text-xs mt-1.5">{routing.whyThisRoute}</p>
            )}

            {routing?.coResponsible && (
              <p className="text-ink-faint text-xs mt-1.5">
                <span className="text-ink-muted">{t('intake.result.alsoResponsible')}:</span>{' '}
                {routing.coResponsible}
              </p>
            )}

            <p className="text-ink-faint text-xs mt-1.5">
              {t('intake.result.instead')}{' '}
              {jurisdiction.existingPortal}.
            </p>
          </div>

          <div className="mb-4">
            <p className="text-xs text-ink-faint font-bold mb-1">
              {t('intake.result.complaintText')}
            </p>
            <pre className="whitespace-pre-wrap text-ink-muted text-sm bg-raised-2 border border-line rounded p-3 max-h-48 overflow-y-auto font-sans">
              {result.complaint_body}
            </pre>
          </div>

          {result.missing_info.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-ink-faint font-bold mb-1">
                {t('intake.result.worthAdding')}
              </p>
              <ul className="text-ink-muted text-sm list-disc list-inside">
                {result.missing_info.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 bg-white text-black px-5 py-3 font-bold uppercase text-sm hover:bg-gray-200 transition rounded"
            >
              <Check size={16} /> {t('intake.result.accept')}
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="flex items-center gap-2 border border-gray-600 text-ink-muted px-4 py-3 font-bold uppercase text-sm hover:border-gray-400 transition rounded"
            >
              <X size={16} /> {t('intake.result.redo')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-ink-faint font-bold">{label}</dt>
      <dd className="text-ink text-sm font-bold mt-0.5 capitalize">{value}</dd>
    </div>
  )
}
