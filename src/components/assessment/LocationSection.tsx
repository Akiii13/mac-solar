"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import type { AssessmentFormData } from "@/lib/types";

interface Props {
  data: AssessmentFormData;
  onChange: (data: Partial<AssessmentFormData>) => void;
}

// Dynamically loaded map to avoid SSR issues with Leaflet
function MapComponent({
  lat,
  lng,
  onPick,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number, address: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current = marker;
      mapInstanceRef.current = map;

      const reverseGeocode = async (la: number, lo: number) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${lo}`,
            { headers: { "Accept-Language": "en" } }
          );
          const d = await res.json();
          return d.display_name as string;
        } catch {
          return `${la.toFixed(5)}, ${lo.toFixed(5)}`;
        }
      };

      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        const addr = await reverseGeocode(pos.lat, pos.lng);
        onPick(pos.lat, pos.lng, addr);
      });

      map.on("click", async (e) => {
        marker.setLatLng(e.latlng);
        const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        onPick(e.latlng.lat, e.latlng.lng, addr);
      });
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapRef} className="w-full h-64 rounded-xl z-0" />;
}

export default function LocationSection({ data, onChange }: Props) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Default: Cebu City
  const defaultLat = data.location_lat ?? 10.3157;
  const defaultLng = data.location_lng ?? 123.8854;

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "en" } }
          );
          const d = await res.json();
          onChange({
            location_lat: latitude,
            location_lng: longitude,
            location_address: d.display_name,
          });
          setMapReady(false);
          setTimeout(() => setMapReady(true), 10);
        } catch {
          onChange({
            location_lat: latitude,
            location_lng: longitude,
            location_address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          });
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setGeoError("Could not get your location. Try clicking on the map.");
      },
      { timeout: 8000 }
    );
  };

  const handleMapPick = (lat: number, lng: number, address: string) => {
    onChange({ location_lat: lat, location_lng: lng, location_address: address });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-navy-800 mb-2">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-navy-800/50" />
              Address
            </span>
          </label>
          <input
            type="text"
            placeholder="Enter your address or pin on map"
            value={data.location_address}
            onChange={(e) =>
              onChange({ location_address: e.target.value })
            }
            className="input-field"
          />
        </div>
        <div className="sm:self-end">
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geoLoading}
            className="btn-secondary h-[46px] whitespace-nowrap w-full sm:w-auto"
          >
            {geoLoading ? (
              <span className="w-4 h-4 border-2 border-navy-800/30 border-t-navy-800 rounded-full animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            Use My Location
          </button>
        </div>
      </div>

      {geoError && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {geoError}
        </div>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-navy-800/10 shadow-sm">
        <div className="bg-navy-800/5 px-3 py-2 flex items-center gap-2 border-b border-navy-800/8">
          <MapPin className="w-3.5 h-3.5 text-navy-800/40" />
          <span className="text-xs text-navy-800/50 font-medium">
            Click or drag the pin to set your location
          </span>
        </div>
        <MapComponent
          key={`${defaultLat}-${defaultLng}`}
          lat={defaultLat}
          lng={defaultLng}
          onPick={handleMapPick}
        />
      </div>

      {data.location_lat && (
        <p className="text-xs text-navy-800/40 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          {data.location_lat.toFixed(5)}, {data.location_lng?.toFixed(5)}
        </p>
      )}
    </div>
  );
}
