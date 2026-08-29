import { useId, useState } from 'react'
import { Camera, X } from 'lucide-react'

/**
 * Photo picker that reliably opens the file dialog.
 *
 * Two things break a naive implementation:
 *
 * 1. `display: none` on the input. Chrome forwards a label click to a
 *    display-none input, but Safari does not — the button silently does nothing.
 *    The input has to stay in the render tree, so it is visually hidden with
 *    position/size/opacity instead.
 *
 * 2. `capture="environment"`. It is a mobile hint, but on some desktop browsers
 *    it makes the picker try to open a camera that isn't there and fail. Left
 *    off; `accept="image/*"` already offers camera-or-library on phones.
 *
 * The label is also explicitly bound with `htmlFor`/`id` rather than relying on
 * implicit nesting, which is the most widely supported association.
 */

const MAX_BYTES = 10 * 1024 * 1024

interface PhotoInputProps {
  value: File | null
  onChange: (file: File | null) => void
  onError?: (message: string | null) => void
  label?: string
  /** Show a thumbnail of the chosen image. */
  preview?: boolean
  className?: string
}

export default function PhotoInput({
  value,
  onChange,
  onError,
  label = 'Take or choose photo',
  preview = true,
  className = '',
}: PhotoInputProps) {
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null

    if (!file) {
      clear()
      return
    }

    if (!file.type.startsWith('image/')) {
      onError?.('That file is not an image. Please choose a photo.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_BYTES) {
      onError?.('That photo is larger than 10 MB. Please choose a smaller one.')
      e.target.value = ''
      return
    }

    onError?.(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(preview ? URL.createObjectURL(file) : null)
    onChange(file)
  }

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    onChange(null)
    onError?.(null)
  }

  return (
    <div className={className}>
      {/* Visually hidden but still rendered, so Safari honours the label click. */}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      <div className="flex items-center gap-2">
        <label
          htmlFor={inputId}
          className="flex-1 flex items-center justify-center gap-2 border border-dashed border-line rounded px-4 py-3 cursor-pointer hover:border-ink-faint active:border-gray-300 transition text-ink-muted text-sm select-none"
        >
          <Camera size={16} />
          {value ? 'Change photo' : label}
        </label>

        {value && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 border border-line text-ink-muted hover:text-ink hover:border-ink-faint rounded p-2.5 transition"
            aria-label="Remove photo"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {value && (
        <p className="text-ink-faint text-xs mt-1.5 truncate">
          {value.name} · {(value.size / 1024 / 1024).toFixed(1)} MB
        </p>
      )}

      {preview && previewUrl && (
        <img
          src={previewUrl}
          alt="Selected evidence"
          className="mt-2 w-full h-28 object-cover rounded border border-line"
        />
      )}
    </div>
  )
}
