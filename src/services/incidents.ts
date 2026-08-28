import type { Incident, Victim, OutcomeType, Hazard, HazardSeverity } from '../types/incident.ts'
import { supabase } from './supabase.ts'
import { seedIncidents, seedHazards } from '../data/seed.ts'
import {
  loadLocalIncidents,
  loadLocalHazards,
  persistLocalIncident,
  persistLocalHazard,
  updateLocalHazard,
  getHazardOverrides,
  saveHazardOverride,
} from '../data/localReports.ts'

// Reports filed in sample-data mode are replayed into the in-memory lists on
// startup so a reference number keeps resolving after a page reload.
seedIncidents.unshift(...loadLocalIncidents())
seedHazards.unshift(...loadLocalHazards())

/**
 * Tripped when a Supabase call fails at runtime — project deleted or paused,
 * network down, DNS gone. Once set, every later read serves the bundled sample
 * data instead of throwing, so a dead backend degrades the experience rather
 * than presenting an empty, broken app.
 */
let supabaseDegraded = false

function useSeedData(): boolean {
  return !supabase || supabaseDegraded
}

/** True when we are serving bundled sample data rather than a live database. */
export function isUsingSampleData(): boolean {
  return useSeedData()
}

/** True specifically when a configured backend failed, as opposed to never being set up. */
export function isBackendDegraded(): boolean {
  return supabaseDegraded
}

/**
 * Run a Supabase operation, falling back to bundled data if the backend is
 * unreachable. The fallback is deliberately silent to the citizen — the journey
 * matters more than which store answered it — but it is logged and surfaced via
 * `isBackendDegraded()`.
 */
async function withFallback<T>(remote: () => Promise<T>, local: () => T): Promise<T> {
  try {
    return await remote()
  } catch (err) {
    console.warn(
      '[CivicFix] Backend unreachable — serving bundled sample data instead.',
      err,
    )
    supabaseDegraded = true
    return local()
  }
}

export async function getAllIncidents(): Promise<Incident[]> {
  const local = () => seedIncidents.map(applyStoredCount)
  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Incident[]
  }, local)
}

export async function getIncidentsPaginated(page: number = 1, pageSize: number = 10): Promise<{ incidents: Incident[], total: number, hasMore: boolean }> {
  const local = () => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const incidents = seedIncidents.map(applyStoredCount).slice(start, end)
    return {
      incidents,
      total: seedIncidents.length,
      hasMore: end < seedIncidents.length
    }
  }

  if (useSeedData()) return local()

  return withFallback(async () => {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const [dataResult, countResult] = await Promise.all([
      supabase!
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to),
      supabase!
        .from('incidents')
        .select('*', { count: 'exact', head: true })
    ])

    if (dataResult.error) throw dataResult.error
    if (countResult.error) throw countResult.error

    return {
      incidents: dataResult.data as Incident[],
      total: countResult.count || 0,
      hasMore: to < (countResult.count || 0) - 1
    }
  }, local)
}

export async function getIncidentById(id: string): Promise<Incident | null> {
  const local = () => {
    const found = seedIncidents.find((i) => i.id === id)
    return found ? applyStoredCount(found) : null
  }

  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .from('incidents')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return (data as Incident) ?? null
  }, local)
}

