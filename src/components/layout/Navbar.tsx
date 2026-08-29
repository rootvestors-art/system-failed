import { Link } from 'react-router-dom'
import { Megaphone, Menu, X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="border-b border-line bg-void sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex flex-col group hover:opacity-90 transition-opacity">
            <span className="text-3xl font-header font-bold text-ink tracking-tighter leading-none">
              CIVIC<span className="text-blood">FIX</span>
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-header uppercase tracking-[0.15em] text-ink-muted leading-none font-semibold">
                Report
              </span>
              <span className="text-ink-faint text-[10px] leading-none">•</span>
              <span className="text-xs font-header uppercase tracking-[0.15em] text-ink-muted leading-none font-semibold">
                Route
              </span>
              <span className="text-ink-faint text-[10px] leading-none">•</span>
              <span className="text-xs font-header uppercase tracking-[0.15em] text-ink-muted leading-none font-semibold">
                Resolve
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/map"
              className="text-ink-muted hover:text-ink transition font-header uppercase tracking-wide text-sm"
            >
              Map
            </Link>
            <Link
              to="/track"
              className="text-ink-muted hover:text-ink transition font-header uppercase tracking-wide text-sm"
            >
              Track
            </Link>
            <Link
              to="/how-it-works"
              className="text-ink-muted hover:text-ink transition font-header uppercase tracking-wide text-sm"
            >
              How it works
            </Link>
            <Link
              to="/deathtraps"
              className="text-yellow-500 hover:text-ink transition font-header uppercase tracking-wide text-sm flex items-center gap-1"
            >
              <AlertTriangle size={14} />
              Reported issues
            </Link>
            <Link
              to="/report"
              className="bg-blood hover:bg-red-700 text-white px-6 py-2 font-header font-bold uppercase tracking-wide flex items-center gap-2 transition"
            >
              <Megaphone size={16} />
              Report
            </Link>
          </div>

          <button
            className="md:hidden text-ink-muted hover:text-ink"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-line bg-void px-4 py-4 space-y-3">
          <Link
            to="/map"
            className="block text-ink-muted hover:text-ink font-header uppercase tracking-wide text-sm"
            onClick={() => setMenuOpen(false)}
          >
            Map
          </Link>
          <Link
            to="/track"
            className="block text-ink-muted hover:text-ink font-header uppercase tracking-wide text-sm"
            onClick={() => setMenuOpen(false)}
          >
            Track
          </Link>
          <Link
            to="/how-it-works"
            className="block text-ink-muted hover:text-ink font-header uppercase tracking-wide text-sm"
            onClick={() => setMenuOpen(false)}
          >
            How it works
          </Link>
          <Link
            to="/deathtraps"
            className="block text-yellow-500 hover:text-ink font-header uppercase tracking-wide text-sm flex items-center gap-1"
            onClick={() => setMenuOpen(false)}
          >
            <AlertTriangle size={14} />
            Reported issues
          </Link>
          <Link
            to="/report"
            className="block bg-blood hover:bg-red-700 text-white px-6 py-2 font-header font-bold uppercase tracking-wide text-center"
            onClick={() => setMenuOpen(false)}
          >
            Report
          </Link>
        </div>
      )}
    </nav>
  )
}
