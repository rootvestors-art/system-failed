import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { getHazardById } from '../../services/incidents.ts'
import HazardCard from '../../components/HazardCard.tsx'
import type { Hazard } from '../../types/incident.ts'

export default function DeathTrapDetail() {
  const { id } = useParams<{ id: string }>()
  const [hazard, setHazard] = useState<Hazard | null>(null)

  useEffect(() => {
    if (id) getHazardById(id).then(setHazard)
  }, [id])

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
        <ArrowLeft size={16} /> Back to Death Traps
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-header font-bold text-white border-l-8 border-yellow-500 pl-4 flex items-center gap-3">
              <AlertTriangle size={28} className="text-yellow-500" />
              DEATH TRAP
            </h2>
          </div>
          <HazardCard hazard={hazard} />
        </div>
        <div className="lg:col-span-1">
          <div className="bg-[#111] border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-header font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              WHAT IS A DEATH TRAP?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              A Death Trap is a dangerous hazard caused by civic negligence that
              poses an immediate risk to life. These include uncovered manholes,
              exposed electrical wires, collapsed structures, and crater-sized
              potholes.
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Unlike incident reports which document casualties that have already
              occurred, Death Traps are preventive warnings — flagging dangers
              before they claim lives.
            </p>
            <p className="text-gray-500 text-sm">
              Every Death Trap on this platform is a failure of the system. Report
              them. Share them. Force the system to act.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
