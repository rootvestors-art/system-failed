import { Link } from 'react-router-dom'
import { Megaphone, Menu, X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="border-b border-gray-800 bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <span className="text-3xl font-header font-bold text-blood tracking-tighter">
              SYSTEM<span className="text-white">FAILED</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/map"
              className="text-gray-400 hover:text-white transition font-header uppercase tracking-wide text-sm"
            >
              Map
            </Link>
            <Link
              to="/deathtraps"
              className="text-yellow-500 hover:text-white transition font-header uppercase tracking-wide text-sm flex items-center gap-1"
            >
              <AlertTriangle size={14} />
              Death Traps
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
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-black px-4 py-4 space-y-3">
          <Link
            to="/map"
            className="block text-gray-400 hover:text-white font-header uppercase tracking-wide text-sm"
            onClick={() => setMenuOpen(false)}
          >
            Map
          </Link>
          <Link
            to="/deathtraps"
            className="block text-yellow-500 hover:text-white font-header uppercase tracking-wide text-sm flex items-center gap-1"
            onClick={() => setMenuOpen(false)}
          >
            <AlertTriangle size={14} />
            Death Traps
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
