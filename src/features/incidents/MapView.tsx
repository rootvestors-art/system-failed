import { useEffect, useState } from 'react'
import { getAllIncidents, getAllHazards } from '../../services/incidents.ts'
import IncidentMap from '../../components/IncidentMap.tsx'
import IncidentCard from '../../components/IncidentCard.tsx'
import HazardCard from '../../components/HazardCard.tsx'
import type { Incident, Hazard } from '../../types/incident.ts'
import { negligenceLabel } from '../../utils/formatters.ts'

export default function MapView() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showDeathTraps, setShowDeathTraps] = useState(true)

  useEffect(() => {
    getAllIncidents().then(setIncidents)
    getAllHazards().then(setHazards)
  }, [])

  function handleSelectIncident(incident: Incident) {
    setSelectedIncident(incident)
    setSelectedHazard(null)
  }

  function handleSelectHazard(hazard: Hazard) {
    setSelectedHazard(hazard)
    setSelectedIncident(null)
  }

  const filteredIncidents = showIncidents ? incidents : []
  const filteredHazards = showDeathTraps ? hazards : []

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Sidebar */}
      <aside className="w-80 bg-charcoal border-r border-gray-800 flex flex-col overflow-y-auto hidden md:flex">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">
            Latest Reports
          </h2>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          {showIncidents && incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              compact
            />
          ))}

          {showDeathTraps && hazards.length > 0 && (
            <>
              {showIncidents && <div className="border-t border-gray-700 my-4" />}
              <h2 className="text-yellow-500 text-xs uppercase tracking-widest font-bold mb-4">
                Death Traps
              </h2>
              {hazards.map((hazard) => (
                <HazardCard
                  key={hazard.id}
                  hazard={hazard}
                  compact
                />
              ))}
            </>
          )}
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        <IncidentMap
          incidents={filteredIncidents}
          hazards={filteredHazards}
          onSelectIncident={handleSelectIncident}
          onSelectHazard={handleSelectHazard}
        />

        {/* Legend / filter checkboxes — top right, above Leaflet */}
        <div className="absolute top-4 right-4 bg-black/90 border border-gray-700 rounded-lg p-3 shadow-2xl backdrop-blur-sm" style={{ zIndex: 1000 }}>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Map Layers</p>
          <label className="flex items-center gap-2 cursor-pointer mb-2 group">
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={() => setShowIncidents(!showIncidents)}
              className="sr-only peer"
            />
            <span className="w-4 h-4 rounded-sm border-2 border-red-500 bg-red-500/20 flex items-center justify-center peer-checked:bg-red-500 transition">
              {showIncidents && (
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </span>
            <span className="text-xs text-gray-300 group-hover:text-white transition">
              Incidents
              <span className="text-red-500 font-mono ml-1">({incidents.length})</span>
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showDeathTraps}
              onChange={() => setShowDeathTraps(!showDeathTraps)}
              className="sr-only peer"
            />
            <span className="w-4 h-4 rounded-sm border-2 border-yellow-500 bg-yellow-500/20 flex items-center justify-center peer-checked:bg-yellow-500 transition">
              {showDeathTraps && (
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </span>
            <span className="text-xs text-gray-300 group-hover:text-white transition">
              Death Traps
              <span className="text-yellow-500 font-mono ml-1">({hazards.length})</span>
            </span>
          </label>
        </div>

        {/* Status overlay - fixed position */}
        <div className="fixed bottom-8 left-8 bg-black/90 p-4 border border-gray-700 rounded shadow-2xl backdrop-blur-sm" style={{ zIndex: 1000 }}>
          <h3 className="text-white font-bold uppercase mb-2">System Status</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="block text-2xl font-bold text-red-500 font-mono">
                {incidents.length}
              </span>
              <span className="text-xs text-gray-400 uppercase">Incidents</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-yellow-500 font-mono">
                {hazards.length}
              </span>
              <span className="text-xs text-gray-400 uppercase">Death Traps</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-caution font-mono">0</span>
              <span className="text-xs text-gray-400 uppercase">Resignations</span>
            </div>
          </div>
        </div>
      </main>

      {/* Incident detail panel */}
      {selectedIncident && (
        <aside className="w-96 bg-void border-l border-gray-800 p-6 hidden lg:block overflow-y-auto">
          <div className="bg-blood text-white text-xs font-bold px-2 py-1 inline-block mb-4 uppercase">
            Selected Incident
          </div>
          {selectedIncident.image_url && (
            <img
              src={selectedIncident.image_url}
              alt="Evidence"
              className="w-full h-48 object-cover rounded mb-4 grayscale hover:grayscale-0 transition duration-500 border border-gray-700"
            />
          )}
          <h2 className="text-3xl font-black text-white mb-1">
            CASE #{selectedIncident.case_id}
          </h2>
          <p className="text-red-500 font-mono text-sm mb-4">FATALITY CONFIRMED</p>
          <p className="text-gray-300 text-sm">{selectedIncident.description}</p>
        </aside>
      )}

      {/* Hazard detail panel */}
      {selectedHazard && (
        <aside className="w-96 bg-void border-l border-gray-800 p-6 hidden lg:block overflow-y-auto">
          <div className="bg-yellow-700 text-white text-xs font-bold px-2 py-1 inline-block mb-4 uppercase">
            Death Trap
          </div>
          {selectedHazard.image_url && (
            <img
              src={selectedHazard.image_url}
              alt="Evidence"
              className="w-full h-48 object-cover rounded mb-4 grayscale hover:grayscale-0 transition duration-500 border border-gray-700"
            />
          )}
          <h2 className="text-3xl font-black text-white mb-1">
            {selectedHazard.severity.toUpperCase()} SEVERITY
          </h2>
          <p className="text-yellow-500 font-mono text-sm mb-4">
            {negligenceLabel(selectedHazard.negligence_type).toUpperCase()}
          </p>
          <p className="text-gray-300 text-sm">{selectedHazard.description}</p>
        </aside>
      )}
    </div>
  )
}
