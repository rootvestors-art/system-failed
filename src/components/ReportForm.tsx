import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Send, Loader2, Plus, X, AlertTriangle, FileText } from 'lucide-react'
import type { NegligenceType, OutcomeType, HazardSeverity, Victim } from '../types/incident.ts'
import { createIncident, createHazard } from '../services/incidents.ts'
// Leaflet is ~150 KB gzipped. Loading it only when the picker actually renders
// keeps the first paint cheap on a slow connection.
const LocationPicker = lazy(() => import('./LocationPicker.tsx'))
import SmartIntake, { type SmartIntakeApplied } from './SmartIntake.tsx'
import PhotoInput from './PhotoInput.tsx'
import { guessNegligenceType, annotateCustomType } from '../utils/negligence.ts'

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

  const isHazard = form.report_type === 'hazard'
  const totalSteps = isHazard ? 2 : 3

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
        setError('Please specify the responsible agency (Step 3).')
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
          mla: form.mla || undefined,
          mp: form.mp || undefined,
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

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 sm:py-20">
        <div className={`${isHazard ? 'bg-yellow-900/20 border-yellow-700' : 'bg-blood/20 border-blood'} border rounded-lg p-6 sm:p-10 text-center`}>
          <h2 className="text-2xl sm:text-3xl font-header font-bold text-white mb-3">
            Complaint filed
          </h2>
          <p className="text-gray-400 text-sm">
            It has been routed to <span className="text-white font-bold">{form.agency}</span> and
            the clock is now running.
          </p>

          {reference && (
            <div className="mt-6 bg-black/40 border border-gray-700 rounded p-4">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                Your reference
              </p>
              <p className="text-white font-mono text-base sm:text-lg break-all mt-1">
                {reference.id}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Save this. You can reopen the tracker any time with it.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            {reference && (
              <button
                onClick={() => navigate(`/track/${reference.id}`)}
                className="bg-white text-black px-6 py-3 font-bold uppercase text-sm hover:bg-gray-200 transition rounded"
              >
                Track this complaint
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
              className="border border-gray-600 text-gray-300 px-6 py-3 font-bold uppercase text-sm hover:border-gray-400 transition rounded"
            >
              View public record
            </button>
          </div>
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full bg-[#1a1a1a] border border-gray-700 text-white px-4 py-3 focus:border-blood focus:outline-none transition'
  const labelClass =
    'block text-xs text-gray-500 uppercase font-bold tracking-widest mb-2'

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
              ? 'border-green-700 bg-green-900/20 text-green-300'
              : 'border-yellow-700 bg-yellow-900/20 text-yellow-300'
          }`}
        >
          <span className="font-bold">
            {prefilledBy === 'openai'
              ? 'Filled in from your description.'
              : 'Filled in using offline keyword matching (AI not connected).'}
          </span>{' '}
          Check every field below and correct anything that's wrong — nothing is
          submitted until you press the final button.
        </div>
      )}

      {/* Report Type Toggle */}
      <div className="mb-8">
        <label className={labelClass}>What are you reporting?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className={`flex items-center justify-center gap-2 px-4 py-4 border text-sm font-bold uppercase transition ${
              !isHazard
                ? 'bg-blood border-blood text-white'
                : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => {
              setForm((prev) => ({ ...prev, report_type: 'incident' }))
              setStep(1)
            }}
          >
            <FileText size={18} /> Past incident
          </button>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 px-4 py-4 border text-sm font-bold uppercase transition ${
              isHazard
                ? 'bg-yellow-700 border-yellow-600 text-white'
                : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => {
              setForm((prev) => ({ ...prev, report_type: 'hazard' }))
              setStep(1)
            }}
          >
            <AlertTriangle size={18} /> Safety Hazard
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-2">
          {isHazard
            ? 'Flag a dangerous spot so it gets fixed before anyone is hurt'
            : 'Document a death or serious injury that has already happened'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
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
                    : 'border-gray-700 text-gray-600'
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
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* INCIDENT Step 1: Incident & Victim Information */}
      {!isHazard && step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-header font-bold text-white border-l-4 border-blood pl-4">
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
            <p className="text-xs text-gray-500 mt-1">Example: "Bank Manager Falls Into Uncovered DJB Pit"</p>
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
            <label className={labelClass}>Description *</label>
            <textarea
              className={`${inputClass} h-32 resize-none`}
              placeholder="What happened? Include details about the negligence..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div className="border-t border-gray-800 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-header font-bold text-white">Victims</h3>
              <button
                type="button"
                onClick={addVictim}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition"
              >
                <Plus size={16} /> Add Victim
              </button>
            </div>

            {form.victims.map((victim, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-900/50 border border-gray-800 rounded">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-gray-400">Victim {index + 1}</span>
                  {form.victims.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVictim(index)}
                      className="text-red-500 hover:text-red-400"
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
                              : 'border-gray-700 text-gray-400 hover:border-gray-500'
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
          <h2 className={`text-2xl font-header font-bold text-white border-l-4 ${isHazard ? 'border-yellow-600' : 'border-blood'} pl-4`}>
            {isHazard ? 'Hazard Details' : 'Location & Evidence'}
          </h2>

          {/* Severity (hazard only) */}
          {isHazard && (
            <div>
              <label className={labelClass}>Severity Level *</label>
              <div className="grid grid-cols-4 gap-2">
                {severityLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`px-3 py-3 border text-xs font-bold uppercase transition ${
                      form.severity === level
                        ? level === 'Critical'
                          ? 'bg-red-700 border-red-600 text-white'
                          : level === 'High'
                            ? 'bg-orange-700 border-orange-600 text-white'
                            : level === 'Medium'
                              ? 'bg-yellow-700 border-yellow-600 text-white'
                              : 'bg-green-700 border-green-600 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
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
            <label className={labelClass}>Photo Evidence</label>
            <PhotoInput
              value={form.photo}
              onChange={(file) => update('photo', file)}
              onError={setError}
            />
          </div>
          <div>
            <label className={labelClass}>Relevant Links</label>
            <p className="text-gray-600 text-xs mb-2">
              News articles, tweets, or any relevant URLs
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
                  className="text-gray-500 hover:text-red-400 transition px-2"
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
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition mt-1"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  evidence_links: [...prev.evidence_links, ''],
                }))
              }
            >
              <Plus size={14} /> Add link
            </button>
          </div>
          <div>
            <label className={labelClass}>Location *</label>
            <Suspense
              fallback={
                <div className="border border-gray-800 rounded p-6 text-center text-gray-500 text-sm">
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
            <label className={labelClass}>Type of {isHazard ? 'Hazard' : 'Negligence'} *</label>
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
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
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
              <label className={labelClass}>Description *</label>
              <textarea
                className={`${inputClass} h-32 resize-none`}
                placeholder="Describe the hazard and why it's dangerous..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* INCIDENT Step 3: Responsible Authorities */}
      {!isHazard && step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-header font-bold text-white border-l-4 border-blood pl-4">
            Responsible Authorities
          </h2>
          <p className="text-gray-500 text-sm">
            If unknown, leave blank for community investigation.
          </p>
          <div>
            <label className={labelClass}>Responsible Agency *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Delhi Jal Board, BBMP, PWD"
              value={form.agency}
              onChange={(e) => update('agency', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Area MLA</label>
            <input
              type="text"
              className={inputClass}
              placeholder="MLA name or 'Unknown'"
              value={form.mla}
              onChange={(e) => update('mla', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Area MP</label>
            <input
              type="text"
              className={inputClass}
              placeholder="MP name or 'Unknown'"
              value={form.mp}
              onChange={(e) => update('mp', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* HAZARD Step 2: Optional Authorities */}
      {isHazard && step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-header font-bold text-white border-l-4 border-yellow-600 pl-4">
            Responsible Authorities (Optional)
          </h2>
          <p className="text-gray-500 text-sm">
            Help us trace accountability. Leave blank if unknown.
          </p>
          <div>
            <label className={labelClass}>Responsible Agency</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Delhi Jal Board, BBMP, PWD"
              value={form.agency}
              onChange={(e) => update('agency', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Area MLA</label>
            <input
              type="text"
              className={inputClass}
              placeholder="MLA name or 'Unknown'"
              value={form.mla}
              onChange={(e) => update('mla', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Area MP</label>
            <input
              type="text"
              className={inputClass}
              placeholder="MP name or 'Unknown'"
              value={form.mp}
              onChange={(e) => update('mp', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Personal-information warning, shown on the step that actually files */}
      {step === totalSteps && (
        <div className="mt-8 rounded border border-yellow-800/60 bg-yellow-900/10 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle size={15} className="text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-gray-400 text-xs leading-relaxed">
            <span className="text-yellow-400 font-bold">Before you file:</span> this report
            becomes part of a public record. Please don't include Aadhaar or PAN numbers, phone
            numbers, bank or payment details, or medical information — yours or anyone else's.
            Check the description above and remove anything personal.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-10">
        {step > 1 ? (
          <button
            type="button"
            onClick={prev}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition font-header uppercase tracking-wide"
          >
            <ChevronLeft size={20} /> Back
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
            Next <ChevronRight size={20} />
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
                <Loader2 size={16} className="animate-spin" /> Filing…
              </>
            ) : (
              <>
                <Send size={16} /> File complaint
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
