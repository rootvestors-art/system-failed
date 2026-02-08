import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getIncidentById } from '../../services/incidents.ts'
import IncidentCard from '../../components/IncidentCard.tsx'
import HierarchyCard from '../../components/HierarchyCard.tsx'
import type { Incident } from '../../types/incident.ts'

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const [incident, setIncident] = useState<Incident | null>(null)

  useEffect(() => {
    if (id) getIncidentById(id).then(setIncident)
  }, [id])

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
        <div className="lg:col-span-1">
          <HierarchyCard entities={incident.responsible_entities} />
        </div>
      </div>
    </main>
  )
}
