import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  Plus,
  X,
  AlertTriangle,
  FileText,
  Users,
} from 'lucide-react'
import type { NegligenceType, OutcomeType, HazardSeverity, Victim } from '../types/incident.ts'
import {
  createIncident,
  createHazard,
  findNearbyHazards,
  upvoteHazard,
  type NearbyMatch,
} from '../services/incidents.ts'
import { formatDistance } from '../utils/geo.ts'
import { formatRelativeTime, negligenceLabel } from '../utils/formatters.ts'
// Leaflet is ~150 KB gzipped. Loading it only when the picker actually renders
// keeps the first paint cheap on a slow connection.
const LocationPicker = lazy(() => import('./LocationPicker.tsx'))
import SmartIntake, { type SmartIntakeApplied } from './SmartIntake.tsx'
import PhotoInput from './PhotoInput.tsx'
import { guessNegligenceType, annotateCustomType } from '../utils/negligence.ts'
import { useLang } from '../i18n/index.tsx'

const negligenceTypes: NegligenceType[] = [
  'Pothole',
  'Street_Light',
  'Road_Design',
  'Open_Drain',
  'Waterlogging',
  'Broken_Footpath',
  'Electrocution',
  'Open_Pit',
  'Collapse',
  'Debris',
  'Dangerous_Structure',
  'Garbage_Waste',
  'Water_Leak',
]

const negligenceTypesWithOther = [...negligenceTypes, 'Other' as const]

const severityLevels: HazardSeverity[] = ['Low', 'Medium', 'High', 'Critical']

type ReportType = 'incident' | 'hazard'

interface FormData {
  report_type: ReportType
  // Incident-specific
  title: string
  victims: Victim[]
  date_of_incident: string
  agency: string
  mla: string
  mp: string
  // Hazard-specific
  severity: HazardSeverity
  // Shared
  photo: File | null
  address: string
  city: string
  state: string
  coordinates?: { lat: number; lng: number }
  negligence_type: NegligenceType | ''
  custom_negligence_type: string
  description: string
  evidence_links: string[]
}

const initialForm: FormData = {
  report_type: 'incident',
  title: '',
  victims: [{ outcome: 'Death' }],
  date_of_incident: '',
  agency: '',
  mla: '',
  mp: '',
  severity: 'Medium',
  photo: null,
  address: '',
  city: '',
  state: '',
  negligence_type: '',
  custom_negligence_type: '',
  description: '',
  evidence_links: [],
}

