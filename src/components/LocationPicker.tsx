import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Loader2, Crosshair } from 'lucide-react'
import type { LatLngTuple } from 'leaflet'
import { parseGoogleMapsUrl, reverseGeocode, isValidIndiaCoordinates } from '../utils/location.ts'
import { useTileProvider } from '../hooks/useTileProvider.ts'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface LocationPickerProps {
  address: string
  city: string
  state: string
  coordinates?: { lat: number; lng: number }
  onLocationChange: (location: {
    address: string
    city: string
    state: string
    coordinates?: { lat: number; lng: number }
  }) => void
}

// Component to handle map clicks
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      if (isValidIndiaCoordinates(lat, lng)) {
        onMapClick(lat, lng)
      }
    },
  })
  return null
}


/**
 * Fly the map to a new pin. Without this the MapContainer keeps its initial
 * centre, so a location resolved from GPS or a pasted link would drop a marker
 * somewhere off-screen and the citizen would think nothing happened.
 */
function RecenterMap({ center }: { center: LatLngTuple | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, Math.max(map.getZoom(), 16), { duration: 0.6 })
  }, [center, map])
  return null
}

export default function LocationPicker({
  address,
  city,
  state,
  coordinates,
  onLocationChange,
}: LocationPickerProps) {
  const [googleMapsLink, setGoogleMapsLink] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState<LatLngTuple | null>(
    coordinates && coordinates.lat !== 0 && coordinates.lng !== 0
      ? [coordinates.lat, coordinates.lng]
      : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [approximate, setApproximate] = useState(false)
  const [locating, setLocating] = useState(false)

  // Share the app-wide provider chain so the picker never diverges from the
  // other maps — it used to hardcode CARTO, which now serves a watermark.
  const { tileConfig, eventHandlers } = useTileProvider()

  const inputClass =
    'w-full bg-[#1a1a1a] border border-gray-700 text-white px-4 py-3 focus:border-blood focus:outline-none transition'
  const labelClass =
    'block text-xs text-gray-500 uppercase font-bold tracking-widest mb-2'

  // Update map coordinates when coordinates prop changes
  useEffect(() => {
    if (coordinates && coordinates.lat !== 0 && coordinates.lng !== 0) {
      setMapCoordinates([coordinates.lat, coordinates.lng])
    }
  }, [coordinates])

  async function handleGoogleMapsLinkSubmit() {
    if (!googleMapsLink.trim()) {
      setError('Paste a Google Maps link first, or tap the map.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const coords = await parseGoogleMapsUrl(googleMapsLink)
      if (!coords) {
        // Check if it's a short URL that couldn't be expanded
        const isShortUrl = /^(https?:\/\/)?(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(googleMapsLink.trim())
        if (isShortUrl) {
          setError('We could not resolve that short link. Open it in your browser, copy the full URL from the address bar and paste that — or just tap the spot on the map.')
        } else {
          setError('No location found in that link. Check it, or tap the spot on the map instead.')
        }
        setIsProcessing(false)
        return
      }

      if (!isValidIndiaCoordinates(coords.lat, coords.lng)) {
        setError('Coordinates are outside India. Please use a location within India.')
        setIsProcessing(false)
        return
      }

      // A link that only named a place gives us a neighbourhood, not a pin, so
      // tell the citizen to check it rather than letting them assume it's exact.
      setApproximate(Boolean(coords.approximate))

      // Reverse geocode to get address details
      const addressData = await reverseGeocode(coords.lat, coords.lng)
      if (addressData) {
        onLocationChange({
          address: addressData.address || address,
          city: addressData.city || city,
          state: addressData.state || state,
          coordinates: coords,
        })
        setMapCoordinates([coords.lat, coords.lng])
        setError(null)
      } else {
        // Use coordinates even if reverse geocoding fails
        onLocationChange({
          address: address,
          city: city,
          state: state,
          coordinates: coords,
        })
        setMapCoordinates([coords.lat, coords.lng])
        setError(null)
      }
    } catch (err) {
      setError('Failed to process Google Maps link. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }


  /**
   * Ask the device where it is. This is the fastest correct path for someone
   * standing in front of the hazard, which is the common case.
   */
  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('This browser cannot share your location. Paste a Google Maps link or tap the map.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false)
        const { latitude, longitude } = pos.coords
        if (!isValidIndiaCoordinates(latitude, longitude)) {
          setError('That location looks to be outside India. Tap the map instead.')
          return
        }
        setApproximate(false)
        await handleMapClick(latitude, longitude)
      },
      () => {
        setLocating(false)
        setError(
          'We could not get your location. Allow location access, paste a Google Maps link, or tap the map.',
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  }

  async function handleMapClick(lat: number, lng: number) {
    setIsProcessing(true)
    setError(null)

    try {
      // Reverse geocode to get address details
      const addressData = await reverseGeocode(lat, lng)
      if (addressData) {
        onLocationChange({
          address: addressData.address || '',
          city: addressData.city || '',
          state: addressData.state || '',
          coordinates: { lat, lng },
        })
        setMapCoordinates([lat, lng])
        setError(null)
      } else {
        // Use coordinates even if reverse geocoding fails
        onLocationChange({
          address: address,
          city: city,
          state: state,
          coordinates: { lat, lng },
        })
        setMapCoordinates([lat, lng])
        setError(null)
      }
    } catch (err) {
      setError('Failed to get address details. Coordinates saved.')
      onLocationChange({
        address: address,
        city: city,
        state: state,
        coordinates: { lat, lng },
      })
      setMapCoordinates([lat, lng])
    } finally {
      setIsProcessing(false)
    }
  }

  const hasPin = Boolean(mapCoordinates) && Boolean(coordinates?.lat) && coordinates!.lat !== 0

  return (
    <div className="space-y-3">
      {/* Two ways in — GPS or a pasted link — with the map always visible below,
          so the citizen can see exactly which spot got picked and drag it right.
          Typing a street address by hand was removed: people do not know their
          own ward or the official road name, and a typed address cannot be
          verified. Coordinates come from the device, a link, or a map tap. */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating || isProcessing}
          className="flex-1 flex items-center justify-center gap-2 bg-blood hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 font-bold uppercase text-sm rounded transition"
        >
          {locating ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Finding you…
            </>
          ) : (
            <>
              <Crosshair size={15} /> Use my current location
            </>
          )}
        </button>
        <div className="flex-1 flex gap-2">
          <input
            type="url"
            className={`${inputClass} py-2.5 text-sm`}
            placeholder="…or paste a Google Maps link"
            value={googleMapsLink}
            onChange={(e) => {
              setGoogleMapsLink(e.target.value)
              setError(null)
            }}
          />
          <button
            type="button"
            onClick={handleGoogleMapsLinkSubmit}
            disabled={isProcessing || !googleMapsLink.trim()}
            className="shrink-0 border border-gray-600 hover:border-gray-400 disabled:opacity-40 text-gray-200 px-4 font-bold uppercase text-xs rounded transition"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : 'Go'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2.5 text-sm rounded">
          {error}
        </div>
      )}

      {approximate && (
        <p className="text-xs text-yellow-500 bg-yellow-900/20 border border-yellow-800/50 p-2 rounded">
          That link named a place rather than exact coordinates, so this pin is approximate.
          Tap the exact spot on the map below to correct it.
        </p>
      )}

      {/* The map — always on screen, not behind a tab */}
      <div>
        <div
          className="border border-gray-700 rounded overflow-hidden relative"
          style={{ height: '320px' }}
        >
          <MapContainer
            center={mapCoordinates || [22.5, 78.9]}
            zoom={mapCoordinates ? 16 : 5}
            className="w-full h-full"
            style={{ background: '#1b1b1b' }}
          >
            <TileLayer
              url={tileConfig.url}
              attribution={tileConfig.attribution}
              subdomains={tileConfig.subdomains}
              className={tileConfig.className}
              eventHandlers={eventHandlers}
            />
            <RecenterMap center={mapCoordinates} />
            <MapClickHandler onMapClick={handleMapClick} />
            {mapCoordinates && <Marker position={mapCoordinates} />}
          </MapContainer>

          {isProcessing && (
            <div
              className="absolute inset-x-0 bottom-0 bg-black/80 text-gray-200 text-xs px-3 py-2 flex items-center gap-2"
              style={{ zIndex: 1000 }}
            >
              <Loader2 size={13} className="animate-spin" /> Looking up the address…
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          {hasPin
            ? 'Not quite right? Tap the map to move the pin.'
            : 'Tap the map to drop a pin, or use one of the options above.'}
        </p>
      </div>

      {/* What we resolved — read-only, because it is derived from the pin */}
      <div className="bg-gray-900/50 border border-gray-800 rounded p-3 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-3">
            <span className="text-gray-500 text-xs uppercase tracking-widest">Location</span>
            <p className="text-white">{address || 'No pin set yet'}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-widest">City</span>
            <p className="text-white">{city || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-widest">State</span>
            <p className="text-white">{state || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-widest">Coordinates</span>
            <p className="text-gray-400 font-mono text-xs mt-1">
              {hasPin
                ? `${coordinates!.lat.toFixed(5)}, ${coordinates!.lng.toFixed(5)}`
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
