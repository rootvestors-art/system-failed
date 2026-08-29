/**
 * Distance between two coordinates, in metres.
 *
 * Haversine on a spherical earth. Accurate to a few metres over the short
 * distances that matter here (we care about "is this the same pothole", not
 * navigation), and needs no dependency.
 */
export function distanceMetres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Human distance. A citizen thinks in metres, not decimal degrees — and rounding
 * to the nearest 10 m produced a bare "0 m away" for anything very close, which
 * reads as a bug rather than as "the same spot".
 */
export function formatDistance(metres: number): string {
  if (metres < 15) return 'at the same spot'
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m away`
  return `${(metres / 1000).toFixed(1)} km away`
}