export async function uploadEvidencePhoto(file: File): Promise<string | null> {
  if (useSeedData()) return null

  // A missing bucket or dead project must not cost the citizen their whole
  // report, so an upload failure yields no photo rather than an exception.
  try {
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`

    const { error } = await supabase!.storage.from('evidence').upload(path, file)
    if (error) throw error

    const { data } = supabase!.storage.from('evidence').getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.warn('[CivicFix] Evidence upload failed — filing without the photo.', err)
    return null
  }
}

async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  coordinates?: { lat: number; lng: number },
): Promise<{ lat: number; lng: number }> {
  // If coordinates are provided directly, use them
  if (coordinates && coordinates.lat !== 0 && coordinates.lng !== 0) {
    return coordinates
  }
  
  try {
    const query = [address, city, state].filter(Boolean).join(', ')
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CivicFix/1.0' },
    })
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch {
    // fall through to default
  }
  return { lat: 0, lng: 0 }
}

function generateCaseId(state: string): string {
  const stateCode = state.slice(0, 2).toUpperCase()
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
  return `${stateCode}-${year}-${seq}`
}

export interface CreateIncidentInput {
  title: string
  victims: Victim[]
  date_of_incident: string
  address: string
  city: string
  state: string
  negligence_type: Incident['negligence_type']
  agency: string
  mla?: string
  mp?: string
  description: string
  evidence_links?: string[]
  photo?: File | null
  coordinates?: { lat: number; lng: number }
}

export async function createIncident(
  input: CreateIncidentInput,
): Promise<Incident> {
  const [imageUrl, coords] = await Promise.all([
    input.photo ? uploadEvidencePhoto(input.photo) : Promise.resolve(null),
    geocodeAddress(input.address, input.city, input.state, input.coordinates),
  ])

  const incident: Omit<Incident, 'id' | 'created_at'> = {
    case_id: generateCaseId(input.state),
    title: input.title,
    victims: input.victims,
    date_of_incident: input.date_of_incident,
    location: {
      lat: coords.lat,
      lng: coords.lng,
      address: input.address,
      city: input.city,
      state: input.state,
    },
    negligence_type: input.negligence_type,
    responsible_entities: {
      agency: input.agency,
      mla: input.mla || 'Unknown',
      mp: input.mp || 'Unknown',
    },
    status: 'Community_Flagged',
    evidence_links: input.evidence_links ?? [],
    description: input.description,
    image_url: imageUrl ?? undefined,
    upvote_count: 0,
  }

  const local = (): Incident => {
    const newIncident: Incident = {
      ...incident,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    seedIncidents.unshift(newIncident)
    persistLocalIncident(newIncident)
    return newIncident
  }

  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .from('incidents')
      .insert(incident)
      .select()
      .single()

    if (error) throw error
    return data as Incident
  }, local)
}

export async function getIncidentCount(): Promise<number> {
  const local = () => seedIncidents.length
  if (useSeedData()) return local()

  return withFallback(async () => {
    const { count, error } = await supabase!
      .from('incidents')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count ?? 0
  }, local)
}

// ============ HAZARD FUNCTIONS ============

export interface CreateHazardInput {
  address: string
  city: string
  state: string
  negligence_type: Hazard['negligence_type']
  severity: HazardSeverity
  description: string
  evidence_links?: string[]
  photo?: File | null
  coordinates?: { lat: number; lng: number }
}

export async function createHazard(input: CreateHazardInput): Promise<Hazard> {
  const [imageUrl, coords] = await Promise.all([
    input.photo ? uploadEvidencePhoto(input.photo) : Promise.resolve(null),
    geocodeAddress(input.address, input.city, input.state, input.coordinates),
  ])

  const hazard: Omit<Hazard, 'id' | 'created_at'> = {
    location: {
      lat: coords.lat,
      lng: coords.lng,
      address: input.address,
      city: input.city,
      state: input.state,
    },
    negligence_type: input.negligence_type,
    severity: input.severity,
    description: input.description,
    image_url: imageUrl ?? undefined,
    evidence_links: input.evidence_links ?? [],
    status: 'Reported',
    upvote_count: 0,
  }

  const local = (): Hazard => {
    const newHazard: Hazard = {
      ...hazard,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    seedHazards.unshift(newHazard)
    persistLocalHazard(newHazard)
    return newHazard
  }

  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .from('hazards')
      .insert(hazard)
      .select()
      .single()

    if (error) throw error
    return data as Hazard
  }, local)
}

export async function getHazardById(id: string): Promise<Hazard | null> {
  const local = () => {
    const found = seedHazards.find((h) => h.id === id)
    return found ? applyHazardOverride(applyStoredCount(found)) : null
  }

  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .from('hazards')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return (data as Hazard) ?? null
  }, local)
}

/**
 * Close the loop on a hazard: the citizen confirms it is actually fixed, and
 * optionally attaches an "after" photo as proof.
 *
 * This is the one place a citizen — not a department — changes the record, which
 * is deliberate: the person standing in front of the pothole is better placed to
 * say whether it is gone than the office that closed the ticket.
 */
export async function markHazardFixed(
  hazardId: string,
  afterPhoto?: File | null,
): Promise<Hazard | null> {
  const afterUrl = afterPhoto ? await uploadEvidencePhoto(afterPhoto) : null

  const patch: Partial<Hazard> = { status: 'Fixed' }
  if (afterUrl) patch.image_url = afterUrl

  const local = (): Hazard | null => {
    const hazard = seedHazards.find((h) => h.id === hazardId)
    if (!hazard) return null
    Object.assign(hazard, patch)
    // Citizen-filed reports live in localStorage and can be updated in place.
    // Bundled samples don't, so record an override instead — otherwise marking a
    // sample issue fixed silently reverts on the next page load.
    if (!updateLocalHazard(hazardId, patch)) {
      saveHazardOverride(hazardId, patch)
    }
    return hazard
  }

  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .from('hazards')
      .update(patch)
      .eq('id', hazardId)
      .select()
      .single()

    if (error) throw error
    return data as Hazard
  }, local)
}

export async function getAllHazards(): Promise<Hazard[]> {
  const local = () => seedHazards.map(applyStoredCount).map(applyHazardOverride)
  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .from('hazards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Hazard[]
  }, local)
}

// ============ UPVOTE FUNCTIONS ============

const UPVOTED_KEY = 'systemfailed_upvoted'
const UPVOTE_COUNTS_KEY = 'systemfailed_upvote_counts'

function getUpvotedIds(): Set<string> {
  const stored = localStorage.getItem(UPVOTED_KEY)
  return stored ? new Set(JSON.parse(stored)) : new Set()
}

function saveUpvotedIds(ids: Set<string>): void {
  localStorage.setItem(UPVOTED_KEY, JSON.stringify([...ids]))
}

function getSavedCounts(): Record<string, number> {
  const stored = localStorage.getItem(UPVOTE_COUNTS_KEY)
  return stored ? JSON.parse(stored) : {}
}

function saveCount(id: string, count: number): void {
  const counts = getSavedCounts()
  counts[id] = count
  localStorage.setItem(UPVOTE_COUNTS_KEY, JSON.stringify(counts))
}

/** Merge any persisted status change (e.g. "Fixed") into a seed hazard at read time. */
function applyHazardOverride(hazard: Hazard): Hazard {
  const override = getHazardOverrides()[hazard.id]
  return override ? { ...hazard, ...override } : hazard
}

/** Merge persisted upvote count into a seed item at read time */
function applyStoredCount<T extends { id: string; upvote_count: number }>(item: T): T {
  const counts = getSavedCounts()
  if (counts[item.id] !== undefined) {
    return { ...item, upvote_count: counts[item.id] }
  }
  return item
}

export function hasUpvoted(id: string): boolean {
  return getUpvotedIds().has(id)
}

export async function upvoteIncident(incidentId: string): Promise<number> {
  const upvoted = getUpvotedIds()
  if (upvoted.has(incidentId)) {
    throw new Error('Already upvoted')
  }

  const local = (): number => {
    const counts = getSavedCounts()
    const incident = seedIncidents.find((i) => i.id === incidentId)
    const currentCount = counts[incidentId] ?? incident?.upvote_count ?? 0
    const newCount = currentCount + 1
    upvoted.add(incidentId)
    saveUpvotedIds(upvoted)
    saveCount(incidentId, newCount)
    return newCount
  }

  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .rpc('increment_upvote', { incident_id: incidentId })

    if (error) throw error

    upvoted.add(incidentId)
    saveUpvotedIds(upvoted)
    return data as number
  }, local)
}

export async function upvoteHazard(hazardId: string): Promise<number> {
  const upvoted = getUpvotedIds()
  if (upvoted.has(hazardId)) {
    throw new Error('Already upvoted')
  }

  const local = (): number => {
    const counts = getSavedCounts()
    const hazard = seedHazards.find((h) => h.id === hazardId)
    const currentCount = counts[hazardId] ?? hazard?.upvote_count ?? 0
    const newCount = currentCount + 1
    upvoted.add(hazardId)
    saveUpvotedIds(upvoted)
    saveCount(hazardId, newCount)
    return newCount
  }

  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .rpc('increment_hazard_upvote', { hazard_id: hazardId })

    if (error) throw error

    upvoted.add(hazardId)
    saveUpvotedIds(upvoted)
    return data as number
  }, local)
}

export async function getMostUpvoted(limit = 5): Promise<Incident[]> {
  const local = () =>
    seedIncidents.map(applyStoredCount)
      .sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))
      .slice(0, limit)

  if (useSeedData()) return local()

  return withFallback(async () => {
    const { data, error } = await supabase!
      .from('incidents')
      .select('*')
      .order('upvote_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Incident[]
  }, local)
}
