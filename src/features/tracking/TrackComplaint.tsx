import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Clock,
  CheckCircle2,
  ArrowUpCircle,
  Loader2,
  FileText,
  MapPin,
  AlertTriangle,
  Copy,
} from 'lucide-react'
import { getIncidentById, getHazardById, markHazardFixed } from '../../services/incidents.ts'
import type { Incident, Hazard } from '../../types/incident.ts'
import {
  hazardStatus,
  incidentStatus,
  formatRemaining,
} from '../../utils/complaintStatus.ts'
import PhotoInput from '../../components/PhotoInput.tsx'
import { negligenceLabel } from '../../utils/formatters.ts'
import { useLang } from '../../i18n/index.tsx'
import { copyToClipboard } from '../../utils/share.ts'

type Tracked =
  | { kind: 'incident'; record: Incident }
  | { kind: 'hazard'; record: Hazard }

export default function TrackComplaint() {
  const { t, lang } = useLang()
  const { id } = useParams<{ id: string }>()
  const [tracked, setTracked] = useState<Tracked | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [copied, setCopied] = useState(false)

  const [afterPhoto, setAfterPhoto] = useState<File | null>(null)
  const [markingFixed, setMarkingFixed] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)

  async function handleMarkFixed() {
    if (!tracked || tracked.kind !== 'hazard') return
    setMarkingFixed(true)
    setFixError(null)
    try {
      const updated = await markHazardFixed(tracked.record.id, afterPhoto)
      if (updated) {
        setTracked({ kind: 'hazard', record: updated })
        setAfterPhoto(null)
      } else {
        setFixError('Could not update this report. Please try again.')
      }
    } catch {
      setFixError('Could not update this report. Please try again.')
    } finally {
      setMarkingFixed(false)
    }
  }

  useEffect(() => {
    if (!id) {
      setTracked(null)
      setLoading(false)
      return
    }
    let cancelled = false

    async function load() {
      // A reference could belong to either table; try the incident side first.
      const incident = await getIncidentById(id!).catch(() => null)
      if (!cancelled && incident) {
        setTracked({ kind: 'incident', record: incident })
        setLoading(false)
        return
      }
      const hazard = await getHazardById(id!).catch(() => null)
      if (!cancelled) {
        setTracked(hazard ? { kind: 'hazard', record: hazard } : null)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const derived = useMemo(() => {
    if (!tracked) return null
    const status =
      tracked.kind === 'hazard'
        ? hazardStatus(tracked.record, lang)
        : incidentStatus(tracked.record, lang)
    // Local aliases keep the existing JSX below unchanged.
    return {
      jurisdiction: status.jurisdiction,
      agency: status.agency,
      stages: status.ladder,
      activeIndex: status.activeIndex,
      active: status.active,
      daysLeft: status.daysLeft,
      elapsedDays: status.elapsedDays,
      resolved: status.resolved,
      progress: status.progress,
      escalations: status.escalations,
    }
  }, [tracked, lang])

  if (loading) {
    return (
      <main className="flex-grow max-w-3xl mx-auto px-4 py-20 w-full text-center">
        <Loader2 className="animate-spin text-ink-faint mx-auto" size={28} />
        <p className="text-ink-faint mt-4 text-sm">Looking up your reference…</p>
      </main>
    )
  }

  if (!tracked || !derived) {
    return <ReferenceLookup notFound={Boolean(id)} />
  }

  const { record } = tracked
  const { jurisdiction, agency, stages, active, daysLeft, resolved, escalations, progress } =
    derived

  const title =
    tracked.kind === 'incident'
      ? tracked.record.title
      : `${negligenceLabel(record.negligence_type)} — ${record.location.city}`

  async function handleCopy() {
    const ok = await copyToClipboard(window.location.href)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Header */}
      <div className="mb-8">
        <p className="text-ink-faint text-xs font-bold mb-2">
          Complaint tracker
        </p>
        <h1 className="text-2xl sm:text-3xl font-header font-bold text-ink leading-tight">
          {title}
        </h1>
        <div className="flex items-center gap-2 text-ink-faint text-sm mt-2">
          <MapPin size={14} />
          <span>
            {record.location.address ? `${record.location.address}, ` : ''}
            {record.location.city}, {record.location.state}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <code className="text-xs text-ink-muted bg-black/50 border border-line rounded px-2 py-1 font-mono break-all">
            {record.id}
          </code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition border border-line rounded px-2 py-1"
          >
            <Copy size={11} /> {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      {/* Status headline */}
      <div
        className={`rounded-lg border p-5 mb-8 ${
          resolved
            ? 'border-green-300 bg-green-50'
            : escalations > 0
              ? 'border-blood bg-red-50'
              : 'border-line bg-raised'
        }`}
      >
        {resolved ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-green-700 shrink-0 mt-0.5" size={22} />
            <div>
              <p className="text-ink font-bold">{t('track.markedFixed')}</p>
              <p className="text-ink-muted text-sm mt-1">
                {agency} has recorded this as resolved. If it isn't actually fixed,
                reopen it and the clock restarts from today.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Clock className="text-caution shrink-0 mt-0.5" size={22} />
            <div className="min-w-0">
              <p className="text-ink font-bold">
                {Number.isFinite(daysLeft)
                  ? `${t('track.sittingWith')} ${active?.authority ?? agency}`
                  : t('track.exhausted')}
              </p>
              <p className="text-ink-muted text-sm mt-1">
                {formatRemaining(daysLeft, lang)}
                {escalations > 0 && (
                  <>
                    {' '}
                    Already escalated{' '}
                    <span className="text-blood font-bold">
                      {escalations} time{escalations === 1 ? '' : 's'}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Departmental progress (simulated) */}
      <div className="mb-10">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <h2 className="text-lg font-header font-bold text-ink uppercase tracking-wide">
            {t('track.progress')}
          </h2>
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-300">
            {t('track.simulated')}
          </span>
        </div>

        <ol className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {progress.map((stage, i) => {
            const isCurrent =
              stage.reached && !progress[i + 1]?.reached
            return (
              <li key={stage.label}>
                <div
                  className={`h-1.5 rounded-full mb-2 ${
                    stage.reached ? 'bg-green-500' : 'bg-gray-800'
                  }`}
                />
                <p
                  className={`text-[11px] sm:text-xs font-bold leading-tight ${
                    isCurrent
                      ? 'text-ink'
                      : stage.reached
                        ? 'text-green-700'
                        : 'text-ink-faint'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-[10px] text-ink-faint mt-0.5 leading-tight hidden sm:block">
                  {stage.note}
                </p>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Escalation ladder */}
      <h2 className="text-lg font-header font-bold text-ink uppercase tracking-wide mb-1">
        {t('track.chain')}
      </h2>
      <p className="text-ink-faint text-sm mb-5">
        Each level gets a fixed window. When it lapses, the complaint moves up on its
        own — the citizen doesn't have to chase it.
      </p>

      <ol className="relative border-l border-line ml-3">
        {stages.map((stage, i) => (
          <li key={stage.label} className="mb-6 ml-6">
            <span
              className={`absolute -left-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
                stage.status === 'done'
                  ? 'bg-blood border-blood'
                  : stage.status === 'active'
                    ? 'bg-caution border-caution'
                    : 'bg-raised border-line'
              }`}
            >
              {stage.status === 'done' ? (
                <ArrowUpCircle size={12} className="text-ink" />
              ) : stage.status === 'active' ? (
                <Clock size={12} className="text-black" />
              ) : (
                <span className="text-ink-faint text-[10px] font-bold">{i + 1}</span>
              )}
            </span>

            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <p
                className={`font-bold text-sm ${
                  stage.status === 'pending' ? 'text-ink-faint' : 'text-ink'
                }`}
              >
                {stage.label}
              </p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  stage.status === 'done'
                    ? 'bg-red-50 text-blood'
                    : stage.status === 'active'
                      ? 'bg-caution/20 text-caution'
                      : 'text-ink-faint'
                }`}
              >
                {stage.status === 'done'
                  ? 'Window lapsed'
                  : stage.status === 'active'
                    ? 'With them now'
                    : 'Not yet reached'}
              </span>
            </div>
            <p className="text-ink-muted text-sm mt-0.5">{stage.authority}</p>
            {Number.isFinite(stage.windowDays) && (
              <p className="text-ink-faint text-xs mt-1">
                {stage.windowDays} day window · day {stage.startsAtDay}–{stage.endsAtDay}{' '}
                after filing
              </p>
            )}
          </li>
        ))}
      </ol>

      {/* The complaint itself */}
      <div className="mt-8 border border-line rounded-lg p-5 bg-raised">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={15} className="text-ink-faint" />
          <h3 className="text-ink font-bold text-xs">
            What was filed
          </h3>
        </div>
        <p className="text-ink-muted text-sm whitespace-pre-wrap">{record.description}</p>
        {record.image_url && (
          <img
            src={record.image_url}
            alt="Evidence"
            className="mt-4 w-full max-h-64 object-cover rounded border border-line"
          />
        )}
      </div>

      {/* Close the loop — only meaningful for a hazard that is still open */}
      {tracked.kind === 'hazard' && !resolved && (
        <div className="mt-8 border border-green-900/60 bg-green-50 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
            <div className="flex-1 min-w-0">
              <p className="text-ink font-bold text-sm">Has this been fixed?</p>
              <p className="text-ink-muted text-sm mt-1">
                If the hazard is gone, close this off so the public map stays accurate. Adding
                an "after" photo makes the record much harder to dispute.
              </p>

              {fixError && <p className="text-red-700 text-xs mt-3">{fixError}</p>}

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <PhotoInput
                  value={afterPhoto}
                  onChange={setAfterPhoto}
                  onError={setFixError}
                  label={'Add "after" photo'}
                  preview={false}
                  className="flex-1"
                />
                <button
                  onClick={handleMarkFixed}
                  disabled={markingFixed}
                  className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white px-5 py-2.5 font-bold uppercase text-sm rounded transition"
                >
                  {markingFixed ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Confirm it's fixed
                    </>
                  )}
                </button>
              </div>

              {afterPhoto && (
                <p className="text-ink-faint text-xs mt-2 truncate">
                  Attached: {afterPhoto.name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Honest disclosure */}
      <div className="mt-8 border border-amber-300 bg-amber-50 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
          <div className="text-sm">
            <p className="text-amber-700 font-bold mb-1">What's real and what isn't</p>
            <p className="text-ink-muted">
              The complaint, evidence, routing and escalation logic all run for real. What is{' '}
              <span className="text-ink font-semibold">mocked</span>: this prototype does
              not transmit to {jurisdiction.existingPortal} — no government system is
              contacted. The escalation windows are illustrative rather than statutory, and
              the clock advances against your filing time so the journey is demoable in one
              sitting.
            </p>
            <Link
              to="/how-it-works"
              className="inline-block mt-2 text-amber-600 hover:text-amber-700 font-bold text-xs tracking-wide"
            >
              Full disclosure &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          to={tracked.kind === 'hazard' ? `/deathtraps/${record.id}` : `/incident/${record.id}`}
          className="flex-1 text-center border border-line text-ink-muted px-6 py-3 font-bold uppercase text-sm rounded hover:border-gray-500 transition"
        >
          View public record
        </Link>
        <Link
          to="/report"
          className="flex-1 text-center bg-blood text-white px-6 py-3 font-bold uppercase text-sm rounded hover:bg-red-700 transition"
        >
          File another
        </Link>
      </div>
    </main>
  )
}

/**
 * Shown at /track with no reference, and when a reference doesn't resolve.
 * Lives here because it exists only to serve this route.
 */
function ReferenceLookup({ notFound }: { notFound: boolean }) {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const ref = value.trim()
    if (ref) navigate(`/track/${encodeURIComponent(ref)}`)
  }

  return (
    <main className="flex-grow max-w-md mx-auto px-4 py-16 sm:py-24 w-full">
      <div className="text-center mb-8">
        {notFound ? (
          <>
            <AlertTriangle className="text-yellow-600 mx-auto mb-4" size={32} />
            <h1 className="text-2xl font-header font-bold text-ink mb-2">
              No complaint found
            </h1>
            <p className="text-ink-faint text-sm">
              That reference doesn't match anything on record. Check it and try again.
            </p>
          </>
        ) : (
          <>
            <Clock className="text-caution mx-auto mb-4" size={32} />
            <h1 className="text-2xl font-header font-bold text-ink mb-2">
              Track a complaint
            </h1>
            <p className="text-ink-faint text-sm">
              Paste the reference you were given when you filed.
            </p>
          </>
        )}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Reference number"
          className="w-full bg-raised-2 border border-line text-ink px-4 py-3 rounded focus:border-blood focus:outline-none transition font-mono text-sm"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="w-full bg-white text-black px-6 py-3 font-bold uppercase text-sm rounded hover:bg-gray-200 transition disabled:opacity-40"
        >
          Look it up
        </button>
      </form>

      <p className="text-center text-ink-faint text-xs mt-6">
        Don't have one?{' '}
        <Link to="/report" className="text-blood hover:text-red-700 font-bold">
          File a complaint
        </Link>
      </p>
    </main>
  )
}
