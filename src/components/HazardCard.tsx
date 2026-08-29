import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, AlertTriangle, ExternalLink, ChevronUp, Share2 } from 'lucide-react'
import type { Hazard } from '../types/incident.ts'
import {
  formatRelativeTime,
  negligenceLabel,
  extractDomain,
} from '../utils/formatters.ts'
import { upvoteHazard, hasUpvoted } from '../services/incidents.ts'
import { isSampleRecord } from '../utils/negligence.ts'
import {
  getShareUrl,
  generateHazardCaption,
  buildShareLinks,
} from '../utils/share.ts'
import ShareSheet from './ShareSheet.tsx'

/**
 * Chip palettes for a light card.
 *
 * These were previously dark-on-dark tints (`bg-red-900 text-red-200`) written for
 * the near-black theme; on white they rendered as muddy maroon blocks that read as
 * a rendering fault rather than as labels.
 *
 * Severity and status are deliberately NOT the same weight. Severity answers "how
 * dangerous is this" and belongs to the hazard's identity, so it is a filled chip.
 * Status answers "where is this in the process" and is supporting metadata, so it
 * is quieter. Three identical pills in a row read as one undifferentiated group.
 */
const CHIP = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold'

const severityColors: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border border-red-200',
  High: 'bg-orange-100 text-orange-800 border border-orange-200',
  Medium: 'bg-amber-100 text-amber-800 border border-amber-200',
  Low: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
}

const statusColors: Record<string, string> = {
  Reported: 'bg-amber-50 text-amber-800 border border-amber-200',
  Verified: 'bg-blue-50 text-civic border border-blue-200',
  Fixed: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
}

interface HazardCardProps {
  hazard: Hazard
  compact?: boolean
  onUpvote?: () => void
}

