import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { getAllIncidents, getAllHazards } from '../../services/incidents.ts'

// Split Leaflet out of the initial bundle — see ReportForm for the same reason.
const IncidentMap = lazy(() => import('../../components/IncidentMap.tsx'))
import IncidentCard from '../../components/IncidentCard.tsx'
import HazardCard from '../../components/HazardCard.tsx'
import type { Incident, Hazard } from '../../types/incident.ts'
import { negligenceLabel } from '../../utils/formatters.ts'

export default function MapView() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null)
  // Reported issues are the primary layer now; past fatalities are context you
  // opt into, not the headline.
  const [showIncidents, setShowIncidents] = useState(false)
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

  const openCount = hazards.filter((h) => h.status !== 'Fixed').length
  const resolvedCount = hazards.filter((h) => h.status === 'Fixed').length

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Sidebar */}
      <aside className="w-80 bg-raised border-r border-line flex flex-col overflow-y-auto hidden md:flex">
        <div className="p-4 border-b border-line">
          <h2 className="text-ink-muted text-xs uppercase tracking-widest font-bold mb-2">
            Reported issues
          </h2>
          <p className="text-ink-faint text-xs">
            Hazards citizens have filed complaints about.
          </p>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          {showDeathTraps &&
            hazards.map((hazard) => (
              <HazardCard key={hazard.id} hazard={hazard} compact />
            ))}

          {showDeathTraps && hazards.length === 0 && (
            <p className="text-ink-faint text-xs">Nothing reported yet.</p>
          )}

          {showIncidents && incidents.length > 0 && (
            <>
              {showDeathTraps && <div className="border-t border-line my-4" />}
              <h2 className="text-red-500 text-xs uppercase tracking-widest font-bold mb-1">
                Past incidents
              </h2>
              <p className="text-ink-faint text-xs mb-4">
                Where negligence already caused death or injury.
              </p>
              {incidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} compact />
              ))}
            </>
          )}
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        <Suspense
          fallback={
            <div className="h-full w-full flex items-center justify-center text-ink-faint text-sm">
              Loading map…
            </div>
          }
        >
          <IncidentMap
            incidents={filteredIncidents}
            hazards={filteredHazards}
            onSelectIncident={handleSelectIncident}
            onSelectHazard={handleSelectHazard}
          />
        </Suspense>

        {/* Legend / filter checkboxes — top right, above Leaflet */}
        <div className="absolute top-4 right-4 bg-black/90 border border-line rounded-lg p-3 shadow-2xl backdrop-blur-sm" style={{ zIndex: 1000 }}>
          <p className="text-ink-faint text-[10px] uppercase font-bold tracking-widest mb-2">Map Layers</p>
          <label className="flex items-center gap-2 cursor-pointer mb-2 group">
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
            <span className="text-xs text-ink-muted group-hover:text-ink transition">
              Reported issues
              <span className="text-yellow-500 font-mono ml-1">({hazards.length})</span>
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={() => setShowIncidents(!showIncidents)}
              className="sr-only peer"
            />
            <span className="w-4 h-4 rounded-sm border-2 border-red-500 bg-red-500/20 flex items-center justify-center peer-checked:bg-red-500 transition">
              {showIncidents && (
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-ink" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </span>
            <span className="text-xs text-ink-muted group-hover:text-ink transition">
              Past incidents
              <span className="text-red-500 font-mono ml-1">({incidents.length})</span>
            </span>
          </label>

          <div className="border-t border-line mt-3 pt-2 space-y-1">
            <p className="text-ink-faint text-[10px] uppercase font-bold tracking-widest">Key</p>
            <p className="text-[10px] text-ink-muted flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> Open
            </p>
            <p className="text-[10px] text-ink-muted flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Reported fixed
            </p>
          </div>
        </div>

        {/* Status overlay - fixed position */}
        <div className="fixed bottom-8 left-8 bg-black/90 p-4 border border-line rounded shadow-2xl backdrop-blur-sm" style={{ zIndex: 1000 }}>
          <h3 className="text-ink font-bold uppercase mb-2 text-sm">Across India</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="block text-2xl font-bold text-yellow-500 font-mono">
                {openCount}
              </span>
              <span className="text-xs text-ink-muted uppercase">Open</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-green-500 font-mono">
                {resolvedCount}
              </span>
              <span className="text-xs text-ink-muted uppercase">Fixed</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-red-500 font-mono">
                {incidents.length}
              </span>
              <span className="text-xs text-ink-muted uppercase">Past</span>
            </div>
          </div>
        </div>
      </main>

      {/* Incident detail panel */}
      {selectedIncident && (
        <aside className="w-96 bg-surface border-l border-line p-6 hidden lg:block overflow-y-auto">
          <div className="bg-blood text-white text-xs font-bold px-2 py-1 inline-block mb-4 uppercase">
            Selected Incident
          </div>
          {selectedIncident.image_url && (
            <img
              src={selectedIncident.image_url}
              alt="Evidence"
              className="w-full h-48 object-cover rounded mb-4 grayscale hover:grayscale-0 transition duration-500 border border-line"
            />
          )}
          <h2 className="text-2xl font-black text-ink mb-1">
            Case {selectedIncident.case_id}
          </h2>
          <p className="text-ink-muted text-sm mb-1">{selectedIncident.title}</p>
          <p className="text-red-500 font-mono text-xs mb-4">
            {selectedIncident.location.city}, {selectedIncident.location.state}
          </p>
          <p className="text-ink-muted text-sm">{selectedIncident.description}</p>
          <Link
            to={`/incident/${selectedIncident.id}`}
            className="inline-block mt-4 text-sm text-ink-muted hover:text-ink border border-line hover:border-gray-500 rounded px-4 py-2 font-header uppercase tracking-wide transition"
          >
            Open case file
          </Link>
        </aside>
      )}

      {/* Hazard detail panel */}
      {selectedHazard && (
        <aside className="w-96 bg-surface border-l border-line p-6 hidden lg:block overflow-y-auto">
          <div
            className={`text-ink text-xs font-bold px-2 py-1 inline-block mb-4 uppercase ${
              selectedHazard.status === 'Fixed' ? 'bg-green-700' : 'bg-yellow-700'
            }`}
          >
            {selectedHazard.status === 'Fixed' ? 'Reported fixed' : 'Open issue'}
          </div>
          {selectedHazard.image_url && (
            <img
              src={selectedHazard.image_url}
              alt="Evidence"
              className="w-full h-48 object-cover rounded mb-4 grayscale hover:grayscale-0 transition duration-500 border border-line"
            />
          )}
          <h2 className="text-2xl font-black text-ink mb-1">
            {negligenceLabel(selectedHazard.negligence_type)}
          </h2>
          <p className="text-yellow-500 font-mono text-xs mb-1">
            {selectedHazard.severity} severity
          </p>
          <p className="text-ink-faint text-xs mb-4">
            {selectedHazard.location.city}, {selectedHazard.location.state}
          </p>
          <p className="text-ink-muted text-sm">{selectedHazard.description}</p>
          <Link
            to={`/track/${selectedHazard.id}`}
            className="inline-block mt-4 text-sm text-white bg-blood hover:bg-red-700 rounded px-4 py-2 font-header uppercase tracking-wide transition"
          >
            Track this complaint
          </Link>
        </aside>
      )}
    </div>
  )
}
