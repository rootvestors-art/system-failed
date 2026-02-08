import type { Incident, Victim } from '../types/incident.ts'

export function getTotalDeaths(incident: Incident): number {
  return incident.victims.filter(v => v.outcome === 'Death').length
}

export function getTotalInjuries(incident: Incident): number {
  return incident.victims.filter(v => v.outcome === 'Serious_Injury').length
}

export function getVictimSummary(incident: Incident): string {
  const deaths = getTotalDeaths(incident)
  const injuries = getTotalInjuries(incident)
  const total = incident.victims.length
  
  const parts: string[] = []
  
  if (total === 1) {
    return deaths === 1 ? '1 death' : '1 injured'
  }
  
  parts.push(`${total} victim${total > 1 ? 's' : ''}`)
  
  if (deaths > 0) {
    parts.push(`${deaths} death${deaths > 1 ? 's' : ''}`)
  }
  
  if (injuries > 0) {
    parts.push(`${injuries} injured`)
  }
  
  return parts.join(' • ')
}

export function getVictimsList(victims: Victim[]): string {
  return victims
    .map(v => {
      if (!v.name) return 'Unknown victim'
      const age = v.age ? `, ${v.age}` : ''
      return `${v.name}${age}`
    })
    .join(', ')
}
