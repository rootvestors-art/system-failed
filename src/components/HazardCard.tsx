import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, AlertTriangle, ExternalLink, ChevronUp } from 'lucide-react'
import type { Hazard } from '../types/incident.ts'
import {
  formatRelativeTime,
  negligenceLabel,
  extractDomain,
} from '../utils/formatters.ts'
import { upvoteHazard, hasUpvoted } from '../services/incidents.ts'

const severityColors: Record<string, string> = {
  Critical: 'bg-red-900 text-red-200',
  High: 'bg-orange-900 text-orange-200',
  Medium: 'bg-yellow-900 text-yellow-200',
  Low: 'bg-green-900 text-green-200',
}

const statusColors: Record<string, string> = {
  Reported: 'bg-yellow-900 text-yellow-200',
  Verified: 'bg-red-900 text-red-200',
  Fixed: 'bg-green-900 text-green-200',
}

interface HazardCardProps {
  hazard: Hazard
  compact?: boolean
  onUpvote?: () => void
}

export default function HazardCard({ hazard, compact = false, onUpvote }: HazardCardProps) {
  const [upvotes, setUpvotes] = useState(hazard.upvote_count || 0)
  const [voted, setVoted] = useState(() => hasUpvoted(hazard.id))

  async function handleUpvote(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (voted) return
    const prev = upvotes
    setUpvotes(prev + 1)
    setVoted(true)
    try {
      await upvoteHazard(hazard.id)
      onUpvote?.()
    } catch (err) {
      console.error('Upvote failed:', err)
      setUpvotes(prev)
      setVoted(false)
    }
  }

  if (compact) {
    return (
      <Link
        to={`/deathtraps/${hazard.id}`}
        className="block mb-4 pb-4 border-b border-gray-800 hover:bg-[#1a1a1a] p-2 transition cursor-pointer group"
      >
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-white group-hover:text-yellow-500 flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-500" />
            {negligenceLabel(hazard.negligence_type)}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${
                voted
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <ChevronUp size={12} /> {upvotes}
            </button>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(hazard.created_at)}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
          <MapPin size={12} />
          {hazard.location.city}, {hazard.location.state}
        </p>
        <div className="flex gap-2 mt-2">
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded font-bold uppercase ${severityColors[hazard.severity] ?? 'bg-gray-800 text-gray-300'}`}
          >
            {hazard.severity}
          </span>
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded font-bold uppercase ${statusColors[hazard.status] ?? 'bg-gray-800 text-gray-300'}`}
          >
            {hazard.status}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-[#111] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
      {hazard.image_url && (
        <div className="relative h-96 w-full bg-gray-800 group">
          <img
            src={hazard.image_url}
            alt="Hazard evidence"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500 grayscale group-hover:grayscale-0"
          />
          <div className="absolute bottom-0 left-0 bg-black bg-opacity-90 px-4 py-2">
            <p className="text-white font-mono text-sm flex items-center gap-2">
              <MapPin size={14} className="text-yellow-500" />
              {hazard.location.city.toUpperCase()},{' '}
              {hazard.location.state.toUpperCase()}
            </p>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className={`px-3 py-1 text-xs font-bold uppercase rounded ${severityColors[hazard.severity]}`}
          >
            {hazard.severity}
          </span>
          <span className="px-3 py-1 bg-yellow-900 text-yellow-200 text-xs font-bold uppercase rounded">
            {negligenceLabel(hazard.negligence_type)}
          </span>
          <span
            className={`px-3 py-1 text-xs font-bold uppercase rounded ${statusColors[hazard.status]}`}
          >
            {hazard.status}
          </span>
        </div>

        <h3 className="text-4xl font-header font-bold text-white mb-2 flex items-center gap-3">
          <AlertTriangle size={32} className="text-yellow-500" />
          DEATH TRAP
        </h3>
        <p className="text-lg text-gray-400 mb-2 flex items-center gap-1">
          <MapPin size={16} />
          {hazard.location.address}, {hazard.location.city}, {hazard.location.state}
        </p>
        <p className="text-xl text-gray-400 mb-6">{hazard.description}</p>

        {hazard.evidence_links.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-3">
              Evidence / Sources
            </h4>
            <div className="flex flex-wrap gap-3">
              {hazard.evidence_links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-yellow-500 hover:text-white transition font-bold uppercase tracking-wider text-sm"
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
                ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}
          >
            <ChevronUp size={18} /> {upvotes} Upvotes
          </button>
          {hazard.reported_by && (
            <p className="text-sm text-gray-500">
              Reported by: {hazard.reported_by}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
