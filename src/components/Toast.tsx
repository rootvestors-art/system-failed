import { useToasts } from '../hooks/useToast.ts'

export default function Toast() {
  const toasts = useToasts()
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded font-bold text-sm shadow-2xl pointer-events-auto border ${
            toast.type === 'success'
              ? 'bg-gray-900 border-line text-ink'
              : 'bg-red-900 border-red-700 text-red-100'
          }`}
          style={{ animation: 'slideUp 0.2s ease-out' }}
        >
          <span className={toast.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
