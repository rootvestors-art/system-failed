import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STRINGS, type Lang } from './strings.ts'

export type { Lang }

const STORAGE_KEY = 'civicfix_lang'

/** Translate a key, substituting `{name}` placeholders. */
export function translate(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const entry = STRINGS[key]
  if (!entry) {
    // A missing key is a bug, not something to hide from the citizen with a
    // blank space — surface the key so it is obvious in testing.
    if (import.meta.env.DEV) console.warn(`[i18n] missing string: ${key}`)
    return key
  }
  let out = entry[lang] ?? entry.en
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value))
    }
  }
  return out
}

interface LangContextValue {
  lang: Lang
  setLang: (next: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue | null>(null)

function readStored(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'hi' || stored === 'en') return stored
  } catch {
    /* private mode */
  }
  return 'en'
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored)

  // `lang` on <html> drives the Devanagari font rule in index.css. Without it,
  // Hindi text falls back to Inter, which has no Devanagari coverage.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode — the choice just won't persist */
    }
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) {
    // Allows components to be rendered in isolation (tests, storybook) without
    // the provider, rather than crashing.
    return { lang: 'en', setLang: () => {}, t: (k, v) => translate('en', k, v) }
  }
  return ctx
}

/** Shorthand for components that only need the translator. */
export function useT() {
  return useLang().t
}
