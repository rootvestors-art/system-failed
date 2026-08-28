import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mic, MicOff, Sparkles, Loader2, Check, X, AlertCircle } from 'lucide-react'
import {
  runTriage,
  transcribeAudio,
  canRecordAudio,
  pickAudioMimeType,
  type TriageResult,
} from '../services/triage.ts'
import { resolveAgency, resolveJurisdiction, resolveRouting } from '../data/jurisdictions.ts'
import PhotoInput from './PhotoInput.tsx'

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
    'w-full bg-[#1a1a1a] border border-gray-700 text-white px-4 py-3 focus:border-blood focus:outline-none transition rounded'

  return (
    <div className="border border-gray-700 rounded-lg bg-charcoal/60 p-5 sm:p-6 mb-8">
      <div className="flex items-start gap-3 mb-1">
        <Sparkles className="text-caution shrink-0 mt-1" size={20} />
        <div>
          <h2 className="text-lg sm:text-xl font-header font-bold text-white leading-tight">
            Just tell us what's wrong
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Speak or type one sentence in your own language. We'll pick the department,
            write the formal complaint and fill this form for you.
          </p>
        </div>
      </div>

      {isDemo && (
        <div className="mt-4 rounded border border-sky-800 bg-sky-950/40 px-3 py-2 text-xs text-sky-200">
          <span className="font-bold">Sample report loaded.</span> This is example text so you
          can see the whole journey quickly — edit anything, or clear it and describe your own
          issue.
        </div>
      )}

      {/* Description + dictation */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <label className="block text-xs text-gray-500 uppercase font-bold tracking-widest">
            What is the problem?
          </label>
          {(recordSupported || speechSupported) && (
            <div className="flex items-center gap-2">
              <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                disabled={listening || recording || transcribing}
                className="bg-[#1a1a1a] border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 disabled:opacity-50"
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
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded border transition disabled:opacity-60 ${
                    recording
                      ? 'bg-blood border-blood text-white animate-pulse'
                      : 'border-gray-600 text-gray-300 hover:border-gray-400'
                  }`}
                >
                  {transcribing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Transcribing…
                    </>
                  ) : preparing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Preparing…
                    </>
                  ) : recording ? (
                    <>
                      <MicOff size={13} /> Stop
                    </>
                  ) : (
                    <>
                      <Mic size={13} /> Speak
                    </>
                  )}
                </button>
              ) : (
                speechSupported && (
                  <button
                    type="button"
                    onClick={toggleDictation}
                    className={`flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded border transition ${
                      listening
                        ? 'bg-blood border-blood text-white animate-pulse'
                        : 'border-gray-600 text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {listening ? <MicOff size={13} /> : <Mic size={13} />}
                    {listening ? 'Stop' : 'Speak'}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {preparing && (
          <p className="text-gray-400 text-xs mb-2">
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
          placeholder="e.g. Hamare gali mein bada khadda hai, raat mein dikhta nahi, koi gir jayega"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* Photo + location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">
            Photo (optional)
          </label>
          <PhotoInput value={photo} onChange={setPhoto} onError={setError} />
        </div>

        <div className="grid grid-cols-2 gap-2 content-start">
          <div>
            <label className="block text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">
              City
            </label>
            <input
              className={inputClass}
              placeholder="Bengaluru"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">
              State
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
        <p className="text-red-400 text-sm mt-4 flex items-center gap-2">
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
          {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {running ? 'Reading your report…' : 'Write my complaint'}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-gray-400 hover:text-white text-sm underline underline-offset-4"
        >
          I'll fill the form myself
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 border-t border-gray-700 pt-5">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
            <h3 className="text-white font-header font-bold uppercase text-sm tracking-wide">
              Here's your complaint
            </h3>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-1 rounded tracking-wider ${
                result.source === 'openai'
                  ? 'bg-green-900/40 text-green-400 border border-green-700'
                  : 'bg-yellow-900/30 text-yellow-500 border border-yellow-700'
              }`}
            >
              {result.source === 'openai'
                ? `Drafted by ${result.model ?? 'OpenAI'}`
                : 'Mocked — AI not connected'}
            </span>
          </div>

          {result.degraded_reason && (
            <p className="text-yellow-500/80 text-xs mb-4 flex items-center gap-1.5">
              <AlertCircle size={12} /> {result.degraded_reason}
            </p>
          )}

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Field label="Hazard" value={result.negligence_type.replace(/_/g, ' ')} />
            <Field label="Severity" value={result.severity} />
            <Field label="You wrote in" value={result.detected_language} />
            <Field label="Confidence" value={`${Math.round(result.confidence * 100)}%`} />
          </dl>

          {/* Life-safety first: some hazards need a phone call, not a ticket. */}
          {routing?.emergency && (
            <div className="mb-4 rounded border border-red-700 bg-red-950/40 p-3">
              <p className="text-red-300 text-xs font-bold uppercase tracking-widest mb-1">
                Do this first
              </p>
              <p className="text-red-100 text-sm">{routing.emergency}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                Suggested first router
              </p>
              {routing && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                    routing.confidence === 'medium'
                      ? 'border-gray-600 text-gray-400'
                      : 'border-yellow-800 text-yellow-500'
                  }`}
                >
                  {routing.confidence} confidence
                </span>
              )}
            </div>
            <p className="text-white text-sm font-bold">{routedAgency}</p>

            {routing?.whyThisRoute && (
              <p className="text-gray-400 text-xs mt-1.5">{routing.whyThisRoute}</p>
            )}

            {routing?.coResponsible && (
              <p className="text-gray-500 text-xs mt-1.5">
                <span className="text-gray-400">May also be responsible:</span>{' '}
                {routing.coResponsible}
              </p>
            )}

            <p className="text-gray-600 text-xs mt-1.5">
              You would otherwise have had to work this out yourself on{' '}
              {jurisdiction.existingPortal}.
            </p>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">
              Complaint text
            </p>
            <pre className="whitespace-pre-wrap text-gray-300 text-sm bg-[#141414] border border-gray-800 rounded p-3 max-h-48 overflow-y-auto font-sans">
              {result.complaint_body}
            </pre>
          </div>

          {result.missing_info.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">
                Worth adding
              </p>
              <ul className="text-gray-400 text-sm list-disc list-inside">
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
              <Check size={16} /> Looks right — continue
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="flex items-center gap-2 border border-gray-600 text-gray-300 px-4 py-3 font-bold uppercase text-sm hover:border-gray-400 transition rounded"
            >
              <X size={16} /> Redo
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
      <dt className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{label}</dt>
      <dd className="text-white text-sm font-bold mt-0.5 capitalize">{value}</dd>
    </div>
  )
}
