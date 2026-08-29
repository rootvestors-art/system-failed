import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import type { NegligenceType } from '../types/incident.ts'
import { negligenceLabel } from '../utils/formatters.ts'
import type { SortOption } from '../hooks/useFilterParams.ts'

interface FilterValues {
  q: string
  state: string
  city: string
  type: string
  status: string
  severity?: string
  sort: SortOption
}

interface SearchAndFiltersProps {
  values: FilterValues
  onSet: (key: string, value: string) => void
  onClear: () => void
  isFiltered: boolean
  placeholder?: string
  stateOptions: string[]
  cityOptions: string[]
  typeOptions: NegligenceType[]
  statusOptions: string[]
  /** Only passed for hazards page */
  severityOptions?: string[]
}

const selectCls =
  'bg-raised-2 border border-line text-ink-muted text-xs rounded px-3 py-2 focus:outline-none focus:border-gray-500 cursor-pointer'

export default function SearchAndFilters({
  values,
  onSet,
  onClear,
  isFiltered,
  placeholder = 'Search…',
  stateOptions,
  cityOptions,
  typeOptions,
  statusOptions,
  severityOptions,
}: SearchAndFiltersProps) {
  // Keep a local copy of q so typing feels instant; the hook debounces URL writes
  const [localQ, setLocalQ] = useState(values.q)

  // Sync local state if URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setLocalQ(values.q)
  }, [values.q])

  function handleQChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalQ(e.target.value)
    onSet('q', e.target.value)
  }

  function clearQ() {
    setLocalQ('')
    onSet('q', '')
  }

  return (
    <div className="flex flex-wrap gap-2 mb-8 items-center">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={localQ}
          onChange={handleQChange}
          className="w-full bg-raised-2 border border-line text-ink-muted text-xs rounded pl-8 pr-7 py-2 focus:outline-none focus:border-gray-500"
        />
        {localQ && (
          <button
            onClick={clearQ}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* State */}
      <select
        value={values.state}
        onChange={(e) => onSet('state', e.target.value)}
        className={selectCls}
      >
        <option value="">All States</option>
        {stateOptions.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* City — disabled until a state is selected */}
      <select
        value={values.city}
        onChange={(e) => onSet('city', e.target.value)}
        disabled={!values.state}
        className={`${selectCls} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <option value="">All Cities</option>
        {cityOptions.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Type */}
      <select
        value={values.type}
        onChange={(e) => onSet('type', e.target.value)}
        className={selectCls}
      >
        <option value="">All Types</option>
        {typeOptions.map((t) => (
          <option key={t} value={t}>{negligenceLabel(t)}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={values.status}
        onChange={(e) => onSet('status', e.target.value)}
        className={selectCls}
      >
        <option value="">All Statuses</option>
        {statusOptions.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>

      {/* Severity — hazards only */}
      {severityOptions && (
        <select
          value={values.severity ?? ''}
          onChange={(e) => onSet('severity', e.target.value)}
          className={selectCls}
        >
          <option value="">All Severities</option>
          {severityOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      {/* Sort */}
      <select
        value={values.sort}
        onChange={(e) => onSet('sort', e.target.value)}
        className={selectCls}
      >
        <option value="newest">Newest</option>
        <option value="upvoted">Most Upvoted</option>
      </select>

      {/* Clear all — only visible when at least one filter is active */}
      {isFiltered && (
        <button
          onClick={onClear}
          className="text-xs font-bold uppercase tracking-wide text-ink-muted hover:text-ink transition px-3 py-2 border border-line rounded hover:border-gray-500"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
