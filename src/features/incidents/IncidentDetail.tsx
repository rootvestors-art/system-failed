import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getIncidentById } from '../../services/incidents.ts'
import IncidentCard from '../../components/IncidentCard.tsx'
import HierarchyCard from '../../components/HierarchyCard.tsx'
import type { Incident } from '../../types/incident.ts'
import { useDocumentMeta } from '../../hooks/useDocumentMeta.ts'
import { getShareUrl, buildOgImageUrl } from '../../utils/share.ts'
import { getTotalDeaths, getTotalInjuries } from '../../utils/victims.ts'
import LocationMap from '../../components/LocationMap.tsx'

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const [incident, setIncident] = useState<Incident | null>(null)

  useEffect(() => {
    if (id) getIncidentById(id).then(setIncident)
  }, [id])

  // Dynamic OG meta — null while loading (hook is a no-op until incident arrives)
  useDocumentMeta(
    incident
      ? {
          title: `CASE ${incident.case_id} — ${incident.title} | SystemFailed`,
          description: `${incident.location.city}, ${incident.location.state} • ${incident.negligence_type.replace(/_/g, ' ')} • ${incident.description.slice(0, 150)}`,
          url: getShareUrl('incident', incident.id),
          ogImage: buildOgImageUrl('incident', {
            case_id: incident.case_id,
            title: incident.title,
            city: incident.location.city,
            state: incident.location.state,
            negligence: incident.negligence_type,
            deaths: getTotalDeaths(incident),
            injuries: getTotalInjuries(incident),
            agency: incident.responsible_entities.agency,
            status: incident.status,
          }),
        }
      : null,
  )

  if (!incident) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition font-header uppercase tracking-wide text-sm"
      >
        <ArrowLeft size={16} /> Back to cases
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-header font-bold text-white border-l-8 border-blood pl-4">
              CASE FILE
            </h2>
            <span className="text-red-500 font-mono text-sm">
              CASE ID: {incident.case_id}
            </span>
          </div>
          <IncidentCard incident={incident} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <HierarchyCard entities={incident.responsible_entities} />
          <LocationMap
            location={incident.location}
            accentColor="red"
            deepLinkId={incident.id}
          />
        </div>
      </div>
    </main>
  )
}
