import { useEffect } from 'react'

export interface DocumentMeta {
  title: string
  description: string
  url: string
  /** Absolute URL to the OG image (1200×630). Optional. */
  ogImage?: string
}

function upsertMeta(attr: 'property' | 'name', value: string, content: string) {
  let el = document.querySelector(
    `meta[${attr}="${value}"]`,
  ) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, value)
    document.head.appendChild(el)
  }
  el.content = content
}

/**
 * Dynamically updates <title> and Open Graph / Twitter Card meta tags.
 * Works for crawlers that execute JS (Twitter/X card validator).
 * For bots that don't execute JS (WhatsApp, Telegram), the /share/* API
 * routes serve pre-rendered HTML.
 */
export function useDocumentMeta(meta: DocumentMeta | null) {
  useEffect(() => {
    if (!meta) return

    const prev = document.title
    document.title = meta.title

    // Open Graph
    upsertMeta('property', 'og:title', meta.title)
    upsertMeta('property', 'og:description', meta.description)
    upsertMeta('property', 'og:url', meta.url)
    upsertMeta('property', 'og:type', 'article')
    upsertMeta('property', 'og:site_name', 'CivicFix')

    if (meta.ogImage) {
      upsertMeta('property', 'og:image', meta.ogImage)
      upsertMeta('property', 'og:image:width', '1200')
      upsertMeta('property', 'og:image:height', '630')
      upsertMeta('property', 'og:image:type', 'image/png')
    }

    // Twitter / X Cards
    upsertMeta('name', 'twitter:card', meta.ogImage ? 'summary_large_image' : 'summary')
    upsertMeta('name', 'twitter:title', meta.title)
    upsertMeta('name', 'twitter:description', meta.description)
    if (meta.ogImage) upsertMeta('name', 'twitter:image', meta.ogImage)

    // Standard description
    upsertMeta('name', 'description', meta.description)

    return () => {
      document.title = prev
    }
  }, [meta?.title, meta?.description, meta?.url, meta?.ogImage])
}
