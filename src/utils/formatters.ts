export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const diff = now - new Date(dateString).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateString)
}

export function formatLocation(city: string, state: string): string {
  return `${city}, ${state}`
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-IN', { minimumIntegerDigits: 2 })
}

export function negligenceLabel(type: string): string {
  return type.replace(/_/g, ' ')
}

export function buildSearchQuery(
  victimName: string,
  city: string,
  negligenceType: string,
): string {
  return `${victimName} ${city} ${negligenceLabel(negligenceType)} death`
}

export function googleSearchUrl(
  victimName: string,
  city: string,
  negligenceType: string,
): string {
  const q = buildSearchQuery(victimName, city, negligenceType)
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

export function twitterSearchUrl(
  victimName: string,
  city: string,
  negligenceType: string,
): string {
  const q = buildSearchQuery(victimName, city, negligenceType)
  return `https://twitter.com/search?q=${encodeURIComponent(q)}&f=live`
}

export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