export default function ReportForm() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState<{ id: string; type: ReportType } | null>(null)

  /** The AI intake is the default front door; the manual form is the escape hatch. */
  const [intakeDone, setIntakeDone] = useState(false)
  const [prefilledBy, setPrefilledBy] = useState<'openai' | 'mock' | null>(null)

  /** Open reports that look like the same hazard, found at submit time. */
  const [nearby, setNearby] = useState<NearbyMatch[]>([])
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false)
  const [joining, setJoining] = useState(false)

  /**
   * "This is the same issue" — add weight to the existing report instead of
   * creating a duplicate ticket. Forty reports of one pothole should be one work
   * order with forty followers.
   */
  async function joinExisting(match: NearbyMatch) {
    setJoining(true)
    setError(null)
    try {
      await upvoteHazard(match.hazard.id)
    } catch (err) {
      // `upvoteHazard` throws when this browser already voted. That is not a
      // failure from the citizen's point of view — they still want the tracker.
      if (!(err instanceof Error && /already upvoted/i.test(err.message))) {
        setError('Could not add your voice to that report. Please try again.')
        setJoining(false)
        return
      }
    }
    setJoining(false)
    navigate(`/track/${match.hazard.id}`)
  }

  /** "Mine is a different problem" — file it as a new report. */
  function fileAnyway() {
    setNearby([])
    setSkipDuplicateCheck(true)
    void handleSubmit()
  }

  const isHazard = form.report_type === 'hazard'
  const totalSteps = isHazard ? 1 : 3

  /** Apply a triage result onto the form so the citizen only has to confirm it. */
  function applyIntake({ result, photo, city, state, agency }: SmartIntakeApplied) {
    setForm((prev) => ({
      ...prev,
      report_type: result.recommended_report_type,
      title: result.title,
      description: result.complaint_body,
      negligence_type: result.negligence_type,
      custom_negligence_type: '',
      severity: result.severity,
      agency,
      city: city || prev.city,
      state: state || prev.state,
      photo: photo ?? prev.photo,
      date_of_incident:
        result.recommended_report_type === 'incident'
          ? new Date().toISOString().slice(0, 10)
          : prev.date_of_incident,
    }))
    setPrefilledBy(result.source)
    setIntakeDone(true)
    setStep(1)
  }

  function update(field: keyof FormData, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateVictim(index: number, field: keyof Victim, value: any) {
    setForm(prev => ({
      ...prev,
      victims: prev.victims.map((v, i) => 
        i === index ? { ...v, [field]: value } : v
      )
    }))
  }

  function addVictim() {
    setForm(prev => ({
      ...prev,
      victims: [...prev.victims, { outcome: 'Death' }]
    }))
  }

  function removeVictim(index: number) {
    if (form.victims.length > 1) {
      setForm(prev => ({
        ...prev,
        victims: prev.victims.filter((_, i) => i !== index)
      }))
    }
  }

  function next() {
    setStep((s) => Math.min(s + 1, totalSteps))
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    const finalNegligenceType = form.negligence_type || form.custom_negligence_type
    
    if (isHazard) {
      if (!form.city || !form.state || !finalNegligenceType) {
        setError('Please fill in location and hazard type.')
        return
      }
    } else {
      if (!form.title || !form.date_of_incident || form.victims.length === 0) {
        setError('Please fill in title, date, and at least one victim (Step 1).')
        return
      }
      if (!form.city || !form.state || !finalNegligenceType) {
        setError('Please fill in location and negligence type (Step 2).')
        return
      }
      if (!form.agency) {
        setError('Please name the department responsible (last step).')
        return
      }
    }

    setSubmitting(true)
    setError(null)

    // `negligence_type` has a CHECK constraint permitting only the five canonical
    // values, so a custom label must be mapped onto one of them. The citizen's own
    // wording is preserved in the description instead of being dropped.
    const usedCustomType = !form.negligence_type && Boolean(form.custom_negligence_type)
    const safeNegligenceType: NegligenceType = form.negligence_type
      ? form.negligence_type
      : guessNegligenceType(form.custom_negligence_type)
    const safeDescription = usedCustomType
      ? annotateCustomType(form.description, form.custom_negligence_type)
      : form.description

    // Before creating a second ticket for the same physical hazard, check whether
    // a neighbour already reported it. `skipDuplicateCheck` is set once the
    // citizen has explicitly said "no, mine is different".
    if (isHazard && form.coordinates && !skipDuplicateCheck) {
      const matches = await findNearbyHazards(form.coordinates, safeNegligenceType)
      if (matches.length > 0) {
        setNearby(matches)
        setSubmitting(false)
        return
      }
    }

    try {
      if (isHazard) {
        const hazard = await createHazard({
          address: form.address,
          city: form.city,
          state: form.state,
          negligence_type: safeNegligenceType,
          severity: form.severity,
          description: safeDescription,
          evidence_links: form.evidence_links.filter((l) => l.trim() !== ''),
          photo: form.photo,
          coordinates: form.coordinates,
        })
        setReference({ id: hazard.id, type: 'hazard' })
        setSubmitted(true)
      } else {
        const incident = await createIncident({
          title: form.title,
          victims: form.victims.map(v => ({
            name: v.name?.trim() || undefined,
            age: v.age,
            occupation: v.occupation?.trim() || undefined,
            outcome: v.outcome,
          })),
          date_of_incident: form.date_of_incident,
          address: form.address,
          city: form.city,
          state: form.state,
          negligence_type: safeNegligenceType,
          agency: form.agency,
          description: safeDescription,
          evidence_links: form.evidence_links.filter((l) => l.trim() !== ''),
          photo: form.photo,
          coordinates: form.coordinates,
        })
        setReference({ id: incident.id, type: 'incident' })
        setSubmitted(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // A near-duplicate was found: ask before creating a second ticket.
  if (nearby.length > 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Users className="text-amber-700 shrink-0 mt-0.5" size={20} />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-ink">
                {nearby.length === 1
                  ? 'Someone may have already reported this'
                  : `${nearby.length} nearby reports look like this one`}
              </h2>
              <p className="text-ink-muted text-sm mt-1">
                Adding your voice to an existing report counts for more than a second
                ticket — departments see one problem with several people behind it,
                instead of a queue of duplicates.
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            {nearby.slice(0, 3).map((match) => (
              <li
                key={match.hazard.id}
                className="rounded border border-line bg-raised p-4"
              >
                <div className="flex items-start gap-3">
                  {match.hazard.image_url && (
                    <img
                      src={match.hazard.image_url}
                      alt=""
                      className="w-16 h-16 object-cover rounded shrink-0 border border-line"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-ink font-semibold text-sm">
                      {negligenceLabel(match.hazard.negligence_type)} ·{' '}
                      {formatDistance(match.metres)}
                    </p>
                    <p className="text-ink-faint text-xs mt-0.5">
                      Reported {formatRelativeTime(match.hazard.created_at)}
                      {match.hazard.upvote_count > 0 &&
                        ` · ${
                          match.hazard.upvote_count === 1
                            ? '1 other person has backed this'
                            : `${match.hazard.upvote_count} others have backed this`
                        }`}
                    </p>
                    <p className="text-ink-muted text-sm mt-2 line-clamp-2">
                      {match.hazard.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => joinExisting(match)}
                  disabled={joining}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-blood hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2.5 font-bold text-sm rounded transition"
                >
                  {joining ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Adding…
                    </>
                  ) : (
                    <>
                      <Users size={15} /> Same issue — add my voice
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {error && <p className="text-red-700 text-sm mt-3">{error}</p>}

          <div className="mt-5 pt-4 border-t border-amber-300 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={fileAnyway}
              disabled={joining}
              className="flex-1 border border-line bg-raised text-ink px-4 py-2.5 font-semibold text-sm rounded hover:border-ink-faint transition"
            >
              Mine is a different problem — file it separately
            </button>
            <button
              type="button"
              onClick={() => setNearby([])}
              disabled={joining}
              className="text-ink-muted hover:text-ink text-sm underline underline-offset-4 px-2"
            >
              Go back and edit
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 sm:py-20">
        <div className={`${isHazard ? 'bg-amber-50 border-yellow-700' : 'bg-red-50 border-blood'} border rounded-lg p-6 sm:p-10 text-center`}>
          <h2 className="text-2xl sm:text-3xl font-header font-bold text-ink mb-3">
            {t('receipt.title')}
          </h2>
          <p className="text-ink-muted text-sm">
            {t('receipt.routedTo')} <span className="text-ink font-bold">{form.agency}</span>{' '}
            {t('receipt.clockRunning')}
          </p>

          {reference && (
            <div className="mt-6 bg-black/40 border border-line rounded p-4">
              <p className="text-[10px] text-ink-faint font-bold">
                {t('receipt.yourReference')}
              </p>
              <p className="text-ink font-mono text-base sm:text-lg break-all mt-1">
                {reference.id}
              </p>
              <p className="text-ink-faint text-xs mt-2">
                {t('receipt.saveThis')}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            {reference && (
              <button
                onClick={() => navigate(`/track/${reference.id}`)}
                className="bg-white text-black px-6 py-3 font-bold uppercase text-sm hover:bg-gray-200 transition rounded"
              >
                {t('receipt.track')}
              </button>
            )}
            <button
              onClick={() =>
                navigate(
                  reference?.type === 'hazard'
                    ? `/deathtraps/${reference.id}`
                    : `/incident/${reference?.id}`,
                )
              }
              className="border border-gray-600 text-ink-muted px-6 py-3 font-bold uppercase text-sm hover:border-gray-400 transition rounded"
            >
              {t('receipt.viewPublic')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full bg-raised-2 border border-line text-ink px-4 py-3 focus:border-blood focus:outline-none transition'
  const labelClass =
    'block text-xs text-ink-faint font-bold mb-2'

  // The AI intake is the front door. Everything below is the confirm-and-correct
  // step, or the manual path for anyone who skips it.
  if (!intakeDone) {
    return (
      <div className="max-w-2xl mx-auto">
        <SmartIntake onApply={applyIntake} onSkip={() => setIntakeDone(true)} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {prefilledBy && (
        <div
          className={`mb-6 rounded border px-4 py-3 text-sm ${
            prefilledBy === 'openai'
              ? 'border-green-300 bg-green-50 text-green-800'
              : 'border-yellow-700 bg-amber-50 text-amber-800'
          }`}
        >
          <span className="font-bold">
            {prefilledBy === 'openai'
              ? t('form.prefilled')
              : t('form.prefilledMock')}
          </span>{' '}
          Check every field below and correct anything that's wrong — nothing is
          submitted until you press the final button.
        </div>
      )}

      {/*
        The report-type chooser used to live here. It has been removed: the AI
        already decides from the citizen's own words whether someone was hurt,
        and re-asking after the fact was both redundant and the kind of extra
        decision that makes a form feel bureaucratic. Documenting a past
        casualty is a rarer, different task, so it gets a quiet escape hatch
        instead of equal billing.
      */}
      {!isHazard && (
        <div className="mb-6 rounded border border-line bg-raised px-4 py-3 flex items-start gap-2.5">
          <FileText size={16} className="text-ink-faint shrink-0 mt-0.5" />
          <p className="text-ink-muted text-sm">
            You are recording an incident that has already caused death or injury, so we
            ask for a few extra details.{' '}
            <button
              type="button"
              onClick={() => {
                setForm((prev) => ({ ...prev, report_type: 'hazard' }))
                setStep(1)
              }}
              className="text-civic underline underline-offset-2 font-semibold"
            >
              No one was hurt — report it as a hazard
            </button>
          </p>
        </div>
      )}

      {/* Step indicator — pointless when there is only one step */}
      <div
        className={`flex items-center justify-center gap-2 mb-10 ${totalSteps < 2 ? 'hidden' : ''}`}
      >
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-header font-bold text-lg border-2 ${
                s === step
                  ? isHazard
                    ? 'bg-yellow-700 border-yellow-600 text-white'
                    : 'bg-blood border-blood text-white'
                  : s < step
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-line text-ink-faint'
              }`}
            >
              {s}
            </div>
            {s < totalSteps && (
              <div
                className={`w-16 h-0.5 ${s < step ? (isHazard ? 'bg-yellow-700' : 'bg-blood') : 'bg-gray-700'}`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-300 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* INCIDENT Step 1: Incident & Victim Information */}
      {!isHazard && step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-header font-bold text-ink border-l-4 border-blood pl-4">
            Incident Information
          </h2>
          
          <div>
            <label className={labelClass}>Incident Title *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Brief headline describing the incident"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
            <p className="text-xs text-ink-faint mt-1">Example: "Bank Manager Falls Into Uncovered DJB Pit"</p>
          </div>

          <div>
            <label className={labelClass}>Date of Incident *</label>
            <input
              type="date"
              className={inputClass}
              value={form.date_of_incident}
              onChange={(e) => update('date_of_incident', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>{t('form.description')} *</label>
            <textarea
              className={`${inputClass} h-32 resize-none`}
              placeholder="What happened? Include details about the negligence..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div className="border-t border-line pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-header font-bold text-ink">Victims</h3>
              <button
                type="button"
                onClick={addVictim}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition"
              >
                <Plus size={16} /> Add Victim
              </button>
            </div>

            {form.victims.map((victim, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-900/50 border border-line rounded">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-ink-muted">Victim {index + 1}</span>
                  {form.victims.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVictim(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Name (optional if unknown)</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Victim's name"
                      value={victim.name || ''}
                      onChange={(e) => updateVictim(index, 'name', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Age (optional)</label>
                      <input
                        type="number"
                        className={inputClass}
                        placeholder="Age"
                        value={victim.age || ''}
                        onChange={(e) => updateVictim(index, 'age', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Occupation (optional)</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Occupation"
                        value={victim.occupation || ''}
                        onChange={(e) => updateVictim(index, 'occupation', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Outcome *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Death', 'Serious_Injury'] as OutcomeType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`px-4 py-2 border text-sm font-bold uppercase transition ${
                            victim.outcome === type
                              ? type === 'Death'
                                ? 'bg-blood border-blood text-white'
                                : 'bg-yellow-700 border-yellow-600 text-white'
                              : 'border-line text-ink-muted hover:border-gray-500'
                          }`}
                          onClick={() => updateVictim(index, 'outcome', type)}
                        >
                          {type.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHARED: Location & Evidence (Step 2 for incident, Step 1 for hazard) */}
      {((isHazard && step === 1) || (!isHazard && step === 2)) && (
        <div className="space-y-6">
          <h2 className={`text-2xl font-header font-bold text-ink border-l-4 ${isHazard ? 'border-yellow-600' : 'border-blood'} pl-4`}>
            {isHazard ? t('form.hazardDetails') : t('form.locationEvidence')}
          </h2>

          {/* Severity (hazard only) */}
          {isHazard && (
            <div>
              <label className={labelClass}>{t('form.severity')} *</label>
              <div className="grid grid-cols-4 gap-2">
                {severityLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`px-3 py-3 border text-xs font-bold transition ${
                      form.severity === level
                        ? level === 'Critical'
                          ? 'bg-red-700 border-red-600 text-white'
                          : level === 'High'
                            ? 'bg-orange-700 border-orange-600 text-ink'
                            : level === 'Medium'
                              ? 'bg-yellow-700 border-yellow-600 text-white'
                              : 'bg-green-700 border-green-600 text-white'
                        : 'border-line text-ink-muted hover:border-gray-500'
                    }`}
                    onClick={() => update('severity', level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>{t('form.photo')}</label>
            <PhotoInput
              value={form.photo}
              onChange={(file) => update('photo', file)}
              onError={setError}
            />
          </div>
          <div>
            <label className={labelClass}>{t('form.links')}</label>
            <p className="text-ink-faint text-xs mb-2">
              {t('form.linksHint')}
            </p>
            {form.evidence_links.map((link, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => {
                    const updated = [...form.evidence_links]
                    updated[i] = e.target.value
                    setForm((prev) => ({ ...prev, evidence_links: updated }))
                  }}
                />
                <button
                  type="button"
                  className="text-ink-faint hover:text-red-700 transition px-2"
                  onClick={() => {
                    const updated = form.evidence_links.filter((_, j) => j !== i)
                    setForm((prev) => ({ ...prev, evidence_links: updated }))
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition mt-1"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  evidence_links: [...prev.evidence_links, ''],
                }))
              }
            >
              <Plus size={14} /> {t('form.addLink')}
            </button>
          </div>
          <div>
            <label className={labelClass}>{t('form.location')} *</label>
            <Suspense
              fallback={
                <div className="border border-line rounded p-6 text-center text-ink-faint text-sm">
                  Loading location tools…
                </div>
              }
            >
              <LocationPicker
                address={form.address}
                city={form.city}
                state={form.state}
                coordinates={form.coordinates}
                onLocationChange={(location) => {
                  update('address', location.address)
                  update('city', location.city)
                  update('state', location.state)
                  update('coordinates', location.coordinates)
                }}
              />
            </Suspense>
          </div>
          <div>
            <label className={labelClass}>{t('form.hazardType')} *</label>
            <div className="grid grid-cols-2 gap-3">
              {negligenceTypesWithOther.map((type) => {
                const isOtherSelected = type === 'Other' && (form.negligence_type === '' || form.custom_negligence_type !== '')
                const isSelected = form.negligence_type === type || isOtherSelected
                
                return (
                  <button
                    key={type}
                    type="button"
                    className={`px-4 py-3 border text-sm font-bold uppercase transition ${
                      isSelected
                        ? isHazard
                          ? 'bg-yellow-700 border-yellow-600 text-white'
                          : 'bg-blood border-blood text-white'
                        : 'border-line text-ink-muted hover:border-gray-500'
                    }`}
                    onClick={() => {
                      if (type === 'Other') {
                        update('negligence_type', '')
                      } else {
                        update('negligence_type', type)
                        update('custom_negligence_type', '')
                      }
                    }}
                  >
                    {type === 'Other' ? 'Other' : type.replace(/_/g, ' ')}
                  </button>
                )
              })}
            </div>
            
            {/* Custom negligence type input */}
            {(form.negligence_type === '' || !negligenceTypes.includes(form.negligence_type as NegligenceType)) && (
              <div className="mt-3">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Specify the type of negligence"
                  value={form.custom_negligence_type}
                  onChange={(e) => update('custom_negligence_type', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Description (hazard only - incident has it in step 1) */}
          {isHazard && (
            <div>
              <label className={labelClass}>{t('form.description')} *</label>
              <textarea
                className={`${inputClass} h-32 resize-none`}
                placeholder={t('form.descriptionPlaceholder')}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/*
        The "Responsible Authorities" step is gone.

        Asking a citizen to type their MLA's and MP's name contradicted the entire
        promise of the product — that working out who is responsible is our job,
        not theirs — and it is information almost nobody has to hand. The routing
        table already derives the owning department, and we deliberately store
        office titles rather than named individuals, so the fields could only ever
        be left blank or filled with a guess.

        For a hazard the department is resolved automatically and shown before
        filing, so there is nothing left to ask: the flow is now one step.
        For a past incident we still let the reporter correct the department,
        since those are researched after the fact, but the MLA/MP inputs are gone.
      */}
      {!isHazard && step === 3 && (
        <div className="space-y-5">
          <h2 className="text-xl font-header font-bold text-ink border-l-4 border-blood pl-4">
            Which department was responsible?
          </h2>
          <div className="rounded border border-line bg-raised p-4">
            <p className="text-ink-muted text-sm">
              We worked this out from the location and the type of hazard. Change it only
              if you know better.
            </p>
            <label className={`${labelClass} mt-4`}>Department</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Delhi Jal Board, BBMP, PWD"
              value={form.agency}
              onChange={(e) => update('agency', e.target.value)}
            />
            <p className="text-ink-faint text-xs mt-2">
              Elected representatives are recorded by office (your area's MLA and MP), not
              by name — so there is nothing for you to look up.
            </p>
          </div>
        </div>
      )}

      {/* Personal-information warning, shown on the step that actually files */}
      {step === totalSteps && (
        <div className="mt-8 rounded border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle size={15} className="text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-ink-muted text-xs leading-relaxed">
            <span className="text-amber-700 font-bold">{t('form.piiHeading')}</span> {t('form.piiBody')}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-10">
        {step > 1 ? (
          <button
            type="button"
            onClick={prev}
            className="flex items-center gap-2 text-ink-muted hover:text-ink transition font-header uppercase tracking-wide"
          >
            <ChevronLeft size={20} /> {t('form.back')}
          </button>
        ) : (
          <div />
        )}
        {step < totalSteps ? (
          <button
            type="button"
            onClick={next}
            className={`flex items-center gap-2 ${isHazard ? 'bg-yellow-700 hover:bg-yellow-600' : 'bg-blood hover:bg-red-700'} text-white px-8 py-3 font-header font-bold uppercase tracking-wide transition`}
          >
            {t('form.next')} <ChevronRight size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex items-center gap-2 ${isHazard ? 'bg-yellow-700 hover:bg-yellow-600' : 'bg-blood hover:bg-red-700'} disabled:opacity-50 text-white px-8 py-3 font-header font-bold uppercase tracking-wide transition`}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t('form.filing')}
              </>
            ) : (
              <>
                <Send size={16} /> {t('form.file')}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
