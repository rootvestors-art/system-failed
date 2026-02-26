import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { MapPin, ExternalLink, Map } from 'lucide-react'
import type { IncidentLocation } from '../types/incident.ts'
import { useTileProvider } from '../hooks/useTileProvider.ts'
import 'leaflet/dist/leaflet.css'

interface LocationMapProps {
  location: IncidentLocation
  /** Controls accent colour — red for incidents, yellow for hazards */
  accentColor?: 'red' | 'yellow'
  /** ID used for the /map?selected= deep-link */
  deepLinkId?: string
}

function hasValidCoords(loc: IncidentLocation): boolean {
  return (
    loc.lat !== 0 &&
    loc.lng !== 0 &&
    isFinite(loc.lat) &&
    isFinite(loc.lng)
  )
}

export default function LocationMap({
  location,
  accentColor = 'red',
  deepLinkId,
}: LocationMapProps) {
  const isYellow = accentColor === 'yellow'
  const markerColor = isYellow ? '#eab308' : '#D90429'
  const textClass = isYellow ? 'text-yellow-500' : 'text-blood'
  const bgClass = isYellow ? 'bg-yellow-500/10' : 'bg-blood/10'
  const borderClass = isYellow ? 'border-yellow-500/40' : 'border-blood/40'

  const validCoords = hasValidCoords(location)
  const googleMapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`
  const mapViewUrl = deepLinkId ? `/map?selected=${deepLinkId}` : '/map'
  const { tileConfig, eventHandlers } = useTileProvider()

  return (
    <div className="bg-[#111] border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
        <MapPin size={14} className={textClass} />
        <h3 className="text-xs font-header font-bold text-white uppercase tracking-widest">
          Location
        </h3>
      </div>

      {/* Address */}
      <div className="px-5 py-3">
        {location.address && (
          <p className="text-gray-200 text-sm leading-snug">{location.address}</p>
        )}
        <p className="text-gray-500 text-xs mt-0.5">
          {location.city}, {location.state}
        </p>
      </div>

      {/* Map or fallback */}
      {validCoords ? (
        <div className="w-full" style={{ height: '300px' }}>
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={14}
            className="w-full h-full"
            style={{ background: '#1b1b1b' }}
            scrollWheelZoom={false}
            zoomControl
          >
            <TileLayer
              url={tileConfig.url}
              attribution={tileConfig.attribution}
              subdomains={tileConfig.subdomains}
              eventHandlers={eventHandlers}
            />
            <CircleMarker
              center={[location.lat, location.lng]}
              radius={11}
              pathOptions={{
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.85,
                weight: 2,
              }}
            />
          </MapContainer>
        </div>
      ) : (
        <div className="mx-5 mb-4 flex flex-col items-center justify-center gap-2 h-28 bg-gray-900/60 border border-gray-800 rounded text-gray-600 text-xs">
          <MapPin size={18} className="opacity-30" />
          Location coordinates unavailable
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 py-3 border-t border-gray-800 flex flex-wrap gap-2">
        <Link
          to={mapViewUrl}
          className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded transition ${bgClass} ${textClass} border ${borderClass} hover:brightness-125`}
        >
          <Map size={12} /> View on Map
        </Link>
        {validCoords && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded transition bg-gray-800 text-gray-400 border border-gray-700 hover:text-white hover:bg-gray-700"
          >
            <ExternalLink size={12} /> Google Maps
          </a>
        )}
      </div>
    </div>
  )
}
