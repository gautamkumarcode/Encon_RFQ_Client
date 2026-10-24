'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// react-leaflet/leaflet ship marker icon images that break under bundlers; point
// them at the CDN so the default pin renders.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface OfficeMapPickerProps {
  lat: number | null;
  lng: number | null;
  radiusMeters: number;
  onChange: (lat: number, lng: number) => void;
  /** Increment to make the map fly to the current lat/lng (after a search / GPS fix). */
  focusToken?: number;
}

const DEFAULT_CENTER: [number, number] = [22.5726, 88.3639]; // Kolkata

/** Pans/zooms the map to the chosen point whenever focusToken changes. */
function FlyTo({ lat, lng, token }: { lat: number | null; lng: number | null; token?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!token) return; // 0/undefined = initial mount, already centered via props
    if (typeof lat === 'number' && typeof lng === 'number') {
      map.setView([lat, lng], 16);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  return null;
}

function ClickToPlace({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Interactive office-location picker: tap the map to drop the pin, drag the pin to
 * fine-tune, and the circle shows the live geofence radius used to gate clock-in.
 */
export default function OfficeMapPicker({ lat, lng, radiusMeters, onChange, focusToken }: OfficeMapPickerProps) {
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';
  const center: [number, number] = hasCoords ? [lat as number, lng as number] : DEFAULT_CENTER;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700">
      <MapContainer
        center={center}
        zoom={hasCoords ? 15 : 5}
        style={{ height: '320px', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FlyTo lat={lat} lng={lng} token={focusToken} />
        <ClickToPlace onChange={onChange} />
        {hasCoords && (
          <>
            <Marker
              position={[lat as number, lng as number]}
              draggable
              eventHandlers={{
                dragend: (e: any) => {
                  const p = e.target.getLatLng();
                  onChange(p.lat, p.lng);
                },
              }}
            />
            <Circle
              center={[lat as number, lng as number]}
              radius={radiusMeters || 0}
              pathOptions={{ color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 0.12 }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
