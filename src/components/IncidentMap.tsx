import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import type { Incident, Hazard } from '../types/incident.ts'
import { negligenceLabel } from '../utils/formatters.ts'
import 'leaflet/dist/leaflet.css'

interface IncidentMapProps {
  incidents: Incident[]
  hazards?: Hazard[]
  onSelectIncident?: (incident: Incident) => void
  onSelectHazard?: (hazard: Hazard) => void
}

export default function IncidentMap({
  incidents,
  hazards = [],
  onSelectIncident,
  onSelectHazard,
}: IncidentMapProps) {
  const center: [number, number] = [22.5, 78.9]

  return (
    <MapContainer
      center={center}
      zoom={5}
      className="w-full h-full"
      style={{ background: '#1b1b1b' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {incidents.map((incident) => (
        <CircleMarker
          key={`i-${incident.id}`}
          center={[incident.location.lat, incident.location.lng]}
          radius={10}
          pathOptions={{
            color: '#D90429',
            fillColor: '#D90429',
            fillOpacity: 0.7,
            weight: 2,
          }}
          className="pulse-marker"
          eventHandlers={{
            click: () => onSelectIncident?.(incident),
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold">
                {incident.title}
              </p>
              <p className="text-gray-600">
                {negligenceLabel(incident.negligence_type)}
              </p>
              <p className="text-gray-500">{incident.location.city}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {hazards.map((hazard) => (
        <CircleMarker
          key={`h-${hazard.id}`}
          center={[hazard.location.lat, hazard.location.lng]}
          radius={8}
          pathOptions={{
            color: '#a16207',
            fillColor: '#eab308',
            fillOpacity: 0.7,
            weight: 2,
          }}
          eventHandlers={{
            click: () => onSelectHazard?.(hazard),
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold">
                {negligenceLabel(hazard.negligence_type)}
              </p>
              <p className="text-gray-600">{hazard.severity}</p>
              <p className="text-gray-500">{hazard.location.city}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
