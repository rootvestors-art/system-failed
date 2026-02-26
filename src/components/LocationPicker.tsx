import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { MapPin, Link as LinkIcon, Map, Loader2 } from 'lucide-react'
import type { LatLngTuple } from 'leaflet'
import { parseGoogleMapsUrl, reverseGeocode, isValidIndiaCoordinates } from '../utils/location.ts'
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

type PickerMode = 'address' | 'link' | 'map'

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

export default function LocationPicker({
  address,
  city,
  state,
  coordinates,
  onLocationChange,
}: LocationPickerProps) {
  const [mode, setMode] = useState<PickerMode>('address')
  const [googleMapsLink, setGoogleMapsLink] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState<LatLngTuple | null>(
    coordinates && coordinates.lat !== 0 && coordinates.lng !== 0
      ? [coordinates.lat, coordinates.lng]
      : [28.6139, 77.2090] // Default to Delhi
  )
  const [error, setError] = useState<string | null>(null)

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
      setError('Please enter a Google Maps link')
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
          setError('Short URLs (maps.app.goo.gl) need to be expanded. Please open the link in your browser, copy the full URL from the address bar, and paste it here. Alternatively, use the "Pick on Map" option.')
        } else {
          setError('Could not extract coordinates from the link. Please check the URL format or use the "Pick on Map" option.')
        }
        setIsProcessing(false)
        return
      }

      if (!isValidIndiaCoordinates(coords.lat, coords.lng)) {
        setError('Coordinates are outside India. Please use a location within India.')
        setIsProcessing(false)
        return
      }

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

  function handleAddressChange(field: 'address' | 'city' | 'state', value: string) {
    onLocationChange({
      address: field === 'address' ? value : address,
      city: field === 'city' ? value : city,
      state: field === 'state' ? value : state,
      coordinates: coordinates, // Keep existing coordinates
    })
  }

  return (
    <div className="space-y-4">
      {/* Mode selector tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        <button
          type="button"
          onClick={() => setMode('address')}
          className={`px-4 py-2 text-sm font-bold uppercase transition ${
            mode === 'address'
              ? 'border-b-2 border-blood text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <MapPin size={16} /> Enter Address
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode('link')}
          className={`px-4 py-2 text-sm font-bold uppercase transition ${
            mode === 'link'
              ? 'border-b-2 border-blood text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <LinkIcon size={16} /> Google Maps Link
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode('map')}
          className={`px-4 py-2 text-sm font-bold uppercase transition ${
            mode === 'map'
              ? 'border-b-2 border-blood text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Map size={16} /> Pick on Map
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Address Input Mode */}
      {mode === 'address' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Address</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Street address or landmark"
              value={address}
              onChange={(e) => handleAddressChange('address', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>City *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="City"
                value={city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>State *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="State"
                value={state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
              />
            </div>
          </div>
          {coordinates && coordinates.lat !== 0 && coordinates.lng !== 0 && (
            <div className="text-xs text-gray-500">
              📍 Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </div>
          )}
        </div>
      )}

      {/* Google Maps Link Mode */}
      {mode === 'link' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Paste Google Maps Link</label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://www.google.com/maps/@28.6139,77.2090,15z or https://maps.google.com/?q=28.6139,77.2090"
              value={googleMapsLink}
              onChange={(e) => {
                setGoogleMapsLink(e.target.value)
                setError(null)
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste any Google Maps link with coordinates. The address will be automatically filled.
            </p>
            <p className="text-xs text-yellow-600 mt-2 bg-yellow-900/20 border border-yellow-800/50 p-2 rounded">
              <strong>Note:</strong> Short URLs (maps.app.goo.gl) may not work. If you have a short link, open it in your browser first, then copy the full URL from the address bar. Or use the "Pick on Map" option instead.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGoogleMapsLinkSubmit}
            disabled={isProcessing || !googleMapsLink.trim()}
            className="w-full bg-blood hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 font-bold uppercase transition flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                <MapPin size={16} /> Extract Location
              </>
            )}
          </button>
          {coordinates && coordinates.lat !== 0 && coordinates.lng !== 0 && (
            <div className="text-xs text-gray-500">
              📍 Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </div>
          )}
        </div>
      )}

      {/* Map Picker Mode */}
      {mode === 'map' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Click on the map to set location</label>
            <div className="border border-gray-700 rounded overflow-hidden" style={{ height: '400px' }}>
              <MapContainer
                center={mapCoordinates || [28.6139, 77.2090]}
                zoom={13}
                className="w-full h-full"
                style={{ background: '#1b1b1b' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />
                {mapCoordinates && (
                  <Marker position={mapCoordinates} />
                )}
              </MapContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click anywhere on the map to set the location. The address will be automatically filled.
            </p>
          </div>
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" /> Getting address details...
            </div>
          )}
          {coordinates && coordinates.lat !== 0 && coordinates.lng !== 0 && (
            <div className="text-xs text-gray-500">
              📍 Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </div>
          )}
        </div>
      )}

      {/* Display current location info */}
      {(mode === 'address' || mode === 'link' || mode === 'map') && (
        <div className="bg-gray-900/50 border border-gray-800 rounded p-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-gray-500 text-xs uppercase">Address</span>
              <p className="text-white">{address || 'Not set'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs uppercase">City</span>
              <p className="text-white">{city || 'Not set'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs uppercase">State</span>
              <p className="text-white">{state || 'Not set'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
