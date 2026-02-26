/**
 * Expand short Google Maps URLs by following redirects
 * Handles maps.app.goo.gl and goo.gl/maps URLs
 */
async function expandShortUrl(shortUrl: string): Promise<string | null> {
  try {
    // Ensure URL has protocol
    const urlWithProtocol = shortUrl.startsWith('http') ? shortUrl : `https://${shortUrl}`
    
    // Try to fetch with redirect following
    // The browser will automatically follow redirects and response.url will contain the final URL
    try {
      const response = await fetch(urlWithProtocol, {
        method: 'HEAD',
        redirect: 'follow',
        mode: 'cors',
      })
      
      const finalUrl = response.url
      // Check if we got redirected to a Google Maps URL
      if (finalUrl !== urlWithProtocol && finalUrl.includes('google.com/maps')) {
        return finalUrl
      }
    } catch {
      // CORS might block HEAD request, try GET
    }
    
    // If HEAD fails or doesn't redirect properly, try GET
    try {
      const getResponse = await fetch(urlWithProtocol, {
        method: 'GET',
        redirect: 'follow',
        mode: 'cors',
      })
      const getFinalUrl = getResponse.url
      if (getFinalUrl !== urlWithProtocol && getFinalUrl.includes('google.com/maps')) {
        return getFinalUrl
      }
    } catch {
      // CORS or network error - can't expand client-side
    }
    
    // Last resort: Try using a public URL expander API (if available)
    // Note: Most free APIs have rate limits, so this is a fallback
    try {
      // Using a CORS proxy approach - try to get the final URL via a proxy service
      // Example: https://api.allorigins.win/raw?url=...
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlWithProtocol)}`
      const proxyResponse = await fetch(proxyUrl)
      const proxyData = await proxyResponse.json()
      
      // The proxy might return HTML, but we can try to extract redirect info
      // For now, if the direct fetch fails, we'll return null and show helpful message
    } catch {
      // Proxy also failed
    }
    
    return null
  } catch (error) {
    // All methods failed - return null so the UI can show a helpful message
    return null
  }
}

/**
 * Parse Google Maps URL to extract coordinates
 * Supports various Google Maps URL formats:
 * - https://www.google.com/maps?q=lat,lng
 * - https://www.google.com/maps/@lat,lng,zoom
 * - https://maps.google.com/?q=lat,lng
 * - https://goo.gl/maps/...
 * - https://maps.app.goo.gl/...
 */
export async function parseGoogleMapsUrl(url: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Clean the URL
    let cleanUrl = url.trim()
    
    // Check if it's a short URL that needs expansion
    const isShortUrl = /^(https?:\/\/)?(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(cleanUrl)
    
    if (isShortUrl) {
      // Try to expand the short URL
      const expandedUrl = await expandShortUrl(cleanUrl)
      if (expandedUrl) {
        cleanUrl = expandedUrl
      } else {
        // If expansion fails, return null - the UI will handle this with a helpful message
        // Short URLs need to be expanded server-side or via a proxy due to CORS restrictions
        return null
      }
    }
    
    // Pattern 1: @lat,lng,zoom (e.g., https://www.google.com/maps/@28.6139,77.2090,15z)
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/i
    const atMatch = cleanUrl.match(atPattern)
    if (atMatch) {
      return {
        lat: parseFloat(atMatch[1]),
        lng: parseFloat(atMatch[2]),
      }
    }
    
    // Pattern 2: q=lat,lng (e.g., https://www.google.com/maps?q=28.6139,77.2090)
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/i
    const qMatch = cleanUrl.match(qPattern)
    if (qMatch) {
      return {
        lat: parseFloat(qMatch[1]),
        lng: parseFloat(qMatch[2]),
      }
    }
    
    // Pattern 3: ll=lat,lng (e.g., https://www.google.com/maps?ll=28.6139,77.2090)
    const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/i
    const llMatch = cleanUrl.match(llPattern)
    if (llMatch) {
      return {
        lat: parseFloat(llMatch[1]),
        lng: parseFloat(llMatch[2]),
      }
    }
    
    // Pattern 4: /place/... with coordinates in URL
    const placePattern = /\/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/i
    const placeMatch = cleanUrl.match(placePattern)
    if (placeMatch) {
      return {
        lat: parseFloat(placeMatch[1]),
        lng: parseFloat(placeMatch[2]),
      }
    }
    
    // Pattern 5: Direct coordinates in URL path
    const directPattern = /(-?\d+\.?\d*),(-?\d+\.?\d*)/i
    const directMatch = cleanUrl.match(directPattern)
    if (directMatch) {
      const lat = parseFloat(directMatch[1])
      const lng = parseFloat(directMatch[2])
      // Validate coordinates (rough bounds for India)
      if (lat >= 6 && lat <= 37 && lng >= 68 && lng <= 98) {
        return { lat, lng }
      }
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Reverse geocode coordinates to get address details
 * Uses Nominatim API (OpenStreetMap)
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ address: string; city: string; state: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&countrycodes=in`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SystemFailed/1.0' },
    })
    const data = await res.json()
    
    if (data && data.address) {
      const addr = data.address
      return {
        address: data.display_name?.split(',')[0] || addr.road || addr.house_number || '',
        city: addr.city || addr.town || addr.village || addr.district || '',
        state: addr.state || '',
      }
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Validate if coordinates are within India bounds (rough check)
 */
export function isValidIndiaCoordinates(lat: number, lng: number): boolean {
  return lat >= 6 && lat <= 37 && lng >= 68 && lng <= 98
}
