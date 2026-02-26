import type { Incident, Hazard, NegligenceType } from '../types/incident.ts'
import { negligenceLabel } from './formatters.ts'
import type { IncidentFilters, HazardFilters } from '../hooks/useFilterParams.ts'

// ── Option-list builders ──────────────────────────────────────────────────────

type HasLocation = { location: { state: string; city: string } }
type HasNegligence = { negligence_type: NegligenceType }

export function getStates(items: HasLocation[]): string[] {
  return [...new Set(items.map((i) => i.location.state))].sort()
}

/** Returns cities scoped to the selected state (all cities if state is empty). */
export function getCities(items: HasLocation[], state: string): string[] {
  const src = state ? items.filter((i) => i.location.state === state) : items
  return [...new Set(src.map((i) => i.location.city))].sort()
}

export function getTypes(items: HasNegligence[]): NegligenceType[] {
  return [...new Set(items.map((i) => i.negligence_type))].sort() as NegligenceType[]
}

export function getStatuses<T extends { status: string }>(items: T[]): string[] {
  return [...new Set(items.map((i) => i.status))].sort()
}

/** Returns severities present in the dataset in severity order (most → least). */
export function getSeverities(hazards: Hazard[]): string[] {
  const order = ['Critical', 'High', 'Medium', 'Low'] as const
  const found = new Set(hazards.map((h) => h.severity))
  return order.filter((s) => found.has(s))
}

// ── Sorting helpers ───────────────────────────────────────────────────────────

type Sortable = { created_at: string; upvote_count: number }

function byNewest(a: Sortable, b: Sortable): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

function byUpvotes(a: Sortable, b: Sortable): number {
  const diff = (b.upvote_count ?? 0) - (a.upvote_count ?? 0)
  return diff !== 0 ? diff : byNewest(a, b)
}

// ── Incident filtering ────────────────────────────────────────────────────────

export function filterIncidents(incidents: Incident[], f: IncidentFilters): Incident[] {
  let result = incidents

  if (f.q) {
    const q = f.q.toLowerCase()
    result = result.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    )
  }
  if (f.state) result = result.filter((i) => i.location.state === f.state)
  if (f.city) result = result.filter((i) => i.location.city === f.city)
  if (f.type) result = result.filter((i) => i.negligence_type === f.type)
  if (f.status) result = result.filter((i) => i.status === f.status)

  return [...result].sort(f.sort === 'upvoted' ? byUpvotes : byNewest)
}

// ── Hazard filtering ──────────────────────────────────────────────────────────

export function filterHazards(hazards: Hazard[], f: HazardFilters): Hazard[] {
  let result = hazards

  if (f.q) {
    const q = f.q.toLowerCase()
    result = result.filter(
      (h) =>
        h.description.toLowerCase().includes(q) ||
        negligenceLabel(h.negligence_type).toLowerCase().includes(q),
    )
  }
  if (f.state) result = result.filter((h) => h.location.state === f.state)
  if (f.city) result = result.filter((h) => h.location.city === f.city)
  if (f.type) result = result.filter((h) => h.negligence_type === f.type)
  if (f.status) result = result.filter((h) => h.status === f.status)
  if (f.severity) result = result.filter((h) => h.severity === f.severity)

  return [...result].sort(f.sort === 'upvoted' ? byUpvotes : byNewest)
}
