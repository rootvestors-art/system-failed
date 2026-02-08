export type NegligenceType =
  | 'Pothole'
  | 'Open_Drain'
  | 'Electrocution'
  | 'Collapse'
  | 'Open_Pit'

export type OutcomeType = 'Death' | 'Serious_Injury'

export interface Victim {
  name?: string
  age?: number
  occupation?: string
  outcome: OutcomeType
}

export type IncidentStatus =
  | 'Verified'
  | 'Community_Flagged'
  | 'Official_Denial'

export type HazardSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type HazardStatus = 'Reported' | 'Verified' | 'Fixed'

export interface Hazard {
  id: string
  location: IncidentLocation
  negligence_type: NegligenceType
  severity: HazardSeverity
  description: string
  image_url?: string
  evidence_links: string[]
  status: HazardStatus
  reported_by?: string
  upvote_count: number
  created_at: string
}

export interface IncidentLocation {
  lat: number
  lng: number
  address: string
  city: string
  state: string
}

export interface ResponsibleEntities {
  agency: string
  ward?: string
  mla?: string
  mp?: string
  cm?: string
}

export interface Incident {
  id: string
  case_id: string
  title: string
  victims: Victim[]
  date_of_incident: string
  location: IncidentLocation
  negligence_type: NegligenceType
  responsible_entities: ResponsibleEntities
  status: IncidentStatus
  evidence_links: string[]
  description: string
  image_url?: string
  upvote_count: number
  created_at: string
}
