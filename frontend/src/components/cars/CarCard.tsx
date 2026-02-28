import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Car, CarWithDistance } from "@/types/car.types";
import { MapPin } from "lucide-react";

interface CarCardProps {
  car: Car | CarWithDistance;
  onRent?: (car: Car | CarWithDistance) => void;
}

function hasDistance(car: Car | CarWithDistance): car is CarWithDistance {
  return "distance_meters" in car;
}

export function CarCard({ car, onRent }: CarCardProps) {
  const distanceKm = hasDistance(car)
    ? (car.distance_meters / 1000).toFixed(1)
    : null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">
            {car.brand} {car.model}
          </CardTitle>
          <Badge variant={car.isAvailable ? "default" : "secondary"}>
            {car.isAvailable ? "Available" : "Rented"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{car.year}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-1 pb-3">
        <p className="font-semibold">
          ${car.pricePerDay.toFixed(2)}{" "}
          <span className="text-muted-foreground text-sm font-normal">
            / day
          </span>
        </p>
        {distanceKm !== null && (
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" />
            {distanceKm} km away
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={!car.isAvailable}
          onClick={() => onRent?.(car)}
        >
          {car.isAvailable ? "Rent this car" : "Unavailable"}
        </Button>
      </CardFooter>
    </Card>
  );
}