export default function HazardCard({ hazard, compact = false, onUpvote }: HazardCardProps) {
  const [upvotes, setUpvotes] = useState(hazard.upvote_count || 0)
  const [voted, setVoted] = useState(() => hasUpvoted(hazard.id))
  const [showShare, setShowShare] = useState(false)

  // Pre-compute share data
  const shareUrl = getShareUrl('hazard', hazard.id)
  const caption = generateHazardCaption(hazard, shareUrl)
  const shareLinks = buildShareLinks(caption, shareUrl)

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

  function openShare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setShowShare(true)
  }

  // ── Compact (list) view ────────────────────────────────────────────────────
  if (compact) {
    return (
      <>
        <Link
          to={`/deathtraps/${hazard.id}`}
          className="block mb-4 pb-4 border-b border-line hover:bg-raised-2 p-2 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-ink group-hover:text-civic flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-600" />
              {negligenceLabel(hazard.negligence_type)}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${
                  voted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-raised-2 text-ink-muted hover:text-ink border border-line'
                }`}
              >
                <ChevronUp size={12} /> {upvotes}
              </button>
              <button
                onClick={openShare}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-raised-2 text-ink-muted hover:text-ink border border-line transition"
                title="Share"
              >
                <Share2 size={12} />
              </button>
              <span className="text-xs text-ink-faint">
                {formatRelativeTime(hazard.created_at)}
              </span>
            </div>
          </div>
          <p className="text-sm text-ink-muted mt-1 flex items-center gap-1">
            <MapPin size={12} />
            {hazard.location.city}, {hazard.location.state}
          </p>
          <div className="flex gap-2 mt-2">
            <span
              className={`${CHIP} ${severityColors[hazard.severity] ?? 'bg-raised-2 text-ink-muted border border-line'}`}
            >
              {hazard.severity}
            </span>
            <span
              className={`${CHIP} ${statusColors[hazard.status] ?? 'bg-raised-2 text-ink-muted border border-line'}`}
            >
              {hazard.status}
            </span>
            {isSampleRecord(hazard.id) && (
              <span className={`${CHIP} bg-civic-soft text-civic border border-civic/30`}>
                Sample
              </span>
            )}
          </div>
        </Link>

        {showShare && (
          <ShareSheet
            title={`Safety Hazard — ${negligenceLabel(hazard.negligence_type)} in ${hazard.location.city}`}
            caption={caption}
            shareUrl={shareUrl}
            links={shareLinks}
            onClose={() => setShowShare(false)}
          />
        )}
      </>
    )
  }

  // ── Full (detail) view ─────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-raised border border-line rounded-lg overflow-hidden shadow-2xl">
        {hazard.image_url && (
          <div className="relative h-96 w-full bg-raised-2 group">
            <img
              src={hazard.image_url}
              alt="Hazard evidence"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 bg-black/75 px-4 py-2">
              <p className="text-white text-sm flex items-center gap-2">
                <MapPin size={14} className="text-amber-300" />
                {hazard.location.city}, {hazard.location.state}
              </p>
            </div>
          </div>
        )}

        <div className="p-8">
          {/*
            Heading structure: an eyebrow naming the hazard type, then a
            sentence-case headline that says what and where. It used to read
            "Reported issue", which told the reader nothing they could not already
            see, directly beneath a page-level "SAFETY HAZARD" heading saying the
            same thing twice. The department and deadline live in the sidebar, so
            this side owns identity and evidence only.
          */}
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-2">
            Reported {formatRelativeTime(hazard.created_at)}
            {isSampleRecord(hazard.id) && ' · sample data'}
          </p>

          <h3 className="text-3xl font-header font-bold text-ink mb-3">
            {negligenceLabel(hazard.negligence_type)} risk in {hazard.location.city}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`${CHIP} ${severityColors[hazard.severity]}`}>
              {hazard.severity} severity
            </span>
            <span className={`${CHIP} ${statusColors[hazard.status]}`}>
              {hazard.status}
            </span>
          </div>

          <p className="text-base text-ink-muted mb-4 flex items-start gap-1.5">
            <MapPin size={16} className="shrink-0 mt-0.5" />
            <span>
              {hazard.location.address}, {hazard.location.city}, {hazard.location.state}
            </span>
          </p>
          <p className="text-lg text-ink mb-6 leading-relaxed">{hazard.description}</p>

          {hazard.evidence_links.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs text-ink-faint uppercase font-bold tracking-widest mb-3">
                Evidence / Sources
              </h4>
              <div className="flex flex-wrap gap-3">
                {hazard.evidence_links.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-civic hover:underline transition font-semibold text-sm"
                  >
                    <ExternalLink size={14} /> {extractDomain(link)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/*
            This was "0 UPVOTES" in a dark slab. Two problems: a zero count is
            worse than no count, and "upvote" frames corroboration as popularity —
            the point is that several people independently saw the same hazard,
            which is the only verification signal available without accounts.
          */}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleUpvote}
              disabled={voted}
              className={`flex items-center gap-2 px-4 py-2.5 rounded font-semibold text-sm transition ${
                voted
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                  : 'bg-raised text-ink border border-line hover:bg-raised-2'
              }`}
            >
              <ChevronUp size={16} />
              {voted ? "You've confirmed this" : "I've seen this too"}
            </button>

            <button
              onClick={openShare}
              className="flex items-center gap-2 px-4 py-2.5 rounded font-semibold text-sm transition bg-raised text-ink border border-line hover:bg-raised-2"
            >
              <Share2 size={16} /> Share
            </button>

            {upvotes > 0 && (
              <p className="text-sm text-ink-muted">
                {upvotes === 1
                  ? '1 person has confirmed seeing this'
                  : `${upvotes} people have confirmed seeing this`}
              </p>
            )}

            {hazard.reported_by && (
              <p className="text-sm text-ink-faint">Reported by: {hazard.reported_by}</p>
            )}
          </div>
        </div>
      </div>

      {showShare && (
        <ShareSheet
          title={`Safety Hazard — ${negligenceLabel(hazard.negligence_type)} in ${hazard.location.city}`}
          caption={caption}
          shareUrl={shareUrl}
          links={shareLinks}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  )
}
