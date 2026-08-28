import type { Incident, Hazard } from '../types/incident.ts'

/**
 * Durable storage for reports filed while no live database is available.
 *
 * Without this, a report filed in sample-data mode exists only in memory: the
 * citizen gets a reference number, reloads the page, and the tracker tells them
 * their complaint doesn't exist. Persisting to localStorage keeps a reference
 * valid for the rest of that browser's life, which is what makes the filing ->
 * tracking journey demonstrable end to end.
 */

const INCIDENTS_KEY = 'systemfailed_local_incidents'
const HAZARDS_KEY = 'systemfailed_local_hazards'

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // Storage full or blocked (private mode). The in-memory copy still works
    // for this page view, so there is nothing useful to tell the citizen.
  }
}

export function loadLocalIncidents(): Incident[] {
  return read<Incident>(INCIDENTS_KEY)
}

export function loadLocalHazards(): Hazard[] {
  return read<Hazard>(HAZARDS_KEY)
}

export function persistLocalIncident(incident: Incident): void {
  write(INCIDENTS_KEY, [incident, ...read<Incident>(INCIDENTS_KEY)])
}

export function persistLocalHazard(hazard: Hazard): void {
  write(HAZARDS_KEY, [hazard, ...read<Hazard>(HAZARDS_KEY)])
}

/**
 * Write a partial update over a stored hazard, if we own a local copy of it.
 * Returns false when the hazard came from bundled seed data or a live backend,
 * so the caller knows the change was not persisted here.
 */
export function updateLocalHazard(id: string, patch: Partial<Hazard>): boolean {
  const items = read<Hazard>(HAZARDS_KEY)
  const index = items.findIndex((h) => h.id === id)
  if (index === -1) return false
  items[index] = { ...items[index], ...patch }
  write(HAZARDS_KEY, items)
  return true
}

// ---------------------------------------------------------------------------
// Overrides for bundled sample rows
// ---------------------------------------------------------------------------

const OVERRIDES_KEY = 'systemfailed_hazard_overrides'

/**
 * Bundled sample hazards live in a module array, so mutating one is lost the
 * moment the page reloads. Recording an override lets a reviewer mark a sample
 * issue fixed and have it stay fixed — which matters, because the samples are
 * exactly what someone tries first.
 *
 * Mirrors the existing upvote-override approach in `services/incidents.ts`.
 */
export function getHazardOverrides(): Record<string, Partial<Hazard>> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveHazardOverride(id: string, patch: Partial<Hazard>): void {
  const all = getHazardOverrides()
  all[id] = { ...all[id], ...patch }
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all))
  } catch {
    /* storage unavailable — the in-memory change still holds for this page view */
  }
}
