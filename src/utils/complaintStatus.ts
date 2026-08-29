import type { Hazard, Incident, NegligenceType } from '../types/incident.ts'
import { translate, type Lang } from '../i18n/index.tsx'
import {
  resolveJurisdiction,
  resolveAgency,
  buildEscalationLadder,
  type EscalationLevel,
  type Jurisdiction,
} from '../data/jurisdictions.ts'

/**
 * One source of truth for "where has this complaint got to".
 *
 * The tracker page and the public hazard page both need this, and when the logic
 * lived only inside the tracker the public page could show a report with no state
 * at all — just a photo and a description, which tells a reader nothing about
 * whether anyone is acting on it.
 */

const MS_PER_DAY = 86_400_000

export interface LadderStage extends EscalationLevel {
  /** Days after filing that this rung becomes active */
  startsAtDay: number
  /** Days after filing that this rung expires (Infinity for the last) */
  endsAtDay: number
  status: 'done' | 'active' | 'pending'
}

export interface ProgressStage {
  label: string
  reached: boolean
  note: string
}

export interface ComplaintStatus {
  jurisdiction: Jurisdiction
  /** The department the complaint currently sits with */
  agency: string
  ladder: LadderStage[]
  activeIndex: number
  active: LadderStage | null
  /** Days before the current rung lapses and it escalates */
  daysLeft: number
  elapsedDays: number
  resolved: boolean
  /** Simulated departmental progress: Submitted → Acknowledged → Assigned → Resolved */
  progress: ProgressStage[]
  /** How many times it has already escalated */
  escalations: number
}

/** "12 hours" reads better than "0.5 days" on a deadline. */
export function formatDayCount(days: number): string {
  if (days >= 1) {
    const whole = Math.round(days)
    return `${whole} day${whole === 1 ? '' : 's'}`
  }
  const hours = Math.max(1, Math.round(days * 24))
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

/**
 * Countdown wording. Falls back to hours so "1 day left" never reads as
 * "escalating now", and handles the terminal rung, whose window is Infinity —
 * without that guard this renders the literal string "Infinity days left".
 */
export function formatRemaining(daysLeft: number, lang: Lang = 'en'): string {
  if (!Number.isFinite(daysLeft)) return translate(lang, 'track.allExhausted')
  if (daysLeft >= 1) {
    const days = Math.ceil(daysLeft)
    return days === 1
      ? translate(lang, 'track.dayLeft')
      : translate(lang, 'track.daysLeft', { n: days })
  }
  const hours = Math.ceil(daysLeft * 24)
  if (hours >= 1) {
    return hours === 1
      ? translate(lang, 'track.hourLeft')
      : translate(lang, 'track.hoursLeft', { n: hours })
  }
  return translate(lang, 'track.escalatingNow')
}

/** True once a complaint has climbed past every rung with a deadline. */
export function isExhausted(status: ComplaintStatus): boolean {
  return !status.resolved && !Number.isFinite(status.daysLeft)
}

interface StatusInput {
  /** Language for the human-readable stage labels. */
  lang?: Lang
  location: { city: string; state: string }
  negligence_type: NegligenceType
  created_at: string
  /** A hazard marked Fixed stops the clock entirely */
  isResolved: boolean
  /** Use the agency already recorded on the report, when there is one */
  agencyOverride?: string
}

export function computeComplaintStatus(input: StatusInput): ComplaintStatus {
  const { location, negligence_type, created_at, isResolved } = input
  const lang: Lang = input.lang ?? 'en'

  const jurisdiction = resolveJurisdiction(location.city, location.state)
  const agency =
    input.agencyOverride || resolveAgency(location.city, location.state, negligence_type)

  const ladderLevels = buildEscalationLadder(jurisdiction, agency)
  const elapsedDays = (Date.now() - new Date(created_at).getTime()) / MS_PER_DAY
  const resolved = isResolved

  let cursor = 0
  const ladder: LadderStage[] = ladderLevels.map((level) => {
    const startsAtDay = cursor
    const endsAtDay = cursor + level.windowDays
    cursor = endsAtDay

    let status: LadderStage['status'] = 'pending'
    if (resolved) {
      status = startsAtDay === 0 ? 'done' : 'pending'
    } else if (elapsedDays >= endsAtDay) {
      status = 'done'
    } else if (elapsedDays >= startsAtDay) {
      status = 'active'
    }

    return { ...level, startsAtDay, endsAtDay, status }
  })

  const activeIndex = ladder.findIndex((s) => s.status === 'active')
  const active = activeIndex >= 0 ? ladder[activeIndex] : null
  const daysLeft = active ? Math.max(0, active.endsAtDay - elapsedDays) : 0

  // Simulated departmental progress. A real integration would read these from the
  // civic body's own workflow; here they are derived from elapsed time so the
  // journey is observable without a government system in the loop.
  const ackAtDay = Math.min(1, jurisdiction.slaDays * 0.5)
  const assignAtDay = jurisdiction.slaDays
  const progress: ProgressStage[] = [
    { label: translate(lang, 'track.stage.submitted'), reached: true, note: 'Complaint recorded and routed' },
    {
      label: translate(lang, 'track.stage.acknowledged'),
      reached: resolved || elapsedDays >= ackAtDay,
      note: `Expected within ${formatDayCount(ackAtDay)}`,
    },
    {
      label: translate(lang, 'track.stage.assigned'),
      reached: resolved || elapsedDays >= assignAtDay,
      note: `Expected within ${formatDayCount(assignAtDay)}`,
    },
    {
      label: translate(lang, 'track.stage.resolved'),
      reached: resolved,
      note: resolved ? 'Confirmed fixed' : 'Awaiting repair',
    },
  ]

  return {
    jurisdiction,
    agency,
    ladder,
    activeIndex,
    active,
    daysLeft,
    elapsedDays,
    resolved,
    progress,
    escalations: Math.max(0, activeIndex),
  }
}

/** Convenience wrapper for a hazard record. */
export function hazardStatus(hazard: Hazard, lang: Lang = 'en'): ComplaintStatus {
  return computeComplaintStatus({
    lang,
    location: hazard.location,
    negligence_type: hazard.negligence_type,
    created_at: hazard.created_at,
    isResolved: hazard.status === 'Fixed',
  })
}

/** Convenience wrapper for an incident record. */
export function incidentStatus(incident: Incident, lang: Lang = 'en'): ComplaintStatus {
  return computeComplaintStatus({
    lang,
    location: incident.location,
    negligence_type: incident.negligence_type,
    created_at: incident.created_at,
    isResolved: false,
    agencyOverride: incident.responsible_entities.agency,
  })
}
