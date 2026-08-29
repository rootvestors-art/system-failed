import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, ArrowUpCircle, ChevronRight } from 'lucide-react'
import { type ComplaintStatus, formatRemaining, isExhausted } from '../utils/complaintStatus.ts'

/**
 * Compact status card for a public report page.
 *
 * Answers the only question a reader actually has — is anyone doing anything
 * about this — before any generic explanation of what a hazard is. The full
 * escalation ladder stays on the tracker; this is the summary plus a way in.
 */
export default function ComplaintStatusPanel({
  status,
  trackId,
}: {
  status: ComplaintStatus
  trackId: string
}) {
  const { resolved, agency, active, daysLeft, escalations, progress, jurisdiction } = status
  const exhausted = isExhausted(status)

  return (
    <div
      className={`rounded-lg border p-5 ${
        resolved
          ? 'border-green-700 bg-green-950/20'
          : escalations > 0
            ? 'border-blood bg-blood/10'
            : 'border-gray-800 bg-[#111]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <h3 className="font-header font-bold text-white uppercase text-sm tracking-widest">
          Complaint status
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-yellow-900/30 text-yellow-500 border border-yellow-800">
          Simulated
        </span>
      </div>

      {/* Headline state */}
      {resolved ? (
        <div className="flex items-start gap-2.5 mb-4">
          <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-white font-bold text-sm">Reported fixed</p>
            <p className="text-gray-400 text-xs mt-0.5">
              A citizen confirmed this hazard has been repaired.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 mb-4">
          <Clock className="text-caution shrink-0 mt-0.5" size={18} />
          <div className="min-w-0">
            <p className="text-white font-bold text-sm">
              {exhausted ? 'Unresolved at every level' : `With ${active?.authority ?? agency}`}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">{formatRemaining(daysLeft)}</p>
          </div>
        </div>
      )}

      {escalations > 0 && !resolved && (
        <p className="flex items-center gap-1.5 text-xs text-blood font-bold mb-4">
          <ArrowUpCircle size={13} />
          Escalated {escalations} time{escalations === 1 ? '' : 's'} — nobody has acted
        </p>
      )}

      {/* Four-step progress bar */}
      <ol className="grid grid-cols-4 gap-1.5 mb-4">
        {progress.map((stage, i) => {
          const isCurrent = stage.reached && !progress[i + 1]?.reached
          return (
            <li key={stage.label}>
              <div
                className={`h-1.5 rounded-full mb-1.5 ${
                  stage.reached ? 'bg-green-500' : 'bg-gray-800'
                }`}
              />
              <p
                className={`text-[10px] font-bold leading-tight ${
                  isCurrent ? 'text-white' : stage.reached ? 'text-green-400' : 'text-gray-600'
                }`}
              >
                {stage.label}
              </p>
            </li>
          )
        })}
      </ol>

      <dl className="space-y-2 text-xs border-t border-gray-800 pt-3">
        <div>
          <dt className="text-gray-500 uppercase tracking-widest text-[10px]">
            Routed to
          </dt>
          <dd className="text-gray-200 mt-0.5">{agency}</dd>
        </div>
        <div>
          <dt className="text-gray-500 uppercase tracking-widest text-[10px]">
            Instead of
          </dt>
          <dd className="text-gray-400 mt-0.5">{jurisdiction.existingPortal}</dd>
        </div>
      </dl>

      <Link
        to={`/track/${trackId}`}
        className="inline-flex items-center gap-1 mt-4 text-sm font-header uppercase tracking-wide text-white border border-gray-700 hover:border-gray-500 rounded px-4 py-2 transition"
      >
        Full timeline <ChevronRight size={14} />
      </Link>
    </div>
  )
}
