import { useEffect, useRef } from 'react'
import { X, Copy, Link, Mail, Share2 } from 'lucide-react'
import type { ShareLinks } from '../utils/share.ts'
import { copyToClipboard, nativeShare } from '../utils/share.ts'
import { showToast } from '../hooks/useToast.ts'

interface ShareSheetProps {
  title: string
  caption: string
  shareUrl: string
  links: ShareLinks
  onClose: () => void
}

const WHATSAPP_GREEN = '#25D366'
const TELEGRAM_BLUE = '#229ED9'

export default function ShareSheet({
  title,
  caption,
  shareUrl,
  links,
  onClose,
}: ShareSheetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  async function handleNative() {
    const shared = await nativeShare(title, caption, shareUrl)
    if (!shared) {
      // Shouldn't happen since we check canNativeShare, but be safe
      showToast('Could not open share dialog', 'error')
    }
  }

  async function handleCopyLink() {
    const ok = await copyToClipboard(shareUrl)
    showToast(ok ? 'Link copied!' : 'Failed to copy', ok ? 'success' : 'error')
    onClose()
  }

  async function handleCopyCaption() {
    const ok = await copyToClipboard(caption)
    showToast(ok ? 'Caption + link copied!' : 'Failed to copy', ok ? 'success' : 'error')
    onClose()
  }

  const platformBtnBase =
    'flex items-center justify-center gap-2 w-full py-3 font-bold text-sm uppercase tracking-wide transition rounded'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-raised-2/60 z-[9990] backdrop-blur-sm" />

      {/* Sheet */}
      <div className="fixed inset-0 z-[9991] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
        <div
          ref={ref}
          className="w-full max-w-md bg-raised border border-line rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div className="flex items-center gap-2">
              <Share2 size={16} className="text-blood" />
              <h3 className="font-header font-bold uppercase tracking-wide text-ink text-sm">
                Share This Case
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-ink-faint hover:text-ink transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Caption preview */}
            <div>
              <p className="text-xs text-ink-faint uppercase font-bold tracking-widest mb-2">
                What will be shared
              </p>
              <pre className="bg-surface border border-line rounded p-3 text-xs text-ink-muted whitespace-pre-wrap font-mono leading-relaxed max-h-32 overflow-y-auto">
                {caption}
              </pre>
            </div>

            {/* Native share — primary CTA on mobile */}
            {canNativeShare && (
              <button
                onClick={handleNative}
                className="flex items-center justify-center gap-2 w-full py-3 bg-blood hover:bg-red-700 text-white font-header font-bold uppercase tracking-wide transition rounded text-sm"
              >
                <Share2 size={16} />
                Share via…
              </button>
            )}

            {/* Platform buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`${platformBtnBase} text-ink`}
                style={{ backgroundColor: WHATSAPP_GREEN }}
              >
                {/* WhatsApp logo inline SVG */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>

              <a
                href={links.telegram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`${platformBtnBase} text-ink`}
                style={{ backgroundColor: TELEGRAM_BLUE }}
              >
                {/* Telegram logo inline SVG */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram
              </a>

              <a
                href={links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`${platformBtnBase} bg-raised-2 border border-line text-white hover:border-ink-faint`}
              >
                {/* X (Twitter) logo */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Post on X
              </a>

              <a
                href={links.email}
                onClick={onClose}
                className={`${platformBtnBase} bg-raised-2 border border-line text-ink hover:bg-raised-2`}
              >
                <Mail size={14} />
                Email
              </a>
            </div>

            {/* Copy buttons */}
            <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 py-2.5 bg-raised-2 border border-line hover:border-ink-faint text-ink-muted hover:text-ink font-bold text-xs uppercase tracking-wide transition rounded"
              >
                <Link size={13} />
                Copy Link
              </button>
              <button
                onClick={handleCopyCaption}
                className="flex items-center justify-center gap-2 py-2.5 bg-raised-2 border border-line hover:border-ink-faint text-ink-muted hover:text-ink font-bold text-xs uppercase tracking-wide transition rounded"
              >
                <Copy size={13} />
                Copy Caption
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
