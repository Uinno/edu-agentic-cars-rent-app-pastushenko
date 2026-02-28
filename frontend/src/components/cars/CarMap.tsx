import type { Car, CarWithDistance } from "@/types/car.types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

// Fix Leaflet's broken default icon paths when bundled with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});

const userIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="28" height="28">
        <circle cx="12" cy="12" r="10" fill="#2563eb" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>`,
    ),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

/** Re-centers the map when user coordinates change */
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface CarMapProps {
  cars: Array<Car | CarWithDistance>;
  userLat?: number | null;
  userLng?: number | null;
  onRent?: (car: Car | CarWithDistance) => void;
}

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris fallback
const DEFAULT_ZOOM = 12;

export function CarMap({ cars, userLat, userLng, onRent }: CarMapProps) {
  const center: [number, number] =
    userLat != null && userLng != null ? [userLat, userLng] : DEFAULT_CENTER;

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-lg border">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLat != null && userLng != null && (
          <>
            <RecenterMap lat={userLat} lng={userLng} />
            <Marker position={[userLat, userLng]} icon={userIcon}>
              <Popup>Your location</Popup>
            </Marker>
          </>
        )}

        {cars
          .filter((car) => car.latitude != null && car.longitude != null)
          .map((car) => (
            <Marker
              key={car.id}
              position={[car.latitude as number, car.longitude as number]}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    {car.brand} {car.model} ({car.year})
                  </p>
                  <p>${car.pricePerDay.toFixed(2)} / day</p>
                  {car.isAvailable && onRent && (
                    <button
                      className="mt-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      onClick={() => onRent(car)}
                    >
                      Rent this car
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
