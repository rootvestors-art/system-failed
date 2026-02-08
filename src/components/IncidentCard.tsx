import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, ChevronUp, ExternalLink } from 'lucide-react'
import type { Incident } from '../types/incident.ts'
import {
  formatRelativeTime,
  negligenceLabel,
  googleSearchUrl,
  twitterSearchUrl,
  extractDomain,
} from '../utils/formatters.ts'
import { upvoteIncident, hasUpvoted } from '../services/incidents.ts'
import { getTotalDeaths, getTotalInjuries, getVictimSummary, getVictimsList } from '../utils/victims.ts'

const statusColors: Record<string, string> = {
  Verified: 'bg-red-900 text-red-200',
  Community_Flagged: 'bg-yellow-900 text-yellow-200',
  Official_Denial: 'bg-gray-700 text-gray-300',
}

interface IncidentCardProps {
  incident: Incident
  compact?: boolean
  onUpvote?: () => void
}

export default function IncidentCard({
  incident,
  compact = false,
  onUpvote,
}: IncidentCardProps) {
  const [upvotes, setUpvotes] = useState(incident.upvote_count || 0)
  const [voted, setVoted] = useState(() => hasUpvoted(incident.id))

  async function handleUpvote(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (voted) return
    const prev = upvotes
    setUpvotes(prev + 1)
    setVoted(true)
    try {
      await upvoteIncident(incident.id)
      onUpvote?.()
    } catch (err) {
      console.error('Upvote failed:', err)
      setUpvotes(prev)
      setVoted(false)
    }
  }

  if (compact) {
    const deaths = getTotalDeaths(incident)
    const injuries = getTotalInjuries(incident)
    
    return (
      <Link
        to={`/incident/${incident.id}`}
        className="block mb-4 pb-4 border-b border-gray-800 hover:bg-[#1a1a1a] p-2 transition cursor-pointer group"
      >
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-white group-hover:text-blood">
            {incident.title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${
                voted
                  ? 'bg-blood/20 text-blood'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <ChevronUp size={12} /> {upvotes}
            </button>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(incident.created_at)}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {getVictimSummary(incident)}
        </p>
        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
          <MapPin size={12} />
          {incident.location.city}, {incident.location.state}
        </p>
        <div className="flex gap-2 mt-2">
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded font-bold uppercase ${statusColors[incident.status] ?? 'bg-gray-800 text-gray-300'}`}
          >
            {negligenceLabel(incident.negligence_type)}
          </span>
          {deaths > 0 && (
            <span className="inline-block text-xs px-2 py-0.5 rounded font-bold uppercase bg-red-900 text-red-200">
              {deaths} {deaths === 1 ? 'Death' : 'Deaths'}
            </span>
          )}
          {injuries > 0 && (
            <span className="inline-block text-xs px-2 py-0.5 rounded font-bold uppercase bg-yellow-900 text-yellow-200">
              {injuries} Injured
            </span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-[#111] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
      {incident.image_url && (
        <div className="relative h-96 w-full bg-gray-800 group">
          <img
            src={incident.image_url}
            alt="Scene of incident"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500 grayscale group-hover:grayscale-0"
          />
          <div className="absolute bottom-0 left-0 bg-black bg-opacity-90 px-4 py-2">
            <p className="text-white font-mono text-sm flex items-center gap-2">
              <MapPin size={14} className="text-blood" />
              {incident.location.city.toUpperCase()},{' '}
              {incident.location.state.toUpperCase()}
            </p>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-red-900 text-red-200 text-xs font-bold uppercase rounded">
            {negligenceLabel(incident.negligence_type)}
          </span>
          <span
            className={`px-3 py-1 text-xs font-bold uppercase rounded ${statusColors[incident.status]}`}
          >
            {incident.status.replace(/_/g, ' ')}
          </span>
          {getTotalDeaths(incident) > 0 && (
            <span className="px-3 py-1 text-xs font-bold uppercase rounded bg-red-900 text-red-200">
              {getTotalDeaths(incident)} {getTotalDeaths(incident) === 1 ? 'Death' : 'Deaths'}
            </span>
          )}
          {getTotalInjuries(incident) > 0 && (
            <span className="px-3 py-1 text-xs font-bold uppercase rounded bg-yellow-900 text-yellow-200">
              {getTotalInjuries(incident)} Injured
            </span>
          )}
        </div>

        <h3 className="text-4xl font-header font-bold text-white mb-4">
          {incident.title}
        </h3>

        {/* Victims Section */}
        <div className="mb-6 pb-6 border-b border-gray-800">
          <h4 className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-3">
            Victims
          </h4>
          <div className="space-y-2">
            {incident.victims.map((victim, i) => (
              <div key={i} className="text-gray-300">
                <span className="font-semibold">
                  {victim.name || 'Unknown victim'}
                  {victim.age && `, ${victim.age}`}
                </span>
                {victim.occupation && (
                  <span className="text-gray-500 text-sm ml-2">
                    — {victim.occupation}
                  </span>
                )}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                  victim.outcome === 'Death' 
                    ? 'bg-red-900/50 text-red-300' 
                    : 'bg-yellow-900/50 text-yellow-300'
                }`}>
                  {victim.outcome === 'Death' ? 'Deceased' : 'Injured'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xl text-gray-400 mb-6">{incident.description}</p>

        {incident.evidence_links.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-3">
              Evidence / Sources
            </h4>
            <div className="flex flex-wrap gap-3">
              {incident.evidence_links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blood hover:text-white transition font-bold uppercase tracking-wider text-sm"
                >
                  <ExternalLink size={14} /> {extractDomain(link)}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-2 px-4 py-2 rounded font-bold uppercase text-sm transition ${
              voted
                ? 'bg-blood/20 text-blood border border-blood/50'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}
          >
            <ChevronUp size={18} /> {upvotes} Upvotes
          </button>
          <a
            href={googleSearchUrl(
              incident.title,
              incident.location.city,
              incident.negligence_type,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blood hover:text-white transition font-bold uppercase tracking-wider text-sm"
          >
            <Search size={14} /> Search News
          </a>
          <a
            href={twitterSearchUrl(
              incident.title,
              incident.location.city,
              incident.negligence_type,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition font-bold uppercase tracking-wider text-sm"
          >
            Search on X / Twitter &rarr;
          </a>
        </div>
      </div>
    </div>
  )
}
