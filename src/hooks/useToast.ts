import { useState, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Module-level singleton store — no React context required.
// Any component can call showToast(); any subscriber rerenders automatically.
// ---------------------------------------------------------------------------

export type ToastType = 'success' | 'error'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let _toasts: ToastItem[] = []
let _nextId = 0
const _listeners = new Set<(items: ToastItem[]) => void>()

function _notify() {
  const snapshot = [..._toasts]
  _listeners.forEach((l) => l(snapshot))
}

/** Call from anywhere — no hook needed. */
export function showToast(message: string, type: ToastType = 'success'): void {
  const id = _nextId++
  _toasts = [..._toasts, { id, message, type }]
  _notify()
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id)
    _notify()
  }, 3000)
}

/** React hook: subscribe to the toast list. */
export function useToasts(): ToastItem[] {
  const [items, setItems] = useState<ToastItem[]>([..._toasts])

  useEffect(() => {
    _listeners.add(setItems)
    return () => {
      _listeners.delete(setItems)
    }
  }, [])

  return items
}
