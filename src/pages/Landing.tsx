import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Map, Megaphone, ShieldQuestion } from 'lucide-react'
import IncidentCard from '../components/IncidentCard.tsx'
import HazardCard from '../components/HazardCard.tsx'
import DeathCounter from '../components/DeathCounter.tsx'
import { getAllIncidents, getAllHazards } from '../services/incidents.ts'
import type { Hazard, Incident } from '../types/incident.ts'

type Brand = 'systemfailed' | 'fixmysystem'

interface LandingProps {
  brand: Brand
}

const brandCopy: Record<
  Brand,
  {
    title: string
    subtitle: string
    primaryBtn: string
    secondaryBtn: string
    primaryColor: string
    borderAccent: string
    ribbon: string
  }
> = {
  systemfailed: {
    title: 'SystemFailed',
    subtitle: 'Document negligence. Name those responsible. Demand justice.',
    primaryBtn: 'Report an Incident',
    secondaryBtn: 'View Map',
    primaryColor: 'bg-blood hover:bg-red-700 text-white',
    borderAccent: 'border-blood',
    ribbon: 'bg-blood text-white',
  },
  fixmysystem: {
    title: 'FixMySystem',
    subtitle: 'Surface dangers. Alert authorities. Save lives before they’re lost.',
    primaryBtn: 'Flag a Hazard',
    secondaryBtn: 'See Reported Cases',
    primaryColor: 'bg-caution hover:bg-yellow-500 text-black',
    borderAccent: 'border-caution',
    ribbon: 'bg-yellow-700 text-white',
  },
}

export default function Landing({ brand }: LandingProps) {
  const copy = brandCopy[brand]
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [hazards, setHazards] = useState<Hazard[]>([])

  useEffect(() => {
    getAllIncidents().then(setIncidents)
    getAllHazards().then(setHazards)
  }, [])

  const latestIncident = incidents[0]
  const featuredHazard = hazards[0]

  const stats = useMemo(
    () => [
      {
        label: 'Incidents Logged',
        value: incidents.length,
      },
      {
        label: 'Death Traps Flagged',
        value: hazards.length,
      },
      {
        label: 'Cities Covered',
        value: new Set(incidents.map((i) => i.location.city)).size || 12,
      },
    ],
    [hazards.length, incidents],
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0b0b0b] to-[#111] opacity-90" />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(217,4,41,0.08), transparent 35%), radial-gradient(circle at 80% 10%, rgba(234,179,8,0.08), transparent 30%)',
        }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase border border-gray-800 rounded-full bg-[#111]">
            <AlertTriangle size={14} className="text-caution" />
            Accountability • Prevention
          </div>
          <h1 className="text-4xl md:text-5xl font-header font-bold mt-6 leading-tight">
            {copy.title}
          </h1>
          <p className="text-gray-400 text-lg mt-4 max-w-2xl">
            {copy.subtitle}
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to={brand === 'fixmysystem' ? '/deathtraps' : '/report'}
              className={`inline-flex items-center gap-2 px-6 py-3 font-header uppercase tracking-wide text-sm rounded ${copy.primaryColor}`}
            >
              {brand === 'fixmysystem' ? <Megaphone size={16} /> : <AlertTriangle size={16} />}
              {copy.primaryBtn}
            </Link>
            <Link
              to={brand === 'fixmysystem' ? '/cases' : '/map'}
              className="inline-flex items-center gap-2 px-6 py-3 font-header uppercase tracking-wide text-sm rounded border border-gray-700 text-gray-200 hover:text-white hover:border-gray-500 transition"
            >
              {brand === 'fixmysystem' ? <ShieldQuestion size={16} /> : <Map size={16} />}
              {copy.secondaryBtn}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-[#0d0d0d] border border-gray-800 rounded-lg px-5 py-4"
              >
                <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                  {s.label}
                </p>
                <p className="text-3xl font-header mt-2">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Death counter */}
      <DeathCounter />

      {/* Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={`border-l-4 ${copy.borderAccent} pl-4`}>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">
              Latest Case File
            </p>
            <h2 className="text-2xl font-header font-bold text-white">Hold the system accountable</h2>
          </div>
          {latestIncident ? (
            <IncidentCard incident={latestIncident} />
          ) : (
            <div className="border border-dashed border-gray-700 rounded-lg p-6 text-gray-500">
              No incidents yet. Be the first to report.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className={`px-3 py-1 inline-flex items-center gap-2 text-xs font-bold uppercase rounded ${copy.ribbon}`}>
            {brand === 'fixmysystem' ? 'Prevent it' : 'Expose it'}
          </div>
          <div className={`border-l-4 ${copy.borderAccent} pl-4`}>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">
              Active Death Trap
            </p>
            <h3 className="text-xl font-header font-bold text-white">Stop the next fatality</h3>
          </div>
          {featuredHazard ? (
            <HazardCard hazard={featuredHazard} />
          ) : (
            <div className="border border-dashed border-gray-700 rounded-lg p-6 text-gray-500">
              No hazards reported. Flag the dangers around you.
            </div>
          )}
          <Link
            to="/deathtraps"
            className="inline-flex items-center gap-2 text-sm text-caution hover:text-white transition font-header uppercase tracking-wide"
          >
            View all death traps <ChevronRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
