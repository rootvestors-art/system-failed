import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { getAllHazards } from '../../services/incidents.ts'
import HazardCard from '../../components/HazardCard.tsx'
import SearchAndFilters from '../../components/SearchAndFilters.tsx'
import type { Hazard } from '../../types/incident.ts'
import { useHazardFilters } from '../../hooks/useFilterParams.ts'
import {
  filterHazards,
  getStates,
  getCities,
  getTypes,
  getStatuses,
  getSeverities,
} from '../../utils/filterIncidents.ts'

export default function DeathTrapList() {
  const [hazards, setHazards] = useState<Hazard[]>([])

  const { values, isFiltered, set, clear } = useHazardFilters()

  useEffect(() => {
    getAllHazards().then(setHazards)
  }, [])

  // Build option lists from the full dataset
  const stateOptions = getStates(hazards)
  const cityOptions = getCities(hazards, values.state)
  const typeOptions = getTypes(hazards)
  const statusOptions = getStatuses(hazards)
  const severityOptions = getSeverities(hazards)

  // Apply client-side filters when any filter is active
  const filteredResults = isFiltered ? filterHazards(hazards, values) : []

  const latest = hazards[0]

  const severityCounts = {
    Critical: hazards.filter((h) => h.severity === 'Critical').length,
    High: hazards.filter((h) => h.severity === 'High').length,
    Medium: hazards.filter((h) => h.severity === 'Medium').length,
    Low: hazards.filter((h) => h.severity === 'Low').length,
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <SearchAndFilters
        values={values}
        onSet={set}
        onClear={clear}
        isFiltered={isFiltered}
        placeholder="Search by description or hazard type…"
        stateOptions={stateOptions}
        cityOptions={cityOptions}
        typeOptions={typeOptions}
        statusOptions={statusOptions}
        severityOptions={severityOptions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-header font-bold text-ink border-l-4 border-amber-500 pl-4 flex items-center gap-3">
              <AlertTriangle size={28} className="text-amber-600" />
              REPORTED ISSUES
            </h2>
          </div>

          {isFiltered ? (
            /* ── Filtered results view ── */
            <>
              <p className="text-ink-faint text-sm mb-6 font-mono">
                Showing{' '}
                <span className="text-ink font-bold">{filteredResults.length}</span>{' '}
                {filteredResults.length === 1 ? 'result' : 'results'}
              </p>
              {filteredResults.length > 0 ? (
                filteredResults.map((hazard) => (
                  <HazardCard key={hazard.id} hazard={hazard} compact />
                ))
              ) : (
                <p className="text-ink-faint text-sm py-12 text-center">
                  No reported issues match your filters.
                </p>
              )}
            </>
          ) : latest ? (
            /* ── Curated layout (unchanged) ── */
            <>
              <HazardCard hazard={latest} />
              {hazards.length > 1 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-header font-bold text-ink border-l-4 border-line pl-4 mb-6">
                    MORE REPORTED ISSUES
                  </h2>
                  {hazards.slice(1).map((hazard) => (
                    <HazardCard key={hazard.id} hazard={hazard} compact />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-raised border border-line rounded-lg p-10 text-center">
              <AlertTriangle size={48} className="text-amber-600 mx-auto mb-4" />
              <h3 className="text-2xl font-header font-bold text-ink mb-2">
                Nothing Reported Yet
              </h3>
              <p className="text-ink-muted mb-6">
                Noticed a problem in your area? Report it so it can be fixed before it gets worse.
              </p>
              <Link
                to="/report"
                className="inline-block bg-blood hover:bg-red-700 text-white px-8 py-3 font-bold rounded transition"
              >
                Report an issue
              </Link>
            </div>
          )}
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="lg:col-span-1">
          {/* Severity breakdown — hidden in filtered mode */}
          {!isFiltered && (
            <div className="bg-raised border border-line rounded-lg p-6 mb-6">
              <h3 className="text-xl font-header font-bold text-ink mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                SEVERITY BREAKDOWN
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-l-4 border-red-500 pl-3">
                  <span className="text-ink-muted text-sm uppercase font-bold">Critical</span>
                  <span className="text-red-700 font-mono text-lg font-bold">{severityCounts.Critical}</span>
                </div>
                <div className="flex justify-between items-center border-l-4 border-orange-500 pl-3">
                  <span className="text-ink-muted text-sm uppercase font-bold">High</span>
                  <span className="text-orange-700 font-mono text-lg font-bold">{severityCounts.High}</span>
                </div>
                <div className="flex justify-between items-center border-l-4 border-amber-500 pl-3">
                  <span className="text-ink-muted text-sm uppercase font-bold">Medium</span>
                  <span className="text-amber-700 font-mono text-lg font-bold">{severityCounts.Medium}</span>
                </div>
                <div className="flex justify-between items-center border-l-4 border-green-500 pl-3">
                  <span className="text-ink-muted text-sm uppercase font-bold">Low</span>
                  <span className="text-emerald-700 font-mono text-lg font-bold">{severityCounts.Low}</span>
                </div>
              </div>
            </div>
          )}

          {/*
            This was a dark olive slab holding a light button with white text on
            it, so the label was invisible. On a light page the call to action
            does not need a heavy background to stand out — the red button does
            that on its own.
          */}
          <div className="bg-raised border border-line rounded-lg p-5 text-center">
            <h3 className="text-ink font-header font-bold text-xl">
              Noticed a problem nearby?
            </h3>
            <p className="text-ink-muted text-sm mt-1 mb-4">
              Report it and we'll send it to the right department with a deadline.
            </p>
            <Link
              to="/report"
              className="block bg-blood hover:bg-red-700 text-white px-6 py-3 font-bold rounded w-full transition text-center"
            >
              Report an issue
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
