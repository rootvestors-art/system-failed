import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, ArrowUpCircle, ChevronRight } from 'lucide-react'
import { type ComplaintStatus, formatRemaining, isExhausted } from '../utils/complaintStatus.ts'
import { useLang } from '../i18n/index.tsx'

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
  const { t, lang } = useLang()
  const { resolved, agency, active, daysLeft, escalations, progress, jurisdiction } = status
  const exhausted = isExhausted(status)

  return (
    <div
      className={`rounded-lg border p-5 ${
        resolved
          ? 'border-green-300 bg-green-50'
          : escalations > 0
            ? 'border-blood bg-red-50'
            : 'border-line bg-raised'
      }`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <h3 className="font-header font-bold text-ink uppercase text-sm tracking-widest">
          {t('track.status')}
        </h3>
        <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-300">
          {t('track.simulated')}
        </span>
      </div>

      {/* Headline state */}
      {resolved ? (
        <div className="flex items-start gap-2.5 mb-4">
          <CheckCircle2 className="text-green-700 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-ink font-bold text-sm">{t('track.reportedFixed')}</p>
            <p className="text-ink-muted text-xs mt-0.5">
              A citizen confirmed this hazard has been repaired.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 mb-4">
          <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="min-w-0">
            <p className="text-ink font-bold text-sm">
              {exhausted ? t('track.exhausted') : `${t('track.with')} ${active?.authority ?? agency}`}
            </p>
            <p className="text-ink-muted text-xs mt-0.5">{formatRemaining(daysLeft, lang)}</p>
          </div>
        </div>
      )}

      {escalations > 0 && !resolved && (
        <p className="flex items-center gap-1.5 text-xs text-blood font-bold mb-4">
          <ArrowUpCircle size={13} />
          {escalations === 1
            ? t('track.escalatedOnce')
            : t('track.escalatedTimes', { n: escalations })}
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
                  stage.reached ? 'bg-green-500' : 'bg-raised-2'
                }`}
              />
              <p
                className={`text-[10px] font-bold leading-tight ${
                  isCurrent ? 'text-ink' : stage.reached ? 'text-green-700' : 'text-ink-faint'
                }`}
              >
                {stage.label}
              </p>
            </li>
          )
        })}
      </ol>

      <dl className="space-y-2 text-xs border-t border-line pt-3">
        <div>
          <dt className="text-ink-faint text-[10px]">
            {t('track.routedTo')}
          </dt>
          <dd className="text-ink mt-0.5">{agency}</dd>
        </div>
        <div>
          <dt className="text-ink-faint text-[10px]">
            {t('track.instead')}
          </dt>
          <dd className="text-ink-muted mt-0.5">{jurisdiction.existingPortal}</dd>
        </div>
      </dl>

      <Link
        to={`/track/${trackId}`}
        className="inline-flex items-center gap-1 mt-4 text-sm font-header uppercase tracking-wide text-ink border border-line hover:border-ink-faint rounded px-4 py-2 transition"
      >
        {t('track.fullTimeline')} <ChevronRight size={14} />
      </Link>
    </div>
  )
}
