import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { getAllHazards } from '../../services/incidents.ts'
import HazardCard from '../../components/HazardCard.tsx'
import type { Hazard } from '../../types/incident.ts'

export default function DeathTrapList() {
  const [hazards, setHazards] = useState<Hazard[]>([])

  useEffect(() => {
    getAllHazards().then(setHazards)
  }, [])

  const latest = hazards[0]

  const severityCounts = {
    Critical: hazards.filter((h) => h.severity === 'Critical').length,
    High: hazards.filter((h) => h.severity === 'High').length,
    Medium: hazards.filter((h) => h.severity === 'Medium').length,
    Low: hazards.filter((h) => h.severity === 'Low').length,
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-header font-bold text-white border-l-8 border-yellow-500 pl-4 flex items-center gap-3">
              <AlertTriangle size={28} className="text-yellow-500" />
              ACTIVE DEATH TRAPS
            </h2>
          </div>

          {latest ? (
            <>
              <HazardCard hazard={latest} />

              {hazards.length > 1 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-header font-bold text-white border-l-4 border-gray-700 pl-4 mb-6">
                    MORE DEATH TRAPS
                  </h2>
                  {hazards.slice(1).map((hazard) => (
                    <HazardCard key={hazard.id} hazard={hazard} compact />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#111] border border-gray-800 rounded-lg p-10 text-center">
              <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-header font-bold text-white mb-2">
                No Death Traps Reported Yet
              </h3>
              <p className="text-gray-400 mb-6">
                Spot a dangerous hazard in your area? Report it before someone gets killed.
              </p>
              <Link
                to="/report"
                className="inline-block bg-yellow-700 hover:bg-yellow-600 text-white px-8 py-3 font-header font-bold uppercase tracking-wide transition"
              >
                Report a Death Trap
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {/* Severity Breakdown */}
          <div className="bg-[#111] border border-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-header font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              SEVERITY BREAKDOWN
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-l-4 border-red-500 pl-3">
                <span className="text-gray-300 text-sm uppercase font-bold">Critical</span>
                <span className="text-red-400 font-mono text-lg font-bold">{severityCounts.Critical}</span>
              </div>
              <div className="flex justify-between items-center border-l-4 border-orange-500 pl-3">
                <span className="text-gray-300 text-sm uppercase font-bold">High</span>
                <span className="text-orange-400 font-mono text-lg font-bold">{severityCounts.High}</span>
              </div>
              <div className="flex justify-between items-center border-l-4 border-yellow-500 pl-3">
                <span className="text-gray-300 text-sm uppercase font-bold">Medium</span>
                <span className="text-yellow-400 font-mono text-lg font-bold">{severityCounts.Medium}</span>
              </div>
              <div className="flex justify-between items-center border-l-4 border-green-500 pl-3">
                <span className="text-gray-300 text-sm uppercase font-bold">Low</span>
                <span className="text-green-400 font-mono text-lg font-bold">{severityCounts.Low}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-yellow-700 p-6 rounded text-center">
            <h3 className="text-white font-header font-bold text-2xl uppercase">
              Spot a Death Trap?
            </h3>
            <p className="text-yellow-100 text-sm mb-4">
              Report dangerous hazards before someone gets killed.
            </p>
            <Link
              to="/report"
              className="block bg-black text-white px-6 py-3 font-bold uppercase w-full hover:bg-gray-900 transition text-center"
            >
              Report Now
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
