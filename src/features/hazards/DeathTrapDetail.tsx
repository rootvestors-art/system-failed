import { useEffect, useState, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { getHazardById } from '../../services/incidents.ts'
import HazardCard from '../../components/HazardCard.tsx'
import type { Hazard } from '../../types/incident.ts'
import { useDocumentMeta } from '../../hooks/useDocumentMeta.ts'
import { getShareUrl, buildOgImageUrl } from '../../utils/share.ts'
const LocationMap = lazy(() => import('../../components/LocationMap.tsx'))

export default function DeathTrapDetail() {
  const { id } = useParams<{ id: string }>()
  const [hazard, setHazard] = useState<Hazard | null>(null)

  useEffect(() => {
    if (id) getHazardById(id).then(setHazard)
  }, [id])

  // Dynamic OG meta
  useDocumentMeta(
    hazard
      ? {
          title: `⚠ SAFETY HAZARD — ${hazard.severity} ${hazard.negligence_type.replace(/_/g, ' ')} in ${hazard.location.city} | CivicFix`,
          description: `${hazard.severity} severity hazard in ${hazard.location.city}, ${hazard.location.state}. ${hazard.description.slice(0, 150)}`,
          url: getShareUrl('hazard', hazard.id),
          ogImage: buildOgImageUrl('hazard', {
            city: hazard.location.city,
            state: hazard.location.state,
            negligence: hazard.negligence_type,
            severity: hazard.severity,
            description: hazard.description,
            status: hazard.status,
          }),
        }
      : null,
  )

  if (!hazard) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/deathtraps"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition font-header uppercase tracking-wide text-sm"
      >
        <ArrowLeft size={16} /> Back to Safety Hazards
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-header font-bold text-white border-l-8 border-yellow-500 pl-4 flex items-center gap-3">
              <AlertTriangle size={28} className="text-yellow-500" />
              SAFETY HAZARD
            </h2>
          </div>
          <HazardCard hazard={hazard} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-[#111] border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-header font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              WHAT IS A SAFETY HAZARD?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              A safety hazard is a piece of public infrastructure that presents an
              immediate danger to people using it — an uncovered manhole, an exposed
              electrical wire, an unstable structure, an abandoned excavation.
            </p>
            <p className="text-gray-400 text-sm mb-4">
              These are reported <span className="text-white">before</span> anyone is
              harmed, so the responsible department has a chance to fix them in time.
            </p>
            <p className="text-gray-500 text-sm">
              Every report here has been routed to a department with a deadline attached.
              If nothing happens, it escalates.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                Loading map…
              </div>
            }
          >
            <LocationMap
              location={hazard.location}
              accentColor="yellow"
              deepLinkId={hazard.id}
            />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
