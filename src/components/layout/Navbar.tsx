import { Link } from 'react-router-dom'
import { Megaphone, Menu, X, AlertTriangle, Languages } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '../../i18n/index.tsx'

/**
 * Language switch. Placed in the navbar rather than buried in settings because a
 * citizen who cannot read English needs to find it in the first second, before
 * they have read anything else on the page — so the control itself is labelled
 * in both scripts.
 */
function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang()

  return (
    <div
      className={`flex items-center rounded border border-line overflow-hidden ${compact ? 'w-full' : ''}`}
    >
      <Languages size={13} className="text-ink-faint ml-2 mr-1 shrink-0" />
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`px-2.5 py-1.5 text-xs font-bold transition ${
          lang === 'en' ? 'bg-blood text-white' : 'text-ink-muted hover:text-ink'
        } ${compact ? 'flex-1' : ''}`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLang('hi')}
        aria-pressed={lang === 'hi'}
        className={`px-2.5 py-1.5 text-xs font-bold transition ${
          lang === 'hi' ? 'bg-blood text-white' : 'text-ink-muted hover:text-ink'
        } ${compact ? 'flex-1' : ''}`}
      >
        हिन्दी
      </button>
    </div>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, lang } = useLang()

  // The condensed Latin display face has no Devanagari, so Hindi nav items use
  // the body face instead of silently falling back mid-navbar.
  const navFont = lang === 'hi' ? 'font-sans font-semibold' : 'font-header uppercase tracking-wide'
  const navLink = `text-ink-muted hover:text-ink transition text-sm ${navFont}`

  return (
    <nav className="border-b border-line bg-void sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex flex-col group hover:opacity-90 transition-opacity">
            <span className="text-3xl font-header font-bold text-ink tracking-tighter leading-none">
              CIVIC<span className="text-blood">FIX</span>
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs text-ink-muted leading-none font-semibold ${navFont}`}>
                {t('nav.tagline.report')}
              </span>
              <span className="text-ink-faint text-[10px] leading-none">•</span>
              <span className={`text-xs text-ink-muted leading-none font-semibold ${navFont}`}>
                {t('nav.tagline.route')}
              </span>
              <span className="text-ink-faint text-[10px] leading-none">•</span>
              <span className={`text-xs text-ink-muted leading-none font-semibold ${navFont}`}>
                {t('nav.tagline.resolve')}
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-5">
            <LanguageToggle />
            <Link to="/map" className={navLink}>
              {t('nav.map')}
            </Link>
            <Link to="/track" className={navLink}>
              {t('nav.track')}
            </Link>
            <Link to="/how-it-works" className={navLink}>
              {t('nav.howItWorks')}
            </Link>
            <Link
              to="/deathtraps"
              className={`text-amber-500 hover:text-ink transition text-sm flex items-center gap-1 ${navFont}`}
            >
              <AlertTriangle size={14} />
              {t('nav.reportedIssues')}
            </Link>
            <Link
              to="/report"
              className={`bg-blood hover:bg-red-700 text-white px-6 py-2 font-bold flex items-center gap-2 transition ${navFont}`}
            >
              <Megaphone size={16} />
              {t('nav.report')}
            </Link>
          </div>

          <button
            className="md:hidden text-ink-muted hover:text-ink"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-line bg-void px-4 py-4 space-y-3">
          <LanguageToggle compact />
          <Link to="/map" className={`block ${navLink}`} onClick={() => setMenuOpen(false)}>
            {t('nav.map')}
          </Link>
          <Link to="/track" className={`block ${navLink}`} onClick={() => setMenuOpen(false)}>
            {t('nav.track')}
          </Link>
          <Link
            to="/how-it-works"
            className={`block ${navLink}`}
            onClick={() => setMenuOpen(false)}
          >
            {t('nav.howItWorks')}
          </Link>
          <Link
            to="/deathtraps"
            className={`block text-amber-500 hover:text-ink text-sm flex items-center gap-1 ${navFont}`}
            onClick={() => setMenuOpen(false)}
          >
            <AlertTriangle size={14} />
            {t('nav.reportedIssues')}
          </Link>
          <Link
            to="/report"
            className={`block bg-blood hover:bg-red-700 text-white px-6 py-2 font-bold text-center ${navFont}`}
            onClick={() => setMenuOpen(false)}
          >
            {t('nav.report')}
          </Link>
        </div>
      )}
    </nav>
  )
}
