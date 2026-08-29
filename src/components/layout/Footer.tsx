import { useT } from '../../i18n/index.tsx'

/**
 * The footer is always dark, on both the dark pages and the light citizen
 * journey, so it deliberately uses fixed neutral greys rather than the `--ink`
 * tokens. Those tokens flip to near-black under `.theme-light`, which put dark
 * grey text on this near-black bar — the one contrast failure left on the
 * journey after the light-theme pass.
 */
export default function Footer() {
  const t = useT()
  return (
    <footer className="bg-void border-t border-neutral-800 py-10 mt-10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-neutral-400 font-mono text-sm">
          CivicFix — {t('nav.tagline.report')} · {t('nav.tagline.route')} ·{' '}
          {t('nav.tagline.resolve')} &copy; {new Date().getFullYear()}
        </p>
        <p className="text-neutral-400 text-xs mt-2 max-w-xl mx-auto">
          {t('footer.disclaimer')}
        </p>
      </div>
    </footer>
  )
}
