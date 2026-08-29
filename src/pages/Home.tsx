import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronRight,
  Map as MapIcon,
  Mic,
  Search,
  Send,
  Route,
  ClipboardCheck,
} from 'lucide-react'
import HazardCard from '../components/HazardCard.tsx'
import { getAllHazards } from '../services/incidents.ts'
import type { Hazard } from '../types/incident.ts'
import { JURISDICTIONS } from '../data/jurisdictions.ts'
import { useLang } from '../i18n/index.tsx'

/**
 * Report-first homepage. The whole point of this page is to get a citizen into
 * the reporting journey in one tap, so the hero is the call to action and
 * everything else is supporting evidence. Past fatalities live at
 * /accountability instead — a body count is the wrong first impression for a
 * public-service workflow.
 */
export default function Home() {
  const { t, lang } = useLang()
  const [hazards, setHazards] = useState<Hazard[]>([])

  // Oswald has no Devanagari; use the body face for Hindi headings.
  const headFont = lang === 'hi' ? 'font-sans' : 'font-header'

  useEffect(() => {
    getAllHazards().then(setHazards)
  }, [])

  const stats = useMemo(() => {
    const open = hazards.filter((h) => h.status !== 'Fixed').length
    const resolved = hazards.filter((h) => h.status === 'Fixed').length
    const cities = new Set(hazards.map((h) => h.location.city)).size
    return [
      { label: t('home.stat.open'), value: open },
      { label: t('home.stat.resolved'), value: resolved },
      { label: t('home.stat.cities'), value: cities },
    ]
  }, [hazards, t])

  const recent = hazards.slice(0, 3)

  return (
    <div className="flex-grow bg-surface text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-bold border border-line rounded-full bg-raised tracking-wider">
            <Mic size={13} className="text-civic" />
            {t('home.eyebrow')}
          </div>

          <h1 className={`text-3xl sm:text-4xl md:text-5xl ${headFont} font-bold mt-5 leading-tight`}>
            {t('home.h1')}
          </h1>
          <p className="text-ink-muted text-base sm:text-lg mt-4 max-w-2xl leading-relaxed">
            {t('home.sub')}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-8">
            <Link
              to="/report"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 sm:py-3 font-header uppercase tracking-wide text-sm rounded bg-blood hover:bg-red-700 text-white font-bold transition"
            >
              <AlertTriangle size={16} />
              {t('home.cta.report')}
            </Link>
            <Link
              to="/report?demo=1"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 sm:py-3 font-header uppercase tracking-wide text-sm rounded border border-civic/40 bg-civic-soft text-civic hover:text-white hover:border-civic transition"
            >
              <Send size={16} />
              {t('home.cta.sample')}
            </Link>
            <Link
              to="/track"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 sm:py-3 font-header uppercase tracking-wide text-sm rounded border border-line text-ink hover:text-ink hover:border-gray-500 transition"
            >
              <Search size={16} />
              {t('home.cta.track')}
            </Link>
          </div>

          <p className="text-ink-faint text-xs mt-4">
            {t('home.noLogin')}
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-raised border border-line rounded-lg px-3 sm:px-5 py-4"
              >
                <p className="text-[10px] sm:text-xs text-ink-faint font-bold leading-tight">
                  {s.label}
                </p>
                <p className="text-2xl sm:text-3xl font-header mt-2">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-raised">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-header font-bold text-ink uppercase tracking-wide mb-1">
            {t('home.how.title')}
          </h2>
          <p className="text-ink-faint text-sm mb-8">
            {t('home.how.sub')}
          </p>

          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Step
              n={1}
              stepLabel={t('home.step')}
              icon={<Mic size={18} className="text-civic" />}
              title={t('home.step1.title')}
              body={t('home.step1.body')}
            />
            <Step
              n={2}
              stepLabel={t('home.step')}
              icon={<Route size={18} className="text-civic" />}
              title={t('home.step2.title')}
              body={t('home.step2.body')}
            />
            <Step
              n={3}
              stepLabel={t('home.step')}
              icon={<ClipboardCheck size={18} className="text-civic" />}
              title={t('home.step3.title')}
              body={t('home.step3.body')}
            />
          </ol>
        </div>
      </section>

      {/* Recently reported */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h2 className="text-xl font-header font-bold text-ink uppercase tracking-wide">
              {t('home.recent.title')}
            </h2>
            <p className="text-ink-faint text-sm mt-1">
              {t('home.recent.sub')}
            </p>
          </div>
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 text-sm text-civic hover:text-ink transition font-header uppercase tracking-wide"
          >
            <MapIcon size={14} /> {t('home.viewMap')}
          </Link>
        </div>

        {recent.length > 0 ? (
          <div className="space-y-4">
            {recent.map((hazard) => (
              <HazardCard key={hazard.id} hazard={hazard} compact />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-line rounded-lg p-6 text-ink-faint text-sm">
            {t('home.recent.empty')}
          </div>
        )}

        <Link
          to="/deathtraps"
          className="inline-flex items-center gap-1.5 mt-6 text-sm text-ink-muted hover:text-ink transition font-header uppercase tracking-wide"
        >
          {t('home.seeAll')} <ChevronRight size={14} />
        </Link>
      </section>

      {/* Coverage + accountability */}
      <section className="border-t border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-ink font-header font-bold uppercase text-sm tracking-widest mb-3">
              Departments we can route to
            </h3>
            <p className="text-ink-faint text-sm mb-3">
              Mapped for {JURISDICTIONS.length} cities so far. Anywhere else falls back to a
              generic municipal route.
            </p>
            <div className="flex flex-wrap gap-2">
              {JURISDICTIONS.map((j) => (
                <span
                  key={j.city}
                  className="text-xs text-ink-muted border border-line rounded-full px-3 py-1"
                >
                  {j.city}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-ink font-header font-bold uppercase text-sm tracking-widest mb-3">
              When prevention fails
            </h3>
            <p className="text-ink-faint text-sm mb-4">
              Some of these hazards have already killed people. Those cases are documented
              separately, with the chain of responsibility traced as far as it can be.
            </p>
            <Link
              to="/accountability"
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition font-header uppercase tracking-wide border border-line hover:border-gray-500 rounded px-4 py-2"
            >
              Accountability record <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function Step({
  n,
  icon,
  title,
  body,
  stepLabel,
}: {
  n: number
  icon: React.ReactNode
  title: string
  body: string
  stepLabel: string
}) {
  return (
    <li className="bg-raised border border-line rounded-lg p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-bold text-ink-faint">
          {stepLabel} {n}
        </span>
      </div>
      <p className="text-ink font-bold text-base mb-1.5">{title}</p>
      <p className="text-ink-muted text-sm leading-relaxed">{body}</p>
    </li>
  )
}
