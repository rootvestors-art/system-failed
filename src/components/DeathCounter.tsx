import { useEffect, useState } from 'react'
import { getAllIncidents } from '../services/incidents.ts'
import { getTotalDeaths } from '../utils/victims.ts'

function Digit({ value }: { value: string }) {
  const [animating, setAnimating] = useState(false)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (value !== display) {
      setAnimating(true)
      const timeout = setTimeout(() => {
        setDisplay(value)
        setAnimating(false)
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [value, display])

  return (
    <span
      className={`inline-block bg-charcoal border border-gray-700 text-white font-header text-6xl md:text-9xl w-[1.2em] text-center leading-none py-2 ${
        animating ? 'animate-flip' : ''
      }`}
      style={{ perspective: '200px' }}
    >
      {display}
    </span>
  )
}

export default function DeathCounter() {
  const [count, setCount] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    getAllIncidents().then(incidents => {
      const total = incidents.reduce((sum, inc) => sum + getTotalDeaths(inc), 0)
      setCount(total)
    })
  }, [])

  useEffect(() => {
    if (displayCount < count) {
      const timeout = setTimeout(
        () => setDisplayCount((c) => Math.min(c + 1, count)),
        50,
      )
      return () => clearTimeout(timeout)
    }
  }, [displayCount, count])

  const digits = String(displayCount).padStart(2, '0').split('')

  return (
    <div className="bg-charcoal border-b border-gray-800">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-400 font-header tracking-widest uppercase text-sm mb-4">
          Since January 1, 2026
        </p>
        <div className="flex justify-center gap-2 mb-4">
          {digits.map((d, i) => (
            <Digit key={i} value={d} />
          ))}
        </div>
        <p className="text-xl md:text-2xl text-blood font-header uppercase tracking-wide">
          Lives stolen by Systemic Negligence
        </p>
        <p className="mt-4 max-w-2xl mx-auto text-gray-500">
          Not accidents. These are unpunished crimes caused by potholes, open
          wires, and negligent officials.
        </p>
      </div>
    </div>
  )
}
