import { carsApi } from "@/api/cars.api";
import { rentalsApi } from "@/api/rentals.api";
import { CarCard } from "@/components/cars/CarCard";
import { CarMap } from "@/components/cars/CarMap";
import { RadiusFilter, type RadiusKm } from "@/components/cars/RadiusFilter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { Car, CarWithDistance } from "@/types/car.types";
import { Map, ZapOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export function CarsPage() {
  const [cars, setCars] = useState<Array<Car | CarWithDistance>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState<RadiusKm>(10);
  const [showMap, setShowMap] = useState(false);

  // Rent dialog state
  const [rentTarget, setRentTarget] = useState<Car | CarWithDistance | null>(
    null,
  );
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(tomorrowStr);
  const [rentError, setRentError] = useState<string | null>(null);
  const [isRenting, setIsRenting] = useState(false);

  const {
    latitude,
    longitude,
    isLoading: geoLoading,
    error: geoError,
    fetchLocation,
  } = useGeolocation();

  const loadCars = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (latitude != null && longitude != null) {
        console.debug("[CarsPage] Loading nearby cars", {
          latitude,
          longitude,
          radius,
        });
        const data = await carsApi.getNearbyCars(latitude, longitude, radius);
        setCars(data);
      } else {
        console.debug("[CarsPage] Loading all available cars");
        const data = await carsApi.getAvailableCars();
        setCars(data);
      }
    } catch (err) {
      console.error("[CarsPage] Failed to load cars:", err);
      setError("Failed to load cars. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, radius]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  async function handleRent() {
    if (!rentTarget) return;
    setRentError(null);
    setIsRenting(true);
    try {
      await rentalsApi.createRental({
        carId: rentTarget.id,
        startDate,
        endDate,
      });
      console.debug("[CarsPage] Rental created for car:", rentTarget.id);
      setRentTarget(null);
      await loadCars();
    } catch (err: unknown) {
      console.error("[CarsPage] Rental failed:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create rental. Please try again.";
      setRentError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsRenting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Available Cars</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLocation}
            disabled={geoLoading}
          >
            {geoLoading
              ? "Locating…"
              : latitude
                ? "Update location"
                : "Use my location"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap((v) => !v)}
            aria-label={showMap ? "Hide map" : "Show map"}
          >
            {showMap ? (
              <ZapOff className="h-4 w-4" />
            ) : (
              <Map className="h-4 w-4" />
            )}
            <span className="ml-1">{showMap ? "Hide map" : "Show map"}</span>
          </Button>
        </div>
      </div>

      {/* Geo error */}
      {geoError && (
        <Alert variant="destructive">
          <AlertDescription>Location error: {geoError}</AlertDescription>
        </Alert>
      )}

      {/* Radius filter — only visible when location is known */}
      {latitude != null && <RadiusFilter value={radius} onChange={setRadius} />}

      {/* Load error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Map */}
      {showMap && (
        <CarMap
          cars={cars}
          userLat={latitude}
          userLng={longitude}
          onRent={setRentTarget}
        />
      )}

      {/* Car grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-48 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : cars.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No cars found
          {latitude != null ? ` within ${radius} km of your location` : ""}.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} onRent={setRentTarget} />
          ))}
        </div>
      )}

      {/* Rent dialog */}
      <Dialog
        open={rentTarget !== null}
        onOpenChange={(open) => !open && setRentTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Rent{" "}
              {rentTarget
                ? `${rentTarget.brand} ${rentTarget.model} (${rentTarget.year})`
                : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="start-date">Start date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  min={todayStr()}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end-date">End date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {rentTarget && startDate && endDate && endDate >= startDate && (
              <p className="text-muted-foreground text-sm">
                Total:{" "}
                <span className="text-foreground font-medium">
                  $
                  {(
                    rentTarget.pricePerDay *
                    (Math.ceil(
                      (new Date(endDate).getTime() -
                        new Date(startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ) +
                      1)
                  ).toFixed(2)}
                </span>
              </p>
            )}

            {rentError && (
              <Alert variant="destructive">
                <AlertDescription>{rentError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRentTarget(null)}
              disabled={isRenting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRent}
              disabled={
                isRenting || !startDate || !endDate || endDate < startDate
              }
            >
              {isRenting ? "Booking…" : "Confirm booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
