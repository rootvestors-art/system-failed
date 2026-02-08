import type { Incident, Victim, OutcomeType, Hazard, HazardSeverity } from '../types/incident.ts'
import { supabase } from './supabase.ts'
import { seedIncidents, seedHazards } from '../data/seed.ts'

function useSeedData(): boolean {
  return !supabase
}

export async function getAllIncidents(): Promise<Incident[]> {
  if (useSeedData()) return seedIncidents.map(applyStoredCount)

  const { data, error } = await supabase!
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Incident[]
}

export async function getIncidentsPaginated(page: number = 1, pageSize: number = 10): Promise<{ incidents: Incident[], total: number, hasMore: boolean }> {
  if (useSeedData()) {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const incidents = seedIncidents.map(applyStoredCount).slice(start, end)
    return {
      incidents,
      total: seedIncidents.length,
      hasMore: end < seedIncidents.length
    }
  }

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
}

export async function getIncidentById(id: string): Promise<Incident | null> {
  if (useSeedData()) {
    const found = seedIncidents.find((i) => i.id === id)
    return found ? applyStoredCount(found) : null
  }

  const { data, error } = await supabase!
    .from('incidents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Incident
}

export async function uploadEvidencePhoto(file: File): Promise<string | null> {
  if (!supabase) return null

  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('evidence')
    .upload(path, file)

  if (error) throw error

  const { data } = supabase.storage.from('evidence').getPublicUrl(path)
  return data.publicUrl
}

async function geocodeAddress(
  address: string,
  city: string,
  state: string,
): Promise<{ lat: number; lng: number }> {
  try {
    const query = [address, city, state].filter(Boolean).join(', ')
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SystemFailed/1.0' },
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
}

export async function createIncident(
  input: CreateIncidentInput,
): Promise<Incident> {
  const [imageUrl, coords] = await Promise.all([
    input.photo ? uploadEvidencePhoto(input.photo) : Promise.resolve(null),
    geocodeAddress(input.address, input.city, input.state),
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

  if (useSeedData()) {
    const newIncident: Incident = {
      ...incident,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    seedIncidents.unshift(newIncident)
    return newIncident
  }

  const { data, error } = await supabase!
    .from('incidents')
    .insert(incident)
    .select()
    .single()

  if (error) throw error
  return data as Incident
}

export async function getIncidentCount(): Promise<number> {
  if (useSeedData()) return seedIncidents.length

  const { count, error } = await supabase!
    .from('incidents')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
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
}

export async function createHazard(input: CreateHazardInput): Promise<Hazard> {
  const [imageUrl, coords] = await Promise.all([
    input.photo ? uploadEvidencePhoto(input.photo) : Promise.resolve(null),
    geocodeAddress(input.address, input.city, input.state),
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

  if (useSeedData()) {
    const newHazard: Hazard = {
      ...hazard,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    seedHazards.unshift(newHazard)
    return newHazard
  }

  const { data, error } = await supabase!
    .from('hazards')
    .insert(hazard)
    .select()
    .single()

  if (error) throw error
  return data as Hazard
}

export async function getHazardById(id: string): Promise<Hazard | null> {
  if (useSeedData()) {
    const found = seedHazards.find((h) => h.id === id)
    return found ? applyStoredCount(found) : null
  }

  const { data, error } = await supabase!
    .from('hazards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Hazard
}

export async function getAllHazards(): Promise<Hazard[]> {
  if (useSeedData()) return seedHazards.map(applyStoredCount)

  const { data, error } = await supabase!
    .from('hazards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Hazard[]
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

  if (useSeedData()) {
    const counts = getSavedCounts()
    const incident = seedIncidents.find((i) => i.id === incidentId)
    if (incident) {
      const currentCount = counts[incidentId] ?? incident.upvote_count ?? 0
      const newCount = currentCount + 1
      upvoted.add(incidentId)
      saveUpvotedIds(upvoted)
      saveCount(incidentId, newCount)
      return newCount
    }
    throw new Error('Incident not found')
  }

  const { data, error } = await supabase!
    .rpc('increment_upvote', { incident_id: incidentId })

  if (error) throw error

  upvoted.add(incidentId)
  saveUpvotedIds(upvoted)
  return data as number
}

export async function upvoteHazard(hazardId: string): Promise<number> {
  const upvoted = getUpvotedIds()
  if (upvoted.has(hazardId)) {
    throw new Error('Already upvoted')
  }

  if (useSeedData()) {
    const counts = getSavedCounts()
    const hazard = seedHazards.find((h) => h.id === hazardId)
    if (hazard) {
      const currentCount = counts[hazardId] ?? hazard.upvote_count ?? 0
      const newCount = currentCount + 1
      upvoted.add(hazardId)
      saveUpvotedIds(upvoted)
      saveCount(hazardId, newCount)
      return newCount
    }
    throw new Error('Hazard not found')
  }

  const { data, error } = await supabase!
    .rpc('increment_hazard_upvote', { hazard_id: hazardId })

  if (error) throw error

  upvoted.add(hazardId)
  saveUpvotedIds(upvoted)
  return data as number
}

export async function getMostUpvoted(limit = 5): Promise<Incident[]> {
  if (useSeedData()) {
    return seedIncidents.map(applyStoredCount)
      .sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))
      .slice(0, limit)
  }

  const { data, error } = await supabase!
    .from('incidents')
    .select('*')
    .order('upvote_count', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Incident[]
}
