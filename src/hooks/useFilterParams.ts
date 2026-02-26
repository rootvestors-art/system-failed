import { useSearchParams } from 'react-router-dom'
import { useCallback, useRef } from 'react'

export type SortOption = 'newest' | 'upvoted'

export interface IncidentFilters {
  q: string
  state: string
  city: string
  type: string
  status: string
  sort: SortOption
}

export interface HazardFilters {
  q: string
  state: string
  city: string
  type: string
  status: string
  severity: string
  sort: SortOption
}

/** Any non-sort, non-empty param counts as "filtered". */
function hasActiveFilters(params: URLSearchParams, keys: string[]): boolean {
  return keys.some((k) => k !== 'sort' && !!params.get(k))
}

function safeSort(raw: string | null): SortOption {
  return raw === 'upvoted' ? 'upvoted' : 'newest'
}

export function useIncidentFilters() {
  const [params, setParams] = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const values: IncidentFilters = {
    q: params.get('q') ?? '',
    state: params.get('state') ?? '',
    city: params.get('city') ?? '',
    type: params.get('type') ?? '',
    status: params.get('status') ?? '',
    sort: safeSort(params.get('sort')),
  }

  const isFiltered = hasActiveFilters(params, ['q', 'state', 'city', 'type', 'status'])

  const set = useCallback(
    (key: string, value: string) => {
      const doSet = () =>
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            // Remove the param when resetting to default (empty string or default sort)
            if (!value || (key === 'sort' && value === 'newest')) {
              next.delete(key)
            } else {
              next.set(key, value)
            }
            // Changing state always resets the dependent city filter
            if (key === 'state') next.delete('city')
            return next
          },
          { replace: true },
        )

      if (key === 'q') {
        // Debounce URL writes for the search input to avoid per-keystroke churn
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(doSet, 200)
      } else {
        doSet()
      }
    },
    [setParams],
  )

  const clear = useCallback(() => setParams({}, { replace: true }), [setParams])

  return { values, isFiltered, set, clear }
}

export function useHazardFilters() {
  const [params, setParams] = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const values: HazardFilters = {
    q: params.get('q') ?? '',
    state: params.get('state') ?? '',
    city: params.get('city') ?? '',
    type: params.get('type') ?? '',
    status: params.get('status') ?? '',
    severity: params.get('severity') ?? '',
    sort: safeSort(params.get('sort')),
  }

  const isFiltered = hasActiveFilters(params, [
    'q', 'state', 'city', 'type', 'status', 'severity',
  ])

  const set = useCallback(
    (key: string, value: string) => {
      const doSet = () =>
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            if (!value || (key === 'sort' && value === 'newest')) {
              next.delete(key)
            } else {
              next.set(key, value)
            }
            if (key === 'state') next.delete('city')
            return next
          },
          { replace: true },
        )

      if (key === 'q') {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(doSet, 200)
      } else {
        doSet()
      }
    },
    [setParams],
  )

  const clear = useCallback(() => setParams({}, { replace: true }), [setParams])

  return { values, isFiltered, set, clear }
}
