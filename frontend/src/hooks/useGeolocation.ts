import { useCallback, useEffect, useState } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};

export function useGeolocation(autoFetch = false) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: false,
  });

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser.",
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    console.debug("[useGeolocation] Requesting location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.debug("[useGeolocation] Position received:", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          isLoading: false,
        });
      },
      (err) => {
        console.error("[useGeolocation] Error:", err.message);
        setState((prev) => ({
          ...prev,
          error: err.message,
          isLoading: false,
        }));
      },
      GEOLOCATION_OPTIONS,
    );
  }, []);

  useEffect(() => {
    if (autoFetch) fetchLocation();
  }, [autoFetch, fetchLocation]);

  return { ...state, fetchLocation };
}
